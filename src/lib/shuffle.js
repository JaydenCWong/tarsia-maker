/**
 * Fisher-Yates shuffle for Q/A pair edge assignments.
 */

export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate a shuffled mapping of pair indices to edge indices.
 */
export function generateShuffledAssignment(pairCount) {
  const indices = Array.from({ length: pairCount }, (_, i) => i);
  return shuffleArray(indices);
}
