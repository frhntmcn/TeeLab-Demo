import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { ActiveSelection, Canvas, Circle, Ellipse, FabricImage, FabricObject, Group, Line, Path, PencilBrush, Polygon, Rect, Textbox, Triangle, filters, loadSVGFromString, util } from 'fabric';
import type { DesignDocument, ItemKind, ObjectMeasurement, Side, TemplateMetadata } from '../types';
import { studioShapes, type StudioShapeId } from '../data/studioShapes';
import { qualityForPpi, validateDimensions } from '../lib/imageValidation';
import { disposeFabricCanvas } from '../lib/fabricLifecycle';
import { alignObjectCenter, createHistory, redoHistory, undoHistory, writeHistory } from '../lib/editorCommands';
import { CANVAS_HEIGHT, CANVAS_WIDTH, PX_PER_CM, constrainObject, getMeasurement, type MetaObject } from '../lib/measurements';

export interface SelectionInfo {
  id: string;
  kind: ItemKind;
  label: string;
  text?: string;
  fill?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  textAlign?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  charSpacing?: number;
  lineHeight?: number;
  cropPercent?: number;
  imageFilters?: { brightness: number; contrast: number; saturation: number; grayscale: boolean };
  textCurve?: number;
  measurement: ObjectMeasurement;
}

export interface LayerInfo { id: string; label: string; kind: ItemKind; visible: boolean; locked: boolean; }

export interface EditorHandle {
  addText: () => void;
  addShape: (shape: StudioShapeId) => void;
  toggleSymbol: (svg: string, label: string) => Promise<'added' | 'removed' | 'busy'>;
  addImage: (file: File) => Promise<{ lowQuality: boolean; message: string }>;
  updateSelected: (updates: Record<string, unknown>) => void;
  removeSelected: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  undo: () => void;
  redo: () => void;
  alignHorizontal: () => void;
  alignVertical: () => void;
  replaceDocument: (document: DesignDocument, template?: TemplateMetadata) => Promise<void>;
  exportImage: () => string;
  selectLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  moveLayer: (id: string, direction: -1 | 1) => void;
  duplicateSelected: () => Promise<void>;
  groupSelected: () => void;
  ungroupSelected: () => void;
  nudgeSelected: (dx: number, dy: number) => void;
  clearSelection: () => void;
  cropSelectedImage: (percent: number) => void;
  setImageFilter: (kind: 'brightness' | 'contrast' | 'saturation' | 'grayscale', value: number | boolean) => void;
  replaceSelectedImage: (file: File) => Promise<void>;
  setDrawingMode: (enabled: boolean, width: number, color: string) => void;
  setTextCurve: (curve: number) => void;
  moveSelectedTo: (xCm: number, yCm: number) => void;
}

interface Props {
  side: Side;
  document: DesignDocument;
  template?: TemplateMetadata;
  onChange: (document: DesignDocument, measurements: ObjectMeasurement[], preview: string, template?: TemplateMetadata) => void;
  onSelection: (selection: SelectionInfo | null) => void;
  onHistoryChange: (history: { canUndo: boolean; canRedo: boolean }) => void;
  onLayersChange?: (layers: LayerInfo[]) => void;
}

