/**
 * ManifestValidator - Validates and fixes web app manifest issues
 * Ensures proper PWA functionality and handles runtime manifest validation
 */

const ManifestErrorTypes = {
  SYNTAX_ERROR: 'manifest_syntax_error',
  MISSING_FIELDS: 'manifest_missing_fields',
  INVALID_ICONS: 'manifest_invalid_icons',
  NETWORK_ERROR: 'manifest_network_error'
};

class ManifestValidator {
  constructor() {
    this.manifestPath = '/manifest.json';
    this.requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
    this.validationResults = null;
    this.fallbackManifest = null;
  }

  /**
   * Validate the current manifest
   */
  async validateManifest() {
    console.log('🔍 ManifestValidator: Starting validation...');

    try {
      // Fetch the manifest
      const manifest = await this.fetchManifest();
      if (!manifest) {
        return this.createValidationResult(false, ManifestErrorTypes.NETWORK_ERROR, 'Failed to fetch manifest');
      }

      // Validate JSON syntax
      const syntaxValidation = this.validateSyntax(manifest);
      if (!syntaxValidation.isValid) {
        return syntaxValidation;
      }

      // Validate required fields
      const fieldsValidation = this.validateRequiredFields(manifest);
      if (!fieldsValidation.isValid) {
        return fieldsValidation;
      }

      // Validate icons
      const iconsValidation = await this.validateIcons(manifest.icons);
      if (!iconsValidation.isValid) {
        return iconsValidation;
      }

      console.log('✅ ManifestValidator: Validation successful');
      this.validationResults = this.createValidationResult(true, null, 'Manifest is valid', manifest);
      return this.validationResults;

    } catch (error) {
      console.error('❌ ManifestValidator: Validation failed:', error);
      return this.createValidationResult(false, ManifestErrorTypes.SYNTAX_ERROR, error.message);
    }
  }

