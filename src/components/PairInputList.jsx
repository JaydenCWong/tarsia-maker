import { memo } from 'react';
import LatexPreview from './LatexPreview.jsx';

function PairInputList({ pairs, onChange }) {
  return (
    <div className="pair-input-list">
      {pairs.map((pair, index) => (
        <div key={index} className="pair-row">
          <span className="pair-number">{index + 1}</span>
          <div className="pair-fields">
            <div className="pair-field-group">
              <label className="pair-field-label" htmlFor={`q-${index}`}>Q</label>
              <input
                id={`q-${index}`}
                type="text"
                className="pair-input"
                placeholder="Question..."
                value={pair.question}
                onChange={e => onChange(index, 'question', e.target.value)}
                autoComplete="off"
              />
              <LatexPreview text={pair.question} />
            </div>
            <div className="pair-field-group">
              <label className="pair-field-label" htmlFor={`a-${index}`}>A</label>
              <input
                id={`a-${index}`}
                type="text"
                className="pair-input"
                placeholder="Answer..."
                value={pair.answer}
                onChange={e => onChange(index, 'answer', e.target.value)}
                autoComplete="off"
              />
              <LatexPreview text={pair.answer} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(PairInputList);
