import { useMemo, useRef, memo } from 'react';
import { computeViewBox, getEdgeMidpoint, getEdgeAngle, getEdgeTextPosition, getEdgeLength } from '../lib/geometry.js';
import { renderLatexToHTML, containsLatex } from '../lib/latexRenderer.js';

/**
 * The SVG coordinate space is very small (units ~0-4).
 * We can't put pixel-sized HTML into foreignObject directly.
 * Instead, we use SVG <text> for plain text and a scaled foreignObject for LaTeX.
 * 
 * The scaling trick: foreignObject is defined in large pixel units,
 * then wrapped in a <g> with a scale transform to shrink it to SVG units.
 */
const SCALE_FACTOR = 175;  // 1 SVG unit = 90px in the foreignObject
const FO_WIDTH = 120;     // foreignObject width in "virtual pixels"
const FO_HEIGHT = 120;     // foreignObject height in "virtual pixels"

// Gap factor: each triangle vertex is pulled toward the centroid by this fraction
const GAP = 0.03;

function shrinkTriangle(vertices) {
  const cx = (vertices[0][0] + vertices[1][0] + vertices[2][0]) / 3;
  const cy = (vertices[0][1] + vertices[1][1] + vertices[2][1]) / 3;
  return vertices.map(v => [
    v[0] + (cx - v[0]) * GAP,
    v[1] + (cy - v[1]) * GAP,
  ]);
}

function PuzzleGrid({ puzzleType, edgeContent }) {
  const svgRef = useRef(null);
  const { pieces, edges } = puzzleType;

  const viewBox = useMemo(() => computeViewBox(pieces, 0.3), [pieces]);

  const edgeLabels = useMemo(() => {
    return edges.map((edge, i) => {
      const content = edgeContent[i] || { question: '', answer: '' };

      const piece1 = pieces.find(p => p.id === edge.piece1);
      const piece2 = pieces.find(p => p.id === edge.piece2);

      // Q is offset toward piece1's center, A toward piece2's center.
      // Smooth sqrt-based padding: longer text → smaller offset → text stays closer to edge.
      const qLen = content.question.length || 1;
      const aLen = content.answer.length || 1;
      const qOffset = 0.125 * Math.max(0.35, Math.min(1.0, Math.sqrt(10 / qLen)));
      const aOffset = 0.105 * Math.max(0.35, Math.min(1.0, Math.sqrt(10 / aLen)));

      const qPos = getEdgeTextPosition(edge.v1, edge.v2, piece1.vertices, qOffset);
      const aPos = getEdgeTextPosition(edge.v1, edge.v2, piece2.vertices, aOffset);

      const angle = getEdgeAngle(edge.v1, edge.v2);
      let textAngle = angle;
      if (textAngle > 90) textAngle -= 180;
      if (textAngle < -90) textAngle += 180;

      const edgeLen = getEdgeLength(edge.v1, edge.v2);

      return {
        id: edge.id,
        question: content.question,
        answer: content.answer,
        qPos,
        aPos,
        angle: textAngle,
        midpoint: getEdgeMidpoint(edge.v1, edge.v2),
        edgeLen,
      };
    });
  }, [edges, edgeContent, pieces]);

  return (
    <div className="puzzle-grid-container">
      <svg
        ref={svgRef}
        className="puzzle-grid-svg"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
        id="puzzle-svg"
      >
        {/* Piece outlines — shrunk slightly for gap between pieces */}
        {pieces.map(piece => {
          const shrunk = shrinkTriangle(piece.vertices);
          return (
            <polygon
              key={piece.id}
              points={shrunk.map(v => `${v[0]},${v[1]}`).join(' ')}
              fill="#ffffff"
              stroke="#2c3e50"
              strokeWidth="0.015"
              strokeLinejoin="round"
            />
          );
        })}

        {/* Edge labels */}
        {edgeLabels.map(label => (
          <g key={label.id}>
            <EdgeText
              text={label.question}
              x={label.qPos[0]}
              y={label.qPos[1]}
              angle={label.angle}
              className="question-label"
              edgeLen={label.edgeLen}
            />
            <EdgeText
              text={label.answer}
              x={label.aPos[0]}
              y={label.aPos[1]}
              angle={label.angle}
              className="answer-label"
              edgeLen={label.edgeLen}
            />
          </g>
        ))}

        {/* Edge pair numbers (subtle) */}
        {edgeLabels.map((label, i) => (
          <text
            key={`num-${label.id}`}
            x={label.midpoint[0]}
            y={label.midpoint[1]}
            className="edge-number"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="0.06"
            fill="#bbbbbb"
            opacity="0.3"
          >
            {i + 1}
          </text>
        ))}
      </svg>
    </div>
  );
}

