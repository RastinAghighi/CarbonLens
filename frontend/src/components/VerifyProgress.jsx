import { useState, useEffect, useRef, useCallback } from 'react';

/* ─── Agent definitions ─────────────────────────────────────── */
const AGENTS = [
  {
    key: 'company_intelligence',
    label: 'Company Intelligence',
    shortLabel: 'Intel',
    description: 'Identifying company profile, sector, and regulatory history',
    thoughts: [
      'Resolving company entity and parent structure...',
      'Fetching industry sector and revenue classification...',
      'Mapping regulatory filing history...',
      'Scanning corporate disclosures database...',
    ],
  },
  {
    key: 'report_extraction',
    label: 'Report Extraction',
    shortLabel: 'Docs',
    description: 'Parsing sustainability reports and ESG disclosures',
    thoughts: [
      'Locating latest sustainability report...',
      'Parsing CDP questionnaire responses...',
      'Extracting emission scope declarations...',
      'Reading annual ESG attachments...',
      'Identifying scope boundary methodology...',
    ],
  },
  {
    key: 'independent_data',
    label: 'Independent Data',
    shortLabel: 'Data',
    description: 'Querying EPA, DEFRA, and third-party registries',
    thoughts: [
      'Querying EPA ECHO database...',
      'Cross-checking DEFRA benchmarks...',
      'Scanning Science Based Targets registry...',
      'Retrieving industry emission averages...',
      'Verifying CDP verification status...',
    ],
  },
  {
    key: 'cross_reference',
    label: 'Cross-Reference & Scoring',
    shortLabel: 'Score',
    description: 'Comparing claims against independent evidence',
    thoughts: [
      'Comparing reported vs. estimated emissions...',
      'Detecting disclosure gaps across scopes...',
      'Scoring data completeness (0–100)...',
      'Flagging inconsistencies with standards...',
      'Calculating transparency confidence...',
    ],
  },
  {
    key: 'report_generation',
    label: 'Report Generation',
    shortLabel: 'Report',
    description: 'Synthesizing findings into an intelligence report',
    thoughts: [
      'Synthesizing key findings...',
      'Drafting executive summary...',
      'Generating recommendation set...',
      'Assembling evidence annotations...',
      'Finalizing intelligence report...',
    ],
  },
];

/* ─── Background grid / glow ─────────────────────────────────── */
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

