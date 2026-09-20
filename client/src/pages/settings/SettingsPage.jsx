import { useEffect, useState } from 'react';
import { Save, Settings as SettingsIcon, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import settingService from '../../services/settingService';
import toast from 'react-hot-toast';

const DEFAULTS = { organizationName: '', supportEmail: '', timezone: 'UTC', defaultTicketPriority: 'medium', slaDays: 3, allowEmployeeClose: true };

const SettingsPage = () => {
  const { user } = useAuth();
  const canManage = ['it_admin', 'super_admin'].includes(user?.role);
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canManage) { setLoading(false); return; }
    settingService.getSettings().then((data) => setForm({ ...DEFAULTS, ...data.settings })).catch((error) => toast.error(error.response?.data?.message || 'Failed to load settings')).finally(() => setLoading(false));
  }, [canManage]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const save = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const response = await settingService.updateSettings({ ...form, slaDays: Number(form.slaDays) });
      setForm({ ...DEFAULTS, ...response.settings });
      toast.success('Settings saved');
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to save settings'); } finally { setSaving(false); }
  };

  if (loading) return <div className="p-12 text-center text-sm text-slate-500">Loading settings...</div>;
  if (!canManage) return <div className="card mx-auto max-w-xl p-12 text-center"><ShieldCheck size={32} className="mx-auto mb-3 text-slate-300" /><h1 className="font-bold text-slate-900">Administrator access required</h1><p className="mt-1 text-sm text-slate-500">Only IT administrators can manage system settings.</p></div>;

  return <div className="mx-auto max-w-4xl space-y-6"><div className="page-header"><div><h1 className="page-title flex items-center gap-2.5"><SettingsIcon className="text-blue-600" size={26} /> Settings</h1><p className="page-subtitle">Configure shared helpdesk defaults and service expectations.</p></div></div><form onSubmit={save} className="space-y-6"><section className="card space-y-5"><div><h2 className="text-base font-bold text-slate-900">Helpdesk Configuration</h2><p className="mt-1 text-sm text-slate-500">These values apply across the ITFlow workspace.</p></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label className="form-label">Organization Name</label><input className="form-input" value={form.organizationName} onChange={(event) => update('organizationName', event.target.value)} /></div><div><label className="form-label">Support Email</label><input type="email" className="form-input" value={form.supportEmail} onChange={(event) => update('supportEmail', event.target.value)} placeholder="support@example.com" /></div><div><label className="form-label">Timezone</label><select className="form-select" value={form.timezone} onChange={(event) => update('timezone', event.target.value)}><option>UTC</option><option>Asia/Manila</option><option>America/New_York</option><option>America/Los_Angeles</option><option>Europe/London</option></select></div><div><label className="form-label">Default Ticket Priority</label><select className="form-select" value={form.defaultTicketPriority} onChange={(event) => update('defaultTicketPriority', event.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div><div><label className="form-label">SLA Target (days)</label><input type="number" min="1" max="365" className="form-input" value={form.slaDays} onChange={(event) => update('slaDays', event.target.value)} /></div></div></section><section className="card"><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={form.allowEmployeeClose} onChange={(event) => update('allowEmployeeClose', event.target.checked)} className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500" /><span><strong className="block text-sm text-slate-900">Allow employees to close their own tickets</strong><small className="mt-1 block text-sm text-slate-500">Employees can mark their own resolved requests as closed.</small></span></label></section><div className="flex justify-end"><button disabled={saving} className="btn btn-primary"><Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}</button></div></form></div>;
};

export default SettingsPage;
