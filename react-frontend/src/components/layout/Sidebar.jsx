import { Link } from 'react-router-dom';

function Sidebar({ links = [] }) {
  return (
    <aside className="app-sidebar">
      {links.map((item) => (
        <Link key={item.path} to={item.path} className="app-sidebar-link">
          {item.label}
        </Link>
      ))}
    </aside>
  );
}

export default Sidebar;
