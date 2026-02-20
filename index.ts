import express from 'express';
import cors from 'cors';
import routes from './routes/index.route';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import cookieParser from 'cookie-parser';

const app = express();
const port = 4000;

// Load biến môi trường từ file .env
dotenv.config();

// Kết nối database
connectDB();

// Cấu hình CORS
app.use(cors({
  origin: 'http://localhost:3000', // Điền một tên miền cụ thể (ví dụ: 'http://localhost:3000') nếu bạn muốn giới hạn truy cập
  credentials: true, // Cho phép gửi cookie từ client
  methods: ['GET', 'POST', 'PATCH', 'DELETE'], // Các phương thức HTTP được phép
  allowedHeaders: ['Content-Type', 'Authorization'], // Các header được phép
}));

// Cho phép gửi data lên dạng JSON
app.use(express.json());

// Cấu hình lấy được cookie
app.use(cookieParser());

// Thiết lập đường dẫn
app.use('/', routes);

app.listen(port, () => {
  console.log(`Website đang chạy trên cổng ${port}`);
});