/**
 * PDF Export — SVG vector-based.
 * 
 * Uses jsPDF + svg2pdf.js to serialize the puzzle SVG directly,
 * producing sharp vector output at any zoom level.
 * 
 * Key: we clone the SVG and override all CSS-driven styles with
 * explicit inline attributes so svg2pdf.js can read them.
 */
import { jsPDF } from 'jspdf';
import 'svg2pdf.js';
import html2canvas from 'html2canvas';

/**
 * Export the puzzle SVG to a PDF file.
 * 
 * @param {SVGElement} svgElement - The puzzle SVG DOM element
 * @param {string} puzzleName - Filename for the PDF
 */
export async function exportToPDF(svgElement, puzzleName = 'tarsia-puzzle') {
  if (!svgElement) {
    alert('No puzzle to export. Please enter some questions and answers first.');
    return;
  }

  try {
    // Clone the SVG so we can modify it for print without affecting the live view
    const clonedSvg = svgElement.cloneNode(true);

    // Force a white background rect behind everything
    const viewBox = svgElement.getAttribute('viewBox').split(' ').map(Number);
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', viewBox[0]);
    bgRect.setAttribute('y', viewBox[1]);
    bgRect.setAttribute('width', viewBox[2]);
    bgRect.setAttribute('height', viewBox[3]);
    bgRect.setAttribute('fill', '#ffffff');
    clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

    // Inline all computed styles for foreignObject content
    inlineStyles(clonedSvg);

    // Ensure all polygons have explicit fill/stroke for the PDF renderer
    const polygons = clonedSvg.querySelectorAll('polygon');
    for (const poly of polygons) {
      if (!poly.getAttribute('fill') || poly.getAttribute('fill') === 'none') {
        poly.setAttribute('fill', '#ffffff');
      }
      if (!poly.getAttribute('stroke')) {
        poly.setAttribute('stroke', '#2c3e50');
      }
      if (!poly.getAttribute('stroke-width')) {
        poly.setAttribute('stroke-width', '0.015');
      }
    }

    // Ensure text elements have explicit fill and standard font for jsPDF
    const texts = clonedSvg.querySelectorAll('text');
    for (const t of texts) {
      if (!t.getAttribute('fill')) {
        t.setAttribute('fill', '#2c3e50');
      }
      t.setAttribute('font-family', 'helvetica, sans-serif');
    }

    const svgWidth = viewBox[2];
    const svgHeight = viewBox[3];

    // A4 dimensions in mm: 210 x 297
    const isLandscape = svgWidth > svgHeight;
    const pageWidth = isLandscape ? 297 : 210;
    const pageHeight = isLandscape ? 210 : 297;

    const margin = 15; // mm
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    const scale = Math.min(availableWidth / svgWidth, availableHeight / svgHeight);
    const renderedWidth = svgWidth * scale;
    const renderedHeight = svgHeight * scale;

    const offsetX = margin + (availableWidth - renderedWidth) / 2;
    const offsetY = margin + (availableHeight - renderedHeight) / 2;

    const doc = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Add title
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text('Tarsia Puzzle', pageWidth / 2, 10, { align: 'center' });

    // Try passing html2canvas into jsPDF options to handle foreignObjects natively
    // We attach it to window optionally as some versions look for window.html2canvas
    window.html2canvas = html2canvas;

    // Replace foreignObjects with rasterized images so they appear correctly in PDF
    // We MUST rasterize using the LIVE DOM nodes so html2canvas captures the KaTeX web fonts.
    // If we let svg2pdf.js handle it natively, it uses the cloned nodes which lose font context,
    // resulting in math symbols rendering as ASCII blocks.
    const liveFOs = Array.from(svgElement.querySelectorAll('foreignObject'));
    const clonedFOs = Array.from(clonedSvg.querySelectorAll('foreignObject'));

    window.html2canvas = html2canvas;

    for (let i = 0; i < liveFOs.length; i++) {
      const liveFO = liveFOs[i];
      const cloneFO = clonedFOs[i];
      const liveHTML = liveFO.firstElementChild;
      if (!liveHTML) continue;

      const cw = cloneFO.getAttribute('width') || '120';
      const ch = cloneFO.getAttribute('height') || '120';

      // html2canvas fails to capture HTML elements that are inside nested SVG <g> tags
      // with complex transforms (rotations). So we clone the HTML node to an off-screen
      // upright container on the document.body, snapshot it, and remove it.
      const offscreen = document.createElement('div');
      offscreen.style.position = 'absolute';
      offscreen.style.top = '-9999px';
      offscreen.style.left = '-9999px';
      offscreen.style.width = `${cw}px`;
      offscreen.style.height = `${ch}px`;
      offscreen.style.display = 'flex';
      offscreen.style.alignItems = 'center';
      offscreen.style.justifyContent = 'center';
      
      const nodeClone = liveHTML.cloneNode(true);
      offscreen.appendChild(nodeClone);
      document.body.appendChild(offscreen);

      let imgData;
      try {
        const canvas = await html2canvas(offscreen, { backgroundColor: null, scale: 4, logging: false });
        imgData = canvas.toDataURL('image/png');
      } finally {
        document.body.removeChild(offscreen);
      }

      if (imgData === 'data:,') {
        console.warn('html2canvas returned an empty canvas for a foreignObject.');
        continue;
      }

      const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      const cx = cloneFO.getAttribute('x') || '0';
      const cy = cloneFO.getAttribute('y') || '0';
      
      img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imgData);
      img.setAttribute('href', imgData);
      img.setAttribute('x', cx);
      img.setAttribute('y', cy);
      img.setAttribute('width', cw);
      img.setAttribute('height', ch);
      img.setAttribute('preserveAspectRatio', 'xMidYMid meet');

      if (cloneFO.parentNode) {
        cloneFO.parentNode.replaceChild(img, cloneFO);
      }
    }

    await doc.svg(clonedSvg, {
      x: offsetX,
      y: offsetY,
      width: renderedWidth,
      height: renderedHeight,
    });

    doc.save(`${puzzleName}.pdf`);
  } catch (err) {
    console.error('PDF export failed:', err);
    alert('PDF export failed. See console for details.\n\nFallback: try printing the page directly (Ctrl+P).');
  }
}

/**
 * Inline computed styles on all elements within the SVG.
 * This is necessary for svg2pdf.js to correctly render foreignObject content.
 */
function inlineStyles(svgElement) {
  const elements = svgElement.querySelectorAll('*');

  for (const el of elements) {
    try {
      const computed = window.getComputedStyle(el);

      const importantProps = [
        'color', 'font-size', 'font-family', 'font-weight', 'font-style',
        'text-align', 'line-height', 'display', 'fill', 'stroke', 'stroke-width',
        'opacity',
      ];

      for (const prop of importantProps) {
        const val = computed.getPropertyValue(prop);
        if (val) {
          el.style.setProperty(prop, val);
        }
      }
    } catch (e) {
      // Skip elements that can't have computed styles
    }
  }
}

export default exportToPDF;
