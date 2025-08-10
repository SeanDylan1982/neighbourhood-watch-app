#!/usr/bin/env node

/**
 * Asset copying script for production builds
 * Ensures all required assets are properly copied to build directory
 */

const fs = require('fs');
const path = require('path');

class AssetCopier {
  constructor() {
    this.publicDir = path.join(__dirname, '../public');
    this.buildDir = path.join(__dirname, '../build');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      this.log(`Created directory: ${dirPath}`);
    }
  }

  copyFile(src, dest) {
    try {
      const destDir = path.dirname(dest);
      this.ensureDirectoryExists(destDir);
      
      fs.copyFileSync(src, dest);
      this.log(`Copied: ${path.relative(this.publicDir, src)} → ${path.relative(this.buildDir, dest)}`);
      return true;
    } catch (error) {
      this.log(`Failed to copy ${src}: ${error.message}`, 'error');
      return false;
    }
  }

  copyDirectory(srcDir, destDir) {
    if (!fs.existsSync(srcDir)) {
      this.log(`Source directory not found: ${srcDir}`, 'warning');
      return;
    }

    this.ensureDirectoryExists(destDir);
    
    const items = fs.readdirSync(srcDir);
    
    items.forEach(item => {
      const srcPath = path.join(srcDir, item);
      const destPath = path.join(destDir, item);
      
      const stats = fs.statSync(srcPath);
      
      if (stats.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        this.copyFile(srcPath, destPath);
      }
    });
  }

  copyAudioFiles() {
    this.log('Copying audio files...');
    
    const soundsSrc = path.join(this.publicDir, '../public/sounds');
    const soundsDest = path.join(this.buildDir, 'sounds');
    
    if (fs.existsSync(soundsSrc)) {
      this.copyDirectory(soundsSrc, soundsDest);
    } else {
      this.log('Sounds directory not found, skipping audio files', 'warning');
    }
  }

  copyServiceWorker() {
    this.log('Copying service worker...');
    
    const swSrc = path.join(this.publicDir, 'sw.js');
    const swDest = path.join(this.buildDir, 'sw.js');
    
    if (fs.existsSync(swSrc)) {
      this.copyFile(swSrc, swDest);
    } else {
      this.log('Service worker not found, skipping', 'warning');
    }
  }

  copyManifest() {
    this.log('Ensuring manifest.json is properly copied...');
    
    const manifestSrc = path.join(this.publicDir, 'manifest.json');
    const manifestDest = path.join(this.buildDir, 'manifest.json');
    
    if (fs.existsSync(manifestSrc) && !fs.existsSync(manifestDest)) {
      this.copyFile(manifestSrc, manifestDest);
    }
  }

  copyIcons() {
    this.log('Copying icon files...');
    
    const iconFiles = [
      'favicon.ico',
      'favicon.png',
      'logo192.png',
      'logo512.png',
      'logo-neibrly.png',
      'logo-neibrly-small.png',
      'logo-neibrly-large.png'
    ];
    
    iconFiles.forEach(iconFile => {
      const iconSrc = path.join(this.publicDir, iconFile);
      const iconDest = path.join(this.buildDir, iconFile);
      
      if (fs.existsSync(iconSrc)) {
        this.copyFile(iconSrc, iconDest);
      }
    });
  }

  updateIndexHtml() {
    this.log('Updating index.html for production...');
    
    const indexPath = path.join(this.buildDir, 'index.html');
    
    if (!fs.existsSync(indexPath)) {
      this.log('index.html not found in build directory', 'error');
      return;
    }

    try {
      let indexContent = fs.readFileSync(indexPath, 'utf8');
      
      // Ensure service worker registration is present
      if (!indexContent.includes('serviceWorker')) {
        const swScript = `
<script>
  // Service worker registration with error handling
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js')
        .then(function(registration) {
          console.log('SW registered: ', registration);
        })
        .catch(function(registrationError) {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
</script>`;
        
        indexContent = indexContent.replace('</body>', `${swScript}\n</body>`);
        fs.writeFileSync(indexPath, indexContent);
        this.log('Added service worker registration to index.html');
      }
    } catch (error) {
      this.log(`Error updating index.html: ${error.message}`, 'error');
    }
  }

  run() {
    this.log('🚀 Starting asset copying...');
    
    if (!fs.existsSync(this.buildDir)) {
      this.log('Build directory not found. Run npm run build first.', 'error');
      process.exit(1);
    }
    
    this.copyAudioFiles();
    this.copyServiceWorker();
    this.copyManifest();
    this.copyIcons();
    this.updateIndexHtml();
    
    this.log('🎉 Asset copying completed successfully!');
  }
}

// Run if called directly
if (require.main === module) {
  const copier = new AssetCopier();
  copier.run();
}

module.exports = AssetCopier;