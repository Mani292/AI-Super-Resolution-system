/**
 * High-performance multispectral raster generator.
 * Produces deterministic 4-band matrices (B02, B03, B04, B08) for real-time canvas rendering.
 */

import { SatelliteScene, UncertaintyMethod, PixelProbeInfo, LandCoverClass } from '../types/satellite';
import { calculateNdvi, calculateNdwi, calculateSamDegrees, classifyPixel } from './spectralMath';

export interface RasterData {
  width: number;
  height: number;
  // Reflectance values in range [0.0 .. 1.0] (corresponding to DN / 10000)
  observed: { b02: Float32Array; b03: Float32Array; b04: Float32Array; b08: Float32Array };
  bicubic: { b02: Float32Array; b03: Float32Array; b04: Float32Array; b08: Float32Array };
  sr: { b02: Float32Array; b03: Float32Array; b04: Float32Array; b08: Float32Array };
  reference: { b02: Float32Array; b03: Float32Array; b04: Float32Array; b08: Float32Array };
  uncertainty: {
    ensemble: Float32Array;
    mc_dropout: Float32Array;
    reprojection: Float32Array;
  };
  samSrToRef: Float32Array;
  samBaselineToRef: Float32Array;
  ndviSr: Float32Array;
  ndwiSr: Float32Array;
}

// Pseudo-random noise with seed
function seededRandom(seed: number) {
  let s = Math.sin(seed++) * 10000;
  return s - Math.floor(s);
}

// Simple 2D Perlin-like noise
function noise2D(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const n00 = seededRandom(xi * 137 + yi * 269 + seed);
  const n10 = seededRandom((xi + 1) * 137 + yi * 269 + seed);
  const n01 = seededRandom(xi * 137 + (yi + 1) * 269 + seed);
  const n11 = seededRandom((xi + 1) * 137 + (yi + 1) * 269 + seed);

  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);

  const nx0 = n00 * (1 - u) + n10 * u;
  const nx1 = n01 * (1 - u) + n11 * u;
  return nx0 * (1 - v) + nx1 * v;
}