const uid = () => `obj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

async function readImageFile(file: File): Promise<{ file: File; dataUrl: string }> {
  let imageFile = file;
  if (file.type === 'image/heic' || file.type === 'image/heif' || /\.hei[cf]$/i.test(file.name)) {
    const { default: heic2any } = await import('heic2any');
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    imageFile = new File([blob], file.name.replace(/\.hei[cf]$/i, '.jpg'), { type: 'image/jpeg' });
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(imageFile);
  });
  return { file: imageFile, dataUrl };
}

function keepInside(canvas: Canvas, object: MetaObject) {
  constrainObject(object);
  canvas.requestRenderAll();
}

export const FabricEditor = forwardRef<EditorHandle, Props>(function FabricEditor({ side, document, template, onChange, onSelection, onHistoryChange, onLayersChange }, ref) {
  const elementRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const pendingSymbolsRef = useRef(new Set<string>());
  const readyRef = useRef(false);
  const restoringRef = useRef(false);
  const initialDocumentRef = useRef(document);
  const initialTemplateRef = useRef(template);
  const historyRef = useRef(createHistory(document, template));
  const callbacksRef = useRef({ onChange, onSelection, onHistoryChange, onLayersChange });
  callbacksRef.current = { onChange, onSelection, onHistoryChange, onLayersChange };

  const notifyHistory = () => callbacksRef.current.onHistoryChange({ canUndo: historyRef.current.past.length > 0, canRedo: historyRef.current.future.length > 0 });
  const snapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas || !readyRef.current || restoringRef.current) return;
    historyRef.current = writeHistory(historyRef.current, canvas.toJSON() as DesignDocument, historyRef.current.present.template);
    notifyHistory();
  };
  const notify = () => {
    const canvas = canvasRef.current;
    if (!canvas || !readyRef.current || restoringRef.current) return;
    const objects = canvas.getObjects() as MetaObject[];
    callbacksRef.current.onLayersChange?.(objects.map((object) => ({ id: object.itemId ?? '', label: object.itemLabel ?? 'Nesne', kind: object.itemKind ?? 'symbol', visible: object.visible !== false, locked: Boolean(object.itemLocked) })).reverse());
    callbacksRef.current.onChange(canvas.toJSON() as DesignDocument, objects.filter((object) => object.visible !== false).map((object) => getMeasurement(object, side)), canvas.toDataURL({ format: 'png', multiplier: 1 }), historyRef.current.present.template);
  };
  const notifyRef = useRef(notify);
  const snapshotRef = useRef(snapshot);
  notifyRef.current = notify;
  snapshotRef.current = snapshot;
  const restore = async (nextDocument: DesignDocument) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    restoringRef.current = true;
    canvas.discardActiveObject();
    callbacksRef.current.onSelection(null);
    try {
      await canvas.loadFromJSON(nextDocument);
      if (canvas.destroyed) return;
      canvas.getObjects().forEach((object) => {
        const item = object as MetaObject;
        item.itemId ??= uid();
        item.set({ selectable: !item.itemLocked && item.visible !== false, evented: !item.itemLocked && item.visible !== false });
        keepInside(canvas, item);
      });
      canvas.renderAll();
    } finally {
      restoringRef.current = false;
    }
    notify();
  };

  useLayoutEffect(() => {
    if (!elementRef.current) return;
    const canvas = new Canvas(elementRef.current, {
      width: CANVAS_WIDTH, height: CANVAS_HEIGHT, preserveObjectStacking: true, selectionColor: 'rgba(124,58,237,.1)',
    });
    canvasRef.current = canvas;

    const select = () => {
      const object = canvas.getActiveObject() as MetaObject | undefined;
      if (!object) return callbacksRef.current.onSelection(null);
      callbacksRef.current.onSelection({
        id: object.itemId ?? '', kind: object.itemKind ?? 'symbol', label: object.itemLabel ?? 'Nesne',
        text: object instanceof Textbox ? object.text : undefined, fill: typeof object.fill === 'string' ? object.fill : undefined,
        fontFamily: object instanceof Textbox ? object.fontFamily : undefined, fontSize: object instanceof Textbox ? object.fontSize : undefined,
        fontWeight: object instanceof Textbox ? object.fontWeight : undefined, textAlign: object instanceof Textbox ? object.textAlign : undefined,
        stroke: typeof object.stroke === 'string' ? object.stroke : undefined, strokeWidth: object.strokeWidth, opacity: object.opacity,
        charSpacing: object instanceof Textbox ? object.charSpacing : undefined, lineHeight: object instanceof Textbox ? object.lineHeight : undefined,
        cropPercent: object instanceof FabricImage && (object as MetaObject).sourcePixelWidth ? Math.round((object.cropX / (object as MetaObject).sourcePixelWidth!) * 100) : undefined,
        imageFilters: object instanceof FabricImage ? {
          brightness: (object.filters.find((filter) => filter instanceof filters.Brightness) as filters.Brightness | undefined)?.brightness ?? 0,
          contrast: (object.filters.find((filter) => filter instanceof filters.Contrast) as filters.Contrast | undefined)?.contrast ?? 0,
          saturation: (object.filters.find((filter) => filter instanceof filters.Saturation) as filters.Saturation | undefined)?.saturation ?? 0,
          grayscale: object.filters.some((filter) => filter instanceof filters.Grayscale),
        } : undefined,
        textCurve: object instanceof Textbox ? (object as MetaObject).textCurve ?? 0 : undefined,
        measurement: getMeasurement(object, side),
      });
    };
    const constrain = (event: { target?: FabricObject }) => { if (event.target) keepInside(canvas, event.target as MetaObject); select(); };
    canvas.on('object:moving', constrain);
    canvas.on('object:scaling', constrain);
    canvas.on('object:rotating', constrain);
    canvas.on('object:modified', () => { select(); notifyRef.current(); snapshotRef.current(); });
    canvas.on('object:added', () => notifyRef.current());
    canvas.on('object:removed', () => notifyRef.current());
    canvas.on('selection:created', select);
    canvas.on('selection:updated', select);
    canvas.on('selection:cleared', () => callbacksRef.current.onSelection(null));
    canvas.on('path:created', (event) => {
      const path = event.path as MetaObject;
      Object.assign(path, { itemId: uid(), itemKind: 'symbol', itemLabel: 'Serbest çizim', itemDetail: 'Vektörel çizgi', isVector: true });
      notifyRef.current(); snapshotRef.current();
    });

    let disposed = false;
    const loadController = new AbortController();
    canvas.loadFromJSON(initialDocumentRef.current, undefined, { signal: loadController.signal }).then(() => {
      if (disposed || canvas.destroyed) return;
      readyRef.current = true;
      canvas.getObjects().forEach((object) => {
        const item = object as MetaObject;
        item.itemId ??= uid();
        item.set({ selectable: !item.itemLocked && item.visible !== false, evented: !item.itemLocked && item.visible !== false });
        keepInside(canvas, item);
      });
      canvas.renderAll();
      historyRef.current = createHistory(canvas.toJSON() as DesignDocument, initialTemplateRef.current);
      notifyHistory();
      notifyRef.current();
    }).catch((error: unknown) => {
      if (!disposed) throw error;
    });
    return () => { disposed = true; readyRef.current = false; disposeFabricCanvas(canvas, loadController); canvasRef.current = null; };
  }, [side]);

  const addObject = (object: MetaObject) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    object.set({ left: CANVAS_WIDTH / 2, top: CANVAS_HEIGHT / 2, originX: 'center', originY: 'center', cornerColor: '#7c3aed', borderColor: '#7c3aed', cornerStyle: 'circle', transparentCorners: false });
    canvas.add(object); canvas.setActiveObject(object); keepInside(canvas, object); canvas.requestRenderAll(); snapshot();
  };

  useImperativeHandle(ref, () => ({
    addText: () => {
      const object = new Textbox('Fikrini giy.', { width: 220, fontSize: 34, fontFamily: 'Arial', fontWeight: 700, fill: '#0f172a', textAlign: 'center' }) as MetaObject;
      Object.assign(object, { itemId: uid(), itemKind: 'text', itemLabel: 'Metin', itemDetail: 'Arial / 34 px', isVector: true }); addObject(object);
    },
    toggleSymbol: async (svg, label) => {
      const canvas = canvasRef.current;
      if (!canvas || pendingSymbolsRef.current.has(label)) return 'busy';

      const existing = (canvas.getObjects() as MetaObject[]).filter((object) => object.itemKind === 'symbol' && object.itemLabel === label);
      if (existing.length) {
        const activeObject = canvas.getActiveObject();
        canvas.remove(...existing);
        if (activeObject && existing.includes(activeObject as MetaObject)) {
          canvas.discardActiveObject();
          callbacksRef.current.onSelection(null);
        }
        canvas.requestRenderAll();
        snapshot();
        return 'removed';
      }

      pendingSymbolsRef.current.add(label);
      try {
        const parsed = await loadSVGFromString(svg);
        const validObjects = parsed.objects.filter((object): object is FabricObject => object !== null);
        const group = util.groupSVGElements(validObjects, parsed.options) as Group & MetaObject;
        group.scaleToWidth(150);
        Object.assign(group, { itemId: uid(), itemKind: 'symbol', itemLabel: label, itemDetail: `${label} / SVG`, isVector: true });
        addObject(group);
        return 'added';
      } finally {
        pendingSymbolsRef.current.delete(label);
      }
    },
    addImage: async (file) => {
      const { file: imageFile, dataUrl } = await readImageFile(file);
      const image = await FabricImage.fromURL(dataUrl) as FabricImage & MetaObject;
      const sourceWidth = image.width ?? 0; const sourceHeight = image.height ?? 0; image.scaleToWidth(180);
      const dimensionIssue = validateDimensions(sourceWidth, sourceHeight);
      if (dimensionIssue) throw new Error(dimensionIssue);
      Object.assign(image, { itemId: uid(), itemKind: 'image', itemLabel: file.name, itemDetail: `${imageFile.type || 'Raster'} / ${sourceWidth}×${sourceHeight} px`, isVector: false, sourcePixelWidth: sourceWidth, sourcePixelHeight: sourceHeight, sourceMime: imageFile.type });
      const measurement = getMeasurement(image, side);
      const ppi = measurement.estimatedPpi ?? 0;
      if (qualityForPpi(ppi) === 'risk') throw new Error('low-ppi');
      addObject(image);
      const lowQuality = qualityForPpi(ppi) === 'warning';
      const message = ppi >= 300
        ? `Tahmini ${ppi} PPI — seçili baskı ölçüsü için uygun.`
        : ppi >= 200
          ? `Tahmini ${ppi} PPI — kullanılabilir, ancak daha yüksek çözünürlük önerilir.`
          : `Tahmini ${ppi} PPI — seçili fiziksel boyutta baskı kalitesi riski var.`;
      return { lowQuality, message };
    },
    updateSelected: (updates) => {
      const canvas = canvasRef.current; const object = canvas?.getActiveObject() as MetaObject | undefined;
      if (!canvas || !object) return;
      object.set(updates); if (object instanceof Textbox) (object as MetaObject).itemDetail = `${object.fontFamily} / ${object.fontSize} px`; keepInside(canvas, object); object.setCoords(); canvas.requestRenderAll();
      canvas.fire('object:modified', { target: object });
      if (object instanceof Textbox && typeof updates.fontFamily === 'string') {
        void window.document.fonts?.load(`${object.fontWeight === 700 ? 700 : 400} 16px "${updates.fontFamily}"`).then(() => {
          if (canvas.destroyed) return;
          object.initDimensions(); keepInside(canvas, object); canvas.requestRenderAll(); notify(); snapshot();
        }).catch(() => { /* the saved font still has a safe browser fallback */ });
      }
    },
    removeSelected: () => { const canvas = canvasRef.current; const object = canvas?.getActiveObject(); if (canvas && object) { canvas.remove(object); canvas.discardActiveObject(); canvas.requestRenderAll(); callbacksRef.current.onSelection(null); snapshot(); } },
    bringForward: () => { const canvas = canvasRef.current; const object = canvas?.getActiveObject(); if (canvas && object) { canvas.bringObjectForward(object); canvas.requestRenderAll(); canvas.fire('object:modified', { target: object }); } },
    sendBackward: () => { const canvas = canvasRef.current; const object = canvas?.getActiveObject(); if (canvas && object) { canvas.sendObjectBackwards(object); canvas.requestRenderAll(); canvas.fire('object:modified', { target: object }); } },
    undo: () => { const result = undoHistory(historyRef.current); historyRef.current = result.history; notifyHistory(); if (result.document) void restore(result.document); },
    redo: () => { const result = redoHistory(historyRef.current); historyRef.current = result.history; notifyHistory(); if (result.document) void restore(result.document); },
    alignHorizontal: () => {
      const canvas = canvasRef.current; const object = canvas?.getActiveObject() as MetaObject | undefined;
      if (!canvas || !object) return;
      const rect = object.getBoundingRect(); const target = alignObjectCenter(rect, 'horizontal', CANVAS_WIDTH, CANVAS_HEIGHT);
      object.set({ left: (object.left ?? 0) + target.left - rect.left }); keepInside(canvas, object); canvas.fire('object:modified', { target: object });
    },
    alignVertical: () => {
      const canvas = canvasRef.current; const object = canvas?.getActiveObject() as MetaObject | undefined;
      if (!canvas || !object) return;
      const rect = object.getBoundingRect(); const target = alignObjectCenter(rect, 'vertical', CANVAS_WIDTH, CANVAS_HEIGHT);
      object.set({ top: (object.top ?? 0) + target.top - rect.top }); keepInside(canvas, object); canvas.fire('object:modified', { target: object });
    },
    replaceDocument: async (nextDocument, nextTemplate) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const nextHistory = writeHistory(historyRef.current, nextDocument, nextTemplate);
      historyRef.current = nextHistory;
      notifyHistory();
      await restore(nextHistory.present.document);
    },
    exportImage: () => canvasRef.current?.toDataURL({ format: 'png', multiplier: 2 }) ?? '',
    selectLayer: (id) => {
      const canvas = canvasRef.current; const object = (canvas?.getObjects() as MetaObject[] | undefined)?.find((item) => item.itemId === id);
      if (!canvas || !object || object.itemLocked || object.visible === false) return;
      canvas.setActiveObject(object); canvas.requestRenderAll();
    },
    addShape: (shape) => {
      const common = { fill: '#7c3aed', stroke: '#312e81', strokeWidth: 0 };
      const starPoints = Array.from({ length: 10 }, (_, index) => {
        const angle = -Math.PI / 2 + index * Math.PI / 5;
        const radius = index % 2 ? 35 : 72;
        return { x: 75 + Math.cos(angle) * radius, y: 75 + Math.sin(angle) * radius };
      });
      const object = shape === 'rectangle' ? new Rect({ ...common, width: 150, height: 100 })
        : shape === 'rounded-rectangle' ? new Rect({ ...common, width: 150, height: 100, rx: 22, ry: 22 })
          : shape === 'circle' ? new Circle({ ...common, radius: 70 })
            : shape === 'ellipse' ? new Ellipse({ ...common, rx: 75, ry: 48 })
              : shape === 'triangle' ? new Triangle({ ...common, width: 145, height: 130 })
                : shape === 'star' ? new Polygon(starPoints, common)
                  : shape === 'diamond' ? new Polygon([{ x: 75, y: 0 }, { x: 150, y: 75 }, { x: 75, y: 150 }, { x: 0, y: 75 }], common)
                    : new Line([0, 0, 150, 0], { ...common, strokeWidth: 6 });
      const item = object as MetaObject;
      Object.assign(item, { itemId: uid(), itemKind: 'symbol', itemLabel: studioShapes.find((entry) => entry.id === shape)?.name ?? 'Şekil', itemDetail: 'Vektörel şekil', isVector: true });
      addObject(item);
    },
    toggleLayerVisibility: (id) => {
      const canvas = canvasRef.current; const object = (canvas?.getObjects() as MetaObject[] | undefined)?.find((item) => item.itemId === id);
      if (!canvas || !object) return;
      if (canvas.getActiveObject() === object) canvas.discardActiveObject();
      const visible = !object.visible;
      object.set({ visible, selectable: visible && !object.itemLocked, evented: visible && !object.itemLocked });
      canvas.requestRenderAll(); notify(); snapshot();
    },
    toggleLayerLock: (id) => {
      const canvas = canvasRef.current; const object = (canvas?.getObjects() as MetaObject[] | undefined)?.find((item) => item.itemId === id);
      if (!canvas || !object) return;
      if (canvas.getActiveObject() === object) canvas.discardActiveObject();
      object.itemLocked = !object.itemLocked;
      object.set({ selectable: !object.itemLocked && object.visible !== false, evented: !object.itemLocked && object.visible !== false });
      canvas.requestRenderAll(); notify(); snapshot();
    },
    moveLayer: (id, direction) => {
      const canvas = canvasRef.current; const objects = canvas?.getObjects() as MetaObject[] | undefined;
      const object = objects?.find((item) => item.itemId === id); if (!canvas || !objects || !object) return;
      const index = objects.indexOf(object); const target = index + direction;
      if (target < 0 || target >= objects.length) return;
      canvas.moveObjectTo(object, target); canvas.requestRenderAll(); notify(); snapshot();
    },
    duplicateSelected: async () => {
      const canvas = canvasRef.current; const object = canvas?.getActiveObject() as MetaObject | undefined;
      if (!canvas || !object || object instanceof ActiveSelection) return;
      const clone = await object.clone() as MetaObject;
      if (canvas.destroyed) return;
      clone.itemId = uid(); clone.itemLabel = `${object.itemLabel ?? 'Nesne'} kopyası`;
      clone.set({ left: (object.left ?? 0) + 16, top: (object.top ?? 0) + 16, selectable: true, evented: true });
      canvas.add(clone); canvas.setActiveObject(clone); keepInside(canvas, clone); notify(); snapshot();
    },
    groupSelected: () => {
      const canvas = canvasRef.current; const active = canvas?.getActiveObject();
      if (!canvas || !(active instanceof ActiveSelection)) return;
      const objects = active.getObjects();
      // Raster images need per-child PPI checks after group scaling; keep them independent.
      if (objects.some((item) => !(item as MetaObject).isVector)) return;
      canvas.discardActiveObject(); canvas.remove(...objects);
      const group = new Group(objects) as MetaObject;
      Object.assign(group, { itemId: uid(), itemKind: 'symbol', itemLabel: 'Nesne grubu', itemDetail: `${objects.length} nesne`, isVector: true });
      canvas.add(group); canvas.setActiveObject(group); keepInside(canvas, group); notify(); snapshot();
    },
    ungroupSelected: () => {
      const canvas = canvasRef.current; const active = canvas?.getActiveObject();
      if (!canvas || !(active instanceof Group) || active instanceof ActiveSelection) return;
      canvas.discardActiveObject(); const children = active.removeAll(); canvas.remove(active); canvas.add(...children); canvas.requestRenderAll(); notify(); snapshot();
    },
    nudgeSelected: (dx, dy) => {
      const canvas = canvasRef.current; const object = canvas?.getActiveObject() as MetaObject | undefined;
      if (!canvas || !object) return;
      object.set({ left: (object.left ?? 0) + dx, top: (object.top ?? 0) + dy }); keepInside(canvas, object); canvas.fire('object:modified', { target: object });
    },
    clearSelection: () => { canvasRef.current?.discardActiveObject(); canvasRef.current?.requestRenderAll(); },
    cropSelectedImage: (percent) => {
      const canvas = canvasRef.current; const image = canvas?.getActiveObject();
      if (!canvas || !(image instanceof FabricImage)) return;
      const item = image as FabricImage & MetaObject;
      const sourceWidth = item.sourcePixelWidth ?? item.width; const sourceHeight = item.sourcePixelHeight ?? item.height;
      const safe = Math.max(0, Math.min(40, Math.floor(percent)));
      const oldWidth = item.getScaledWidth(); const oldHeight = item.getScaledHeight();
      const cropX = Math.round(sourceWidth * safe / 100); const cropY = Math.round(sourceHeight * safe / 100);
      const width = sourceWidth - cropX * 2; const height = sourceHeight - cropY * 2;
      item.set({ cropX, cropY, width, height, scaleX: oldWidth / width, scaleY: oldHeight / height });
      keepInside(canvas, item); canvas.fire('object:modified', { target: item });
    },
    setImageFilter: (kind, value) => {
      const canvas = canvasRef.current; const image = canvas?.getActiveObject();
      if (!canvas || !(image instanceof FabricImage)) return;
      const kindClass = { brightness: filters.Brightness, contrast: filters.Contrast, saturation: filters.Saturation, grayscale: filters.Grayscale }[kind];
      image.filters = image.filters.filter((filter) => !(filter instanceof kindClass));
      if (kind === 'grayscale' && value) image.filters.push(new filters.Grayscale());
      else if (kind === 'brightness' && typeof value === 'number' && value !== 0) image.filters.push(new filters.Brightness({ brightness: value }));
      else if (kind === 'contrast' && typeof value === 'number' && value !== 0) image.filters.push(new filters.Contrast({ contrast: value }));
      else if (kind === 'saturation' && typeof value === 'number' && value !== 0) image.filters.push(new filters.Saturation({ saturation: value }));
      image.applyFilters(); canvas.requestRenderAll(); canvas.fire('object:modified', { target: image });
    },
    replaceSelectedImage: async (file) => {
      const canvas = canvasRef.current; const image = canvas?.getActiveObject();
      if (!canvas || !(image instanceof FabricImage)) return;
      const { file: imageFile, dataUrl } = await readImageFile(file);
      const replacement = await FabricImage.fromURL(dataUrl);
      const sourceWidth = replacement.width ?? 0; const sourceHeight = replacement.height ?? 0;
      const dimensionIssue = validateDimensions(sourceWidth, sourceHeight);
      if (dimensionIssue) throw new Error(dimensionIssue);
      const oldWidthCm = image.getScaledWidth() / 12; const oldHeightCm = image.getScaledHeight() / 12;
      const predictedPpi = Math.min(sourceWidth / (oldWidthCm / 2.54), sourceHeight / (oldHeightCm / 2.54));
      if (qualityForPpi(predictedPpi) === 'risk') throw new Error('low-ppi');
      if (canvas.destroyed || canvas.getActiveObject() !== image) return;
      const item = image as FabricImage & MetaObject;
      item.setElement(replacement.getElement(), { width: sourceWidth, height: sourceHeight });
      item.set({ cropX: 0, cropY: 0, scaleX: (oldWidthCm * 12) / sourceWidth, scaleY: (oldHeightCm * 12) / sourceHeight });
      item.filters = []; item.applyFilters();
      Object.assign(item, { itemLabel: file.name, itemDetail: `${imageFile.type} / ${sourceWidth}×${sourceHeight} px`, sourcePixelWidth: sourceWidth, sourcePixelHeight: sourceHeight, sourceMime: imageFile.type });
      keepInside(canvas, item); canvas.fire('object:modified', { target: item });
    },
    setDrawingMode: (enabled, width, color) => {
      const canvas = canvasRef.current; if (!canvas) return;
      canvas.isDrawingMode = enabled;
      if (enabled) {
        canvas.discardActiveObject();
        const brush = canvas.freeDrawingBrush instanceof PencilBrush ? canvas.freeDrawingBrush : new PencilBrush(canvas);
        brush.width = Math.max(1, Math.min(30, width)); brush.color = color; canvas.freeDrawingBrush = brush;
      }
      canvas.requestRenderAll();
    },
    setTextCurve: (curve) => {
      const canvas = canvasRef.current; const object = canvas?.getActiveObject();
      if (!canvas || !(object instanceof Textbox)) return;
      const safe = Math.max(-100, Math.min(100, Math.floor(curve)));
      const text = object as Textbox & MetaObject;
      text.textCurve = safe;
      text.set({ path: safe === 0 ? undefined : new Path(`M 0 100 Q 140 ${100 - safe * 1.5} 280 100`), pathStartOffset: 0 });
      text.initDimensions(); keepInside(canvas, text); canvas.fire('object:modified', { target: text });
    },
    moveSelectedTo: (xCm, yCm) => {
      const canvas = canvasRef.current; const object = canvas?.getActiveObject() as MetaObject | undefined;
      if (!canvas || !object || !Number.isFinite(xCm) || !Number.isFinite(yCm)) return;
      const center = object.getCenterPoint();
      object.set({ left: (object.left ?? 0) + xCm * PX_PER_CM - center.x, top: (object.top ?? 0) + yCm * PX_PER_CM - center.y });
      keepInside(canvas, object); canvas.fire('object:modified', { target: object });
    },
  }));

  return <canvas ref={elementRef} aria-label={`${side === 'front' ? 'Ön' : 'Arka'} yüz baskı tasarım alanı`} />;
});
