/**
 * Geometry utility functions for puzzle rendering.
 */

export function getTriangleCenter(vertices) {
  return [
    (vertices[0][0] + vertices[1][0] + vertices[2][0]) / 3,
    (vertices[0][1] + vertices[1][1] + vertices[2][1]) / 3,
  ];
}

export function getEdgeMidpoint(v1, v2) {
  return [
    (v1[0] + v2[0]) / 2,
    (v1[1] + v2[1]) / 2,
  ];
}

export function getEdgeAngle(v1, v2) {
  const dx = v2[0] - v1[0];
  const dy = v2[1] - v1[1];
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

export function getEdgeLength(v1, v2) {
  const dx = v2[0] - v1[0];
  const dy = v2[1] - v1[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Compute bounding box for a set of pieces.
 */
export function getBoundingBox(pieces) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const piece of pieces) {
    for (const v of piece.vertices) {
      minX = Math.min(minX, v[0]);
      minY = Math.min(minY, v[1]);
      maxX = Math.max(maxX, v[0]);
      maxY = Math.max(maxY, v[1]);
    }
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * Compute SVG transform parameters to fit puzzle in viewport.
 */
export function computeViewBox(pieces, padding = 0.2) {
  const bb = getBoundingBox(pieces);
  return {
    x: bb.minX - padding,
    y: bb.minY - padding,
    width: bb.width + padding * 2,
    height: bb.height + padding * 2,
  };
}

/**
 * Get offset from edge midpoint along the perpendicular (into the piece).
 * Used to position Q vs A text on opposite sides of a shared edge.
 */
export function getEdgeTextPosition(v1, v2, pieceVertices, offset = 0.08) {
  const mid = getEdgeMidpoint(v1, v2);
  const center = getTriangleCenter(pieceVertices);
  
  // Direction from midpoint toward triangle center
  const dx = center[0] - mid[0];
  const dy = center[1] - mid[1];
  const len = Math.sqrt(dx * dx + dy * dy);
  
  if (len === 0) return mid;
  
  return [
    mid[0] + (dx / len) * offset,
    mid[1] + (dy / len) * offset,
  ];
}