export function generateSceneRaster(scene: SatelliteScene): RasterData {
  const w = scene.width; // 256
  const h = scene.height; // 256
  const size = w * h;

  // Allocate typed arrays
  const refB02 = new Float32Array(size);
  const refB03 = new Float32Array(size);
  const refB04 = new Float32Array(size);
  const refB08 = new Float32Array(size);

  const srB02 = new Float32Array(size);
  const srB03 = new Float32Array(size);
  const srB04 = new Float32Array(size);
  const srB08 = new Float32Array(size);

  const bicB02 = new Float32Array(size);
  const bicB03 = new Float32Array(size);
  const bicB04 = new Float32Array(size);
  const bicB08 = new Float32Array(size);

  const obsB02 = new Float32Array(size);
  const obsB03 = new Float32Array(size);
  const obsB04 = new Float32Array(size);
  const obsB08 = new Float32Array(size);

  const uncEnsemble = new Float32Array(size);
  const uncMcDropout = new Float32Array(size);
  const uncReprojection = new Float32Array(size);

  const samSr = new Float32Array(size);
  const samBic = new Float32Array(size);
  const ndviSr = new Float32Array(size);
  const ndwiSr = new Float32Array(size);

  const seed = scene.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 42);

  // 1. Generate Ground Truth Reference at 2.5m
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const nx = x / w;
      const ny = y / h;

      let b02 = 0.05, b03 = 0.08, b04 = 0.06, b08 = 0.25;

      if (scene.sceneType === 'urban') {
        // High density roads, buildings, water lake in corner, park patches
        const isLake = (nx - 0.78) ** 2 + (ny - 0.75) ** 2 < 0.025;
        const isMainRoad1 = Math.abs(ny - 0.45) < 0.02 || Math.abs(nx - 0.35) < 0.025;
        const isRingRoad = Math.abs(Math.hypot(nx - 0.5, ny - 0.5) - 0.32) < 0.015;
        const gridX = Math.floor(x / 14);
        const gridY = Math.floor(y / 14);
        const isBuilding = !isLake && !isMainRoad1 && !isRingRoad && (gridX % 2 === 0 && gridY % 2 === 0);
        const isPark = !isLake && !isMainRoad1 && nx > 0.1 && nx < 0.3 && ny > 0.65 && ny < 0.9;

        if (isLake) {
          b02 = 0.08; b03 = 0.09; b04 = 0.04; b08 = 0.015; // Water
        } else if (isPark) {
          b02 = 0.03; b03 = 0.07; b04 = 0.04; b08 = 0.42; // Dense Trees
        } else if (isMainRoad1 || isRingRoad) {
          b02 = 0.12; b03 = 0.13; b04 = 0.14; b08 = 0.15; // Asphalt
        } else if (isBuilding) {
          const roofSeed = (gridX * 7 + gridY * 13) % 4;
          if (roofSeed === 0) { // Concrete
            b02 = 0.22; b03 = 0.24; b04 = 0.25; b08 = 0.26;
          } else if (roofSeed === 1) { // Blue Metal
            b02 = 0.32; b03 = 0.20; b04 = 0.15; b08 = 0.18;
          } else if (roofSeed === 2) { // Brick Red
            b02 = 0.14; b03 = 0.16; b04 = 0.32; b08 = 0.28;
          } else { // White membrane
            b02 = 0.38; b03 = 0.40; b04 = 0.42; b08 = 0.43;
          }
        } else {
          // Open soil / street verge
          b02 = 0.15; b03 = 0.18; b04 = 0.20; b08 = 0.22;
        }

      } else if (scene.sceneType === 'agri') {
        // Orthogonal fields with differing crop stages, canal, farm tracks
        const isCanal = Math.abs(ny - (0.3 + 0.1 * Math.sin(nx * 8))) < 0.012;
        const fieldX = Math.floor(x / 32);
        const fieldY = Math.floor(y / 24);
        const isBorder = (x % 32 < 2) || (y % 24 < 2);
        const fSeed = (fieldX * 11 + fieldY * 17) % 6;

        if (isCanal) {
          b02 = 0.09; b03 = 0.11; b04 = 0.05; b08 = 0.02; // Canal water
        } else if (isBorder) {
          b02 = 0.16; b03 = 0.19; b04 = 0.22; b08 = 0.24; // Earthen tracks
        } else {
          if (fSeed === 0) { // Lush Wheat
            b02 = 0.03; b03 = 0.08; b04 = 0.04; b08 = 0.52;
          } else if (fSeed === 1) { // Mustard
            b02 = 0.05; b03 = 0.14; b04 = 0.09; b08 = 0.44;
          } else if (fSeed === 2) { // Seedling
            b02 = 0.08; b03 = 0.11; b04 = 0.12; b08 = 0.26;
          } else if (fSeed === 3) { // Fallow / Dry field
            b02 = 0.18; b03 = 0.21; b04 = 0.25; b08 = 0.27;
          } else { // Irrigated soil
            b02 = 0.10; b03 = 0.12; b04 = 0.14; b08 = 0.18;
          }
        }

      } else if (scene.sceneType === 'port') {
        // Deep water, breakwater pier, cargo vessels, docks
        const isPier = (nx > 0.4 && nx < 0.46 && ny > 0.1 && ny < 0.85) ||
                       (ny > 0.8 && ny < 0.86 && nx > 0.3 && nx < 0.85);
        const isShip1 = (nx > 0.55 && nx < 0.68 && ny > 0.32 && ny < 0.38);
        const isShip2 = (nx > 0.72 && nx < 0.82 && ny > 0.55 && ny < 0.60);
        const isYard = nx < 0.35;

        if (isPier) {
          b02 = 0.20; b03 = 0.22; b04 = 0.24; b08 = 0.26; // Concrete wharf
        } else if (isShip1 || isShip2) {
          b02 = 0.18; b03 = 0.12; b04 = 0.35; b08 = 0.30; // Red ship hull
        } else if (isYard) {
          const yardGrid = (Math.floor(x / 8) + Math.floor(y / 6)) % 3;
          b02 = 0.15 + yardGrid * 0.06;
          b03 = 0.17 + yardGrid * 0.04;
          b04 = 0.20 + yardGrid * 0.08;
          b08 = 0.23 + yardGrid * 0.05;
        } else {
          // Ocean water with subtle swell
          const swell = Math.sin(nx * 30 + ny * 20) * 0.005;
          b02 = 0.07 + swell;
          b03 = 0.08 + swell;
          b04 = 0.04;
          b08 = 0.01;
        }

      } else if (scene.sceneType === 'forest') {
        // Tropical river meander, dense forest canopy, exposed ridge
        const riverCenter = 0.5 + 0.25 * Math.sin(ny * 6) * Math.cos(nx * 4);
        const isRiver = Math.abs(nx - riverCenter) < 0.045;
        const isSandbank = !isRiver && Math.abs(nx - riverCenter) < 0.075;
        const n = noise2D(nx * 12, ny * 12, seed);

        if (isRiver) {
          b02 = 0.08; b03 = 0.10; b04 = 0.05; b08 = 0.02; // River water
        } else if (isSandbank) {
          b02 = 0.20; b03 = 0.23; b04 = 0.26; b08 = 0.28; // River sand
        } else {
          // Dense tropical forest with canopy texture
          const canopyVar = (n - 0.5) * 0.08;
          b02 = Math.max(0.01, 0.03 + canopyVar * 0.2);
          b03 = Math.max(0.02, 0.06 + canopyVar * 0.4);
          b04 = Math.max(0.01, 0.03 + canopyVar * 0.2);
          b08 = Math.max(0.15, 0.45 + canopyVar); // Intense NIR
        }

      } else {
        // Synthetic benchmark (Siemens radial spokes, checkerboards, step edges)
        const cx = nx - 0.5;
        const cy = ny - 0.5;
        const angle = Math.atan2(cy, cx);
        const dist = Math.hypot(cx, cy);
        const isRadialSpoke = dist < 0.35 && (Math.floor(angle * 6) % 2 === 0);
        const isChecker = nx > 0.7 && ny > 0.7 && ((Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0);
        const isStepEdge = nx < 0.3 && ny < 0.3 && (nx + ny > 0.3);

        if (isRadialSpoke || isChecker || isStepEdge) {
          b02 = 0.30; b03 = 0.32; b04 = 0.35; b08 = 0.45;
        } else {
          b02 = 0.05; b03 = 0.08; b04 = 0.06; b08 = 0.12;
        }
      }

      // Add slight sensor noise
      const sensorNoise = (noise2D(nx * 50, ny * 50, seed + 99) - 0.5) * 0.004;
      refB02[idx] = Math.max(0.005, b02 + sensorNoise);
      refB03[idx] = Math.max(0.005, b03 + sensorNoise);
      refB04[idx] = Math.max(0.005, b04 + sensorNoise);
      refB08[idx] = Math.max(0.005, b08 + sensorNoise);
    }
  }

  // 2. Generate 10m Observed (Area Decimation of 4x4 blocks)
  const scale = 4;
  for (let by = 0; by < h; by += scale) {
    for (let bx = 0; bx < w; bx += scale) {
      let sumB02 = 0, sumB03 = 0, sumB04 = 0, sumB08 = 0;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const pIdx = (by + dy) * w + (bx + dx);
          sumB02 += refB02[pIdx];
          sumB03 += refB03[pIdx];
          sumB04 += refB04[pIdx];
          sumB08 += refB08[pIdx];
        }
      }
      const meanB02 = sumB02 / 16;
      const meanB03 = sumB03 / 16;
      const meanB04 = sumB04 / 16;
      const meanB08 = sumB08 / 16;

      // Broadcast back to block for 10m observed visualization
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const pIdx = (by + dy) * w + (bx + dx);
          obsB02[pIdx] = meanB02;
          obsB03[pIdx] = meanB03;
          obsB04[pIdx] = meanB04;
          obsB08[pIdx] = meanB08;
        }
      }
    }
  }

  // 3. Generate Bicubic Baseline (Gaussian/smooth blur on 10m observed)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      let sumB02 = 0, sumB03 = 0, sumB04 = 0, sumB08 = 0, weightSum = 0;
      const kernelSize = 3;
      for (let ky = -kernelSize; ky <= kernelSize; ky++) {
        for (let kx = -kernelSize; kx <= kernelSize; kx++) {
          const px = Math.max(0, Math.min(w - 1, x + kx * 2));
          const py = Math.max(0, Math.min(h - 1, y + ky * 2));
          const pIdx = py * w + px;
          const distSq = kx * kx + ky * ky;
          const weight = Math.exp(-distSq / 4);
          sumB02 += obsB02[pIdx] * weight;
          sumB03 += obsB03[pIdx] * weight;
          sumB04 += obsB04[pIdx] * weight;
          sumB08 += obsB08[pIdx] * weight;
          weightSum += weight;
        }
      }
      bicB02[idx] = sumB02 / weightSum;
      bicB03[idx] = sumB03 / weightSum;
      bicB04[idx] = sumB04 / weightSum;
      bicB08[idx] = sumB08 / weightSum;
    }
  }

  // 4. Generate AI Super-Resolution (EDSR-Lite: Bicubic Base + High-Frequency Learned Residual)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      // Reconstruct high-frequency detail from reference with slight realistic model variance (0.92 accuracy)
      const resB02 = (refB02[idx] - bicB02[idx]) * 0.94;
      const resB03 = (refB03[idx] - bicB03[idx]) * 0.94;
      const resB04 = (refB04[idx] - bicB04[idx]) * 0.93;
      const resB08 = (refB08[idx] - bicB08[idx]) * 0.91; // NIR band has slightly higher dynamic range variance

      srB02[idx] = Math.max(0.001, bicB02[idx] + resB02);
      srB03[idx] = Math.max(0.001, bicB03[idx] + resB03);
      srB04[idx] = Math.max(0.001, bicB04[idx] + resB04);
      srB08[idx] = Math.max(0.001, bicB08[idx] + resB08);

      // Uncertainty calculation:
      // Edge strength / Gradient magnitude
      const gx = Math.abs(refB04[idx] - refB04[Math.max(0, idx - 1)]);
      const gy = Math.abs(refB04[idx] - refB04[Math.max(0, idx - w)]);
      const edgeGrad = Math.hypot(gx, gy);

      // Ensemble D4: higher along sub-pixel transitions and textures
      uncEnsemble[idx] = Math.min(0.01, 0.0003 + edgeGrad * 0.045);

      // MC-Dropout: artificially small due to res_scale collapse (as documented in README §11)
      uncMcDropout[idx] = uncEnsemble[idx] * 0.00004;

      // Reprojection residual: difference between area downscale and 10m observed
      uncReprojection[idx] = Math.abs(srB04[idx] - obsB04[idx]) * 0.12;

      // SAM & Indices
      samSr[idx] = calculateSamDegrees(
        [srB02[idx], srB03[idx], srB04[idx], srB08[idx]],
        [refB02[idx], refB03[idx], refB04[idx], refB08[idx]]
      );

      samBic[idx] = calculateSamDegrees(
        [bicB02[idx], bicB03[idx], bicB04[idx], bicB08[idx]],
        [refB02[idx], refB03[idx], refB04[idx], refB08[idx]]
      );

      ndviSr[idx] = calculateNdvi(srB08[idx], srB04[idx]);
      ndwiSr[idx] = calculateNdwi(srB03[idx], srB08[idx]);
    }
  }

  return {
    width: w,
    height: h,
    observed: { b02: obsB02, b03: obsB03, b04: obsB04, b08: obsB08 },
    bicubic: { b02: bicB02, b03: bicB03, b04: bicB04, b08: bicB08 },
    sr: { b02: srB02, b03: srB03, b04: srB04, b08: srB08 },
    reference: { b02: refB02, b03: refB03, b04: refB04, b08: refB08 },
    uncertainty: {
      ensemble: uncEnsemble,
      mc_dropout: uncMcDropout,
      reprojection: uncReprojection,
    },
    samSrToRef: samSr,
    samBaselineToRef: samBic,
    ndviSr,
    ndwiSr,
  };
}

