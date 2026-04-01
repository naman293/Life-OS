import { create } from 'zustand';

type TransitionStore = {
  isExploding: boolean;
  /** Center coordinates of the card that exploded, to anchor particles correctly */
  cardCx: number;
  cardCy: number;
  cardW:  number;
  cardH:  number;
  trigger: (cx: number, cy: number, w: number, h: number) => void;
  reset:   () => void;
};

export const useTransitionStore = create<TransitionStore>((set) => ({
  isExploding: false,
  cardCx: 0, cardCy: 0, cardW: 420, cardH: 460,
  trigger: (cx, cy, w, h) => set({ isExploding: true, cardCx: cx, cardCy: cy, cardW: w, cardH: h }),
  reset:   () => set({ isExploding: false }),
}));
