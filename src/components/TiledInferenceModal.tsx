import React, { useEffect, useState } from 'react';
import { 
  X, 
  Cpu, 
  CheckCircle2, 
  Layers, 
  Sparkles, 
  Compass, 
  HardDrive,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { SatelliteScene } from '../types/satellite';

interface TiledInferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: SatelliteScene;
}

export const TiledInferenceModal: React.FC<TiledInferenceModalProps> = ({
  isOpen,
  onClose,
  scene,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [progressPct, setProgressPct] = useState<number>(0);

  const steps = [
    { title: 'Windowed Reading', desc: 'Reading Sentinel-2 10m L2A raster with 16px border context padding' },
    { title: 'EDSR-Lite Residual Synthesis', desc: 'Executing 4× PixelShuffle sub-pixel forward pass across 64 patches' },
    { title: 'Non-Overlapping Block Writes', desc: 'Direct-to-disk raster write with 0-accumulator memory footprint' },
    { title: 'D4 Ensemble Uncertainty Estimation', desc: 'Evaluating 8 dihedral symmetry transforms for model variance' },
    { title: 'Automated Geospatial Validation', desc: 'Verifying EPSG:32643 CRS, origin preservation, and affine scaling' },
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setProgressPct(0);
      return;
    }

    const interval = setInterval(() => {
      setProgressPct((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const next = prev + 5;
        const stepIdx = Math.min(steps.length - 1, Math.floor((next / 100) * steps.length));
        setCurrentStep(stepIdx);
        return next;
      });
    }, 90);

    return () => clearInterval(interval);
  }, [isOpen, steps.length]);

  if (!isOpen) return null;

  const isComplete = progressPct >= 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100 uppercase tracking-wider">
                Tiled Super-Resolution Inference Pipeline
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                {scene.id}.tif (10m → 2.5m GeoTIFF)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-zinc-400">Pipeline Execution Progress</span>
            <span className="text-blue-400 font-bold">{progressPct}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-blue-500 transition-all duration-150"
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>
        </div>

        {/* Pipeline Step List */}
        <div className="space-y-2.5">
          {steps.map((step, idx) => {
            const isDone = idx < currentStep || isComplete;
            const isCurrent = idx === currentStep && !isComplete;

            return (
              <div
                key={step.title}
                className={`p-3 rounded-xl border text-xs transition-all ${
                  isDone
                    ? 'bg-zinc-950/70 border-zinc-800 text-zinc-300'
                    : isCurrent
                    ? 'bg-blue-950/30 border-blue-500/40 text-blue-200 shadow-xs'
                    : 'bg-zinc-950/30 border-zinc-900 text-zinc-500'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-2.5">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <RotateCcw className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-500 shrink-0">
                        {idx + 1}
                      </span>
                    )}
                    <span className={isDone ? 'text-zinc-200' : isCurrent ? 'text-blue-200 font-bold' : 'text-zinc-400'}>{step.title}</span>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {isDone ? 'COMPLETED' : isCurrent ? 'RUNNING' : 'QUEUED'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5 pl-6.5">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Completion Action */}
        <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            onClick={onClose}
            className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              isComplete
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {isComplete ? 'View Super-Resolved Product' : 'Close Monitor'}
          </button>
        </div>
      </div>
    </div>
  );
};
