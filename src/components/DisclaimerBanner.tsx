import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ShieldCheck, Eye, Sparkles, HelpCircle } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-900 border border-zinc-800 rounded-2xl text-zinc-300 text-xs p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-100 text-xs uppercase tracking-wider">
                Scientific Notice & Provenance Transparency
              </span>
              <span className="bento-tag bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] py-0.5 px-2">
                4× Super-Resolution Mapping
              </span>
            </div>
            <p className="text-zinc-400 mt-1 leading-relaxed">
              Super-resolved imagery contains AI-inferred sub-pixel information and should not be interpreted as direct high-resolution observation without quantitative validation.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Collapse scientific principles" : "Expand scientific principles"}
          className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 shrink-0 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 transition-colors cursor-pointer text-xs"
        >
          {isOpen ? (
            <>
              Less <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              Protocol & Principles <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-zinc-300">
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
            <div className="font-semibold text-emerald-400 flex items-center gap-1.5 text-xs">
              <Eye className="w-3.5 h-3.5" />
              🛰️ Observed (10 m)
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Information genuinely recorded by Sentinel-2 L2A detectors. Every low-frequency radiometric value is physically anchored to genuine surface reflectance.
            </p>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
            <div className="font-semibold text-blue-400 flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              🧠 Reconstructed (2.5 m)
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Detail below the sensor&apos;s physical resolving power, predicted by EDSR-Lite residual branch from spatial-spectral priors. Plausible sub-pixel structure, not ground observation.
            </p>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
            <div className="font-semibold text-amber-400 flex items-center gap-1.5 text-xs">
              <HelpCircle className="w-3.5 h-3.5" />
              ❓ Uncertain (Instability Map)
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Relative indicator of model variance under D4 test-time dihedral rotations. Highlights hallucination-prone boundaries or ambiguous texture transitions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
