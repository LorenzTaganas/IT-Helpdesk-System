import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import toast from 'react-hot-toast';

const EmployeesPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || 'all';
  const status = searchParams.get('status') || 'all';
  const [searchTerm, setSearchTerm] = useState(search);
  const canManage = ['it_admin', 'super_admin'].includes(user?.role);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers({ ...(search && { search }), ...(role !== 'all' && { role }), ...(status !== 'all' && { status }) });
      setUsers(data.users || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [role, search, status]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') next.delete(key); else next.set(key, value);
    setSearchParams(next);
  };

  const submitSearch = (event) => { event.preventDefault(); updateFilter('search', searchTerm.trim()); };

  return (
    <div className="space-y-6">
      <div className="page-header flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="page-title flex items-center gap-2.5"><Users className="text-blue-600" size={26} /> Employees</h1><p className="page-subtitle">Browse employees, roles, departments, and account status.</p></div>
        {canManage && <Link to="/employees/new" className="btn btn-primary self-start sm:self-auto"><UserPlus size={17} /> Add Employee</Link>}
      </div>
      <div className="card flex flex-col gap-3 md:flex-row">
        <form onSubmit={submitSearch} className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input pl-9" placeholder="Search name, email, or employee ID..." /></form>
        <select className="form-select md:w-40" value={role} onChange={(e) => updateFilter('role', e.target.value)}><option value="all">All Roles</option><option value="employee">Employee</option><option value="it_support">IT Support</option><option value="it_admin">IT Admin</option><option value="super_admin">Super Admin</option></select>
        <select className="form-select md:w-36" value={status} onChange={(e) => updateFilter('status', e.target.value)}><option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
      </div>
      <div className="card p-0 overflow-hidden">
        {loading ? <div className="p-12 text-center text-sm text-slate-500">Loading employees...</div> : users.length === 0 ? <div className="p-12 text-center text-sm text-slate-500">No employees found.</div> : (
          <div className="table-container"><table className="data-table employee-table"><thead><tr><th>Employee</th><th>Role</th><th>Department</th><th>Position</th><th>Status</th><th>Last Login</th></tr></thead><tbody>
            {users.map((item) => <tr key={item._id}><td><Link to={`/employees/${item._id}`} className="flex items-center gap-3"><span className="avatar avatar-sm bg-blue-600">{item.firstName?.[0]}{item.lastName?.[0]}</span><span><strong className="block text-slate-900">{item.firstName} {item.lastName}</strong><small className="text-slate-400">{item.employeeId} · {item.email}</small></span></Link></td><td><span className="badge badge-blue">{item.role.replace('_', ' ')}</span></td><td>{item.department?.name || <span className="text-slate-400">Not set</span>}</td><td>{item.position || <span className="text-slate-400">Not set</span>}</td><td><span className={`badge ${item.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{item.status}</span></td><td className="whitespace-nowrap text-xs text-slate-500">{item.lastLogin ? new Date(item.lastLogin).toLocaleDateString() : 'Never'}</td></tr>)}
          </tbody></table></div>
        )}
      </div>
    </div>
  );
};

export default EmployeesPage;
