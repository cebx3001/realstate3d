# Torres del Norte — Spatial Real Estate Catalog

A spatial real estate catalog built on Gaussian Splats. This is a web-based 3D viewing experience where users navigate through a building exterior and into individual apartment interiors, exploring specific rooms and spaces through authored camera viewpoints.

## Overview

The application presents a residential development as an interactive spatial experience:

1. **Building Exterior** — Users begin at the exterior of the building, represented as a Gaussian Splat
2. **Apartment Selection** — Three units are clickable on the building facade:
   - Unit 47 (Inventory 1004)
   - Unit 48 (Inventory 703)  
   - Unit 50 (Inventory 1202)
3. **Interior Navigation** — Selecting an apartment loads its interior as a Gaussian Splat
4. **Room Exploration** — Each apartment is divided into semantic rooms (living, dining, kitchen, bedrooms, bathrooms, etc.)
5. **Camera Viewpoints** — Each room has authored camera positions and compositions that provide editorial framing

## Architecture

### Technology Stack

- **Rendering**: Gaussian Splats via PlayCanvas-based SuperSplat viewer
- **Frontend**: Vanilla JavaScript, no build system
- **Deployment**: Static HTML/CSS/JS files + binary Gaussian Splat assets
- **Asset Format**: WebP-encoded Gaussian Splat parameters + JSON metadata

### Directory Structure

```
public/
├── index.html                          # Landing page (building exterior)
├── inventory/
│   └── index.html                      # Main catalog UI (apartments & rooms)
├── viewers/
│   ├── exterior-382a1520/              # Building exterior viewer
│   │   ├── index.html
│   │   ├── index.js                    # SuperSplat viewer bundle
│   │   ├── index.css
│   │   ├── index.sog                   # Scene graph
│   │   └── settings.json               # Viewer configuration
│   ├── inventory-47/                   # Unit 47 interior viewer
│   ├── inventory-48/                   # Unit 48 interior viewer
│   └── inventory-50/                   # Unit 50 interior viewer
├── assets/
│   ├── exterior/
│   │   ├── index.json
│   │   └── 382a1520/
│   │       ├── manifest.json
│   │       └── v1/                     # Gaussian Splat WebP files
│   │           ├── means_l.webp        # Mean positions (large)
│   │           ├── means_u.webp        # Mean positions (upper)
│   │           ├── quats.webp          # Quaternion rotations
│   │           ├── scales.webp         # Scale parameters
│   │           ├── sh0.webp            # Spherical harmonics (band 0)
│   │           ├── shN_centroids.webp  # Spherical harmonics centroids
│   │           ├── shN_labels.webp     # Spherical harmonics labels
│   │           └── meta.json           # Metadata
│   └── interior-inventory/
│       ├── inventory-manifest.json
│       ├── 0300_840573/                # Unit 47 assets (inventory-47)
│       ├── 0303_840566/                # Unit 48 assets (inventory-48)
│       └── 0306_840556/                # Unit 50 assets (inventory-50)
│           ├── labels.json             # Room/zone semantic labels
│           ├── structure.json          # Spatial structure
│           ├── occupancy.json          # Occupancy grid
│           ├── occupancy.voxel.json    # Voxel representation
│           ├── occupancy.collision.glb # Collision mesh
│           └── plan-editorial.png      # Floor plan image
└── viewer-settings/
    ├── inventory-47-suite.json
    ├── inventory-47-media.json
    ├── inventory-47-bedroom.json
    ├── inventory-47-living.json
    ├── inventory-47-dining.json
    ├── inventory-47-kitchen.json
    ├── inventory-47-primary_bedroom.json
    ├── inventory-47-secondary_bedroom.json
    ├── inventory-47-primary_bath.json
    ├── inventory-47-guest_bath.json
    ├── inventory-47-study.json
    ├── inventory-48-*.json              # Similar room settings for unit 48
    └── inventory-50-*.json              # Similar room settings for unit 50
```

### Data Flow

