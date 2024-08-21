const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  icon: {
    type: String,
    required: false
  },
  photo: {
    type: String,
    required: false
  },
  quantity: {
    type: Number,
    required: true
  }
});

const commandeSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  idCommande: String,
  isoDateCommande: String,
  tableNumber: Number,
  products: {
    type: [productSchema],
    required: true
  },
  orderType: {
    type: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: false
    },
  },
  etat: {
    type: String,
    enum: ['CONFIRMED', 'SERVED'],
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID'],
  },
  totalPrice: Number
  // idClient: String,
  // paymentMean: {
	// type: String,
	// enum: ['CB', 'CASH']
  // },
});

const Commande = mongoose.model('Commandes', commandeSchema);
module.exports = Commande;