  /**
   * Fetch the manifest file
   */
  async fetchManifest() {
    try {
      const response = await fetch(this.manifestPath, { 
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      console.log('🔍 ManifestValidator: Content-Type:', contentType);

      const text = await response.text();
      
      // Check if we got HTML instead of JSON (common deployment issue)
      if (text.trim().startsWith('<!DOCTYPE html>') || text.trim().startsWith('<html')) {
        throw new Error('Manifest is being served as HTML instead of JSON');
      }

      return JSON.parse(text);

    } catch (error) {
      console.error('❌ ManifestValidator: Failed to fetch manifest:', error);
      return null;
    }
  }

  /**
   * Validate JSON syntax
   */
  validateSyntax(manifest) {
    try {
      if (typeof manifest !== 'object' || manifest === null) {
        return this.createValidationResult(false, ManifestErrorTypes.SYNTAX_ERROR, 'Manifest is not a valid JSON object');
      }

      return this.createValidationResult(true);

    } catch (error) {
      return this.createValidationResult(false, ManifestErrorTypes.SYNTAX_ERROR, `JSON syntax error: ${error.message}`);
    }
  }

  /**
   * Validate required fields
   */
  validateRequiredFields(manifest) {
    const missingFields = [];

    for (const field of this.requiredFields) {
      if (!(field in manifest) || !manifest[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return this.createValidationResult(
        false, 
        ManifestErrorTypes.MISSING_FIELDS, 
        `Missing required fields: ${missingFields.join(', ')}`
      );
    }

    // Validate specific field formats
    if (manifest.start_url && !this.isValidUrl(manifest.start_url)) {
      return this.createValidationResult(false, ManifestErrorTypes.MISSING_FIELDS, 'Invalid start_url format');
    }

    if (manifest.display && !this.isValidDisplayMode(manifest.display)) {
      return this.createValidationResult(false, ManifestErrorTypes.MISSING_FIELDS, 'Invalid display mode');
    }

    return this.createValidationResult(true);
  }

  /**
   * Validate icons
   */
  async validateIcons(icons) {
    if (!Array.isArray(icons) || icons.length === 0) {
      return this.createValidationResult(false, ManifestErrorTypes.INVALID_ICONS, 'No icons defined');
    }

    const iconValidationPromises = icons.map(icon => this.validateIcon(icon));
    const results = await Promise.allSettled(iconValidationPromises);

    const failedIcons = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected' || !result.value.isValid) {
        failedIcons.push({
          index,
          icon: icons[index],
          error: result.reason || result.value.error
        });
      }
    });

    if (failedIcons.length === icons.length) {
      return this.createValidationResult(false, ManifestErrorTypes.INVALID_ICONS, 'All icons are invalid or missing');
    }

    if (failedIcons.length > 0) {
      console.warn('⚠️ ManifestValidator: Some icons are invalid:', failedIcons);
    }

    return this.createValidationResult(true);
  }

  /**
   * Validate a single icon
   */
  async validateIcon(icon) {
    try {
      // Check required fields
      if (!icon.src || !icon.sizes) {
        return this.createValidationResult(false, ManifestErrorTypes.INVALID_ICONS, 'Icon missing src or sizes');
      }

      // Check if icon file exists
      const iconExists = await this.checkIconExists(icon.src);
      if (!iconExists) {
        return this.createValidationResult(false, ManifestErrorTypes.INVALID_ICONS, `Icon file not found: ${icon.src}`);
      }

      return this.createValidationResult(true);

    } catch (error) {
      return this.createValidationResult(false, ManifestErrorTypes.INVALID_ICONS, error.message);
    }
  }

  /**
   * Check if an icon file exists
   */
  async checkIconExists(iconPath) {
    try {
      const response = await fetch(iconPath, { method: 'HEAD', cache: 'no-cache' });
      return response.ok;
    } catch (error) {
      console.warn(`⚠️ ManifestValidator: Could not verify icon ${iconPath}:`, error);
      return false;
    }
  }

  /**
   * Generate a fallback manifest
   */
  generateFallbackManifest() {
    console.log('🔄 ManifestValidator: Generating fallback manifest...');

    this.fallbackManifest = {
      name: "Neibrly - Connect with your neighbors",
      short_name: "Neibrly",
      description: "A neighborhood social platform for connecting with your community",
      start_url: "/",
      display: "standalone",
      orientation: "portrait-primary",
      theme_color: "#4A90E2",
      background_color: "#ffffff",
      scope: "/",
      icons: [
        {
          src: "/favicon.ico",
          sizes: "16x16 32x32 48x48",
          type: "image/x-icon"
        },
        {
          src: "/favicon.ico",
          sizes: "192x192",
          type: "image/x-icon",
          purpose: "any maskable"
        },
        {
          src: "/favicon.ico",
          sizes: "512x512",
          type: "image/x-icon",
          purpose: "any maskable"
        }
      ],
      categories: ["social", "lifestyle"],
      lang: "en-US",
      dir: "ltr"
    };

    return this.fallbackManifest;
  }

  /**
   * Fix manifest issues by injecting corrected manifest
   */
  async fixManifestIssues() {
    console.log('🔧 ManifestValidator: Attempting to fix manifest issues...');

    try {
      // Generate fallback manifest
      const fallbackManifest = this.generateFallbackManifest();

      // Create a blob URL for the corrected manifest
      const manifestBlob = new Blob([JSON.stringify(fallbackManifest, null, 2)], {
        type: 'application/json'
      });
      const manifestUrl = URL.createObjectURL(manifestBlob);

      // Update the manifest link in the document
      let manifestLink = document.querySelector('link[rel="manifest"]');
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }

      manifestLink.href = manifestUrl;

      console.log('✅ ManifestValidator: Manifest fixed with fallback');
      return { success: true, manifestUrl, manifest: fallbackManifest };

    } catch (error) {
      console.error('❌ ManifestValidator: Failed to fix manifest:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Utility functions
   */
  isValidUrl(url) {
    return typeof url === 'string' && (url.startsWith('/') || url.startsWith('http') || url === '.');
  }

  isValidDisplayMode(display) {
    const validModes = ['fullscreen', 'standalone', 'minimal-ui', 'browser'];
    return validModes.includes(display);
  }

  createValidationResult(isValid, errorType = null, message = '', data = null) {
    return {
      isValid,
      errorType,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get validation status
   */
  getValidationStatus() {
    return {
      hasValidated: !!this.validationResults,
      lastValidation: this.validationResults,
      hasFallback: !!this.fallbackManifest
    };
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(errorType) {
    const messages = {
      [ManifestErrorTypes.SYNTAX_ERROR]: 'Web app manifest has syntax errors. Using fallback configuration.',
      [ManifestErrorTypes.MISSING_FIELDS]: 'Web app manifest is missing required fields. Using fallback configuration.',
      [ManifestErrorTypes.INVALID_ICONS]: 'Web app manifest icons are invalid or missing. Using fallback icons.',
      [ManifestErrorTypes.NETWORK_ERROR]: 'Could not load web app manifest. Using fallback configuration.'
    };

    return messages[errorType] || 'Unknown manifest error occurred.';
  }
}

// Create singleton instance
const manifestValidator = new ManifestValidator();

export default manifestValidator;
export { ManifestErrorTypes };