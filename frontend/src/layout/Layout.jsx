import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { 
  Home,
  LayoutDashboard, 
  BarChart2, 
  Activity, 
  Clock, 
  Bell, 
  MapPin, 
  ShieldCheck, 
  Settings, 
  RefreshCw, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Database,
  Radio,
  ChevronRight
} from 'lucide-react';
import './Layout.css';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Home, end: true },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/stream', label: 'Live Stream', icon: Activity },
  { path: '/historical', label: 'Historical Data', icon: Clock },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/map', label: 'Weather Map', icon: MapPin },
  { path: '/quality', label: 'Data Quality', icon: ShieldCheck },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const Layout = ({ onRefresh, toggleTheme, theme }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    setLastRefreshed(new Date());
    if (onRefresh) onRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className={`wp-app-shell ${theme === 'light' ? 'light-theme' : 'dark-theme'}`}>
      {/* Realistic Atmospheric Static Photographic Background (No video on internal pages) */}
      <div className="wp-internal-bg-media" aria-hidden="true">
        <img 
          src="/alpine-peaks.jpg" 
          alt="Atmospheric Alpine Weather Scenery" 
          className="wp-internal-bg-photo" 
        />
        <div className="wp-internal-photo-overlay"></div>
      </div>

      {/* Top Floating Glass Navigation Bar (No Left Sidebar) */}
      <header className={`wp-app-topbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="wp-topbar-inner">
          {/* Brand Logo & Title */}
          <Link to="/" className="wp-app-brand">
            <div className="wp-app-brand-icon">
              <Database size={18} />
            </div>
            <div className="wp-app-brand-info">
              <span className="wp-app-brand-name">WeatherPulse</span>
              <span className="wp-app-brand-tag">Big Data Climate Engine</span>
            </div>
          </Link>

          {/* Liquid Glass Subtle Brand Divider */}
          <div className="wp-brand-divider" aria-hidden="true"></div>

          {/* Horizontal Desktop Navigation Links */}
          <nav className="wp-app-nav-row" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) => 
                    `wp-app-nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon size={15} className="wp-nav-icon" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Header Action Controls */}
          <div className="wp-app-actions-row">
            {/* Real-Time Live Stream Pill */}
            <Link to="/stream" className="wp-app-live-pill" title="Live Streaming from Kafka topic 'weather_stream'">
              <span className="wp-pulse-dot"></span>
              <span className="wp-live-label">LIVE</span>
            </Link>

            {/* Refresh Action */}
            <button 
              className="wp-app-action-btn" 
              onClick={handleRefreshClick} 
              title={`Last refreshed at ${lastRefreshed.toLocaleTimeString()}`}
              aria-label="Refresh telemetry"
            >
              <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
            </button>

            {/* Liquid Glass Pill Theme Toggle (Sun / Moon) */}
            <button 
              className={`wp-app-theme-pill ${theme === 'dark' ? 'is-dark' : 'is-light'}`} 
              onClick={toggleTheme} 
              title={theme === 'dark' ? "Switch to Light mode" : "Switch to Dark mode"}
              aria-label="Toggle theme"
            >
              <span className="theme-icon sun"><Sun size={12} /></span>
              <span className="theme-icon moon"><Moon size={12} /></span>
              <span className="theme-toggle-knob"></span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button 
              className="wp-app-mobile-toggle" 
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Responsive Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="wp-mobile-nav-panel fade-in">
            <div className="wp-mobile-nav-list">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) => 
                      `wp-mobile-nav-item ${isActive ? 'active' : ''}`
                    }
                  >
                    <div className="mobile-item-left">
                      <Icon size={18} className="mobile-item-icon" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight size={14} className="mobile-item-arrow" />
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Viewport Workspace - Double-Layer Liquid Glass Architecture */}
      <main className="wp-main-stage">
        <div className="wp-stage-container">
          <div className="wp-outer-glass-canvas">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div className="wp-mobile-backdrop" onClick={() => setMobileOpen(false)}></div>
      )}
    </div>
  );
};

export default Layout;
