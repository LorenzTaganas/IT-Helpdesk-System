import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/supporthub.png';
import {
  Monitor, LayoutDashboard, Ticket, Plus, Package,
  Users, Building2, BarChart3, ScrollText, Settings,
  UserCircle, LogOut, ChevronRight, Cpu
} from 'lucide-react';

// Navigation items per role
const getNavItems = (role) => {
  // Shared: profile always at bottom
  const profile = { label: 'Profile', path: '/profile', icon: UserCircle };

  if (role === 'employee') {
    return [
      { label: 'Dashboard',      path: '/dashboard',        icon: LayoutDashboard },
      { label: 'My Tickets',     path: '/tickets',          icon: Ticket },
      { label: 'Create Ticket',  path: '/tickets/new',      icon: Plus },
      { label: 'My Assets',      path: '/assets',           icon: Package },
      { divider: true },
      profile,
    ];
  }

  if (role === 'it_support') {
    return [
      { label: 'Dashboard',         path: '/dashboard',           icon: LayoutDashboard },
      { section: 'Tickets' },
      { label: 'All Tickets',       path: '/tickets',             icon: Ticket },
      { label: 'My Assigned',       path: '/tickets/assigned',    icon: Ticket },
      { section: 'Resources' },
      { label: 'Assets',            path: '/assets',              icon: Package },
      { label: 'Employees',         path: '/employees',           icon: Users },
      { section: 'Other' },
      { label: 'Reports',           path: '/reports',             icon: BarChart3 },
      { divider: true },
      profile,
    ];
  }

  if (role === 'it_admin' || role === 'super_admin') {
    return [
      { label: 'Dashboard',         path: '/dashboard',           icon: LayoutDashboard },
      { section: 'Helpdesk' },
      { label: 'Tickets',           path: '/tickets',             icon: Ticket },
      { section: 'Management' },
      { label: 'Assets',            path: '/assets',              icon: Package },
      { label: 'Employees',         path: '/employees',           icon: Users },
      { label: 'Departments',       path: '/departments',         icon: Building2 },
      { section: 'System' },
      { label: 'Reports',           path: '/reports',             icon: BarChart3 },
      { label: 'Audit Logs',        path: '/audit-logs',          icon: ScrollText },
      { label: 'Settings',          path: '/settings',            icon: Settings },
      { divider: true },
      profile,
    ];
  }

  return [profile];
};

// Avatar color based on name
const getAvatarColor = (name) => {
  const colors = ['#2563eb','#7c3aed','#db2777','#059669','#d97706','#dc2626','#0891b2'];
  const index = (name?.charCodeAt(0) || 0) % colors.length;
  return colors[index];
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = getNavItems(user?.role);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : '?';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="SupportHub" className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" />
          <div>
            <p className="text-white font-bold text-sm leading-none">SupportHub</p>
            <p className="text-slate-500 text-xs mt-0.5">Helpdesk System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item, idx) => {
          if (item.divider) {
            return <hr key={idx} className="border-slate-800 my-2" />;
          }
          if (item.section) {
            return (
              <p key={idx} className="sidebar-section-label">{item.section}</p>
            );
          }
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User info + Logout at bottom */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg mb-1"
          style={{ background: '#1e293b' }}>
          <div
            className="avatar avatar-sm flex-shrink-0"
            style={{ background: getAvatarColor(user?.firstName) }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full mt-1"
          style={{ color: '#ef4444' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
