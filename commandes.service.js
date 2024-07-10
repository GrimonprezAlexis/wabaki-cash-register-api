'use strict';
const mongoose = require('mongoose');
const Commande = require('./commandes');
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
            const commande = await Commande.findById(commandeId).exec();
            if (!commande) {
                CommonService.handleNotFoundError(res, `No commande found with id ${commandeId}`);
            } else {
                CommonService.sendSuccessResponse(res, commande);
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
            'productsIds',
            'orderType',
            'etat'
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
};
