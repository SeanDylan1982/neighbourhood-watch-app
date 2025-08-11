#!/usr/bin/env node

/**
 * Asset validation script for production builds
 * Validates audio files, manifest.json, and other critical assets
 */

const fs = require('fs');
const path = require('path');

// Configuration
const REQUIRED_AUDIO_FILES = [
  'sounds/notification.mp3',
  'sounds/message.mp3',
  'sounds/like.mp3',
  'sounds/comment.mp3',
  'sounds/friend-request.mp3',
  'sounds/system.mp3'
];

const REQUIRED_MANIFEST_FIELDS = [
  'name',
  'short_name',
  'start_url',
  'display',
  'theme_color',
  'background_color',
  'icons'
];

const AUDIO_FORMATS = ['.mp3', '.ogg', '.wav', '.m4a'];
const MAX_AUDIO_SIZE = 500 * 1024; // 500KB max per audio file

class AssetValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.publicDir = path.join(__dirname, '../public');
    this.buildDir = path.join(__dirname, '../build');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  validateAudioFiles() {
    this.log('Validating audio files...');
    
    // Check if sounds directory exists
    const soundsDir = path.join(this.publicDir, 'sounds');
    if (!fs.existsSync(soundsDir)) {
      this.warnings.push('Sounds directory not found at public/sounds - AudioManager will use synthetic fallback sounds');
      return;
    }

    let audioFilesFound = 0;

    // Validate each required audio file
    REQUIRED_AUDIO_FILES.forEach(audioFile => {
      const filePath = path.join(this.publicDir, audioFile);
      
      if (!fs.existsSync(filePath)) {
        this.log(`Audio file missing: ${audioFile} - will use fallback`, 'warning');
        return;
      }

      try {
        const stats = fs.statSync(filePath);
        
        // Check file size
        if (stats.size > MAX_AUDIO_SIZE) {
          this.warnings.push(`Audio file too large: ${audioFile} (${Math.round(stats.size / 1024)}KB > ${MAX_AUDIO_SIZE / 1024}KB)`);
        }

        // Check file extension
        const ext = path.extname(filePath).toLowerCase();
        if (!AUDIO_FORMATS.includes(ext)) {
          this.warnings.push(`Unsupported audio format: ${audioFile} (${ext})`);
        }

        audioFilesFound++;
        this.log(`✅ Audio file validated: ${audioFile}`);
      } catch (error) {
        this.warnings.push(`Error reading audio file ${audioFile}: ${error.message}`);
      }
    });

    // Check for additional audio files
    try {
      const soundFiles = fs.readdirSync(soundsDir);
      soundFiles.forEach(file => {
        if (AUDIO_FORMATS.includes(path.extname(file).toLowerCase())) {
          const filePath = path.join(soundsDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.size === 0) {
            this.warnings.push(`Empty audio file detected: sounds/${file}`);
          }
        }
      });
    } catch (error) {
      this.warnings.push(`Error scanning sounds directory: ${error.message}`);
    }

    // Provide helpful message about audio fallbacks
    if (audioFilesFound === 0) {
      this.log('ℹ️ No audio files found - AudioManager will generate synthetic notification sounds', 'info');
    } else if (audioFilesFound < REQUIRED_AUDIO_FILES.length) {
      this.log(`ℹ️ ${audioFilesFound}/${REQUIRED_AUDIO_FILES.length} audio files found - AudioManager will use fallbacks for missing sounds`, 'info');
    }
  }

  validateManifest() {
    this.log('Validating manifest.json...');
    
    const manifestPath = path.join(this.publicDir, 'manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      this.errors.push('manifest.json not found');
      return;
    }

    try {
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);

      // Validate required fields
      REQUIRED_MANIFEST_FIELDS.forEach(field => {
        if (!manifest[field]) {
          this.errors.push(`Missing required manifest field: ${field}`);
        }
      });

      // Validate icons
      if (manifest.icons && Array.isArray(manifest.icons)) {
        manifest.icons.forEach((icon, index) => {
          if (!icon.src) {
            this.errors.push(`Icon ${index} missing src field`);
            return;
          }

          // Check if icon file exists
          const iconPath = path.join(this.publicDir, icon.src.replace(/^\//, ''));
          if (!fs.existsSync(iconPath)) {
            this.warnings.push(`Icon file not found: ${icon.src}`);
          }

          // Validate icon properties
          if (!icon.sizes) {
            this.warnings.push(`Icon ${index} missing sizes field`);
          }
          if (!icon.type) {
            this.warnings.push(`Icon ${index} missing type field`);
          }
        });
      } else {
        this.errors.push('Manifest icons field must be an array');
      }

      // Validate URLs
      if (manifest.start_url && !manifest.start_url.startsWith('/')) {
        this.warnings.push('start_url should be relative (start with /)');
      }

      this.log('✅ Manifest validation completed');
    } catch (error) {
      this.errors.push(`Error parsing manifest.json: ${error.message}`);
    }
  }

  validateServiceWorker() {
    this.log('Validating service worker...');
    
    const swPath = path.join(this.publicDir, 'sw.js');
    
    if (!fs.existsSync(swPath)) {
      this.warnings.push('Service worker not found at public/sw.js');
      return;
    }

    try {
      const swContent = fs.readFileSync(swPath, 'utf8');
      
      // Basic syntax validation
      if (!swContent.includes('addEventListener')) {
        this.warnings.push('Service worker may not have event listeners');
      }

      if (!swContent.includes('install')) {
        this.warnings.push('Service worker missing install event handler');
      }

      if (!swContent.includes('fetch')) {
        this.warnings.push('Service worker missing fetch event handler');
      }

      // Check for cache names
      if (!swContent.includes('CACHE_NAME') && !swContent.includes('cacheName')) {
        this.warnings.push('Service worker may not implement caching');
      }

      this.log('✅ Service worker validation completed');
    } catch (error) {
      this.errors.push(`Error reading service worker: ${error.message}`);
    }
  }

  validateBuildOutput() {
    this.log('Validating build output...');
    
    if (!fs.existsSync(this.buildDir)) {
      this.warnings.push('Build directory not found - run npm run build first');
      return;
    }

    // Check for essential build files
    const essentialFiles = [
      'index.html',
      'manifest.json',
      'static'
    ];

    essentialFiles.forEach(file => {
      const filePath = path.join(this.buildDir, file);
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Essential build file missing: ${file}`);
      }
    });

    // Check if service worker is copied to build
    const buildSwPath = path.join(this.buildDir, 'sw.js');
    if (!fs.existsSync(buildSwPath)) {
      this.warnings.push('Service worker not found in build output');
    }

    this.log('✅ Build output validation completed');
  }

  generateReport() {
    this.log('\n📊 Asset Validation Report');
    this.log('='.repeat(50));
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      this.log('✅ All assets validated successfully!', 'info');
      return true;
    }

    if (this.errors.length > 0) {
      this.log(`\n❌ Errors (${this.errors.length}):`, 'error');
      this.errors.forEach(error => this.log(`  • ${error}`, 'error'));
    }

    if (this.warnings.length > 0) {
      this.log(`\n⚠️ Warnings (${this.warnings.length}):`, 'warning');
      this.warnings.forEach(warning => this.log(`  • ${warning}`, 'warning'));
    }

    this.log('\n' + '='.repeat(50));
    
    return this.errors.length === 0;
  }

  run() {
    this.log('🚀 Starting asset validation...');
    
    this.validateAudioFiles();
    this.validateManifest();
    this.validateServiceWorker();
    this.validateBuildOutput();
    
    const success = this.generateReport();
    
    if (!success) {
      process.exit(1);
    }
    
    this.log('🎉 Asset validation completed successfully!');
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new AssetValidator();
  validator.run();
}

module.exports = AssetValidator;