const fs = require('fs'); 
const path = require('path');
const xlsx = require('xlsx'); // Import the xlsx library
const admin = require('firebase-admin');
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
            const catalogues = [];

            // Collect categories and catalogues from Excel file
            jsonData.forEach(row => {
                if (Object.values(row).every(value => !value)) return;
                uniqueCategories.add(row['CATEGORIE']);
                catalogues.push({
                    name: row['NOM'],
                    category: row['CATEGORIE'],
                    price: parseFloat(row['PRIX']),
                    photo: row['PHOTO'] || null,
                });
            });

            const db = admin.database();
            const categoriesRef = db.ref('categories');
            const cataloguesRef = db.ref('catalogues');

            // Save categories to Firebase Realtime Database
            const categoryPromises = [];
            uniqueCategories.forEach(category => {
                categoryPromises.push(categoriesRef.push({ name: category }));
            });
            await Promise.all(categoryPromises);

            // Save catalogues to Firebase Realtime Database
            const cataloguePromises = catalogues.map(product => {
                return cataloguesRef.push({
                    name: product.name,
                    category: product.category,
                    price: product.price,
                    photo: product.photo,
                });
            });
            await Promise.all(cataloguePromises);
            
            // Send success response
            CommonService.sendSuccessResponse(res, {
                message: 'XLS successfully converted to JSON and saved to the database',
                totalProducts: catalogues.length,
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

    async getCataloguesGroupedByCategory(res) {
        try {
            const db = admin.database();
            const cataloguesRef = db.ref('catalogues');
            const categoriesRef = db.ref('categories');

            // Step 1: Fetch all catalogues and categories from Firebase
            const cataloguesSnapshot = await cataloguesRef.once('value');
            const categoriesSnapshot = await categoriesRef.once('value');

            const catalogues = cataloguesSnapshot.val();
            const categories = categoriesSnapshot.val();

            // Check if catalogues exist
            if (!catalogues) {
                return CommonService.sendSuccessResponse(res, {
                    message: 'No catalogues found',
                    catalogues: [],
                    totalCatalogues: 0,
                });
            }

            // Step 2: Group catalogues by category
            const groupedCatalogue = Object.keys(catalogues).reduce((acc, key) => {
                const product = catalogues[key];
                const categoryName = product.category;

                if (!acc[categoryName]) acc[categoryName] = [];
                acc[categoryName].push({
                    id: key,
                    name: product.name,
                    price: product.price,
                    photo: product.photo,
                    icon: this.getIconForCategory(categoryName),                  
                });

                return acc;
            }, {});

            // Step 3: Return the grouped catalogues
            return CommonService.sendSuccessResponse(res, {
                message: 'Catalogue fetched successfully',
                catalogue: groupedCatalogue,
                totalCatalogues: Object.keys(catalogues).length,
            });

        } catch (error) {
            CommonService.handleError(res, error, 'Error fetching catalogue');
        }
    }
    
    async getCataloguesWithIcons(res) {
        try {
            const db = admin.database();
            const cataloguesRef = db.ref('catalogues');
            const categoriesRef = db.ref('categories');

            // Fetch all catalogues from Firebase
            const cataloguesSnapshot = await cataloguesRef.once('value');
            const cataloguesData = cataloguesSnapshot.val();

            // Fetch all categories from Firebase
            const categoriesSnapshot = await categoriesRef.once('value');
            const categoriesData = categoriesSnapshot.val();

            // Check if there are any products
            if (!cataloguesData) {
                return CommonService.sendSuccessResponse(res, {
                    message: 'No products found',
                    products: [],
                    totalProducts: 0,
                });
            }

            // Map the catalogues to include the category name and icon
            const productList = Object.keys(cataloguesData).map(key => {
                const product = cataloguesData[key];

                return {
                    id: key,
                    name: product.name,
                    category: product.category,
                    price: product.price,
                    photo: product.photo,
                    icon: this.getIconForCategory(product.category),
                };
            });

            // Send success response with the product list
            return CommonService.sendSuccessResponse(res, {
                message: 'Catalogue with icons fetched successfully',
                products: productList,
                totalProducts: productList.length,
            });

        } catch (error) {
            // Handle any errors during the process
            CommonService.handleError(res, error, 'Error fetching catalogue with icons');
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

};
