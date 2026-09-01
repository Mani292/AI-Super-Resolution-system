/**
 * Spectral & Geospatial Math Utilities
 * Implements SAM, ERGAS, NDVI, NDWI, Contrast Stretching, and Affine Calculations
 */

import { LandCoverClass } from '../types/satellite';

export const SENTINEL_BANDS_METADATA = [
  { id: 'B02', name: 'Blue', wavelengthNm: 490, centerWavelength: '490 nm', resolutionOriginalM: 10, description: 'Atmospheric penetration, water depth', color: '#3b82f6' },
  { id: 'B03', name: 'Green', wavelengthNm: 560, centerWavelength: '560 nm', resolutionOriginalM: 10, description: 'Vegetation peak reflectance, water clarity', color: '#10b981' },
  { id: 'B04', name: 'Red', wavelengthNm: 665, centerWavelength: '665 nm', resolutionOriginalM: 10, description: 'Chlorophyll absorption band', color: '#ef4444' },
  { id: 'B08', name: 'NIR', wavelengthNm: 842, centerWavelength: '842 nm', resolutionOriginalM: 10, description: 'High reflectance for cell structure & biomass', color: '#8b5cf6' },
] as const;

export const LAND_COVER_CLASSES: Record<LandCoverClass, { name: string; color: string; hex: string; desc: string }> = {
  water: { name: 'Water Body', color: 'rgb(30, 64, 175)', hex: '#1e40af', desc: 'Lakes, rivers, reservoirs with high blue-green and zero NIR' },
  forest: { name: 'Dense Forest / Canopy', color: 'rgb(22, 101, 52)', hex: '#166534', desc: 'High biomass, high NDVI (> 0.6), strong NIR peak' },
  agriculture: { name: 'Cropland & Agriculture', color: 'rgb(101, 163, 13)', hex: '#65a30d', desc: 'Irrigated fields, row crops, moderate NDVI' },
  urban: { name: 'Built-up / Urban Infrastructure', color: 'rgb(225, 29, 72)', hex: '#e11d48', desc: 'Concrete, asphalt, buildings with high visible reflectance' },
  barren: { name: 'Bare Soil / Sand', color: 'rgb(217, 119, 6)', hex: '#d97706', desc: 'Uncultivated ground, sandbars, dry earth' },
};

/**
 * Calculate NDVI (Normalized Difference Vegetation Index)
 * [-1, 1] range: High values (> 0.4) indicate dense green biomass.
 */
export function calculateNdvi(nir: number, red: number): number {
  const denom = nir + red;
  if (denom === 0) return 0;
  const val = (nir - red) / denom;
  return Math.max(-1, Math.min(1, val));
}

/**
 * Calculate NDWI (Normalized Difference Water Index - McFeeters)
 * High values (> 0.0) delineate water bodies.
 */
export function calculateNdwi(green: number, nir: number): number {
  const denom = green + nir;
  if (denom === 0) return 0;
  const val = (green - nir) / denom;
  return Math.max(-1, Math.min(1, val));
}

/**
 * Spectral Angle Mapper (SAM) in Degrees between two 4-band vectors
 * theta = arccos( (x . y) / (|x| * |y|) ) * 180 / PI
 */
export function calculateSamDegrees(
  v1: [number, number, number, number],
  v2: [number, number, number, number]
): number {
  const dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2] + v1[3] * v2[3];
  const norm1 = Math.sqrt(v1[0] ** 2 + v1[1] ** 2 + v1[2] ** 2 + v1[3] ** 2);
  const norm2 = Math.sqrt(v2[0] ** 2 + v2[1] ** 2 + v2[2] ** 2 + v2[3] ** 2);
  
  if (norm1 === 0 || norm2 === 0) return 0;
  
  const cosTheta = Math.max(-1, Math.min(1, dot / (norm1 * norm2)));
  return (Math.acos(cosTheta) * 180) / Math.PI;
}

/**
 * Linear 2% cumulative histogram stretch
 */
export function linear2PercentStretch(value: number, minRefl = 0.01, maxRefl = 0.45): number {
  const clamped = Math.max(minRefl, Math.min(maxRefl, value));
  return ((clamped - minRefl) / (maxRefl - minRefl)) * 255;
}

/**
 * Color thermal ramp for NDVI:
 * -1.0 .. 0.0: Blue / Water
 * 0.0 .. 0.2: Tan / Soil
 * 0.2 .. 0.4: Yellow-Green / Sparse veg
 * 0.4 .. 0.7: Green / Moderate veg
 * 0.7 .. 1.0: Deep Emerald / Dense canopy
 */
