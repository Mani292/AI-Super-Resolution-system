/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SIH 2026 · PS-142 — Satellite Image Super-Resolution Platform
 * Deep Learning Based Super Resolution Mapping (SRM) from Medium Resolution Satellite Imageries
 */

import React, { useState, useMemo } from 'react';
import { SCENES } from './data/mockScenes';
import { SatelliteScene } from './types/satellite';
import { generateSceneRaster } from './utils/rasterGenerator';
import { Navbar } from './components/Navbar';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { ImageryViewer } from './components/ImageryViewer';
import { MetricsDashboard } from './components/MetricsDashboard';
import { UncertaintyLab } from './components/UncertaintyLab';
import { LandCoverExperiment } from './components/LandCoverExperiment';
import { GeospatialInspector } from './components/GeospatialInspector';
import { ExportAndCLI } from './components/ExportAndCLI';
import { TiledInferenceModal } from './components/TiledInferenceModal';

export default function App() {
  const [activeScene, setActiveScene] = useState<SatelliteScene>(SCENES[0]);
  const [activeTab, setActiveTab] = useState<string>('imagery');
  const [isInferenceModalOpen, setIsInferenceModalOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Generate multispectral 4-band rasters for active scene
  const activeRaster = useMemo(() => {
    return generateSceneRaster(activeScene);
  }, [activeScene]);

  const handleTriggerInference = () => {
    setIsProcessing(true);
    setIsInferenceModalOpen(true);
    setTimeout(() => {
      setIsProcessing(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
      {/* Top Application Header & Navigation */}
      <Navbar
        activeScene={activeScene}
        onSelectScene={setActiveScene}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onTriggerInference={handleTriggerInference}
        isProcessing={isProcessing}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-5 md:p-6 space-y-5">
        {/* Scientific Framing & Provenance Disclaimer Banner */}
        <DisclaimerBanner />

        {/* Tab 1: Multispectral Imagery & Split Curtain Viewer */}
        {activeTab === 'imagery' && (
          <ImageryViewer scene={activeScene} raster={activeRaster} />
        )}

        {/* Tab 2: Quantitative Metrics & Spectral Profile */}
        {activeTab === 'metrics' && (
          <MetricsDashboard scene={activeScene} />
        )}

        {/* Tab 3: Uncertainty Lab & Hallucination Guardrails */}
        {activeTab === 'uncertainty' && (
          <UncertaintyLab scene={activeScene} raster={activeRaster} />
        )}

        {/* Tab 4: Downstream Land-Cover Classification Experiment */}
        {activeTab === 'landcover' && (
          <LandCoverExperiment scene={activeScene} />
        )}

        {/* Tab 5: Geospatial Validation & Neural Architecture */}
        {activeTab === 'geospatial' && (
          <GeospatialInspector scene={activeScene} />
        )}

        {/* Tab 6: Product Export Suite & CLI Command Generator */}
        {activeTab === 'export' && (
          <ExportAndCLI scene={activeScene} raster={activeRaster} />
        )}
      </main>

      {/* Tiled Inference Pipeline Modal */}
      <TiledInferenceModal
        isOpen={isInferenceModalOpen}
        onClose={() => setIsInferenceModalOpen(false)}
        scene={activeScene}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/90 py-4 px-6 text-center text-xs text-zinc-400 font-mono mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-zinc-300 font-semibold">SIH 2026 · PS-142</span>
            <span className="text-zinc-500">· Super Resolution Mapping (SRM)</span>
          </div>
          <span className="text-zinc-400">
            Model: <strong className="text-zinc-200">EDSR-Lite (1.22M params)</strong> · Scale: <strong className="text-blue-400">4× (10m → 2.5m)</strong> · Loss: <strong className="text-zinc-300">L1 + SSIM + Cosine SAM + Grad</strong>
          </span>
          <span className="text-emerald-400 font-medium bento-tag bg-zinc-900 border border-zinc-800">
            ✓ Geospatial Footprint & Origin Verified
          </span>
        </div>
      </footer>
    </div>
  );
}
