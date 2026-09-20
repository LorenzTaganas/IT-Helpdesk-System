import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import assetService from '../../services/assetService';
import {
  Archive,
  CheckCircle2,
  Laptop,
  Monitor,
  PackagePlus,
  Plus,
  Search,
  Settings,
  Smartphone,
  Wrench,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { id: 'all', label: 'All Statuses' },
  { id: 'available', label: 'Available' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'retired', label: 'Retired' },
];

const CATEGORY_OPTIONS = [
  { id: 'all', label: 'All Categories' },
  { id: 'laptop', label: 'Laptop' },
  { id: 'desktop', label: 'Desktop' },
  { id: 'monitor', label: 'Monitor' },
  { id: 'printer', label: 'Printer' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'network', label: 'Network' },
  { id: 'software', label: 'Software' },
  { id: 'other', label: 'Other' },
];

const STATUS_STYLES = {
  available: 'badge-green',
  assigned: 'badge-blue',
  maintenance: 'badge-yellow',
  retired: 'badge-gray',
};

const CATEGORY_ICONS = {
  laptop: Laptop,
  desktop: Laptop,
  monitor: Monitor,
  mobile: Smartphone,
  printer: Archive,
  network: Settings,
};

const AssetsPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [assets, setAssets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const status = searchParams.get('status') || 'all';
  const category = searchParams.get('category') || 'all';
  const search = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(search);
  const isStaff = ['it_support', 'it_admin', 'super_admin'].includes(user?.role);

  const loadAssets = useCallback(async () => {
    try {
      setLoading(true);
      const [assetData, statsData] = await Promise.all([
        assetService.getAssets({
          ...(status !== 'all' && { status }),
          ...(category !== 'all' && { category }),
          ...(search && { search }),
        }),
        assetService.getStats(),
      ]);
      setAssets(assetData.assets || []);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load assets', error);
      toast.error(error.response?.data?.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, [category, search, status]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    updateFilter('search', searchTerm.trim());
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      <div className="page-header flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2.5">
            <PackagePlus className="text-blue-600" size={26} />
            {isStaff ? 'Asset Inventory' : 'My Assets'}
          </h1>
          <p className="page-subtitle">
            {isStaff ? 'Track equipment, ownership, lifecycle, and service status.' : 'View equipment assigned to you.'}
          </p>
        </div>
        {isStaff && (
          <Link to="/assets/new" className="btn btn-primary self-start sm:self-auto">
            <Plus size={17} />
            Add Asset
          </Link>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Total', stats.total, PackagePlus, 'text-slate-700', 'all'],
            ['Available', stats.available, CheckCircle2, 'text-emerald-600', 'available'],
            ['Assigned', stats.assigned, Laptop, 'text-blue-600', 'assigned'],
            ['Maintenance', stats.maintenance, Wrench, 'text-amber-600', 'maintenance'],
          ].map(([label, value, Icon, color, filter]) => (
            <button
              key={label}
              type="button"
              onClick={() => updateFilter('status', filter)}
              className={`stat-card text-left transition hover:-translate-y-0.5 ${status === filter ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">{label}</span>
                <Icon size={18} className={color} />
              </div>
              <strong className="text-3xl text-slate-900">{value}</strong>
            </button>
          ))}
        </div>
      )}

      <div className="card space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <form onSubmit={submitSearch} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="form-input pl-9"
              placeholder="Search asset tag, name, model, or serial number..."
            />
          </form>
          <select value={status} onChange={(event) => updateFilter('status', event.target.value)} className="form-select md:w-44">
            {STATUS_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
          <select value={category} onChange={(event) => updateFilter('category', event.target.value)} className="form-select md:w-44">
            {CATEGORY_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
          {(status !== 'all' || category !== 'all' || search) && (
            <button type="button" onClick={clearFilters} className="btn btn-secondary btn-sm">Clear</button>
          )}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading assets...</div>
        ) : assets.length === 0 ? (
          <div className="p-12 text-center">
            <PackagePlus size={30} className="mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-800">No assets found</p>
            <p className="mt-1 text-sm text-slate-500">Try changing the filters or add your first asset.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table asset-table">
              <thead>
                <tr><th>Asset</th><th>Category</th><th>Status</th><th>Assigned To</th><th>Location</th><th>Updated</th></tr>
              </thead>
              <tbody>
                {assets.map((asset) => {
                  const Icon = CATEGORY_ICONS[asset.category] || PackagePlus;
                  return (
                    <tr key={asset._id}>
                      <td>
                        <Link to={`/assets/${asset.assetTag || asset._id}`} className="flex min-w-0 items-center gap-3">
                          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon size={16} /></span>
                          <span className="min-w-0"><strong className="block truncate text-slate-900">{asset.name}</strong><small className="font-mono text-slate-400">{asset.assetTag}</small></span>
                        </Link>
                      </td>
                      <td className="capitalize">{asset.category}</td>
                      <td><span className={`badge ${STATUS_STYLES[asset.status] || 'badge-gray'}`}>{asset.status}</span></td>
                      <td>{asset.assignedTo ? `${asset.assignedTo.firstName} ${asset.assignedTo.lastName}` : <span className="text-slate-400">Unassigned</span>}</td>
                      <td>{asset.location || <span className="text-slate-400">Not set</span>}</td>
                      <td className="whitespace-nowrap text-xs text-slate-500">{new Date(asset.updatedAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetsPage;
