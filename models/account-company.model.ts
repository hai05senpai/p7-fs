import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    companyName: String,
    email: String,
    password: String,
    city: String,
    address: String,
    phone: String,
    logo: String,
    companyModel: String,
    companyEmployees: String,
    workingTime: String,
    workOvertime: String,
    description: String
  },
  {
    timestamps: true, // Tự động thêm trường createdAt và updatedAt
  }
);

const AccountCompany = mongoose.model('AccountCompany', schema, 'accounts-company');

export default AccountCompany;