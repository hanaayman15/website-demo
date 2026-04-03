import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ACCENT = '#6eabf2';

/**
 * Client portal nav bar matching the original client-home.html nav.
 * activePath: currently active link path
 * isLoggedIn: whether session exists (shows Logout vs Log In button)
 */
function ClientPortalNav({ activePath = '', isLoggedIn = false }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileName = String(localStorage.getItem('clientFullName') || '').trim();
  const initials = profileName
    ? profileName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    : 'AM';

  const logout = () => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('authRole');
    sessionStorage.removeItem('role');
    navigate('/client-login');
  };

  const links = [
    { to: '/client-home', label: 'Home' },
    { to: '/client-dashboard', label: 'Nutrition' },
    { to: '/mental-coaching', label: 'Mental Coaching' },
    { to: '/anti-doping', label: 'Anti-Doping' },
    { to: '/progress', label: 'Progress' },
    { to: '/settings', label: 'Settings' },
  ];

  const isActive = (to) => activePath === to;

  return (
    <nav className="bg-white shadow-sm py-4 sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-900 transition p-2 hover:bg-gray-100 rounded-lg"
            >
              ← Back
            </button>
            <Link to="/client-main" className="text-xl font-bold" style={{ color: ACCENT, textDecoration: 'none' }}>
              My Nutrition Portal
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {/* Desktop links */}
            <div className="hidden md:flex items-center space-x-6">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={isActive(link.to) ? 'font-semibold border-b-2' : 'text-black hover:text-gray-600'}
                  style={isActive(link.to) ? { color: ACCENT, borderColor: ACCENT } : {}}
                >
                  {link.label}
                </Link>
              ))}
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold" style={{ backgroundColor: ACCENT }}>{initials}</div>
                  <button type="button" className="text-sm text-gray-600 hover:text-gray-900" onClick={logout}>Logout</button>
                </div>
              ) : (
                <Link to="/client-login" className="text-white px-4 py-2 rounded-lg hover:opacity-90" style={{ backgroundColor: ACCENT }}>Log In</Link>
              )}
            </div>
            {/* Hamburger */}
            <button
              className="md:hidden flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 text-gray-700"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden flex-col gap-2 pt-3 pb-1 border-t border-gray-100 mt-3 flex">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="py-2"
                style={isActive(link.to) ? { color: ACCENT, fontWeight: 600 } : { color: '#374151' }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/client-login" className="py-2 text-center text-white rounded-lg px-4" style={{ backgroundColor: ACCENT }} onClick={() => setMobileOpen(false)}>
              {isLoggedIn ? 'Logout' : 'Log In'}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default ClientPortalNav;
