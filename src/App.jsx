import { useState, useCallback, useMemo } from 'react';
import { PUZZLE_TYPES, PUZZLE_TYPE_LIST } from './lib/puzzleTypes.js';
import { generateShuffledAssignment } from './lib/shuffle.js';
import { serialize, deserialize } from './lib/serialization.js';
import { exportToPDF } from './lib/pdfExport.js';
import ShapeSelector from './components/ShapeSelector.jsx';
import PuzzleGrid from './components/PuzzleGrid.jsx';
import PairInputList from './components/PairInputList.jsx';
import Toolbar from './components/Toolbar.jsx';
import SaveLoadModal from './components/SaveLoadModal.jsx';

function createEmptyPairs(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    question: '',
    answer: '',
  }));
}

export default function App() {
  const [puzzleTypeId, setPuzzleTypeId] = useState('largeTriangle');
  const [pairs, setPairs] = useState(() => createEmptyPairs(PUZZLE_TYPES.largeTriangle.pairCount));
  const [assignment, setAssignment] = useState(() =>
    Array.from({ length: PUZZLE_TYPES.largeTriangle.pairCount }, (_, i) => i)
  );
  const [modalMode, setModalMode] = useState(null); // 'save' | 'load' | null

  const puzzleType = useMemo(() => PUZZLE_TYPES[puzzleTypeId], [puzzleTypeId]);

  const handleShapeChange = useCallback((newTypeId) => {
    const newType = PUZZLE_TYPES[newTypeId];
    setPuzzleTypeId(newTypeId);
    setPairs(prev => {
      if (prev.length >= newType.pairCount) return prev;
      return [
        ...prev,
        ...createEmptyPairs(newType.pairCount - prev.length).map((p, i) => ({ ...p, id: prev.length + i }))
      ];
    });
    setAssignment(Array.from({ length: newType.pairCount }, (_, i) => i));
  }, []);

  const handlePairChange = useCallback((index, field, value) => {
    setPairs(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const handleShuffle = useCallback(() => {
    setAssignment(generateShuffledAssignment(puzzleType.pairCount));
  }, [puzzleType.pairCount]);

  const handleClear = useCallback(() => {
    if (window.confirm('Clear all questions and answers?')) {
      setPairs(createEmptyPairs(puzzleType.pairCount));
      setAssignment(Array.from({ length: puzzleType.pairCount }, (_, i) => i));
    }
  }, [puzzleType.pairCount]);

  const handleSave = useCallback(() => {
    setModalMode('save');
  }, []);

  const handleLoad = useCallback(() => {
    setModalMode('load');
  }, []);

  const handleLoadData = useCallback((encoded) => {
    try {
      const data = deserialize(encoded);
      if (PUZZLE_TYPES[data.puzzleTypeId]) {
        setPuzzleTypeId(data.puzzleTypeId);
        setPairs(data.pairs);
        setAssignment(Array.from({ length: data.pairs.length }, (_, i) => i));
        setModalMode(null);
      } else {
        alert('Unknown puzzle type in saved data.');
      }
    } catch (e) {
      alert(e.message);
    }
  }, []);

  const serializedData = useMemo(() => {
    if (modalMode === 'save') {
      return serialize({ puzzleTypeId, pairs });
    }
    return '';
  }, [modalMode, puzzleTypeId, pairs]);

  // Map assignment to edges: assignment[edgeIndex] = pairIndex
  const edgeContent = useMemo(() => {
    return assignment.map(pairIndex => pairs[pairIndex] || { question: '', answer: '' });
  }, [assignment, pairs]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Tarsia Maker</h1>
        <span className="app-subtitle">with LaTeX support</span>
      </header>

      <main className="app-main">
        <div className="puzzle-section">
          <ShapeSelector
            types={PUZZLE_TYPE_LIST}
            activeId={puzzleTypeId}
            onChange={handleShapeChange}
          />

          <PuzzleGrid
            puzzleType={puzzleType}
            edgeContent={edgeContent}
          />

          <Toolbar
            onExportPDF={() => {
              const svg = document.getElementById('puzzle-svg');
              exportToPDF(svg, `tarsia-${puzzleType.name.toLowerCase().replace(/\s+/g, '-')}`);
            }}
            onSave={handleSave}
            onLoad={handleLoad}
            onClear={handleClear}
            onShuffle={handleShuffle}
          />
        </div>

        <div className="input-section">
          <h2 className="input-section-title">Questions & Answers</h2>
          <p className="input-section-hint">
            Wrap LaTeX in <code>$...$</code> — e.g. <code>$\sqrt{'{x}'}$</code> or <code>$x^{'{2}'}$</code>
          </p>
          <PairInputList
            pairs={pairs.slice(0, puzzleType.pairCount)}
            onChange={handlePairChange}
          />
        </div>
      </main>

      {modalMode && (
        <SaveLoadModal
          mode={modalMode}
          data={serializedData}
          onLoad={handleLoadData}
          onClose={() => setModalMode(null)}
        />
      )}
    </div>
  );
}
