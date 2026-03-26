# Three.js Navigation Integration

## Overview

This portfolio now features an integrated Three.js navigation system with persistent audio playback. The navigation maintains the existing look and feel while adding interactive 3D elements.

## Features

### 1. **3D Navigation Portals**
- Subtle ring portals positioned in 3D space for each route
- Hover effects with color transitions and scaling
- Click portals to navigate between pages
- Active route highlighted with increased opacity and white color
- Located at: `src/components/ThreeBackground/NavigationPortals.js`

### 2. **Camera Transitions**
- Smooth camera movements between pages
- Subtle position shifts that don't disrupt the viewing experience
- Maintains focus on content while adding depth
- Located at: `src/components/ThreeBackground/CameraController.js`

### 3. **Persistent Audio Manager**
- Music continues playing across page navigation
- Singleton pattern ensures single audio instance
- User interaction detection for autoplay compliance
- Volume control with smooth transitions
- Located at: `src/utils/AudioManager.js`

### 4. **Audio Control UI**
- Fixed position control in bottom-right corner
- Play/pause toggle button
- Volume slider
- Styled to match portfolio aesthetic
- Located at: `src/components/AudioControl/`

## How It Works

### Navigation Flow
1. User clicks a portal ring in the 3D scene
2. Portal click triggers Gatsby navigation
3. Camera smoothly transitions to new position
4. Active portal updates visual state
5. Music continues uninterrupted

### Existing Navigation Preserved
- Top menu bar still fully functional
- Scroll-wheel navigation between pages maintained
- All keyboard shortcuts work as before
- Mobile navigation unchanged

## Portal Positions

```javascript
Home: (0, 3, -8)
Code/Experience: (-5, 1.5, -8)
Creative: (5, 1.5, -8)
Working Style: (-5, -1.5, -8)
Contact: (5, -1.5, -8)
```

## Camera Positions

Subtle shifts for each route:
- Home: Centered (0, 0, 5)
- Other pages: Slight offset to create depth

## Customization

### Adjust Portal Appearance
Edit `NavigationPortals.js`:
- `baseOpacity`: Default visibility (currently 0.15)
- `hoverOpacity`: Hover state visibility (currently 0.6)
- Ring size: `RingGeometry(innerRadius, outerRadius, segments)`

### Adjust Camera Movement
Edit `CameraController.js`:
- `ROUTE_CAMERA_POSITIONS`: Camera position per route
- `transitionSpeed`: How fast camera moves (currently 0.05)

### Add Music
1. Place audio file in `/static/` directory
2. Update `AudioManager.init('/path/to/music.mp3')` in AudioControl component

## Browser Compatibility

- Modern browsers with WebGL support
- Audio autoplay requires user interaction (handled automatically)
- Fallback to existing navigation if Three.js unavailable

## Performance

- Portals are lightweight ring geometries
- Camera transitions use lerp for smooth 60fps animation
- Audio manager uses single Audio element
- No impact on existing page performance

## Future Enhancements

Potential additions:
- 3D text labels for portals
- Particle effects on portal hover
- Multiple music tracks per route
- VR/AR navigation support
- Portal animation sequences
