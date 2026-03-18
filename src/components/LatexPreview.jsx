import { memo, useMemo } from 'react';
import { renderLatexToHTML, containsLatex } from '../lib/latexRenderer.js';

function LatexPreview({ text }) {
  const html = useMemo(() => {
    if (!text || !containsLatex(text)) return null;
    return renderLatexToHTML(text);
  }, [text]);

  if (!html) return null;

  return (
    <div
      className="latex-preview"
      dangerouslySetInnerHTML={{ __html: html }}
      title="LaTeX preview"
    />
  );
}

export default memo(LatexPreview);
