import { useState } from 'react';
import ScoreGauge from './ScoreGauge';

/* ─── Background (matches the app design system) ─────────────── */
function BgDecoration() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: '-15%', right: '-5%',
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

/* ─── Severity badge ─────────────────────────────────────────── */
function SeverityBadge({ severity }) {
  const styles = {
    HIGH: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', color: '#EF4444' },
    MEDIUM: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', color: '#F59E0B' },
    LOW: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', color: '#10B981' },
  };
  const s = styles[severity] || styles.LOW;
  return (
    <span style={{
      fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '3px 9px', borderRadius: '5px',
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      whiteSpace: 'nowrap',
    }}>
      {severity}
    </span>
  );
}

/* ─── Sub-score bar ──────────────────────────────────────────── */
function SubScoreBar({ label, score }) {
  const pct = Math.min(Math.max(score, 0), 100);
  const color = score >= 80 ? '#34D399' : score >= 60 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.82rem', color: 'rgba(226,245,236,0.65)' }}>{label}</span>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>{score}</span>
      </div>
      <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)' }}>
        <div style={{
          height: '100%', borderRadius: '3px', width: `${pct}%`,
          background: `linear-gradient(90deg, ${score >= 60 ? '#059669' : score >= 40 ? '#D97706' : '#DC2626'}, ${color})`,
          boxShadow: `0 0 8px ${color}40`,
          transition: 'width 1.2s ease-out',
        }} />
      </div>
    </div>
  );
}

