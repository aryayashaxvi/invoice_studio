import mongoose from 'mongoose';

const organizationSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'default', unique: true, immutable: true },
  organizationName: { type: String, required: true, trim: true, default: 'The Pursuit' },
  homeState: { type: String, required: true, trim: true, default: 'Haryana' },
  invoiceStartNumber: { type: Number, required: true, min: 1, default: 173 },
  taxes: {
    cgstRate: { type: Number, required: true, min: 0, max: 1, default: 0.09 },
    sgstRate: { type: Number, required: true, min: 0, max: 1, default: 0.09 },
    igstRate: { type: Number, required: true, min: 0, max: 1, default: 0.18 }
  },
  templates: {
    intraState: { type: String, enum: ['template1.xlsx', 'template2.xlsx'], default: 'template2.xlsx' },
    interstate: { type: String, enum: ['template1.xlsx', 'template2.xlsx'], default: 'template1.xlsx' }
  }
}, { timestamps: true });

export default mongoose.model('OrganizationSettings', organizationSettingsSchema);
