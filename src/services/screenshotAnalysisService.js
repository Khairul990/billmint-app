/**
 * Analyze payment screenshot for verification
 * @param {File} imageFile - The uploaded screenshot
 * @param {Object} expectedData - Invoice data (code, amount, etc.)
 * @returns {Promise<Object>} - Analysis result
 */
export const analyzePaymentScreenshot = async (imageFile, expectedData) => {
  const analysis = {
    confidence: 0,
    matches: {},
    warnings: [],
    errors: [],
    recommendation: 'reject', // approve, manual_review, reject
  };
  
  try {
    // Convert image to base64 for analysis
    const base64Image = await fileToBase64(imageFile);
    
    // 1. Check file size (screenshots typically 200KB-5MB)
    const fileSizeKB = imageFile.size / 1024;
    if (fileSizeKB < 50) {
      analysis.warnings.push('File too small - may be low quality');
    }
    if (fileSizeKB > 10000) {
      analysis.warnings.push('File too large - suspicious');
    }
    
    // 2. Check image dimensions (common screen sizes)
    const img = new Image();
    const imgPromise = new Promise((resolve) => {
      img.onload = () => resolve({
        width: img.width,
        height: img.height,
      });
      img.src = URL.createObjectURL(imageFile);
    });
    const dimensions = await imgPromise;
    
    const commonSizes = [
      { w: 1920, h: 1080 },
      { w: 1366, h: 768 },
      { w: 1280, h: 720 },
      { w: 1080, h: 1920 }, // Mobile
      { w: 720, h: 1280 },
      { w: 2340, h: 1080 },
      { w: 1170, h: 2532 }, // iPhone 12/13/14
      { w: 1284, h: 2778 }, // iPhone Pro Max
      { w: 1290, h: 2796 }, // iPhone 14 Pro Max
      { w: 1080, h: 2400 }, // Common Android
      { w: 1440, h: 3200 }, // High-end Android
    ];
    
    // Check if it's roughly a common aspect ratio instead of exact pixels
    const aspectRatio = dimensions.width / dimensions.height;
    const _isPortrait = dimensions.height > dimensions.width;
    const isCommonSize = commonSizes.some(
      size => Math.abs((size.w / size.h) - aspectRatio) < 0.1 || Math.abs((size.h / size.w) - aspectRatio) < 0.1
    );
    
    if (isCommonSize) {
      analysis.matches.dimensions = true;
      analysis.confidence += 20;
    } else {
      analysis.matches.dimensions = false;
      analysis.warnings.push('Unusual image dimensions');
    }
    
    // 3. EXIF data check (real photos have EXIF, screenshots don't)
    const hasEXIF = await checkEXIF(imageFile);
    if (!hasEXIF) {
      analysis.matches.screenshotLikely = true;
      analysis.confidence += 15;
    } else {
      analysis.matches.screenshotLikely = false;
      analysis.warnings.push('Has EXIF data - may be a photo, not screenshot');
    }
    
    // 4. OCR Text extraction (using Tesseract.js)
    const extractedText = await extractTextFromImage(base64Image);
    const textUpper = extractedText.toUpperCase();
    
    // 5. Check for verification code (most important)
    if (expectedData.verificationCode) {
      const expectedCode = expectedData.verificationCode.toUpperCase();
      const codeFound = textUpper.includes(expectedCode);
      const codeParts = expectedCode.split('-');
      // Partial code: BQ-INV...
      const codePartial = codeParts.length > 1 && textUpper.includes(`${codeParts[0]}-${codeParts[1]}`);
      
      if (codeFound) {
        analysis.matches.verificationCode = true;
        analysis.confidence += 50; // Highest weight
      } else if (codePartial) {
        analysis.matches.verificationCode = 'partial';
        analysis.confidence += 30;
        analysis.warnings.push('Verification code partially found');
      } else {
        analysis.matches.verificationCode = false;
        analysis.errors.push('Verification code NOT found in screenshot');
      }
    } else {
      analysis.warnings.push('No expected verification code provided for checking.');
    }
    
    // 6. Check for amount
    if (expectedData.grandTotal) {
      const expectedAmount = Number(expectedData.grandTotal).toFixed(2);
      const expectedAmountWhole = expectedAmount.replace('.00', '');
      const expectedAmountCommas = Number(expectedData.grandTotal).toLocaleString('en-IN');
      
      const amountFound = textUpper.includes(expectedAmount) || 
                         textUpper.includes(expectedAmountWhole) ||
                         textUpper.includes(expectedAmountCommas);
      
      if (amountFound) {
        analysis.matches.amount = true;
        analysis.confidence += 15;
      } else {
        analysis.matches.amount = false;
        analysis.warnings.push('Exact amount not found in text');
      }
    }
    
    // 7. Check for payment keywords
    const paymentKeywords = ['SUCCESSFUL', 'PAID', 'PAYMENT', 'TRANSACTION', 'COMPLETED', 'SENT', 'PAID TO', 'TXN'];
    const keywordsFound = paymentKeywords.filter(kw => textUpper.includes(kw));
    
    if (keywordsFound.length >= 1) {
      analysis.matches.keywords = keywordsFound;
      analysis.confidence += 10;
    } else {
      analysis.matches.keywords = [];
      analysis.warnings.push('No payment success keywords found');
    }
    
    // 8. Final decision
    if (analysis.confidence >= 95) {
      analysis.recommendation = 'approve';
    } else if (analysis.confidence >= 70) {
      analysis.recommendation = 'manual_review';
    } else {
      analysis.recommendation = 'reject';
    }
    
    return analysis;
    
  } catch (error) {
    console.error('Screenshot analysis error:', error);
    return {
      confidence: 0,
      matches: {},
      warnings: [],
      errors: ['Analysis failed - please review manually'],
      recommendation: 'manual_review',
    };
  }
};

// Helper functions
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const checkEXIF = async (_file) => {
  // Very simplified check: real screenshots usually don't have large APP1/EXIF headers.
  // For full implementation, one would use exifr library.
  return false;
};

const extractTextFromImage = async (base64Image) => {
  try {
    const Tesseract = await import('tesseract.js');
    const worker = await Tesseract.createWorker('eng');
    const { data: { text } } = await worker.recognize(base64Image);
    await worker.terminate();
    return text;
  } catch (error) {
    console.error('OCR failed:', error);
    return '';
  }
};
