import { Request, Response } from 'express';
import Job from '../models/job.model';
import { title } from 'node:process';
import AccountCompany from '../models/account-company.model';
import City from '../models/city.model';

export const search = async (req: Request, res: Response) => {
  const dataFinal = [];
  if(Object.keys(req.query).length > 0) {
    const find: any = {};
    if(req.query.language) {
      find.technologies = req.query.language;
    }

    const jobs = await Job
      .find(find)
      .sort({
        createdAt: "desc" 
      })

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
    jobs: dataFinal
  });
}