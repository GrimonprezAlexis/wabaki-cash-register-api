'use strict';
const Category = require('./models/category');
const CommonService = require('./common.service');

module.exports.CategoriessService = class CategoriessService {

    async getCategories(res) {
        try {
          const categories = await Category.find().distinct('name').exec();
    
          if (!categories || categories.length === 0) {
            return CommonService.sendSuccessResponse(res, {
              message: 'No categories found',
              categories: [],
            });
          }
    
          return CommonService.sendSuccessResponse(res, {
            message: 'Categories fetched successfully',
            categories: categories.map(category => category.toUpperCase()),
          });
    
        } catch (error) {
          CommonService.handleError(res, error, 'Error fetching categories');
        }
      }
};
