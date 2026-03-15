import { useState, useEffect, useRef, useCallback } from 'react';

const AGENTS = [
  {
    key: 'data_ingestion',
    label: 'Data Ingestion',
    description: 'Parsing CSV structure and validating supplier spend data',
    thoughts: [
      'Detecting column schema and delimiters...',
      'Validating spend amounts and currencies...',
      'Mapping supplier names and identifiers...',
      'Normalizing data format for pipeline...',
    ],
  },
  {
    key: 'category_classification',
    label: 'Category Classification',
    description: 'Mapping spend lines to GHG Protocol Scope 3 categories',
    thoughts: [
      'Applying NAICS sector classification...',
      'Matching to Scope 3 category taxonomy...',
      'Resolving ambiguous category assignments...',
      'Cross-referencing spend descriptions...',
    ],
  },
  {
    key: 'emission_factor_calculation',
    label: 'Emission Factor Calculation',
    description: 'Applying EPA, DEFRA, and GHG Protocol emission factors',
    thoughts: [
      'Fetching EPA EEIO emission factors...',
      'Applying DEFRA spend-based factors...',
      'Calculating tCO2e per line item...',
      'Aggregating by supplier and category...',
    ],
  },
  {
    key: 'analysis_recommendations',
    label: 'Analysis & Recommendations',
    description: 'Synthesizing hotspots and generating reduction strategies',
    thoughts: [
      'Identifying high-emission hotspots...',
      'Benchmarking against sector averages...',
      'Generating prioritized recommendations...',
      'Calculating reduction potential...',
    ],
  },
];

/* ─── Background decoration ──────────────────────────────────── */
function BgDecoration() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: '-20%', right: '-5%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: '0', left: '-5%',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(52,211,153,0.05) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }} />
    </div>
  );
}

