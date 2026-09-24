import frontWhite from '../assets/mockups/front-white.webp';
import frontBlack from '../assets/mockups/front-black.webp';
import frontBeige from '../assets/mockups/front-beige.webp';
import frontPurple from '../assets/mockups/front-purple.webp';
import backWhite from '../assets/mockups/back-white.webp';
import backBlack from '../assets/mockups/back-black.webp';
import backBeige from '../assets/mockups/back-beige.webp';
import backPurple from '../assets/mockups/back-purple.webp';
import frontWhiteOversize from '../assets/mockups/front-white-oversize.png';
import frontBlackOversize from '../assets/mockups/front-black-oversize.png';
import backWhiteOversize from '../assets/mockups/back-white-oversize.png';
import backBlackOversize from '../assets/mockups/back-black-oversize.png';
import type { MockupPrintArea, ShirtColor, ShirtFit, Side } from '../types';

export const mockupImages: Record<ShirtFit, Record<Side, Record<ShirtColor, string>>> = {
  slim: {
    front: { white: frontWhite, black: frontBlack, beige: frontBeige, purple: frontPurple },
    back: { white: backWhite, black: backBlack, beige: backBeige, purple: backPurple },
  },
  oversize: {
    front: { white: frontWhiteOversize, black: frontBlackOversize, beige: frontBeige, purple: frontPurple },
    back: { white: backWhiteOversize, black: backBlackOversize, beige: backBeige, purple: backPurple },
  },
};

/**
 * Presentation-only placement. Every rectangle maps the full Fabric canvas
 * to the same physical 30 × 40 cm print area. It never changes production data.
 */
export const mockupPrintAreas: Record<Side, MockupPrintArea> = {
  front: { leftPercent: 30, topPercent: 22, widthPercent: 40, heightPercent: 53.333 },
  back: { leftPercent: 30, topPercent: 21.5, widthPercent: 40, heightPercent: 53.333 },
};
