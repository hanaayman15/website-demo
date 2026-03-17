import { Link } from 'react-router-dom';

function Navbar({ links = [] }) {
  return (
    <nav className="app-navbar">
      {links.map((item) => (
        <Link key={item.path} to={item.path} className="app-nav-link">
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default Navbar;
