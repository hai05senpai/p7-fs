import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    companyName: String,
    email: String,
    password: String,
  },
  {
    timestamps: true, // Tự động thêm trường createdAt và updatedAt
  }
);

const AccountCompany = mongoose.model('AccountCompany', schema, 'accounts-company');

export default AccountCompany;