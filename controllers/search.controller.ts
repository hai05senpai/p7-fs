import { Request, Response } from 'express';
import Job from '../models/job.model';
import { title } from 'node:process';
import AccountCompany from '../models/account-company.model';
import City from '../models/city.model';

export const search = async (req: Request, res: Response) => {
  const dataFinal = [];
  let totalPage = 1;
  if(Object.keys(req.query).length > 0) {
    const find: any = {};
    if(req.query.language) {
      find.technologies = req.query.language;
    }

    if(req.query.city) {
      const city = await City.findOne({
        name: req.query.city
      });
      if(city) {
        const listCompaniesInCity = await AccountCompany.find({
          city: city.id
        });
        const listIdCompanyInCity = listCompaniesInCity.map(item => item.id.toString());
        find.companyId = {
          $in: listIdCompanyInCity
        }
      }
    }

    if(req.query.company) {
      const company = await AccountCompany.findOne({
        companyName: req.query.company
      });
      find.companyId = company?.id.toString();
    }

    if(req.query.keyword) {
      const keywordRegex = new RegExp(req.query.keyword.toString(), 'i'); // 'i' để tìm kiếm không phân biệt hoa thường
      find.title = keywordRegex;
    }

    if(req.query.position) {
      find.position = req.query.position;
    }

    if(req.query.workingFrom) {
      find.workingFrom = req.query.workingFrom;
    }

    //Phân trang
    const page = parseInt(req.query.page as string) || 1; // Trang hiện tại, mặc định là 1
    const limit = 2; // Số lượng bản ghi trên mỗi trang
    const totalJobs = await Job.countDocuments(find); // Tổng số lượng việc làm phù hợp với điều kiện tìm kiếm
    totalPage = Math.ceil(totalJobs / limit); // Tổng số trang

    // Kiểm tra nếu page vượt quá tổng số trang, trả về trang cuối cùng
    const currentPage = page > totalPage ? totalPage : page;
    const skip = (currentPage - 1) * limit; // Số lượng bản ghi cần bỏ qua
    // Hêt phân trang

    const jobs = await Job
      .find(find)
      .sort({
        createdAt: "desc" 
      })
      .limit(limit)
      .skip(skip)

    for(const job of jobs) {
      const itemFinal = {
        id: job.id,
        companyLogo: "",
        title: job.title,
        companyName: "",
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        position: job.position,
        workingFrom: job.workingFrom,
        cityName: "",
        technologies: job.technologies,
      };
      // Thông tin công ty
      const company = await AccountCompany.findOne({
        _id: job.companyId
      });

      if(company) {
        itemFinal.companyLogo = `${company.logo}`;
        itemFinal.companyName = `${company.companyName}`;

        const city = await City.findOne({
          _id: company.city
        });

        if(city) {
          itemFinal.cityName = `${city.name}`;
        }
      }

      dataFinal.push(itemFinal);
    }
  }
  res.json({
    code: "success",
    message: 'Tìm kiếm thành công!',
    jobs: dataFinal,
    totalPage: totalPage,
  });
}