1. User loads `/` → **index.html** (landing page)
   - Embeds exterior viewer via iframe
   - Displays unit selection overlays positioned in 3D space
   - Handles click to enter apartment

2. User clicks apartment → navigates to `/inventory/?unit=inventory-XX&room=ROOM`
   - **inventory/index.html** loads
   - JavaScript reads URL parameters
   - Creates iframe to appropriate viewer with settings

3. Viewer loads → `/viewers/inventory-XX/index.html?settings=...&collision=...`
   - SuperSplat viewer initializes
   - Loads Gaussian Splat assets from `/assets/interior-inventory/`
   - Fetches camera settings from `/viewer-settings/inventory-XX-ROOM.json`
   - Renders scene with collision system and room navigation

### Room Navigation

Each room viewpoint is defined in `/viewer-settings/` as a JSON file containing:
- Camera position (x, y, z)
- Camera target/focal point
- Field of view
- Animation/transition parameters

The inventory UI provides:
- Unit selector buttons (Unit 47, 48, 50)
- Room selector buttons (Living, Dining, Kitchen, etc.)
- Floor plan visualization with clickable room pins
- Smooth transitions between viewpoints

## Running the Application

### Prerequisites

- Python 3.x (for the built-in HTTP server) OR Node.js with `http-server`

### Start the Server

Using the Claude Code development server:

```bash
cd D:\real-estate-spatial-catalog
python -m http.server 5175 --directory public
```

Or with npm http-server:

```bash
cd D:\real-estate-spatial-catalog
npx http-server public -p 5175
```

### Access the Application

1. **Building Exterior** (landing page):
   - http://localhost:5175/

2. **Interior Catalog** (apartment selector):
   - http://localhost:5175/inventory/
   - http://localhost:5175/inventory/?unit=inventory-47&room=living

### Browser Compatibility

- Modern browsers with WebGPU/WebGL support
- Tested on Chrome, Edge, Firefox
- Mobile responsive (tablet and up)

## Current Features

✅ Building exterior Gaussian Splat viewer  
✅ Three full apartment interiors (47, 48, 50)  
✅ Semantic room/zone division  
✅ Authored camera viewpoints per room  
✅ Smooth camera transitions  
✅ Floor plan visualization  
✅ Mobile-responsive UI  
✅ Editorial content (room descriptions)  
✅ Collision system for spatial understanding  
✅ Audio feedback (optional mute)  

## Known Limitations

⚠️ Some room camera viewpoints do not yet align perfectly with their corresponding room labels (e.g., selecting "Kitchen" may show adjacent room)  
ℹ️ This is noted as an area for future refinement; the core navigation system is functional

## Development Notes

### Key Technologies

- **SuperSplat Viewer**: Custom fork of the SuperSplat player for Gaussian Splat rendering
- **PlayCanvas**: Underlying 3D engine (embedded in viewer bundle)
- **Gaussian Splats**: Efficient 3D scene representation

### How to Add a New Apartment

1. Capture/process Gaussian Splat of new apartment (external pipeline)
2. Create new directory in `public/assets/interior-inventory/XXXX_XXXXXX/`
3. Add semantic labels, structure, and occupancy data
4. Create viewer directory in `public/viewers/inventory-NN/`
5. Generate room camera settings → `public/viewer-settings/inventory-NN-ROOM.json`
6. Update `public/inventory/index.html` inventory array with new unit config
7. Update building exterior projection points if adding to selection

### Deployment

This is a static site; deploy to any static hosting service:
- No build step required
- No database needed
- Serve the `public/` directory directly
- Ensure proper CORS headers for cross-origin Splat loading

## Support & References

- **SuperSplat Documentation**: Gaussian Splat format and viewer documentation
- **PlayCanvas**: 3D rendering engine
- **Gaussian Splatting**: 3D Gaussian Splatting for Real-Time Radiance Field Rendering (Kerbl et al., 2023)

---

**Project**: Torres del Norte — Spatial Catalog  
**Version**: Clean Repository Extraction  
**Last Updated**: 2026-09-07
