import { useState, useRef, useEffect } from 'react';
import ScoreGauge from './ScoreGauge';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  'https://carbonlens-backend-592028248398.us-central1.run.app';

/* ─── Shared dark tooltip ───────────────────────────────────────── */
function DarkTooltip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(5,14,8,0.95)', border: '1px solid rgba(16,185,129,0.25)',
      borderRadius: '10px', padding: '10px 14px', fontSize: '0.8rem',
    }}>
      {label && <p style={{ color: 'rgba(226,245,236,0.5)', marginBottom: '4px' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#34D399', fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}{unit}
        </p>
      ))}
    </div>
  );
}

/* ─── Build chart datasets from _raw ───────────────────────────── */
function buildCharts(raw) {
  if (!raw) return {};
  const { company_profile, claims_extracted, independent_data, cross_reference_analysis } = raw;

  // Score breakdown radar
  const ts = cross_reference_analysis?.transparency_score || {};
  const bd = ts.breakdown || {};
  const scoreBreakdown = [
    { subject: 'Completeness', score: bd.completeness || 0, fullMark: 100 },
    { subject: 'Consistency', score: bd.consistency || 0, fullMark: 100 },
    { subject: 'Ambition', score: bd.ambition || 0, fullMark: 100 },
    { subject: 'Verification', score: bd.verifiability || 0, fullMark: 100 },
  ];

  // GHGRP yearly trend
  const yearlyRaw = company_profile?.ghgrp_data?.yearly_totals_mtco2e || {};
  const ghgrpTrend = Object.entries(yearlyRaw)
    .map(([yr, val]) => ({ year: yr, emissions: +(+val).toFixed(0) }))
    .sort((a, b) => +a.year - +b.year);

  // Top facilities
  const topFacilities = (company_profile?.ghgrp_data?.top_facilities || [])
    .slice(0, 6)
    .map(f => ({
      name: (f.facility_name || f.name || 'Facility').split(' ').slice(0, 3).join(' '),
      emissions: +(+(f.total_emissions_mtco2e || 0)).toFixed(0),
    }));

  // Claims by category
  const catMap = {};
  (claims_extracted || []).forEach(c => {
    const cat = (c.category || 'other').replace(/_/g, ' ');
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const claimsByCategory = Object.entries(catMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Emissions comparison (scope 1+2 estimated vs scope 3 estimated)
  const est = independent_data?.emission_estimates || {};
  const ghgrp = independent_data?.ghgrp_emissions || {};
  const emissionsComparison = [];
  if (ghgrp.available && ghgrp.total_emissions_mtco2e > 0)
    emissionsComparison.push({ name: 'EPA GHGRP', value: +(+ghgrp.total_emissions_mtco2e).toFixed(0), fill: '#10B981' });
  if (est.available) {
    if (est.estimated_scope_1_2 > 0)
      emissionsComparison.push({ name: 'Est. Scope 1+2', value: +est.estimated_scope_1_2.toFixed(0), fill: '#34D399' });
    if (est.estimated_scope_3 > 0)
      emissionsComparison.push({ name: 'Est. Scope 3', value: +est.estimated_scope_3.toFixed(0), fill: '#F59E0B' });
  }

  // Industry benchmark
  const bm = independent_data?.industry_benchmark || {};
  const benchmark = bm.available ? [
    { name: 'P25', value: +(bm.p25_intensity || 0).toFixed(1) },
    { name: 'Median', value: +(bm.median_intensity || 0).toFixed(1) },
    { name: 'Average', value: +(bm.avg_intensity_tco2e_per_m_revenue || 0).toFixed(1) },
    { name: 'P75', value: +(bm.p75_intensity || 0).toFixed(1) },
  ] : [];

  // CDP / SBT quick facts
  const news = independent_data?.news_and_third_party || {};
  const quickFacts = [
    { label: 'CDP Score', value: news.cdp_score || 'N/A' },
    { label: 'Science-Based Target', value: news.science_based_targets?.status || 'Unknown' },
    { label: 'Third-Party Ratings', value: (news.third_party_ratings || []).length > 0 ? `${news.third_party_ratings.length} found` : 'None' },
    { label: 'Controversies', value: (news.controversies || []).length > 0 ? `${news.controversies.length} flagged` : 'None' },
  ];

  return { scoreBreakdown, ghgrpTrend, topFacilities, claimsByCategory, emissionsComparison, benchmark, quickFacts };
}

/* ─── Chart colors ──────────────────────────────────────────────── */
const PIE_COLORS = ['#10B981', '#34D399', '#059669', '#6EE7B7', '#D1FAE5', '#047857', '#F59E0B', '#EF4444'];

/* ─── Shared glass card wrapper for charts ─────────────────────── */
function ChartCard({ title, subtitle, children, span = 1 }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '16px', padding: '22px 20px',
      gridColumn: span > 1 ? `span ${span}` : undefined,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(16,185,129,0.3),transparent)' }} />
      <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(226,245,236,0.35)', marginBottom: '4px' }}>{title}</p>
      {subtitle && <p style={{ fontSize: '0.8rem', color: 'rgba(226,245,236,0.45)', marginBottom: '16px' }}>{subtitle}</p>}
      {!subtitle && <div style={{ marginBottom: '16px' }} />}
      {children}
    </div>
  );
}

/* ─── Metric card ───────────────────────────────────────────────── */
function MetricCard({ label, value, sub, color = '#34D399' }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '14px', padding: '20px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg,transparent,${color}60,transparent)` }} />
      <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(226,245,236,0.35)', marginBottom: '8px' }}>{label}</p>
      <p style={{ fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1, marginBottom: '4px', fontVariantNumeric: 'tabular-nums' }}>{value}</p>
      {sub && <p style={{ fontSize: '0.75rem', color: 'rgba(226,245,236,0.35)' }}>{sub}</p>}
    </div>
  );
}

