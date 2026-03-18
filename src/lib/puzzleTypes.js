/**
 * Puzzle type definitions and geometry data.
 * 
 * Each puzzle type defines:
 * - pieces: array of triangles, each with 3 vertices [x,y]
 * - edges: shared edges between pieces where Q/A pairs are placed
 * 
 * Coordinate system: unit-based, scaled to viewport at render time.
 */

const H = Math.sqrt(3) / 2;

// ============================================================
// EDGE DETECTION
// ============================================================

function edgeKey(v1, v2) {
  const a = `${v1[0].toFixed(4)},${v1[1].toFixed(4)}`;
  const b = `${v2[0].toFixed(4)},${v2[1].toFixed(4)}`;
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function buildEdges(pieces) {
  const edgeMap = {};
  const edges = [];

  for (const piece of pieces) {
    const verts = piece.vertices;
    for (let i = 0; i < 3; i++) {
      const v1 = verts[i];
      const v2 = verts[(i + 1) % 3];
      const key = edgeKey(v1, v2);

      if (edgeMap[key] !== undefined) {
        edges.push({
          id: edges.length,
          v1: [...v1],
          v2: [...v2],
          piece1: edgeMap[key],
          piece2: piece.id,
        });
      } else {
        edgeMap[key] = piece.id;
      }
    }
  }

  return edges;
}

// ============================================================
// TRIANGLE GRIDS
// ============================================================

function generateTriangle(rows) {
  const pieces = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col <= row; col++) {
      const x = -row / 2 + col;
      pieces.push({
        id: pieces.length,
        vertices: [
          [x, row * H],
          [x - 0.5, (row + 1) * H],
          [x + 0.5, (row + 1) * H],
        ],
        type: 'up',
      });
    }
    for (let col = 0; col < row; col++) {
      const x = -row / 2 + col + 0.5;
      pieces.push({
        id: pieces.length,
        vertices: [
          [x, (row + 1) * H],
          [x + 0.5, row * H],
          [x - 0.5, row * H],
        ],
        type: 'down',
      });
    }
  }

  return { pieces, edges: buildEdges(pieces) };
}

// ============================================================
// HEXAGON GRIDS
// 
// A regular hexagon made of equilateral triangles.
// 
// Top half (rows 0 to radius-1):
//   Primary triangles point UP (apex at top, base at bottom)
//   Fill triangles point DOWN (filling gaps between up-triangles)
//   Rows get progressively wider.
//
// Bottom half (rows radius to 2*radius-1):
//   Primary triangles point DOWN (apex at bottom, base at top)
//   Fill triangles point UP (filling gaps between down-triangles)
//   Rows get progressively narrower.
//
// This creates a proper hexagonal silhouette — the top apexes
// create the upper boundary, and the bottom apexes create the
// lower boundary, with straight diagonal edges on the sides.
// ============================================================

function generateHexagon(radius) {
  const pieces = [];
  const totalRows = 2 * radius;

  for (let row = 0; row < totalRows; row++) {
    const isTopHalf = row < radius;

    // Row width: for a regular hexagon with side length = radius,
    // the top/bottom rows need (radius + 1) primary triangles
    // so the flat edge spans `radius` triangle edges, matching the diagonals.
    const widening = Math.min(row, totalRows - 1 - row);
    const primaryCount = radius + 1 + widening;
    const fillCount = primaryCount - 1;

    // Center horizontally
    const xStart = -(primaryCount - 1) / 2;

    if (isTopHalf) {
      // Top half: UP-pointing primary triangles
      for (let col = 0; col < primaryCount; col++) {
        const x = xStart + col;
        pieces.push({
          id: pieces.length,
          vertices: [
            [x, row * H],              // apex (top)
            [x - 0.5, (row + 1) * H],  // bottom-left
            [x + 0.5, (row + 1) * H],  // bottom-right
          ],
          type: 'up',
        });
      }
      // Fill: DOWN-pointing triangles between the up-triangles
      for (let col = 0; col < fillCount; col++) {
        const x = xStart + col + 0.5;
        pieces.push({
          id: pieces.length,
          vertices: [
            [x, (row + 1) * H],        // apex (bottom)
            [x + 0.5, row * H],        // top-right
            [x - 0.5, row * H],        // top-left
          ],
          type: 'down',
        });
      }
    } else {
      // Bottom half: DOWN-pointing primary triangles (FLIPPED)
      for (let col = 0; col < primaryCount; col++) {
        const x = xStart + col;
        pieces.push({
          id: pieces.length,
          vertices: [
            [x, (row + 1) * H],        // apex (bottom)
            [x + 0.5, row * H],        // top-right
            [x - 0.5, row * H],        // top-left
          ],
          type: 'down',
        });
      }
      // Fill: UP-pointing triangles between the down-triangles
      for (let col = 0; col < fillCount; col++) {
        const x = xStart + col + 0.5;
        pieces.push({
          id: pieces.length,
          vertices: [
            [x, row * H],              // apex (top)
            [x - 0.5, (row + 1) * H],  // bottom-left
            [x + 0.5, (row + 1) * H],  // bottom-right
          ],
          type: 'up',
        });
      }
    }
  }

  return { pieces, edges: buildEdges(pieces) };
}

// ============================================================
// PUZZLE TYPE DEFINITIONS
// ============================================================

function createPuzzleType(id, name, generator) {
  const { pieces, edges } = generator();
  return { id, name, pairCount: edges.length, pieces, edges };
}

export const PUZZLE_TYPES = {
  smallTriangle: createPuzzleType('smallTriangle', 'Small Triangle', () => generateTriangle(3)),
  smallHexagon:  createPuzzleType('smallHexagon',  'Small Hexagon',  () => generateHexagon(2)),
  largeTriangle: createPuzzleType('largeTriangle', 'Large Triangle', () => generateTriangle(4)),
  largeHexagon:  createPuzzleType('largeHexagon',  'Large Hexagon',  () => generateHexagon(3)),
};

export const PUZZLE_TYPE_LIST = [
  PUZZLE_TYPES.smallTriangle,
  PUZZLE_TYPES.smallHexagon,
  PUZZLE_TYPES.largeTriangle,
  PUZZLE_TYPES.largeHexagon,
];

export default PUZZLE_TYPES;
