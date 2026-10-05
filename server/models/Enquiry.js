const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
  {
    fieldName: {
      type: String,
      required: true
    },
    oldValue: {
      type: String,
      default: '—'
    },
    newValue: {
      type: String,
      default: '—'
    },
    modifiedBy: {
      type: String,
      default: 'Admin'
    },
    modifiedDate: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const enquirySchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      trim: true,
      default: ''
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      default: ''
    },
    plotInfo: {
      type: String,
      default: ''
    },
    plotsCount: {
      type: String,
      default: '1 Plot'
    },
    visitDate: {
      type: String,
      default: ''
    },
    followupDate: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      default: 'New'
    },
    notes: {
      type: String,
      default: ''
    },
    assignedAgentName: {
      type: String,
      default: ''
    },
    assignedTo: {
      type: String,
      default: ''
    },
    history: [historySchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Enquiry', enquirySchema);
