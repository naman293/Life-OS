'use client';

import { useEffect, useRef } from 'react';
import { useTransitionStore } from '@/lib/transitionStore';

/**
 * Clerk redirects here after successful sign-in.
 * This page renders NOTHING visual — the TransitionOverlay (root layout)
 * is solid cream and already covers everything, including this page.
 * We just trigger the store so the overlay begins its animation.
 */
export default function TransitionPage() {
  const trigger  = useTransitionStore(s => s.trigger);
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    // Dimensions don't matter — overlay measures the card it renders internally
    trigger(0, 0, 420, 460);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* No visual needed — the overlay covers everything */
  return null;
}
