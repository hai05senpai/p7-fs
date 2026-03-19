import { Request, Response } from "express";
import Job from "../models/job.model";
import AccountCompany from "../models/account-company.model";
import CV from "../models/cv.model";

export const detail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const record = await Job.findOne({
      _id: id,
    });

    if(!record){
      return res.json({
        code: "error",
        message: "Công việc không tồn tại",
      });
    }

    const jobDetail = {
      id: record._id,
      title: record.title,
      companyName: "",
      salaryMin: record.salaryMin,
      salaryMax: record.salaryMax,
      images: record.images,
      position: record.position,
      workingFrom: record.workingFrom,
      companyAddress: "",
      technologies: record.technologies,
      description: record.description,
      companyLogo: "",
      companyId: record.companyId,
      companyModel: "",
      companyEmployees: "",
      companyWorkingTime: "",
      companyWorkOvertime: "",
    };

    const infoCompany = await AccountCompany.findOne({
      _id: record.companyId,
    });

    if(infoCompany){
      jobDetail.companyName = `${infoCompany.companyName}`;
      jobDetail.companyAddress = `${infoCompany.address}`;
      jobDetail.companyLogo = `${infoCompany.logo}`;
      jobDetail.companyModel = `${infoCompany.companyModel}`;
      jobDetail.companyEmployees = `${infoCompany.companyEmployees}`;
      jobDetail.companyWorkingTime = `${infoCompany.workingTime}`;
      jobDetail.companyWorkOvertime = `${infoCompany.workOvertime}`;
    }

    res.json({
      code: "success",
      message: "Lấy chi tiết công việc thành công",
      jobDetail: jobDetail,
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Lấy chi tiết công việc thất bại",
    });
  }
}

export const applyPost = async (req: Request, res: Response) => {
  if(!req.file) {
    return res.json({
      code: "error",
      message: "Vui lòng tải lên file CV định dạng PDF!",
    });
  }
  req.body.fileCV = req.file.path;

  const newRecord = new CV(req.body);
  await newRecord.save();

  res.json({
    code: "success",
    message: "Ứng tuyển thành công",
  });
}