export function getNdviRampRgb(ndvi: number): [number, number, number] {
  if (ndvi < 0) {
    // Water gradient: deep blue
    const t = Math.max(0, (ndvi + 0.5) / 0.5);
    return [Math.round(15 * (1 - t) + 30 * t), Math.round(40 * (1 - t) + 90 * t), Math.round(160 * (1 - t) + 210 * t)];
  } else if (ndvi < 0.2) {
    // Soil / Barren: sandy tan
    const t = ndvi / 0.2;
    return [Math.round(180 + 30 * t), Math.round(140 + 20 * t), Math.round(90 - 20 * t)];
  } else if (ndvi < 0.45) {
    // Sparse veg / Grass: yellowish green
    const t = (ndvi - 0.2) / 0.25;
    return [Math.round(210 * (1 - t) + 120 * t), Math.round(180 * (1 - t) + 190 * t), Math.round(70 * (1 - t) + 30 * t)];
  } else if (ndvi < 0.7) {
    // Moderate vegetation: vibrant green
    const t = (ndvi - 0.45) / 0.25;
    return [Math.round(120 * (1 - t) + 34 * t), Math.round(190 * (1 - t) + 160 * t), Math.round(30 * (1 - t) + 30 * t)];
  } else {
    // Dense canopy: dark forest green
    const t = Math.min(1, (ndvi - 0.7) / 0.3);
    return [Math.round(34 * (1 - t) + 10 * t), Math.round(160 * (1 - t) + 100 * t), Math.round(30 * (1 - t) + 20 * t)];
  }
}

/**
 * Color ramp for Uncertainty / Spectral Angle (SAM)
 * Low error (0) = Deep Slate/Navy -> Moderate = Yellow -> High = Intense Crimson/Magenta
 */
export function getHeatmapRgb(valNormalized: number): [number, number, number] {
  const v = Math.max(0, Math.min(1, valNormalized));
  if (v < 0.25) {
    const t = v / 0.25;
    return [Math.round(15 + 20 * t), Math.round(23 + 60 * t), Math.round(42 + 90 * t)]; // slate to teal
  } else if (v < 0.5) {
    const t = (v - 0.25) / 0.25;
    return [Math.round(35 + 80 * t), Math.round(83 + 120 * t), Math.round(132 - 50 * t)]; // teal to greenish yellow
  } else if (v < 0.75) {
    const t = (v - 0.5) / 0.25;
    return [Math.round(115 + 130 * t), Math.round(203 - 20 * t), Math.round(82 - 60 * t)]; // yellow to orange
  } else {
    const t = (v - 0.75) / 0.25;
    return [Math.round(245 + 10 * t), Math.round(183 - 150 * t), Math.round(22 + 50 * t)]; // orange to crimson
  }
}

/**
 * Format reflectance (e.g. 0.1423 or DN 1423)
 */
export function formatReflectance(val: number): string {
  return val.toFixed(4);
}

/**
 * Minimum Distance Classifier based on Centroids
 */
const CLASS_CENTROIDS: Record<LandCoverClass, [number, number, number, number]> = {
  water: [0.08, 0.09, 0.05, 0.02],
  forest: [0.03, 0.06, 0.04, 0.38],
  agriculture: [0.05, 0.09, 0.08, 0.28],
  urban: [0.18, 0.19, 0.22, 0.24],
  barren: [0.16, 0.20, 0.24, 0.26],
};

export function classifyPixel(b02: number, b03: number, b04: number, b08: number): LandCoverClass {
  const ndvi = calculateNdvi(b08, b04);
  const ndwi = calculateNdwi(b03, b08);

  // High confidence rule gates
  if (ndwi > 0.15 || (b08 < 0.06 && b03 > b08)) {
    return 'water';
  }
  if (ndvi > 0.55 && b08 > 0.30) {
    return 'forest';
  }
  if (ndvi > 0.25 && b08 > 0.18) {
    return 'agriculture';
  }
  if (b04 > 0.16 && b08 > 0.18 && ndvi < 0.18) {
    return 'urban';
  }

  // Fallback Euclidean distance in 4D spectral space
  let minClass: LandCoverClass = 'barren';
  let minDistance = Infinity;

  for (const [cls, centroid] of Object.entries(CLASS_CENTROIDS) as [LandCoverClass, [number, number, number, number]][]) {
    const dist = (b02 - centroid[0]) ** 2 +
                 (b03 - centroid[1]) ** 2 +
                 (b04 - centroid[2]) ** 2 +
                 (b08 - centroid[3]) ** 2;
    if (dist < minDistance) {
      minDistance = dist;
      minClass = cls;
    }
  }

  return minClass;
}
