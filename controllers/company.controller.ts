import { Request, Response } from "express";
import AccountCompany from "../models/account-company.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AccountRequest } from '../interfaces/request.interface';
import Job from "../models/job.model";
import City from "../models/city.model";
import CV from "../models/cv.model";

export const registerPost = async (req: Request, res: Response) => {
  const { companyName, email, password } = req.body;

  const existAccount = await AccountCompany.findOne({
    email: email
  });

  if(existAccount) {
    res.json({
      code: "error",
      message: "Email đã tồn tại trong hệ thống!"
    });
    return;
  }

  // Mã hóa mật khẩu với bcrypt
  const salt = await bcrypt.genSalt(10); // Tạo salt - Chuỗi ngẫu nhiên có 10 ký tự
  const hashedPassword = await bcrypt.hash(password, salt); // Mã hóa mật khẩu

  const newAccount = new AccountCompany({
    companyName: companyName,
    email: email,
    password: hashedPassword
  });

  await newAccount.save();

  res.json({
    code: "success",
    message: "Đăng ký tài khoản thành công!",
  });
}

export const loginPost = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Kiểm tra xem email có tồn tại không
  const existAccount = await AccountCompany.findOne({
    email: email
  });

  if(!existAccount) {
    res.json({
      code: "error",
      message: "Email không tồn tại trong hệ thống!"
    });
    return;
  }

  // Kiểm tra mật khẩu
  const isPasswordValid = await bcrypt.compare(password, `${existAccount.password}`);
  if (!isPasswordValid) {
    res.json({
      code: "error",
      message: "Mật khẩu không đúng!"
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
    secure: process.env.NODE_ENV === "production", // true nếu môi trường production, false nếu môi trường development
    sameSite: "lax", // Cho phép gửi cookie giữa các domain
  });

  res.json({
    code: "success",
    message: "Đăng nhập thành công!",
  });
}

export const profilePatch = async (req: AccountRequest, res: Response) => {
  if(req.file) {
    req.body.logo = req.file.path; // Lưu đường dẫn ảnh vào trường logo của tài khoản
  } else {
    delete req.account.logo; // Nếu không có ảnh mới, xóa trường logo để giữ logo cũ
  }

  await AccountCompany.updateOne({
    _id: req.account._id
  }, req.body);

  res.json({
    code: "success",
    message: "Cập nhật thông tin công ty thành công!"
  });
}

export const createJobPost = async (req: AccountRequest, res: Response) => {
  req.body.companyId = req.account.id;
  req.body.salaryMin = req.body.salaryMin ? parseInt(req.body.salaryMin) : 0;
  req.body.salaryMax = req.body.salaryMax ? parseInt(req.body.salaryMax) : 0;
  req.body.technologies = req.body.technologies ? req.body.technologies.split(", ") : [];
  req.body.images = [];

  // Xử lý mảng images
  if(req.files) {
    for (const file of req.files as any[]) {
      req.body.images.push(file.path);
    }
  }
  // Hết Xử lý mảng images

  const newRecord = new Job(req.body);
  await newRecord.save();
  
  res.json({
    code: "success",
    message: "Tạo công việc thành công!"
  });
}

export const jobList = async (req: AccountRequest, res: Response) => {
  const find = {
    companyId: req.account.id
  };

  // Phân trang
  const limitItems = 2;
  
  let page = 1;
  if(req.query.page){
    const currentPage = parseInt(req.query.page as string);
    if(currentPage > 0){
      page = currentPage;
    }
    else{
      page = 1;
    }
  }

  const totalRecords = await Job.countDocuments(find);
  const totalPages = Math.ceil(totalRecords / limitItems);

  const skip = (page - 1) * limitItems;
  // Hết phân trang

  const jobs = await Job
    .find(find)
    .sort({ createdAt: "desc" })
    .limit(limitItems)
    .skip(skip)

  const city = await City.findOne({
    _id: req.account.city
  });

  const dataFinal = [];
  
  for(const job of jobs) {
    dataFinal.push({
      id: job._id,
      companyLogo: req.account.logo,
      title: job.title,
      companyName: req.account.companyName,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      position: job.position,
      workingFrom: job.workingFrom,
      companyCity: city ? city.name : "Đang cập nhật",
      technologies: job.technologies
    });
  }

  res.json({
    code: "success",
    message: "Lấy danh sách công việc thành công!",
    jobs: dataFinal,
    totalPage: totalPages,
  });
}

