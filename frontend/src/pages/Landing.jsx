import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Menu,
  X,
  ArrowRight,
  TrendingUp,
  Shield,
  Activity,
  Layers,
  Database,
  Search,
} from 'lucide-react'
import './Landing.css'

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const scrollToSection = (id) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const features = [
    {
      icon: '📊',
      title: 'Real-Time Market Tracking',
      description: 'Track cryptocurrency prices, 24h changes and market capitalization.',
    },
    {
      icon: '📈',
      title: 'Advanced Analytics',
      description: 'Analyze volatility, trend, momentum and drawdown.',
    },
    {
      icon: '🧠',
      title: 'Market Intelligence',
      description: 'Understand overall market mood and data quality.',
    },
    {
      icon: '🔔',
      title: 'Smart Price Alerts',
      description: 'Create customizable price and movement alerts.',
    },
    {
      icon: '⭐',
      title: 'Personal Watchlist',
      description: 'Save cryptocurrencies you want to monitor.',
    },
    {
      icon: '⚖️',
      title: 'Coin Comparison',
      description: 'Compare multiple cryptocurrencies side-by-side.',
    },
    {
      icon: '🗺️',
      title: 'Crypto Heatmap',
      description: 'Visualize market performance using a market-cap-weighted heatmap.',
    },
    {
      icon: '⏪',
      title: 'Market Replay',
      description: 'Explore historical market snapshots.',
    },
    {
      icon: '💼',
      title: 'Portfolio Simulator',
      description: 'Track paper investments and performance.',
    },
    {
      icon: '🖥️',
      title: 'Scraper Health',
      description: 'Monitor data collection and system health.',
    },
  ]

  const steps = [
    {
      number: '01',
      title: 'Collect',
      description: 'Selenium collects cryptocurrency market data.',
      icon: <Database size={24} />,
    },
    {
      number: '02',
      title: 'Analyze',
      description: 'CryptoTrack processes price history and market indicators.',
      icon: <Layers size={24} />,
    },
    {
      number: '03',
      title: 'Understand',
      description: 'View insights, alerts, charts and portfolio information.',
      icon: <TrendingUp size={24} />,
    },
  ]

  return (
    <div className="landing-page">
      {/* ─── 1. TOP NAVBAR ─── */}
      <header className="landing-navbar">
        <div className="landing-navbar-container">
          <Link to="/" className="landing-logo">
            <span className="landing-logo-emoji">🚀</span>
            <span className="landing-logo-text">CryptoTrack</span>
          </Link>

          <nav className="landing-nav-desktop">
            <Link to="/" className="nav-link">
              Home
            </Link>
            <button
              type="button"
              className="nav-link nav-btn-link"
              onClick={() => scrollToSection('features')}
            >
              Features
            </button>
            <button
              type="button"
              className="nav-link nav-btn-link"
              onClick={() => scrollToSection('about')}
            >
              About
            </button>
            <Link to="/login" className="nav-link login-nav-link">
              Login
            </Link>
            <Link to="/register" className="nav-cta-btn">
              Get Started
            </Link>
          </nav>

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="landing-mobile-menu">
            <Link
              to="/"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <button
              type="button"
              className="mobile-nav-link"
              onClick={() => scrollToSection('features')}
            >
              Features
            </button>
            <button
              type="button"
              className="mobile-nav-link"
              onClick={() => scrollToSection('about')}
            >
              About
            </button>
            <Link
              to="/login"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
            <Link
              to="/register"
              className="mobile-cta-btn"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        )}
      </header>

      {/* ─── 2. HERO SECTION ─── */}
      <section className="landing-hero-section">
        <div className="hero-container">
          <div className="hero-text-column">
            <div className="hero-badge">
              <Activity size={14} />
              <span>Institutional-Grade Terminal</span>
            </div>

            <h1 className="hero-title">Track Crypto Markets Smarter</h1>

            <p className="hero-subheading">
              Monitor real-time cryptocurrency prices, analyze market trends, set smart
              alerts, manage your watchlist, and explore portfolio insights — all in one
              powerful platform.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="hero-btn-primary">
                <span>🚀 Get Started</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="hero-btn-secondary">
                <span>🔐 Login</span>
              </Link>
            </div>
          </div>

          <div className="hero-visual-column">
            <div className="fintech-terminal-mockup">
              <div className="mockup-header">
                <div className="mockup-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <div className="mockup-title">CryptoTrack Terminal • Live Session</div>
                <div className="mockup-status">
                  <span className="status-ping" />
                  <span>Online</span>
                </div>
              </div>

              <div className="mockup-body">
                {/* Visual metric cards */}
                <div className="mockup-metrics-row">
                  <div className="mockup-metric-card">
                    <span className="metric-label">Data Ingestion</span>
                    <span className="metric-value text-blue">Selenium Active</span>
                    <span className="metric-sub">Automated Extraction</span>
                  </div>
                  <div className="mockup-metric-card">
                    <span className="metric-label">Market Depth</span>
                    <span className="metric-value text-emerald">Full Orderflow</span>
                    <span className="metric-sub">Aggregated Liquidity</span>
                  </div>
                </div>

                {/* Analytical Trend Representation */}
                <div className="mockup-chart-container">
                  <div className="mockup-chart-header">
                    <span>Market Trend & Volatility Index</span>
                    <div className="mockup-tag">Live Analytics</div>
                  </div>
                  <div className="mockup-wave-visual">
                    <svg
                      viewBox="0 0 400 120"
                      className="mockup-svg"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,80 Q50,40 100,65 T200,45 T300,30 T400,15 L400,120 L0,120 Z"
                        fill="url(#chartGrad)"
                      />
                      <path
                        d="M0,80 Q50,40 100,65 T200,45 T300,30 T400,15"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                      />
                    </svg>
                  </div>
                </div>

                {/* Feature capability pills */}
                <div className="mockup-capability-chips">
                  <div className="chip">
                    <Shield size={13} />
                    <span>256-Bit TLS</span>
                  </div>
                  <div className="chip">
                    <Activity size={13} />
                    <span>Self-Healing Drivers</span>
                  </div>
                  <div className="chip">
                    <Search size={13} />
                    <span>Sub-Second Latency</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. TRUST / VALUE SECTION ─── */}
      <section className="landing-value-section">
        <div className="value-container">
          <div className="value-card">
            <div className="value-card-header">
              <span className="value-emoji">📊</span>
              <h3>Real-Time Data</h3>
            </div>
            <p>Monitor current cryptocurrency market information.</p>
          </div>

          <div className="value-card">
            <div className="value-card-header">
              <span className="value-emoji">📈</span>
              <h3>Intelligent Analytics</h3>
            </div>
            <p>Understand trends, volatility, momentum and market behavior.</p>
          </div>

          <div className="value-card">
            <div className="value-card-header">
              <span className="value-emoji">🔔</span>
              <h3>Smart Monitoring</h3>
            </div>
            <p>Track coins using alerts, watchlists and portfolio simulation.</p>
          </div>
        </div>
      </section>

      {/* ─── 4. FEATURES SECTION ─── */}
      <section id="features" className="landing-features-section">
        <div className="features-container">
          <div className="features-header">
            <h2 className="features-heading">
              Everything You Need to Understand the Crypto Market
            </h2>
            <p className="features-subheading">
              Professional tools designed for tracking, analyzing, and staying ahead of market shifts.
            </p>
          </div>

          <div className="features-grid-10">
            {features.map((feat) => (
              <div key={feat.title} className="feature-item-card">
                <div className="feature-item-icon">{feat.icon}</div>
                <h3 className="feature-item-title">{feat.title}</h3>
                <p className="feature-item-desc">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. HOW IT WORKS SECTION ─── */}
      <section id="about" className="landing-works-section">
        <div className="works-container">
          <div className="works-header">
            <h2 className="works-heading">How CryptoTrack Works</h2>
            <p className="works-subheading">
              A transparent, three-step intelligence pipeline powering your decisions.
            </p>
          </div>

          <div className="steps-container">
            {steps.map((step) => (
              <div key={step.number} className="step-card">
                <div className="step-card-top">
                  <span className="step-number">{step.number}</span>
                  <div className="step-icon-badge">{step.icon}</div>
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. CALL TO ACTION ─── */}
      <section className="landing-cta-section">
        <div className="cta-container">
          <div className="cta-card">
            <h2 className="cta-heading">Ready to Track the Market Smarter?</h2>
            <p className="cta-text">
              Create your free CryptoTrack account and explore your cryptocurrency market dashboard.
            </p>
            <div className="cta-buttons">
              <Link to="/register" className="cta-btn-primary">
                <span>🚀 Create Account</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="cta-btn-secondary">
                <span>🔐 Login</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. FOOTER ─── */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand-column">
            <div className="footer-logo">
              <span className="footer-logo-emoji">🚀</span>
              <span className="footer-logo-text">CryptoTrack</span>
            </div>
            <p className="footer-tagline">
              Smart cryptocurrency market tracking and analysis.
            </p>
          </div>

          <div className="footer-nav-column">
            <div className="footer-nav-links">
              <Link to="/" className="footer-link">
                Home
              </Link>
              <button
                type="button"
                className="footer-link footer-btn-link"
                onClick={() => scrollToSection('features')}
              >
                Features
              </button>
              <Link to="/login" className="footer-link">
                Login
              </Link>
              <Link to="/register" className="footer-link">
                Create Account
              </Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p>© 2026 CryptoTrack. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
