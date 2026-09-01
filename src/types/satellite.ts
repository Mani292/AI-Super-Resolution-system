/**
 * SIH 2026 · PS-142 Satellite Super-Resolution Data Types
 */

export type BandId = 'B02' | 'B03' | 'B04' | 'B08';

export interface BandMetadata {
  id: BandId;
  name: string;
  wavelengthNm: number;
  centerWavelength: string;
  resolutionOriginalM: number;
  description: string;
  color: string;
}

export type BandComposition = 
  | 'RGB'          // B04 (Red), B03 (Green), B02 (Blue) - Natural Color
  | 'CIR'          // B08 (NIR), B04 (Red), B03 (Green) - Color Infrared (Vegetation)
  | 'AGRICULTURE'  // B08 (NIR), B04 (Red), B02 (Blue) - Crop Health
  | 'B02_ONLY'     // Blue band
  | 'B03_ONLY'     // Green band
  | 'B04_ONLY'     // Red band
  | 'B08_ONLY';    // NIR band

export type ContrastStretchMode = 
  | 'LINEAR_2_PERCENT'
  | 'MIN_MAX'
  | 'HIST_EQUALIZATION'
  | 'RAW_DN';

export type ViewMode = 
  | 'SPLIT_CURTAIN'
  | 'QUAD_VIEW'
  | 'DIFFERENCE_MAP'
  | 'SAM_HEATMAP'
  | 'NDVI_MAP'
  | 'NDWI_MAP'
  | 'UNCERTAINTY_MAP';

export type EvaluationProtocol = 
  | 'reduced_resolution' // Wald's protocol (10m degraded to 40m, SR to 10m, scored against 10m)
  | 'full_resolution'    // Against real co-registered sub-3m reference (Planet/WorldView)
  | 'reference_free';    // Quality indicators only (no ground truth)

export type UncertaintyMethod = 
  | 'ensemble'     // D4 dihedral group (8 symmetries) TTA variance (Default & Recommended)
  | 'mc_dropout'   // Epistemic uncertainty (collapses with small residual scaling)
  | 'reprojection';// L1 difference between decimated 2.5m output and real 10m input

export interface AffineTransform {
  a: number; // Pixel width in map units (GSD X)
  b: number; // Row rotation
  c: number; // Upper-left X (Easting)
  d: number; // Column rotation
  e: number; // Pixel height in map units (GSD Y, negative for north-up)
  f: number; // Upper-left Y (Northing)
}

export interface GeospatialBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  epsg: number;
  crsName: string;
  utmZone: string;
}

export interface MetricComparison {
  psnr: { baseline: number; sr: number; delta: number };
  ssim: { baseline: number; sr: number; delta: number };
  rmse: { baseline: number; sr: number; delta: number };
  samDeg: { baseline: number; sr: number; delta: number }; // Spectral Angle Mapper in degrees
  ergas: { baseline: number; sr: number; delta: number };  // Wald 2000 dimensionless index
  perBandRmse: {
    B02: { baseline: number; sr: number; delta: number };
    B03: { baseline: number; sr: number; delta: number };
    B04: { baseline: number; sr: number; delta: number };
    B08: { baseline: number; sr: number; delta: number };
  };
}

export type LandCoverClass = 'water' | 'forest' | 'agriculture' | 'urban' | 'barren';

export interface LandCoverClassInfo {
  id: LandCoverClass;
  name: string;
  color: string;
  description: string;
  spectralSignature: { B02: number; B03: number; B04: number; B08: number };
}

export interface LandCoverMetrics {
  overallAccuracy: { baseline: number; sr: number; delta: number };
  meanIou: { baseline: number; sr: number; delta: number };
  classIou: Record<LandCoverClass, { baseline: number; sr: number; delta: number }>;
  classAreaDistribution: Record<LandCoverClass, { baselinePct: number; srPct: number; refPct: number }>;
  confusionMatrix: {
    classes: LandCoverClass[];
    matrix: number[][]; // [predicted][actual]
  };
}

export interface UncertaintyStats {
  method: UncertaintyMethod;
  mean: number;
  p95: number;
  max: number;
  reprojectionError: number;
  isCalibrated: boolean;
  notes: string;
  isDegenerate: boolean;
}

export interface PixelProbeInfo {
  x: number;
  y: number;
  utmEasting: number;
  utmNorthing: number;
  lat: number;
  lng: number;
  observed: { B02: number; B03: number; B04: number; B08: number; ndvi: number; ndwi: number };
  bicubic: { B02: number; B03: number; B04: number; B08: number; ndvi: number; ndwi: number };
  sr: { B02: number; B03: number; B04: number; B08: number; ndvi: number; ndwi: number };
  reference: { B02: number; B03: number; B04: number; B08: number; ndvi: number; ndwi: number };
  samDeg: number;
  uncertainty: number;
  reprojectionResidual: number;
  predictedLandCover: LandCoverClass;
}

export interface SatelliteScene {
  id: string;
  title: string;
  category: 'Urban Infrastructure' | 'Precision Agriculture' | 'Maritime & Port' | 'River Basin / Forest' | 'Synthetic Benchmark';
  location: string;
  dateAcquired: string;
  cloudCoverPct: number;
  description: string;
  bounds: GeospatialBounds;
  sourceResolutionM: number;
  targetResolutionM: number;
  width: number;
  height: number;
  scaleFactor: number;
  affine10m: AffineTransform;
  affine2_5m: AffineTransform;
  metrics: MetricComparison;
  uncertainty: UncertaintyStats;
  landCover: LandCoverMetrics;
  // Procedural generator seed or raster matrix descriptors
  sceneType: 'urban' | 'agri' | 'port' | 'forest' | 'synthetic';
}
