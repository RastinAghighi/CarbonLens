import { useState, useCallback, useRef, useEffect } from 'react';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  'https://carbonlens-backend-592028248398.us-central1.run.app';
import VerifyProgress from './components/VerifyProgress';
import VerifyResults from './components/VerifyResults';
import MeasureProgress from './components/MeasureProgress';
import MeasureResults from './components/MeasureResults';

/* ── Shared icons ── */
function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}
function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}
function IconCpu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" />
    </svg>
  );
}
function IconLeaf() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c4.97 0 9 4.03 9 9-4.97 0-9-4.03-9-9ZM3 12c0 4.97 4.03 9 9 9 0-4.97-4.03-9-9-9Z" />
    </svg>
  );
}

/* ── Background decoration ── */
function BackgroundDecoration() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {/* Primary glow - top right */}
      <div style={{
        position: 'absolute', top: '-15%', right: '-8%',
        width: '700px', height: '700px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, rgba(16,185,129,0.03) 40%, transparent 70%)',
      }} />
      {/* Secondary glow - bottom left */}
      <div style={{
        position: 'absolute', bottom: '5%', left: '-8%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 65%)',
      }} />
      {/* Center mid glow */}
      <div style={{
        position: 'absolute', top: '45%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '900px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(16,185,129,0.04) 0%, transparent 70%)',
      }} />
      {/* Grid pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }} />
      {/* Top fade */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '200px',
        background: 'linear-gradient(to bottom, #050e08, transparent)',
      }} />
    </div>
  );
}

/* ── Navbar ── */
function Navbar({ onScrollToModes }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      padding: '0 2rem',
      transition: 'all 0.3s ease',
      ...(scrolled ? {
        background: 'rgba(5, 14, 8, 0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      } : {}),
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            boxShadow: '0 0 12px rgba(16,185,129,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} style={{ width: '14px', height: '14px' }}>
              <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m16.5 16.5 3 3" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#e2f5ec', letterSpacing: '-0.01em' }}>CarbonLens</span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {['Verify', 'Measure', 'How It Works', 'About'].map(link => (
            <button key={link}
              onClick={link === 'Verify' || link === 'Measure' ? onScrollToModes : undefined}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(226,245,236,0.55)', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#34D399'}
              onMouseLeave={e => e.target.style.color = 'rgba(226,245,236,0.55)'}
            >{link}</button>
          ))}
          <button
            onClick={onScrollToModes}
            className="btn-emerald"
            style={{ padding: '7px 18px', borderRadius: '8px', fontSize: '0.85rem', border: 'none', cursor: 'pointer' }}
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ── Hero Section ── */
function HeroSection({ onScrollToModes }) {
  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '120px 2rem 80px', textAlign: 'center',
      position: 'relative', zIndex: 1,
    }}>
      {/* Badge */}
      <div className="badge-emerald" style={{ marginBottom: '24px', animation: 'fade-in 0.6s ease-out' }}>
        AI-Powered ESG Intelligence
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: 'clamp(3rem, 8vw, 6.5rem)',
        fontWeight: 800,
        lineHeight: 1.0,
        letterSpacing: '-0.03em',
        marginBottom: '28px',
        animation: 'fade-up 0.7s ease-out',
      }}>
        <span style={{ color: '#e2f5ec', display: 'block' }}>Carbon</span>
        <span className="gradient-text" style={{ display: 'block' }}>Lens</span>
      </h1>

      {/* Tagline */}
      <p style={{
        fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
        color: 'rgba(226,245,236,0.7)',
        fontWeight: 400,
        maxWidth: '600px',
        lineHeight: 1.5,
        marginBottom: '16px',
        animation: 'fade-up 0.8s ease-out',
      }}>
        AI-powered supply chain emissions intelligence
      </p>
      <p style={{
        fontSize: '1rem',
        color: 'rgba(226,245,236,0.45)',
        maxWidth: '480px',
        lineHeight: 1.7,
        marginBottom: '48px',
        animation: 'fade-up 0.9s ease-out',
      }}>
        Verify any company's sustainability claims or calculate your own Scope 3 emissions - in minutes, not months.
      </p>

      {/* CTA Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', animation: 'fade-up 1s ease-out' }}>
        <button
          className="btn-emerald"
          onClick={onScrollToModes}
          style={{ padding: '13px 28px', borderRadius: '10px', fontSize: '0.95rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <IconSearch />
          Analyze a Company
        </button>
        <button
          className="btn-ghost"
          onClick={onScrollToModes}
          style={{ padding: '13px 28px', borderRadius: '10px', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <IconChart />
          Measure Scope 3
        </button>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={onScrollToModes}
        style={{
          position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(226,245,236,0.3)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
          animation: 'float 3s ease-in-out infinite',
        }}>
        <span style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Scroll</span>
        <IconArrow />
      </button>

      {/* Floating metric cards */}
      <div style={{
        position: 'absolute', top: '22%', left: '4%',
        animation: 'float 7s ease-in-out infinite',
        display: 'none',
      }} className="hero-float-left">
        <div className="glass" style={{ borderRadius: '12px', padding: '14px 18px', textAlign: 'left' }}>
          <p style={{ fontSize: '0.65rem', color: 'rgba(226,245,236,0.4)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Trust Score</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#34D399' }}>82<span style={{ fontSize: '0.9rem' }}>/100</span></p>
        </div>
      </div>
    </section>
  );
}