export const editJob = async (req: AccountRequest, res: Response) => {
  try {
    const id = req.params.id;

    const jobDetail = await Job.findOne({
      _id: id,
      companyId: req.account.id
    });

    if(!jobDetail) {
      res.json({
        code: "error",
        message: "Công việc không tồn tại trong hệ thống!"
      });
      return;
    }

    res.json({
      code: "success",
      message: "Lấy thông tin công việc thành công!",
      job: jobDetail
    });
  } catch (error) {
    console.error(error);
    res.json({
      code: "error",
      message: "Lấy thông tin công việc thất bại!"
    });
  }
}

export const editJobPatch = async (req: AccountRequest, res: Response) => {
  try {
    const id = req.params.id;

    const jobDetail = await Job.findOne({
      _id: id,
      companyId: req.account.id
    });

    if(!jobDetail) {
      res.json({
        code: "error",
        message: "Công việc không tồn tại trong hệ thống!"
      });
      return;
    }

    req.body.salaryMin = req.body.salaryMin ? parseInt(req.body.salaryMin) : 0;
    req.body.salaryMax = req.body.salaryMax ? parseInt(req.body.salaryMax) : 0;
    req.body.technologies = req.body.technologies ? req.body.technologies.split(", ") : [];

    // Xử lý mảng images
    req.body.images = [];
    if(req.files) {
      for (const file of req.files as any[]) {
        req.body.images.push(file.path);
      }
    }
    // Hết Xử lý mảng images

    await Job.updateOne({
      _id: id,
      companyId: req.account.id
    }, req.body);

    res.json({
      code: "success",
      message: "Cập nhật công việc thành công!"
    });
  } catch (error) {
    console.error(error);
    res.json({
      code: "error",
      message: "Cập nhật công việc thất bại!"
    });
  }
}

export const deleteJobDel = async (req: AccountRequest, res: Response) => {
  try {
    const id = req.params.id;

    await Job.deleteOne({
      _id: id,
      companyId: req.account.id
    });

    res.json({
      code: "success",
      message: "Xóa công việc thành công!"
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Xóa công việc thất bại!"
    });
  }
}

export const listCompany = async (req: Request, res: Response) => {
  let limitItems = 2;
  if(req.query.limit){
    limitItems = parseInt(req.query.limit as string);
  }

  // Phân trang
  let page = 1;
  if(req.query.page){
    const currentPage = parseInt(req.query.page as string);
    if(currentPage > 0){
      page = currentPage;
    }
    else{
      page = 1;
    }
  }

  const totalRecords = await AccountCompany.countDocuments({});
  const totalPages = Math.ceil(totalRecords / limitItems);

  const skip = (page - 1) * limitItems;
  // Hết phân trang

  const companyList = await AccountCompany
    .find()
    .sort({ createdAt: "desc" })
    .limit(limitItems)
    .skip(skip)

  const companyListFinal = [];
  for(const company of companyList) {
    const dataFinal = {
      id: company._id,
      companyName: company.companyName,
      logo: company.logo,
      cityName: "",
      totalJob: 0
    };

    // Thành phố
    if(company.city) {
      const city = await City.findOne({
        _id: company.city
      });
      dataFinal.cityName = `${city ? city.name : "Đang cập nhật"}`;
    }

    // Tổng công việc
    const totalJob = await Job.countDocuments({
      companyId: company.id
    });
    dataFinal.totalJob = totalJob;

    companyListFinal.push(dataFinal);
  }

  res.json({
    code: "success",
    message: "Lấy danh sách công ty thành công!",
    companyList: companyListFinal,
    totalPage: totalPages,
  });
}

