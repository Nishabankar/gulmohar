const mongoose = require('mongoose');

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
      enum: ['New', 'Contacted', 'Interested', 'Site Visit Scheduled', 'Closed'],
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
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Enquiry', enquirySchema);
