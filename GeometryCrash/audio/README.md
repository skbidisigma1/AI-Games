# Audio Assets for Geometry Crash

This directory contains audio assets for the rhythm-based platformer experience.

## Sound Effects:

### Gameplay Sounds
- `click.mp3` - Player interaction sound (jump, thrust, gravity flip)
- `death.mp3` - Sound when player hits an obstacle
- `complete.mp3` - Level completion celebration sound

### Background Music
- `default.mp3` - Default background music track (placeholder)

## Music Upload Feature

Players can upload their own music files through the game interface. Supported formats:
- MP3 (recommended for web compatibility)
- WAV (high quality, larger file size)
- OGG (alternative web format)

## Implementation Notes:
- All audio elements are optional - game works without them
- Audio files should be optimized for web playback
- Consider using Web Audio API for precise rhythm synchronization
- Include volume controls and mute options for accessibility

## File Specifications:
- **Format**: MP3 recommended for broad browser support
- **Quality**: 128kbps for sound effects, 192kbps+ for music
- **Length**: Sound effects should be <2 seconds each
- **Volume**: Normalized to prevent audio clipping
- **Background Music**: Should loop seamlessly for continuous play

## Rhythm Integration:
The game is designed to be played in sync with background music. For optimal experience:
- Use music with clear, steady beats (120-180 BPM works well)
- Music should have distinct rhythmic elements
- Consider the level length (~60-90 seconds) when choosing tracks