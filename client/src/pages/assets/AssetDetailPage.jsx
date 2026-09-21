import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, PackagePlus, Save, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import assetService from '../../services/assetService';
import toast from 'react-hot-toast';

const CATEGORIES = ['laptop', 'desktop', 'monitor', 'printer', 'mobile', 'network', 'software', 'other'];
const STATUSES = ['available', 'assigned', 'maintenance', 'retired'];

const EMPTY_FORM = {
  name: '', category: 'laptop', status: 'available', manufacturer: '', model: '', serialNumber: '',
  assignedTo: '', purchaseDate: '', warrantyExpires: '', location: '', notes: '',
};

const AssetDetailPage = ({ isCreate = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = isCreate || id === 'new';
  const isStaff = ['it_support', 'it_admin', 'super_admin'].includes(user?.role);
  const [form, setForm] = useState(EMPTY_FORM);
  const [asset, setAsset] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isStaff) return;
    assetService.getAssignableUsers().then(setUsers).catch(() => toast.error('Could not load assignable users'));
  }, [isStaff]);

  useEffect(() => {
    if (isNew) return;
    const loadAsset = async () => {
      try {
        const data = await assetService.getAssetById(id);
        setAsset(data);
        setForm({
          name: data.name || '', category: data.category || 'other', status: data.status || 'available',
          manufacturer: data.manufacturer || '', model: data.model || '', serialNumber: data.serialNumber || '',
          assignedTo: data.assignedTo?._id || '', purchaseDate: data.purchaseDate?.slice(0, 10) || '',
          warrantyExpires: data.warrantyExpires?.slice(0, 10) || '', location: data.location || '', notes: data.notes || '',
        });
      } catch (error) {
        toast.error(error.response?.data?.message || 'Asset not found');
        navigate('/assets');
      } finally {
        setLoading(false);
      }
    };
    loadAsset();
  }, [id, isNew, navigate]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const saveAsset = async (event) => {
    event.preventDefault();
    if (!isStaff) return;
    if (!form.name.trim()) {
      toast.error('Asset name is required');
      return;
    }
    try {
      setSaving(true);
      const payload = { ...form, assignedTo: form.assignedTo || null, purchaseDate: form.purchaseDate || null, warrantyExpires: form.warrantyExpires || null };
      const response = isNew ? await assetService.createAsset(payload) : await assetService.updateAsset(id, payload);
      toast.success(isNew ? 'Asset created' : 'Asset updated');
      navigate(`/assets/${response.asset.assetTag || response.asset._id}`, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save asset');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading asset...</div>;
  if (!isNew && !asset) return null;

  if (!isStaff && isNew) {
    navigate('/assets', { replace: true });
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/assets" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Back to Assets
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2.5"><PackagePlus className="text-blue-600" size={26} />{isNew ? 'Add Asset' : asset.name}</h1>
          <p className="page-subtitle">{isNew ? 'Register equipment or software in the inventory.' : `${asset.assetTag} · Asset details and lifecycle status`}</p>
        </div>
        {!isNew && <span className="badge badge-blue">{asset.status}</span>}
      </div>

      {isStaff ? (
        <form onSubmit={saveAsset} className="space-y-6">
          <div className="card grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><label className="form-label">Asset Name *</label><input required minLength={2} maxLength={150} className="form-input" value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="e.g. Lenovo ThinkPad T14" /></div>
            <div><label className="form-label">Category *</label><select className="form-select" value={form.category} onChange={(e) => updateField('category', e.target.value)}>{CATEGORIES.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select></div>
            <div><label className="form-label">Status</label><select className="form-select" value={form.status} onChange={(e) => updateField('status', e.target.value)}>{STATUSES.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select></div>
            <div><label className="form-label">Manufacturer</label><input maxLength={100} className="form-input" value={form.manufacturer} onChange={(e) => updateField('manufacturer', e.target.value)} /></div>
            <div><label className="form-label">Model</label><input maxLength={100} className="form-input" value={form.model} onChange={(e) => updateField('model', e.target.value)} /></div>
            <div><label className="form-label">Serial Number</label><input maxLength={100} className="form-input" value={form.serialNumber} onChange={(e) => updateField('serialNumber', e.target.value)} /></div>
            <div><label className="form-label">Assigned User</label><select className="form-select" value={form.assignedTo} onChange={(e) => updateField('assignedTo', e.target.value)}><option value="">Unassigned</option>{users.map((item) => <option key={item._id} value={item._id}>{item.firstName} {item.lastName} · {item.employeeId}</option>)}</select></div>
            <div><label className="form-label">Purchase Date</label><input type="date" className="form-input" value={form.purchaseDate} onChange={(e) => updateField('purchaseDate', e.target.value)} /></div>
            <div><label className="form-label">Warranty Expires</label><input type="date" min={form.purchaseDate || undefined} className="form-input" value={form.warrantyExpires} onChange={(e) => updateField('warrantyExpires', e.target.value)} /></div>
            <div><label className="form-label">Location</label><input maxLength={150} className="form-input" value={form.location} onChange={(e) => updateField('location', e.target.value)} placeholder="e.g. Finance Office" /></div>
            <div className="md:col-span-2"><label className="form-label">Notes</label><textarea maxLength={2000} className="form-textarea" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-3"><Link to="/assets" className="btn btn-secondary">Cancel</Link><button type="submit" disabled={saving} className="btn btn-primary"><Save size={16} />{saving ? 'Saving...' : 'Save Asset'}</button></div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="card grid grid-cols-1 gap-5 sm:grid-cols-2"><Info label="Category" value={asset.category} /><Info label="Manufacturer" value={asset.manufacturer} /><Info label="Model" value={asset.model} /><Info label="Serial Number" value={asset.serialNumber} /><Info label="Location" value={asset.location} /><Info label="Assigned To" value={asset.assignedTo ? `${asset.assignedTo.firstName} ${asset.assignedTo.lastName}` : 'Unassigned'} /></div>
          {asset.notes && <div className="card"><h2 className="font-bold text-slate-900">Notes</h2><p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{asset.notes}</p></div>}
        </div>
      )}
    </div>
  );
};

const Info = ({ label, value }) => <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-medium capitalize text-slate-800">{value || 'Not set'}</p></div>;

export default AssetDetailPage;