/* ─── Pulsing ring for running state ─────────────────────────── */
function PulsingRing() {
  return (
    <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
      <div style={{
        position: 'absolute', inset: '-4px', borderRadius: '50%',
        border: '1.5px solid rgba(16,185,129,0.4)',
        animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
      }} />
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: 'rgba(16,185,129,0.12)',
        border: '2px solid #10B981',
        boxShadow: '0 0 12px rgba(16,185,129,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: '4px', height: '4px', borderRadius: '50%',
              background: '#10B981',
              animation: `bounce-dot 1.2s ease-in-out ${i * 0.15}s infinite`,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Agent stage row with connector ─────────────────────────── */
function StageRow({ agent, agentIndex, status, summary, isLast, thoughtIdx }) {
  const isRunning = status === 'running';
  const isComplete = status === 'complete';
  const isError = status === 'error';

  const thought = isRunning && agent.thoughts[thoughtIdx % agent.thoughts.length];

  return (
    <div style={{ display: 'flex', gap: '0', position: 'relative' }}>
      {/* Connector column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '36px', flexShrink: 0 }}>
        {isRunning ? (
          <PulsingRing />
        ) : isComplete ? (
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #10B981, #059669)',
            boxShadow: '0 0 12px rgba(16,185,129,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} style={{ width: '14px', height: '14px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
        ) : isError ? (
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
            background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2.5} style={{ width: '14px', height: '14px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </div>
        ) : (
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(226,245,236,0.25)', fontSize: '0.8rem', fontWeight: 600,
          }}>
            {agentIndex + 1}
          </div>
        )}
        {!isLast && (
          <div style={{
            width: '1.5px', flex: 1, marginTop: '4px',
            background: isComplete
              ? 'linear-gradient(to bottom, rgba(16,185,129,0.4), rgba(16,185,129,0.1))'
              : 'rgba(255,255,255,0.06)',
            minHeight: '24px',
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingLeft: '16px', paddingBottom: isLast ? '0' : '24px', paddingTop: '4px' }}>
        <div style={{
          borderRadius: '12px', padding: '14px 16px',
          background: isRunning
            ? 'rgba(16,185,129,0.06)'
            : isComplete
            ? 'rgba(16,185,129,0.03)'
            : 'transparent',
          border: isRunning
            ? '1px solid rgba(16,185,129,0.18)'
            : isComplete
            ? '1px solid rgba(16,185,129,0.1)'
            : '1px solid transparent',
          transition: 'all 0.4s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
            <p style={{
              fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.3,
              color: isComplete ? '#34D399' : isRunning ? '#10B981' : isError ? '#EF4444' : 'rgba(226,245,236,0.3)',
              transition: 'color 0.3s ease',
            }}>
              {agent.label}
            </p>
            {isComplete && (
              <span style={{
                fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em',
                color: '#34D399', background: 'rgba(52,211,153,0.1)',
                border: '1px solid rgba(52,211,153,0.2)', padding: '2px 7px', borderRadius: '4px',
                textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}>Done</span>
            )}
          </div>

          {isRunning && thought && (
            <p style={{
              fontSize: '0.78rem', color: 'rgba(16,185,129,0.75)', marginTop: '5px',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span style={{
                display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%',
                background: '#10B981', flexShrink: 0,
              }} />
              {thought}
            </p>
          )}

          {isComplete && summary && (
            <p style={{ fontSize: '0.78rem', color: 'rgba(226,245,236,0.45)', marginTop: '5px', lineHeight: 1.5 }}>
              {summary}
            </p>
          )}

          {isError && (
            <p style={{ fontSize: '0.78rem', color: '#EF4444', marginTop: '4px' }}>An error occurred at this stage</p>
          )}

          {!isRunning && !isComplete && !isError && (
            <p style={{ fontSize: '0.78rem', color: 'rgba(226,245,236,0.2)', marginTop: '4px' }}>
              {agent.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Live preview card ──────────────────────────────────────── */
function PreviewCard({ label, value }) {
  return (
    <div style={{
      background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)',
      borderRadius: '10px', padding: '12px 14px',
    }}>
      <p style={{ fontSize: '0.7rem', color: 'rgba(226,245,236,0.4)', marginBottom: '4px' }}>{label}</p>
      <p style={{
        fontSize: '1rem', fontWeight: 700, color: '#34D399',
        fontVariantNumeric: 'tabular-nums',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}>{value}</p>
    </div>
  );
}

/* ─── Inject keyframes once ──────────────────────────────────── */
const STYLE_ID = 'carbonlens-measure-progress-styles';
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes ping {
      75%, 100% { transform: scale(1.6); opacity: 0; }
    }
    @keyframes bounce-dot {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
      40% { transform: translateY(-4px); opacity: 1; }
    }
  `;
  document.head.appendChild(s);
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://carbonlens-backend-592028248398.us-central1.run.app';

export default function MeasureProgress({ file, onBack, onComplete }) {
  const [jobId, setJobId] = useState(null);
  const [agentStatuses, setAgentStatuses] = useState({});
  const [previews, setPreviews] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(null);
  const [thoughtIdx, setThoughtIdx] = useState(0);
  const startTime = useRef(Date.now());
  const pollRef = useRef(null);
  const timerRef = useRef(null);
  const thoughtRef = useRef(null);

  useEffect(() => { injectStyles(); }, []);

  // Start the job
  useEffect(() => {
    let cancelled = false;

    async function startJob() {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_BASE}/api/measure`, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setJobId(data.job_id);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    startJob();
    return () => { cancelled = true; };
  }, [file]);

  // Elapsed timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Cycle thoughts
  useEffect(() => {
    thoughtRef.current = setInterval(() => setThoughtIdx(i => i + 1), 2800);
    return () => clearInterval(thoughtRef.current);
  }, []);

  // Poll for status
  useEffect(() => {
    if (!jobId) return;

    async function poll() {
      try {
        const res = await fetch(`${API_BASE}/api/measure/${jobId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const agentKeys = ['data_ingestion', 'category_classification', 'emission_factor_calculation', 'analysis_recommendations'];
        const agentMap = {};
        if (Array.isArray(data.agents)) {
          data.agents.forEach((a, idx) => {
            if (agentKeys[idx]) {
              agentMap[agentKeys[idx]] = { status: a.status, summary: a.message };
            }
          });
        }
        setAgentStatuses(agentMap);

        if (data.previews) setPreviews(data.previews);

        if (data.status === 'complete') {
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          clearInterval(thoughtRef.current);
          setTimeout(() => onComplete(data.result, jobId), 800);
        } else if (data.status === 'error') {
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          clearInterval(thoughtRef.current);
          setError(data.error || 'Analysis failed');
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }

    poll();
    pollRef.current = setInterval(poll, 1500);
    return () => clearInterval(pollRef.current);
  }, [jobId, onComplete]);

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  const completeCount = AGENTS.filter(a => agentStatuses[a.key]?.status === 'complete').length;
  const progressPct = (completeCount / AGENTS.length) * 100;

  return (
    <div style={{ minHeight: '100vh', background: '#050e08', color: '#e2f5ec', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <BgDecoration />

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 10,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(5,14,8,0.85)', backdropFilter: 'blur(20px)',
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', height: '64px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Back */}
          <button
            onClick={onBack}
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(226,245,236,0.6)', transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#e2f5ec'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(226,245,236,0.6)'; }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: '15px', height: '15px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>

          {/* Title + progress */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'rgba(226,245,236,0.5)' }}>Measuring</span>
              <span style={{
                fontSize: '1rem', fontWeight: 700, color: '#34D399',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px',
              }}>{file.name}</span>
              {!error && completeCount < AGENTS.length && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
                  color: '#10B981', background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase',
                  flexShrink: 0,
                }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981' }} />
                  Live
                </span>
              )}
            </div>
            {/* Progress bar */}
            <div style={{ marginTop: '6px', height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', width: '100%', maxWidth: '280px' }}>
              <div style={{
                height: '100%', borderRadius: '2px',
                background: 'linear-gradient(90deg, #059669, #34D399)',
                width: `${progressPct}%`,
                boxShadow: '0 0 8px rgba(52,211,153,0.4)',
                transition: 'width 0.8s ease',
              }} />
            </div>
          </div>

          {/* Timer + agent counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(226,245,236,0.4)' }}>
              <span style={{ color: '#34D399', fontWeight: 600 }}>{completeCount}</span>
              <span> / {AGENTS.length} agents</span>
            </span>
            <span style={{
              fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums',
              color: 'rgba(226,245,236,0.5)', fontWeight: 500,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}>
              {formatTime(elapsed)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '32px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Error banner */}
          {error && (
            <div style={{
              borderRadius: '12px', padding: '14px 18px', marginBottom: '24px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <p style={{ fontSize: '0.875rem', color: '#EF4444' }}>Analysis error: {error}</p>
              <button onClick={onBack} style={{
                fontSize: '0.8rem', color: '#EF4444', textDecoration: 'underline',
                background: 'none', border: 'none', cursor: 'pointer',
              }}>Go back</button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

            {/* ── Agent pipeline ────────────────────────────────── */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px', padding: '28px 24px',
              backdropFilter: 'blur(12px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(226,245,236,0.4)' }}>
                  Agent Pipeline
                </p>
              </div>

              <div>
                {AGENTS.map((agent, idx) => (
                  <StageRow
                    key={agent.key}
                    agent={agent}
                    agentIndex={idx}
                    status={agentStatuses[agent.key]?.status || 'pending'}
                    summary={agentStatuses[agent.key]?.summary}
                    isLast={idx === AGENTS.length - 1}
                    thoughtIdx={thoughtIdx}
                  />
                ))}
              </div>
            </div>

            {/* ── Live data panel ───────────────────────────────── */}
            <div style={{ position: 'sticky', top: '88px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '20px', overflow: 'hidden',
                backdropFilter: 'blur(12px)',
              }}>
                {/* Panel header */}
                <div style={{
                  padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: '#10B981', boxShadow: '0 0 6px #10B981',
                  }} />
                  <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(226,245,236,0.4)' }}>
                    Live Data
                  </p>
                </div>

                {/* Preview cards */}
                <div style={{ padding: '16px' }}>
                  {previews.length === 0 ? (
                    <div style={{ padding: '32px 0', textAlign: 'center' }}>
                      <p style={{ fontSize: '0.8rem', color: 'rgba(226,245,236,0.2)' }}>
                        Data appears as agents complete
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {previews.map((p, i) => (
                        <PreviewCard key={i} label={p.label} value={p.value} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Active agent footer */}
                {AGENTS.some(a => agentStatuses[a.key]?.status === 'running') && (() => {
                  const runningAgent = AGENTS.find(a => agentStatuses[a.key]?.status === 'running');
                  return (
                    <div style={{
                      padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(16,185,129,0.04)',
                    }}>
                      <p style={{ fontSize: '0.7rem', color: 'rgba(226,245,236,0.3)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Active Agent
                      </p>
                      <p style={{ fontSize: '0.82rem', color: '#10B981', fontWeight: 500 }}>
                        {runningAgent.label}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(226,245,236,0.4)', marginTop: '2px' }}>
                        {runningAgent.thoughts[thoughtIdx % runningAgent.thoughts.length]}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
