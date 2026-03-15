import { useState } from 'react';

/* ─── Priority badge ─────────────────────────────────────────── */
function PriorityBadge({ priority }) {
  const key = (priority || 'low').toLowerCase();
  const styles = {
    high: { color: '#EF4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' },
    medium: { color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' },
    low: { color: '#34D399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' },
  };
  const s = styles[key] || styles.low;
  return (
    <span style={{
      ...s,
      fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
      padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase',
    }}>
      {priority}
    </span>
  );
}

/* ─── Confidence badge ───────────────────────────────────────── */
function ConfidenceBadge({ confidence }) {
  const key = (confidence || 'medium').toLowerCase();
  const styles = {
    high: { color: '#34D399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' },
    medium: { color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' },
    low: { color: '#EF4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' },
  };
  const s = styles[key] || styles.medium;
  return (
    <span style={{
      ...s,
      fontSize: '0.72rem', fontWeight: 600,
      padding: '3px 10px', borderRadius: '999px',
    }}>
      {confidence} confidence
    </span>
  );
}

/* ─── Collapsible section ────────────────────────────────────── */
function Collapsible({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px', overflow: 'hidden',
      background: 'rgba(255,255,255,0.02)',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'rgba(255,255,255,0.02)',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          borderBottom: open ? '1px solid rgba(255,255,255,0.06)' : 'none',
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
      >
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(226,245,236,0.8)' }}>{title}</span>
        <svg
          style={{
            width: '16px', height: '16px', color: 'rgba(226,245,236,0.4)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease', flexShrink: 0,
          }}
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: '20px', fontSize: '0.875rem', color: 'rgba(226,245,236,0.65)', lineHeight: 1.7 }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Category bar ───────────────────────────────────────────── */
function CategoryBar({ name, emissions, percentage, maxPercentage }) {
  const barWidth = maxPercentage > 0 ? (percentage / maxPercentage) * 100 : 0;
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(226,245,236,0.8)', marginRight: '16px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </span>
        <span style={{ fontSize: '0.8rem', color: 'rgba(226,245,236,0.4)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          <span style={{
            fontWeight: 600, color: '#e2f5ec',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          }}>
            {emissions.toLocaleString()}
          </span>
          {' '}tCO2e{' '}
          <span style={{ color: 'rgba(226,245,236,0.35)' }}>({percentage.toFixed(1)}%)</span>
        </span>
      </div>
      <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '999px',
          background: 'linear-gradient(90deg, #059669, #34D399)',
          width: `${barWidth}%`,
          boxShadow: '0 0 8px rgba(52,211,153,0.3)',
          transition: 'width 1s ease-out',
        }} />
      </div>
    </div>
  );
}

/* ─── Background decoration ──────────────────────────────────── */
function BgDecoration() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: '-15%', right: '-5%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', left: '-5%',
        width: '350px', height: '350px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(52,211,153,0.04) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }} />
    </div>
  );
}

/* ─── Section heading ────────────────────────────────────────── */
function SectionHeading({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
      <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: 'linear-gradient(to bottom, #10B981, #059669)' }} />
      <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(226,245,236,0.45)' }}>
        {children}
      </p>
    </div>
  );
}

