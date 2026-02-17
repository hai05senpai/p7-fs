import { Request, Response } from 'express';
import AccountUser from '../models/account-user.model';
import bcrypt from 'bcryptjs';

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