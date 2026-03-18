import { memo } from 'react';

function ShapeSelector({ types, activeId, onChange }) {
  return (
    <div className="shape-selector" role="radiogroup" aria-label="Puzzle shape">
      {types.map(type => (
        <button
          key={type.id}
          className={`shape-btn ${activeId === type.id ? 'active' : ''}`}
          onClick={() => onChange(type.id)}
          role="radio"
          aria-checked={activeId === type.id}
          title={`${type.name} (${type.pairCount} pairs)`}
        >
          <ShapeIcon type={type.id} />
          <span className="shape-label">{type.pairCount}</span>
        </button>
      ))}
    </div>
  );
}

function ShapeIcon({ type }) {
  const size = 28;
  if (type.includes('Triangle')) {
    const isSmall = type.includes('small');
    return (
      <svg width={size} height={size} viewBox="0 0 28 28">
        <polygon
          points={isSmall ? "14,8 6,22 22,22" : "14,4 2,26 26,26"}
          fill="currentColor"
        />
      </svg>
    );
  } else {
    const isSmall = type.includes('small');
    const r = isSmall ? 8 : 11;
    const cx = 14, cy = 14;
    const points = Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');
    return (
      <svg width={size} height={size} viewBox="0 0 28 28">
        <polygon points={points} fill="currentColor" />
      </svg>
    );
  }
}

export default memo(ShapeSelector);
