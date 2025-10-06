# Quick Start - Testing Your Track

## How to Test Spungilious Speedway

1. **Open the game**:
   - Open `index.html` in a modern browser (Chrome, Firefox, Edge)
   - The track should load automatically

2. **Controls**:
   - **W** - Accelerate
   - **A/D** - Steer
   - **Shift** - Drift (hold while turning)
   - **E** - Use item
   - **T** - Respawn

3. **What to Look For**:

   ✅ **Track loads correctly**
   - Track model appears
   - Kart spawns at Start.0
   - Can drive around

   ✅ **Checkpoints work**
   - Bottom-left shows: "Lap: 1/3 | Checkpoints: 0/13"
   - Counter increments as you drive through invisible checkpoint markers
   - Lap advances when you cross finish line after passing all checkpoints

   ✅ **Item boxes spawn**
   - 15 golden rotating cubes around the track
   - Disappear when you touch them
   - Reappear after 5 seconds
   - Give you a random item

   ✅ **Respawn works**
   - Press T to teleport to last checkpoint
   - Fall off track → auto-respawn after brief delay

## Console Commands (Press F12)

Check the browser console for debug info:

```javascript
// See all checkpoints passed
internal.vehicle.checkpointManager.getStatus()

// Force respawn
internal.vehicle.respawn()

// Check track data
internal.trackLoader.getTrackData()

// Get current position
internal.vehicle.group.position
```

## Known Issues to Test

1. **Checkpoint placement**: 
   - Are all 13 checkpoints triggering?
   - Is Checkpoint.0 actually at the finish line?
   - Do you need to pass them in a specific order or can you skip?

2. **Dropoff points**:
   - Do they update your respawn position when you drive through them?
   - Are they positioned well for falling off sections?

3. **Item boxes**:
   - Are all 15 accessible?
   - Any floating in weird places?

4. **Bounds/Walls**:
   - Can you drive off the track easily?
   - Do walls stop you properly?

5. **Trick ramps**:
   - Check console for "On trick zone: true" when driving over Trick meshes
   - (Actual trick mechanics not implemented yet)

## Troubleshooting

### Track doesn't load
- Check console for errors
- Verify file path: `./assets/track/spungilious_speedway/Spungilious Speedway.glb`
- Make sure spaces in filename are preserved

### Checkpoints don't register
- They might be positioned incorrectly
- Check if they're wide enough (should span full track width)
- Verify they're named `Checkpoint.0`, `Checkpoint.1`, etc.

### Item boxes missing
- Verify objects are named `Item.0` through `Item.14`
- Check if they have world positions set in Blender

### Kart spawns in wrong place
- Check `Start.0` position and rotation in Blender
- Make sure transforms are applied before export

## Performance Check

Open browser console and type:
```javascript
// Check FPS (should be close to 60)
setInterval(() => console.log(`FPS: ${Math.round(1000/internal.clock.getDelta())}`), 1000)
```

If FPS is low:
- Track might have too many polygons
- Try reducing polygon count in Blender
- Simplify Misc (decorative) objects

## What's Next?

Once you've tested and confirmed everything works:

1. **Report what works** ✅
2. **Report what doesn't work** ❌
3. **Decide on next feature**:
   - Tricks (aerial maneuvers on ramps)
   - Better collision (mesh-based wall collision)
   - More visual polish (particles, effects)
   - Another track?

Happy testing! 🏁
