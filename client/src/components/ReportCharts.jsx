import { Activity, Package } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#64748b'];
const label = (value) => String(value).replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const ChartCard = ({ title, children }) => <section className="card min-w-0"><h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">{title}</h2>{children}</section>;
const EmptyChart = () => <div className="flex h-64 items-center justify-center text-sm text-slate-400">No data available yet.</div>;

const ReportCharts = ({ data }) => {
  if (!data) return null;
  const { summary, tickets, assets } = data;
  const statusData = tickets.byStatus.map((item) => ({ ...item, name: label(item.name) }));
  const assetData = assets.byStatus.map((item) => ({ ...item, name: label(item.name) }));
  const categoryData = tickets.byCategory.map((item) => ({ ...item, name: label(item.name) }));

  return <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 report-charts">
    <ChartCard title="Tickets Created · Last 30 Days"><ResponsiveContainer width="100%" height={280}><LineChart data={tickets.trend} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="tickets" name="Tickets" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></ChartCard>
    <ChartCard title="Tickets by Category"><ResponsiveContainer width="100%" height={280}><BarChart data={categoryData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" name="Tickets" fill="#2563eb" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
    <ChartCard title="Ticket Status"><div className="flex items-center justify-center"><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={58} outerRadius={92} paddingAngle={3}>{statusData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div></ChartCard>
    <ChartCard title="Asset Lifecycle"><div className="flex items-center justify-center"><ResponsiveContainer width="100%" height={280}>{assetData.length ? <PieChart><Pie data={assetData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={58} outerRadius={92} paddingAngle={3}>{assetData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart> : <EmptyChart />}</ResponsiveContainer></div><p className="mt-2 flex items-center justify-center gap-1 text-xs text-slate-400"><Package size={13} /> {summary.assetTotal} total assets · {summary.assetsInMaintenance} in maintenance</p></ChartCard>
  </div>;
};

export default ReportCharts;
