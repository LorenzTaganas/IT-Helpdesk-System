import { useEffect, useState } from 'react';
import { Building2, Edit3, Plus, Save, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import departmentService from '../../services/departmentService';
import userService from '../../services/userService';
import toast from 'react-hot-toast';

const EMPTY = { name: '', description: '', head: '', isActive: true };

const DepartmentsPage = () => {
  const { user } = useAuth();
  const canManage = ['it_admin', 'super_admin'].includes(user?.role);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setLoading(true); const data = await departmentService.getDepartments(); setDepartments(data.departments || []); } catch (error) { toast.error(error.response?.data?.message || 'Failed to load departments'); } finally { setLoading(false); } };
  useEffect(() => { load(); if (canManage) userService.getUsers().then((data) => setUsers(data.users || [])).catch(() => {}); }, [canManage]);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const edit = (department) => { setEditingId(department._id); setForm({ name: department.name, description: department.description || '', head: department.head?._id || '', isActive: department.isActive }); };
  const cancel = () => { setEditingId(null); setForm(EMPTY); };
  const save = async (event) => { event.preventDefault(); if (!form.name.trim()) return toast.error('Department name is required'); try { const payload = { ...form, head: form.head || null }; if (editingId) await departmentService.updateDepartment(editingId, payload); else await departmentService.createDepartment(payload); toast.success(editingId ? 'Department updated' : 'Department created'); cancel(); load(); } catch (error) { toast.error(error.response?.data?.message || 'Failed to save department'); } };
  const SubmitIcon = editingId ? Save : Plus;
  return <div className="space-y-6"><div className="page-header"><div><h1 className="page-title flex items-center gap-2.5"><Building2 className="text-blue-600" size={26} /> Departments</h1><p className="page-subtitle">Organize employees and assign department ownership.</p></div></div>{canManage && <form onSubmit={save} className="card grid grid-cols-1 gap-3 md:grid-cols-[1fr_1.5fr_220px_auto]"><input className="form-input" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Department name" /><input className="form-input" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Description" /><select className="form-select" value={form.head} onChange={(e) => update('head', e.target.value)}><option value="">No department head</option>{users.map((item) => <option key={item._id} value={item._id}>{item.firstName} {item.lastName}</option>)}</select><div className="flex gap-2"><button className="btn btn-primary"><SubmitIcon size={16} />{editingId ? 'Save' : 'Add'}</button>{editingId && <button type="button" onClick={cancel} className="btn btn-secondary"><X size={16} /></button>}</div></form>}{loading ? <div className="card p-12 text-center text-sm text-slate-500">Loading departments...</div> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{departments.map((department) => <div key={department._id} className="card space-y-4"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Building2 size={20} /></span><div><h2 className="font-bold text-slate-900">{department.name}</h2><p className="text-xs text-slate-500">{department.employeeCount} employees</p></div></div>{canManage && <button type="button" onClick={() => edit(department)} title="Edit department" className="btn btn-secondary btn-sm"><Edit3 size={14} /></button>}</div><p className="text-sm text-slate-600">{department.description || 'No description provided.'}</p><div className="border-t border-slate-100 pt-3 text-xs text-slate-500">Head: <strong className="text-slate-700">{department.head ? `${department.head.firstName} ${department.head.lastName}` : 'Not assigned'}</strong></div></div>)}</div>}</div>;
};

export default DepartmentsPage;
