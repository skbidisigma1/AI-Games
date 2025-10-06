# HadleeKart - Custom Track Modeling Specification

## Overview
This document outlines the requirements for creating custom race tracks in Blender that support tricks, gliders, hazards, and dynamic gameplay elements.

---

## 🎯 Track Components to Model

### 1. **Main Track Surface**
- **File naming**: `track_surface.glb`
- **Requirements**:
  - Model the racing surface as a continuous mesh
  - Use **vertex painting** or **separate material zones** to define surface types:
    - **Normal Road** (default gray)
    - **Boost Pads** (bright yellow/orange)
    - **Slow Zones** (mud/grass - brown/green)
    - **Trick Zones** (rainbow/cyan gradient)
  - **Y-up orientation** with origin at (0, 0, 0)
  - Apply **scale** in Blender before export (1 Blender unit = 1 meter)
  - Keep polygon count reasonable (aim for 5,000-20,000 tris for track surface)
  - **UV unwrap** properly for textures
  - Add a **custom property** to the root mesh: `trackType: "circuit"` or `"linear"`

### 2. **Checkpoints & Lap System**
- **File naming**: `checkpoints.glb`
- **Requirements**:
  - Create invisible planes/boxes positioned vertically across the track
  - Name each checkpoint mesh sequentially: `checkpoint_001`, `checkpoint_002`, etc.
  - First checkpoint should be the **Start/Finish line**
  - Each checkpoint needs a **custom property**:
    - `checkpointId: 1, 2, 3...`
    - `isFinishLine: true/false`
  - Position them flush with the track surface, extending from ground to ~5m height
  - Width should span the entire track width (26m default)

### 3. **Trick Ramps**
- **File naming**: `trick_ramps.glb`
- **Requirements**:
  - Model ramps with **three distinct sections**:
    1. **Approach zone** (flat or gentle slope)
    2. **Launch zone** (angled upward 15-45°)
    3. **Landing zone** (flat or gentle downward slope)
  - Add custom properties to launch zone meshes:
    - `trickRamp: true`
    - `launchAngle: 25` (degrees)
    - `launchForce: 8` (vertical velocity boost)
    - `trickWindow: 1.5` (seconds player can perform tricks)
  - Name ramps sequentially: `ramp_001`, `ramp_002`, etc.
  - Recommended dimensions:
    - Width: Match track width (26m)
    - Launch zone length: 3-8m
    - Height gain: 2-6m

### 4. **Glider Sections**
- **File naming**: `glider_zones.glb`
- **Requirements**:
  - Create **trigger volumes** (invisible boxes) where glider should activate
  - Name meshes: `glider_start_001`, `glider_end_001`, etc.
  - Custom properties for start zones:
    - `gliderTrigger: "start"`
    - `gliderHeight: 12` (minimum height to activate)
    - `glideRatio: 2.5` (forward distance per unit of height lost)
  - Custom properties for end zones:
    - `gliderTrigger: "end"`
  - Model visual elements separately:
    - **Launch cannons** or **boost rings** (name: `glider_visual_001`)
    - **Landing platforms** (name: `glider_landing_001`)
  - Recommended glide section length: 50-200m

### 5. **Hazards**
Create separate GLB files for each hazard type:

#### **a) Static Hazards** (`hazards_static.glb`)
- **Obstacles**: Rocks, barriers, trees
  - Name: `obstacle_001`, `obstacle_002`
  - Custom property: `hazardType: "obstacle"`, `damage: 0` (just collision)
- **Spinners**: Rotating barriers
  - Name: `spinner_001`, `spinner_002`
  - Custom property: `hazardType: "spinner"`, `rotationSpeed: 90`, `damage: 1`
- **Oil Slicks**: Flat decals/planes
  - Name: `oil_001`, `oil_002`
  - Custom property: `hazardType: "slippery"`, `friction: 0.1`

