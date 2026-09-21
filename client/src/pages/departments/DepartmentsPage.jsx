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
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const data = await departmentService.getDepartments();
      setDepartments(data.departments || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (canManage) userService.getUsers().then((data) => setUsers(data.users || [])).catch(() => {});
  }, [canManage]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (department) => {
    setEditingId(department._id);
    setForm({ name: department.name, description: department.description || '', head: department.head?._id || '', isActive: department.isActive });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY);
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return toast.error('Department name is required');
    try {
      const payload = { ...form, head: form.head || null };
      if (editingId) await departmentService.updateDepartment(editingId, payload);
      else await departmentService.createDepartment(payload);
      toast.success(editingId ? 'Department updated' : 'Department created');
      closeModal();
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save department');
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2.5"><Building2 className="text-blue-600" size={26} /> Departments</h1>
          <p className="page-subtitle">Organize employees and assign department ownership.</p>
        </div>
        {canManage && <button type="button" onClick={openCreate} className="btn btn-primary self-start sm:self-auto"><Plus size={17} /> Add Department</button>}
      </div>

      {loading ? <div className="card p-12 text-center text-sm text-slate-500">Loading departments...</div> : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {departments.map((department) => (
            <div key={department._id} className="card space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Building2 size={20} /></span><div><h2 className="font-bold text-slate-900">{department.name}</h2><p className="text-xs text-slate-500">{department.employeeCount} employees</p></div></div>
                {canManage && <button type="button" onClick={() => openEdit(department)} title="Edit department" className="btn btn-secondary btn-sm"><Edit3 size={14} /></button>}
              </div>
              <p className="text-sm text-slate-600">{department.description || 'No description provided.'}</p>
              <div className="border-t border-slate-100 pt-3 text-xs text-slate-500">Head: <strong className="text-slate-700">{department.head ? `${department.head.firstName} ${department.head.lastName}` : 'Not assigned'}</strong></div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-labelledby="department-modal-title">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between"><div><h2 id="department-modal-title" className="text-lg font-bold text-slate-900">{editingId ? 'Edit Department' : 'Add Department'}</h2><p className="mt-1 text-sm text-slate-500">Set the department name, description, and head.</p></div><button type="button" onClick={closeModal} title="Close" className="btn btn-secondary btn-sm"><X size={16} /></button></div>
            <form onSubmit={save} className="space-y-4"><div><label className="form-label" htmlFor="department-name">Department Name *</label><input id="department-name" required minLength={2} maxLength={100} autoFocus className="form-input" value={form.name} onChange={(event) => update('name', event.target.value)} /></div><div><label className="form-label" htmlFor="department-description">Description</label><textarea id="department-description" maxLength={500} className="form-textarea" value={form.description} onChange={(event) => update('description', event.target.value)} /></div><div><label className="form-label" htmlFor="department-head">Department Head</label><select id="department-head" className="form-select" value={form.head} onChange={(event) => update('head', event.target.value)}><option value="">No department head</option>{users.map((item) => <option key={item._id} value={item._id}>{item.firstName} {item.lastName}</option>)}</select></div><div className="flex justify-end gap-3 pt-2"><button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button><button type="submit" className="btn btn-primary"><Save size={16} /> {editingId ? 'Save Changes' : 'Create Department'}</button></div></form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;
