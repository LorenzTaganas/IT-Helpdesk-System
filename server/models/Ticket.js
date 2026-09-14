const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
    },
    isInternal: {
      type: Boolean,
      default: false, // Internal notes visible only to IT support & admins
    },
  },
  {
    timestamps: true,
  }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Ticket title is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: [true, 'Ticket description is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['hardware', 'software', 'network', 'access', 'email', 'other'],
      required: [true, 'Category is required'],
      default: 'other',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'pending_user', 'resolved', 'closed'],
      default: 'open',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    comments: [commentSchema],
    resolutionNotes: {
      type: String,
      trim: true,
    },
    resolvedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate ticketId before saving (e.g. TICK-0001)
ticketSchema.pre('save', async function () {
  if (!this.ticketId) {
    const count = await mongoose.model('Ticket').countDocuments();
    this.ticketId = `TICK-${String(count + 1).padStart(4, '0')}`;
  }
});

module.exports = mongoose.model('Ticket', ticketSchema);
