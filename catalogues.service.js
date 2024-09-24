const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx'); // Import the xlsx library
const CommonService = require('./common.service');
const Catalogue = require('./models/catalogue');
const Category = require('./models/category');

module.exports.CatalogueService = class CatalogueService {
    async convertXlsToJson(filePath, res) {
        try {
            const workbook = xlsx.readFile(filePath); // Read the Excel file
            const sheetName = workbook.SheetNames[0]; // Get the first sheet
            const worksheet = workbook.Sheets[sheetName];

            // Convert the sheet data to JSON format
            const jsonData = xlsx.utils.sheet_to_json(worksheet);

            const uniqueCategories = new Set();
            const catlogues = [];

            // Collect categories and catlogues from Excel file
            jsonData.forEach(row => {
                if (Object.values(row).every(value => !value)) return; // Skip empty rows

                uniqueCategories.add(row['CATEGORIE']);

                catlogues.push({
                    name: row['NOM'],
                    category: row['CATEGORIE'],
                    price: parseFloat(row['PRIX']),
                    photo: row['PHOTO'] || null,
                });
            });

            // Insert categories and catlogues into MongoDB
            const categoryMap = {};
            const productPromises = [];

            // Save unique categories to the database
            for (const categoryName of uniqueCategories) {
                let category = await Category.findOne({ name: categoryName });

                if (!category) {
                    category = new Category({ name: categoryName });
                    await category.save();
                }

                categoryMap[categoryName] = category._id;
            }

            // Save catlogues to the database
            for (const product of catlogues) {
                const productData = {
                    name: product.name,
                    category: categoryMap[product.category], // Use the category ID
                    price: product.price,
                    photo: product.photo,
                };

                const newProduct = new Catalogue(productData);
                productPromises.push(newProduct.save());
            }

            // Wait for all catlogues to be saved
            await Promise.all(productPromises);

            // Send success response
            CommonService.sendSuccessResponse(res, {
                message: 'XLS successfully converted to JSON and saved to the database',
                totalProducts: catlogues.length,
                totalCategories: uniqueCategories.size,
            });

        } catch (error) {
            CommonService.handleError(res, error, 'Error converting XLS to JSON and saving to the database');
        } finally {
            // Optionally delete the uploaded file after processing to save space
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Error deleting file: ${err.message}`);
                }
            });
        }
    }

    // Endpoint to download the example XLS file
    async downloadExampleXls(res) {
        const filePath = path.join(__dirname, './Menu.xlsx'); // Make sure the file exists in this path
        res.download(filePath, 'Exemple_Menu.xlsx', (err) => {
            if (err) {
                console.error('Error while downloading the file:', err);
                CommonService.handleError(res, err, 'Error downloading file.');
            }
        });
    }

    async getCatalogueGroupedByCategory(res) {
        try {
            // Find all catlogues and populate the category information
            const catlogues = await Catalogue.find().populate('category').exec();

            // Check if catlogues exist
            if (!catlogues || catlogues.length === 0) {
                return CommonService.sendSuccessResponse(res, {
                    message: 'No catlogues found',
                    catlogues: [],
                    totalCatalogues: 0,
                });
            }

            // Group catlogues by category
            const groupedCatalogue = catlogues.reduce((acc, product) => {
                const categoryName = product.category.name;
                if (!acc[categoryName]) acc[categoryName] = [];
                acc[categoryName].push({
                    id: product._id,
                    name: product.name,
                    price: product.price,
                    photo: product.photo,
                });

                return acc;
            }, {});

            return CommonService.sendSuccessResponse(res, {
                message: 'Catalogue fetched successfully',
                catalogue: groupedCatalogue,
                totalCatalogues: catlogues.length,
            });
        } catch (error) {
            CommonService.handleError(res, error, 'Error fetching catalogue');
        }
    }
    getIconForCategory(categoryName) {
        const categoryIcons = {
            SUSHI: "🍣",
            SASHIMI: "🍥",
            MAKI: "🍙",
            CALIFORNIA: "🍣",
            CROUSTY: "🍤",
            SANDWICH: "🥪",
            SPRING_ROLL: "🥢",
            SNOW_ROLL: "❄️",
            ROLL: "🍣",
            CHIRASHI: "🍚",
            POKEBOWL: "🥗",
            BENTO: "🍱",
            PLATEAU: "🍽️",
            BOX: "📦",
            GYOZA: "🥟",
            BROCHETTE: "🍢",
            ACCOMPAGNEMENT: "🍚",
            DESSERT: "🍰",
            BOISSON: "🥤",
        };
    
        return categoryIcons[categoryName.toUpperCase()] || "";
    }
    
      async getCatalogueWithIcons(res) {
        try {
          const products = await Catalogue.find().populate('category').exec();    
          if (!products || products.length === 0) {
            return CommonService.sendSuccessResponse(res, {
              message: 'No products found',
              products: [],
              totalProducts: 0,
            });
          }    
          const productList = products.map(product => ({
            id: product._id,
            name: product.name,
            category: product.category.name,
            price: product.price,
            photo: product.photo,
            icon: this.getIconForCategory(product.category.name)
          }));
    
          return CommonService.sendSuccessResponse(res, {
            message: 'Catalogue with icons fetched successfully',
            products: productList,
            totalProducts: products.length,
          });
    
        } catch (error) {
          CommonService.handleError(res, error, 'Error fetching catalogue with icons');
        }
      }


};
