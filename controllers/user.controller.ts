import { Request, Response } from 'express';
import AccountUser from '../models/account-user.model';
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";

export const registerPost = async (req: Request, res: Response) => {
  const { fullName, email, password } = req.body;

  const existAccount = await AccountUser.findOne({
    email: email
  });

  if (existAccount) {
    res.json({
      code: "error",
      message: "Email đã tồn tại trong hệ thống!"
    });
    return;
  }

  // Mã hóa mật khẩu trước khi lưu vào database
  const salt = await bcrypt.genSalt(10); // Tạo salt chuỗi ngẫu nhiên gồm 10 ký tự
  const hashedPassword = await bcrypt.hash(password, salt); // Mã hóa mật khẩu bằng cách kết hợp với salt

  const newAccount = new AccountUser({
    fullName: fullName,
    email: email,
    password: hashedPassword, // Lưu mật khẩu đã được mã hóa vào database
  });

  await newAccount.save();

  res.json({
    code: "success",
    message: "Đăng ký tài khoản thành công!"
  });
}

export const loginPost = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const existAccount = await AccountUser.findOne({
    email: email
  }); 

  if (!existAccount) {
    res.json({
      code: "error",
      message: "Email không tồn tại trong hệ thống!"
    });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, `${existAccount.password}`); // So sánh mật khẩu nhập vào với mật khẩu đã được mã hóa trong database

  if (!isPasswordValid) {
    res.json({
      code: "error",
      message: "Mật khẩu không chính xác!"
    });
    return;
  }

  // Tạo JWT
  const token = jwt.sign(
    {
      id: existAccount.id,
      email: existAccount.email,
    },
    `${process.env.JWT_SECRET}`,
    { expiresIn: '1d' } // Token có thời hạn 1 ngày
  );

  // Lưu token vào cookie
  res.cookie("token", token, {
    maxAge: 24 * 60 * 60 * 1000, // Token có hiệu lực trong 1 ngày
    httpOnly: true, // Chỉ cho phép cookie được truy cập bởi server
    sameSite: "lax", // Cho phép gửi cookie giữa các tên miền
    secure: process.env.NODE_ENV === "production" // true: web có https, false: web không có https
  });


  res.json({
    code: "success",
    message: "Đăng nhập thành công!"
  });
}