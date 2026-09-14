import { Bell, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Role label display map
const ROLE_LABELS = {
  employee:    'Employee',
  it_support:  'IT Support',
  it_admin:    'IT Admin',
  super_admin: 'Super Admin',
};

const ROLE_BADGE_COLORS = {
  employee:    { bg: '#e0f2fe', text: '#075985' },
  it_support:  { bg: '#ede9fe', text: '#4c1d95' },
  it_admin:    { bg: '#dbeafe', text: '#1e40af' },
  super_admin: { bg: '#fce7f3', text: '#831843' },
};

const Topbar = ({ onMobileMenuToggle, pageTitle }) => {
  const { user } = useAuth();
  const roleBadge = ROLE_BADGE_COLORS[user?.role] || {};

  return (
    <header className="topbar">
      {/* Mobile menu toggle */}
      <button
        className="lg:hidden mr-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        onClick={onMobileMenuToggle}
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1">
        {pageTitle && (
          <h2 className="font-semibold text-sm" style={{ color: '#0f172a' }}>
            {pageTitle}
          </h2>
        )}
      </div>

      {/* Right side: notifications + user */}
      <div className="flex items-center gap-3">
        {/* Notification bell — placeholder for Phase 7 */}
        <button
          id="notifications-btn"
          className="relative p-2 rounded-lg transition-colors"
          style={{ color: '#64748b' }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          title="Notifications (coming soon)"
        >
          <Bell size={18} />
          {/* Unread indicator dot */}
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: '#ef4444' }}
          />
        </button>

        {/* User info + role badge */}
        <div className="flex items-center gap-2 pl-3 border-l"
          style={{ borderColor: '#e2e8f0' }}>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium" style={{ color: '#0f172a' }}>
              {user?.firstName} {user?.lastName}
            </p>
          </div>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: roleBadge.bg, color: roleBadge.text }}
          >
            {ROLE_LABELS[user?.role] || user?.role}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
