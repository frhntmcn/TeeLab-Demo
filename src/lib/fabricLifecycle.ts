export interface DisposableCanvas {
  cancelRequestedRender: () => void;
  dispose: () => Promise<boolean>;
}

/**
 * Fabric defers dispose while a render is pending. Cancelling that render first
 * prevents a previous React mount from destroying the next mount's canvas.
 */
export function disposeFabricCanvas(canvas: DisposableCanvas, loadController: AbortController): void {
  loadController.abort();
  canvas.cancelRequestedRender();
  void canvas.dispose();
}
