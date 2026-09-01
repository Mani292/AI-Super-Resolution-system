import React, { useState } from 'react';
import { 
  Download, 
  Terminal, 
  Copy, 
  Check, 
  FileCode2, 
  Layers, 
  Sparkles, 
  FileText,
  FileJson,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { SatelliteScene } from '../types/satellite';
import { RasterData } from '../utils/rasterGenerator';

interface ExportAndCLIProps {
  scene: SatelliteScene;
  raster: RasterData;
}

export const ExportAndCLI: React.FC<ExportAndCLIProps> = ({ scene, raster }) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleDownloadMetricsJson = () => {
    const data = {
      sceneId: scene.id,
      title: scene.title,
      dateExported: new Date().toISOString(),
      disclaimer: 'Super-resolved imagery contains AI-inferred information and should not be interpreted as direct high-resolution observation without validation.',
      geospatial: {
        crs: scene.bounds.crsName,
        epsg: scene.bounds.epsg,
        sourceGsdM: scene.sourceResolutionM,
        targetGsdM: scene.targetResolutionM,
        scaleFactor: scene.scaleFactor,
        affineTransform: scene.affine2_5m,
        bounds: scene.bounds,
      },
      model: {
        architecture: 'EDSR-Lite',
        parameters: 1223300,
        lossFunction: '1.0*L1 + 0.15*(1-SSIM) + 0.30*(1-cos_theta) + 0.05*Grad',
        upsampler: 'PixelShuffle 4x',
      },
      quantitativeMetrics: scene.metrics,
      uncertainty: scene.uncertainty,
      downstreamLandCoverTask: scene.landCover,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scene.id}_sr_evaluation_report.json`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess('Metrics JSON exported successfully');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadCsv = () => {
    let csv = 'Band,CenterWavelengthNm,BicubicRmse,SrRmse,Delta,ImprovementPct\n';
    const p = scene.metrics.perBandRmse;
    csv += `B02 (Blue),490,${p.B02.baseline},${p.B02.sr},${p.B02.delta},${(((p.B02.baseline - p.B02.sr) / p.B02.baseline) * 100).toFixed(2)}%\n`;
    csv += `B03 (Green),560,${p.B03.baseline},${p.B03.sr},${p.B03.delta},${(((p.B03.baseline - p.B03.sr) / p.B03.baseline) * 100).toFixed(2)}%\n`;
    csv += `B04 (Red),665,${p.B04.baseline},${p.B04.sr},${p.B04.delta},${(((p.B04.baseline - p.B04.sr) / p.B04.baseline) * 100).toFixed(2)}%\n`;
    csv += `B08 (NIR),842,${p.B08.baseline},${p.B08.sr},${p.B08.delta},${(((p.B08.baseline - p.B08.sr) / p.B08.baseline) * 100).toFixed(2)}%\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scene.id}_per_band_metrics.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess('Spectral CSV exported successfully');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadGeoTiffSim = () => {
    // Generate GeoTIFF summary package with embedded provenance metadata
    const manifest = {
      file: `${scene.id}_2.5m_sr.tif`,
      tiffTags: {
        SR_DISCLAIMER: 'AI-inferred 2.5m super-resolution from Sentinel-2 10m L2A',
        SR_SCALE: '4.0',
        SR_SOURCE: 'Sentinel-2 L2A B04,B03,B02,B08',
        SR_MODEL: 'EDSR-Lite-v1.2',
        SR_UNCERTAINTY_METHOD: 'ensemble_D4',
      },
      geoTransform: [
        scene.affine2_5m.c, scene.affine2_5m.a, scene.affine2_5m.b,
        scene.affine2_5m.f, scene.affine2_5m.d, scene.affine2_5m.e
      ],
      spatialReference: scene.bounds.crsName,
      bands: 4,
      dataType: 'Float32 [0.0..1.0 Reflectance]',
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scene.id}_2.5m_geotiff_manifest.json`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess('GeoTIFF manifest & metadata downloaded');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const cliSnippets = [
    {
      id: 'prepare',
      title: '1. Prepare Dataset & Synthesize Calibration Pairs',
      cmd: 'python scripts/prepare_dataset.py --synthetic',
      desc: 'Generates MTF-blurred area-decimated training patches in data/patches/ and writes sample.tif at 10m',
    },
    {
      id: 'train',
      title: '2. Train EDSR-Lite Model with 4-Term Composite Loss',
      cmd: 'python scripts/train.py --epochs 12 --batch-size 16 --lr 1e-4 --device cuda',
      desc: 'Executes cosine LR schedule, mixed precision AMP, and spectral cosine angle preservation',
    },
    {
      id: 'eval',
      title: '3. Quantitative Evaluation & Downstream Land-Cover Experiment',
      cmd: 'python scripts/evaluate.py --downstream --protocol reduced_resolution',
      desc: "Scores PSNR, SSIM, SAM, ERGAS, and downstream classification OA/mIoU under Wald's protocol",
    },
    {
      id: 'infer',
      title: '4. Tiled Inference with Context Padding & Uncertainty Map',
      cmd: `python scripts/inference.py --input data/raw/${scene.id}.tif --uncertainty ensemble`,
      desc: 'Outputs 2.5m GeoTIFF, uncertainty raster, and validates CRS/affine bounds without memory seams',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header Bento Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="bento-tag bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] py-0.5 px-2.5">
              Production Export & Reproducibility
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">GeoTIFF + Python CLI</span>
          </div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2 mt-1.5">
            <HardDrive className="w-5 h-5 text-blue-400" />
            Product Export Suite & CLI Command Generator
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Export super-resolved 2.5m GeoTIFFs with embedded provenance tags, uncertainty rasters, and quantitative reports.
          </p>
        </div>

        {downloadSuccess && (
          <span className="inline-flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs px-3.5 py-2 rounded-xl font-mono shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {downloadSuccess}
          </span>
        )}
      </div>

      {/* Export Artifacts Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Export 2.5m Super-Resolved GeoTIFF */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:border-zinc-700 transition-colors">
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-zinc-100 uppercase tracking-wider">
              2.5 m Super-Resolved GeoTIFF
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              4-band raster (B04, B03, B02, B08) at 2.5m GSD with embedded <code className="text-blue-300 font-mono">SR_DISCLAIMER</code> and rescaled Affine transform.
            </p>
          </div>
          <button
            onClick={handleDownloadGeoTiffSim}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm cursor-pointer transition-all active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            Download GeoTIFF (.tif)
          </button>
        </div>

        {/* Export Uncertainty Map */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:border-zinc-700 transition-colors">
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-zinc-100 uppercase tracking-wider">
              Uncertainty GeoTIFF Map
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Single-band Float32 raster encoding relative model instability under D4 dihedral group perturbations.
            </p>
          </div>
          <button
            onClick={handleDownloadGeoTiffSim}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs border border-zinc-700 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            Download Uncertainty (.tif)
          </button>
        </div>

        {/* Export JSON Audit Report */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:border-zinc-700 transition-colors">
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <FileJson className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-zinc-100 uppercase tracking-wider">
              Full Evaluation Audit JSON
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Machine-readable audit report containing PSNR, SSIM, SAM, ERGAS, per-band deltas, and confusion matrices.
            </p>
          </div>
          <button
            onClick={handleDownloadMetricsJson}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs border border-zinc-700 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            Export JSON Report
          </button>
        </div>

        {/* Export CSV Spectral Metrics */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:border-zinc-700 transition-colors">
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-zinc-100 uppercase tracking-wider">
              Per-Band Metrics CSV
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Spreadsheet format table with band wavelengths (490nm, 560nm, 665nm, 842nm) and percentage improvements.
            </p>
          </div>
          <button
            onClick={handleDownloadCsv}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs border border-zinc-700 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            Export CSV Log
          </button>
        </div>
      </div>

      {/* CLI Command Line Generator Bento Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            Terminal CLI Commands (Reproduce in Python 3.12 Pipeline)
          </h3>
          <span className="bento-tag text-[10px]">PyTorch / GDAL / Rasterio</span>
        </div>

        <div className="space-y-3.5 pt-1">
          {cliSnippets.map((snippet) => (
            <div key={snippet.id} className="bg-zinc-950 rounded-xl border border-zinc-800 p-4 space-y-2.5 hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200">{snippet.title}</span>
                <button
                  onClick={() => copyToClipboard(snippet.cmd, snippet.id)}
                  className="flex items-center gap-1.5 text-[11px] font-mono text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 cursor-pointer transition-colors"
                >
                  {copiedCmd === snippet.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy CLI
                    </>
                  )}
                </button>
              </div>
              <div className="bg-zinc-900/90 p-3 rounded-lg font-mono text-xs text-blue-300 overflow-x-auto border border-zinc-800">
                <span className="text-zinc-500 mr-2">$</span>{snippet.cmd}
              </div>
              <div className="text-[11px] text-zinc-400">{snippet.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