/* ─── Pulsing ring for "running" state ───────────────────────── */
function PulsingRing() {
  return (
    <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
      {/* Outer pulse rings */}
      <div style={{
        position: 'absolute', inset: '-4px', borderRadius: '50%',
        border: '1.5px solid rgba(16,185,129,0.4)',
        animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
      }} />
      {/* Main circle */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: 'rgba(16,185,129,0.12)',
        border: '2px solid #10B981',
        boxShadow: '0 0 12px rgba(16,185,129,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Three dots */}
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

/* ─── Pipeline stage row ─────────────────────────────────────── */
function StageRow({ agent, status, summary, isLast, thoughtIdx }) {
  const isRunning = status === 'running';
  const isComplete = status === 'complete';
  const isError = status === 'error';
  const isPending = !isRunning && !isComplete && !isError;

  const thought = isRunning && agent.thoughts[thoughtIdx % agent.thoughts.length];

  return (
    <div style={{ display: 'flex', gap: '0', position: 'relative' }}>
      {/* Connector column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '36px', flexShrink: 0 }}>
        {/* Indicator */}
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
            {agent.icon || AGENTS.findIndex(a => a.key === agent.key) + 1}
          </div>
        )}
        {/* Vertical connector line */}
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
      <div style={{
        flex: 1, paddingLeft: '16px', paddingBottom: isLast ? '0' : '24px',
        paddingTop: '4px',
      }}>
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
                background: '#10B981', animation: 'pulse-glow 1.5s ease-in-out infinite',
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
            <p style={{ fontSize: '0.78rem', color: '#EF4444', marginTop: '4px' }}>Analysis failed at this stage</p>
          )}

          {isPending && (
            <p style={{ fontSize: '0.78rem', color: 'rgba(226,245,236,0.2)', marginTop: '4px' }}>
              {agent.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Live feed entry ────────────────────────────────────────── */
function FeedEntry({ entry }) {
  const dotColor = entry.type === 'complete' ? '#34D399' : entry.type === 'error' ? '#EF4444' : '#10B981';
  return (
    <div style={{
      display: 'flex', gap: '10px', alignItems: 'flex-start',
      animation: 'fade-up 0.3s ease-out',
      padding: '8px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{
        width: '6px', height: '6px', borderRadius: '50%',
        background: dotColor, marginTop: '5px', flexShrink: 0,
        boxShadow: `0 0 6px ${dotColor}`,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.78rem', color: 'rgba(226,245,236,0.65)', lineHeight: 1.5 }}>{entry.text}</p>
        {entry.value && (
          <p style={{
            fontSize: '0.82rem', fontWeight: 600, color: '#34D399',
            marginTop: '2px', fontVariantNumeric: 'tabular-nums',
          }}>
            {entry.value}
          </p>
        )}
      </div>
      <span style={{
        fontSize: '0.65rem', color: 'rgba(226,245,236,0.2)',
        flexShrink: 0, marginTop: '3px', fontVariantNumeric: 'tabular-nums',
      }}>
        {entry.time}
      </span>
    </div>
  );
}

/* ─── Extra keyframes injected once ─────────────────────────── */
const STYLE_ID = 'carbonlens-progress-styles';
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

/* ─── Agent display labels for feed ─────────────────────────── */
const AGENT_DISPLAY = {
  company_intelligence: 'Company Intel',
  report_extraction: 'Report Extraction',
  independent_data: 'Independent Data',
  cross_reference: 'Cross-Reference',
  report_generation: 'Report Generation',
};

const API_BASE = 'http://localhost:8001';

/* ─── Main component ─────────────────────────────────────────── */
export default function VerifyProgress({ companyName, onBack, onComplete }) {
  const [jobId, setJobId] = useState(null);
  const [agentStatuses, setAgentStatuses] = useState({});
  const [previews, setPreviews] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(null);
  const [feedEntries, setFeedEntries] = useState([]);
  const [thoughtIdx, setThoughtIdx] = useState(0);

  const startTime = useRef(Date.now());
  const pollRef = useRef(null);
  const timerRef = useRef(null);
  const thoughtRef = useRef(null);
  const feedRef = useRef(null);
  const prevStatuses = useRef({});

  useEffect(() => { injectStyles(); }, []);

  function getTimestamp() {
    const s = Math.floor((Date.now() - startTime.current) / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  const addFeedEntry = useCallback((text, type = 'info', value = null) => {
    setFeedEntries(prev => [...prev.slice(-49), { text, type, value, time: getTimestamp(), id: Date.now() + Math.random() }]);
  }, []);

  // Start job
  useEffect(() => {
    let cancelled = false;
    addFeedEntry(`Initializing analysis for ${companyName}...`, 'info');

    async function startJob() {
      try {
        const res = await fetch(`${API_BASE}/api/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_name: companyName }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setJobId(data.job_id);
          addFeedEntry('Pipeline started — 5 agents queued', 'info');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          addFeedEntry(`Failed to start: ${err.message}`, 'error');
        }
      }
    }
    startJob();
    return () => { cancelled = true; };
  }, [companyName]); // eslint-disable-line

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Cycle thoughts for running agent
  useEffect(() => {
    thoughtRef.current = setInterval(() => setThoughtIdx(i => i + 1), 2800);
    return () => clearInterval(thoughtRef.current);
  }, []);

  // Poll
  useEffect(() => {
    if (!jobId) return;

    async function poll() {
      try {
        const res = await fetch(`${API_BASE}/api/verify/${jobId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const agentKeys = ['company_intelligence', 'report_extraction', 'independent_data', 'cross_reference', 'report_generation'];
        const agentMap = {};
        if (Array.isArray(data.agents)) {
          data.agents.forEach((a, idx) => {
            if (agentKeys[idx]) agentMap[agentKeys[idx]] = { status: a.status, summary: a.message };
          });
        }

        // Detect status transitions → add feed entries
        agentKeys.forEach(key => {
          const prev = prevStatuses.current[key]?.status;
          const curr = agentMap[key]?.status;
          if (curr && curr !== prev) {
            const name = AGENT_DISPLAY[key];
            if (curr === 'running') addFeedEntry(`${name} — starting...`, 'running');
            if (curr === 'complete') {
              const msg = agentMap[key]?.summary;
              addFeedEntry(`${name} — complete`, 'complete', msg || null);
            }
            if (curr === 'error') addFeedEntry(`${name} — error`, 'error');
          }
        });
        prevStatuses.current = agentMap;

        setAgentStatuses(agentMap);
        if (data.previews) setPreviews(data.previews);

        if (data.status === 'complete') {
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          clearInterval(thoughtRef.current);
          addFeedEntry('Report generation complete — loading results...', 'complete');
          setTimeout(() => onComplete(data.result), 900);
        } else if (data.status === 'error') {
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          setError(data.error || 'Analysis failed');
          addFeedEntry(`Analysis failed: ${data.error || 'unknown error'}`, 'error');
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }

    poll();
    pollRef.current = setInterval(poll, 1500);
    return () => clearInterval(pollRef.current);
  }, [jobId, onComplete, addFeedEntry]);

  // Auto-scroll feed
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [feedEntries]);

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  const runningAgent = AGENTS.find(a => agentStatuses[a.key]?.status === 'running');
  const completeCount = AGENTS.filter(a => agentStatuses[a.key]?.status === 'complete').length;
  const progressPct = (completeCount / AGENTS.length) * 100;

  return (
    <div style={{ minHeight: '100vh', background: '#050e08', color: '#e2f5ec', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <BgDecoration />

      {/* ── Top bar ───────────────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 10,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(5,14,8,0.85)', backdropFilter: 'blur(20px)',
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', height: '64px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Back */}
          <button onClick={onBack} style={{
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

          {/* Title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'rgba(226,245,236,0.5)' }}>Analyzing</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#34D399' }}>{companyName}</span>
              {/* Live badge */}
              {!error && completeCount < AGENTS.length && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
                  color: '#10B981', background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase',
                }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981', animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
                  Live
                </span>
              )}
            </div>
            {/* Progress bar */}
            <div style={{ marginTop: '6px', height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', width: '100%', maxWidth: '320px' }}>
              <div style={{
                height: '100%', borderRadius: '2px',
                background: 'linear-gradient(90deg, #059669, #34D399)',
                width: `${progressPct}%`,
                boxShadow: '0 0 8px rgba(52,211,153,0.4)',
                transition: 'width 0.8s ease',
              }} />
            </div>
          </div>

          {/* Right: step counter + timer */}
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

      {/* ── Main content ─────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '32px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' }}>

            {/* ── Left: Pipeline ─────────────────────────────── */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px', padding: '28px 24px',
              backdropFilter: 'blur(12px)',
            }}>
              {/* Section label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(226,245,236,0.4)' }}>
                  Agent Pipeline
                </p>
              </div>

              {/* Stage list */}
              <div>
                {AGENTS.map((agent, idx) => (
                  <StageRow
                    key={agent.key}
                    agent={agent}
                    status={agentStatuses[agent.key]?.status || 'pending'}
                    summary={agentStatuses[agent.key]?.summary}
                    isLast={idx === AGENTS.length - 1}
                    thoughtIdx={thoughtIdx}
                  />
                ))}
              </div>

              {/* Live data previews */}
              {previews.length > 0 && (
                <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(226,245,236,0.4)', marginBottom: '14px' }}>
                    Extracted Data
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                    {previews.map((p, i) => (
                      <div key={i} style={{
                        background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)',
                        borderRadius: '10px', padding: '12px 14px',
                        animation: 'fade-up 0.4s ease-out',
                      }}>
                        <p style={{ fontSize: '0.7rem', color: 'rgba(226,245,236,0.4)', marginBottom: '4px' }}>{p.label}</p>
                        <p style={{ fontSize: '1rem', fontWeight: 700, color: '#34D399', fontVariantNumeric: 'tabular-nums' }}>{p.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: Live feed ───────────────────────────── */}
            <div style={{ position: 'sticky', top: '88px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '20px', overflow: 'hidden',
                backdropFilter: 'blur(12px)',
              }}>
                {/* Feed header */}
                <div style={{
                  padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', animation: 'pulse-glow 2s ease-in-out infinite' }} />
                  <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(226,245,236,0.4)' }}>
                    Analysis Feed
                  </p>
                </div>

                {/* Feed entries */}
                <div ref={feedRef} style={{ padding: '8px 16px', maxHeight: '420px', overflowY: 'auto', scrollBehavior: 'smooth' }}>
                  {feedEntries.length === 0 ? (
                    <div style={{ padding: '32px 0', textAlign: 'center' }}>
                      <p style={{ fontSize: '0.8rem', color: 'rgba(226,245,236,0.2)' }}>Waiting for pipeline to start...</p>
                    </div>
                  ) : (
                    feedEntries.map(entry => <FeedEntry key={entry.id} entry={entry} />)
                  )}
                </div>

                {/* Current activity */}
                {runningAgent && (
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
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
