import mongoose from 'mongoose';

const organizationSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'default',
      unique: true,
      immutable: true,
    },

    homeState: {
      type: String,
      trim: true,
      default: '',
    },

    invoiceStartNumber: {
      type: Number,
      min: 1,
    },

    taxes: {
      cgstRate: {
        type: Number,
        min: 0,
        max: 1,
      },
      sgstRate: {
        type: Number,
        min: 0,
        max: 1,
      },
      igstRate: {
        type: Number,
        min: 0,
        max: 1,
      },
    },

    templates: {
      intraState: {
        type: String,
        enum: ['template1.xlsx', 'template2.xlsx'],
      },
      interstate: {
        type: String,
        enum: ['template1.xlsx', 'template2.xlsx'],
      },
    },

    issuer: {
      legalName: {
        type: String,
        trim: true,
        default: '',
      },

      gstNumber: {
        type: String,
        trim: true,
        uppercase: true,
        default: '',
      },

      registeredAddress: {
        type: String,
        trim: true,
        default: '',
      },

      hsnCode: {
        type: String,
        trim: true,
        default: '',
      },

      bankAccountNumber: {
        type: String,
        trim: true,
        default: '',
      },

      bankAccountType: {
        type: String,
        trim: true,
        default: '',
      },

      bankNameAndAddress: {
        type: String,
        trim: true,
        default: '',
      },

      ifscCode: {
        type: String,
        trim: true,
        uppercase: true,
        default: '',
      },

      panNumber: {
        type: String,
        trim: true,
        uppercase: true,
        default: '',
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  'OrganizationSettings',
  organizationSettingsSchema
);