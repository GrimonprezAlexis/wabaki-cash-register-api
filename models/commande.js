const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: {
    type: String,
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


const productPaySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
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
  totalPrice: Number,
  paidProducts: {
    type: [productPaySchema],
    required: false,
  },
  paymentMethod: {
	  type: String,
	  enum: ['CB', 'CASH'],
    required: false,
  },
  totalPricePaid: Number,
    // idClient: String,
});

const Commande = mongoose.model('Commande', commandeSchema);
module.exports = Commande;