#### **b) Moving Hazards** (`hazards_moving.glb`)
- **Thwomps**: Vertical crushers
  - Name: `thwomp_001`
  - Custom properties:
    - `hazardType: "thwomp"`
    - `moveRange: 8` (meters vertical travel)
    - `moveSpeed: 4` (m/s)
    - `waitTime: 2` (seconds at top)
    - `damage: 2`
- **Pendulums**: Swinging obstacles
  - Name: `pendulum_001`
  - Custom properties:
    - `hazardType: "pendulum"`
    - `swingAngle: 60` (degrees each side)
    - `swingPeriod: 3` (seconds for full swing)
- **Moving Platforms**: Translate along path
  - Name: `platform_001`
  - Custom property: `hazardType: "platform"`, `pathPoints: [[0,0,0], [10,0,0]]`

#### **c) Item Boxes** (`item_boxes.glb`)
- Model as floating cubes/question blocks
- Name: `itembox_001`, `itembox_002`
- Custom properties:
  - `itemBox: true`
  - `respawnTime: 5` (seconds)
  - `itemTier: 1` (1-3, affects item probability)
- Dimensions: ~1.5m cube
- Position ~2m above track surface

### 6. **Environmental Decorations** (`environment.glb`)
- **Guardrails**: Already handled in code, but can add custom models
  - Name: `guardrail_left_001`, `guardrail_right_001`
- **Scenery**: Trees, buildings, crowds
  - Name with prefix: `scenery_*`
  - Keep polycount low (LOD recommended)
  - No custom properties needed (visual only)
- **Sky elements**: Mountains, clouds (separate mesh)
  - Name: `background_*`

---

## 📐 Technical Specifications

### Scale & Units
- **1 Blender unit = 1 meter in-game**
- Default track width: **26 meters**
- Kart dimensions: ~2.85m wide × 2.85m tall × 5.25m long

### Coordinate System
- **Y-axis**: Up (Blender default)
- **Z-axis**: Forward (track direction)
- **X-axis**: Track width (left/right)
- Origin (0, 0, 0): Starting position center

### Export Settings (GLB/glTF)
1. **Format**: glTF Binary (.glb)
2. **Include**: Selected Objects only
3. **Transform**:
   - ✅ +Y Up
   - ✅ Apply Modifiers
   - ✅ Apply Transform (scale/rotation/location baked)
4. **Geometry**:
   - ✅ UVs
   - ✅ Normals
   - ✅ Vertex Colors (if using for surface types)
   - ✅ Materials
5. **Animation**: Include if hazards have animations
6. **Custom Properties**: ✅ Include (CRITICAL!)

### Custom Properties - How to Add in Blender
1. Select mesh in Object Mode
2. Go to **Object Properties** panel (orange cube icon)
3. Scroll to **Custom Properties**
4. Click **New** or **+**
5. Edit property name and value (match spec above)
6. Set type: String, Integer, Float, Boolean as needed

---

## 🎨 Material & Texture Guidelines

### Surface Type Materials
Create materials with these naming conventions for auto-detection:
- `MAT_Road_Default`
- `MAT_Road_Boost` (yellow tint, emissive)
- `MAT_Road_Slow` (brown/green)
- `MAT_Road_Trick` (rainbow shader or cyan)
- `MAT_Glider_Launch` (bright blue emissive)

### Optimization
- Use **texture atlases** where possible (combine multiple textures into one)
- Keep texture resolution reasonable:
  - Track surfaces: 2048×2048 or 4096×4096
  - Props/hazards: 512×512 to 1024×1024
  - Scenery: 256×256 to 512×512
- Use **normal maps** instead of high-poly geometry
- Apply **baked lighting** if possible (ambient occlusion)

---

## 🛣️ Track Layout Examples

### Beginner Track Requirements
- 1 lap circuit, ~800-1200m length
- 5-8 gentle turns
- 1-2 trick ramps
- 0-1 glider sections (optional)
- 3-5 item box locations
- Minimal hazards

