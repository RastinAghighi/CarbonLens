import { useState, useEffect, useRef } from 'react';

const AGENTS = [
  { key: 'company_intelligence', label: 'Company Intelligence', icon: '1' },
  { key: 'report_extraction', label: 'Report Extraction', icon: '2' },
  { key: 'independent_data', label: 'Independent Data', icon: '3' },
  { key: 'cross_reference', label: 'Cross-Reference & Scoring', icon: '4' },
  { key: 'report_generation', label: 'Report Generation', icon: '5' },
];

function AgentRow({ agent, status, summary }) {
  const isRunning = status === 'running';
  const isComplete = status === 'complete';
  const isError = status === 'error';

  return (
    <div className="flex items-start gap-4 py-4">
      {/* Status indicator */}
      <div className="flex flex-col items-center">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
            isComplete
              ? 'bg-[#059669] text-white'
              : isRunning
              ? 'bg-[#0D9488] text-white animate-pulse'
              : isError
              ? 'bg-[#DC2626] text-white'
              : 'bg-[#E5E7EB] text-[#9CA3AF]'
          }`}
        >
          {isComplete ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          ) : isError ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            agent.icon
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold transition-colors ${
            isComplete
              ? 'text-[#059669]'
              : isRunning
              ? 'text-[#0D9488]'
              : isError
              ? 'text-[#DC2626]'
              : 'text-[#9CA3AF]'
          }`}
        >
          {agent.label}
        </p>
        {isRunning && (
          <p className="text-xs text-[#0D9488] mt-1 animate-pulse">Processing...</p>
        )}
        {isComplete && summary && (
          <p className="text-xs text-[#6B7280] mt-1">{summary}</p>
        )}
        {isError && (
          <p className="text-xs text-[#DC2626] mt-1">An error occurred</p>
        )}
      </div>
    </div>
  );
}

function PreviewCard({ label, value }) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 animate-fade-in">
      <p className="text-xs text-[#6B7280] mb-0.5">{label}</p>
      <p
        className="text-lg font-bold text-[#0D9488]"
        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
      >
        {value}
      </p>
    </div>
  );
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://carbonlens-backend-592028248398.us-central1.run.app';

export default function VerifyProgress({ companyName, onBack, onComplete }) {
  const [jobId, setJobId] = useState(null);
  const [agentStatuses, setAgentStatuses] = useState({});
  const [previews, setPreviews] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(null);
  const startTime = useRef(Date.now());
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  // Start the job
  useEffect(() => {
    let cancelled = false;

    async function startJob() {
      try {
        const res = await fetch(`${API_BASE}/api/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_name: companyName }),
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
  }, [companyName]);

  // Elapsed timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Poll for status
  useEffect(() => {
    if (!jobId) return;

    async function poll() {
      try {
        const res = await fetch(`${API_BASE}/api/verify/${jobId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Backend returns agents as a list; map to dict keyed by our agent keys
        const agentKeys = ['company_intelligence', 'report_extraction', 'independent_data', 'cross_reference', 'report_generation'];
        const agentMap = {};
        if (Array.isArray(data.agents)) {
          data.agents.forEach((a, idx) => {
            if (agentKeys[idx]) {
              agentMap[agentKeys[idx]] = { status: a.status, summary: a.message };
            }
          });
        }
        setAgentStatuses(agentMap);

        if (data.previews) {
          setPreviews(data.previews);
        }

        if (data.status === 'complete') {
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          // Small delay for UX
          setTimeout(() => onComplete(data.result), 800);
        } else if (data.status === 'error') {
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          setError(data.error || 'Analysis failed');
        }
      } catch (err) {
        // Don't stop polling on transient errors
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <div className="border-b border-[#E5E7EB] px-6 py-4">
        <div className="max-w-[800px] mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-lg border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F9FAFB] transition-colors cursor-pointer bg-white"
          >
            <svg className="w-4 h-4 text-[#6B7280]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-[#111827]">
              Analyzing: <span className="text-[#0D9488]">{companyName}</span>
            </h1>
          </div>
          <div
            className="text-sm text-[#6B7280] tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
          >
            {formatTime(elapsed)}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-[800px] mx-auto">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 mb-6">
              <p className="text-sm text-[#DC2626] font-medium">Error: {error}</p>
              <button
                onClick={onBack}
                className="text-sm text-[#DC2626] underline mt-1 cursor-pointer bg-transparent border-none"
              >
                Go back and try again
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Agent timeline */}
            <div className="lg:col-span-2">
              <h2 className="text-sm font-semibold text-[#374151] uppercase tracking-wide mb-4">
                Agent Pipeline
              </h2>
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-6 divide-y divide-[#E5E7EB]">
                {AGENTS.map((agent) => (
                  <AgentRow
                    key={agent.key}
                    agent={agent}
                    status={agentStatuses[agent.key]?.status || 'pending'}
                    summary={agentStatuses[agent.key]?.summary}
                  />
                ))}
              </div>
            </div>

            {/* Live preview cards */}
            <div>
              <h2 className="text-sm font-semibold text-[#374151] uppercase tracking-wide mb-4">
                Live Data
              </h2>
              <div className="space-y-3">
                {previews.length === 0 ? (
                  <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-6 text-center">
                    <p className="text-xs text-[#9CA3AF]">Data will appear as agents complete</p>
                  </div>
                ) : (
                  previews.map((p, i) => (
                    <PreviewCard key={i} label={p.label} value={p.value} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
