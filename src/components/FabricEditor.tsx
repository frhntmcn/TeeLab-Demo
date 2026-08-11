import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { Canvas, FabricImage, FabricObject, Group, Textbox, loadSVGFromString, util } from 'fabric';
import type { DesignDocument, ItemKind, ObjectMeasurement, Side } from '../types';
import { round } from '../lib/pricing';

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
  exportImage: () => string;
}

interface Props {
  side: Side;
  document: DesignDocument;
  onChange: (document: DesignDocument, measurements: ObjectMeasurement[], preview: string) => void;
  onSelection: (selection: SelectionInfo | null) => void;
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

export const FabricEditor = forwardRef<EditorHandle, Props>(function FabricEditor({ side, document, onChange, onSelection }, ref) {
  const elementRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const pendingSymbolsRef = useRef(new Set<string>());
  const readyRef = useRef(false);
  const initialDocumentRef = useRef(document);
  const callbacksRef = useRef({ onChange, onSelection });
  callbacksRef.current = { onChange, onSelection };

  useLayoutEffect(() => {
    if (!elementRef.current) return;
    const canvas = new Canvas(elementRef.current, {
      width: CANVAS_WIDTH, height: CANVAS_HEIGHT, preserveObjectStacking: true, selectionColor: 'rgba(124,58,237,.1)',
    });
    canvasRef.current = canvas;
    let disposed = false;

    const notify = () => {
      if (!readyRef.current) return;
      const objects = canvas.getObjects() as MetaObject[];
      const json = canvas.toJSON() as DesignDocument;
      callbacksRef.current.onChange(json, objects.map((object) => getMeasurement(object, side)), canvas.toDataURL({ format: 'png', multiplier: 1 }));
    };
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
    canvas.on('object:modified', () => { select(); notify(); });
    canvas.on('object:added', notify);
    canvas.on('object:removed', notify);
    canvas.on('selection:created', select);
    canvas.on('selection:updated', select);
    canvas.on('selection:cleared', () => callbacksRef.current.onSelection(null));

    const initialize = () => {
      if (disposed) return;
      readyRef.current = true;
      canvas.getObjects().forEach((object) => keepInside(canvas, object as MetaObject));
      canvas.renderAll(); notify();
    };
    const hasObjects = initialDocumentRef.current.objects.length > 0;
    if (hasObjects) void canvas.loadFromJSON(initialDocumentRef.current).then(initialize).catch(() => undefined);
    else initialize();
    return () => { disposed = true; readyRef.current = false; if (canvasRef.current === canvas) canvasRef.current = null; canvas.dispose(); };
  }, [side]);

  const addObject = (object: MetaObject) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    object.set({ left: CANVAS_WIDTH / 2, top: CANVAS_HEIGHT / 2, originX: 'center', originY: 'center', cornerColor: '#7c3aed', borderColor: '#7c3aed', cornerStyle: 'circle', transparentCorners: false });
    canvas.add(object); canvas.setActiveObject(object); keepInside(canvas, object); canvas.requestRenderAll();
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
      const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
      if (file.type === 'image/svg+xml') {
        const text = await file.text();
        const parsed = await loadSVGFromString(text); const valid = parsed.objects.filter((object): object is FabricObject => object !== null);
        const group = util.groupSVGElements(valid, parsed.options) as Group & MetaObject; group.scaleToWidth(180);
        Object.assign(group, { itemId: uid(), itemKind: 'image', itemLabel: file.name, itemDetail: 'SVG / vektör', isVector: true }); addObject(group);
        return { lowQuality: false, message: 'SVG vektör olarak eklendi; ölçeklenirken kalite korunur.' };
      }
      const image = await FabricImage.fromURL(dataUrl) as FabricImage & MetaObject;
      const sourceWidth = image.width ?? 0; const sourceHeight = image.height ?? 0; image.scaleToWidth(180);
      Object.assign(image, { itemId: uid(), itemKind: 'image', itemLabel: file.name, itemDetail: `${file.type || 'Raster'} / ${sourceWidth}×${sourceHeight} px`, isVector: false, sourcePixelWidth: sourceWidth, sourcePixelHeight: sourceHeight, sourceMime: file.type }); addObject(image);
      const measurement = getMeasurement(image, side);
      const ppi = measurement.estimatedPpi ?? 0;
      const lowQuality = ppi < 300;
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
    removeSelected: () => { const canvas = canvasRef.current; const object = canvas?.getActiveObject(); if (canvas && object) { canvas.remove(object); canvas.discardActiveObject(); canvas.requestRenderAll(); callbacksRef.current.onSelection(null); } },
    bringForward: () => { const canvas = canvasRef.current; const object = canvas?.getActiveObject(); if (canvas && object) { canvas.bringObjectForward(object); canvas.requestRenderAll(); canvas.fire('object:modified', { target: object }); } },
    sendBackward: () => { const canvas = canvasRef.current; const object = canvas?.getActiveObject(); if (canvas && object) { canvas.sendObjectBackwards(object); canvas.requestRenderAll(); canvas.fire('object:modified', { target: object }); } },
    exportImage: () => canvasRef.current?.toDataURL({ format: 'png', multiplier: 2 }) ?? '',
  }));

  return <canvas ref={elementRef} aria-label={`${side === 'front' ? 'Ön' : 'Arka'} yüz baskı tasarım alanı`} />;
});
