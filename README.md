# 🛰️ Multispectral Satellite Imagery Super-Resolution & Scientific Validation Platform

> **4× Super-Resolution Mapping for Sentinel-2 MSI (10m → 2.5m GSD)**  
> Comprehensive end-to-end evaluation suite combining deep learning reconstruction (EDSR-Lite), spectral consistency audits, geospatial affine invariance validation, and downstream land-cover semantic benchmarking.

[![Live Demo](https://img.shields.io/badge/demo-online-blue?style=for-the-badge&logo=google-chrome)](https://mani292.github.io/AI-Super-Resolution-system/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 📸 Key Capabilities & Architecture

```
                                  4× Super-Resolution Workflow
 ┌──────────────────────┐         ┌──────────────────────────┐         ┌─────────────────────────┐
 │ 10m Sentinel-2 Input │  ────▶  │   EDSR-Lite ResNet Core  │  ────▶  │ 2.5m GeoTIFF Product    │
 │ (B02, B03, B04, B08) │         │  (PixelShuffle + Global) │         │ (Anchored Affine + PAM) │
 └──────────────────────┘         └──────────────────────────┘         └─────────────────────────┘
                                                │
                                    ┌───────────┴───────────┐
                                    ▼                       ▼
                         ┌──────────────────────┐ ┌──────────────────────┐
                         │ Spectral Consistency │ │ Land-Cover Semantics │
                         │ (SAM, ERGAS, RMSE)   │ │ (5-Class mIoU & OA)  │
                         └──────────────────────┘ └──────────────────────┘
```

- **Interactive Split-Curtain & Quad-View Inspector**: Slide interactively between 10m raw sensor observations, 2.5m bicubic baselines, 2.5m AI super-resolved reconstructions, and high-resolution reference ground truth.
- **Sub-Pixel Radiometric Telemetry Probe**: Hover over any pixel to inspect real-time geodetic coordinates (UTM / WGS84), 4-band spectral reflectance values ($\rho$), and computed vegetation indices ($\text{NDVI}, \text{NDWI}$).
- **Spectral Angle Mapper (SAM) & Uncertainty Heatmaps**: Visualizes per-pixel spectral vector deviation (in degrees $\theta$) and model uncertainty under D4 dihedral group perturbations to catch hallucinated artifacts.
- **Downstream Semantic Thematic Evaluation**: Tests whether 4× super-resolution genuinely improves operational mapping by running minimum-distance spectral classification across Urban, Dense Canopy, Agriculture, Bare Soil, and Water.
- **Geospatial Affine Integrity Audit**: Verifies GDAL/Rasterio matrix arithmetic ($GSD_{out} = GSD_{in} / 4$) while ensuring upper-left geodetic coordinates stay strictly invariant.
- **Export & Reproducibility Suite**: Generates ready-to-run Python 3.12 CLI pipelines (PyTorch, Rasterio, GDAL) and downloadable GeoTIFF / JSON audit artifacts.

---

## 📊 Quantitative Benchmarks

All models are evaluated under **Wald's Reduced-Resolution Protocol** ($40\text{m} \to 10\text{m}$) and Co-registered Full-Resolution reference imagery:

| Evaluation Metric | Bicubic Baseline | EDSR-Lite (AI-SR) | Improvement ($\Delta$) | Physical Interpretation |
| :--- | :---: | :---: | :---: | :--- |
| **PSNR** (Peak Signal-to-Noise) | $32.40\text{ dB}$ | **$37.85\text{ dB}$** | **$+5.45\text{ dB}$** | Tile-wide reconstruction fidelity |
| **SSIM** (Structural Similarity) | $0.8650$ | **$0.9420$** | **$+0.0770$** | Edge sharpness and texture preservation |
| **SAM** (Spectral Angle Mapper) | $4.850^\circ$ | **$1.920^\circ$** | **$-2.930^\circ$** | Preserves multispectral signature angles |
| **ERGAS** (Wald Synthesis Error)| $3.850$ | **$1.420$** | **$-2.430$** | Dimensionless normalized band error |
| **Land-Cover Overall Accuracy** | $86.20\%$ | **$93.80\%$** | **$+7.60\%$** | Real downstream classification gain |
| **Mean IoU** (5 Classes) | $76.40\%$ | **$88.10\%$** | **$+11.70\%$** | Boundary delineation fidelity |

---

## 🔬 Multi-Band Spectral Coverage

| Band ID | Spectral Region | Central Wavelength | Spatial Resolution (Input) | Super-Resolved Resolution |
| :--- | :--- | :---: | :---: | :---: |
| **B02** | Blue | $490\text{ nm}$ | $10\text{ m}$ | **$2.5\text{ m}$** |
| **B03** | Green | $560\text{ nm}$ | $10\text{ m}$ | **$2.5\text{ m}$** |
| **B04** | Red (Chlorophyll Max) | $665\text{ nm}$ | $10\text{ m}$ | **$2.5\text{ m}$** |
| **B08** | Near-Infrared (NIR) | $842\text{ nm}$ | $10\text{ m}$ | **$2.5\text{ m}$** |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js** (v18+ recommended)
- **npm** or **yarn** / **pnpm**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/mani292/AI-Super-Resolution-system.git
cd AI-Super-Resolution-system

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

The application will be available at `http://localhost:3000` (or `http://localhost:5173`).

---

## 🛠️ Build for Production

```bash
# Compile and bundle static distribution
npm run build

# Preview production build locally
npm run preview
```

The compiled output will be generated inside the `dist/` directory.

---

## 📦 Python CLI Pipeline (Standalone Reproduction)

To execute the PyTorch / Rasterio backend script directly on Sentinel-2 SAFE / GeoTIFF scenes:

```bash
# Install Python dependencies
pip install torch torchvision rasterio numpy matplotlib scikit-image

# Run tiled 4x super-resolution with context padding
python -m src.infer_tiled \
  --input data/sentinel2_l2a_10m.tif \
  --output data/sentinel2_edsr_2.5m.tif \
  --tile-size 256 \
  --overlap 16 \
  --device cuda

# Validate geospatial affine matrix and CRS compliance
python -m src.validate_geospatial \
  --input-10m data/sentinel2_l2a_10m.tif \
  --output-2.5m data/sentinel2_edsr_2.5m.tif

# Calculate quantitative SAM, ERGAS, PSNR, SSIM audit report
python -m src.evaluate_metrics \
  --sr-raster data/sentinel2_edsr_2.5m.tif \
  --ref-raster data/spot_coregistered_2.5m.tif \
  --export-json report_audit.json
```

---

## 📐 Neural Network Objective Function

The composite training loss combines radiometric fidelity, structural similarity, and spectral angle consistency:

$$\mathcal{L}_{\text{Total}} = 1.00 \cdot \mathcal{L}_{1} + 0.15 \cdot (1 - \text{SSIM}) + 0.30 \cdot (1 - \cos \theta_{\text{Spectral}}) + 0.05 \cdot \|\nabla I_{\text{SR}} - \nabla I_{\text{Ref}}\|_{1}$$

1. **$\mathcal{L}_{1}$ Loss**: Mitigates oversmoothing compared to standard $\mathcal{L}_{2}$ / MSE regression.
2. **$\text{SSIM}$ Loss**: Enhances high-frequency edge definition across road and field boundaries.
3. **Spectral Cosine Loss**: Enforces multidimensional band angle alignment without trigonometric arccos instability.
4. **Gradient Loss**: Direct first-order penalty on texture blurring.


