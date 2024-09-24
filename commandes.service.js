'use strict';
const mongoose = require('mongoose');
const Commande = require('./models/commande');
const CommonService = require('./common.service');
const { _ } = require('lodash');
module.exports.CommandesService = class CommandesService {

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
            'orderType',
            'etat',
            'paymentStatus',
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
            CommonService.sendSuccessResponse(res, {id: savedCommande.idCommande});
        } catch (error) {
            CommonService.handleError(res, error, 'Error creating project');
        }
    }


    async extendCommande(req, res) {
        const { params, body } = req;

        CommonService.checkRequiredProperties(params, ['idCommande']);
        CommonService.checkRequiredProperties(body, [
            'extendProducts'
        ]);
    
        try {
            const existingCommande = await Commande.findOne({ idCommande: params.idCommande });
            if (!existingCommande) {
                return CommonService.sendErrorResponse(res, "Commande not found", 404);
            }
            existingCommande.products = body.extendProducts.map(product => ({
                _id: new mongoose.Types.ObjectId(),
                ...product
            }));;
    
            // Step 3: Optionally, recalculate the total price based on new products added
            const newTotalPrice = existingCommande.products.reduce((total, product) => {
                return total + (product.price * product.quantity);
            }, 0);

            // Update the total price in the commande
            existingCommande.totalPrice = newTotalPrice;    
            const updatedCommande = await existingCommande.save();
    
            // Step 5: Send success response with updated commande details
            CommonService.sendSuccessResponse(res, { id: updatedCommande.idCommande});
        } catch (error) {
            CommonService.handleError(res, error, 'Error extending commande');
        }
    }
    

};