/* ─── Collapsible accordion ──────────────────────────────────── */
function Accordion({ title, badge, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '14px', overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(226,245,236,0.8)' }}>{title}</span>
          {badge != null && (
            <span style={{
              fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '999px',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981',
            }}>{badge}</span>
          )}
        </div>
        <svg
          viewBox="0 0 24 24" fill="none" stroke="rgba(226,245,236,0.35)" strokeWidth={2}
          style={{ width: '16px', height: '16px', transition: 'transform 0.25s ease', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div style={{
          padding: '0 20px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '16px',
          animation: 'fade-up 0.25s ease-out',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Finding card ───────────────────────────────────────────── */
function FindingCard({ finding }) {
  const [showEvidence, setShowEvidence] = useState(false);
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '14px', padding: '18px 20px',
      animation: 'fade-up 0.4s ease-out',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
        <SeverityBadge severity={finding.severity} />
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2f5ec', flex: 1, lineHeight: 1.4 }}>
          {finding.title}
        </h4>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'rgba(226,245,236,0.55)', lineHeight: 1.7, marginBottom: finding.evidence?.length ? '12px' : '0' }}>
        {finding.narrative}
      </p>
      {finding.evidence?.length > 0 && (
        <>
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.78rem', color: '#10B981', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
              style={{ width: '12px', height: '12px', transform: showEvidence ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            {showEvidence ? 'Hide' : 'Show'} evidence ({finding.evidence.length})
          </button>
          {showEvidence && (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {finding.evidence.map((ev, i) => (
                <div key={i} style={{
                  borderRadius: '8px', padding: '10px 12px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(226,245,236,0.5)', lineHeight: 1.6 }}>
                    {ev.source && <span style={{ fontWeight: 600, color: 'rgba(226,245,236,0.7)' }}>{ev.source}: </span>}
                    {ev.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Emissions comparison ───────────────────────────────────── */
function EmissionsComparison({ comparison }) {
  if (!comparison) return null;
  const reported = comparison.reported_total || 0;
  const estimated = comparison.estimated_total || 0;
  const max = Math.max(reported, estimated, 1);
  const gap = estimated - reported;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[
        { label: 'Reported Emissions', val: reported, color: '#10B981', isEstimated: false },
        { label: 'Estimated Emissions', val: estimated, color: '#F59E0B', isEstimated: true },
      ].map(({ label, val, color }) => (
        <div key={label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
            <span style={{ fontSize: '0.85rem', color: 'rgba(226,245,236,0.65)' }}>{label}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>
              {val.toLocaleString()} tCO₂e
            </span>
          </div>
          <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }}>
            <div style={{
              height: '100%', borderRadius: '4px', width: `${(val / max) * 100}%`,
              background: `linear-gradient(90deg, ${color}80, ${color})`,
              boxShadow: `0 0 8px ${color}40`,
              transition: 'width 1s ease',
            }} />
          </div>
        </div>
      ))}

      {gap > 0 && (
        <div style={{
          borderRadius: '10px', padding: '14px 16px', marginTop: '4px',
          background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
        }}>
          <p style={{ fontSize: '0.85rem', color: '#F59E0B', fontWeight: 600, marginBottom: '4px' }}>
            Scope 3 "Dark Matter" Gap: <span style={{ fontVariantNumeric: 'tabular-nums' }}>{gap.toLocaleString()} tCO₂e</span>
          </p>
          <p style={{ fontSize: '0.8rem', color: 'rgba(226,245,236,0.4)', lineHeight: 1.6 }}>
            {comparison.gap_explanation || 'Estimated unreported supply chain emissions based on industry benchmarks and independent data.'}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Glass section wrapper ──────────────────────────────────── */
function GlassSection({ children, accentColor }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '16px', padding: '24px',
      position: 'relative', overflow: 'hidden',
      backdropFilter: 'blur(10px)',
    }}>
      {accentColor && (
        <div style={{
          position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px',
          background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)`,
        }} />
      )}
      {children}
    </div>
  );
}

/* ─── Section heading ────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
      textTransform: 'uppercase', color: 'rgba(226,245,236,0.35)',
      marginBottom: '16px',
      display: 'flex', alignItems: 'center', gap: '8px',
    }}>
      <span style={{ width: '16px', height: '1px', background: 'rgba(16,185,129,0.4)', display: 'inline-block' }} />
      {children}
    </p>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
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

  const scoreColor = transparency_score >= 80 ? '#34D399' : transparency_score >= 60 ? '#10B981' : transparency_score >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ minHeight: '100vh', background: '#050e08', color: '#e2f5ec', display: 'flex', flexDirection: 'column' }}>
      <BgDecoration />

      {/* ── Top bar ────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(5,14,8,0.9)', backdropFilter: 'blur(20px)',
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Logo mark */}
            <div style={{
              width: '28px', height: '28px', borderRadius: '6px',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              boxShadow: '0 0 12px rgba(16,185,129,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} style={{ width: '13px', height: '13px' }}>
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="m16.5 16.5 3 3" />
              </svg>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'rgba(226,245,236,0.4)', fontWeight: 400 }}>ESG Intelligence Report — </span>
              <span style={{ fontSize: '0.9rem', color: '#34D399', fontWeight: 700 }}>{companyName}</span>
            </div>
          </div>
          <button
            onClick={onNewAnalysis}
            style={{
              padding: '8px 18px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600,
              background: 'linear-gradient(135deg, #10B981, #059669)',
              boxShadow: '0 0 16px rgba(16,185,129,0.3)',
              border: 'none', cursor: 'pointer', color: 'white',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 24px rgba(16,185,129,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 16px rgba(16,185,129,0.3)'; e.currentTarget.style.transform = 'none'; }}
          >
            New Analysis
          </button>
        </div>
      </div>

      {/* ── Report body ─────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '32px 24px 60px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── Score hero card ─────────────────────────────────── */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px', padding: '32px',
            position: 'relative', overflow: 'hidden',
            backdropFilter: 'blur(16px)',
          }}>
            {/* Top accent line */}
            <div style={{
              position: 'absolute', top: 0, left: '30%', right: '30%', height: '1.5px',
              background: `linear-gradient(90deg, transparent, ${scoreColor}80, transparent)`,
            }} />
            {/* Background score watermark */}
            <div style={{
              position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)',
              fontSize: '9rem', fontWeight: 900, color: 'rgba(255,255,255,0.015)',
              lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
            }}>{transparency_score}</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '40px', alignItems: 'center' }}>
              {/* Score gauge */}
              <div style={{ position: 'relative' }}>
                <ScoreGauge score={transparency_score} />
              </div>

              {/* Right info */}
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e2f5ec', marginBottom: '4px', letterSpacing: '-0.02em' }}>
                    {companyName}
                  </h2>
                  {industry && (
                    <p style={{ fontSize: '0.85rem', color: 'rgba(226,245,236,0.4)', marginBottom: '10px' }}>{industry}</p>
                  )}
                  {/* Confidence label */}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '4px 10px', borderRadius: '6px',
                    background: `${scoreColor}15`, border: `1px solid ${scoreColor}30`, color: scoreColor,
                  }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: scoreColor }} />
                    {transparency_score >= 80 ? 'High Transparency' : transparency_score >= 60 ? 'Good Transparency' : transparency_score >= 40 ? 'Moderate Transparency' : 'Low Transparency'}
                  </span>
                </div>

                {/* Sub-score bars */}
                <div>
                  {sub_scores.data_completeness != null && <SubScoreBar label="Data Completeness" score={sub_scores.data_completeness} />}
                  {sub_scores.consistency != null && <SubScoreBar label="Consistency" score={sub_scores.consistency} />}
                  {sub_scores.ambition != null && <SubScoreBar label="Ambition" score={sub_scores.ambition} />}
                  {sub_scores.verification != null && <SubScoreBar label="Verification" score={sub_scores.verification} />}
                </div>
              </div>
            </div>
          </div>

          {/* ── Executive Summary ───────────────────────────────── */}
          {executive_summary && (
            <GlassSection accentColor="#10B981">
              <SectionLabel>Executive Summary</SectionLabel>
              <p style={{ fontSize: '0.9rem', color: 'rgba(226,245,236,0.7)', lineHeight: 1.8 }}>
                {executive_summary}
              </p>
            </GlassSection>
          )}

          {/* ── Key Findings ────────────────────────────────────── */}
          {findings.length > 0 && (
            <div>
              <SectionLabel>Key Findings</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {findings.map((f, i) => <FindingCard key={i} finding={f} />)}
              </div>
            </div>
          )}

          {/* ── Positive Observations ───────────────────────────── */}
          {positive_observations.length > 0 && (
            <div>
              <SectionLabel>Positive Observations</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {positive_observations.map((obs, i) => (
                  <div key={i} style={{
                    borderRadius: '12px', padding: '16px 18px',
                    background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
                    display: 'flex', gap: '12px',
                  }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '6px',
                      background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px',
                    }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2.5} style={{ width: '12px', height: '12px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#34D399', marginBottom: '4px' }}>{obs.title}</p>
                      <p style={{ fontSize: '0.845rem', color: 'rgba(226,245,236,0.55)', lineHeight: 1.7 }}>{obs.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Emissions Comparison ────────────────────────────── */}
          {estimation_comparison && (
            <GlassSection accentColor="#F59E0B">
              <SectionLabel>Reported vs. Estimated Emissions</SectionLabel>
              <EmissionsComparison comparison={estimation_comparison} />
            </GlassSection>
          )}

          {/* ── Accordions ──────────────────────────────────────── */}
          {data_gaps.length > 0 && (
            <Accordion title="Data Gaps" badge={data_gaps.length}>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', listStyle: 'none', padding: 0, margin: 0 }}>
                {data_gaps.map((gap, i) => (
                  <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#F59E0B', marginTop: '7px', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: 'rgba(226,245,236,0.6)', lineHeight: 1.6 }}>{gap}</span>
                  </li>
                ))}
              </ul>
            </Accordion>
          )}

          {methodology && (
            <Accordion title="Methodology">
              <p style={{ fontSize: '0.875rem', color: 'rgba(226,245,236,0.55)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {methodology}
              </p>
            </Accordion>
          )}

        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '20px 24px', textAlign: 'center',
      }}>
        <p style={{ fontSize: '0.75rem', color: 'rgba(226,245,236,0.2)' }}>
          Emission data from EPA, DEFRA & GHG Protocol &bull; CarbonLens 2026
        </p>
      </footer>
    </div>
  );
}
