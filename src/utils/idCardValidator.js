// ─── PSTDI ID Card Visual Validator ──────────────────────────────
// Uses Canvas API to analyze uploaded ID images for visual characteristics
// that indicate a valid PSTDI school ID card, complementing Tesseract OCR.
//
// Checks performed:
//   1. Aspect ratio — standard ID card ~1.586 (85.6mm × 54mm)
//   2. Color profile — PSTDI IDs have a distinctive blue/white color scheme
//   3. Image quality — rejects too blurry, too dark, or too small images
//   4. Preprocessing — returns enhanced image for better OCR accuracy

const ID_CARD_ASPECT_RATIO = 1.586; // Standard CR80 card (85.6 / 54)
const ASPECT_TOLERANCE = 0.35; // Allow some variance for photos taken at angles
const MIN_IMAGE_WIDTH = 200; // Minimum width in pixels to be readable
const MIN_IMAGE_HEIGHT = 120;

/**
 * Load an image from a data URL or blob URL into an HTMLImageElement
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Get the dominant colors from an image by sampling pixels
 * Returns an object with color analysis results
 */
function analyzeColors(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  let blueCount = 0;
  let whiteCount = 0;
  let darkCount = 0;
  let totalBrightness = 0;
  const buckets = new Array(8).fill(0); // Color diversity buckets

  // Sample every 4th pixel for performance
  for (let i = 0; i < pixels.length; i += 16) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const brightness = (r + g + b) / 3;

    totalBrightness += brightness;

    // Track color diversity — which brightness bucket does this pixel fall into
    const bucket = Math.min(Math.floor(brightness / 32), 7);
    buckets[bucket]++;

    // Blue tones (PSTDI uses blue headers/accents)
    if (b > 120 && b > r * 1.2 && b > g * 1.1) {
      blueCount++;
    }

    // White/light areas (ID card background)
    if (r > 200 && g > 200 && b > 200) {
      whiteCount++;
    }

    // Dark areas (text regions)
    if (brightness < 60) {
      darkCount++;
    }
  }

  const sampledPixels = Math.floor(pixels.length / 16);

  // Color diversity: how many brightness buckets have significant pixel counts
  // Real ID cards have varied colors (photos, logos, text, backgrounds)
  // Plain text images have 1-2 dominant buckets (e.g., black bg + white text)
  const activeBuckets = buckets.filter(b => b > sampledPixels * 0.03).length;

  return {
    bluePct: (blueCount / sampledPixels) * 100,
    whitePct: (whiteCount / sampledPixels) * 100,
    darkPct: (darkCount / sampledPixels) * 100,
    avgBrightness: totalBrightness / sampledPixels,
    colorDiversity: activeBuckets, // 1-2 = plain, 3-4 = moderate, 5+ = rich (real photo/ID)
    dominantDarkPct: (darkCount / sampledPixels) * 100,
  };
}

/**
 * Check if the image aspect ratio matches a standard ID card
 */
function checkAspectRatio(width, height) {
  // Try both orientations (landscape and portrait)
  const landscape = width / height;
  const portrait = height / width;
  const bestRatio = Math.abs(landscape - ID_CARD_ASPECT_RATIO) < Math.abs(portrait - ID_CARD_ASPECT_RATIO)
    ? landscape : portrait;

  const deviation = Math.abs(bestRatio - ID_CARD_ASPECT_RATIO) / ID_CARD_ASPECT_RATIO;
  return {
    ratio: bestRatio,
    isStandardID: deviation <= ASPECT_TOLERANCE,
    deviation,
  };
}

/**
 * Preprocess image for better OCR: convert to grayscale, enhance contrast, sharpen
 * Returns a new data URL of the preprocessed image
 */
