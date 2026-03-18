import { memo } from 'react';

function Toolbar({ onExportPDF, onSave, onLoad, onClear, onShuffle }) {
  return (
    <div className="toolbar">
      <div className="toolbar-main">
        <button className="toolbar-btn btn-export" onClick={onExportPDF} id="btn-export-pdf">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Export to PDF
        </button>
        <button className="toolbar-btn btn-save" onClick={onSave} id="btn-save">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17,21 17,13 7,13 7,21" />
            <polyline points="7,3 7,8 15,8" />
          </svg>
          Save
        </button>
        <button className="toolbar-btn btn-load" onClick={onLoad} id="btn-load">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Load
        </button>
        <button className="toolbar-btn btn-clear" onClick={onClear} id="btn-clear">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3,6 5,6 21,6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Clear
        </button>
      </div>
      <button className="toolbar-btn btn-shuffle" onClick={onShuffle} id="btn-shuffle">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16,3 21,3 21,8" />
          <line x1="4" y1="20" x2="21" y2="3" />
          <polyline points="21,16 21,21 16,21" />
          <line x1="15" y1="15" x2="21" y2="21" />
          <line x1="4" y1="4" x2="9" y2="9" />
        </svg>
        Shuffle
      </button>
    </div>
  );
}

export default memo(Toolbar);
