/**
 * Serialization for save/load functionality.
 * Encodes puzzle state as JSON → base64 string.
 */

export function serialize(puzzleState) {
  const data = {
    version: 1,
    puzzleTypeId: puzzleState.puzzleTypeId,
    pairs: puzzleState.pairs,
  };
  const json = JSON.stringify(data);
  return btoa(unescape(encodeURIComponent(json)));
}

export function deserialize(encoded) {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const data = JSON.parse(json);
    
    if (!data.version || !data.puzzleTypeId || !Array.isArray(data.pairs)) {
      throw new Error('Invalid puzzle data format');
    }
    
    return {
      puzzleTypeId: data.puzzleTypeId,
      pairs: data.pairs,
    };
  } catch (e) {
    throw new Error(`Failed to load puzzle: ${e.message}`);
  }
}