/* ─── Empty chart placeholder ───────────────────────────────────── */
function ChartEmpty({ msg = 'No data available' }) {
  return (
    <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontSize: '0.8rem', color: 'rgba(226,245,236,0.2)' }}>{msg}</p>
    </div>
  );
}

/* ─── Custom axis tick ───────────────────────────────────────────── */
const AxisTick = ({ x, y, payload }) => (
  <text x={x} y={y + 4} textAnchor="middle" fill="rgba(226,245,236,0.35)" fontSize={10}>{payload.value}</text>
);
const YAxisTick = ({ x, y, payload }) => (
  <text x={x - 4} y={y + 4} textAnchor="end" fill="rgba(226,245,236,0.35)" fontSize={10}>{payload.value}</text>
);

/* ═══════════════════════════════════════════════════════════════════
   DASHBOARD VIEW
══════════════════════════════════════════════════════════════════ */
function DashboardView({ result, charts }) {
  const raw = result?._raw || {};
  const { company_profile, independent_data } = raw;
  const est = independent_data?.emission_estimates || {};
  const bm = independent_data?.industry_benchmark || {};
  const claimsCount = (raw.claims_extracted || []).length;

  return (
    <div style={{ padding: '0 24px 60px', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* ── Metric row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '18px' }}>
          <MetricCard
            label="Transparency Score" value={`${result?.transparency_score ?? 0}/100`}
            sub="Overall ESG credibility" color={result?.transparency_score >= 60 ? '#34D399' : result?.transparency_score >= 40 ? '#F59E0B' : '#EF4444'}
          />
          <MetricCard
            label="EPA Facilities"
            value={company_profile?.ghgrp_data?.facilities_found ?? company_profile?.facilities_found ?? '—'}
            sub={`${company_profile?.ghgrp_data?.reporting_years?.length ?? 0} years tracked`}
          />
          <MetricCard
            label="Claims Extracted" value={claimsCount}
            sub="From sustainability reports" color="#6EE7B7"
          />
          <MetricCard
            label="Total Est. Emissions"
            value={est.total_estimated ? `${(est.total_estimated / 1000).toFixed(0)}K` : '—'}
            sub="tCO₂e (revenue-based)" color="#F59E0B"
          />
        </div>

        {/* ── Row 2: Score radar + Claims pie ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <ChartCard title="Score Breakdown" subtitle="Transparency sub-scores (0–100)">
            {charts.scoreBreakdown?.some(d => d.score > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={charts.scoreBreakdown} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(226,245,236,0.45)', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="score" stroke="#10B981" fill="#10B981" fillOpacity={0.18} strokeWidth={2} />
                  <Tooltip content={<DarkTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            ) : <ChartEmpty />}
          </ChartCard>

          <ChartCard title="Claims by Category" subtitle={`${charts.claimsByCategory?.length ?? 0} ESG claim categories`}>
            {charts.claimsByCategory?.length > 0 ? (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <ResponsiveContainer width={170} height={170}>
                  <PieChart>
                    <Pie data={charts.claimsByCategory} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={38} paddingAngle={2}>
                      {charts.claimsByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={({ active, payload }) => active && payload?.length ? (
                      <div style={{ background: 'rgba(5,14,8,0.95)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.78rem' }}>
                        <p style={{ color: '#34D399', fontWeight: 600, textTransform: 'capitalize' }}>{payload[0].name}</p>
                        <p style={{ color: 'rgba(226,245,236,0.7)' }}>{payload[0].value} claims</p>
                      </div>
                    ) : null} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {charts.claimsByCategory.slice(0, 6).map((d, i) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: '0.72rem', color: 'rgba(226,245,236,0.55)', textTransform: 'capitalize', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</span>
                      <span style={{ fontSize: '0.72rem', color: PIE_COLORS[i % PIE_COLORS.length], fontWeight: 600 }}>{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <ChartEmpty />}
          </ChartCard>
        </div>

        {/* ── Row 3: GHGRP trend + Emissions comparison ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <ChartCard title="EPA GHGRP Emissions Trend" subtitle="Facility-level reported emissions (metric tCO₂e)">
            {charts.ghgrpTrend?.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={charts.ghgrpTrend} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                  <defs>
                    <linearGradient id="ghgrpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="year" tick={<AxisTick />} axisLine={false} tickLine={false} />
                  <YAxis tick={<YAxisTick />} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<DarkTooltip unit=" tCO₂e" />} />
                  <Area type="monotone" dataKey="emissions" name="Emissions" stroke="#10B981" strokeWidth={2} fill="url(#ghgrpGrad)" dot={{ fill: '#10B981', r: 3 }} activeDot={{ r: 5, fill: '#34D399' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <ChartEmpty msg="Insufficient GHGRP data for trend" />}
          </ChartCard>

          <ChartCard title="Emissions Snapshot" subtitle="Reported vs. estimated (tCO₂e)">
            {charts.emissionsComparison?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={charts.emissionsComparison} margin={{ top: 4, right: 8, bottom: 4, left: 8 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={<AxisTick />} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(226,245,236,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<DarkTooltip unit=" tCO₂e" />} />
                  <Bar dataKey="value" name="Emissions" radius={[0, 4, 4, 0]}>
                    {charts.emissionsComparison.map((d, i) => <Cell key={i} fill={d.fill || '#10B981'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <ChartEmpty msg="No emissions estimate data available" />}
          </ChartCard>
        </div>

        {/* ── Row 4: Top facilities + Industry benchmark ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <ChartCard title="Top EPA Reporting Facilities" subtitle="Annual facility emissions (metric tCO₂e)">
            {charts.topFacilities?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={charts.topFacilities} margin={{ top: 4, right: 8, bottom: 4, left: 8 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={<AxisTick />} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(226,245,236,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip content={<DarkTooltip unit=" tCO₂e" />} />
                  <Bar dataKey="emissions" name="Emissions" fill="#10B981" radius={[0, 4, 4, 0]}>
                    {charts.topFacilities.map((_, i) => <Cell key={i} fill={i === 0 ? '#34D399' : '#10B981'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <ChartEmpty msg="No EPA GHGRP facility data" />}
          </ChartCard>

          <ChartCard title="Industry Benchmark" subtitle={bm.sector ? `${bm.sector} intensity (tCO₂e per $M revenue)` : 'Intensity benchmarks'}>
            {charts.benchmark?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={charts.benchmark} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={<AxisTick />} axisLine={false} tickLine={false} />
                  <YAxis tick={<YAxisTick />} axisLine={false} tickLine={false} width={36} />
                  <Tooltip content={<DarkTooltip unit=" tCO₂e/$M" />} />
                  <Bar dataKey="value" name="Intensity" radius={[4, 4, 0, 0]}>
                    {charts.benchmark.map((_, i) => <Cell key={i} fill={i === 1 ? '#34D399' : '#10B981'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <ChartEmpty msg="No industry benchmark available" />}
          </ChartCard>
        </div>

        {/* ── Row 5: Quick facts ── */}
        {charts.quickFacts?.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px' }}>
            {charts.quickFacts.map(f => (
              <div key={f.label} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px', padding: '16px',
              }}>
                <p style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(226,245,236,0.35)', marginBottom: '6px' }}>{f.label}</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34D399' }}>{f.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   AI ANALYST VIEW
══════════════════════════════════════════════════════════════════ */
const ANALYST_CHIPS = [
  'Why did this company get this score?',
  'What are the biggest red flags?',
  'Summarize the key findings',
  'What should this company improve first?',
  'Compare reported claims vs. real impact',
  'What evidence supports the score?',
];

function AIAnalystView({ result, companyName }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `I've analyzed the full ESG report for **${companyName}** — transparency score ${result?.transparency_score ?? 0}/100. Ask me anything about the findings, evidence, data gaps, or what the numbers really mean.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');
    const next = [...messages, { role: 'user', content: userText }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, context: 'report', report_data: result }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'No response.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Could not reach the AI analyst.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '0 24px 60px', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px', alignItems: 'start' }}>

        {/* ── Left: Report content ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ReportSections result={result} />
        </div>

        {/* ── Right: AI Chat (sticky) ── */}
        <div style={{ position: 'sticky', top: '80px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px', overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(16,185,129,0.04)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px',
                background: 'linear-gradient(135deg,#10B981,#059669)',
                boxShadow: '0 0 12px rgba(16,185,129,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} style={{ width: '15px', height: '15px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e2f5ec' }}>AI Analyst</p>
                <p style={{ fontSize: '0.7rem', color: '#10B981' }}>Gemini · Report context loaded</p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', animation: 'pulse-glow 2s ease-in-out infinite' }} />
                <span style={{ fontSize: '0.68rem', color: 'rgba(226,245,236,0.4)' }}>Live</span>
              </div>
            </div>

            {/* Suggestion chips */}
            <div style={{ padding: '12px 16px 0', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {ANALYST_CHIPS.map(q => (
                <button key={q} onClick={() => send(q)} style={{
                  background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)',
                  borderRadius: '999px', padding: '5px 12px', fontSize: '0.73rem', color: 'rgba(52,211,153,0.85)',
                  cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.14)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.07)'; }}
                >{q}</button>
              ))}
            </div>

            {/* Messages */}
            <div style={{ padding: '12px 16px', maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fade-up 0.3s ease-out' }}>
                  <div style={{
                    maxWidth: '90%', padding: '10px 14px', borderRadius: '12px',
                    fontSize: '0.84rem', lineHeight: 1.65,
                    background: m.role === 'user' ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.04)',
                    border: m.role === 'user' ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.07)',
                    color: m.role === 'user' ? '#34D399' : 'rgba(226,245,236,0.75)',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {m.content.replace(/\*\*(.+?)\*\*/g, '$1')}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', gap: '4px', padding: '4px', alignItems: 'center' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981', animation: `bounce-dot 1.2s ease-in-out ${i*0.15}s infinite` }} />)}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px' }}>
              <input
                type="text" value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Ask about this analysis..."
                style={{
                  flex: 1, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', padding: '9px 12px', fontSize: '0.84rem', color: '#e2f5ec', outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.08)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
              />
              <button onClick={() => send()} disabled={!input.trim() || loading} style={{
                width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer', flexShrink: 0,
                background: input.trim() && !loading ? 'linear-gradient(135deg,#10B981,#059669)' : 'rgba(255,255,255,0.06)',
                boxShadow: input.trim() && !loading ? '0 0 12px rgba(16,185,129,0.3)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} style={{ width: '13px', height: '13px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   REPORT SECTIONS (used in AI Analyst mode left panel)
══════════════════════════════════════════════════════════════════ */
function SeverityBadge({ severity }) {
  const s = {
    HIGH: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', color: '#EF4444' },
    MEDIUM: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', color: '#F59E0B' },
    LOW: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', color: '#10B981' },
  }[severity] || { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', color: '#10B981' };
  return (
    <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: '5px', background: s.bg, border: `1px solid ${s.border}`, color: s.color, whiteSpace: 'nowrap' }}>
      {severity}
    </span>
  );
}

function Accordion({ title, badge, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(226,245,236,0.8)' }}>{title}</span>
          {badge != null && <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981' }}>{badge}</span>}
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(226,245,236,0.35)" strokeWidth={2} style={{ width: '16px', height: '16px', transition: 'transform 0.25s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', animation: 'fade-up 0.25s ease-out' }}>{children}</div>}
    </div>
  );
}

function FindingCard({ finding }) {
  const [showEvidence, setShowEvidence] = useState(false);
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px 20px', animation: 'fade-up 0.4s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
        <SeverityBadge severity={finding.severity} />
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2f5ec', flex: 1, lineHeight: 1.4 }}>{finding.title}</h4>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'rgba(226,245,236,0.55)', lineHeight: 1.7, marginBottom: finding.evidence?.length ? '12px' : 0 }}>{finding.narrative}</p>
      {finding.evidence?.length > 0 && (
        <>
          <button onClick={() => setShowEvidence(!showEvidence)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: '#10B981', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: '12px', height: '12px', transition: 'transform 0.2s', transform: showEvidence ? 'rotate(90deg)' : 'none' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            {showEvidence ? 'Hide' : 'Show'} evidence ({finding.evidence.length})
          </button>
          {showEvidence && (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {finding.evidence.map((ev, i) => (
                <div key={i} style={{ borderRadius: '8px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
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
        <div style={{ height: '100%', borderRadius: '3px', width: `${pct}%`, background: `linear-gradient(90deg,${score >= 60 ? '#059669' : score >= 40 ? '#D97706' : '#DC2626'},${color})`, boxShadow: `0 0 8px ${color}40`, transition: 'width 1.2s ease-out' }} />
      </div>
    </div>
  );
}

function ReportSections({ result }) {
  if (!result) return null;
  const { executive_summary, findings = [], positive_observations = [], estimation_comparison, data_gaps = [], methodology } = result;
  return (
    <>
      {executive_summary && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(16,185,129,0.4),transparent)' }} />
          <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(226,245,236,0.35)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '16px', height: '1px', background: 'rgba(16,185,129,0.4)', display: 'inline-block' }} />Executive Summary
          </p>
          <p style={{ fontSize: '0.9rem', color: 'rgba(226,245,236,0.7)', lineHeight: 1.8 }}>{executive_summary}</p>
        </div>
      )}

      {findings.length > 0 && (
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(226,245,236,0.35)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '16px', height: '1px', background: 'rgba(16,185,129,0.4)', display: 'inline-block' }} />Key Findings
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {findings.map((f, i) => <FindingCard key={i} finding={f} />)}
          </div>
        </div>
      )}

      {positive_observations.length > 0 && (
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(226,245,236,0.35)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '16px', height: '1px', background: 'rgba(16,185,129,0.4)', display: 'inline-block' }} />Positive Observations
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {positive_observations.map((obs, i) => (
              <div key={i} style={{ borderRadius: '12px', padding: '14px 18px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', gap: '10px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '5px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2.5} style={{ width: '11px', height: '11px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#34D399', marginBottom: '3px' }}>{obs.title}</p>
                  {obs.description && <p style={{ fontSize: '0.84rem', color: 'rgba(226,245,236,0.55)', lineHeight: 1.65 }}>{obs.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {estimation_comparison && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(226,245,236,0.35)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '16px', height: '1px', background: 'rgba(245,158,11,0.4)', display: 'inline-block' }} />Reported vs. Estimated Emissions
          </p>
          {[
            { label: 'Reported Emissions', val: estimation_comparison.reported_total, color: '#10B981' },
            { label: 'Estimated Emissions', val: estimation_comparison.estimated_total, color: '#F59E0B' },
          ].map(({ label, val, color }) => {
            const max = Math.max(estimation_comparison.reported_total, estimation_comparison.estimated_total, 1);
            return (
              <div key={label} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(226,245,236,0.65)' }}>{label}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>{val.toLocaleString()} tCO₂e</span>
                </div>
                <div style={{ height: '7px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ height: '100%', borderRadius: '4px', width: `${(val / max) * 100}%`, background: `linear-gradient(90deg,${color}80,${color})`, boxShadow: `0 0 6px ${color}40`, transition: 'width 1s ease' }} />
                </div>
              </div>
            );
          })}
          {estimation_comparison.estimated_total > estimation_comparison.reported_total && (
            <div style={{ borderRadius: '10px', padding: '12px 14px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p style={{ fontSize: '0.85rem', color: '#F59E0B', fontWeight: 600, marginBottom: '3px' }}>
                Dark Matter Gap: {(estimation_comparison.estimated_total - estimation_comparison.reported_total).toLocaleString()} tCO₂e
              </p>
              <p style={{ fontSize: '0.8rem', color: 'rgba(226,245,236,0.4)', lineHeight: 1.6 }}>{estimation_comparison.gap_explanation}</p>
            </div>
          )}
        </div>
      )}

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
          <p style={{ fontSize: '0.875rem', color: 'rgba(226,245,236,0.55)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{methodology}</p>
        </Accordion>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════════ */
export default function VerifyResults({ companyName, result, onNewAnalysis }) {
  const [mode, setMode] = useState('dashboard');
  const charts = buildCharts(result?._raw);

  const scoreColor = (result?.transparency_score ?? 0) >= 80 ? '#34D399'
    : (result?.transparency_score ?? 0) >= 60 ? '#10B981'
    : (result?.transparency_score ?? 0) >= 40 ? '#F59E0B'
    : '#EF4444';

  return (
    <div style={{ minHeight: '100vh', background: '#050e08', color: '#e2f5ec', display: 'flex', flexDirection: 'column' }}>
      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(16,185,129,0.07) 0%,transparent 70%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />
      </div>

      {/* ── Top bar ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,14,8,0.92)', backdropFilter: 'blur(20px)', padding: '0 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', height: '62px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 0 10px rgba(16,185,129,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} style={{ width: '12px', height: '12px' }}>
                <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m16.5 16.5 3 3" />
              </svg>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'rgba(226,245,236,0.4)' }}>ESG Report —</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34D399' }}>{companyName}</span>
          </div>

          {/* Mode toggle */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '3px', border: '1px solid rgba(255,255,255,0.08)' }}>
              {[['dashboard', '📊 Dashboard'], ['analyst', '✦ AI Analyst']].map(([id, label]) => (
                <button key={id} onClick={() => setMode(id)} style={{
                  padding: '7px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s ease',
                  background: mode === id ? 'linear-gradient(135deg,#10B981,#059669)' : 'transparent',
                  color: mode === id ? 'white' : 'rgba(226,245,236,0.45)',
                  boxShadow: mode === id ? '0 0 12px rgba(16,185,129,0.3)' : 'none',
                }}>{label}</button>
              ))}
            </div>
            <button onClick={onNewAnalysis} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.83rem', fontWeight: 600, background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 0 14px rgba(16,185,129,0.28)', border: 'none', cursor: 'pointer', color: 'white', transition: 'all 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 22px rgba(16,185,129,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 14px rgba(16,185,129,0.28)'; e.currentTarget.style.transform = 'none'; }}>
              New Analysis
            </button>
          </div>
        </div>
      </div>

      {/* ── Score Hero (always visible) ── */}
      <div style={{ padding: '24px 24px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px 32px', position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '36px', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ position: 'absolute', top: 0, left: '30%', right: '30%', height: '1.5px', background: `linear-gradient(90deg,transparent,${scoreColor}80,transparent)` }} />
            <div style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', fontSize: '8rem', fontWeight: 900, color: 'rgba(255,255,255,0.015)', lineHeight: 1, userSelect: 'none' }}>
              {result?.transparency_score ?? 0}
            </div>
            <div style={{ position: 'relative' }}>
              <ScoreGauge score={result?.transparency_score ?? 0} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e2f5ec', marginBottom: '4px', letterSpacing: '-0.02em' }}>{companyName}</h2>
              {result?.industry && <p style={{ fontSize: '0.85rem', color: 'rgba(226,245,236,0.4)', marginBottom: '12px' }}>{result.industry}</p>}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '6px', background: `${scoreColor}15`, border: `1px solid ${scoreColor}30`, color: scoreColor, marginBottom: '16px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: scoreColor }} />
                {(result?.transparency_score ?? 0) >= 80 ? 'High Transparency' : (result?.transparency_score ?? 0) >= 60 ? 'Good Transparency' : (result?.transparency_score ?? 0) >= 40 ? 'Moderate Transparency' : 'Low Transparency'}
              </span>
              <div>
                {result?.sub_scores?.data_completeness != null && <SubScoreBar label="Data Completeness" score={result.sub_scores.data_completeness} />}
                {result?.sub_scores?.consistency != null && <SubScoreBar label="Consistency" score={result.sub_scores.consistency} />}
                {result?.sub_scores?.ambition != null && <SubScoreBar label="Ambition" score={result.sub_scores.ambition} />}
                {result?.sub_scores?.verification != null && <SubScoreBar label="Verification" score={result.sub_scores.verification} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mode content ── */}
      <main style={{ flex: 1, position: 'relative', zIndex: 1, paddingTop: '4px' }}>
        {mode === 'dashboard'
          ? <DashboardView result={result} charts={charts} />
          : <AIAnalystView result={result} companyName={companyName} />
        }
      </main>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '18px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: 'rgba(226,245,236,0.2)' }}>
          Emission data from EPA, DEFRA & GHG Protocol · CarbonLens 2026
        </p>
      </footer>
    </div>
  );
}