/**
 * Extract pixel probe info at coordinate (x, y)
 */
export function samplePixelProbe(
  raster: RasterData,
  scene: SatelliteScene,
  x: number,
  y: number
): PixelProbeInfo | null {
  const px = Math.floor(x);
  const py = Math.floor(y);
  if (px < 0 || px >= raster.width || py < 0 || py >= raster.height) {
    return null;
  }

  const idx = py * raster.width + px;
  const aff = scene.affine2_5m;
  const utmEasting = aff.c + px * aff.a + py * aff.b;
  const utmNorthing = aff.f + px * aff.d + py * aff.e;

  // Approximate Lat/Lng from UTM bounds
  const fracX = px / raster.width;
  const fracY = py / raster.height;
  const lat = 12.9716 + (1 - fracY) * 0.023;
  const lng = 77.5946 + fracX * 0.023;

  const obsB02 = raster.observed.b02[idx];
  const obsB03 = raster.observed.b03[idx];
  const obsB04 = raster.observed.b04[idx];
  const obsB08 = raster.observed.b08[idx];

  const bicB02 = raster.bicubic.b02[idx];
  const bicB03 = raster.bicubic.b03[idx];
  const bicB04 = raster.bicubic.b04[idx];
  const bicB08 = raster.bicubic.b08[idx];

  const srB02 = raster.sr.b02[idx];
  const srB03 = raster.sr.b03[idx];
  const srB04 = raster.sr.b04[idx];
  const srB08 = raster.sr.b08[idx];

  const refB02 = raster.reference.b02[idx];
  const refB03 = raster.reference.b03[idx];
  const refB04 = raster.reference.b04[idx];
  const refB08 = raster.reference.b08[idx];

  return {
    x: px,
    y: py,
    utmEasting,
    utmNorthing,
    lat,
    lng,
    observed: {
      B02: obsB02,
      B03: obsB03,
      B04: obsB04,
      B08: obsB08,
      ndvi: calculateNdvi(obsB08, obsB04),
      ndwi: calculateNdwi(obsB03, obsB08),
    },
    bicubic: {
      B02: bicB02,
      B03: bicB03,
      B04: bicB04,
      B08: bicB08,
      ndvi: calculateNdvi(bicB08, bicB04),
      ndwi: calculateNdwi(bicB03, bicB08),
    },
    sr: {
      B02: srB02,
      B03: srB03,
      B04: srB04,
      B08: srB08,
      ndvi: raster.ndviSr[idx],
      ndwi: raster.ndwiSr[idx],
    },
    reference: {
      B02: refB02,
      B03: refB03,
      B04: refB04,
      B08: refB08,
      ndvi: calculateNdvi(refB08, refB04),
      ndwi: calculateNdwi(refB03, refB08),
    },
    samDeg: raster.samSrToRef[idx],
    uncertainty: raster.uncertainty.ensemble[idx],
    reprojectionResidual: raster.uncertainty.reprojection[idx],
    predictedLandCover: classifyPixel(srB02, srB03, srB04, srB08),
  };
}
