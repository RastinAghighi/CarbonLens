function getScoreColor(score) {
  if (score >= 80) return '#059669';
  if (score >= 60) return '#0D9488';
  if (score >= 40) return '#D97706';
  return '#DC2626';
}

function getScoreLabel(score) {
  if (score >= 80) return 'High Transparency';
  if (score >= 60) return 'Good Transparency';
  if (score >= 40) return 'Moderate Transparency';
  return 'Low Transparency';
}

export default function ScoreGauge({ score }) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const radius = 80;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const size = (radius + stroke) * 2;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={stroke}
        />
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span
          className="text-5xl font-bold"
          style={{ color, fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
        >
          {score}
        </span>
        <span className="text-sm text-[#6B7280] mt-1">/ 100</span>
      </div>
      <p className="text-sm font-medium mt-3" style={{ color }}>{label}</p>
    </div>
  );
}
