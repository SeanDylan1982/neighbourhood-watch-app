# Audio Files Directory

This directory contains notification sound files for the application.

## Sound Files

The following sound files should be placed in this directory:

### Message Sounds
- `message.mp3` - Primary message notification sound
- `message.ogg` - OGG fallback for message notifications
- `message.wav` - WAV fallback for message notifications

### Friend Request Sounds
- `friend-request.mp3` - Friend request notification sound
- `friend-request.ogg` - OGG fallback for friend requests

### Like Sounds
- `like.mp3` - Like notification sound
- `like.ogg` - OGG fallback for likes

### Comment Sounds
- `comment.mp3` - Comment notification sound
- `comment.ogg` - OGG fallback for comments

### System Sounds
- `system.mp3` - System notification sound
- `system.ogg` - OGG fallback for system notifications

### Default Sounds
- `notification.mp3` - Default notification sound
- `notification.ogg` - OGG fallback for default notifications

## File Format Requirements

- **MP3**: Primary format, widely supported
- **OGG**: Fallback format for browsers that don't support MP3
- **WAV**: Additional fallback for maximum compatibility

## Audio Specifications

- **Duration**: 0.5-2 seconds recommended
- **Sample Rate**: 44.1 kHz or 48 kHz
- **Bit Rate**: 128-320 kbps for MP3
- **Volume**: Normalized to prevent clipping

## Fallback Behavior

If audio files are missing, the AudioManager will:
1. Try to load each format in order (MP3 → OGG → WAV)
2. Generate synthetic beep sounds as fallback
3. Continue to function without audio if all methods fail

This ensures the application works even without audio files present.