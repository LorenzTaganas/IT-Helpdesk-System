import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, CheckCircle2, Printer, Ticket } from 'lucide-react';
import reportService from '../../services/reportService';
import toast from 'react-hot-toast';

const ReportCard = ({ title, value, caption, Icon, color }) => (
  <div className="stat-card">
    <div className="mb-3 flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{title}</p><span className={`rounded-lg p-2 ${color}`}><Icon size={17} /></span></div>
    <p className="text-3xl font-bold text-slate-900">{value}</p>
    <p className="mt-1 text-xs text-slate-400">{caption}</p>
  </div>
);

const ReportsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.getReports().then(setData).catch((error) => toast.error(error.response?.data?.message || 'Failed to load reports')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-12 text-center text-sm text-slate-500">Generating reports...</div>;
  if (!data) return <div className="p-12 text-center text-sm text-slate-500">Reports could not be loaded.</div>;

  const { summary } = data;
  const reportSections = [
    { title: 'Ticket Status', items: data.tickets.byStatus },
    { title: 'Ticket Priority', items: data.tickets.byPriority },
    { title: 'Ticket Category', items: data.tickets.byCategory },
    { title: 'Asset Lifecycle', items: data.assets.byStatus },
  ];

  return (
    <div className="space-y-6 report-page">
      <div className="page-header"><div><h1 className="page-title flex items-center gap-2.5"><BarChart3 className="text-blue-600" size={26} /> Reports</h1><p className="page-subtitle">Printable operational overview of helpdesk activity and asset lifecycle.</p></div><div className="flex items-center gap-3"><span className="flex items-center gap-1.5 text-xs text-slate-400"><Activity size={14} /> Updated just now</span><button type="button" onClick={() => window.print()} className="btn btn-secondary print-hide"><Printer size={16} /> Print Report</button></div></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportCard title="Total Tickets" value={summary.ticketTotal} caption="All submitted requests" Icon={Ticket} color="bg-blue-50 text-blue-600" />
        <ReportCard title="Active Tickets" value={summary.openTickets} caption="Needs attention" Icon={Activity} color="bg-amber-50 text-amber-600" />
        <ReportCard title="Resolved / Closed" value={summary.resolvedTickets} caption="Completed requests" Icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
        <ReportCard title="Critical Tickets" value={summary.criticalTickets} caption="Open critical priority" Icon={AlertTriangle} color="bg-red-50 text-red-600" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 report-text-sections">
        {reportSections.map((section) => (
          <section key={section.title} className="card">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">{section.title}</h2>
            {section.items.length === 0 ? <p className="text-sm text-slate-400">No data available.</p> : <table className="data-table report-data-table"><thead><tr><th>Item</th><th>Count</th></tr></thead><tbody>{section.items.map((item) => <tr key={item.name}><td className="capitalize">{item.name.replace('_', ' ')}</td><td className="font-semibold">{item.value}</td></tr>)}</tbody></table>}
          </section>
        ))}
      </div>
      <section className="card">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">Tickets Created · Last 30 Days</h2>
        <div className="table-container"><table className="data-table report-data-table"><thead><tr><th>Date</th><th>Tickets Created</th></tr></thead><tbody>{data.tickets.trend.map((item) => <tr key={item.date}><td>{item.date}</td><td className="font-semibold">{item.tickets}</td></tr>)}</tbody></table></div>
      </section>
    </div>
  );
};

export default ReportsPage;
