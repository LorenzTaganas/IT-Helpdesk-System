import { useAuth } from '../../context/AuthContext';
import { Ticket, Package, Users, Clock } from 'lucide-react';

// Temporary dashboard — will be replaced with real data in Phase 2
const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="page-subtitle">
            Here's what's happening in your IT system today.
          </p>
        </div>
      </div>

      {/* Placeholder stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Open Tickets',    value: '—', icon: Ticket,  color: '#2563eb', bg: '#dbeafe' },
          { label: 'In Progress',     value: '—', icon: Clock,   color: '#f59e0b', bg: '#fef3c7' },
          { label: 'Total Assets',    value: '—', icon: Package, color: '#10b981', bg: '#d1fae5' },
          { label: 'Team Members',    value: '—', icon: Users,   color: '#7c3aed', bg: '#ede9fe' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium" style={{ color: '#64748b' }}>{card.label}</p>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: card.bg }}>
                  <Icon size={18} style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-3xl font-bold" style={{ color: '#0f172a' }}>{card.value}</p>
              <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                Dashboard data loads in Phase 2
              </p>
            </div>
          );
        })}
      </div>

      {/* Info banner */}
      <div className="card" style={{ border: '1px solid #bfdbfe', background: '#eff6ff' }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: '#2563eb' }}>
            <Ticket size={16} color="#fff" />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: '#1e40af' }}>
              Phase 1 Complete — Authentication Working!
            </p>
            <p className="text-sm mt-0.5" style={{ color: '#3b82f6' }}>
              You are logged in as <strong>{user?.firstName} {user?.lastName}</strong> ({user?.role}).
              Dashboard charts and real data will be connected in Phase 2.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
