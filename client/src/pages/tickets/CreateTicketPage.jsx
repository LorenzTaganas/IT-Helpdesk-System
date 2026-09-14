import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ticketService from '../../services/ticketService';
import {
  ArrowLeft,
  Send,
  Laptop,
  Code2,
  Wifi,
  KeyRound,
  Mail,
  HelpCircle,
  AlertCircle,
  Flame,
  AlertTriangle,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  {
    id: 'hardware',
    title: 'Hardware',
    desc: 'Laptops, monitors, keyboards, printers, docking stations',
    icon: Laptop,
  },
  {
    id: 'software',
    title: 'Software',
    desc: 'OS issues, Office 365, Adobe, licensed apps',
    icon: Code2,
  },
  {
    id: 'network',
    title: 'Network & VPN',
    desc: 'Wi-Fi, VPN connectivity, LAN, shared drives',
    icon: Wifi,
  },
  {
    id: 'access',
    title: 'Access & Accounts',
    desc: 'Password resets, database permissions, system logins',
    icon: KeyRound,
  },
  {
    id: 'email',
    title: 'Email',
    desc: 'Outlook, spam, distribution lists, shared mailboxes',
    icon: Mail,
  },
  {
    id: 'other',
    title: 'Other Request',
    desc: 'General IT inquiries, consultations, or unlisted items',
    icon: HelpCircle,
  },
];

const PRIORITIES = [
  {
    id: 'low',
    title: 'Low',
    desc: 'Minor issue or general inquiry with no impact on work.',
    icon: Info,
    color: 'text-slate-600',
    border: 'border-slate-200',
    activeBg: 'bg-slate-50 ring-2 ring-slate-400',
  },
  {
    id: 'medium',
    title: 'Medium',
    desc: 'Normal issue affecting work, but a workaround is available.',
    icon: AlertCircle,
    color: 'text-blue-600',
    border: 'border-blue-200',
    activeBg: 'bg-blue-50 ring-2 ring-blue-500',
  },
  {
    id: 'high',
    title: 'High',
    desc: 'Significant issue preventing major work tasks.',
    icon: AlertTriangle,
    color: 'text-amber-600',
    border: 'border-amber-200',
    activeBg: 'bg-amber-50 ring-2 ring-amber-500',
  },
  {
    id: 'critical',
    title: 'Critical',
    desc: 'Complete work stoppage or critical department-wide outage.',
    icon: Flame,
    color: 'text-red-600',
    border: 'border-red-200',
    activeBg: 'bg-red-50 ring-2 ring-red-500',
  },
];

const CreateTicketPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: 'hardware',
    priority: 'medium',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = 'Please provide a descriptive title for your request';
    } else if (formData.title.length > 150) {
      errs.title = 'Title must be 150 characters or less';
    }

    if (!formData.description.trim()) {
      errs.description = 'Please describe your problem or request in detail';
    } else if (formData.description.trim().length < 15) {
      errs.description = 'Description should be at least 15 characters long';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await ticketService.createTicket(formData);
      toast.success(`Ticket created: ${res.ticket.ticketId}`);
      navigate(`/tickets/${res.ticket.ticketId || res.ticket._id}`);
    } catch (err) {
      console.error('Failed to create ticket', err);
      const msg = err.response?.data?.message || 'Failed to submit ticket. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        to="/tickets"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Tickets
      </Link>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Submit a Support Ticket</h1>
          <p className="page-subtitle">
            Provide details about the technical issue or service you need assistance with.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ticket Details Card */}
        <div className="card space-y-5">
          {/* Title */}
          <div>
            <label className="form-label" htmlFor="ticket-title">
              Ticket Title <span className="text-red-500">*</span>
            </label>
            <input
              id="ticket-title"
              type="text"
              placeholder="e.g. Laptop display flickers when connected to external monitor"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`form-input ${errors.title ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>

          {/* Category Selector */}
          <div>
            <label className="form-label">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = formData.category === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setFormData({ ...formData, category: cat.id })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon size={16} />
                      </div>
                      <p
                        className={`text-sm font-semibold ${
                          isSelected ? 'text-blue-900' : 'text-slate-800'
                        }`}
                      >
                        {cat.title}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{cat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority Selector */}
          <div>
            <label className="form-label">
              Priority <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PRIORITIES.map((pri) => {
                const Icon = pri.icon;
                const isSelected = formData.priority === pri.id;
                return (
                  <div
                    key={pri.id}
                    onClick={() => setFormData({ ...formData, priority: pri.id })}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? pri.activeBg
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={16} className={pri.color} />
                      <span className={`text-sm font-bold ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                        {pri.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">{pri.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="form-label" htmlFor="ticket-desc">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="ticket-desc"
              rows={5}
              placeholder="Describe the steps to reproduce the issue, exact error codes or messages, and when it started occurring..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`form-textarea ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.description && <p className="form-error">{errors.description}</p>}
            <p className="text-xs text-slate-400 mt-1">
              Tip: Include any specific software versions, hardware device tags, or error messages.
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link to="/tickets" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn btn-primary shadow-sm">
            {loading ? (
              <span>Submitting...</span>
            ) : (
              <>
                <Send size={16} />
                <span>Submit Ticket</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTicketPage;
