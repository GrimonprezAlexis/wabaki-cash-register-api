const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx'); // Import the xlsx library
const CommonService = require('./common.service');

module.exports.CatalogueService = class CatalogueService {
    async convertXlsToJson(filePath, res) {
        try {
            const workbook = xlsx.readFile(filePath); // Read the Excel file
            const sheetName = workbook.SheetNames[0]; // Get the first sheet
            const worksheet = workbook.Sheets[sheetName];

            // Convert the sheet data to JSON format
            const jsonData = xlsx.utils.sheet_to_json(worksheet);

            const uniqueCategories = new Set();
            const products = [];

            const generateUniqueId = (() => {
                let idCounter = 1;
                return () => idCounter++;
            })();

            // Process each row in the Excel file
            jsonData.forEach(row => {
                if (Object.values(row).every(value => !value)) return; // Skip empty rows

                uniqueCategories.add(row['CATEGORIE']);

                products.push({
                    id: generateUniqueId(),
                    name: row['NOM'],
                    category: row['CATEGORIE'],
                    price: parseFloat(row['PRIX']),
                    photo: row['PHOTO'] || null,
                });
            });

            // Define paths for output JSON files in /tmp directory
            const tempDirectory = '/tmp'; // Use the /tmp directory for temp files
            const jsonProductsFileName = path.join(tempDirectory, 'products.json');
            const jsonCategoriesFileName = path.join(tempDirectory, 'categories.json');

            // Helper function to write JSON data to file
            const writeToJSONFile = (fileName, data) => {
                const jsonData = JSON.stringify(data, null, 2);
                return new Promise((resolve, reject) => {
                    fs.writeFile(fileName, jsonData, (err) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(`JSON file '${fileName}' has been created.`);
                    });
                });
            };

            // Write the products and categories to JSON files in the /tmp directory
            await writeToJSONFile(jsonProductsFileName, products);
            await writeToJSONFile(jsonCategoriesFileName, [...uniqueCategories]);

            // Send response with success message and file paths
            CommonService.sendSuccessResponse(res, {
                message: 'XLS successfully converted to JSON',
                productsFile: jsonProductsFileName,
                categoriesFile: jsonCategoriesFileName,
            });

        } catch (error) {
            CommonService.handleError(res, error, 'Error converting XLS to JSON');
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
};