/* ── Mode Cards ── */
function ModeCards({ onAnalyze, onMeasure }) {
  const [companyName, setCompanyName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  function handleAnalyze() {
    const name = companyName.trim();
    if (name) onAnalyze(name);
  }
  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAnalyze();
  }
  function handleFileSelect(file) {
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
    }
  }
  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  }

  return (
    <section id="modes" style={{ position: 'relative', zIndex: 1, padding: '0 2rem 100px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{ color: '#10B981', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Two Modes. One Platform.
          </p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, letterSpacing: '-0.02em', color: '#e2f5ec' }}>
            Choose Your Analysis
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
          {/* ── Verify Card ── */}
          <div className="glass hover-glow" style={{ borderRadius: '20px', padding: '36px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {/* Card glow accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #10B981, transparent)' }} />

            <div style={{ marginBottom: '28px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px', color: '#10B981',
              }}>
                <IconSearch />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#e2f5ec' }}>Verify</h3>
                <span className="badge-emerald">Free</span>
              </div>
              <p style={{ fontSize: '0.95rem', fontWeight: 500, color: 'rgba(226,245,236,0.75)', marginBottom: '10px' }}>
                Analyze any company's sustainability claims
              </p>
              <p style={{ fontSize: '0.875rem', color: 'rgba(226,245,236,0.45)', lineHeight: 1.7 }}>
                Enter a company name and our AI cross-references public disclosures, EPA data, and industry benchmarks to produce a trust score and detailed breakdown.
              </p>
            </div>

            {/* Feature list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
              {['Greenwashing detection', 'Cross-referenced EPA & DEFRA data', 'Trust score 0-100 with evidence'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'rgba(226,245,236,0.55)' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />
                  {f}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Enter a company name..."
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="input-dark"
                style={{ flex: 1, borderRadius: '9px', padding: '11px 14px', fontSize: '0.875rem' }}
              />
              <button
                onClick={handleAnalyze}
                disabled={!companyName.trim()}
                className="btn-emerald"
                style={{ padding: '11px 20px', borderRadius: '9px', fontSize: '0.875rem', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Analyze
              </button>
            </div>
          </div>

          {/* ── Measure Card ── */}
          <div className="glass hover-glow" style={{ borderRadius: '20px', padding: '36px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #34D399, transparent)' }} />

            <div style={{ marginBottom: '28px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px', color: '#34D399',
              }}>
                <IconChart />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#e2f5ec' }}>Measure</h3>
                <span className="badge-emerald">Scope 3</span>
              </div>
              <p style={{ fontSize: '0.95rem', fontWeight: 500, color: 'rgba(226,245,236,0.75)', marginBottom: '10px' }}>
                Calculate your Scope 3 emissions
              </p>
              <p style={{ fontSize: '0.875rem', color: 'rgba(226,245,236,0.45)', lineHeight: 1.7 }}>
                Upload procurement or spend data and get a full Scope 3 breakdown using EPA emission factors - no consultants, no six-figure contracts.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {['EPA & DEFRA emission factors', 'Category-level breakdown', 'Supplier priority ranking'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'rgba(226,245,236,0.55)' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34D399', flexShrink: 0 }} />
                  {f}
                </div>
              ))}
            </div>

            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={e => handleFileSelect(e.target.files[0])} style={{ display: 'none' }} />

            <div
              className={`dropzone${dragOver ? ' dropzone-active' : ''}${selectedFile ? ' dropzone-success' : ''}`}
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
              onClick={() => fileInputRef.current?.click()}
              style={{ borderRadius: '10px', padding: '24px', textAlign: 'center', marginBottom: '12px' }}
            >
              {selectedFile ? (
                <>
                  <div style={{ color: '#34D399', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><IconCheck /></div>
                  <p style={{ fontSize: '0.875rem', color: '#34D399', fontWeight: 500 }}>{selectedFile.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(226,245,236,0.4)', marginTop: '4px' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB - click to change
                  </p>
                </>
              ) : (
                <>
                  <div style={{ color: 'rgba(226,245,236,0.25)', display: 'flex', justifyContent: 'center', marginBottom: '10px' }}><IconUpload /></div>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(226,245,236,0.45)', marginBottom: '4px' }}>Drop CSV or Excel files here</p>
                  <p style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 500 }}>Browse files</p>
                </>
              )}
            </div>

            <button
              onClick={() => selectedFile && onMeasure(selectedFile)}
              disabled={!selectedFile}
              className="btn-emerald"
              style={{ width: '100%', padding: '11px', borderRadius: '9px', fontSize: '0.875rem', border: 'none', cursor: selectedFile ? 'pointer' : 'not-allowed' }}
            >
              Calculate Emissions
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── How It Works ── */
function HowItWorks() {
  const steps = [
    {
      num: '01',
      icon: <IconSearch />,
      title: 'Input',
      subtitle: 'Enter a company name or upload spend data',
      desc: 'Point CarbonLens at any publicly traded or private company, or upload your own procurement CSV or Excel file.',
      tags: ['Company name', 'CSV / Excel'],
    },
    {
      num: '02',
      icon: <IconCpu />,
      title: 'AI Processing',
      subtitle: '5 specialized agents run in parallel',
      desc: 'Our pipeline cross-references public disclosures, EPA databases, GHG Protocol benchmarks, and third-party registries in seconds.',
      tags: ['EPA Data', 'GHG Protocol', 'Public filings'],
    },
    {
      num: '03',
      icon: <IconShield />,
      title: 'Insights',
      subtitle: 'Trust score or Scope 3 breakdown delivered',
      desc: 'Receive a detailed intelligence report: credibility ratings, red-flag evidence, emission totals by category, and priority supplier actions.',
      tags: ['Trust Score', 'Scope 3 tCO₂e', 'Action plan'],
    },
  ];

  return (
    <section style={{ position: 'relative', zIndex: 1, padding: '0 2rem 100px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <p style={{ color: '#10B981', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>How It Works</p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, letterSpacing: '-0.02em', color: '#e2f5ec' }}>
            From input to insight in minutes
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', position: 'relative' }}>
          {steps.map((step, i) => (
            <div key={i} className="glass hover-glow" style={{ borderRadius: '18px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
              {/* Step number watermark */}
              <div style={{
                position: 'absolute', top: '16px', right: '20px',
                fontSize: '3.5rem', fontWeight: 800, color: 'rgba(16,185,129,0.06)',
                lineHeight: 1, fontVariantNumeric: 'tabular-nums',
              }}>{step.num}</div>

              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#10B981', marginBottom: '20px',
              }}>
                {step.icon}
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2f5ec', marginBottom: '4px' }}>{step.title}</h3>
              <p style={{ fontSize: '0.82rem', color: '#10B981', fontWeight: 500, marginBottom: '12px' }}>{step.subtitle}</p>
              <p style={{ fontSize: '0.85rem', color: 'rgba(226,245,236,0.5)', lineHeight: 1.7, marginBottom: '20px' }}>{step.desc}</p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {step.tags.map(tag => (
                  <span key={tag} style={{
                    background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)',
                    color: 'rgba(52,211,153,0.8)', fontSize: '0.7rem', fontWeight: 500,
                    padding: '3px 8px', borderRadius: '4px',
                  }}>{tag}</span>
                ))}
              </div>

              {/* Connector arrow (not on last) */}
              {i < steps.length - 1 && (
                <div style={{
                  position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)',
                  zIndex: 2, display: 'none',
                }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Stats Section ── */
function StatsSection() {
  const stats = [
    { value: '7%', label: 'of companies measure all emission scopes', source: 'BCG 2025' },
    { value: '80-90%', label: 'of emissions hide in the supply chain', source: 'GHG Protocol' },
    { value: '$50K+', label: 'annual cost of legacy enterprise ESG tools', source: 'Market research' },
  ];

  return (
    <section style={{ position: 'relative', zIndex: 1, padding: '0 2rem 100px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Divider */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.2), transparent)', marginBottom: '80px' }} />

        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <p style={{ color: '#10B981', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>The Problem</p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, letterSpacing: '-0.02em', color: '#e2f5ec' }}>
            The ESG reporting gap is massive
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {stats.map((s, i) => (
            <div key={i} className="glass hover-glow" style={{ borderRadius: '18px', padding: '36px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '40%', height: '1px', background: 'linear-gradient(90deg, transparent, #10B981, transparent)' }} />
              <p className="stat-number" style={{ marginBottom: '12px' }}>{s.value}</p>
              <p style={{ fontSize: '0.9rem', color: 'rgba(226,245,236,0.65)', lineHeight: 1.6, marginBottom: '10px' }}>{s.label}</p>
              <span style={{ fontSize: '0.7rem', color: 'rgba(226,245,236,0.3)', fontStyle: 'italic' }}>{s.source}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Dashboard Preview ── */
function DashboardPreview() {
  const categories = [
    { name: 'Purchased Goods', value: 42, tco2: '8,240' },
    { name: 'Business Travel', value: 28, tco2: '5,490' },
    { name: 'Transportation', value: 18, tco2: '3,530' },
    { name: 'Waste', value: 12, tco2: '2,350' },
  ];

  return (
    <></>
  );
}

/* ── CTA Section ── */
function CTASection({ onScrollToModes }) {
  return (
    <section style={{ position: 'relative', zIndex: 1, padding: '0 2rem 80px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        {/* Divider */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.2), transparent)', marginBottom: '80px' }} />

        <div className="glass" style={{ borderRadius: '24px', padding: '60px 48px', position: 'relative', overflow: 'hidden' }}>
          {/* Background glow */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '400px', height: '200px', borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(16,185,129,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent)' }} />

          <div className="badge-emerald" style={{ marginBottom: '20px', display: 'inline-block' }}>
            Start Free Today
          </div>

          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.02em', color: '#e2f5ec', marginBottom: '16px' }}>
            Uncover the carbon hidden in your supply chain
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(226,245,236,0.5)', lineHeight: 1.7, marginBottom: '36px', maxWidth: '500px', margin: '0 auto 36px' }}>
            No consultants. No $50K contracts. Just clear, AI-powered emissions intelligence in minutes.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn-emerald"
              onClick={onScrollToModes}
              style={{ padding: '14px 32px', borderRadius: '10px', fontSize: '1rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <IconSearch /> Verify a Company
            </button>
            <button
              className="btn-ghost"
              onClick={onScrollToModes}
              style={{ padding: '14px 28px', borderRadius: '10px', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <IconChart /> Measure Scope 3
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ── */
function Footer() {
  return (
    <footer style={{ position: 'relative', zIndex: 1, padding: '32px 2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} style={{ width: '10px', height: '10px' }}>
              <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m16.5 16.5 3 3" />
            </svg>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2f5ec' }}>CarbonLens</span>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'rgba(226,245,236,0.3)', textAlign: 'center' }}>
          Emission factors from EPA, DEFRA & GHG Protocol &bull; &copy; CarbonLens 2026
        </p>
      </div>
    </footer>
  );
}

/* ── Landing AI Assistant ── */
const GUIDE_CHIPS = [
  { label: 'What does Verify do?', q: 'What does Verify mode do and what does it output?' },
  { label: 'What can I upload?', q: 'What file formats can I upload in Measure mode, and what should the data look like?' },
  { label: 'How is the score calculated?', q: 'How does CarbonLens calculate a company\'s transparency score?' },
  { label: 'What is Scope 3?', q: 'What is Scope 3 emissions and why does it matter for supply chains?' },
  { label: 'How fast is it?', q: 'How long does an analysis take and what makes CarbonLens faster than traditional ESG tools?' },
];

function LandingAssistantSection() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the CarbonLens product guide. Ask me anything about how Verify or Measure mode works, what to expect from an analysis, or what data you need to get started.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [messages]);

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
        body: JSON.stringify({ messages: next, context: 'landing' }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'No response.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Could not reach the assistant right now.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ position: 'relative', zIndex: 1, padding: '0 2rem 100px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(16,185,129,0.2),transparent)', marginBottom: '80px' }} />
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{ color: '#10B981', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Product Guide
          </p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, letterSpacing: '-0.02em', color: '#e2f5ec' }}>
            Have questions? Ask the AI guide.
          </h2>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start',
        }}>
          {/* Left: chips + info */}
          <div>
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px', padding: '28px', marginBottom: '16px',
            }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(226,245,236,0.4)', marginBottom: '16px' }}>
                Common questions
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {GUIDE_CHIPS.map(chip => (
                  <button key={chip.label} onClick={() => send(chip.q)} style={{
                    background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)',
                    borderRadius: '999px', padding: '8px 16px',
                    fontSize: '0.82rem', color: '#34D399', cursor: 'pointer', fontWeight: 500,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.14)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.07)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.18)'; }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Two feature cards */}
            {[
              { icon: '🔍', title: 'Verify Mode', desc: 'Enter any company name. CarbonLens runs 5 AI agents to cross-reference EPA data, sustainability reports, and benchmarks — producing a 0–100 Transparency Score with evidence-backed findings.' },
              { icon: '📊', title: 'Measure Mode', desc: 'Upload a CSV or Excel of procurement spend. CarbonLens maps every line item to EPA DEFRA emission factors and returns Scope 3 totals by category, supplier rankings, and reduction opportunities.' },
            ].map(card => (
              <div key={card.title} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px', padding: '22px 24px', marginBottom: '12px',
                display: 'flex', gap: '16px', alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: '1.4rem', marginTop: '2px' }}>{card.icon}</span>
                <div>
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2f5ec', marginBottom: '6px' }}>{card.title}</p>
                  <p style={{ fontSize: '0.84rem', color: 'rgba(226,245,236,0.5)', lineHeight: 1.65 }}>{card.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: chat panel */}
          <div style={{ position: 'sticky', top: '88px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px', overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(16,185,129,0.04)',
              }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg,#10B981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} style={{ width: '13px', height: '13px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2f5ec' }}>CarbonLens Guide</p>
                  <p style={{ fontSize: '0.7rem', color: '#10B981' }}>Powered by Gemini</p>
                </div>
              </div>

              {/* Messages */}
              <div style={{ padding: '16px', maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                    animation: 'fade-up 0.3s ease-out',
                  }}>
                    <div style={{
                      maxWidth: '88%', padding: '10px 14px', borderRadius: '12px',
                      fontSize: '0.84rem', lineHeight: 1.6,
                      background: m.role === 'user'
                        ? 'rgba(16,185,129,0.15)'
                        : 'rgba(255,255,255,0.05)',
                      border: m.role === 'user'
                        ? '1px solid rgba(16,185,129,0.25)'
                        : '1px solid rgba(255,255,255,0.07)',
                      color: m.role === 'user' ? '#34D399' : 'rgba(226,245,236,0.75)',
                    }}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: 'flex', gap: '4px', paddingLeft: '4px', alignItems: 'center' }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981', animation: `bounce-dot 1.2s ease-in-out ${i*0.15}s infinite` }} />
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  placeholder="Ask anything about CarbonLens..."
                  style={{
                    flex: 1, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', padding: '9px 12px', fontSize: '0.84rem', color: '#e2f5ec',
                    outline: 'none',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.4)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                />
                <button onClick={() => send()} disabled={!input.trim() || loading} style={{
                  width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: input.trim() ? 'linear-gradient(135deg,#10B981,#059669)' : 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                  flexShrink: 0,
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} style={{ width: '14px', height: '14px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Landing Page ── */
function LandingPage({ onAnalyze, onMeasure }) {
  const modesRef = useRef(null);
  function scrollToModes() {
    modesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050e08', position: 'relative' }}>
      <BackgroundDecoration />
      <Navbar onScrollToModes={scrollToModes} />
      <HeroSection onScrollToModes={scrollToModes} />
      <div ref={modesRef}>
        <ModeCards onAnalyze={onAnalyze} onMeasure={onMeasure} />
      </div>
      <HowItWorks />
      <StatsSection />
      <DashboardPreview />
      <LandingAssistantSection />
      <CTASection onScrollToModes={scrollToModes} />
      <Footer />
    </div>
  );
}

/* ── App (routing unchanged) ── */
function App() {
  const [view, setView] = useState('landing');
  const [companyName, setCompanyName] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [measureFile, setMeasureFile] = useState(null);
  const [measureResult, setMeasureResult] = useState(null);

  function handleAnalyze(name) { setCompanyName(name); setView('verify-progress'); }
  function handleMeasure(file) { setMeasureFile(file); setView('measure-progress'); }

  const handleVerifyComplete = useCallback((resultData) => {
    setVerifyResult(resultData);
    setView('verify-results');
  }, []);

  const handleMeasureComplete = useCallback((resultData) => {
    setMeasureResult(resultData);
    setView('measure-results');
  }, []);

  function handleBack() {
    setView('landing');
    setVerifyResult(null);
    setMeasureFile(null);
    setMeasureResult(null);
  }

  if (view === 'verify-progress') return <VerifyProgress companyName={companyName} onBack={handleBack} onComplete={handleVerifyComplete} />;
  if (view === 'verify-results') return <VerifyResults companyName={companyName} result={verifyResult} onNewAnalysis={handleBack} />;
  if (view === 'measure-progress') return <MeasureProgress file={measureFile} onBack={handleBack} onComplete={handleMeasureComplete} />;
  if (view === 'measure-results') return <MeasureResults result={measureResult} onNewAnalysis={handleBack} />;

  return <LandingPage onAnalyze={handleAnalyze} onMeasure={handleMeasure} />;
}

export default App;
