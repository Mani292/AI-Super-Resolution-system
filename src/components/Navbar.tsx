import React from 'react';
import { 
  Satellite, 
  Layers, 
  Cpu, 
  MapPin, 
  Sparkles, 
  Play, 
  RotateCcw,
  CheckCircle2,
  SlidersHorizontal,
  FileCode2
} from 'lucide-react';
import { SatelliteScene } from '../types/satellite';
import { SCENES } from '../data/mockScenes';

interface NavbarProps {
  activeScene: SatelliteScene;
  onSelectScene: (scene: SatelliteScene) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onTriggerInference: () => void;
  isProcessing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeScene,
  onSelectScene,
  activeTab,
  onSelectTab,
  onTriggerInference,
  isProcessing,
}) => {
  const tabs = [
    { id: 'imagery', label: '1. Multispectral Viewer', icon: Layers },
    { id: 'metrics', label: '2. Spectral & Quality Metrics', icon: SlidersHorizontal },
    { id: 'uncertainty', label: '3. Uncertainty Lab', icon: Sparkles },
    { id: 'landcover', label: '4. Downstream SRM Task', icon: Satellite },
    { id: 'geospatial', label: '5. Geospatial & Architecture', icon: Cpu },
    { id: 'export', label: '6. GeoTIFF Export & CLI', icon: FileCode2 },
  ];

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-50">
      {/* Top Meta Bar */}
      <div className="px-4 md:px-6 py-2.5 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-zinc-100 tracking-wide">
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-xl font-mono text-[11px] font-semibold">
              SIH 2026 · PS-142
            </span>
            <span className="text-sm font-semibold tracking-tight text-zinc-100 flex items-center gap-1.5">
              <Satellite className="w-4 h-4 text-blue-400" />
              Satellite Image Super-Resolution Platform
            </span>
          </div>
          <span className="hidden md:inline-block text-zinc-600 font-mono">|</span>
          <span className="hidden md:inline-flex items-center gap-1.5 text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            10m Sentinel-2 → <strong className="text-blue-300">2.5m GeoTIFF (4× SRM)</strong>
          </span>
        </div>

        {/* Model Architecture & Weights Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-1 rounded-xl font-mono text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            EDSR-Lite · 1,223,300 params · Global Residual
          </span>
          <span className="inline-flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-xl text-[11px] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            CRS Validated
          </span>
        </div>
      </div>

      {/* Main Controls & Scene Bar */}
      <div className="px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Scene Selector */}
        <div className="flex items-center gap-2.5 min-w-0">
          <label htmlFor="scene-selector" className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 whitespace-nowrap">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            Scene:
          </label>
          <div className="relative">
            <select
              id="scene-selector"
              value={activeScene.id}
              onChange={(e) => {
                const found = SCENES.find((s) => s.id === e.target.value);
                if (found) onSelectScene(found);
              }}
              aria-label="Select Target Satellite Scene"
              className="bg-zinc-900 border border-zinc-700 hover:border-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-zinc-100 text-xs rounded-xl px-3 py-1.5 font-medium cursor-pointer transition-colors max-w-[280px] truncate"
            >
              {SCENES.map((scene) => (
                <option key={scene.id} value={scene.id}>
                  [{scene.category}] {scene.title}
                </option>
              ))}
            </select>
          </div>
          <span className="text-[11px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-xl hidden lg:inline-block">
            {activeScene.location}
          </span>
        </div>

        {/* Action Button: Re-run Tiled Inference */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTriggerInference}
            disabled={isProcessing}
            aria-label="Run Tiled Inference on current scene"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-950/50 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                Inferring 4× Patches...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Tiled Inference
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 md:px-6 flex overflow-x-auto no-scrollbar gap-2 border-t border-zinc-800/80 bg-zinc-950/70 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              aria-label={`Switch to ${tab.label}`}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-colors cursor-pointer border ${
                isActive
                  ? 'border-blue-500/50 text-blue-300 bg-blue-500/10 shadow-sm font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-zinc-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