/* ─── Supplier table row ─────────────────────────────────────── */
function SupplierRow({ supplier, rank, isTop3, isExpanded, onToggle }) {
  return (
    <>
      <tr
        onClick={onToggle}
        style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
        onMouseEnter={e => { e.currentTarget.style.background = isTop3 ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = isTop3 ? 'rgba(16,185,129,0.04)' : 'transparent'; }}
      >
        <td style={{ padding: '12px 16px', fontSize: '0.875rem', background: isTop3 ? 'rgba(16,185,129,0.04)' : 'transparent' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '24px', height: '24px', borderRadius: '50%', fontSize: '0.75rem', fontWeight: 700,
            background: isTop3 ? 'linear-gradient(135deg, #10B981, #059669)' : 'rgba(255,255,255,0.06)',
            color: isTop3 ? 'white' : 'rgba(226,245,236,0.4)',
            boxShadow: isTop3 ? '0 0 8px rgba(16,185,129,0.3)' : 'none',
          }}>
            {rank}
          </span>
        </td>
        <td style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: 500, color: '#e2f5ec', background: isTop3 ? 'rgba(16,185,129,0.04)' : 'transparent' }}>
          {supplier.name}
        </td>
        <td style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: 600, color: '#34D399', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", background: isTop3 ? 'rgba(16,185,129,0.04)' : 'transparent' }}>
          {(supplier.total_emissions ?? 0).toLocaleString()}
        </td>
        <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'rgba(226,245,236,0.5)', background: isTop3 ? 'rgba(16,185,129,0.04)' : 'transparent' }}>
          {supplier.spend != null ? `$${supplier.spend.toLocaleString()}` : '—'}
        </td>
        <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'rgba(226,245,236,0.5)', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", background: isTop3 ? 'rgba(16,185,129,0.04)' : 'transparent' }}>
          {supplier.emission_intensity != null ? supplier.emission_intensity.toFixed(2) : '—'}
        </td>
        <td style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: 600, color: '#10B981', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", background: isTop3 ? 'rgba(16,185,129,0.04)' : 'transparent' }}>
          {(supplier.percentage_of_total ?? 0).toFixed(1)}%
        </td>
        <td style={{ padding: '12px 16px', background: isTop3 ? 'rgba(16,185,129,0.04)' : 'transparent' }}>
          <svg
            style={{
              width: '14px', height: '14px', color: 'rgba(226,245,236,0.3)',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </td>
      </tr>
      {isExpanded && supplier.line_items && supplier.line_items.length > 0 && (
        <tr>
          <td colSpan={7} style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.03)' }}>
            <div style={{ marginLeft: '40px' }}>
              <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 500, color: 'rgba(226,245,236,0.3)', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.06em' }}>Description</th>
                    <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 500, color: 'rgba(226,245,236,0.3)', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.06em' }}>Emissions (tCO2e)</th>
                    <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 500, color: 'rgba(226,245,236,0.3)', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.06em' }}>Spend</th>
                    <th style={{ textAlign: 'left', padding: '6px 0 6px 16px', fontWeight: 500, color: 'rgba(226,245,236,0.3)', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.06em' }}>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {supplier.line_items.map((item, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '8px 0', color: 'rgba(226,245,236,0.65)' }}>{item.description || '—'}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', color: '#e2f5ec', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
                        {(item.emissions ?? 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '8px 0', textAlign: 'right', color: 'rgba(226,245,236,0.5)' }}>
                        {item.spend != null ? `$${item.spend.toLocaleString()}` : '—'}
                      </td>
                      <td style={{ padding: '8px 0 8px 16px', color: 'rgba(226,245,236,0.4)' }}>{item.category || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ─── Data normalizer (unchanged logic) ─────────────────────── */
function normalizeMeasureResult(result) {
  if (!result || typeof result !== 'object') return null;
  if (result.total_emissions != null && result.category_breakdown) return result;
  const summary = result.summary || {};
  const total_tco2e = summary.total_scope3_tco2e ?? result.total_emissions ?? 0;
  const line_count = summary.line_items_processed ?? summary.line_items_calculated ?? result.line_items_count ?? 0;
  const byCat = result.by_scope3_category || [];
  const bySupp = result.by_supplier || [];
  return {
    total_emissions: total_tco2e,
    line_items_count: line_count,
    confidence: result.confidence || 'Medium',
    equivalence: result.equivalence ?? null,
    category_breakdown: byCat.map((c) => ({
      name: c.category_name || `Category ${c.category_number || ''}`,
      emissions: (c.emissions_kgco2e ?? 0) / 1000,
      percentage: c.percent_of_total ?? 0,
    })),
    supplier_ranking: bySupp.map((s) => ({
      name: s.supplier_name || 'Unknown',
      total_emissions: (s.total_emissions_kgco2e ?? 0) / 1000,
      spend: s.total_spend_usd,
      emission_intensity: s.emission_intensity_kgco2e_per_usd,
      percentage_of_total: s.percent_of_total ?? 0,
      line_items: [],
    })),
    hotspots: result.hotspots || [],
    recommendations: (result.recommendations || []).map((r) => {
      const p = r.priority;
      const priorityLabel = typeof p === 'number' ? (p <= 2 ? 'High' : p <= 3 ? 'Medium' : 'Low') : (p ? String(p).charAt(0).toUpperCase() + String(p).slice(1).toLowerCase() : 'Medium');
      return {
        priority: priorityLabel,
        target: r.target,
        recommendation: r.recommendation || '',
        potential_reduction: r.potential_reduction_percent ?? r.potential_reduction,
        difficulty: r.difficulty,
        timeframe: r.timeframe,
      };
    }),
    data_quality: result.data_quality_summary ?? result.data_quality ?? null,
    unclassified_items: result.unclassified_items || [],
  };
}

/* ─── Main component ─────────────────────────────────────────── */
export default function MeasureResults({ result, onNewAnalysis }) {
  const [expandedSupplier, setExpandedSupplier] = useState(null);

  const normalized = normalizeMeasureResult(result);
  const {
    total_emissions = 0,
    line_items_count = 0,
    confidence = 'Medium',
    equivalence = null,
    category_breakdown = [],
    supplier_ranking = [],
    hotspots = [],
    recommendations = [],
    data_quality = null,
    unclassified_items = [],
  } = normalized || {};

  const sortedCategories = [...category_breakdown].sort((a, b) => b.emissions - a.emissions);
  const maxCategoryPct = sortedCategories.length > 0 ? sortedCategories[0].percentage : 1;

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedRecommendations = [...recommendations].sort(
    (a, b) => (priorityOrder[(a.priority || '').toLowerCase()] ?? 2) - (priorityOrder[(b.priority || '').toLowerCase()] ?? 2)
  );

  return (
    <div style={{ minHeight: '100vh', background: '#050e08', color: '#e2f5ec', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <BgDecoration />

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(5,14,8,0.9)', backdropFilter: 'blur(20px)',
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.6)' }} />
            <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'rgba(226,245,236,0.5)' }}>Scope 3</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#34D399' }}>Emissions Report</span>
          </div>
          <button
            onClick={onNewAnalysis}
            style={{
              padding: '8px 20px', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600,
              background: 'linear-gradient(135deg, #059669, #10B981)',
              color: 'white', border: 'none', cursor: 'pointer',
              boxShadow: '0 0 20px rgba(16,185,129,0.25)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 28px rgba(16,185,129,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 20px rgba(16,185,129,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            New Analysis
          </button>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* ── Summary hero ─────────────────────────────────────── */}
          <div style={{
            borderRadius: '24px', padding: '48px 40px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(16,185,129,0.15)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 0 60px rgba(16,185,129,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'rgba(226,245,236,0.4)', marginBottom: '16px',
            }}>
              Total Scope 3 Emissions
            </p>
            <p style={{
              fontSize: '4rem', fontWeight: 800, lineHeight: 1,
              color: '#34D399',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              textShadow: '0 0 40px rgba(52,211,153,0.3)',
              marginBottom: '8px',
            }}>
              {total_emissions.toLocaleString()}
            </p>
            <p style={{ fontSize: '1.1rem', color: 'rgba(226,245,236,0.45)', marginBottom: '28px', fontWeight: 500 }}>
              tCO2e
            </p>

            {/* Stats row */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '24px', flexWrap: 'wrap',
            }}>
              <div style={{
                padding: '8px 16px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <span style={{ fontSize: '0.8rem', color: 'rgba(226,245,236,0.4)' }}>Line items analyzed </span>
                <span style={{
                  fontSize: '0.9rem', fontWeight: 700, color: '#e2f5ec',
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                }}>
                  {line_items_count.toLocaleString()}
                </span>
              </div>
              <ConfidenceBadge confidence={confidence} />
              {equivalence && (
                <div style={{
                  padding: '8px 16px', borderRadius: '10px',
                  background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(226,245,236,0.4)' }}>Equivalent to </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F59E0B' }}>{equivalence}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Category breakdown ───────────────────────────────── */}
          {sortedCategories.length > 0 && (
            <div>
              <SectionHeading>Scope 3 Category Breakdown</SectionHeading>
              <div style={{
                borderRadius: '20px', padding: '28px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(12px)',
              }}>
                {sortedCategories.map((cat, i) => (
                  <CategoryBar
                    key={i}
                    name={cat.name}
                    emissions={cat.emissions}
                    percentage={cat.percentage}
                    maxPercentage={maxCategoryPct}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Supplier ranking ─────────────────────────────────── */}
          {supplier_ranking.length > 0 && (
            <div>
              <SectionHeading>Supplier Ranking</SectionHeading>
              <div style={{
                borderRadius: '20px', overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(12px)',
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        {['Rank', 'Supplier', 'Total Emissions', 'Spend', 'Intensity', '% of Total', ''].map((h, i) => (
                          <th key={i} style={{
                            padding: '12px 16px', textAlign: 'left',
                            fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em',
                            textTransform: 'uppercase', color: 'rgba(226,245,236,0.3)',
                            background: 'rgba(255,255,255,0.02)',
                            width: i === 6 ? '40px' : 'auto',
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody style={{ borderTop: 'none' }}>
                      {supplier_ranking.map((supplier, i) => (
                        <SupplierRow
                          key={i}
                          supplier={supplier}
                          rank={i + 1}
                          isTop3={i < 3}
                          isExpanded={expandedSupplier === i}
                          onToggle={() => setExpandedSupplier(expandedSupplier === i ? null : i)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Hotspots ─────────────────────────────────────────── */}
          {hotspots.length > 0 && (
            <div>
              <SectionHeading>Emission Hotspots</SectionHeading>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {hotspots.map((hotspot, i) => (
                  <div key={i} style={{
                    borderRadius: '16px', padding: '20px',
                    background: 'rgba(245,158,11,0.05)',
                    border: '1px solid rgba(245,158,11,0.15)',
                    backdropFilter: 'blur(8px)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                        background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg style={{ width: '18px', height: '18px', color: '#F59E0B' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
                        </svg>
                      </div>
                      <div>
                        {hotspot.title && (
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F59E0B', marginBottom: '6px' }}>
                            {hotspot.title}
                          </p>
                        )}
                        <p style={{ fontSize: '0.84rem', color: 'rgba(226,245,236,0.65)', lineHeight: 1.6 }}>
                          {hotspot.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Recommendations ──────────────────────────────────── */}
          {sortedRecommendations.length > 0 && (
            <div>
              <SectionHeading>Recommendations</SectionHeading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sortedRecommendations.map((rec, i) => (
                  <div key={i} style={{
                    borderRadius: '16px', padding: '20px 24px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(8px)',
                    transition: 'border-color 0.2s ease',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <PriorityBadge priority={rec.priority} />
                      {rec.target && (
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 500, color: 'rgba(226,245,236,0.5)',
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                          padding: '2px 8px', borderRadius: '4px',
                        }}>
                          {rec.target}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(226,245,236,0.75)', lineHeight: 1.65, marginBottom: '14px' }}>
                      {rec.recommendation}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                      {rec.potential_reduction && (
                        <span style={{ fontSize: '0.78rem', color: 'rgba(226,245,236,0.4)' }}>
                          Potential reduction:{' '}
                          <span style={{
                            fontWeight: 700, color: '#34D399',
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                          }}>
                            {rec.potential_reduction}
                          </span>
                        </span>
                      )}
                      {rec.difficulty && (
                        <span style={{ fontSize: '0.78rem', color: 'rgba(226,245,236,0.4)' }}>
                          Difficulty: <span style={{ fontWeight: 600, color: 'rgba(226,245,236,0.7)' }}>{rec.difficulty}</span>
                        </span>
                      )}
                      {rec.timeframe && (
                        <span style={{ fontSize: '0.78rem', color: 'rgba(226,245,236,0.4)' }}>
                          Timeframe: <span style={{ fontWeight: 600, color: 'rgba(226,245,236,0.7)' }}>{rec.timeframe}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Data quality ─────────────────────────────────────── */}
          {data_quality && (
            <Collapsible title="Data Quality">
              {typeof data_quality === 'string' ? (
                <p style={{ whiteSpace: 'pre-line' }}>{data_quality}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {data_quality.overall_score != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.875rem', color: 'rgba(226,245,236,0.6)', fontWeight: 500 }}>Overall Score</span>
                      <span style={{
                        fontSize: '1rem', fontWeight: 700, color: '#34D399',
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      }}>
                        {data_quality.overall_score}%
                      </span>
                    </div>
                  )}
                  {data_quality.completeness != null && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.875rem', color: 'rgba(226,245,236,0.6)' }}>Completeness</span>
                        <span style={{
                          fontSize: '0.875rem', fontWeight: 600, color: '#e2f5ec',
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        }}>
                          {data_quality.completeness}%
                        </span>
                      </div>
                      <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '999px',
                          background: 'linear-gradient(90deg, #059669, #34D399)',
                          width: `${data_quality.completeness}%`,
                          boxShadow: '0 0 8px rgba(52,211,153,0.3)',
                        }} />
                      </div>
                    </div>
                  )}
                  {data_quality.notes && (
                    <p style={{ fontSize: '0.84rem', color: 'rgba(226,245,236,0.45)', whiteSpace: 'pre-line', lineHeight: 1.65 }}>
                      {data_quality.notes}
                    </p>
                  )}
                </div>
              )}
            </Collapsible>
          )}

          {/* ── Unclassified items ───────────────────────────────── */}
          {unclassified_items.length > 0 && (
            <Collapsible title={`Unclassified Items (${unclassified_items.length})`}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.84rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Description', 'Spend', 'Reason'].map((h, i) => (
                        <th key={i} style={{
                          textAlign: i === 1 ? 'right' : 'left',
                          padding: '6px 0', paddingLeft: i === 2 ? '16px' : '0',
                          fontWeight: 500, fontSize: '0.68rem', letterSpacing: '0.06em',
                          textTransform: 'uppercase', color: 'rgba(226,245,236,0.3)',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {unclassified_items.map((item, i) => (
                      <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 0', color: 'rgba(226,245,236,0.65)' }}>{item.description || '—'}</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', color: 'rgba(226,245,236,0.45)' }}>
                          {item.spend != null ? `$${item.spend.toLocaleString()}` : '—'}
                        </td>
                        <td style={{ padding: '10px 0 10px 16px', color: 'rgba(226,245,236,0.4)' }}>{item.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Collapsible>
          )}

        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer style={{
        padding: '24px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        textAlign: 'center', position: 'relative', zIndex: 1,
      }}>
        <p style={{ fontSize: '0.75rem', color: 'rgba(226,245,236,0.2)' }}>
          Data from EPA, DEFRA, GHG Protocol &bull; CarbonLens 2026
        </p>
      </footer>
    </div>
  );
}
