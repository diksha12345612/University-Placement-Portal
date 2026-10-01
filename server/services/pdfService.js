const { PDFParse } = require('pdf-parse');

const MAX_TEXT_LENGTH = 20000; // enough for any resume, and keeps AI requests small

// Returns the plain text inside a PDF. Scanned (image-only) PDFs give an empty string.
const extractPdfText = async (buffer) => {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text
      .replace(/-- \d+ of \d+ --/g, '') // page markers added by pdf-parse
      .replace(/\s+\n/g, '\n')
      .trim()
      .slice(0, MAX_TEXT_LENGTH);
  } finally {
    await parser.destroy(); // free memory
  }
};

module.exports = { extractPdfText };
