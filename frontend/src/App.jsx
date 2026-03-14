function App() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main content area — vertically centered */}
      <main className="flex-1 flex flex-col justify-center px-6 py-16">
        <div className="max-w-[1200px] w-full mx-auto">
          {/* Header / Hero */}
          <header className="text-center mb-14">
            <h1 className="text-4xl font-semibold tracking-tight text-[#111827] mb-3">
              CarbonLens
            </h1>
            <p className="text-lg text-[#374151] font-medium mb-1.5">
              AI-powered supply chain emissions intelligence
            </p>
            <p className="text-[15px] text-[#6B7280] max-w-xl mx-auto">
              Verify any company's sustainability claims or calculate your own Scope 3
              emissions — in minutes, not months.
            </p>
          </header>

          {/* Mode Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {/* Verify Card */}
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-8 flex flex-col">
              <div className="mb-5">
                <div className="w-11 h-11 rounded-lg bg-[#0D9488]/10 flex items-center justify-center mb-4">
                  <svg
                    className="w-5.5 h-5.5 text-[#0D9488]"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-[#111827] mb-1">Verify</h2>
                <p className="text-[15px] font-medium text-[#374151] mb-2">
                  Analyze any company's sustainability claims
                </p>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  Enter a company name and our AI cross-references public disclosures, EPA
                  data, and industry benchmarks to produce a trust score and detailed
                  breakdown.
                </p>
              </div>

              <div className="mt-auto pt-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Enter a company name..."
                    className="flex-1 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition"
                  />
                  <button className="rounded-lg bg-[#0D9488] hover:bg-[#0B8278] text-white font-medium px-6 py-2.5 text-sm transition-colors cursor-pointer">
                    Analyze
                  </button>
                </div>
              </div>
            </div>

            {/* Measure Card */}
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-8 flex flex-col">
              <div className="mb-5">
                <div className="w-11 h-11 rounded-lg bg-[#0D9488]/10 flex items-center justify-center mb-4">
                  <svg
                    className="w-5.5 h-5.5 text-[#0D9488]"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-[#111827] mb-1">Measure</h2>
                <p className="text-[15px] font-medium text-[#374151] mb-2">
                  Calculate your Scope 3 emissions
                </p>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  Upload your procurement or spend data and get a full Scope 3 breakdown
                  using EPA emission factors — no consultants, no six-figure software
                  contracts.
                </p>
              </div>

              <div className="mt-auto pt-4">
                <div className="rounded-lg border-2 border-dashed border-[#D1D5DB] bg-white px-6 py-6 text-center mb-4 transition hover:border-[#0D9488]/40">
                  <svg
                    className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                    />
                  </svg>
                  <p className="text-sm text-[#6B7280] mb-1">
                    Drop CSV or Excel files here
                  </p>
                  <button className="text-sm text-[#0D9488] font-medium hover:underline cursor-pointer bg-transparent border-none">
                    Browse files
                  </button>
                </div>
                <button className="w-full rounded-lg border-2 border-[#0D9488] text-[#0D9488] hover:bg-[#0D9488]/5 font-medium px-6 py-2.5 text-sm transition-colors cursor-pointer bg-transparent">
                  Calculate
                </button>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-8 py-5">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E5E7EB]">
              <div className="text-center py-3 md:py-0 md:px-6">
                <p className="text-2xl font-semibold text-[#0D9488] mb-1">7%</p>
                <p className="text-xs text-[#6B7280] leading-snug">
                  of companies measure all emission scopes
                  <span className="text-[#9CA3AF]"> (BCG 2025)</span>
                </p>
              </div>
              <div className="text-center py-3 md:py-0 md:px-6">
                <p className="text-2xl font-semibold text-[#0D9488] mb-1">80–90%</p>
                <p className="text-xs text-[#6B7280] leading-snug">
                  of emissions are in the supply chain
                  <span className="text-[#9CA3AF]"> (GHG Protocol)</span>
                </p>
              </div>
              <div className="text-center py-3 md:py-0 md:px-6">
                <p className="text-2xl font-semibold text-[#0D9488] mb-1">$50K+</p>
                <p className="text-xs text-[#6B7280] leading-snug">
                  per year cost of current enterprise tools
                </p>
              </div>
            </div>
          </div>
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

export default App;
