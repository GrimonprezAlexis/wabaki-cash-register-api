'use strict';
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const Commande = require('./models/commande');
const CommonService = require('./common.service');
const { _ } = require('lodash');
const PayCommande = require('./models/commande');
module.exports.CommandesService = class CommandesService {

    async getCommandes(req, res) {
        try {
            const db = admin.database();
            const commandesRef = db.ref('commandes');
            const snapshot = await commandesRef.once('value');
            const commandes = snapshot.val();
            if (!commandes) return CommonService.handleNotFoundError(res, 'No commandes found');
            CommonService.sendSuccessResponse(res, commandes);
        } catch (error) {
            CommonService.handleError(res, error, 'Error fetching commandes');
        }
    }

    async getCommandeById(req, res) {
        const commandeId = req.params.id;
        try {
            const db = admin.database();
            const commandesRef = db.ref('commandes');
            const snapshot = await commandesRef.orderByChild('idCommande').equalTo(commandeId).once('value');
            const commandeData = snapshot.val();
            if (!commandeData) return CommonService.handleNotFoundError(res, `No commande found with id ${commandeId}`);
            const commande = Object.values(commandeData)[0]; 
            CommonService.sendSuccessResponse(res, commande);
        } catch (error) {
            CommonService.handleError(res, error, 'Error fetching commande by ID');
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
            const db = admin.database();
            const commandesRef = db.ref('commandes');
            const newCommandeRef = commandesRef.push();
            const newCommande = {
                idCommande: body.idCommande,
                isoDateCommande: body.isoDateCommande,
                tableNumber: body.tableNumber,
                products: body.products,
                orderType: body.orderType,
                etat: body.etat,
                paymentStatus: body.paymentStatus,
                totalPrice: body.totalPrice,
                createdAt: new Date().toISOString()
            };
            await newCommandeRef.set(newCommande);
            CommonService.sendSuccessResponse(res, { id: newCommandeRef.key });
        } catch (error) {
            CommonService.handleError(res, error, 'Error creating project');
        }
    };



    async extendCommande(req, res) {
        const { params, body } = req;

        CommonService.checkRequiredProperties(params, ['id']);
        CommonService.checkRequiredProperties(body, ['extendProducts']);
    
        try {
            const db = admin.database();
            const commandesRef = db.ref('commandes');
            
            // Step 1: Retrieve the existing commande by id
            const snapshot = await commandesRef.orderByChild('idCommande').equalTo(params.id).once('value');
            const commandeData = snapshot.val();

            if (!commandeData) {
                return CommonService.handleNotFoundError(res, `Commande ${params.idCommande} not found`);
            }

            // Step 2: Extract the existing commande
            const firebaseKey = Object.keys(commandeData)[0];
            const existingCommande = commandeData[firebaseKey];

            // Step 3: Add new products to the existing ones
            const extendedProducts = body.extendProducts.map(product => ({
                ...product
            }));

            existingCommande.products = [...existingCommande.products, ...extendedProducts];

            // Step 4: Recalculate the total price
            const newTotalPrice = existingCommande.products.reduce((total, product) => {
                return total + (product.price * product.quantity);
            }, 0);

            existingCommande.totalPrice = newTotalPrice;

            // Step 5: Update the commande in Firebase
            await commandesRef.child(firebaseKey).update({
                products: existingCommande.products,
                totalPrice: newTotalPrice
            });

            // Send the updated response
            CommonService.sendSuccessResponse(res, { id: params.idCommande });

        } catch (error) {
            CommonService.handleError(res, error, 'Error extending commande');
        }
    };

    async payCommande(req, res) {
        const { params, body } = req;

        // Check required properties
        CommonService.checkRequiredProperties(params, ['id']);
        CommonService.checkRequiredProperties(body, ['products', 'paymentMethod', 'totalPrice']);

        const { products, paymentMethod, totalPrice } = body;

        try {
            const db = admin.database();
            const commandesRef = db.ref('commandes');

            // Step 1: Retrieve the existing commande by id
            const snapshot = await commandesRef.orderByChild('idCommande').equalTo(params.id).once('value');
            const commandeData = snapshot.val();

            if (!commandeData) {
                return CommonService.handleNotFoundError(res, `Commande ${params.id} not found`);
            }

            // Extract the existing commande and Firebase key
            const firebaseKey = Object.keys(commandeData)[0];
            const existingCommande = commandeData[firebaseKey];

            // Step 2: Check if the products are already paid
            const alreadyPaidProduct = products.find((product) =>
                existingCommande.paidProducts?.some((paidProduct) => paidProduct.id === product.id)
            );
            if (alreadyPaidProduct) {
                return CommonService.handleError(res, `The product with id ${alreadyPaidProduct.id} has already been paid.`);
            }

            // Step 3: Validate payment method
            if (paymentMethod !== 'CASH' && paymentMethod !== 'CB') {
                return CommonService.handleError(res, `The payment method ${paymentMethod} is not valid.`);
            }

            // Step 4: Add new paid products
            const newPaidProducts = products.map(product => ({
                id: product.id,
                price: product.price,
                quantity: product.quantity,
                paymentMethod: paymentMethod
            }));

            existingCommande.paidProducts = [...(existingCommande.paidProducts || []), ...newPaidProducts];
            existingCommande.totalPricePaid = (existingCommande.totalPricePaid || 0) + totalPrice;

            // Step 5: Update payment status
            if (existingCommande.paidProducts.length === existingCommande.products.length) {
                existingCommande.paymentStatus = 'PAID';
            } else {
                existingCommande.paymentStatus = 'PARTIALLY_PAID';
            }

            // Step 6: Save updated commande to Firebase
            await commandesRef.child(firebaseKey).update({
                paidProducts: existingCommande.paidProducts,
                totalPricePaid: existingCommande.totalPricePaid,
                paymentStatus: existingCommande.paymentStatus
            });

            // Send success response with payment details
            CommonService.sendSuccessResponse(res, {
                id: existingCommande.idCommande,
                restToPay: (existingCommande.totalPrice - existingCommande.totalPricePaid),
                paidProducts: existingCommande.paidProducts
            }, 'Paiement effectué avec succès');

        } catch (error) {
            console.error('Payment error:', error);
            CommonService.handleError(res, error, 'Erreur lors du paiement');
        }
    }

};
