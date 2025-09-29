# BaileyKart Season 2 - Audio & Voice Acting Requests

This file contains all audio and voice acting requests for BaileyKart Season 2. Please create the requested audio files and place them in the `audio/` directory.

## Voice Acting Requests

### Main Characters

#### Stewart (The Protagonist)
**Voice Type**: Determined, heroic male voice with a strong, confident tone
**Character**: Champion racer defending fair play

| File Name | Content | Context |
|-----------|---------|---------|
| `stewart_intro.wav` | "Time to remind everyone what true sportsmanship looks like." | Race 1 pre-race |
| `stewart_challenge.wav` | "I built my reputation on integrity and skill." | Race 1 determination |
| `stewart_ready.wav` | "I'm ready for whatever challenge comes next." | General race start |
| `stewart_victory.wav` | "Fair play always wins in the end!" | Race victory |
| `stewart_determined.wav` | "Juliette may be cunning, but honor will prevail." | Race 2 pre-race |

#### Juliette (The Antagonist)
**Voice Type**: Smooth, calculating female voice with subtle menace
**Character**: Mysterious racing villain with advanced tactics

| File Name | Content | Context |
|-----------|---------|---------|
| `juliette_intro.wav` | "Impressive, Stewart. I've heard so much about the legendary 'honorable champion.'" | First meeting |
| `juliette_challenge.wav` | "We should race together sometime... I have so much to teach you about modern racing." | Challenge issued |
| `juliette_taunt.wav` | "Don't disappoint me, champion. I'd hate for this to be too easy." | Race 2 pre-race |
| `juliette_analysis.wav` | "Interesting. You're more resilient than I expected. This will be... educational." | Post-race analysis |
| `juliette_confident.wav` | "Control is everything in racing, Stewart." | General intimidation |

### Supporting Characters

#### Marcus (Racing Friend)
**Voice Type**: Concerned, friendly male voice
**Character**: Veteran racer warning Stewart

| File Name | Content | Context |
|-----------|---------|---------|
| `marcus_warning.wav` | "Things aren't the same around here. Some new racer named Juliette showed up a few months ago." | Race 1 warning |
| `marcus_concern.wav` | "She's been... changing things. Winning races through tactics that push the boundaries of fair play." | Exposition |

#### Sarah (Veteran Racer)
**Voice Type**: Experienced, slightly worried female voice
**Character**: Veteran providing intelligence

| File Name | Content | Context |
|-----------|---------|---------|
| `sarah_intel.wav` | "She's different from any racer I've seen. She gets inside people's heads, makes them doubt themselves." | Race 2 briefing |
| `sarah_fear.wav` | "Half the circuit is afraid to race against her now." | Explaining Juliette's influence |

#### Anonymous Racer
**Voice Type**: Nervous, secretive male voice
**Character**: Underground racer seeking help

| File Name | Content | Context |
|-----------|---------|---------|
| `anonymous_tip.wav` | "She's been recruiting racers with promises of easy money. But once they're in, they can't get out." | Race 3 intel |
| `anonymous_plea.wav` | "I know who you really are, Stewart. Please... help us. She's destroying everything we love about racing." | Post-race plea |

## Sound Effects Requests

### Racing Sounds

| File Name | Content | Usage |
|-----------|---------|--------|
| `engine_start.wav` | Kart engine starting up | Race beginning |
| `engine_rev.wav` | Engine revving sound | Acceleration |
| `drift_sound.wav` | Tire squealing during drift | Drift mechanic |
| `crash_impact.wav` | Collision sound effect | Kart crashes |
| `checkpoint_pass.wav` | Success chime | Passing checkpoints |
| `lap_complete.wav` | Victory fanfare | Completing laps |

### Power-Up Sounds

| File Name | Content | Usage |
|-----------|---------|--------|
| `powerup_collect.wav` | Magical pickup sound | Collecting power-ups |
| `mushroom_boost.wav` | Speed boost whoosh | Speed mushroom |
| `banana_drop.wav` | Comedic drop sound | Banana peel deployment |
| `shell_fire.wav` | Projectile launch | Firing shells |
| `shell_hit.wav` | Explosion impact | Shell hits target |
| `bomb_explode.wav` | Large explosion | Demolition bomb |
| `lightning_strike.wav` | Thunder crack | Lightning power-up |

### UI Sounds

| File Name | Content | Usage |
|-----------|---------|--------|
| `menu_select.wav` | Button click sound | Menu navigation |
| `menu_back.wav` | Softer back sound | Going back |
| `race_countdown.wav` | "3, 2, 1, GO!" sequence | Race start countdown |
| `victory_fanfare.wav` | Triumphant music sting | Race victory |
| `defeat_sound.wav` | Disappointed sound | Race loss |

### Ambient Sounds

| File Name | Content | Usage |
|-----------|---------|--------|
| `crowd_cheer.wav` | Racing crowd cheering | Background atmosphere |
| `crowd_gasp.wav` | Crowd reaction to crashes | Dramatic moments |
| `wind_whoosh.wav` | Air rushing sound | High-speed racing |

## Background Music Requests

### Track Themes

| File Name | Content | Usage |
|-----------|---------|--------|
| `title_theme.wav` | Energetic racing theme | Main menu |
| `classic_track.wav` | Upbeat racing music | Classic track |
| `figure8_track.wav` | Intense, fast-paced music | Figure-8 track |
| `mountain_track.wav` | Dramatic, adventurous music | Mountain track |
| `story_mode_theme.wav` | Epic, narrative-driven music | Story mode |
| `victory_theme.wav` | Celebratory music | Race victories |

### Story Music

| File Name | Content | Usage |
|-----------|---------|--------|
| `stewart_theme.wav` | Heroic, noble melody | Stewart's character theme |
| `juliette_theme.wav` | Dark, mysterious melody | Juliette's character theme |
| `tension_music.wav` | Suspenseful background music | Dramatic story moments |
| `confrontation_music.wav` | Intense battle music | Stewart vs Juliette races |

## Technical Requirements

- **File Format**: WAV or MP3 (MP3 preferred for smaller file sizes)
- **Quality**: 44.1kHz, 16-bit minimum
- **Length**: 
  - Voice lines: 2-8 seconds each
  - Sound effects: 0.5-3 seconds each
  - Background music: 30-60 seconds (loopable)
- **Volume**: Consistent levels across all files
- **Processing**: Light compression and EQ as needed

## Voice Direction Notes

- **Stewart**: Should sound confident but not arrogant, determined but fair
- **Juliette**: Intelligent and calculating, with subtle menace rather than obvious villainy
- **Supporting characters**: Natural, conversational tone matching their personality
- **Overall tone**: Exciting but family-friendly, suitable for all ages

## Implementation Notes

All audio files will be loaded dynamically by the game engine. Files should be optimized for web delivery while maintaining good quality. The game will gracefully handle missing audio files by continuing without sound effects.