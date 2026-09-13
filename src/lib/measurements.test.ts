import { describe, expect, it } from 'vitest';
import { CANVAS_HEIGHT, CANVAS_WIDTH, constrainObject, getMeasurement, type MetaObject } from './measurements';

function objectFixture({ left = 0, top = 0, width = 120, height = 120, scaleX = 1, scaleY = 1, sourcePixels }: {
  left?: number; top?: number; width?: number; height?: number; scaleX?: number; scaleY?: number; sourcePixels?: { width: number; height: number };
} = {}) {
  const object = {
    left, top, scaleX, scaleY, angle: 0, itemId: 'fixture', itemKind: 'image', itemLabel: 'Fixture', itemDetail: 'Fixture image', isVector: !sourcePixels,
    sourcePixelWidth: sourcePixels?.width, sourcePixelHeight: sourcePixels?.height,
    setCoords: () => undefined,
    getBoundingRect: () => ({ left: object.left, top: object.top, width: width * (object.scaleX ?? 1), height: height * (object.scaleY ?? 1) }),
    getScaledWidth: () => width * (object.scaleX ?? 1),
    getScaledHeight: () => height * (object.scaleY ?? 1),
    getCenterPoint: () => ({ x: object.left + object.getScaledWidth() / 2, y: object.top + object.getScaledHeight() / 2 }),
  };
  return object as unknown as MetaObject;
}

describe('constrainObject', () => {
  it('shrinks oversized objects using the editor 94% safety margin', () => {
    const object = objectFixture({ width: 720, height: 480 });
    constrainObject(object);
    expect(object.scaleX).toBeCloseTo(0.47);
    expect(object.scaleY).toBeCloseTo(0.47);
    expect(object.getBoundingRect().width).toBeLessThan(CANVAS_WIDTH);
    expect(object.getBoundingRect().height).toBeLessThan(CANVAS_HEIGHT);
  });

  it('moves objects back inside every canvas edge', () => {
    const object = objectFixture({ left: -30, top: -20, width: 120, height: 120 });
    constrainObject(object);
    expect(object.left).toBe(0);
    expect(object.top).toBe(0);
    object.left = 320; object.top = 450;
    constrainObject(object);
    expect(object.left).toBe(CANVAS_WIDTH - 120);
    expect(object.top).toBe(CANVAS_HEIGHT - 120);
  });
});

describe('getMeasurement', () => {
  it('retains the 300 and 200 PPI quality boundaries', () => {
    expect(getMeasurement(objectFixture({ width: 120, height: 120, sourcePixels: { width: 1418, height: 1418 } }), 'front').quality).toBe('suitable');
    expect(getMeasurement(objectFixture({ width: 120, height: 120, sourcePixels: { width: 1000, height: 1000 } }), 'front').quality).toBe('warning');
    expect(getMeasurement(objectFixture({ width: 120, height: 120, sourcePixels: { width: 700, height: 700 } }), 'front').quality).toBe('risk');
  });
});
