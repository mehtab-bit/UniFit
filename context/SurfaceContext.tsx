import React, { createContext, useContext } from 'react';
import { SurfaceColors, SurfaceType } from '../constants/colors';

export const SurfaceContext = createContext<SurfaceType>('light');

/**
 * Hook to retrieve the current surface mode ('dark' | 'light').
 * Accepts an optional override for localized components.
 */
export const useSurface = (override?: SurfaceType): SurfaceType => {
  const contextSurface = useContext(SurfaceContext);
  return override || contextSurface;
};

/**
 * Hook to retrieve the full set of color tokens for the current surface.
 * Guarantees high-contrast text, number, label, and track colors.
 */
export const useSurfaceColors = (override?: SurfaceType) => {
  const surface = useSurface(override);
  return SurfaceColors[surface];
};

export interface SurfaceProps {
  type: SurfaceType;
  children: React.ReactNode;
}

/**
 * Surface Provider component that establishes a dark or light context
 * for all nested metrics, text, rings, and counters.
 */
export const Surface: React.FC<SurfaceProps> = ({ type, children }) => {
  return (
    <SurfaceContext.Provider value={type}>
      {children}
    </SurfaceContext.Provider>
  );
};
