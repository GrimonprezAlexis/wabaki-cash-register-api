const mongoose = require('mongoose');

const commandeSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  idCommande: String,
  isoDateCommande: String,
  tableNumber: Number,
  productsIds: [Number],
  orderType: {
    type: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: false
    },
    etat: {
      type: String,
      enum: ['PENDING', 'VALIDER'],
    },
  }
  // idClient: String,
  // paymentMean: {
	// type: String,
	// enum: ['CB', 'CASH']
  // },
});

const Commande = mongoose.model('Commandes', commandeSchema);
module.exports = Commande;
