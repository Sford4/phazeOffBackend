const Category = require('../models/category');
const User = require('../models/user');
const Game = require('../models/game');
const shortid = require('shortid');

module.exports = {
	index: async (req, res, next) => {
		const games = await Game.find({});

		res.status(200).json(games);
	},

	newGame: async (req, res, next) => {
		let cards = [];
		for (let i = 0; i < req.value.body.categories.length; i++) {
			let categoryCards = await Category.findById(req.value.body.categories[i]);
			cards.push(categoryCards.cards);
		}
		const newGame = req.value.body;
		delete newGame.cards;
		newGame.cards = cards;
		let addCode = shortid.generate();
		newGame.addCode = addCode.substring(0, addCode.length - 3);
		newGame.winner = null;
		const game = new Game(newGame);
		await game.save();

		res.status(200).json(game);
	},

	getGame: async (req, res, next) => {
		const game = await Game.findById(req.value.params.id);

		res.status(200).json(game);
	},

	deleteGame: async (req, res, next) => {
		const game = await Game.findByIdAndRemove(req.value.params.id);
		if (!game) {
			return res.status(404).json({ error: "Game doesn't exist." });
		}
		res.status(200).json({ success: true });
	}
};
