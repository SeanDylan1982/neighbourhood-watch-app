# 3D Icon System

This directory contains the 3D icon system for the Neighborhood Watch App. The system provides a consistent way to use 3D icons throughout the application, with fallbacks to Material-UI icons when 3D icons are not available.

## Components

### Icon3D

The main component for rendering 3D icons. It accepts the following props:

- `name`: The name of the icon
- `category`: The category of the icon (default: 'interface')
- `size`: The size of the icon in pixels (default: 24)
- `color`: The color of the icon (for fallback Material-UI icons)
- `sx`: Additional styles for the container
- `onClick`: Click handler

Example usage:

```jsx
import { Icon3D } from './components/Common/Icons';

function MyComponent() {
  return (
    <Icon3D 
      name="home" 
      category="interface" 
      size={32} 
      onClick={() => console.log('Icon clicked')} 
    />
  );
}
```

### Icon Registry

The icon registry maps Material-UI icon names to 3D icon names and categories. This helps maintain a consistent mapping between Material-UI icons and 3D icons.

### Icon Files

The 3D icons are stored as SVG files in the public/assets/icons/3d directory, organized by category. The Icon3D component loads these files dynamically when needed.

## Usage

### Direct Usage

```jsx
import { Icon3D } from './components/Common/Icons';

function MyComponent() {
  return (
    <div>
      <Icon3D name="home" category="interface" size={32} />
      <Icon3D name="chat" category="communication" size={24} />
    </div>
  );
}
```

### As Material-UI Icon Replacement

```jsx
import icons from './components/Common/Icons';

function MyComponent() {
  return (
    <div>
      <icons.Home size={32} />
      <icons.Chat size={24} />
    </div>
  );
}
```

## Icon Loading Process

The Icon3D component uses the following process to load icons:

1. It attempts to load the icon from the file system at `/assets/icons/3d/{category}/{name}.svg`
2. If the icon cannot be loaded, it falls back to the corresponding Material-UI icon

## Icon Demo

The application includes an icon demo page that shows all available 3D icons alongside their Material-UI counterparts. You can access it at `/icons` in the application.

## Scripts

The following scripts are available for managing 3D icons:

- `npm run download-icons`: Downloads 3D icons from 3dicons.co
- `npm run replace-icons`: Replaces Material-UI icons with 3D icons throughout the application
- `npm run icons`: Runs both scripts in sequence

## Directory Structure

- `Icon3D.js`: The main component for rendering 3D icons
- `iconRegistry.js`: Maps Material-UI icon names to 3D icon names and categories
- `index.js`: Exports the components and creates Material-UI icon replacements
- `IconDemo.js`: A component for demonstrating 3D icons
- `README.md`: This documentation file

## Icon Assets

3D icons are stored in the `public/assets/icons/3d` directory, organized by category:

- `interface`: UI and interaction icons
- `communication`: Communication-related icons
- `media`: Media-related icons
- `emoji`: Emoji icons
- `animals`: Animal icons
- `transport`: Transportation icons
- `tools`: Tool icons
- `technology`: Technology icons

## Visual Consistency

To maintain visual consistency across the application:

- All 3D icons use a consistent style with gradients and subtle shadows
- Icons maintain consistent sizing and proportions
- Each icon category uses a consistent color palette
- All icons have proper fallbacks to Material-UI icons

## Testing

The 3D icon system includes comprehensive tests in `tests/Icon3D.test.js` to ensure proper rendering, fallback behavior, and cleanup.

## Adding New Icons

To add a new icon:

1. Add the icon mapping to iconRegistry.js
2. Place the SVG file in the appropriate category directory in public/assets/icons/3d/
3. Run the icon replacement script to update icon usage throughout the application