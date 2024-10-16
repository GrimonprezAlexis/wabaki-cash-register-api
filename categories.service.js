'use strict';
const admin = require('firebase-admin');
const Category = require('./models/category');
const CommonService = require('./common.service');

module.exports.CategoriessService = class CategoriessService {
  
    async getCategories(res) {
        try {
          const db = admin.database();
          const categoriesRef = db.ref('categories');
  
          // Fetch all categories from Firebase
          const snapshot = await categoriesRef.once('value');
          const categoriesData = snapshot.val();
  
          // Check if categories exist
          if (!categoriesData) {
              return CommonService.sendSuccessResponse(res, {
                  message: 'No categories found',
                  categories: [],
              });
          }
          
          const categoryNames = Object.values(categoriesData).map(category => category.name.toUpperCase());
          const uniqueCategories = [...new Set(categoryNames)];

          return CommonService.sendSuccessResponse(res, {
              message: 'Categories fetched successfully',
              categories: uniqueCategories,
            });
    
        } catch (error) {
          CommonService.handleError(res, error, 'Error fetching categories');
        }
      }
};
