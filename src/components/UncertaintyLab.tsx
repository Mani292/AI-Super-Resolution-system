import React, { useState } from 'react';
import { 
  Sparkles, 
  AlertOctagon, 
  HelpCircle, 
  Info, 
  RotateCw, 
  Sliders, 
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { SatelliteScene, UncertaintyMethod } from '../types/satellite';
import { RasterData } from '../utils/rasterGenerator';
import { RasterCanvas } from './RasterCanvas';

interface UncertaintyLabProps {
  scene: SatelliteScene;
  raster: RasterData;
}

export const UncertaintyLab: React.FC<UncertaintyLabProps> = ({ scene, raster }) => {
  const [selectedMethod, setSelectedMethod] = useState<UncertaintyMethod>('ensemble');
  const [threshold, setThreshold] = useState<number>(0.0025);
  const [showMaskOnly, setShowMaskOnly] = useState<boolean>(false);

  // Method comparisons from README §11 table
  const methodStats = {
    ensemble: {
      name: 'Ensemble D4 (Recommended Default)',
      type: 'Geometric / Test-Time Augmentation Symmetries',
      mean: '7.0 × 10⁻⁴',
      p95: '1.7 × 10⁻³',
      max: '4.5 × 10⁻³',
      status: 'Active & Robust',
      notes: 'Measures output sensitivity to 8 dihedral rotations and flips. The mean prediction is also higher quality.',
    },
    mc_dropout: {
      name: 'Monte Carlo Dropout (Epistemic)',
      type: 'Stochastic Sub-network Disagreement',
      mean: '1.6 × 10⁻⁸',
      p95: '3.0 × 10⁻⁸',
      max: '3.0 × 10⁻⁸',
      status: 'Near-zero (Degenerate on ResNet)',
      notes: 'Collapses numerically because dropout sits inside residual blocks scaled by res_scale (0.1). Residual branch is small, so perturbation barely moves the output.',
    },
    reprojection: {
      name: 'Reprojection Residual',
      type: 'Observation-Anchored Decimation L1',
      mean: '1.4 × 10⁻³',
      p95: '3.8 × 10⁻³',
      max: '1.7 × 10⁻²',
      status: 'Observation Anchored',
      notes: 'Area-decimates the 2.5m output back to 10m and subtracts the observed input. Directly detects severe radiometric drift.',
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Uncertainty Estimation & Hallucination Guardrails
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Quantifying model instability under geometric perturbations and reprojection consistency against real sensor observations.
          </p>
        </div>

        {/* Method Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setSelectedMethod('ensemble')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              selectedMethod === 'ensemble'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ensemble D4 (Default)
          </button>
          <button
            onClick={() => setSelectedMethod('mc_dropout')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              selectedMethod === 'mc_dropout'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            MC-Dropout (Epistemic)
          </button>
          <button
            onClick={() => setSelectedMethod('reprojection')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              selectedMethod === 'reprojection'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Reprojection Residual
          </button>
        </div>
      </div>

      {/* Critical Scientific Disclaimer on Uncertainty */}
      <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
          <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
          How to Read the Uncertainty Heatmap:
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The uncertainty map is a <strong>relative indicator of model instability</strong> in reflectance units—it is <strong>never a calibrated probability</strong>. High uncertainty is a reliable warning that the model&apos;s answer is fragile (e.g. fine texture boundaries, specular glints, road-building interfaces). Low uncertainty is not a proof of correctness, as neural networks can occasionally be confidently wrong.
        </p>
      </div>

      {/* Main Split: Interactive Visualizer + Quantitative Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visualizer Panel */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Live Uncertainty Heatmap ({methodStats[selectedMethod].name})
            </h3>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
              Threshold: {threshold.toFixed(4)}
            </span>
          </div>

          <div className="relative aspect-square max-w-[500px] mx-auto bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
            <RasterCanvas
              raster={raster}
              bandComposition="RGB"
              contrastStretch="LINEAR_2_PERCENT"
              viewMode="UNCERTAINTY_MAP"
              splitPosition={50}
              splitLeftMode="observed"
              splitRightMode="sr"
              show10mGrid={true}
              uncertaintyMethod={selectedMethod}
              uncertaintyThreshold={threshold}
              onMouseMove={() => {}}
              onMouseLeave={() => {}}
            />
          </div>

          {/* Threshold Filter Slider */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-300 font-mono">
              <span>Filter / Flag High-Risk Inferred Pixels:</span>
              <span className="text-rose-400 font-bold">{threshold.toFixed(4)} reflectance units</span>
            </div>
            <input
              type="range"
              min="0.0005"
              max="0.0050"
              step="0.0001"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              aria-label="Uncertainty Flagging Threshold Slider"
              className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.0005 (Conservative Mask)</span>
              <span>0.0050 (Permissive)</span>
            </div>
          </div>
        </div>

        {/* Uncertainty Stats & Method Audit Panel */}
        <div className="lg:col-span-5 space-y-4">
          {/* Method Characteristics Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-200">
              Active Method: <span className="text-amber-300">{methodStats[selectedMethod].name}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">Mean Spread</div>
                <div className="text-sm font-bold text-white mt-0.5">{methodStats[selectedMethod].mean}</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">95th Percentile (P95)</div>
                <div className="text-sm font-bold text-amber-300 mt-0.5">{methodStats[selectedMethod].p95}</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">Max Error Spike</div>
                <div className="text-sm font-bold text-rose-400 mt-0.5">{methodStats[selectedMethod].max}</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">Calibrated Flag</div>
                <div className="text-sm font-bold text-slate-400 mt-0.5">false (honest)</div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-2.5">
              {methodStats[selectedMethod].notes}
            </p>
          </div>

          {/* Technical Deep Dive: Why Ensemble D4 vs MC-Dropout */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400" />
              Architectural Analysis: Why Ensemble is the Default
            </h4>
            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                In EDSR-Lite, the model learns a <strong>global residual</strong> added to a bicubic base:
              </p>
              <div className="bg-slate-950 p-2 rounded font-mono text-[11px] text-cyan-300 border border-slate-800">
                I_SR = Bicubic(I_LR) + ResidualNetwork(I_LR)
              </div>
              <p>
                Because the residual branch output is scaled by <code className="text-amber-300">res_scale = 0.1</code>, MC-dropout perturbations barely alter the resulting image (spread ~ 10⁻⁸). A naive operator might mistake this for &quot;total model certainty&quot;, when it actually represents a measurement collapse.
              </p>
              <p className="text-emerald-400 font-medium">
                The D4 dihedral ensemble tests true rotational invariance across the 8 orientations of the square tile, providing a reliable measure of geometric ambiguity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
