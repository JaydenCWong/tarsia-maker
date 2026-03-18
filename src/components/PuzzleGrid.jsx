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

      // Q is offset toward piece1's center, A toward piece2's center
      // Use balanced offset so text is centered between edge and triangle center.
      // Dynamic padding: If the string is very long, we push it less distance into the
      // center to prevent long strings on adjacent edges from colliding.
      let qOffset = 0.125;
      if (content.question.length > 30) qOffset = 0.08;
      else if (content.question.length > 15) qOffset = 0.1;

      let aOffset = 0.105;
      if (content.answer.length > 30) aOffset = 0.07;
      else if (content.answer.length > 15) aOffset = 0.09;

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
 */
function EdgeText({ text, x, y, angle, className, edgeLen }) {
  if (!text) return null;

  const hasLatex = containsLatex(text);
  const isQuestion = className.includes('question');
  const fillColor = isQuestion ? '#2c3e50' : '#c0392b';

  // Dynamic font sizing based on length
  const textLength = text.length;

  if (!hasLatex) {
    // ---- Plain Text: SVG <text> with manual <tspan> wrapping and scaling ----
    let fontSize = Math.min(0.1, edgeLen * 0.1);
    let charsPerLine = 12;

    if (textLength > 30) {
      fontSize *= 0.6;
      charsPerLine = 22;
    } else if (textLength > 15) {
      fontSize *= 0.8;
      charsPerLine = 16;
    }

    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      // If adding the word exceeds charsPerLine, push to lines
      if (currentLine && (currentLine + word).length > charsPerLine) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    }
    if (currentLine) lines.push(currentLine.trim());

    // Fallback if no lines (empty string handled by initial !text check)
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
          // Calculate vertical offset so block of text remains vertically centered
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

  // ---- LaTeX Content: foreignObject with scaling trick ----
  const scale = 1 / SCALE_FACTOR;
  const html = renderLatexToHTML(text);

  let foFontSize = 18;
  if (textLength > 40) foFontSize = 12;
  else if (textLength > 20) foFontSize = 15;

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
            whiteSpace: 'normal',   // allow wrapping inside the flexbox
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
