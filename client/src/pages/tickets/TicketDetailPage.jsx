import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ticketService from '../../services/ticketService';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  User,
  Building2,
  Calendar,
  Send,
  Lock,
  MessageSquare,
  ShieldAlert,
  Check,
  UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'pending_user', label: 'Pending User Reply' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' },
  { value: 'critical', label: 'Critical Priority' },
];

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Resolution notes state
  const [showResolutionBox, setShowResolutionBox] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const isStaff = ['it_support', 'it_admin', 'super_admin'].includes(user?.role);
  const isOwner = ticket?.createdBy?._id?.toString() === user?._id?.toString();

  const fetchTicket = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ticketService.getTicketById(id);
      setTicket(data);
      if (data.resolutionNotes) {
        setResolutionNotes(data.resolutionNotes);
      }
    } catch (err) {
      console.error('Failed to load ticket', err);
      toast.error('Ticket not found or access denied');
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  // Handle status update
  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'resolved' && !ticket.resolutionNotes && isStaff) {
      setShowResolutionBox(true);
      return;
    }

    try {
      setUpdating(true);
      const res = await ticketService.updateTicket(ticket._id, {
        status: newStatus,
        resolutionNotes: resolutionNotes || undefined,
      });
      setTicket(res.ticket);
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      setShowResolutionBox(false);
    } catch (err) {
      console.error('Update status failed', err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  // Handle priority update
  const handlePriorityChange = async (newPriority) => {
    try {
      setUpdating(true);
      const res = await ticketService.updateTicket(ticket._id, { priority: newPriority });
      setTicket(res.ticket);
      toast.success(`Priority updated to ${newPriority}`);
    } catch (err) {
      console.error('Update priority failed', err);
      toast.error(err.response?.data?.message || 'Failed to update priority');
    } finally {
      setUpdating(false);
    }
  };

  // Assign to logged-in IT support
  const handleAssignToMe = async () => {
    try {
      setUpdating(true);
      const res = await ticketService.updateTicket(ticket._id, {
        assignedTo: user._id,
        status: ticket.status === 'open' ? 'in_progress' : ticket.status,
      });
      setTicket(res.ticket);
      toast.success('Ticket assigned to you!');
    } catch (err) {
      console.error('Assign ticket failed', err);
      toast.error('Failed to assign ticket');
    } finally {
      setUpdating(false);
    }
  };

  // Submit comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      await ticketService.addComment(ticket._id, {
        text: commentText.trim(),
        isInternal,
      });
      setCommentText('');
      setIsInternal(false);
      toast.success(isInternal ? 'Internal note added' : 'Reply posted');
      fetchTicket();
    } catch (err) {
      console.error('Add comment failed', err);
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-3" />
        <p>Loading ticket details...</p>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back button */}
      <Link
        to="/tickets"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Ticket Queue
      </Link>

      {/* Main Header */}
      <div className="card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
              {ticket.ticketId}
            </span>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded">
              {ticket.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Status badge */}
            <span
              className={`badge font-semibold ${
                ticket.status === 'open'
                  ? 'badge-blue'
                  : ticket.status === 'in_progress'
                  ? 'badge-yellow'
                  : ticket.status === 'pending_user'
                  ? 'badge-purple'
                  : ticket.status === 'resolved'
                  ? 'badge-green'
                  : 'badge-gray'
              }`}
            >
              {ticket.status.replace('_', ' ').toUpperCase()}
            </span>

            {/* Priority badge */}
            <span
              className={`badge font-semibold ${
                ticket.priority === 'critical'
                  ? 'badge-red'
                  : ticket.priority === 'high'
                  ? 'badge-yellow'
                  : ticket.priority === 'medium'
                  ? 'badge-blue'
                  : 'badge-gray'
              }`}
            >
              {ticket.priority.toUpperCase()}
            </span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 leading-tight">{ticket.title}</h1>

        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span className="flex items-center gap-1.5">
            <User size={14} className="text-slate-400" />
            Reported by <strong className="text-slate-700">{ticket.createdBy?.firstName} {ticket.createdBy?.lastName}</strong> ({ticket.createdBy?.employeeId})
          </span>
          {ticket.department && (
            <span className="flex items-center gap-1.5">
              <Building2 size={14} className="text-slate-400" />
              {ticket.department.name}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar size={14} className="text-slate-400" />
            Created {new Date(ticket.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Conversation & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Description Card */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Problem Description
              </h2>
              <span className="text-xs text-slate-400">Original Request</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </div>
          </div>

          {/* Resolution Card if resolved */}
          {ticket.resolutionNotes && (
            <div className="card bg-emerald-50 border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 size={18} className="text-emerald-600" />
                Resolution Details
              </div>
              <p className="text-sm text-emerald-950 whitespace-pre-wrap leading-relaxed">
                {ticket.resolutionNotes}
              </p>
              {ticket.resolvedAt && (
                <p className="text-xs text-emerald-700 pt-1">
                  Resolved on {new Date(ticket.resolvedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Resolution Prompt Box */}
          {showResolutionBox && (
            <div className="card border-blue-300 bg-blue-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm text-blue-900 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-blue-600" />
                  Please provide Resolution Notes before resolving:
                </p>
                <button
                  onClick={() => setShowResolutionBox(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
              <textarea
                rows={3}
                placeholder="Describe how the problem was resolved (e.g., replaced cable, reset user password in Active Directory)..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="form-textarea text-sm"
              />
              <button
                onClick={() => handleStatusChange('resolved')}
                disabled={!resolutionNotes.trim() || updating}
                className="btn btn-primary btn-sm"
              >
                Confirm and Mark Resolved
              </button>
            </div>
          )}

          {/* Discussion / Activity Stream */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare size={16} className="text-slate-500" />
                Activity & Responses ({ticket.comments?.length || 0})
              </h2>
            </div>

            {ticket.comments?.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-4 text-center">
                No comments or replies yet.
              </p>
            ) : (
              <div className="space-y-4">
                {ticket.comments.map((comment, index) => {
                  const isInternalNote = comment.isInternal;
                  const isAuthorStaff = comment.author?.role !== 'employee';

                  return (
                    <div
                      key={comment._id || index}
                      className={`p-4 rounded-xl border transition-all ${
                        isInternalNote
                          ? 'bg-amber-50/70 border-amber-200'
                          : isAuthorStaff
                          ? 'bg-blue-50/40 border-blue-100'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              isInternalNote
                                ? 'bg-amber-200 text-amber-900'
                                : isAuthorStaff
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {comment.author?.firstName?.[0] || 'U'}
                          </div>

                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {comment.author?.firstName} {comment.author?.lastName}
                              {isAuthorStaff && (
                                <span className="ml-1.5 text-[10px] uppercase font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                                  IT Support
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(comment.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {isInternalNote && (
                          <span className="badge text-[10px] font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                            <Lock size={11} /> Internal Note
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed pl-9">
                        {comment.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Comment reply form */}
            {ticket.status !== 'closed' ? (
              <form onSubmit={handleCommentSubmit} className="pt-4 border-t border-slate-200 space-y-3">
                <label className="form-label font-bold text-xs" htmlFor="comment-text">
                  Add Response or Update
                </label>
                <textarea
                  id="comment-text"
                  rows={3}
                  placeholder={
                    isInternal
                      ? 'Add private technical notes, troubleshooting steps (visible only to IT Support/Admins)...'
                      : 'Type your message or response to this ticket...'
                  }
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className={`form-textarea text-sm ${
                    isInternal ? 'border-amber-400 focus:ring-amber-400 bg-amber-50/20' : ''
                  }`}
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  {isStaff ? (
                    <label className="flex items-center gap-2 text-xs font-medium text-amber-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="flex items-center gap-1 font-semibold">
                        <Lock size={12} /> Post as Internal IT Note (Private)
                      </span>
                    </label>
                  ) : <div />}

                  <button
                    type="submit"
                    disabled={!commentText.trim() || submittingComment}
                    className={`btn btn-sm ${
                      isInternal ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'btn-primary'
                    }`}
                  >
                    {submittingComment ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send size={14} />
                        <span>{isInternal ? 'Add Internal Note' : 'Post Reply'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                This ticket is marked as <strong>Closed</strong>. Further replies are disabled.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Actions & Details Sidebar */}
        <div className="space-y-6">
          {/* Status & Assignment Actions Card */}
          <div className="card space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ticket Control
            </h2>

            {/* Quick Assign to me button */}
            {isStaff && (!ticket.assignedTo || ticket.assignedTo._id !== user._id) && (
              <button
                onClick={handleAssignToMe}
                disabled={updating}
                className="btn btn-secondary w-full text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-blue-200"
              >
                <UserPlus size={14} />
                Assign to Me
              </button>
            )}

            {/* Status selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Change Status
              </label>
              {isStaff ? (
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updating}
                  className="form-select text-xs w-full font-medium"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : isOwner && ticket.status !== 'closed' ? (
                <button
                  onClick={() => handleStatusChange('closed')}
                  disabled={updating}
                  className="btn btn-secondary btn-sm w-full text-red-600 hover:bg-red-50 border-red-200"
                >
                  Close My Ticket
                </button>
              ) : (
                <p className="text-xs font-bold text-slate-700 capitalize">
                  {ticket.status.replace('_', ' ')}
                </p>
              )}
            </div>

            {/* Priority selector (staff only) */}
            {isStaff && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Change Priority
                </label>
                <select
                  value={ticket.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  disabled={updating}
                  className="form-select text-xs w-full font-medium"
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Ticket Information Card */}
          <div className="card space-y-3.5 text-xs">
            <h2 className="font-bold uppercase tracking-wider text-slate-400">
              Details
            </h2>

            <div>
              <p className="text-slate-400 font-medium mb-0.5">Assigned Technician</p>
              {ticket.assignedTo ? (
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">
                    {ticket.assignedTo.firstName?.[0]}
                  </div>
                  <span>
                    {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                  </span>
                </div>
              ) : (
                <p className="text-amber-600 italic font-medium">Unassigned (In queue)</p>
              )}
            </div>

            <div>
              <p className="text-slate-400 font-medium mb-0.5">Requester</p>
              <p className="font-semibold text-slate-800">
                {ticket.createdBy?.firstName} {ticket.createdBy?.lastName}
              </p>
              <p className="text-slate-500">{ticket.createdBy?.email}</p>
            </div>

            <div>
              <p className="text-slate-400 font-medium mb-0.5">Department</p>
              <p className="font-semibold text-slate-800">
                {ticket.department?.name || 'General'}
              </p>
            </div>

            <div>
              <p className="text-slate-400 font-medium mb-0.5">Created At</p>
              <p className="font-medium text-slate-700">
                {new Date(ticket.createdAt).toLocaleString()}
              </p>
            </div>

            {ticket.resolvedAt && (
              <div>
                <p className="text-slate-400 font-medium mb-0.5">Resolved At</p>
                <p className="font-medium text-emerald-700">
                  {new Date(ticket.resolvedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;
