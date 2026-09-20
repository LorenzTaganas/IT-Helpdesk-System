import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ticketService from '../../services/ticketService';
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Plus,
  ArrowRight,
  TrendingUp,
  User,
  Shield,
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const isStaff = user?.role !== 'employee';

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, ticketsData] = await Promise.all([
          ticketService.getStats(),
          ticketService.getTickets({ limit: 5 }),
        ]);
        setStats(statsData);
        setRecentTickets(ticketsData.tickets || []);
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const statCards = [
    {
      label: isStaff ? 'Open Tickets' : 'My Open Tickets',
      value: stats ? stats.open : '—',
      icon: Ticket,
      color: '#2563eb',
      bg: '#dbeafe',
      filterPath: '/tickets?status=open',
    },
    {
      label: isStaff ? 'In Progress' : 'Being Handled',
      value: stats ? stats.inProgress : '—',
      icon: Clock,
      color: '#f59e0b',
      bg: '#fef3c7',
      filterPath: '/tickets?status=in_progress',
    },
    {
      label: 'High / Critical',
      value: stats ? stats.highOrCritical : '—',
      icon: Flame,
      color: '#ef4444',
      bg: '#fee2e2',
      filterPath: '/tickets?priority=critical',
    },
    {
      label: 'Resolved / Closed',
      value: stats ? (stats.resolved + stats.closed) : '—',
      icon: CheckCircle2,
      color: '#10b981',
      bg: '#d1fae5',
      filterPath: '/tickets?status=resolved',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="page-subtitle">
            {isStaff
              ? 'Here is the real-time overview of IT helpdesk activity and triage queue.'
              : 'Track the progress of your technical requests and service inquiries.'}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Link to="/tickets/new" className="btn btn-primary shadow-sm">
            <Plus size={16} />
            <span>Create Ticket</span>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.filterPath}
              className="stat-card block group transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-500 group-hover:text-slate-900 transition-colors">
                  {card.label}
                </p>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: card.bg }}
                >
                  <Icon size={18} style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{card.value}</p>
              <p className="text-xs mt-2 text-slate-400 flex items-center gap-1">
                <span>Click to view in queue</span>
                <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </Link>
          );
        })}
      </div>

      {/* Recent Tickets Table Section */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isStaff ? 'Recent System Tickets' : 'Your Recent Tickets'}
            </h2>
            <p className="text-xs text-slate-500">
              Latest support requests filed in the system.
            </p>
          </div>
          <Link
            to="/tickets"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All Tickets</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mb-2" />
            <p>Loading recent activity...</p>
          </div>
        ) : recentTickets.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            <Ticket size={28} className="mx-auto mb-2 opacity-50" />
            <p>No recent tickets found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table dashboard-table">
              <thead>
                <tr>
                  <th style={{ width: '110px' }}>ID</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Requester</th>
                  <th style={{ width: '110px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <Link
                        to={`/tickets/${t.ticketId || t._id}`}
                        className="font-mono text-xs font-bold text-blue-600 hover:underline"
                      >
                        {t.ticketId}
                      </Link>
                    </td>
                    <td>
                      <Link
                        to={`/tickets/${t.ticketId || t._id}`}
                        className="font-medium text-slate-800 hover:text-blue-600 line-clamp-1"
                      >
                        {t.title}
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`badge text-[11px] font-semibold ${
                          t.priority === 'critical'
                            ? 'badge-red'
                            : t.priority === 'high'
                            ? 'badge-yellow'
                            : t.priority === 'medium'
                            ? 'badge-blue'
                            : 'badge-gray'
                        }`}
                      >
                        {t.priority.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge text-[11px] font-medium ${
                          t.status === 'open'
                            ? 'badge-blue'
                            : t.status === 'in_progress'
                            ? 'badge-yellow'
                            : t.status === 'pending_user'
                            ? 'badge-purple'
                            : t.status === 'resolved'
                            ? 'badge-green'
                            : 'badge-gray'
                        }`}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-700">
                        {t.createdBy?.firstName} {t.createdBy?.lastName}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