### Advanced Track Requirements
- 3 lap circuit, 1200-2000m length
- 10-15 turns (sharp + hairpins)
- 3-5 trick ramps
- 1-2 glider sections
- 8-12 item box locations
- 5-10 hazards (mix static + moving)
- Alternate paths/shortcuts

---

## 📦 File Organization

Create a folder structure in `HadleeKart/assets/tracks/[track_name]/`:

```
assets/tracks/rainbow_road/
├── track_surface.glb
├── checkpoints.glb
├── trick_ramps.glb
├── glider_zones.glb
├── hazards_static.glb
├── hazards_moving.glb
├── item_boxes.glb
├── environment.glb
├── preview.png (thumbnail)
└── track_config.json (metadata)
```

### track_config.json Example
```json
{
  "name": "Rainbow Road",
  "author": "Your Name",
  "difficulty": "expert",
  "laps": 3,
  "lengthMeters": 1500,
  "hasTricks": true,
  "hasGliders": true,
  "hazardCount": 12,
  "itemBoxCount": 10,
  "music": "rainbow_road_theme.ogg",
  "skybox": "space_stars",
  "timeOfDay": "night"
}
```

---

## 🚀 Next Steps - What I'll Implement

Once you provide the GLB files following this spec, I will implement:

### 1. **Track Loader System**
- GLTFLoader integration for all track components
- Parse custom properties from Blender meshes
- Build collision geometry from track surface
- Position checkpoints and lap counter

### 2. **Trick System**
```javascript
- Detect ramp triggers
- Apply launch velocity
- Enable trick window (button inputs for points)
- Award speed boost on successful landing
- Visual feedback (spin animations, particle effects)
```

### 3. **Glider Mechanics**
```javascript
- Activate glider on trigger entry + sufficient height
- Override gravity with glide physics
- Steering in air (pitch/yaw control)
- Auto-close glider on landing or end zone
```

### 4. **Hazard System**
```javascript
- Static collision detection
- Animated hazard movement (Thwomps, pendulums)
- Damage/slowdown effects on contact
- Visual warnings (shadow indicators, sounds)
```

### 5. **Item Box Spawning**
```javascript
- Collision detection with item boxes
- Trigger item give() from ItemManager
- Respawn timers with visual effects
- Rotating/hovering animations
```

### 6. **Enhanced Physics**
```javascript
- Surface type detection (boost pads, slow zones)
- Speed multipliers based on material
- Improved collision with complex track geometry
```

---

## ❓ Questions for You

Before you start modeling, please confirm:

1. **Track theme/style**: What kind of track do you want to create first? (e.g., city, nature, space, retro rainbow?)
2. **Difficulty level**: Beginner-friendly or advanced?
3. **Special features priority**: Which is most important? (Tricks, gliders, or hazards?)
4. **Number of tracks**: Starting with one, or multiple variations?
5. **Visual style**: Realistic, cartoony, low-poly, neon/futuristic?

---

## 📋 Modeling Checklist

Before exporting each GLB file:
- [ ] Applied all transforms (Ctrl+A > All Transforms)
- [ ] Set origin to world center for track surface
- [ ] Named all meshes following convention
- [ ] Added custom properties to interactive elements
- [ ] UV unwrapped and assigned materials
- [ ] Checked scale (1 unit = 1 meter)
- [ ] Removed unnecessary geometry (hidden layers, etc.)
- [ ] Tested export/import in Blender to verify
- [ ] Optimized polycount (merged vertices, decimated if needed)

---

## 🎮 Testing Workflow

1. Export GLB from Blender
2. Place in `assets/tracks/[track_name]/` folder
3. I'll update the track loader code to import your files
4. Test in-game for:
   - Collision accuracy
   - Checkpoint triggers
   - Trick ramp functionality
   - Glider activation
   - Hazard behavior
5. Iterate based on feedback

---

Let me know what you'd like to model first, and I'll prepare the corresponding code systems! 🏁
