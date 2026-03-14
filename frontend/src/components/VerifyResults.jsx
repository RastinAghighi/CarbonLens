import { useState } from 'react';
import ScoreGauge from './ScoreGauge';

function SeverityBadge({ severity }) {
  const colors = {
    HIGH: 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20',
    MEDIUM: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20',
    LOW: 'bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]/20',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${colors[severity] || colors.LOW}`}>
      {severity}
    </span>
  );
}

function SubScoreBar({ label, score, maxScore = 100 }) {
  const pct = Math.min((score / maxScore) * 100, 100);
  const color =
    score >= 80 ? '#059669' : score >= 60 ? '#0D9488' : score >= 40 ? '#D97706' : '#DC2626';

  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-[#374151] font-medium">{label}</span>
        <span style={{ color, fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }} className="font-semibold">
          {score}
        </span>
      </div>
      <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function Collapsible({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors cursor-pointer border-none text-left"
      >
        <span className="text-sm font-semibold text-[#374151]">{title}</span>
        <svg
          className={`w-4 h-4 text-[#6B7280] transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && <div className="px-5 py-4 text-sm text-[#374151] leading-relaxed">{children}</div>}
    </div>
  );
}

function FindingCard({ finding }) {
  const [showEvidence, setShowEvidence] = useState(false);
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <div className="flex items-start gap-3 mb-2">
        <SeverityBadge severity={finding.severity} />
        <h4 className="text-sm font-semibold text-[#111827] flex-1">{finding.title}</h4>
      </div>
      <p className="text-sm text-[#374151] leading-relaxed mb-3">{finding.narrative}</p>
      {finding.evidence && finding.evidence.length > 0 && (
        <div>
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="text-xs text-[#0D9488] font-medium hover:underline cursor-pointer bg-transparent border-none"
          >
            {showEvidence ? 'Hide evidence' : `Show evidence (${finding.evidence.length})`}
          </button>
          {showEvidence && (
            <div className="mt-2 space-y-2">
              {finding.evidence.map((ev, i) => (
                <div key={i} className="rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] px-3 py-2">
                  <p className="text-xs text-[#6B7280]">
                    {ev.source && <span className="font-semibold">{ev.source}: </span>}
                    {ev.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmissionsComparison({ comparison }) {
  if (!comparison) return null;

  const reported = comparison.reported_total || 0;
  const estimated = comparison.estimated_total || 0;
  const max = Math.max(reported, estimated, 1);
  const gap = estimated - reported;

  return (
    <div className="space-y-4">
      {/* Reported */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-[#374151] font-medium">Reported Emissions</span>
          <span
            className="font-semibold text-[#0D9488]"
            style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
          >
            {reported.toLocaleString()} tCO2e
          </span>
        </div>
        <div className="h-6 bg-[#E5E7EB] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#0D9488] transition-all duration-1000"
            style={{ width: `${(reported / max) * 100}%` }}
          />
        </div>
      </div>

      {/* Estimated */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-[#374151] font-medium">Estimated Emissions</span>
          <span
            className="font-semibold text-[#D97706]"
            style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
          >
            {estimated.toLocaleString()} tCO2e
          </span>
        </div>
        <div className="h-6 bg-[#E5E7EB] rounded-full overflow-hidden relative">
          <div
            className="h-full rounded-full bg-[#0D9488] absolute left-0 top-0"
            style={{ width: `${(reported / max) * 100}%` }}
          />
          <div
            className="h-full rounded-full absolute top-0"
            style={{
              left: `${(reported / max) * 100}%`,
              width: `${((estimated - reported) / max) * 100}%`,
              background: 'repeating-linear-gradient(45deg, #D97706, #D97706 4px, #F59E0B 4px, #F59E0B 8px)',
              opacity: 0.7,
            }}
          />
        </div>
      </div>

      {/* Gap label */}
      {gap > 0 && (
        <div className="rounded-lg bg-[#D97706]/5 border border-[#D97706]/20 px-4 py-3">
          <p className="text-sm text-[#D97706] font-medium">
            Scope 3 "Dark Matter" Gap:{' '}
            <span style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
              {gap.toLocaleString()} tCO2e
            </span>
          </p>
          <p className="text-xs text-[#6B7280] mt-1">
            {comparison.gap_explanation || 'Estimated unreported supply chain emissions based on industry benchmarks and independent data.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function VerifyResults({ companyName, result, onNewAnalysis }) {
  const {
    transparency_score = 0,
    sub_scores = {},
    executive_summary = '',
    industry = '',
    findings = [],
    positive_observations = [],
    estimation_comparison = null,
    data_gaps = [],
    methodology = '',
  } = result || {};

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <div className="border-b border-[#E5E7EB] px-6 py-4">
        <div className="max-w-[900px] mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[#111827]">
            Results: <span className="text-[#0D9488]">{companyName}</span>
          </h1>
          <button
            onClick={onNewAnalysis}
            className="rounded-lg bg-[#0D9488] hover:bg-[#0B8278] text-white font-medium px-5 py-2 text-sm transition-colors cursor-pointer"
          >
            New Analysis
          </button>
        </div>
      </div>

      <main className="flex-1 px-6 py-8">
        <div className="max-w-[900px] mx-auto space-y-8">
          {/* Score Hero */}
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="flex justify-center">
                <div className="relative">
                  <ScoreGauge score={transparency_score} />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[#111827] mb-1">{companyName}</h2>
                {industry && <p className="text-sm text-[#6B7280] mb-5">{industry}</p>}
                <div className="space-y-1">
                  {sub_scores.data_completeness != null && (
                    <SubScoreBar label="Data Completeness" score={sub_scores.data_completeness} />
                  )}
                  {sub_scores.consistency != null && (
                    <SubScoreBar label="Consistency" score={sub_scores.consistency} />
                  )}
                  {sub_scores.ambition != null && (
                    <SubScoreBar label="Ambition" score={sub_scores.ambition} />
                  )}
                  {sub_scores.verification != null && (
                    <SubScoreBar label="Verification" score={sub_scores.verification} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          {executive_summary && (
            <div className="rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] p-6">
              <h3 className="text-sm font-semibold text-[#374151] uppercase tracking-wide mb-3">
                Executive Summary
              </h3>
              <p className="text-sm text-[#374151] leading-relaxed">{executive_summary}</p>
            </div>
          )}

          {/* Key Findings */}
          {findings.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#374151] uppercase tracking-wide mb-4">
                Key Findings
              </h3>
              <div className="space-y-4">
                {findings.map((f, i) => (
                  <FindingCard key={i} finding={f} />
                ))}
              </div>
            </div>
          )}

          {/* Positive Observations */}
          {positive_observations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#374151] uppercase tracking-wide mb-4">
                Positive Observations
              </h3>
              <div className="space-y-3">
                {positive_observations.map((obs, i) => (
                  <div key={i} className="rounded-xl border border-[#059669]/20 bg-[#059669]/5 p-5 flex gap-3">
                    <svg className="w-5 h-5 text-[#059669] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-[#059669] mb-1">{obs.title}</p>
                      <p className="text-sm text-[#374151] leading-relaxed">{obs.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emissions Comparison */}
          {estimation_comparison && (
            <div>
              <h3 className="text-sm font-semibold text-[#374151] uppercase tracking-wide mb-4">
                Reported vs Estimated Emissions
              </h3>
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
                <EmissionsComparison comparison={estimation_comparison} />
              </div>
            </div>
          )}

          {/* Data Gaps */}
          {data_gaps.length > 0 && (
            <Collapsible title={`Data Gaps (${data_gaps.length})`}>
              <ul className="list-disc list-inside space-y-1.5">
                {data_gaps.map((gap, i) => (
                  <li key={i} className="text-sm text-[#374151]">{gap}</li>
                ))}
              </ul>
            </Collapsible>
          )}

          {/* Methodology */}
          {methodology && (
            <Collapsible title="Methodology">
              <p className="whitespace-pre-line">{methodology}</p>
            </Collapsible>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-[#9CA3AF]">
          Built with Claude AI &bull; Data from EPA, DEFRA, GHG Protocol &bull; CarbonLens 2026
        </p>
      </footer>
    </div>
  );
}
