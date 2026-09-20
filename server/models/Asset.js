const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    assetTag: {
      type: String,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
      maxlength: 150,
    },
    category: {
      type: String,
      enum: ['laptop', 'desktop', 'monitor', 'printer', 'mobile', 'network', 'software', 'other'],
      required: [true, 'Asset category is required'],
    },
    status: {
      type: String,
      enum: ['available', 'assigned', 'maintenance', 'retired'],
      default: 'available',
    },
    manufacturer: { type: String, trim: true, maxlength: 100 },
    model: { type: String, trim: true, maxlength: 100 },
    serialNumber: { type: String, trim: true, maxlength: 100 },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    purchaseDate: { type: Date },
    warrantyExpires: { type: Date },
    location: { type: String, trim: true, maxlength: 150 },
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

assetSchema.pre('save', async function () {
  if (!this.assetTag) {
    const count = await mongoose.model('Asset').countDocuments();
    this.assetTag = `AST-${String(count + 1).padStart(4, '0')}`;
  }

  if (this.status === 'assigned' && !this.assignedTo) {
    this.status = 'available';
  }

  if (this.assignedTo && this.status === 'available') {
    this.status = 'assigned';
  }
});

module.exports = mongoose.model('Asset', assetSchema);
