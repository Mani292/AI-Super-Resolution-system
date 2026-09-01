/**
 * High-performance HTML5 Canvas renderer for multispectral satellite data.
 * Supports Split-Curtain comparison, 10m pixel grid overlays, SAM error maps,
 * NDVI/NDWI palettes, and Uncertainty threshold masks.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { 
  BandComposition, 
  ContrastStretchMode, 
  ViewMode, 
  UncertaintyMethod 
} from '../types/satellite';
import { RasterData } from '../utils/rasterGenerator';
import { 
  linear2PercentStretch, 
  getNdviRampRgb, 
  getHeatmapRgb 
} from '../utils/spectralMath';

interface RasterCanvasProps {
  raster: RasterData;
  bandComposition: BandComposition;
  contrastStretch: ContrastStretchMode;
  viewMode: ViewMode;
  splitPosition: number; // 0 to 100
  splitLeftMode: 'observed' | 'bicubic';
  splitRightMode: 'sr' | 'reference';
  show10mGrid: boolean;
  uncertaintyMethod: UncertaintyMethod;
  uncertaintyThreshold: number;
  onMouseMove: (x: number, y: number) => void;
  onMouseLeave: () => void;
}

export const RasterCanvas: React.FC<RasterCanvasProps> = ({
  raster,
  bandComposition,
  contrastStretch,
  viewMode,
  splitPosition,
  splitLeftMode,
  splitRightMode,
  show10mGrid,
  uncertaintyMethod,
  uncertaintyThreshold,
  onMouseMove,
  onMouseLeave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Helper to extract RGB channels from a 4-band dataset based on composition
  const getChannels = useCallback((
    source: { b02: Float32Array; b03: Float32Array; b04: Float32Array; b08: Float32Array },
    idx: number
  ): [number, number, number] => {
    let r = 0, g = 0, b = 0;

    switch (bandComposition) {
      case 'RGB': // Natural Color (B04 Red, B03 Green, B02 Blue)
        r = source.b04[idx];
        g = source.b03[idx];
        b = source.b02[idx];
        break;
      case 'CIR': // Color Infrared (B08 NIR -> Red, B04 Red -> Green, B03 Green -> Blue)
        r = source.b08[idx];
        g = source.b04[idx];
        b = source.b03[idx];
        break;
      case 'AGRICULTURE': // Agriculture (B08 NIR -> Red, B04 Red -> Green, B02 Blue -> Blue)
        r = source.b08[idx];
        g = source.b04[idx];
        b = source.b02[idx];
        break;
      case 'B02_ONLY': // Blue Band Grayscale
        r = g = b = source.b02[idx];
        break;
      case 'B03_ONLY': // Green Band Grayscale
        r = g = b = source.b03[idx];
        break;
      case 'B04_ONLY': // Red Band Grayscale
        r = g = b = source.b04[idx];
        break;
      case 'B08_ONLY': // NIR Band Grayscale
        r = g = b = source.b08[idx];
        break;
    }

    // Apply contrast stretch
    if (contrastStretch === 'LINEAR_2_PERCENT') {
      return [
        linear2PercentStretch(r, 0.02, 0.42),
        linear2PercentStretch(g, 0.02, 0.42),
        linear2PercentStretch(b, 0.02, 0.42),
      ];
    } else if (contrastStretch === 'MIN_MAX') {
      return [
        Math.min(255, Math.max(0, r * 255 * 2.2)),
        Math.min(255, Math.max(0, g * 255 * 2.2)),
        Math.min(255, Math.max(0, b * 255 * 2.2)),
      ];
    } else if (contrastStretch === 'HIST_EQUALIZATION') {
      const eq = (v: number) => Math.min(255, Math.pow(Math.max(0, v * 2.5), 0.75) * 255);
      return [eq(r), eq(g), eq(b)];
    } else {
      // RAW DN / 10000 direct conversion
      return [
        Math.min(255, Math.max(0, r * 255)),
        Math.min(255, Math.max(0, g * 255)),
        Math.min(255, Math.max(0, b * 255)),
      ];
    }
  }, [bandComposition, contrastStretch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = raster.width;
    const h = raster.height;
    canvas.width = w;
    canvas.height = h;

    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;

    const splitX = Math.round((splitPosition / 100) * w);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const pixelOffset = idx * 4;

        let r = 0, g = 0, b = 0, a = 255;

        if (viewMode === 'SPLIT_CURTAIN') {
          const isLeft = x < splitX;
          const source = isLeft
            ? (splitLeftMode === 'observed' ? raster.observed : raster.bicubic)
            : (splitRightMode === 'sr' ? raster.sr : raster.reference);
          
          [r, g, b] = getChannels(source, idx);

          // Draw split boundary line
          if (x === splitX) {
            r = 16; g = 185; b = 129; // Emerald line
          }
        } else if (viewMode === 'DIFFERENCE_MAP') {
          // L1 Difference between SR and Reference (or Baseline)
          const diffRed = Math.abs(raster.sr.b04[idx] - raster.reference.b04[idx]);
          const diffNir = Math.abs(raster.sr.b08[idx] - raster.reference.b08[idx]);
          const normDiff = Math.min(1.0, (diffRed + diffNir) * 15.0);
          [r, g, b] = getHeatmapRgb(normDiff);

        } else if (viewMode === 'SAM_HEATMAP') {
          // Spectral Angle Mapper in degrees [0 .. 10 deg range mapped to color]
          const angleDeg = raster.samSrToRef[idx];
          const normAngle = Math.min(1.0, angleDeg / 8.0);
          [r, g, b] = getHeatmapRgb(normAngle);

        } else if (viewMode === 'NDVI_MAP') {
          const ndvi = raster.ndviSr[idx];
          [r, g, b] = getNdviRampRgb(ndvi);

        } else if (viewMode === 'NDWI_MAP') {
          const ndwi = raster.ndwiSr[idx];
          // NDWI water mask
          if (ndwi > 0.05) {
            r = 20; g = 80; b = 220; // Deep water
          } else {
            const t = Math.max(0, (ndwi + 0.5) / 0.55);
            r = Math.round(180 * (1 - t) + 40 * t);
            g = Math.round(150 * (1 - t) + 50 * t);
            b = Math.round(110 * (1 - t) + 70 * t);
          }

        } else if (viewMode === 'UNCERTAINTY_MAP') {
          const uncVal = raster.uncertainty[uncertaintyMethod][idx];
          // Normalize based on method
          const maxScale = uncertaintyMethod === 'mc_dropout' ? 0.000001 : 0.004;
          const normUnc = Math.min(1.0, uncVal / maxScale);
          [r, g, b] = getHeatmapRgb(normUnc);

          // Highlight pixels above threshold
          if (uncVal > uncertaintyThreshold) {
            r = 255; g = 0; b = 80; // Bright crimson threshold highlight
          }

        } else {
          // Default Single SR view
          [r, g, b] = getChannels(raster.sr, idx);
        }

        // Draw 10m Sentinel-2 Sensor Pixel Grid overlay if enabled
        if (show10mGrid) {
          const isGridBorder = (x % 4 === 0) || (y % 4 === 0);
          if (isGridBorder) {
            // Subtle cyan 10m grid boundary
            r = Math.round(r * 0.6 + 6 * 0.4);
            g = Math.round(g * 0.6 + 182 * 0.4);
            b = Math.round(b * 0.6 + 212 * 0.4);
          }
        }

        data[pixelOffset] = r;
        data[pixelOffset + 1] = g;
        data[pixelOffset + 2] = b;
        data[pixelOffset + 3] = a;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [
    raster, 
    bandComposition, 
    contrastStretch, 
    viewMode, 
    splitPosition, 
    splitLeftMode, 
    splitRightMode, 
    show10mGrid, 
    uncertaintyMethod, 
    uncertaintyThreshold,
    getChannels
  ]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    onMouseMove(x, y);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-950 select-none overflow-hidden rounded-xl border border-slate-800/80 shadow-2xl">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={onMouseLeave}
        className="w-full h-auto aspect-square max-w-[640px] max-h-[640px] pixelated cursor-crosshair object-contain"
      />
    </div>
  );
};
