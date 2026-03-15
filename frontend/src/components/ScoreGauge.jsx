function getScoreColor(score) {
  if (score >= 80) return '#34D399';
  if (score >= 60) return '#10B981';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

function getScoreGlow(score) {
  if (score >= 80) return 'rgba(52,211,153,0.35)';
  if (score >= 60) return 'rgba(16,185,129,0.3)';
  if (score >= 40) return 'rgba(245,158,11,0.3)';
  return 'rgba(239,68,68,0.3)';
}

function getScoreLabel(score) {
  if (score >= 80) return 'High Transparency';
  if (score >= 60) return 'Good Transparency';
  if (score >= 40) return 'Moderate Transparency';
  return 'Low Transparency';
}

export default function ScoreGauge({ score }) {
  const color = getScoreColor(score);
  const glow = getScoreGlow(score);
  const label = getScoreLabel(score);
  const radius = 80;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const size = (radius + stroke) * 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx={radius + stroke} cy={radius + stroke} r={radius}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          {/* Progress arc */}
          <circle cx={radius + stroke} cy={radius + stroke} r={radius}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circumference} strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1.2s ease-out',
              filter: `drop-shadow(0 0 8px ${glow})`,
            }}
          />
        </svg>
        {/* Center text */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontSize: '2.8rem', fontWeight: 800, color,
            lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            textShadow: `0 0 20px ${glow}`,
          }}>
            {score}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(226,245,236,0.35)', marginTop: '2px' }}>/ 100</span>
        </div>
      </div>
      <p style={{ fontSize: '0.85rem', fontWeight: 600, color, marginTop: '12px', letterSpacing: '0.02em' }}>
        {label}
      </p>
    </div>
  );
}
