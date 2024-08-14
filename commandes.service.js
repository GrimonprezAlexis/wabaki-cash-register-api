'use strict';
const mongoose = require('mongoose');
const Commande = require('./commandes');
const CommonService = require('./common.service');
const { _ } = require('lodash');

const escpos = require('escpos');
escpos.Network = require('escpos-network');
const device = new escpos.Network('192.168.0.100');
const printer = new escpos.Printer(device);

escpos.USB = require('escpos-usb');

module.exports.CommandesService = class CommandesService {

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

    async getCommandes(req, res) {
        try {
            const result = await Commande.find().exec();
            CommonService.sendSuccessResponse(res, result);
        } catch (error) {
            CommonService.handleError(res, error, 'Error fetching commandes');
        }
    }
     
    async getCommandeById(req, res) {
        const commandeId = req.params.id;
        try {
            const commande = await Commande.find({idCommande: commandeId}).exec();
            if (!commande) {
                CommonService.handleNotFoundError(res, `No commande found with id ${commandeId}`);
            } else {
                CommonService.sendSuccessResponse(res, commande[0]);
            }
        } catch (err) {
            CommonService.handleError(res, err, 'Error fetching commande by ID');
        }
    }

    async createCommande(body, res) {
        CommonService.checkRequiredProperties(body, [
            'idCommande',
            'isoDateCommande',
            'tableNumber',
            'products',
            'productsIds',
            'orderType',
            'etat',
            'totalPrice'
            // idClient?: string;
            // paymentMean?: "CASH" | "CB";
            // orderType: OrderType;
        ]);

        try {
            const newCommande = new Commande({
                _id: new mongoose.Types.ObjectId(),
                ...body
            });
            const savedCommande = await newCommande.save();
            CommonService.sendSuccessResponse(res, {id: savedCommande._id});
        } catch (error) {
            CommonService.handleError(res, error, 'Error creating project');
        }
    }     

    async printCommande(body, res){
        CommonService.checkRequiredProperties(body, [
            'orderType',
            'products',
            'tableNumber'
        ]);
        try {
            const device = new escpos.USB();
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
};
