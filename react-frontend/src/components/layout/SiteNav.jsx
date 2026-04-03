import { Link, useNavigate } from 'react-router-dom';

const ACCENT = '#6eabf2';

/**
 * Standard marketing site nav bar matching the original HTML pages.
 * activePath: currently active link path (gets underline highlight)
 */
function SiteNav({ activePath = '' }) {
  const navigate = useNavigate();

  const links = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/features', label: 'Features' },
    { to: '/resources', label: 'Our Clinic' },
    { to: '/success-stories', label: 'Success Stories' },
    { to: '/contact', label: 'Contact Us' },
  ];

  return (
    <nav className="bg-white shadow-sm py-4">
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 transition p-2 hover:bg-gray-100 rounded-lg"
          >
            ← Back
          </button>
          <Link to="/" className="text-2xl font-bold" style={{ color: ACCENT, textDecoration: 'none' }}>
            Client Nutrition Management
          </Link>
        </div>
        <div className="space-x-6 hidden md:block">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={activePath === link.to ? 'font-semibold border-b-2' : 'text-black'}
              style={activePath === link.to ? { color: ACCENT, borderColor: ACCENT } : {}}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/add-client"
            className="text-white px-4 py-2 rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default SiteNav;