export const detail = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    
    const companyDetail = await AccountCompany.findOne({
      _id: id
    });

    if(!companyDetail) {
      res.json({
        code: "error",
        message: "Công ty không tồn tại trong hệ thống!"
      });
      return;
    }

    // Thông tin công ty
    const companyDetailFinal = {
      id: companyDetail.id,
      companyName: companyDetail.companyName,
      logo: companyDetail.logo,
      address: companyDetail.address,
      companyModel: companyDetail.companyModel,
      companyEmployees: companyDetail.companyEmployees,
      workingTime: companyDetail.workingTime,
      workOvertime: companyDetail.workOvertime,
      description: companyDetail.description,
    };

    // Danh sách công việc
    const jobs = await Job
      .find({
        companyId: companyDetail.id
      })  
      .sort({
        createdAt: "desc" 
      });

    const city = await City.findOne({
      _id: companyDetail.city
    });

    const dataFinal = [];
  
    for(const job of jobs) {
      dataFinal.push({
        id: job._id,
        companyLogo: companyDetail.logo,
        title: job.title,
        companyName: companyDetail.companyName,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        position: job.position,
        workingFrom: job.workingFrom,
        cityName: city ? city.name : "Đang cập nhật",
        technologies: job.technologies
      });
    }

    res.json({
      code: "success",
      message: "Lấy thông tin công ty thành công!",
      company: companyDetailFinal,
      jobs: dataFinal
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Lấy thông tin công ty thất bại!"
    });
  }
}

export const listCV = async (req: AccountRequest, res: Response) => {
  const companyId = req.account.id;
  
  const listJob = await Job.find({
    companyId: companyId
  });

  const listJobId = listJob.map(job => job.id);

  const listCV = await CV
    .find({
      jobId: { $in: listJobId }
    }).sort({
      createdAt: "desc"
    });

  const cvListFinal = [];
  for(const cv of listCV) {
    const dataFinal = {
      id: cv.id,
      jobTitle: "",
      fullName: cv.fullName,
      email: cv.email,
      phone: cv.phone,
      jobSalaryMin: 0,
      jobSalaryMax: 0,
      jobPosition: "",
      jobWorkingFrom: "",
      viewed: cv.viewed,
      status: cv.status,
    };
    const job = await Job.findOne({
      _id: cv.jobId
    });
    if(job) {
      dataFinal.jobTitle = `${job.title}`;
      dataFinal.jobSalaryMin = job.salaryMin || 0;
      dataFinal.jobSalaryMax = job.salaryMax || 0;
      dataFinal.jobPosition = `${job.position}`;
      dataFinal.jobWorkingFrom = `${job.workingFrom}`;
    }
    cvListFinal.push(dataFinal);
  }

  res.json({
    code: "success",
    message: "Lấy danh sách CV thành công!",
    cvList: cvListFinal
  });
}

export const detailCV = async (req: AccountRequest, res: Response) => {
  try {
    const companyId = req.account.id;
    const cvId = req.params.id;

    const infoCV = await CV.findOne({
      _id: cvId
    })

    if(!infoCV) {
      res.json({
        code: "error",
        message: "Thất bại"
      })
      return;
    }

    const infoJob = await Job.findOne({
      _id: infoCV.jobId,
      companyId: companyId
    })

    if(!infoJob) {
      res.json({
        code: "error",
        message: "Thất bại"
      })
      return;
    }

    const dataFinalCV = {
      fullName: infoCV.fullName,
      email: infoCV.email,
      phone: infoCV.phone,
      fileCV: infoCV.fileCV,
    };

    const dataFinalJob = {
      id: infoJob.id,
      title: infoJob.title,
      salaryMin: infoJob.salaryMin,
      salaryMax: infoJob.salaryMax,
      position: infoJob.position,
      workingForm: infoJob.workingFrom,
      technologies: infoJob.technologies,
    };

    // Cập nhật trạng thái thành đã xem
    await CV.updateOne({
      _id: cvId
    }, {
      viewed: true
    })
    res.json({
      code: "success",
      message: "Thành công!",
      infoCV: dataFinalCV,
      infoJob: dataFinalJob
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Id không hợp lệ!"
    })
  }
}

export const changeStatusPatch = async (req: AccountRequest, res: Response) => {
  try {
    const companyId = req.account.id;
    const status = req.body.action;
    const cvId = req.body.id;

    const infoCV = await CV.findOne({
      _id: cvId
    })

    if(!infoCV) {
      res.json({
        code: "error",
        message: "Thất bại!"
      })
      return;
    }

    const infoJob = await Job.findOne({
      _id: infoCV.jobId,
      companyId: companyId
    })

    if(!infoJob) {
      res.json({
        code: "error",
        message: "Thất bại!"
      })
      return;
    }

    await CV.updateOne({
      _id: cvId
    }, {
      status: status
    })

    res.json({
      code: "success",
      message: "Thành công!"
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Id không hợp lệ!"
    })
  }
}
