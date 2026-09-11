import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { Canvas, FabricImage, FabricObject, Group, Textbox, loadSVGFromString, util } from 'fabric';
import type { DesignDocument, ItemKind, ObjectMeasurement, Side } from '../types';
import { round } from '../lib/pricing';
import { qualityForPpi, validateDimensions } from '../lib/imageValidation';
import { disposeFabricCanvas } from '../lib/fabricLifecycle';
import { alignObjectCenter, createHistory, redoHistory, undoHistory, writeHistory } from '../lib/editorCommands';

export const CANVAS_WIDTH = 360;
export const CANVAS_HEIGHT = 480;
export const PX_PER_CM = 12;

type MetaObject = FabricObject & {
  itemId?: string; itemKind?: ItemKind; itemLabel?: string; itemDetail?: string; isVector?: boolean;
  sourcePixelWidth?: number; sourcePixelHeight?: number; sourceMime?: string;
};

FabricObject.customProperties = ['itemId', 'itemKind', 'itemLabel', 'itemDetail', 'isVector', 'sourcePixelWidth', 'sourcePixelHeight', 'sourceMime'];

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
  measurement: ObjectMeasurement;
}

export interface EditorHandle {
  addText: () => void;
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
  replaceDocument: (document: DesignDocument) => Promise<void>;
  exportImage: () => string;
}

interface Props {
  side: Side;
  document: DesignDocument;
  onChange: (document: DesignDocument, measurements: ObjectMeasurement[], preview: string) => void;
  onSelection: (selection: SelectionInfo | null) => void;
  onHistoryChange: (history: { canUndo: boolean; canRedo: boolean }) => void;
}

const uid = () => `obj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function getMeasurement(object: MetaObject, side: Side): ObjectMeasurement {
  const center = object.getCenterPoint();
  const widthCm = round(object.getScaledWidth() / PX_PER_CM);
  const heightCm = round(object.getScaledHeight() / PX_PER_CM);
  const hasRasterSource = !object.isVector && Boolean(object.sourcePixelWidth && object.sourcePixelHeight);
  const ppiX = hasRasterSource ? object.sourcePixelWidth! / (widthCm / 2.54) : undefined;
  const ppiY = hasRasterSource ? object.sourcePixelHeight! / (heightCm / 2.54) : undefined;
  const estimatedPpi = ppiX && ppiY ? Math.round(Math.min(ppiX, ppiY)) : undefined;
  const quality = estimatedPpi === undefined ? undefined : estimatedPpi >= 300 ? 'suitable' : estimatedPpi >= 200 ? 'warning' : 'risk';
  return {
    id: object.itemId ?? uid(), side, kind: object.itemKind ?? 'symbol', label: object.itemLabel ?? 'Tasarım nesnesi',
    xCm: round(center.x / PX_PER_CM), yCm: round(center.y / PX_PER_CM),
    widthCm, heightCm, angle: round(((object.angle ?? 0) % 360 + 360) % 360),
    detail: object.itemDetail ?? 'Vektörel tasarım', vector: object.isVector ?? true,
    sourcePixels: hasRasterSource ? { width: object.sourcePixelWidth!, height: object.sourcePixelHeight! } : undefined,
    estimatedPpi,
    quality,
  };
}

function keepInside(canvas: Canvas, object: MetaObject) {
  object.setCoords();
  let rect = object.getBoundingRect();
  if (rect.width > CANVAS_WIDTH || rect.height > CANVAS_HEIGHT) {
    const ratio = Math.min(CANVAS_WIDTH / rect.width, CANVAS_HEIGHT / rect.height) * 0.94;
    object.scaleX = (object.scaleX ?? 1) * ratio;
    object.scaleY = (object.scaleY ?? 1) * ratio;
    object.setCoords(); rect = object.getBoundingRect();
  }
  let dx = 0; let dy = 0;
  if (rect.left < 0) dx = -rect.left;
  if (rect.top < 0) dy = -rect.top;
  if (rect.left + rect.width > CANVAS_WIDTH) dx = CANVAS_WIDTH - rect.left - rect.width;
  if (rect.top + rect.height > CANVAS_HEIGHT) dy = CANVAS_HEIGHT - rect.top - rect.height;
  object.left = (object.left ?? 0) + dx;
  object.top = (object.top ?? 0) + dy;
  object.setCoords(); canvas.requestRenderAll();
}

export const FabricEditor = forwardRef<EditorHandle, Props>(function FabricEditor({ side, document, onChange, onSelection, onHistoryChange }, ref) {
  const elementRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const pendingSymbolsRef = useRef(new Set<string>());
  const readyRef = useRef(false);
  const restoringRef = useRef(false);
  const initialDocumentRef = useRef(document);
  const historyRef = useRef(createHistory(document));
  const callbacksRef = useRef({ onChange, onSelection, onHistoryChange });
  callbacksRef.current = { onChange, onSelection, onHistoryChange };

  const notifyHistory = () => callbacksRef.current.onHistoryChange({ canUndo: historyRef.current.past.length > 0, canRedo: historyRef.current.future.length > 0 });
  const snapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas || !readyRef.current || restoringRef.current) return;
    historyRef.current = writeHistory(historyRef.current, canvas.toJSON() as DesignDocument);
    notifyHistory();
  };
  const notify = () => {
    const canvas = canvasRef.current;
    if (!canvas || !readyRef.current || restoringRef.current) return;
    const objects = canvas.getObjects() as MetaObject[];
    callbacksRef.current.onChange(canvas.toJSON() as DesignDocument, objects.map((object) => getMeasurement(object, side)), canvas.toDataURL({ format: 'png', multiplier: 1 }));
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
      canvas.getObjects().forEach((object) => keepInside(canvas, object as MetaObject));
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

    let disposed = false;
    const loadController = new AbortController();
    canvas.loadFromJSON(initialDocumentRef.current, undefined, { signal: loadController.signal }).then(() => {
      if (disposed || canvas.destroyed) return;
      readyRef.current = true;
      canvas.getObjects().forEach((object) => keepInside(canvas, object as MetaObject));
      canvas.renderAll();
      historyRef.current = createHistory(canvas.toJSON() as DesignDocument);
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
      let imageFile = file;
      if (file.type === 'image/heic' || file.type === 'image/heif' || /\.hei[cf]$/i.test(file.name)) {
        const { default: heic2any } = await import('heic2any');
        const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
        const blob = Array.isArray(converted) ? converted[0] : converted;
        imageFile = new File([blob], file.name.replace(/\.hei[cf]$/i, '.jpg'), { type: 'image/jpeg' });
      }
      const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(imageFile); });
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
    replaceDocument: async (nextDocument) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const nextHistory = writeHistory(historyRef.current, nextDocument);
      historyRef.current = nextHistory;
      notifyHistory();
      await restore(nextHistory.present);
    },
    exportImage: () => canvasRef.current?.toDataURL({ format: 'png', multiplier: 2 }) ?? '',
  }));

  return <canvas ref={elementRef} aria-label={`${side === 'front' ? 'Ön' : 'Arka'} yüz baskı tasarım alanı`} />;
});