function preprocessForOCR(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  // Step 1: Convert to grayscale
  for (let i = 0; i < pixels.length; i += 4) {
    const gray = Math.round(pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114);
    pixels[i] = gray;
    pixels[i + 1] = gray;
    pixels[i + 2] = gray;
  }

  // Step 2: Contrast enhancement (histogram stretching)
  let min = 255, max = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i] < min) min = pixels[i];
    if (pixels[i] > max) max = pixels[i];
  }

  const range = max - min || 1;
  for (let i = 0; i < pixels.length; i += 4) {
    const stretched = Math.round(((pixels[i] - min) / range) * 255);
    pixels[i] = stretched;
    pixels[i + 1] = stretched;
    pixels[i + 2] = stretched;
  }

  // Step 3: Adaptive thresholding for text regions
  // Only partially threshold — keep grayscale for areas that aren't clearly text
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i] < 100) {
      pixels[i] = pixels[i + 1] = pixels[i + 2] = 0; // Darken dark areas (text)
    } else if (pixels[i] > 180) {
      pixels[i] = pixels[i + 1] = pixels[i + 2] = 255; // Lighten light areas (background)
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Main validation function — analyzes an uploaded ID image
 *
 * @param {string} imageUrl - Data URL or blob URL of the uploaded image
 * @param {'front'|'back'} side - Which side of the ID card
 * @returns {Promise<{
 *   isValid: boolean,
 *   confidence: number,       // 0-100 visual confidence score
 *   reasons: string[],        // Human-readable validation messages
 *   warnings: string[],       // Non-blocking warnings
 *   preprocessedUrl: string,  // Enhanced image URL for better OCR
 *   details: object           // Raw analysis data
 * }>}
 */
export async function validateIDCard(imageUrl, side = 'front') {
  const reasons = [];
  const warnings = [];
  let score = 0;
  const maxScore = 100;

  try {
    const img = await loadImage(imageUrl);
    const { naturalWidth: w, naturalHeight: h } = img;

    // ─── Size check ──────────────────────────────────────────
    if (w < MIN_IMAGE_WIDTH || h < MIN_IMAGE_HEIGHT) {
      return {
        isValid: false,
        confidence: 0,
        reasons: ['Image is too small. Please upload a clearer photo of your ID.'],
        warnings: [],
        preprocessedUrl: imageUrl,
        details: { width: w, height: h },
      };
    }
    score += 15; // Passed size check

    // ─── Aspect ratio check ──────────────────────────────────
    const aspect = checkAspectRatio(w, h);
    if (aspect.isStandardID) {
      score += 20;
      reasons.push('ID card dimensions detected');
    } else {
      warnings.push('Image dimensions don\'t match standard ID card. Make sure to capture the full card.');
    }

    // ─── Color analysis ──────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const colors = analyzeColors(ctx, w, h);

    // ─── Plain image / fake text detection ───────────────────
    // Real ID cards have rich color diversity (photos, logos, gradients, borders)
    // Plain text on solid background only has 1-2 color ranges
    if (colors.colorDiversity <= 2) {
      return {
        isValid: false,
        confidence: 5,
        reasons: [],
        warnings: ['This appears to be a plain text image, not a photo of an ID card. Please upload an actual photo of your School ID.'],
        preprocessedUrl: imageUrl,
        details: { width: w, height: h, colors },
      };
    }

    // Mostly dark images (>70% dark pixels) are likely screenshots or text editors
    if (colors.darkPct > 70) {
      return {
        isValid: false,
        confidence: 5,
        reasons: [],
        warnings: ['Image is mostly dark. This doesn\'t look like a photo of an ID card. Please upload a clear photo of your School ID.'],
        preprocessedUrl: imageUrl,
        details: { width: w, height: h, colors },
      };
    }

    // Mostly white/light images with very low diversity could be a document or screenshot
    if (colors.whitePct > 85 && colors.colorDiversity <= 3) {
      return {
        isValid: false,
        confidence: 10,
        reasons: [],
        warnings: ['This looks like a plain document or screenshot, not a School ID card. Please upload an actual photo of your ID.'],
        preprocessedUrl: imageUrl,
        details: { width: w, height: h, colors },
      };
    }

    // ─── Color diversity scoring ─────────────────────────────
    // Real IDs score higher for having varied colors
    if (colors.colorDiversity >= 5) {
      score += 15; // Rich color variety — likely a real photo
      reasons.push('Rich color detail detected (real photo)');
    } else if (colors.colorDiversity >= 3) {
      score += 5;
    }

    // PSTDI front: expect blue tones (header/accent) + white (background) + dark (text)
    if (side === 'front') {
      if (colors.bluePct > 3) {
        score += 20;
        reasons.push('Blue color scheme detected (matches PSTDI ID)');
      } else if (colors.bluePct > 1) {
        score += 8;
        warnings.push('Some blue detected but less than expected for PSTDI ID');
      } else {
        warnings.push('Expected blue color scheme not found');
      }

      if (colors.whitePct > 15 && colors.whitePct < 85) {
        score += 15;
        reasons.push('White background areas detected');
      }

      if (colors.darkPct > 3 && colors.darkPct < 50) {
        score += 10;
        reasons.push('Text regions detected');
      }
    } else {
      // Back side: typically has more text (darker) and white background
      if (colors.whitePct > 10 && colors.whitePct < 85) {
        score += 15;
      }
      if (colors.darkPct > 5 && colors.darkPct < 70) {
        score += 15;
        reasons.push('Text content detected on back');
      }
      // Back of PSTDI may also have blue elements
      if (colors.bluePct > 1) {
        score += 10;
      }
    }

    // ─── Brightness check (not too dark, not washed out) ─────
    if (colors.avgBrightness > 40 && colors.avgBrightness < 230) {
      score += 15;
    } else {
      warnings.push('Image may be too dark or overexposed. Try taking a new photo with better lighting.');
    }

    // ─── Preprocess for OCR ──────────────────────────────────
    const ocrCanvas = document.createElement('canvas');
    ocrCanvas.width = w;
    ocrCanvas.height = h;
    const ocrCtx = ocrCanvas.getContext('2d');
    ocrCtx.drawImage(img, 0, 0);
    preprocessForOCR(ocrCtx, w, h);
    const preprocessedUrl = ocrCanvas.toDataURL('image/png');

    // Normalize score to 0-100
    const confidence = Math.min(Math.round((score / maxScore) * 100), 100);

    return {
      isValid: confidence >= 35, // Must pass visual checks — rejects plain text/screenshots
      confidence,
      reasons,
      warnings,
      preprocessedUrl,
      details: { width: w, height: h, aspect, colors, score },
    };
  } catch (err) {
    console.error('ID validation error:', err);
    return {
      isValid: true, // Don't block on validation errors — fall back to OCR-only
      confidence: 0,
      reasons: [],
      warnings: ['Could not perform visual validation. Proceeding with text verification only.'],
      preprocessedUrl: imageUrl,
      details: { error: err.message },
    };
  }
}

/**
 * Quick check — can be used before full validation to give instant feedback
 */
export async function quickImageCheck(imageUrl) {
  try {
    const img = await loadImage(imageUrl);
    const { naturalWidth: w, naturalHeight: h } = img;

    if (w < MIN_IMAGE_WIDTH || h < MIN_IMAGE_HEIGHT) {
      return { ok: false, message: 'Image is too small. Please upload a higher resolution photo.' };
    }

    const aspect = checkAspectRatio(w, h);
    if (!aspect.isStandardID) {
      return { ok: true, message: 'Tip: Make sure to capture the full ID card for best results.' };
    }

    return { ok: true, message: '' };
  } catch {
    return { ok: true, message: '' };
  }
}
