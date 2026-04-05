<div align="center">
<br />

```
      ██████╗██████╗ ████████╗██╗  ██╗██████╗ ███████╗███████╗
     ██╔════╝╚════██╗╚══██╔══╝██║  ██║██╔══██╗██╔════╝██╔════╝
     ██║      █████╔╝   ██║   ███████║██████╔╝█████╗  █████╗  
     ██║     ██╔═══╝    ██║   ██╔══██║██╔══██╗██╔══╝  ██╔══╝  
     ╚██████╗███████╗   ██║   ██║  ██║██║  ██║███████╗███████╗
      ╚═════╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝
```

### **C2Three**
### **CT Scans to 3D.**

*Convert flat CT slices to interactive anatomy in a click.*

<br />

![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Desktop-0ea5e9?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)
![Built At](https://img.shields.io/badge/Built%20at-Hackathon-f97316?style=for-the-badge)

</div>

---

## What C2Three Does

C2Three converts standard medical CT scan slices into **detailed, interactive 3D render** that can be explored in real time.

Instead of scrolling through hundreds of 2D slices hoping, clinicians and patients get a complete spatial picture of the body — rotatable, sliceable, and annotated.

```
  Upload Scan  →  3D Reconstruction  →  AI Analysis  →  Doctor Review
      │                  │                   │                │
   DICOM           Layer-by-Layer        Pattern         Specialist
                   Reconstruction       Detection        Validation
```

### Core Capabilities

**3D Reconstruction Engine**
Our algorithm processes scans by dividing them into anatomical layers — muscle,bone vasculature — and reconstructs them into a coherent 3D render. Each structure is color-mapped for instant spatial orientation.

**Interactive Viewer**
- Rotate, zoom, and slice through the model in real time
- Explore layer by layer: toggle muscle, bone, nerves independently
- Color-coded anatomical landmarks for instant visual clarity

**Technical Approach**
The most critical metadata CT scan includes are - PixelSpacing and SliceThickness for spatial resolution, ImagePositionPatient and ImageOrientationPatient for geometric alignment, and RescaleSlope/Intercept for converting raw pixel values into Hounsfield Units used in segmentation. Meta data from dicom files is extracted to generate layers of the model.

**Conversational Interface**
Ask questions about your scan in plain language. Get context-aware responses grounded in the 3D model currently on screen.

**Expert Advice**
AI findings can be sent directly to verified specialist physicians who review the results, validate findings, and provide professional medical advice.


---

## Why It's Different

### The Problem With Existing Tools

| Tool Category | What They Do | What They Miss |
|---|---|---|
| PACS / Radiology Workstations | Professional DICOM viewing | Requires specialist training; expensive; no AI |
| Consumer Health Apps | Basic health tracking | No imaging analysis whatsoever |
| Research Viewers (3D Slicer, OsiriX) | Powerful 3D reconstruction | Not accessible to non-experts; steep learning curve |
| Generic AI Diagnostic Tools | Pattern detection on 2D images | No 3D context; no interactive exploration |

**C2Three sits in the gap**: accessible enough for a patient or a junior clinician, powerful enough to surface what a 2D view misses.

### Designed for Limited Hardware

A common barrier in medical imaging software is the hardware requirement. C2Three is built to run efficiently on **standard consumer hardware**, including devices with limited GPU resources. Advanced 3D visualization shouldn't require a radiology workstation.

---

## How the Reconstruction Works

Our algorithm approaches the scan the way the human body is actually structured:

1. **Ingestion** — Accept DICOM files
2. **Segmentation** — Identify and separate anatomical layers using trained models
3. **Volumetric Reconstruction** — Build a 3D mesh from the segmented layers
4. **Color Mapping** — Assign distinct colors to blood vessels, bones, muscle groups, and soft tissue
5. **Streaming Render** — Stream the model to the browser for interactive exploration

The result is a model where a hairline rib fracture — invisible in a single 2D slice — appears as a visible discontinuity in the 3D bone layer.

---

## Features

**Live Now**
- [x] CT scan dicom file to 3D reconstruction
- [x] Layer-by-layer anatomical exploration
- [x] Color-coded structure mapping (vessels, bone, muscle)
- [x] Real-time rotate, zoom, and slice controls
- [x] AI pattern detection with explainability
- [x] Conversational Q&A interface
- [x] Doctor Connect — specialist review pipeline
- [x] Runs on standard consumer hardware

**Coming Next**
- [ ] Comparative analysis (scan A vs scan B over time)
- [ ] Mobile-optimized viewer
- [ ] Report generation — exportable PDF with AI findings


---

### Option B — Windows (Manual, No WSL)

#### Backend
```powershell
cd backend

# Create virtualenv
python -m venv venv
venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Generate atlas (one-time, ~30 seconds)
python -m app.atlas.generate_atlas --size 128 --output atlas_chest_128.npz --output-dir ../data

# Build medical knowledge base (one-time, ~5 seconds)
python -m app.knowledge.build_kb --output ../data/medical_kb.sqlite

# Generate memory bank for anomaly detector (one-time, ~60 seconds)
python scripts\download_weights.py --output-dir ../models --atlas ../data/atlas_chest_128.npz

# Start backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend (new terminal)
```powershell
cd frontend

# Install dependencies
npm install

# Add zustand (needed for appStore.js)
npm install zustand

# Start dev server
npm run dev
# → http://localhost:5173
```

---


<div align="center">
<br />

*Built because someone's fractured rib went undetected for a week.*

*That shouldn't happen.*

<br />
</div>
