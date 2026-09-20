import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, CheckCircle2, Package, Ticket } from 'lucide-react';
import { Cell, Legend, Pie, PieChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import reportService from '../../services/reportService';
import toast from 'react-hot-toast';

const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#64748b'];
const label = (value) => String(value).replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const ReportCard = ({ title, value, caption, Icon, color }) => (
  <div className="stat-card">
    <div className="mb-3 flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{title}</p><span className={`rounded-lg p-2 ${color}`}><Icon size={17} /></span></div>
    <p className="text-3xl font-bold text-slate-900">{value}</p>
    <p className="mt-1 text-xs text-slate-400">{caption}</p>
  </div>
);

const ChartCard = ({ title, children, className = '' }) => <section className={`card min-w-0 ${className}`}><h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">{title}</h2>{children}</section>;

const EmptyChart = () => <div className="flex h-64 items-center justify-center text-sm text-slate-400">No data available yet.</div>;

const ReportsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.getReports().then(setData).catch((error) => toast.error(error.response?.data?.message || 'Failed to load reports')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-12 text-center text-sm text-slate-500">Generating reports...</div>;
  if (!data) return <div className="p-12 text-center text-sm text-slate-500">Reports could not be loaded.</div>;

  const { summary, tickets, assets } = data;
  const statusData = tickets.byStatus.map((item) => ({ ...item, name: label(item.name) }));
  const assetData = assets.byStatus.map((item) => ({ ...item, name: label(item.name) }));
  const categoryData = tickets.byCategory.map((item) => ({ ...item, name: label(item.name) }));

  return (
    <div className="space-y-6">
      <div className="page-header"><div><h1 className="page-title flex items-center gap-2.5"><BarChart3 className="text-blue-600" size={26} /> Reports</h1><p className="page-subtitle">Live operational overview of helpdesk activity and asset lifecycle.</p></div><span className="flex items-center gap-1.5 text-xs text-slate-400"><Activity size={14} /> Updated just now</span></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportCard title="Total Tickets" value={summary.ticketTotal} caption="All submitted requests" Icon={Ticket} color="bg-blue-50 text-blue-600" />
        <ReportCard title="Active Tickets" value={summary.openTickets} caption="Needs attention" Icon={Activity} color="bg-amber-50 text-amber-600" />
        <ReportCard title="Resolved / Closed" value={summary.resolvedTickets} caption="Completed requests" Icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
        <ReportCard title="Critical Tickets" value={summary.criticalTickets} caption="Open critical priority" Icon={AlertTriangle} color="bg-red-50 text-red-600" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Tickets Created · Last 30 Days"><ResponsiveContainer width="100%" height={280}><LineChart data={tickets.trend} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="tickets" name="Tickets" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Tickets by Category"><ResponsiveContainer width="100%" height={280}><BarChart data={categoryData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" name="Tickets" fill="#2563eb" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Ticket Status"><div className="flex items-center justify-center"><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={58} outerRadius={92} paddingAngle={3}>{statusData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div></ChartCard>
        <ChartCard title="Asset Lifecycle"><div className="flex items-center justify-center"><ResponsiveContainer width="100%" height={280}>{assetData.length ? <PieChart><Pie data={assetData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={58} outerRadius={92} paddingAngle={3}>{assetData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart> : <EmptyChart />}</ResponsiveContainer></div><p className="mt-2 flex items-center justify-center gap-1 text-xs text-slate-400"><Package size={13} /> {summary.assetTotal} total assets · {summary.assetsInMaintenance} in maintenance</p></ChartCard>
      </div>
    </div>
  );
};

export default ReportsPage;
