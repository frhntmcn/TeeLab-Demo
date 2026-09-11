import { describe, expect, it } from 'vitest';
import { alignObjectCenter, createHistory, redoHistory, undoHistory, writeHistory } from './editorCommands';

describe('editor commands', () => {
  it('undoes and redoes the active side document, clearing redo after a new edit', () => {
    const empty = { version: '7.4.0', objects: [] };
    const text = { version: '7.4.0', objects: [{ type: 'Textbox', text: 'Merhaba' }] };
    const symbol = { version: '7.4.0', objects: [{ type: 'Textbox', text: '✦' }] };
    let history = createHistory(empty);
    history = writeHistory(history, text);
    expect(undoHistory(history).document).toEqual(empty);
    history = undoHistory(history).history;
    expect(redoHistory(history).document).toEqual(text);
    history = redoHistory(history).history;
    history = undoHistory(history).history;
    history = writeHistory(history, symbol);
    expect(redoHistory(history).document).toBeUndefined();
  });

  it('treats a template replacement as one undoable active-side document change', () => {
    const before = { version: '7.4.0', objects: [{ text: 'ön yüz' }] };
    const template = { version: '7.4.0', objects: [{ text: 'şablon' }] };
    const history = writeHistory(createHistory(before), template);
    expect(undoHistory(history).document).toEqual(before);
  });

  it('restores template metadata with the same undo and redo snapshot as its document', () => {
    const front = { version: '7.4.0', objects: [{ text: 'ön' }] };
    const back = { version: '7.4.0', objects: [] };
    const applied = { version: '7.4.0', objects: [{ text: 'arka şablon' }] };
    const frontMetadata = { id: 'big-heading', name: 'Büyük Başlık' };
    const backMetadata = { id: 'two-line-message', name: 'İki Satır Mesaj' };
    let backHistory = createHistory(back, undefined);
    backHistory = writeHistory(backHistory, applied, backMetadata);
    const undone = undoHistory(backHistory);
    expect(undone.document).toEqual(back);
    expect(undone.template).toBeUndefined();
    expect(frontMetadata).toEqual({ id: 'big-heading', name: 'Büyük Başlık' });
    const redone = redoHistory(undone.history);
    expect(redone.document).toEqual(applied);
    expect(redone.template).toEqual(backMetadata);
    expect(front).toEqual({ version: '7.4.0', objects: [{ text: 'ön' }] });
  });

  it('clears redo metadata when a new document change is made after undo', () => {
    const empty = { version: '7.4.0', objects: [] };
    const templated = { version: '7.4.0', objects: [{ text: 'şablon' }] };
    const custom = { version: '7.4.0', objects: [{ text: 'özel' }] };
    const metadata = { id: 'big-heading', name: 'Büyük Başlık' };
    let history = writeHistory(createHistory(empty), templated, metadata);
    history = undoHistory(history).history;
    history = writeHistory(history, custom);
    expect(redoHistory(history).document).toBeUndefined();
    expect(history.present.template).toBeUndefined();
  });

  it('keeps independent active-side histories isolated', () => {
    const front = { version: '7.4.0', objects: [] };
    const back = { version: '7.4.0', objects: [{ text: 'arka yüz' }] };
    const frontHistory = writeHistory(createHistory(front), { version: '7.4.0', objects: [{ text: 'ön yüz' }] });
    expect(undoHistory(frontHistory).document).toEqual(front);
    expect(createHistory(back).present.document).toEqual(back);
  });

  it('centers a selected object within the print area and keeps it inside the clamp bounds', () => {
    expect(alignObjectCenter({ left: -40, top: 500, width: 120, height: 80 }, 'horizontal')).toEqual({ left: 120, top: 400 });
    expect(alignObjectCenter({ left: -40, top: 500, width: 120, height: 80 }, 'vertical')).toEqual({ left: 0, top: 200 });
  });

  it('can undo and redo an alignment document change', () => {
    const before = { version: '7.4.0', objects: [{ left: 10, top: 20 }] };
    const centered = { version: '7.4.0', objects: [{ left: 120, top: 200 }] };
    const history = writeHistory(createHistory(before), centered);
    const undone = undoHistory(history);
    expect(undone.document).toEqual(before);
    expect(redoHistory(undone.history).document).toEqual(centered);
  });

  it('is safe when no history action is available', () => {
    const history = createHistory({ version: '7.4.0', objects: [] });
    expect(undoHistory(history).document).toBeUndefined();
    expect(redoHistory(history).document).toBeUndefined();
  });
});
