# 🏭 SmartFactory AI — Cyber-Physical Digital Twin Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://varghesegt.github.io/final-year/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Three.js](https://img.shields.io/badge/Three.js-r185-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![React 19](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.3.0-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Compliance](https://img.shields.io/badge/Compliance-ISO%2023247%20%7C%20ISO%2010816--3%20%7C%20ISO%2055001-blueviolet?style=for-the-badge)](#standards-compliance)

> **Enterprise-grade, web-native Cyber-Physical Digital Twin and Prescriptive Maintenance (PdM) Platform for Industry 4.0.**  
> Built in strict accordance with the **ISO 23247** digital twin framework, **ISO 10816-3** vibration severity standards, and **ISO 55001** asset management governance.

🌐 **Live Deployment:** [https://varghesegt.github.io/final-year/](https://varghesegt.github.io/final-year/)

---

## 🌟 Key Capabilities

### 1. 🦾 3D Procedural Kinematics & Non-Distorting Exploded CAD
- **Articulated 6-Axis Robot (`ROB-001`):** 5-zone geometry decomposition (Pedestal, Shoulder, Elbow, Wrist, Gripper), animated forward kinematics, animated welding spark particles, and pneumatic cable catenary splines.
- **Vertical Milling Center (`CNC-001`):** Sub-assembly decomposition (Column Base, Spindle Quill, T-Slot Worktable), spindle rotation, coolant spray particles, and live DRO tracking.
- **Dual-Stage Air Compressor (`COMP-201`):** ASME 200L receiver vessel, V-twin reciprocating piston-crankshaft kinematics, and copper-finned intercooler.
- **Centrifugal Slurry Pump (`P-101`):** Impeller hydrodynamic rotation, PBR volute casing, and mechanical seal housing.
- **Exploded View Integrity:** 100% solid, closed structural geometry invariance with zero polygon tearing or mesh spiking, accompanied by animated dashed cyan CAD leader lines and 3D Bill-of-Materials (BOM) callout badges.

### 2. 🌡️ Real-Time GLSL Distance-Field Thermal Hotspot Shaders
- Custom GLSL vertex and fragment shaders computing Gaussian heat conduction fields across 3D CAD meshes in real-time.
- Calibrated 7-stop **FLIR Ironbow / Jet colormap** with dynamic isoline FEA contour rings at $4^\circ\text{C}$ intervals.
- Real-time probe interpolation mapping physical sensor coordinates to internal mechanical hotspots (bearings, stator windings, cylinder heads).

### 3. 🎛️ Interactive 2D SCADA Mimics & Process Control
- **Pump P&ID:** Suction/discharge pressure transmitters, fluid flow streamlines, H-Q pump performance curve, and real-time Net Positive Suction Head ($\text{NPSH}$) cavitation risk calculation.
- **CNC DRO & G-Code Interpreter:** Live streaming ISO G-code parser (`G00`, `G01`, `G02`, `G03`), 3-axis Digital Read Out ($0.001\text{ mm}$ resolution), and interactive 2D workpiece cutting toolpath visualizer.
- **Compressor P-V Indicator:** Real-time Pressure-Volume thermodynamic indicator diagram computing indicated power and polytropic compression exponents.

### 4. 📊 Industrial Reliability & Diagnostics Suite
- **Vibration FFT Spectral Analyzer:** Fast Fourier Transform harmonic analysis ($1X$ unbalance, $2X$ misalignment, $\text{BPFO}$ outer race defect, $\text{BPFI}$ inner race defect) categorized under **ISO 10816-3** severity zones.
- **Operational "What-If" Sandbox:** Adjust operating speed (RPM), ambient temperature, radial load, and lubrication regime to project Archard accelerated wear factor ($K_w$) and revised Remaining Useful Life ($\text{RUL}$).
- **Weibull Reliability Analysis:** 2-parameter Weibull failure distribution ($\beta = 2.5$, $\eta = 5000\text{ hrs}$) with cumulative failure probability curves.
- **Industrial Tribology Suite:** API 610 bearing limits, thermal differentials ($\Delta T$), and acoustic envelope harmonics.

### 5. 📋 ISO 55001 Asset Management & Work Orders (CMMS)
- Closed-loop maintenance authoring with required spare parts and safety isolation checklists.
- Digital sign-off authorization using an HTML5 touch-enabled cryptographic signature pad.
- Asset verification QR codes and one-click ISO 55001 audit report PDF printing.

### 6. 🌐 Industrial IoT Gateway & Telemetry Broker
- Simulated MQTT packet broker operating under QoS 1 delivery with $< 0.01\%$ packet loss and $< 15\text{ ms}$ render latency.
- OPC-UA Node Tag Matrix and Modbus TCP industrial register mapping.

---

## 🏛️ System Architecture

```
+-------------------------------------------------------------------------------------------------+
|                                    PRESENTATION LAYER                                           |
|  +-----------------------------+  +-------------------------------+  +-----------------------+  |
|  |     3D WebGL Digital Twin   |  |        2D SCADA Mimics        |  |  Reliability & CMMS   |  |
|  |  Three.js Engine, Kinematics|  |  P&ID Loops, G-Code DRO, P-V  |  |  Weibull, FFT, QR,    |  |
|  |  Custom GLSL Thermal Shader |  |  Fluid Cavitation, Animation  |  |  ISO 55001 Sign-off   |  |
|  +-----------------------------+  +-------------------------------+  +-----------------------+  |
+-------------------------------------------------------------------------------------------------+
                                                ▲
                                                │ (React State / Canvas Event Loop)
+-------------------------------------------------------------------------------------------------+
|                                 DIGITAL TWIN ANALYTICS CORE                                     |
|  +-----------------------------+  +-------------------------------+  +-----------------------+  |
|  |     Forward Kinematics      |  |  ISO Condition Monitoring     |  |  "What-If" Sandbox    |  |
|  |  Decomposition & Explosion  |  |  ISO 10816 FFT, API 610 Temp  |  |  Archard Wear Factor  |  |
|  |  BOM Badges & Leader Lines  |  |  IEC 60076 DGA, NPSH Cavitation|  |  Monte Carlo RUL      |  |
|  +-----------------------------+  +-------------------------------+  +-----------------------+  |
+-------------------------------------------------------------------------------------------------+
                                                ▲
                                                │ (MQTT / OPC-UA Telemetry Stream)
+-------------------------------------------------------------------------------------------------+
|                               EDGE PROTOCOL & TELEMETRY BROKER                                  |
|   Simulated MQTT Broker (QoS 1) • OPC-UA Node Tag Matrix • Modbus TCP Industrial Register Bridge|
+-------------------------------------------------------------------------------------------------+
                                                ▲
+-------------------------------------------------------------------------------------------------+
|                               PHYSICAL SHOP-FLOOR ASSET FLEET                                   |
|   [P-101 Pump]  [CNC-001 Mill]  [COMP-201 Compressor]  [ROB-001 Arm]  [CONV-401]  [XFMR-302]    |
+-------------------------------------------------------------------------------------------------+
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher; v22 recommended)
- `npm` (v9 or higher)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/varghesegt/final-year.git
   cd final-year
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   The application will be live at `http://localhost:3000/#/`.

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🚢 Deploying to GitHub Pages

### Method 1: Automated GitHub Actions (Recommended)
1. Push code to the `main` branch.
2. In your GitHub repository, navigate to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. The workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) will automatically build and deploy the application.

### Method 2: Manual CLI Deployment
```bash
npm run deploy
```
This builds the production bundle into `dist/` and pushes it directly to the `gh-pages` branch.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19.1.0, React DOM 19.1.0 |
| **Routing** | React Router DOM 7.6.0 (HashRouter for zero-config SPA static hosting) |
| **3D Graphics & Shaders** | Three.js (r185), WebGL 2.0, Custom GLSL Shaders |
| **UI Motion & Transitions**| Framer Motion 12.12.0 |
| **Data Visualization** | Recharts 2.15.0 |
| **Icons & Design Tokens** | Lucide React 0.511.0, CSS Variables Design System |
| **Bundler & Build Tool** | Vite 6.3.0 |
| **Deployment Engine** | GitHub Actions / gh-pages 6.3.0 |

---

## 📜 Standards Compliance

- **ISO 23247:** Automation systems and integration — Digital twin framework for manufacturing.
- **ISO 10816-3:** Mechanical vibration — Evaluation of machine vibration on non-rotating parts.
- **ISO 55001:** Asset management — Management systems — Requirements.
- **API 610:** Centrifugal pumps for petroleum, petrochemical, and natural gas industries.
- **IEC 60076-7:** Loading guide for mineral-oil-immersed power transformers.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
