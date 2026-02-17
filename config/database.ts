import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.DATABASE}`);
    console.log('Kết nối database thành công');
  }
  catch (error) {
    console.log('Kết nối database thất bại');
  }
}