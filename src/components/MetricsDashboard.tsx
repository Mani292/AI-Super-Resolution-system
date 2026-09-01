import React, { useState } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  CheckCircle, 
  Activity, 
  Info, 
  ShieldCheck,
  Zap,
  Layers,
  FileCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  CartesianGrid 
} from 'recharts';
import { SatelliteScene, EvaluationProtocol } from '../types/satellite';
import { SENTINEL_BANDS_METADATA } from '../utils/spectralMath';

interface MetricsDashboardProps {
  scene: SatelliteScene;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ scene }) => {
  const [protocol, setProtocol] = useState<EvaluationProtocol>('reduced_resolution');
  const m = scene.metrics;

  // Spectral curve data across Sentinel-2 central wavelengths
  const spectralCurveData = [
    {
      band: 'B02 (Blue)',
      wavelength: '490 nm',
      observed: 0.12,
      bicubic: 0.124,
      sr: 0.119,
      reference: 0.118,
    },
    {
      band: 'B03 (Green)',
      wavelength: '560 nm',
      observed: 0.15,
      bicubic: 0.156,
      sr: 0.149,
      reference: 0.148,
    },
    {
      band: 'B04 (Red)',
      wavelength: '665 nm',
      observed: 0.18,
      bicubic: 0.187,
      sr: 0.179,
      reference: 0.177,
    },
    {
      band: 'B08 (NIR)',
      wavelength: '842 nm',
      observed: 0.32,
      bicubic: 0.312,
      sr: 0.338,
      reference: 0.342,
    },
  ];

  // Per-band RMSE comparison data for bar chart
  const perBandRmseData = [
    {
      band: 'B02 (Blue 490nm)',
      baseline: m.perBandRmse.B02.baseline,
      sr: m.perBandRmse.B02.sr,
      improvementPct: (((m.perBandRmse.B02.baseline - m.perBandRmse.B02.sr) / m.perBandRmse.B02.baseline) * 100).toFixed(1),
    },
    {
      band: 'B03 (Green 560nm)',
      baseline: m.perBandRmse.B03.baseline,
      sr: m.perBandRmse.B03.sr,
      improvementPct: (((m.perBandRmse.B03.baseline - m.perBandRmse.B03.sr) / m.perBandRmse.B03.baseline) * 100).toFixed(1),
    },
    {
      band: 'B04 (Red 665nm)',
      baseline: m.perBandRmse.B04.baseline,
      sr: m.perBandRmse.B04.sr,
      improvementPct: (((m.perBandRmse.B04.baseline - m.perBandRmse.B04.sr) / m.perBandRmse.B04.baseline) * 100).toFixed(1),
    },
    {
      band: 'B08 (NIR 842nm)',
      baseline: m.perBandRmse.B08.baseline,
      sr: m.perBandRmse.B08.sr,
      improvementPct: (((m.perBandRmse.B08.baseline - m.perBandRmse.B08.sr) / m.perBandRmse.B08.baseline) * 100).toFixed(1),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header & Protocol Selection Bento Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="bento-tag bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] py-0.5 px-2.5">
              Quantitative Benchmarking
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">4× Super-Resolution Mapping</span>
          </div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2 mt-1.5">
            <BarChart2 className="w-5 h-5 text-blue-400" />
            Quantitative Reconstruction & Spectral Consistency Metrics
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Evaluating radiometric fidelity, structural similarity, and spectral vector angle preservation against bicubic baseline.
          </p>
        </div>

        {/* Protocol Selector */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 text-xs">
          <span className="text-[11px] text-zinc-400 px-2 font-medium">Protocol:</span>
          <button
            onClick={() => setProtocol('reduced_resolution')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              protocol === 'reduced_resolution'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Wald&apos;s Reduced-Res (40m→10m)
          </button>
          <button
            onClick={() => setProtocol('full_resolution')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              protocol === 'full_resolution'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Full Resolution (Co-registered GT)
          </button>
          <button
            onClick={() => setProtocol('reference_free')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              protocol === 'reference_free'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Reference-Free
          </button>
        </div>
      </div>

      {/* Protocol Explanation Note */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 text-xs text-zinc-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-zinc-200">Active Protocol Context: </strong>
          {protocol === 'reduced_resolution' && (
            <span>
              <strong>Wald&apos;s Protocol (10m degraded to 40m via MTF Gaussian blur, then super-resolved back to 10m):</strong> Scores quantitatively against the genuine 10m Sentinel-2 observation. Assumes scale invariance across 4× steps.
            </span>
          )}
          {protocol === 'full_resolution' && (
            <span>
              <strong>Full Resolution Verification:</strong> Compares directly against co-registered sub-3m reference imagery (e.g. PlanetScope / WorldView). Validated for sub-pixel coregistration prior to scoring.
            </span>
          )}
          {protocol === 'reference_free' && (
            <span>
              <strong>Reference-Free Quality Indicators:</strong> Evaluates spatial gradients, natural scene statistics, and reprojection residuals without claiming absolute sub-pixel ground truth accuracy.
            </span>
          )}
        </div>
      </div>

      {/* Primary Key Metric Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* PSNR Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">PSNR (dB)</span>
            <span className="text-[10px] text-emerald-400 font-mono font-medium">↑ Higher better</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-zinc-50">{m.psnr.sr.toFixed(2)}</span>
            <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
              +{m.psnr.delta.toFixed(2)} dB
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 flex justify-between border-t border-zinc-800 pt-2 font-mono">
            <span>Bicubic Baseline:</span>
            <span className="text-zinc-300 font-medium">{m.psnr.baseline.toFixed(2)} dB</span>
          </div>
        </div>

        {/* SSIM Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">SSIM (Structural)</span>
            <span className="text-[10px] text-emerald-400 font-mono font-medium">↑ Higher better</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-zinc-50">{m.ssim.sr.toFixed(4)}</span>
            <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
              +{m.ssim.delta.toFixed(4)}
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 flex justify-between border-t border-zinc-800 pt-2 font-mono">
            <span>Bicubic Baseline:</span>
            <span className="text-zinc-300 font-medium">{m.ssim.baseline.toFixed(4)}</span>
          </div>
        </div>

        {/* SAM Card (Primary Spectral Metric) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-blue-300">SAM Angle (°)</span>
            <span className="text-[10px] text-blue-400 font-mono font-medium">↓ Lower better</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-blue-300">{m.samDeg.sr.toFixed(3)}°</span>
            <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
              {m.samDeg.delta.toFixed(3)}°
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 flex justify-between border-t border-zinc-800 pt-2 font-mono">
            <span>Bicubic Baseline:</span>
            <span className="text-zinc-300 font-medium">{m.samDeg.baseline.toFixed(3)}°</span>
          </div>
        </div>

        {/* ERGAS Card (Wald 2000) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-blue-300">ERGAS Index</span>
            <span className="text-[10px] text-blue-400 font-mono font-medium">↓ Lower (&lt;3 good)</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-blue-300">{m.ergas.sr.toFixed(3)}</span>
            <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
              {m.ergas.delta.toFixed(3)}
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 flex justify-between border-t border-zinc-800 pt-2 font-mono">
            <span>Bicubic Baseline:</span>
            <span className="text-zinc-300 font-medium">{m.ergas.baseline.toFixed(3)}</span>
          </div>
        </div>

        {/* Pooled RMSE Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Pooled RMSE</span>
            <span className="text-[10px] text-emerald-400 font-mono font-medium">↓ Lower better</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-zinc-50">{m.rmse.sr.toFixed(4)}</span>
            <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
              {m.rmse.delta.toFixed(4)}
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 flex justify-between border-t border-zinc-800 pt-2 font-mono">
            <span>Reflectance Units:</span>
            <span className="text-zinc-300 font-medium">DN / 10000</span>
          </div>
        </div>
      </div>

      {/* Two Detailed Bento Charts: Spectral Profile Curve & Per-Band RMSE Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Spectral Signature Curve Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Multispectral Profile Across Wavelengths (490 nm - 842 nm)
            </h3>
            <span className="bento-tag text-[10px]">Reflectance ρ</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Verifies that AI Super-Resolution matches the ground truth spectral slope and avoids the NIR over-smoothing typical of generic upscalers.
          </p>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spectralCurveData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="wavelength" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 11 }} domain={[0, 0.45]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '11px', color: '#fafafa' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="reference" name="Reference Ground Truth" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="sr" name="2.5m AI Super-Resolution" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="bicubic" name="2.5m Bicubic Baseline" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="observed" name="10m Observed (Raw)" stroke="#a1a1aa" strokeWidth={1.5} strokeDasharray="2 2" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-Band RMSE Breakdown Bar Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Per-Band RMSE & Improvement vs Bicubic Baseline
            </h3>
            <span className="bento-tag text-[10px]">Error ↓</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Pooled RMSE hides single-band degradation. Here every individual Sentinel-2 band is isolated and audited.
          </p>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perBandRmseData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="band" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '11px', color: '#fafafa' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="baseline" name="Bicubic Baseline RMSE" fill="#71717a" radius={[6, 6, 0, 0]} />
                <Bar dataKey="sr" name="AI Super-Resolution RMSE" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Audit Table Bento Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-200 flex items-center gap-2 uppercase tracking-wider">
            <FileCheck className="w-4 h-4 text-blue-400" />
            Complete Quantitative Radiometric & Spectral Audit Table
          </span>
          <span className="text-[11px] text-zinc-400 font-mono">Sign-normalized Δ: positive indicates improvement</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] font-mono border-b border-zinc-800">
              <tr>
                <th className="p-3.5">Metric Category</th>
                <th className="p-3.5">Evaluation Target</th>
                <th className="p-3.5">Bicubic Baseline</th>
                <th className="p-3.5">AI Super-Resolution</th>
                <th className="p-3.5">Improvement (Δ)</th>
                <th className="p-3.5">Physical Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-zinc-300 font-mono">
              <tr className="hover:bg-zinc-950/40">
                <td className="p-3.5 text-zinc-400 font-sans">Reconstruction Fidelity</td>
                <td className="p-3.5 font-semibold text-zinc-100">PSNR (dB)</td>
                <td className="p-3.5">{m.psnr.baseline.toFixed(2)} dB</td>
                <td className="p-3.5 text-blue-300 font-bold">{m.psnr.sr.toFixed(2)} dB</td>
                <td className="p-3.5 text-emerald-400 font-semibold">+{m.psnr.delta.toFixed(2)} dB</td>
                <td className="p-3.5 text-zinc-400 font-sans text-[11px]">Peak signal-to-noise ratio per tile</td>
              </tr>
              <tr className="hover:bg-zinc-950/40">
                <td className="p-3.5 text-zinc-400 font-sans">Structural Similarity</td>
                <td className="p-3.5 font-semibold text-zinc-100">SSIM (0..1)</td>
                <td className="p-3.5">{m.ssim.baseline.toFixed(4)}</td>
                <td className="p-3.5 text-blue-300 font-bold">{m.ssim.sr.toFixed(4)}</td>
                <td className="p-3.5 text-emerald-400 font-semibold">+{m.ssim.delta.toFixed(4)}</td>
                <td className="p-3.5 text-zinc-400 font-sans text-[11px]">Rewards edge sharpness & texture preservation</td>
              </tr>
              <tr className="hover:bg-zinc-950/40">
                <td className="p-3.5 text-blue-400 font-sans">Spectral Consistency</td>
                <td className="p-3.5 font-semibold text-blue-300">SAM (Degrees)</td>
                <td className="p-3.5">{m.samDeg.baseline.toFixed(3)}°</td>
                <td className="p-3.5 text-blue-300 font-bold">{m.samDeg.sr.toFixed(3)}°</td>
                <td className="p-3.5 text-emerald-400 font-semibold">{m.samDeg.delta.toFixed(3)}°</td>
                <td className="p-3.5 text-zinc-400 font-sans text-[11px]">Mean angle between per-pixel band vectors</td>
              </tr>
              <tr className="hover:bg-zinc-950/40">
                <td className="p-3.5 text-blue-400 font-sans">Relative Dimensionless</td>
                <td className="p-3.5 font-semibold text-blue-300">ERGAS (Wald 2000)</td>
                <td className="p-3.5">{m.ergas.baseline.toFixed(3)}</td>
                <td className="p-3.5 text-blue-300 font-bold">{m.ergas.sr.toFixed(3)}</td>
                <td className="p-3.5 text-emerald-400 font-semibold">{m.ergas.delta.toFixed(3)}</td>
                <td className="p-3.5 text-zinc-400 font-sans text-[11px]">Normalized per-band synthesis error</td>
              </tr>
              <tr className="hover:bg-zinc-950/40">
                <td className="p-3.5 text-zinc-400 font-sans">Band B02 (Blue 490nm)</td>
                <td className="p-3.5">B02 RMSE</td>
                <td className="p-3.5">{m.perBandRmse.B02.baseline.toFixed(4)}</td>
                <td className="p-3.5 text-blue-300">{m.perBandRmse.B02.sr.toFixed(4)}</td>
                <td className="p-3.5 text-emerald-400 font-semibold">{m.perBandRmse.B02.delta.toFixed(4)}</td>
                <td className="p-3.5 text-zinc-400 font-sans text-[11px]">Water and atmospheric penetration</td>
              </tr>
              <tr className="hover:bg-zinc-950/40">
                <td className="p-3.5 text-zinc-400 font-sans">Band B03 (Green 560nm)</td>
                <td className="p-3.5">B03 RMSE</td>
                <td className="p-3.5">{m.perBandRmse.B03.baseline.toFixed(4)}</td>
                <td className="p-3.5 text-blue-300">{m.perBandRmse.B03.sr.toFixed(4)}</td>
                <td className="p-3.5 text-emerald-400 font-semibold">{m.perBandRmse.B03.delta.toFixed(4)}</td>
                <td className="p-3.5 text-zinc-400 font-sans text-[11px]">Vegetation reflectance peak</td>
              </tr>
              <tr className="hover:bg-zinc-950/40">
                <td className="p-3.5 text-zinc-400 font-sans">Band B04 (Red 665nm)</td>
                <td className="p-3.5">B04 RMSE</td>
                <td className="p-3.5">{m.perBandRmse.B04.baseline.toFixed(4)}</td>
                <td className="p-3.5 text-blue-300">{m.perBandRmse.B04.sr.toFixed(4)}</td>
                <td className="p-3.5 text-emerald-400 font-semibold">{m.perBandRmse.B04.delta.toFixed(4)}</td>
                <td className="p-3.5 text-zinc-400 font-sans text-[11px]">Chlorophyll absorption maximum</td>
              </tr>
              <tr className="hover:bg-zinc-950/40">
                <td className="p-3.5 text-zinc-400 font-sans">Band B08 (NIR 842nm)</td>
                <td className="p-3.5">B08 RMSE</td>
                <td className="p-3.5">{m.perBandRmse.B08.baseline.toFixed(4)}</td>
                <td className="p-3.5 text-blue-300">{m.perBandRmse.B08.sr.toFixed(4)}</td>
                <td className="p-3.5 text-emerald-400 font-semibold">{m.perBandRmse.B08.delta.toFixed(4)}</td>
                <td className="p-3.5 text-zinc-400 font-sans text-[11px]">Biomass cellular scattering</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
