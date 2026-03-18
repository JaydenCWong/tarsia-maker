import { useState, useRef, useEffect, memo } from 'react';

function SaveLoadModal({ mode, data, onLoad, onClose }) {
  const [inputData, setInputData] = useState('');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (mode === 'save' && textareaRef.current) {
      textareaRef.current.select();
    }
  }, [mode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the textarea content
      textareaRef.current?.select();
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLoadSubmit = () => {
    if (inputData.trim()) {
      onLoad(inputData.trim());
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">
          {mode === 'save' ? 'Save Puzzle' : 'Load Puzzle'}
        </h2>

        {mode === 'save' ? (
          <>
            <p className="modal-description">
              Copy this code to save your puzzle. Paste it back later to restore.
            </p>
            <textarea
              ref={textareaRef}
              className="modal-textarea"
              value={data}
              readOnly
              rows={4}
            />
            <div className="modal-actions">
              <button className="modal-btn btn-primary" onClick={handleCopy}>
                {copied ? '✓ Copied!' : 'Copy to Clipboard'}
              </button>
              <button className="modal-btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="modal-description">
              Paste a previously saved puzzle code below.
            </p>
            <textarea
              ref={textareaRef}
              className="modal-textarea"
              value={inputData}
              onChange={e => setInputData(e.target.value)}
              placeholder="Paste your puzzle code here..."
              rows={4}
            />
            <div className="modal-actions">
              <button
                className="modal-btn btn-primary"
                onClick={handleLoadSubmit}
                disabled={!inputData.trim()}
              >
                Load Puzzle
              </button>
              <button className="modal-btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default memo(SaveLoadModal);
