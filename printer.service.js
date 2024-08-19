
const CommonService = require('./common.service');

const escpos = require('escpos');
escpos.Network = require('escpos-network'); // for network printers

module.exports.PrinterService = class PrinterService { 

    generateTicketHTML = (orderType, products, tableNumber) => {
        return `
          <html>
          <body style="font-family: Arial, sans-serif;">
            <h1 style="text-align: center;">Order Ticket</h1>
            <p>Table: ${tableNumber}</p>
            <p>Order Type: ${orderType.type}</p>
            <hr>
            ${products.map(product => `
              <p>${product.name} x${product.quantity}</p>
              <p>Price: ${product.price}€</p>
            `).join('')}
            <hr>
            <p style="text-align: center;">Thank you!</p>
          </body>
          </html>
        `;
      };

    async test(body, res){
        CommonService.checkRequiredProperties(body, [
            'printerIP'
        ]);
        try {
            const device  = new escpos.Network(body.printerIP);
            const printer = new escpos.Printer(device);
            device.open(() => {
                printer.text('Test Print').cut().close();
                CommonService.sendSuccessResponse(res, {message: "Print successful"});
            });
        } catch (error) {
            CommonService.handleError(res, error, 'Failed to print ticket');
        }
    }


    async printCommande(body, res){
        CommonService.checkRequiredProperties(body, [
            'orderType',
            'products',
            'tableNumber'
        ]);
        try {
            const device  = new escpos.Network(body.printerIP);
            const printer = new escpos.Printer(device);
        
            // Printing the ticket
            device.open(() => {
              printer
                .font('a')
                .align('ct')
                .style('b')
                .size(1, 1)
                .text('Order Ticket')
                .text(`Table: ${tableNumber}`)
                .text(`Order Type: ${orderType.type}`)
                .text('------------------------------');
        
              products.forEach(product => {
                printer
                  .align('lt')
                  .text(`${product.name} x${product.quantity}`)
                  .text(`Price: ${product.price}€`);
              });
        
              printer
                .text('------------------------------')
                .cut()
                .close();
            });
        
            // Generate the HTML for the preview
            const ticketHTML = generateTicketHTML(orderType, products, tableNumber);
        
            // Use Puppeteer to generate a preview image
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(ticketHTML);
            const screenshotBuffer = await page.screenshot({ fullPage: true });
            await browser.close();
        
            // Send the screenshot as a base64 encoded string
            res.status(200).json({
              message: 'Ticket printed successfully',
              preview: screenshotBuffer.toString('base64')
            });
        }
        catch (error) {
            console.error('Failed to print ticket:', error);
            res.status(500).send('Failed to print ticket');
        }

    }

}