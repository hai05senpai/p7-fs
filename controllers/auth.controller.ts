import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import AccountUser from '../models/account-user.model';

export const check = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.token;

    if(!token) {
      res.clearCookie('token');
      res.json({
        code: "error",
        message: 'Token không hợp lệ!',
      });
      return;
    }

    const decoded = jwt.verify(token,`${process.env.JWT_SECRET}`) as jwt.JwtPayload;
    const { id, email } = decoded;

    const existAccount = await AccountUser.findOne({ 
      _id: id, 
      email: email 
    });

    if(!existAccount) {
      res.clearCookie('token');
      res.json({
        code: "error",
        message: 'Token không hợp lệ!',
      });
      return;
    }

    const infoUser = {
      id: existAccount._id,
      fullName: existAccount.fullName,
      email: existAccount.email,
    }

    res.json({
      code: "success",
      message: 'Token hợp lệ!',
      infoUser: infoUser,
    });
  } catch (error) {
    res.clearCookie('token');
    res.json({
      code: "error",
      message: 'Token không hợp lệ!',
    });
  }
}