'use strict';
const mongoose = require('mongoose');
const Commande = require('./models/commande');
const CommonService = require('./common.service');
const { _ } = require('lodash');
const PayCommande = require('./models/commande');
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
            const commande = await Commande.findOne({ idCommande: commandeId }).exec();
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
            'products',
            'orderType',
            'etat',
            'paymentStatus',
            'totalPrice'
            // idClient?: string;
            // PaymentMethod?: "CASH" | "CB";
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
    };


    async extendCommande(req, res) {
        const { params, body } = req;

        CommonService.checkRequiredProperties(params, ['idCommande']);
        CommonService.checkRequiredProperties(body, [
            'extendProducts'
        ]);
    
        try {
            const existingCommande = await Commande.findOne({ idCommande: params.idCommande });
            if (!existingCommande) {
                CommonService.handleNotFoundError(res, `Commande ${params.idCommande} not found`);
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
    };

    async payCommande(req, res) {
        const { params, body } = req;
        CommonService.checkRequiredProperties(params, ['id']);
        CommonService.checkRequiredProperties(body, [
            'products',
            'paymentMethod',
            'totalPrice'
        ]);

        const { products, paymentMethod, totalPrice } = req.body;
        
        try {
            // Step 1: Check if the commande exists
            const existingCommande = await Commande.findOne({ idCommande: params.id }).exec();
            if (!existingCommande || existingCommande == null) {
                return CommonService.handleNotFoundError(res, `Commande ${params.idCommande} not found`);
            }
            
            // Step 2: Check if the commande has already been paid
            const alreadyPaidProduct = products.find((product) =>
                existingCommande.paidProducts.some((paidProduct) => paidProduct.id === product.id)
            );
            if (existingCommande?.paidProducts && alreadyPaidProduct) {
                return CommonService.handleError(res,  `The product with id ${alreadyPaidProduct.id} has already been paid.`,);
            }

            // Step 3: Check if the payment method is valid
            if (paymentMethod !== 'CASH' && paymentMethod !== 'CB') {
                return CommonService.handleError(res, `The payment method ${paymentMethod} is not valid.`,);
            }
                
            // Filtrer les produits payés
            const newPaidProducts = products.map(product => ({
                id: product.id,
                price: product.price,
                quantity: product.quantity,
                paymentMethod: paymentMethod
            }));

            existingCommande.paidProducts = [...existingCommande.paidProducts, ...newPaidProducts];
            existingCommande.totalPricePaid = (existingCommande.totalPricePaid || 0) + totalPrice;

            // Step 5: Update payment status if the total price is fully paid
            if (existingCommande.paidProducts.length === existingCommande.products.length) {
                existingCommande.paymentStatus = 'PAID';
            } else {
                existingCommande.paymentStatus = 'PARTIALLY_PAID';
            }

            // Mettre à jour la commande avec les informations de paiement
            if((existingCommande.totalPrice === existingCommande.totalPricePaid) || existingCommande.paymentStatus === 'PAID'){
                return CommonService.handleError(res, `The commande with id ${params.id} has already been paid.`,);
            }

            // Mettre à jour la commande dans la base de données en utilisant PayCommande
            const updatedCommande = await existingCommande.save();
    
            // Envoyer une réponse de succès
            return CommonService.sendSuccessResponse(res, {
                id: updatedCommande.idCommande,
                restToPay: (existingCommande.totalPrice - updatedCommande.totalPricePaid),
                paidProducts: updatedCommande.paidProducts
            }, 'Paiement effectué avec succès');
            
        }  catch (error) {
            console.error('Payment error:', error);
            return CommonService.handleError(res, error, 'Erreur lors du paiement');
            }
    };

};
