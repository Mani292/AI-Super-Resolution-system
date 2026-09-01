import React, { useState } from 'react';
import { 
  Layers, 
  Eye, 
  Grid, 
  Sliders, 
  Activity, 
  Maximize2, 
  Compass, 
  Crosshair,
  Sparkles,
  Info,
  Maximize,
  Minimize2
} from 'lucide-react';
import { 
  SatelliteScene, 
  BandComposition, 
  ContrastStretchMode, 
  ViewMode, 
  UncertaintyMethod,
  PixelProbeInfo 
} from '../types/satellite';
import { RasterData, samplePixelProbe } from '../utils/rasterGenerator';
import { RasterCanvas } from './RasterCanvas';
import { SENTINEL_BANDS_METADATA, LAND_COVER_CLASSES, formatReflectance } from '../utils/spectralMath';

interface ImageryViewerProps {
  scene: SatelliteScene;
  raster: RasterData;
}

export const ImageryViewer: React.FC<ImageryViewerProps> = ({ scene, raster }) => {
  const [bandComposition, setBandComposition] = useState<BandComposition>('RGB');
  const [contrastStretch, setContrastStretch] = useState<ContrastStretchMode>('LINEAR_2_PERCENT');
  const [viewMode, setViewMode] = useState<ViewMode>('SPLIT_CURTAIN');
  const [splitPosition, setSplitPosition] = useState<number>(50);
  const [splitLeftMode, setSplitLeftMode] = useState<'observed' | 'bicubic'>('observed');
  const [splitRightMode, setSplitRightMode] = useState<'sr' | 'reference'>('sr');
  const [show10mGrid, setShow10mGrid] = useState<boolean>(true);
  const [uncertaintyMethod, setUncertaintyMethod] = useState<UncertaintyMethod>('ensemble');
  const [uncertaintyThreshold, setUncertaintyThreshold] = useState<number>(0.0025);
  const [hoverProbe, setHoverProbe] = useState<PixelProbeInfo | null>(null);
  const [loupeZoom, setLoupeZoom] = useState<number>(4);

  const handleMouseMove = (x: number, y: number) => {
    const probe = samplePixelProbe(raster, scene, x, y);
    setHoverProbe(probe);
  };

  const handleMouseLeave = () => {
    setHoverProbe(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* LEFT CONTROLS PANEL */}
      <div className="lg:col-span-3 space-y-4">
        {/* View Mode Selector */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <span className="flex items-center gap-1.5 text-blue-400">
              <Eye className="w-4 h-4" />
              Inspection Mode
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setViewMode('SPLIT_CURTAIN')}
              className={`p-2.5 rounded-xl text-left font-medium transition-all cursor-pointer border ${
                viewMode === 'SPLIT_CURTAIN'
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/40 shadow-sm'
                  : 'bg-zinc-950/70 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <div className="font-semibold text-zinc-100">Split Curtain</div>
              <div className="text-[10px] text-zinc-400">Interactive Slider</div>
            </button>

            <button
              onClick={() => setViewMode('QUAD_VIEW')}
              className={`p-2.5 rounded-xl text-left font-medium transition-all cursor-pointer border ${
                viewMode === 'QUAD_VIEW'
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/40 shadow-sm'
                  : 'bg-zinc-950/70 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <div className="font-semibold text-zinc-100">Quad View</div>
              <div className="text-[10px] text-zinc-400">4 Stages Matrix</div>
            </button>

            <button
              onClick={() => setViewMode('DIFFERENCE_MAP')}
              className={`p-2.5 rounded-xl text-left font-medium transition-all cursor-pointer border ${
                viewMode === 'DIFFERENCE_MAP'
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/40 shadow-sm'
                  : 'bg-zinc-950/70 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <div className="font-semibold text-zinc-100">Residual Error</div>
              <div className="text-[10px] text-zinc-400">|SR − Reference|</div>
            </button>

            <button
              onClick={() => setViewMode('SAM_HEATMAP')}
              className={`p-2.5 rounded-xl text-left font-medium transition-all cursor-pointer border ${
                viewMode === 'SAM_HEATMAP'
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/40 shadow-sm'
                  : 'bg-zinc-950/70 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <div className="font-semibold text-zinc-100">SAM Heatmap</div>
              <div className="text-[10px] text-zinc-400">Spectral Angle (°)</div>
            </button>

            <button
              onClick={() => setViewMode('NDVI_MAP')}
              className={`p-2.5 rounded-xl text-left font-medium transition-all cursor-pointer border ${
                viewMode === 'NDVI_MAP'
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/40 shadow-sm'
                  : 'bg-zinc-950/70 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <div className="font-semibold text-zinc-100">NDVI Index</div>
              <div className="text-[10px] text-zinc-400">Vegetation Biomass</div>
            </button>

            <button
              onClick={() => setViewMode('UNCERTAINTY_MAP')}
              className={`p-2.5 rounded-xl text-left font-medium transition-all cursor-pointer border ${
                viewMode === 'UNCERTAINTY_MAP'
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/40 shadow-sm'
                  : 'bg-zinc-950/70 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <div className="font-semibold text-zinc-100">Uncertainty</div>
              <div className="text-[10px] text-zinc-400">Model Instability</div>
            </button>
          </div>

          {/* Split Mode Pair Selection */}
          {viewMode === 'SPLIT_CURTAIN' && (
            <div className="pt-3 border-t border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Left (Observed):</span>
                <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  <button
                    onClick={() => setSplitLeftMode('observed')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] cursor-pointer transition-colors ${
                      splitLeftMode === 'observed' ? 'bg-zinc-800 text-blue-300 font-semibold shadow-xs' : 'text-zinc-400'
                    }`}
                  >
                    10m Sensor
                  </button>
                  <button
                    onClick={() => setSplitLeftMode('bicubic')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] cursor-pointer transition-colors ${
                      splitLeftMode === 'bicubic' ? 'bg-zinc-800 text-blue-300 font-semibold shadow-xs' : 'text-zinc-400'
                    }`}
                  >
                    2.5m Bicubic
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Right (Reconstruction):</span>
                <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  <button
                    onClick={() => setSplitRightMode('sr')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] cursor-pointer transition-colors ${
                      splitRightMode === 'sr' ? 'bg-zinc-800 text-blue-300 font-semibold shadow-xs' : 'text-zinc-400'
                    }`}
                  >
                    2.5m AI-SR
                  </button>
                  <button
                    onClick={() => setSplitRightMode('reference')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] cursor-pointer transition-colors ${
                      splitRightMode === 'reference' ? 'bg-zinc-800 text-blue-300 font-semibold shadow-xs' : 'text-zinc-400'
                    }`}
                  >
                    2.5m Ref GT
                  </button>
                </div>
              </div>

              {/* Split Position Slider */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                  <span>Split Divider Position</span>
                  <span className="text-blue-400 font-bold">{splitPosition}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={splitPosition}
                  onChange={(e) => setSplitPosition(Number(e.target.value))}
                  aria-label="Split Position Slider"
                  className="w-full accent-blue-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Multispectral Band Combinations */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <span className="flex items-center gap-1.5 text-blue-400">
              <Layers className="w-4 h-4" />
              Band Composition
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <label
              className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                bandComposition === 'RGB'
                  ? 'bg-blue-500/10 border-blue-500/40 text-blue-200'
                  : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="band"
                  checked={bandComposition === 'RGB'}
                  onChange={() => setBandComposition('RGB')}
                  className="accent-blue-500"
                />
                <div>
                  <div className="font-semibold text-zinc-100">True Color (RGB)</div>
                  <div className="text-[10px] text-zinc-400">B04 (Red), B03 (Green), B02 (Blue)</div>
                </div>
              </div>
              <span className="bento-tag text-[10px]">
                4-3-2
              </span>
            </label>

            <label
              className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                bandComposition === 'CIR'
                  ? 'bg-blue-500/10 border-blue-500/40 text-blue-200'
                  : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="band"
                  checked={bandComposition === 'CIR'}
                  onChange={() => setBandComposition('CIR')}
                  className="accent-blue-500"
                />
                <div>
                  <div className="font-semibold text-rose-300">Color Infrared (CIR)</div>
                  <div className="text-[10px] text-zinc-400">B08 (NIR) → Red, B04 → Green, B03 → Blue</div>
                </div>
              </div>
              <span className="bento-tag text-[10px]">
                8-4-3
              </span>
            </label>

            <label
              className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                bandComposition === 'AGRICULTURE'
                  ? 'bg-blue-500/10 border-blue-500/40 text-blue-200'
                  : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="band"
                  checked={bandComposition === 'AGRICULTURE'}
                  onChange={() => setBandComposition('AGRICULTURE')}
                  className="accent-blue-500"
                />
                <div>
                  <div className="font-semibold text-emerald-300">Agriculture Composite</div>
                  <div className="text-[10px] text-zinc-400">B08 (NIR), B04 (Red), B02 (Blue)</div>
                </div>
              </div>
              <span className="bento-tag text-[10px]">
                8-4-2
              </span>
            </label>
          </div>

          {/* Single Band Selector */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-1">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Single Band:</span>
            <div className="grid grid-cols-4 gap-1 flex-1">
              {(['B02_ONLY', 'B03_ONLY', 'B04_ONLY', 'B08_ONLY'] as BandComposition[]).map((b) => (
                <button
                  key={b}
                  onClick={() => setBandComposition(b)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-semibold cursor-pointer transition-colors ${
                    bandComposition === b ? 'bg-zinc-800 text-blue-400 border border-blue-500/40' : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  {b.replace('_ONLY', '')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Display Options & Overlays */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Sliders className="w-4 h-4" />
              Radiometric Controls
            </span>
          </div>

          {/* Contrast Stretch */}
          <div className="space-y-1.5">
            <label htmlFor="contrast-stretch-selector" className="text-[11px] text-zinc-400 font-medium">Contrast Stretch Algorithm</label>
            <select
              id="contrast-stretch-selector"
              value={contrastStretch}
              onChange={(e) => setContrastStretch(e.target.value as ContrastStretchMode)}
              aria-label="Select Contrast Stretch Algorithm"
              className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs rounded-xl px-3 py-2 cursor-pointer font-mono"
            >
              <option value="LINEAR_2_PERCENT">Linear 2% Cumulative (Standard Remote Sensing)</option>
              <option value="MIN_MAX">Min-Max Dynamic Scaling</option>
              <option value="HIST_EQUALIZATION">Histogram Equalization</option>
              <option value="RAW_DN">Raw Physical Reflectance (DN / 10000)</option>
            </select>
          </div>

          {/* 10m Pixel Grid Overlay */}
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs cursor-pointer hover:border-zinc-700 transition-colors">
            <span className="flex items-center gap-2 text-zinc-300 font-medium">
              <Grid className="w-3.5 h-3.5 text-blue-400" />
              10 m Physical Sensor Grid
            </span>
            <input
              type="checkbox"
              checked={show10mGrid}
              onChange={(e) => setShow10mGrid(e.target.checked)}
              className="accent-blue-500 rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* CENTER CANVAS & HUD */}
      <div className="lg:col-span-6 space-y-3 flex flex-col items-center">
        {/* Main Raster Visualizer Bento Tile */}
        <div className="relative w-full">
          {viewMode === 'QUAD_VIEW' ? (
            <div className="grid grid-cols-2 gap-3 bg-zinc-900 p-3 rounded-2xl border border-zinc-800 shadow-sm">
              {/* Tile 1: 10m Observed */}
              <div className="relative bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800">
                <div className="absolute top-2.5 left-2.5 z-10 bg-zinc-950/80 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-mono text-emerald-400 border border-emerald-500/30 font-semibold">
                  🛰️ 10 m Observed (Raw L2A)
                </div>
                <RasterCanvas
                  raster={raster}
                  bandComposition={bandComposition}
                  contrastStretch={contrastStretch}
                  viewMode="SPLIT_CURTAIN"
                  splitPosition={100}
                  splitLeftMode="observed"
                  splitRightMode="sr"
                  show10mGrid={show10mGrid}
                  uncertaintyMethod={uncertaintyMethod}
                  uncertaintyThreshold={uncertaintyThreshold}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                />
              </div>

              {/* Tile 2: 2.5m Bicubic Baseline */}
              <div className="relative bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800">
                <div className="absolute top-2.5 left-2.5 z-10 bg-zinc-950/80 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-mono text-amber-400 border border-amber-500/30 font-semibold">
                  📐 2.5 m Bicubic Baseline
                </div>
                <RasterCanvas
                  raster={raster}
                  bandComposition={bandComposition}
                  contrastStretch={contrastStretch}
                  viewMode="SPLIT_CURTAIN"
                  splitPosition={100}
                  splitLeftMode="bicubic"
                  splitRightMode="sr"
                  show10mGrid={show10mGrid}
                  uncertaintyMethod={uncertaintyMethod}
                  uncertaintyThreshold={uncertaintyThreshold}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                />
              </div>

              {/* Tile 3: 2.5m AI Super-Resolution */}
              <div className="relative bg-zinc-950 rounded-xl overflow-hidden border border-blue-500/50 shadow-md">
                <div className="absolute top-2.5 left-2.5 z-10 bg-zinc-950/90 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-mono text-blue-300 border border-blue-500/50 font-bold">
                  🧠 2.5 m AI-SR (EDSR-Lite)
                </div>
                <RasterCanvas
                  raster={raster}
                  bandComposition={bandComposition}
                  contrastStretch={contrastStretch}
                  viewMode="SPLIT_CURTAIN"
                  splitPosition={0}
                  splitLeftMode="observed"
                  splitRightMode="sr"
                  show10mGrid={show10mGrid}
                  uncertaintyMethod={uncertaintyMethod}
                  uncertaintyThreshold={uncertaintyThreshold}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                />
              </div>

              {/* Tile 4: Ground Truth Reference */}
              <div className="relative bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800">
                <div className="absolute top-2.5 left-2.5 z-10 bg-zinc-950/80 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-mono text-cyan-400 border border-cyan-500/30 font-semibold">
                  🎯 2.5 m Reference GT
                </div>
                <RasterCanvas
                  raster={raster}
                  bandComposition={bandComposition}
                  contrastStretch={contrastStretch}
                  viewMode="SPLIT_CURTAIN"
                  splitPosition={0}
                  splitLeftMode="observed"
                  splitRightMode="reference"
                  show10mGrid={show10mGrid}
                  uncertaintyMethod={uncertaintyMethod}
                  uncertaintyThreshold={uncertaintyThreshold}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                />
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-sm">
              {/* Active Mode Floating Badges */}
              <div className="absolute top-3.5 left-3.5 z-10 flex flex-wrap gap-2">
                <span className="bg-zinc-950/85 backdrop-blur border border-zinc-700/80 text-zinc-200 text-xs px-3 py-1.5 rounded-xl font-mono flex items-center gap-1.5 shadow-md">
                  <Compass className="w-3.5 h-3.5 text-blue-400" />
                  {scene.bounds.crsName} ({scene.bounds.epsg})
                </span>
                <span className="bg-zinc-950/85 backdrop-blur border border-blue-500/40 text-blue-300 text-xs px-3 py-1.5 rounded-xl font-mono font-semibold shadow-md">
                  GSD: 2.5 m / px (4×)
                </span>
              </div>

              {/* Split Curtain Labels */}
              {viewMode === 'SPLIT_CURTAIN' && (
                <>
                  <div className="absolute bottom-3.5 left-3.5 z-10 bg-zinc-950/85 backdrop-blur text-zinc-300 text-[11px] px-2.5 py-1.5 rounded-xl font-mono border border-zinc-700">
                    ← {splitLeftMode === 'observed' ? '10m Observed' : '2.5m Bicubic'}
                  </div>
                  <div className="absolute bottom-3.5 right-3.5 z-10 bg-zinc-950/85 backdrop-blur text-blue-300 text-[11px] px-2.5 py-1.5 rounded-xl font-mono border border-blue-500/50 font-semibold">
                    {splitRightMode === 'sr' ? '2.5m AI Super-Resolution' : '2.5m Reference'} →
                  </div>
                </>
              )}

              <RasterCanvas
                raster={raster}
                bandComposition={bandComposition}
                contrastStretch={contrastStretch}
                viewMode={viewMode}
                splitPosition={splitPosition}
                splitLeftMode={splitLeftMode}
                splitRightMode={splitRightMode}
                show10mGrid={show10mGrid}
                uncertaintyMethod={uncertaintyMethod}
                uncertaintyThreshold={uncertaintyThreshold}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              />
            </div>
          )}
        </div>

        {/* Dynamic Colorbar Legend for Special Heatmap Views */}
        {viewMode === 'SAM_HEATMAP' && (
          <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">SAM Spectral Angle (0° to 8°+):</span>
            <div className="flex items-center gap-2 flex-1 max-w-md mx-4">
              <span className="text-[10px] text-emerald-400">0.0° (Perfect)</span>
              <div className="h-2.5 flex-1 rounded-full bg-gradient-to-r from-zinc-950 via-yellow-400 to-rose-600 border border-zinc-700"></div>
              <span className="text-[10px] text-rose-400">8.0°+ (High Shift)</span>
            </div>
          </div>
        )}

        {viewMode === 'NDVI_MAP' && (
          <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">NDVI Ramp (-0.5 to +1.0):</span>
            <div className="flex items-center gap-2 flex-1 max-w-md mx-4">
              <span className="text-[10px] text-blue-400">Water &lt; 0</span>
              <div className="h-2.5 flex-1 rounded-full bg-gradient-to-r from-blue-700 via-amber-200 via-lime-500 to-emerald-950 border border-zinc-700"></div>
              <span className="text-[10px] text-emerald-400">Canopy &gt; 0.7</span>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT TELEMETRY & SUB-PIXEL PROBE */}
      <div className="lg:col-span-3 space-y-4">
        {/* Live Pixel Probe Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <span className="flex items-center gap-1.5 text-blue-400">
              <Crosshair className="w-4 h-4" />
              Sub-Pixel Probe
            </span>
            {hoverProbe ? (
              <span className="text-[11px] font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-500/30">
                ({hoverProbe.x}, {hoverProbe.y})
              </span>
            ) : (
              <span className="text-[10px] font-mono text-zinc-500">Hover canvas</span>
            )}
          </div>

          {hoverProbe ? (
            <div className="space-y-3">
              {/* Geospatial Coordinates */}
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 font-mono text-[11px] space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>UTM Easting:</span>
                  <span className="text-zinc-200 font-semibold">{hoverProbe.utmEasting.toFixed(1)} m E</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>UTM Northing:</span>
                  <span className="text-zinc-200 font-semibold">{hoverProbe.utmNorthing.toFixed(1)} m N</span>
                </div>
                <div className="flex justify-between text-zinc-400 pt-1 border-t border-zinc-800/80">
                  <span>Ground Resolution:</span>
                  <span className="text-blue-400 font-bold">2.5 m / pixel</span>
                </div>
              </div>

              {/* Land Cover Classification */}
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs">
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-semibold">
                  Predicted Surface Class:
                </div>
                <div className="flex items-center gap-2 font-bold" style={{ color: LAND_COVER_CLASSES[hoverProbe.predictedLandCover].hex }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: LAND_COVER_CLASSES[hoverProbe.predictedLandCover].hex }}></span>
                  {LAND_COVER_CLASSES[hoverProbe.predictedLandCover].name}
                </div>
              </div>

              {/* 4-Band Reflectance Comparison Table */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                  Band Reflectance
                </div>
                <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800 font-mono text-[11px] space-y-2">
                  {SENTINEL_BANDS_METADATA.map((band) => {
                    const obsVal = hoverProbe.observed[band.id];
                    const srVal = hoverProbe.sr[band.id];
                    const refVal = hoverProbe.reference[band.id];

                    return (
                      <div key={band.id} className="space-y-1">
                        <div className="flex items-center justify-between text-zinc-400">
                          <span className="font-bold" style={{ color: band.color }}>
                            {band.id}:
                          </span>
                          <span className="text-zinc-200">
                            SR: <strong className="text-zinc-100">{formatReflectance(srVal)}</strong>
                            <span className="text-[10px] text-zinc-400 ml-1.5">Ref: {formatReflectance(refVal)}</span>
                          </span>
                        </div>
                        {/* Comparison Progress Bar */}
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden flex">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, srVal * 200)}%`,
                              backgroundColor: band.color,
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Spectral Indices & SAM Error */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-400">NDVI</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">
                    {hoverProbe.sr.ndvi.toFixed(3)}
                  </div>
                </div>

                <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-400">NDWI</div>
                  <div className="text-sm font-bold text-blue-400 mt-0.5">
                    {hoverProbe.sr.ndwi.toFixed(3)}
                  </div>
                </div>

                <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-400">SAM Error</div>
                  <div className="text-sm font-bold text-cyan-300 mt-0.5">
                    {hoverProbe.samDeg.toFixed(2)}°
                  </div>
                </div>

                <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-400">Uncertainty</div>
                  <div className="text-sm font-bold text-amber-300 mt-0.5">
                    {(hoverProbe.uncertainty * 1000).toFixed(2)} ×10⁻³
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-950 rounded-xl p-6 text-center border border-dashed border-zinc-800 text-zinc-500 space-y-2">
              <Crosshair className="w-8 h-8 mx-auto text-zinc-700 animate-pulse" />
              <p className="text-xs">
                Move cursor over the satellite canvas to inspect sub-pixel radiometry, SAM angles, and spectral indices.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
