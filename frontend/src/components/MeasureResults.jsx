import { useState } from 'react';

function PriorityBadge({ priority }) {
  const colors = {
    high: 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20',
    medium: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20',
    low: 'bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]/20',
  };
  const key = (priority || 'low').toLowerCase();
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded border uppercase ${colors[key] || colors.low}`}>
      {priority}
    </span>
  );
}

function ConfidenceBadge({ confidence }) {
  const colors = {
    high: 'bg-[#059669]/10 text-[#059669] border-[#059669]/20',
    medium: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20',
    low: 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20',
  };
  const key = (confidence || 'medium').toLowerCase();
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${colors[key] || colors.medium}`}>
      {confidence} confidence
    </span>
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

function CategoryBar({ name, emissions, percentage, maxPercentage }) {
  const barWidth = maxPercentage > 0 ? (percentage / maxPercentage) * 100 : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-[#374151] font-medium truncate mr-4">{name}</span>
        <span className="text-[#6B7280] whitespace-nowrap">
          <span
            className="font-semibold text-[#111827]"
            style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
          >
            {emissions.toLocaleString()}
          </span>{' '}
          tCO2e ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="h-5 bg-[#E5E7EB] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-[#0D9488] transition-all duration-1000 ease-out"
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}

function SupplierRow({ supplier, rank, isTop3, isExpanded, onToggle }) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer transition-colors ${
          isTop3
            ? 'bg-[#0D9488]/5 hover:bg-[#0D9488]/10'
            : 'hover:bg-[#F9FAFB]'
        }`}
      >
        <td className="px-4 py-3 text-sm">
          <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
              isTop3 ? 'bg-[#0D9488] text-white' : 'bg-[#E5E7EB] text-[#6B7280]'
            }`}
          >
            {rank}
          </span>
        </td>
        <td className="px-4 py-3 text-sm font-medium text-[#111827]">{supplier.name}</td>
        <td
          className="px-4 py-3 text-sm font-semibold text-[#111827]"
          style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
        >
          {(supplier.total_emissions ?? 0).toLocaleString()}
        </td>
        <td className="px-4 py-3 text-sm text-[#6B7280]">
          {supplier.spend != null ? `$${supplier.spend.toLocaleString()}` : '-'}
        </td>
        <td
          className="px-4 py-3 text-sm text-[#6B7280]"
          style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
        >
          {supplier.emission_intensity != null ? supplier.emission_intensity.toFixed(2) : '-'}
        </td>
        <td
          className="px-4 py-3 text-sm font-semibold text-[#0D9488]"
          style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
        >
          {(supplier.percentage_of_total ?? 0).toFixed(1)}%
        </td>
        <td className="px-4 py-3 text-sm text-[#6B7280]">
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </td>
      </tr>
      {isExpanded && supplier.line_items && supplier.line_items.length > 0 && (
        <tr>
          <td colSpan={7} className="px-4 py-3 bg-[#F9FAFB]">
            <div className="ml-10">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#9CA3AF]">
                    <th className="text-left py-1 font-medium">Description</th>
                    <th className="text-right py-1 font-medium">Emissions (tCO2e)</th>
                    <th className="text-right py-1 font-medium">Spend</th>
                    <th className="text-left py-1 font-medium pl-4">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {supplier.line_items.map((item, i) => (
                    <tr key={i} className="border-t border-[#E5E7EB]">
                      <td className="py-1.5 text-[#374151]">{item.description || '-'}</td>
                      <td
                        className="py-1.5 text-right text-[#111827]"
                        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
                      >
                        {(item.emissions ?? 0).toLocaleString()}
                      </td>
                      <td className="py-1.5 text-right text-[#6B7280]">
                        {item.spend != null ? `$${item.spend.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-1.5 pl-4 text-[#6B7280]">{item.category || '-'}</td>
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

export default function MeasureResults({ result, onNewAnalysis }) {
  const [expandedSupplier, setExpandedSupplier] = useState(null);

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
  } = result || {};

  const sortedCategories = [...category_breakdown].sort((a, b) => b.emissions - a.emissions);
  const maxCategoryPct = sortedCategories.length > 0 ? sortedCategories[0].percentage : 1;

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedRecommendations = [...recommendations].sort(
    (a, b) => (priorityOrder[(a.priority || '').toLowerCase()] ?? 2) - (priorityOrder[(b.priority || '').toLowerCase()] ?? 2)
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <div className="border-b border-[#E5E7EB] px-6 py-4">
        <div className="max-w-[960px] mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[#111827]">
            Scope 3 <span className="text-[#0D9488]">Emissions Report</span>
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
        <div className="max-w-[960px] mx-auto space-y-8">
          {/* Summary Hero */}
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-8">
            <div className="text-center">
              <p className="text-sm font-medium text-[#6B7280] uppercase tracking-wide mb-2">
                Total Scope 3 Emissions
              </p>
              <p
                className="text-5xl font-bold text-[#0D9488] mb-2"
                style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
              >
                {total_emissions.toLocaleString()}
              </p>
              <p className="text-lg text-[#6B7280] mb-4">tCO2e</p>

              <div className="flex items-center justify-center gap-4 flex-wrap">
                <span className="text-sm text-[#6B7280]">
                  <span
                    className="font-semibold text-[#111827]"
                    style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
                  >
                    {line_items_count.toLocaleString()}
                  </span>{' '}
                  line items analyzed
                </span>
                <ConfidenceBadge confidence={confidence} />
                {equivalence && (
                  <span className="text-sm text-[#6B7280]">
                    Equivalent to{' '}
                    <span className="font-semibold text-[#D97706]">{equivalence}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Scope 3 Category Breakdown */}
          {sortedCategories.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#374151] uppercase tracking-wide mb-4">
                Scope 3 Category Breakdown
              </h3>
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
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

          {/* Supplier Ranking */}
          {supplier_ranking.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#374151] uppercase tracking-wide mb-4">
                Supplier Ranking
              </h3>
              <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                          Rank
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                          Supplier
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                          Total Emissions
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                          Spend
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                          Intensity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                          % of Total
                        </th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {supplier_ranking.map((supplier, i) => (
                        <SupplierRow
                          key={i}
                          supplier={supplier}
                          rank={i + 1}
                          isTop3={i < 3}
                          isExpanded={expandedSupplier === i}
                          onToggle={() =>
                            setExpandedSupplier(expandedSupplier === i ? null : i)
                          }
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Hotspots */}
          {hotspots.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#374151] uppercase tracking-wide mb-4">
                Emission Hotspots
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hotspots.map((hotspot, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[#D97706]/20 bg-[#D97706]/5 p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#D97706]/10 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-4 h-4 text-[#D97706]"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z"
                          />
                        </svg>
                      </div>
                      <div>
                        {hotspot.title && (
                          <p className="text-sm font-semibold text-[#D97706] mb-1">{hotspot.title}</p>
                        )}
                        <p className="text-sm text-[#374151] leading-relaxed">
                          {hotspot.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {sortedRecommendations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#374151] uppercase tracking-wide mb-4">
                Recommendations
              </h3>
              <div className="space-y-4">
                {sortedRecommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[#E5E7EB] bg-white p-5"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <PriorityBadge priority={rec.priority} />
                      {rec.target && (
                        <span className="text-xs font-medium text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded">
                          {rec.target}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#374151] leading-relaxed mb-3">
                      {rec.recommendation}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-[#6B7280]">
                      {rec.potential_reduction && (
                        <span>
                          Potential reduction:{' '}
                          <span
                            className="font-semibold text-[#059669]"
                            style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
                          >
                            {rec.potential_reduction}
                          </span>
                        </span>
                      )}
                      {rec.difficulty && (
                        <span>
                          Difficulty: <span className="font-semibold text-[#374151]">{rec.difficulty}</span>
                        </span>
                      )}
                      {rec.timeframe && (
                        <span>
                          Timeframe: <span className="font-semibold text-[#374151]">{rec.timeframe}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Quality */}
          {data_quality && (
            <Collapsible title="Data Quality">
              {typeof data_quality === 'string' ? (
                <p className="whitespace-pre-line">{data_quality}</p>
              ) : (
                <div className="space-y-3">
                  {data_quality.overall_score != null && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[#374151] font-medium">Overall Score:</span>
                      <span
                        className="text-sm font-bold text-[#0D9488]"
                        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
                      >
                        {data_quality.overall_score}%
                      </span>
                    </div>
                  )}
                  {data_quality.completeness != null && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#374151]">Completeness</span>
                        <span style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
                          className="font-semibold text-[#111827]"
                        >
                          {data_quality.completeness}%
                        </span>
                      </div>
                      <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#0D9488]"
                          style={{ width: `${data_quality.completeness}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {data_quality.notes && (
                    <p className="text-sm text-[#6B7280] whitespace-pre-line">{data_quality.notes}</p>
                  )}
                </div>
              )}
            </Collapsible>
          )}

          {/* Unclassified Items */}
          {unclassified_items.length > 0 && (
            <Collapsible title={`Unclassified Items (${unclassified_items.length})`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[#9CA3AF] text-xs">
                      <th className="text-left py-2 font-medium">Description</th>
                      <th className="text-right py-2 font-medium">Spend</th>
                      <th className="text-left py-2 font-medium pl-4">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {unclassified_items.map((item, i) => (
                      <tr key={i}>
                        <td className="py-2 text-[#374151]">{item.description || '-'}</td>
                        <td className="py-2 text-right text-[#6B7280]">
                          {item.spend != null ? `$${item.spend.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-2 pl-4 text-[#6B7280]">{item.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Collapsible>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-[#9CA3AF]">
          Data from EPA, DEFRA, GHG Protocol &bull; CarbonLens 2026
        </p>
      </footer>
    </div>
  );
}
