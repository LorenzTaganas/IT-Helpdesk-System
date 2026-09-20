import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import departmentService from '../../services/departmentService';
import toast from 'react-hot-toast';

const EMPTY = { firstName: '', lastName: '', email: '', password: '', role: 'employee', status: 'active', department: '', position: '' };
const ROLES = ['employee', 'it_support', 'it_admin', 'super_admin'];

const EmployeeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = id === 'new';
  const canManage = ['it_admin', 'super_admin'].includes(user?.role);
  const [form, setForm] = useState(EMPTY);
  const [employee, setEmployee] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    departmentService.getDepartments().then((data) => setDepartments(data.departments || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) return;
    userService.getUserById(id).then((data) => { setEmployee(data); setForm({ firstName: data.firstName || '', lastName: data.lastName || '', email: data.email || '', password: '', role: data.role || 'employee', status: data.status || 'active', department: data.department?._id || '', position: data.position || '' }); }).catch((error) => { toast.error(error.response?.data?.message || 'Employee not found'); navigate('/employees'); }).finally(() => setLoading(false));
  }, [id, isNew, navigate]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const save = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || (isNew && !form.password)) { toast.error('Complete all required fields'); return; }
    try {
      setSaving(true);
      const payload = { ...form, department: form.department || null };
      if (!payload.password) delete payload.password;
      const response = isNew ? await userService.createUser(payload) : await userService.updateUser(id, payload);
      toast.success(isNew ? 'Employee created' : 'Employee updated');
      navigate(`/employees/${response.user._id}`, { replace: true });
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to save employee'); } finally { setSaving(false); }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading employee...</div>;
  if (!canManage && isNew) { navigate('/employees', { replace: true }); return null; }

  return <div className="mx-auto max-w-4xl space-y-6"><Link to="/employees" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"><ArrowLeft size={16} /> Back to Employees</Link><div className="page-header"><div><h1 className="page-title flex items-center gap-2.5"><UserRound className="text-blue-600" size={26} />{isNew ? 'Add Employee' : `${employee.firstName} ${employee.lastName}`}</h1><p className="page-subtitle">{isNew ? 'Create a new system account.' : `${employee.employeeId} · ${employee.email}`}</p></div></div>
    {canManage ? <form onSubmit={save} className="space-y-6"><div className="card grid grid-cols-1 gap-4 md:grid-cols-2"><div><label className="form-label">First Name *</label><input className="form-input" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} /></div><div><label className="form-label">Last Name *</label><input className="form-input" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} /></div><div><label className="form-label">Email *</label><input type="email" className="form-input" value={form.email} onChange={(e) => update('email', e.target.value)} /></div><div><label className="form-label">Password {isNew ? '*' : '(leave blank to keep)'}</label><input type="password" className="form-input" value={form.password} onChange={(e) => update('password', e.target.value)} /></div><div><label className="form-label">Role</label><select className="form-select" value={form.role} onChange={(e) => update('role', e.target.value)}>{ROLES.map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}</select></div><div><label className="form-label">Status</label><select className="form-select" value={form.status} onChange={(e) => update('status', e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></div><div><label className="form-label">Department</label><select className="form-select" value={form.department} onChange={(e) => update('department', e.target.value)}><option value="">Not assigned</option>{departments.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></div><div><label className="form-label">Position</label><input className="form-input" value={form.position} onChange={(e) => update('position', e.target.value)} /></div></div><div className="flex justify-end gap-3"><Link to="/employees" className="btn btn-secondary">Cancel</Link><button disabled={saving} className="btn btn-primary"><Save size={16} />{saving ? 'Saving...' : 'Save Employee'}</button></div></form> : <div className="card grid grid-cols-1 gap-5 sm:grid-cols-2"><Info label="Role" value={employee.role.replace('_', ' ')} /><Info label="Status" value={employee.status} /><Info label="Department" value={employee.department?.name} /><Info label="Position" value={employee.position} /><Info label="Tickets Submitted" value={employee.ticketCount} /><Info label="Assets Assigned" value={employee.assetCount} /></div>}</div>;
};

const Info = ({ label, value }) => <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-medium capitalize text-slate-800">{value || 'Not set'}</p></div>;
export default EmployeeDetailPage;
