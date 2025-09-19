# Audio Assets for Dune

This directory contains audio assets for enhanced game experience.

## Sound Effects:

### Player Actions
- `shoot.mp3` - Player weapon firing sound
- `hit.mp3` - Bullet impact sound for both player and enemy hits

### Enemy Actions  
- `enemy_death.mp3` - Sound when enemy is eliminated

### Item Collection
- `health_pickup.mp3` - Sound when collecting health packs

### Ambient Audio
- `desert_wind.mp3` - Background ambient desert sounds (optional)
- `battle_music.mp3` - Combat background music (optional)

## Implementation Notes:
- Current implementation uses placeholder audio elements
- All audio elements are optional - game works without them
- Audio files should be compressed MP3 format for web compatibility
- Consider using Web Audio API for better performance with multiple simultaneous sounds
- Include volume controls and mute options for accessibility

## File Specifications:
- **Format**: MP3 (for broad browser support)
- **Quality**: 128kbps (balance of quality and file size)
- **Length**: Sound effects should be <2 seconds each
- **Volume**: Normalized to prevent audio clipping