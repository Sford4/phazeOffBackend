const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
	title: String,
	cards: [String]
});

const Category = mongoose.model('category', CategorySchema);

module.exports = Category;
