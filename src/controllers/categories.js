const Category = require('../models/category');
const User = require('../models/user');

module.exports = {
	index: async (req, res, next) => {
		const categories = await Category.find({});

		res.status(200).json(categories);
	},

	newCategory: async (req, res, next) => {
		const category = new Category(req.value.body);
		await category.save();
		res.status(200).json(category);
	},

	getCategory: async (req, res, next) => {
		const category = await Category.findById(req.value.params.id);

		res.status(200).json(category);
	},

	replaceCategory: async (req, res, next) => {
		const category = await Category.findByIdAndUpdate(req.value.params.id, req.value.body);

		res.status(200).json(category);
	},

	deleteCategory: async (req, res, next) => {
		const category = await Category.findByIdAndRemove(req.value.params.id);
		if (!category) {
			return res.status(404).json({ error: "Category doesn't exist." });
		}

		res.status(200).json({ success: true });
	}
};
