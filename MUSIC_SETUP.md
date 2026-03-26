# Music Player Setup Guide

## Current Implementation

The audio player is now functional and will:
- Persist music across page navigation
- Remember play/pause state
- Maintain volume settings
- Display play/pause button with volume slider

## Music File Options

### Option 1: Local Audio File (Recommended for Portfolio)

**Pros:**
- Works offline
- No external dependencies
- Fast loading
- Full control

**Setup:**
1. Place your music file in `/static/music/background.mp3`
2. Supported formats: MP3, OGG, WAV
3. The player is already configured to use `/music/background.mp3`

**File Structure:**
```
portfolio/
├── static/
│   └── music/
│       └── background.mp3  ← Place your file here
```

**Recommendations:**
- Use MP3 format (best browser compatibility)
- Keep file size under 5MB for fast loading
- Use 128kbps bitrate (good quality, reasonable size)
- Consider looping-friendly tracks (seamless loop points)

### Option 2: Spotify Embed (Limited)

**Pros:**
- Access to Spotify catalog
- No file hosting needed

**Cons:**
- Requires Spotify Premium for some features
- User must have Spotify account
- Cannot persist across navigation easily
- Requires iframe embed (breaks the immersive experience)

**Not Recommended** for this use case because:
- Spotify Web API doesn't allow direct playback in browsers without user authentication
- Embeds don't integrate well with Three.js navigation
- Cannot control playback programmatically without complex OAuth flow

### Option 3: SoundCloud Widget (Limited)

**Pros:**
- Free to use
- Widget API available

**Cons:**
- Requires iframe embed
- Limited control over playback
- Breaks immersive experience
- Requires internet connection

**Implementation (if you want to try):**
```javascript
// In AudioControl.js, replace audioManager.init() with:
const widget = SC.Widget(iframeElement);
widget.bind(SC.Widget.Events.READY, () => {
  widget.play();
});
```

### Option 4: YouTube Audio (Not Recommended)

**Cons:**
- Against YouTube ToS for background audio
- Requires iframe
- Poor user experience
- Cannot hide video player effectively

## Recommended Approach

**Use a local MP3 file:**

1. Find or create a looping ambient track
2. Export as MP3 (128kbps, 44.1kHz)
3. Place in `/static/music/background.mp3`
4. Done!

**Free Music Resources:**
- **Incompetech** (incompetech.com) - Royalty-free music
- **Free Music Archive** (freemusicarchive.org)
- **YouTube Audio Library** (download, then host locally)
- **Bensound** (bensound.com) - Free with attribution
- **Purple Planet** (purple-planet.com)

## Testing

1. Place a music file at `/static/music/background.mp3`
2. Run `gatsby develop`
3. Click the play button in bottom-right corner
4. Navigate between pages - music should continue
5. Adjust volume slider to test volume control

## Troubleshooting

**Music doesn't play:**
- Check browser console for errors
- Ensure file path is correct: `/static/music/background.mp3`
- Verify file format is supported (MP3 recommended)
- Check that you've clicked somewhere on the page first (browser autoplay policy)

**Music stops when navigating:**
- This shouldn't happen with the current implementation
- Check that AudioManager is properly initialized
- Verify that the audio element isn't being recreated

**Volume slider doesn't work:**
- Check that audio is initialized before adjusting volume
- Verify AudioManager.setVolume() is being called

## Current File Path

The player expects: `/music/background.mp3`

This resolves to: `/static/music/background.mp3` in your Gatsby project.

Create the directory if it doesn't exist:
```bash
mkdir -p static/music
```

Then add your music file there.
