import { useState } from 'react';
import { KeyRound, Save, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '', position: user?.position || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updatePassword = (field, value) => setPasswordForm((current) => ({ ...current, [field]: value }));

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await authService.updateProfile(form);
      await refreshUser();
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('New passwords do not match');
    if (passwordForm.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    try {
      setChangingPassword(true);
      await authService.updateProfile({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="page-header"><div><h1 className="page-title flex items-center gap-2.5"><UserCircle className="text-blue-600" size={26} /> My Profile</h1><p className="page-subtitle">Manage your personal information and account security.</p></div></div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <form onSubmit={saveProfile} className="card space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4"><span className="avatar avatar-lg bg-blue-600">{user?.firstName?.[0]}{user?.lastName?.[0]}</span><div><h2 className="font-bold text-slate-900">{user?.firstName} {user?.lastName}</h2><p className="text-sm text-slate-500">{user?.employeeId} · {user?.role?.replace('_', ' ')}</p></div></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label className="form-label">First Name</label><input className="form-input" value={form.firstName} onChange={(event) => update('firstName', event.target.value)} /></div><div><label className="form-label">Last Name</label><input className="form-input" value={form.lastName} onChange={(event) => update('lastName', event.target.value)} /></div><div><label className="form-label">Email</label><input type="email" className="form-input" value={form.email} onChange={(event) => update('email', event.target.value)} /></div><div><label className="form-label">Position</label><input className="form-input" value={form.position} onChange={(event) => update('position', event.target.value)} /></div></div>
          <div className="flex justify-end"><button disabled={saving} className="btn btn-primary"><Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}</button></div>
        </form>
        <form onSubmit={changePassword} className="card space-y-4"><div className="flex items-center gap-2 border-b border-slate-100 pb-4"><KeyRound className="text-amber-600" size={19} /><h2 className="font-bold text-slate-900">Change Password</h2></div><div><label className="form-label">Current Password</label><input required type="password" className="form-input" value={passwordForm.currentPassword} onChange={(event) => updatePassword('currentPassword', event.target.value)} /></div><div><label className="form-label">New Password</label><input required type="password" className="form-input" value={passwordForm.newPassword} onChange={(event) => updatePassword('newPassword', event.target.value)} /></div><div><label className="form-label">Confirm New Password</label><input required type="password" className="form-input" value={passwordForm.confirmPassword} onChange={(event) => updatePassword('confirmPassword', event.target.value)} /></div><button disabled={changingPassword} className="btn btn-secondary w-full"><KeyRound size={16} /> {changingPassword ? 'Changing...' : 'Change Password'}</button></form>
      </div>
      <div className="card grid grid-cols-1 gap-4 text-sm sm:grid-cols-3"><Info label="Department" value={user?.department?.name} /><Info label="Account Status" value={user?.status} /><Info label="Last Login" value={user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Current session'} /></div>
    </div>
  );
};

const Info = ({ label, value }) => <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-medium capitalize text-slate-800">{value || 'Not set'}</p></div>;

export default ProfilePage;
