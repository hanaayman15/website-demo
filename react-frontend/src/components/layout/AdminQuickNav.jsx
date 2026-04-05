import { Link, useNavigate } from 'react-router-dom';
import { resolveAuthRole } from '../../utils/authSession';

const ADMIN_NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/clients', label: 'Clients' },
  { to: '/add-client', label: 'Add Client' },
  { to: '/add-team', label: 'Add Team' },
  { to: '/pdf-generator', label: 'PDF Generator' },
  { to: '/diet-management', label: 'Diet Management' },
];

const DOCTOR_NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/clients', label: 'Teams' },
  { to: '/add-team', label: 'Add Team' },
  { to: '/pdf-generator', label: 'PDF Generator' },
];

function AdminQuickNav({ activePath = '', title = '', className = '' }) {
  const navigate = useNavigate();
  const role = String(resolveAuthRole() || '').toLowerCase();
  const navLinks = role === 'doctor' ? DOCTOR_NAV_LINKS : ADMIN_NAV_LINKS;

  return (
    <section
      className={`react-panel ${className}`.trim()}
      style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: '0.75rem' }}
    >
      <div className="react-inline-actions">
        <button className="react-btn react-btn-ghost" type="button" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <div style={{ textAlign: 'center', fontWeight: 800, color: '#20374f', fontSize: '18px' }}>
        {title}
      </div>

      <div className="react-inline-actions" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {navLinks.map((link) => (
          <Link
            key={link.to}
            className={activePath === link.to ? 'react-btn' : 'react-btn react-btn-ghost'}
            to={link.to}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default AdminQuickNav;
