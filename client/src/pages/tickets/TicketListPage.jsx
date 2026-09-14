import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ticketService from '../../services/ticketService';
import {
  Ticket as TicketIcon,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  MessageSquare,
  User,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'pending_user', label: 'Pending User' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'closed', label: 'Closed' },
];

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'software', label: 'Software' },
  { id: 'network', label: 'Network' },
  { id: 'access', label: 'Access & Accounts' },
  { id: 'email', label: 'Email' },
  { id: 'other', label: 'Other' },
];

const PRIORITIES = [
  { id: 'all', label: 'All Priorities' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];

// Priority badge style
const getPriorityBadge = (priority) => {
  switch (priority) {
    case 'critical':
      return (
        <span className="badge badge-red font-semibold flex items-center gap-1">
          <Flame size={12} className="text-red-500 animate-pulse" />
          Critical
        </span>
      );
    case 'high':
      return (
        <span className="badge badge-yellow font-medium flex items-center gap-1">
          <AlertTriangle size={12} />
          High
        </span>
      );
    case 'medium':
      return (
        <span className="badge badge-blue font-medium">Medium</span>
      );
    case 'low':
      return (
        <span className="badge badge-gray font-medium">Low</span>
      );
    default:
      return <span className="badge badge-gray">{priority}</span>;
  }
};

// Status badge style
const getStatusBadge = (status) => {
  switch (status) {
    case 'open':
      return <span className="badge badge-blue">Open</span>;
    case 'in_progress':
      return <span className="badge badge-yellow">In Progress</span>;
    case 'pending_user':
      return <span className="badge badge-purple">Pending User</span>;
    case 'resolved':
      return <span className="badge badge-green">Resolved</span>;
    case 'closed':
      return <span className="badge badge-gray">Closed</span>;
    default:
      return <span className="badge badge-gray">{status}</span>;
  }
};

const TicketListPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters from URL or default
  const statusFilter = searchParams.get('status') || 'all';
  const categoryFilter = searchParams.get('category') || 'all';
  const priorityFilter = searchParams.get('priority') || 'all';
  const assignedToFilter = searchParams.get('assignedTo') || '';
  const searchInput = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(searchInput);

  const isStaff = user?.role !== 'employee';

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (assignedToFilter) params.assignedTo = assignedToFilter;
      if (searchInput) params.search = searchInput;

      const [data, statsData] = await Promise.all([
        ticketService.getTickets(params),
        ticketService.getStats(),
      ]);

      setTickets(data.tickets || []);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load tickets', err);
      toast.error('Failed to load tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, priorityFilter, assignedToFilter, searchInput]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilter('search', searchTerm.trim());
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSearchParams({});
  };

  const hasActiveFilters =
    statusFilter !== 'all' ||
    categoryFilter !== 'all' ||
    priorityFilter !== 'all' ||
    assignedToFilter ||
    searchInput;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2.5">
            <TicketIcon className="text-blue-600" size={26} />
            {isStaff ? 'Ticket Queue' : 'My Support Tickets'}
          </h1>
          <p className="page-subtitle">
            {isStaff
              ? 'Triage, assign, and manage employee technical support requests.'
              : 'View and track the resolution of your submitted IT requests.'}
          </p>
        </div>

        <Link to="/tickets/new" className="btn btn-primary self-start sm:self-auto shadow-sm">
          <Plus size={18} />
          <span>Create New Ticket</span>
        </Link>
      </div>

      {/* Quick Stats Chips (Top) */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => updateFilter('status', 'open')}
            className={`card p-3.5 cursor-pointer hover:border-blue-400 transition-all ${
              statusFilter === 'open' ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
            }`}
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.open}</p>
          </div>

          <div
            onClick={() => updateFilter('status', 'in_progress')}
            className={`card p-3.5 cursor-pointer hover:border-amber-400 transition-all ${
              statusFilter === 'in_progress' ? 'ring-2 ring-amber-500 bg-amber-50/50' : ''
            }`}
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Progress</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.inProgress}</p>
          </div>

          <div
            onClick={() => updateFilter('priority', 'critical')}
            className={`card p-3.5 cursor-pointer hover:border-red-400 transition-all ${
              priorityFilter === 'critical' ? 'ring-2 ring-red-500 bg-red-50/50' : ''
            }`}
          >
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider flex items-center gap-1">
              <Flame size={12} /> High / Critical
            </p>
            <p className="text-2xl font-bold text-red-700 mt-1">{stats.highOrCritical}</p>
          </div>

          <div
            onClick={() => updateFilter('status', 'resolved')}
            className={`card p-3.5 cursor-pointer hover:border-emerald-400 transition-all ${
              statusFilter === 'resolved' ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''
            }`}
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.resolved}</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 pb-2">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => updateFilter('status', tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}

          {isStaff && (
            <button
              onClick={() =>
                updateFilter('assignedTo', assignedToFilter === 'me' ? '' : 'me')
              }
              className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                assignedToFilter === 'me'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-700 bg-purple-50 hover:bg-purple-100'
              }`}
            >
              <User size={13} />
              Assigned to Me
            </button>
          )}
        </div>

        {/* Search & Dropdown Filters */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by Ticket ID (e.g. TICK-0001) or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-9 text-sm"
            />
          </form>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="form-select text-xs flex-1 md:w-44"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => updateFilter('priority', e.target.value)}
              className="form-select text-xs flex-1 md:w-40"
            >
              {PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                title="Reset Filters"
                className="btn btn-secondary btn-sm text-slate-600 hover:text-slate-900"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ticket List Table */}
      <div className="card p-0 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-3" />
            <p>Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <TicketIcon size={24} />
            </div>
            <p className="font-semibold text-slate-800 text-base">No tickets found</p>
            <p className="text-sm text-slate-500 mt-1">
              {hasActiveFilters
                ? 'Try adjusting your search or active filters.'
                : "You haven't filed any support tickets yet."}
            </p>
            {hasActiveFilters ? (
              <button onClick={clearAllFilters} className="btn btn-secondary btn-sm mt-4">
                Clear Filters
              </button>
            ) : (
              <Link to="/tickets/new" className="btn btn-primary btn-sm mt-4">
                <Plus size={16} />
                Create First Ticket
              </Link>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>ID</th>
                  <th>Title & Category</th>
                  <th style={{ width: '110px' }}>Priority</th>
                  <th style={{ width: '130px' }}>Status</th>
                  <th>Requester</th>
                  <th>Assignee</th>
                  <th style={{ width: '120px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <Link
                        to={`/tickets/${ticket.ticketId || ticket._id}`}
                        className="font-mono text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {ticket.ticketId}
                      </Link>
                    </td>

                    <td>
                      <Link
                        to={`/tickets/${ticket.ticketId || ticket._id}`}
                        className="block group"
                      >
                        <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {ticket.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded">
                            {ticket.category}
                          </span>
                          {ticket.comments?.length > 0 && (
                            <span className="text-xs text-slate-400 flex items-center gap-0.5">
                              <MessageSquare size={11} />
                              {ticket.comments.length}
                            </span>
                          )}
                        </div>
                      </Link>
                    </td>

                    <td>{getPriorityBadge(ticket.priority)}</td>

                    <td>{getStatusBadge(ticket.status)}</td>

                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                          {ticket.createdBy?.firstName?.[0] || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-800 truncate">
                            {ticket.createdBy?.firstName} {ticket.createdBy?.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {ticket.department?.name || 'Staff'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td>
                      {ticket.assignedTo ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                            {ticket.assignedTo.firstName?.[0]}
                          </div>
                          <span className="text-xs text-slate-700 font-medium truncate">
                            {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {new Date(ticket.createdAt).toLocaleDateString(undefined, {
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

export default TicketListPage;
