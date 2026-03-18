/**
 * LaTeX rendering utilities using KaTeX.
 * 
 * Convention: Text wrapped in $...$ is rendered as LaTeX math.
 * Everything outside $...$ is rendered as plain text.
 */
import katex from 'katex';

/**
 * Parse input string and render LaTeX segments.
 * Returns an HTML string with rendered math and plain text.
 * 
 * @param {string} input - Raw user input, e.g. "Simplify $\\sqrt{x^2}$"
 * @returns {string} HTML string with rendered KaTeX
 */
export function renderLatexToHTML(input) {
  if (!input || input.trim() === '') return '';

  // Split on $...$ delimiters
  const parts = input.split(/(\$[^$]+\$)/g);
  
  return parts.map(part => {
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      const latex = part.slice(1, -1);
      try {
        return katex.renderToString(latex, {
          throwOnError: false,
          displayMode: false,
          output: 'html',
        });
      } catch (e) {
        // On error, show raw text with error styling
        return `<span class="katex-error" title="${e.message}">${escapeHtml(part)}</span>`;
      }
    }
    return `<span>${escapeHtml(part)}</span>`;
  }).join('');
}

/**
 * Check if a string contains any LaTeX ($...$) content.
 */
export function containsLatex(input) {
  return /\$[^$]+\$/.test(input);
}

/**
 * Render LaTeX to HTML for use inside SVG foreignObject.
 * Wraps output in a container div with proper styling.
 */
export function renderLatexForSVG(input, fontSize = 10) {
  const html = renderLatexToHTML(input);
  return `<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:${fontSize}px;text-align:center;line-height:1.2;font-family:'Inter',sans-serif;color:#333;">${html}</div>`;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default renderLatexToHTML;
