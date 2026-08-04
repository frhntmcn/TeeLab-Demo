import frontWhite from '../assets/mockups/front-white.webp';
import frontBlack from '../assets/mockups/front-black.webp';
import frontBeige from '../assets/mockups/front-beige.webp';
import frontPurple from '../assets/mockups/front-purple.webp';
import backWhite from '../assets/mockups/back-white.webp';
import backBlack from '../assets/mockups/back-black.webp';
import backBeige from '../assets/mockups/back-beige.webp';
import backPurple from '../assets/mockups/back-purple.webp';
import type { MockupPrintArea, ShirtColor, Side } from '../types';

export const mockupImages: Record<Side, Record<ShirtColor, string>> = {
  front: { white: frontWhite, black: frontBlack, beige: frontBeige, purple: frontPurple },
  back: { white: backWhite, black: backBlack, beige: backBeige, purple: backPurple },
};

/**
 * Presentation-only placement. Every rectangle maps the full Fabric canvas
 * to the same physical 30 × 40 cm print area. It never changes production data.
 */
export const mockupPrintAreas: Record<Side, MockupPrintArea> = {
  front: { leftPercent: 30, topPercent: 22, widthPercent: 40, heightPercent: 53.333 },
  back: { leftPercent: 30, topPercent: 21.5, widthPercent: 40, heightPercent: 53.333 },
};