/**
 * Renders text along an edge. Uses SVG <text> for plain text,
 * and a scaled <foreignObject> for LaTeX content.
 *
 * Font sizing uses a gentle sqrt-based decay:
 *   fontSize = maxSize * sqrt(referenceLength / textLength)
 * sqrt decays much more gently than 1/x, keeping text readable
 * even at longer lengths while still shrinking proportionally.
 */
function EdgeText({ text, x, y, angle, className, edgeLen }) {
  if (!text) return null;

  const hasLatex = containsLatex(text);
  const isQuestion = className.includes('question');
  const fillColor = isQuestion ? '#2c3e50' : '#c0392b';

  const textLength = text.length;

  if (!hasLatex) {
    // ---- Plain Text: SVG <text> with smooth font scaling ----
    const maxFontSize = Math.min(0.1, edgeLen * 0.1);
    const minFontSize = maxFontSize * 0.3;

    // Gentle sqrt decay: text of ~8 chars gets full size; longer text shrinks gradually.
    // sqrt(8/20) ≈ 0.63, sqrt(8/40) ≈ 0.45, sqrt(8/60) ≈ 0.37 — much gentler than 1/x.
    const fontSize = Math.max(minFontSize, Math.min(maxFontSize, maxFontSize * Math.sqrt(8 / textLength)));

    // Characters-per-line derived from edge length and font size.
    // This keeps text within roughly 80% of the edge width.
    const charsPerLine = Math.max(8, Math.floor(edgeLen * 0.8 / fontSize));

    // Word-wrap into lines
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine && (currentLine + ' ' + word).length > charsPerLine) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += (currentLine ? ' ' : '') + word;
      }
    }
    if (currentLine) lines.push(currentLine.trim());

    // Cap at 3 lines max — if more, merge the overflow into line 3
    if (lines.length > 3) {
      const merged = lines.slice(2).join(' ');
      lines.length = 2;
      lines.push(merged);
    }

    if (lines.length === 0) lines.push(text);

    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        className={`edge-text ${className}`}
        transform={`rotate(${angle}, ${x}, ${y})`}
        fontSize={fontSize}
        fill={fillColor}
        fontFamily="'Inter', sans-serif"
        fontWeight="500"
      >
        {lines.map((line, i) => {
          const dy = i === 0 ? `-${(lines.length - 1) * 0.5}em` : '1em';
          return (
            <tspan key={i} x={x} dy={dy}>
              {line}
            </tspan>
          );
        })}
      </text>
    );
  }

  // ---- LaTeX Content: foreignObject with smooth font scaling ----
  const scale = 1 / SCALE_FACTOR;
  const html = renderLatexToHTML(text);

  // Gentle sqrt decay: LaTeX of ~10 chars gets full 18px; longer shrinks gradually.
  const foFontSize = Math.max(10, Math.min(18, 18 * Math.sqrt(10 / textLength)));

  return (
    <g transform={`translate(${x}, ${y}) rotate(${angle}) scale(${scale})`}>
      <foreignObject
        x={-FO_WIDTH / 2}
        y={-FO_HEIGHT / 2}
        width={FO_WIDTH}
        height={FO_HEIGHT}
        className="edge-label-fo"
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          className={`edge-label-html ${className}`}
          style={{ 
            color: fillColor, 
            fontSize: `${foFontSize}px`, 
            width: '100%', 
            height: '100%',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            textAlign: 'center',
            lineHeight: '1.2'
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </foreignObject>
    </g>
  );
}

export default memo(PuzzleGrid);
