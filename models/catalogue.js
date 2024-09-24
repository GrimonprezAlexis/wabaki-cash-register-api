const mongoose = require('mongoose');

const catalogueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true },
  photo: { type: String, default: null },
});
module.exports = mongoose.model('Catalogue', catalogueSchema);
