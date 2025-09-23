# Audio Assets for Idle Breakout+

This directory contains placeholder audio files for the game. The game will function silently without these files, but adding appropriate sound effects will enhance the player experience.

## Required Audio Files

- `brick_break.mp3` - Sound when bricks are destroyed
- `upgrade.mp3` - Sound when purchasing upgrades  
- `powerup.mp3` - Sound when activating power-ups
- `level_complete.mp3` - Sound when completing a level

## Audio Specifications

For best results, audio files should be:
- Format: MP3 or OGG for broad browser compatibility
- Length: 0.5-2 seconds for sound effects
- Quality: 44.1kHz, 16-bit or higher
- Volume: Normalized to prevent audio clipping

## Adding Your Own Sounds

1. Replace the placeholder files with your own audio
2. Ensure file names match exactly
3. Test in your browser to verify compatibility
4. Consider providing multiple formats for maximum compatibility

The game's audio system will automatically attempt to play these sounds when appropriate events occur, with graceful fallback to silent operation if files are missing.