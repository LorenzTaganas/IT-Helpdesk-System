import { useCallback, useEffect, useState } from 'react';
import { Search, ScrollText } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import auditService from '../../services/auditService';
import toast from 'react-hot-toast';

const ACTIONS = ['all', 'login', 'logout', 'create', 'update', 'assign', 'status_change', 'comment', 'deactivate'];
const ENTITIES = ['all', 'auth', 'ticket', 'asset', 'user', 'department'];

const formatLabel = (value) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const AuditLogsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const action = searchParams.get('action') || 'all';
  const entityType = searchParams.get('entityType') || 'all';
  const search = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(search);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await auditService.getLogs({ action, entityType, ...(search && { search }) });
      setLogs(data.logs || []);
      setPagination(data.pagination);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [action, entityType, search]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') next.delete(key); else next.set(key, value);
    setSearchParams(next);
  };

  const submitSearch = (event) => { event.preventDefault(); updateFilter('search', searchTerm.trim()); };

  return (
    <div className="space-y-6">
      <div className="page-header"><div><h1 className="page-title flex items-center gap-2.5"><ScrollText className="text-blue-600" size={26} /> Audit Logs</h1><p className="page-subtitle">Review administrative and operational changes across ITFlow.</p></div></div>
      <div className="card flex flex-col gap-3 md:flex-row">
        <form onSubmit={submitSearch} className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input className="form-input pl-9" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search activity or entity..." /></form>
        <select className="form-select md:w-44" value={action} onChange={(event) => updateFilter('action', event.target.value)}>{ACTIONS.map((item) => <option key={item} value={item}>{item === 'all' ? 'All Actions' : formatLabel(item)}</option>)}</select>
        <select className="form-select md:w-44" value={entityType} onChange={(event) => updateFilter('entityType', event.target.value)}>{ENTITIES.map((item) => <option key={item} value={item}>{item === 'all' ? 'All Entities' : formatLabel(item)}</option>)}</select>
      </div>
      <div className="card p-0 overflow-hidden">
        {loading ? <div className="p-12 text-center text-sm text-slate-500">Loading audit activity...</div> : logs.length === 0 ? <div className="p-12 text-center text-sm text-slate-500">No audit activity found.</div> : <div className="table-container"><table className="data-table audit-table"><thead><tr><th>Date</th><th>Actor</th><th>Action</th><th>Entity</th><th>Activity</th></tr></thead><tbody>{logs.map((log) => <tr key={log._id}><td className="whitespace-nowrap text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</td><td><strong className="block text-slate-800">{log.actor?.firstName} {log.actor?.lastName}</strong><small className="text-slate-400">{log.actor?.role?.replace('_', ' ')}</small></td><td><span className="badge badge-blue">{formatLabel(log.action)}</span></td><td><span className="font-mono text-xs text-slate-500">{log.entityLabel || formatLabel(log.entityType)}</span></td><td className="text-sm text-slate-700">{log.summary}</td></tr>)}</tbody></table></div>}
      </div>
      {pagination && pagination.total > 0 && <p className="text-right text-xs text-slate-400">Showing {logs.length} of {pagination.total} activities</p>}
    </div>
  );
};

export default AuditLogsPage;
