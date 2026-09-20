import { Bell, CheckCheck, Menu } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';

const ROLE_LABELS = { employee: 'Employee', it_support: 'IT Support', it_admin: 'IT Admin', super_admin: 'Super Admin' };
const ROLE_BADGE_COLORS = { employee: { bg: '#e0f2fe', text: '#075985' }, it_support: { bg: '#ede9fe', text: '#4c1d95' }, it_admin: { bg: '#dbeafe', text: '#1e40af' }, super_admin: { bg: '#fce7f3', text: '#831843' } };

const Topbar = ({ onMobileMenuToggle, pageTitle }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const roleBadge = ROLE_BADGE_COLORS[user?.role] || {};
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  };

  useEffect(() => { loadNotifications(); }, []);
  useEffect(() => {
    const handleOutsideClick = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false); };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const openNotification = async (notification) => {
    if (!notification.readAt) {
      await notificationService.markRead(notification._id);
      setUnreadCount((count) => Math.max(0, count - 1));
      setNotifications((items) => items.map((item) => item._id === notification._id ? { ...item, readAt: new Date().toISOString() } : item));
    }
    setOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const markAllRead = async () => {
    await notificationService.markAllRead();
    setUnreadCount(0);
    setNotifications((items) => items.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
  };

  return (
    <header className="topbar">
      <button className="mr-3 rounded-lg p-1.5 transition-colors hover:bg-gray-100 lg:hidden" onClick={onMobileMenuToggle} title="Open navigation"><Menu size={20} /></button>
      <div className="flex-1">{pageTitle && <h2 className="text-sm font-semibold text-slate-900">{pageTitle}</h2>}</div>
      <div className="flex items-center gap-3">
        <div ref={menuRef} className="relative">
          <button id="notifications-btn" type="button" className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100" onClick={() => setOpen((value) => !value)} title="Notifications"><Bell size={18} />{unreadCount > 0 && <span className="absolute right-1.5 top-1.5 flex h-2 min-w-2 rounded-full bg-red-500" />}</button>
          {open && <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><strong className="text-sm text-slate-900">Notifications</strong><button type="button" onClick={markAllRead} disabled={!unreadCount} className="flex items-center gap-1 text-xs font-semibold text-blue-600 disabled:text-slate-300"><CheckCheck size={14} /> Mark all read</button></div><div className="max-h-96 overflow-y-auto">{notifications.length === 0 ? <p className="p-6 text-center text-sm text-slate-400">No notifications yet.</p> : notifications.map((notification) => <button key={notification._id} type="button" onClick={() => openNotification(notification)} className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${notification.readAt ? '' : 'bg-blue-50/50'}`}><p className="text-sm font-semibold text-slate-800">{notification.title}</p><p className="mt-1 text-xs text-slate-500">{notification.message}</p><p className="mt-1 text-[10px] text-slate-400">{new Date(notification.createdAt).toLocaleString()}</p></button>)}</div></div>}
        </div>
        <div className="flex items-center gap-2 border-l pl-3" style={{ borderColor: '#e2e8f0' }}><div className="hidden text-right sm:block"><p className="text-sm font-medium text-slate-900">{user?.firstName} {user?.lastName}</p></div><span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: roleBadge.bg, color: roleBadge.text }}>{ROLE_LABELS[user?.role] || user?.role}</span></div>
      </div>
    </header>
  );
};

export default Topbar;
