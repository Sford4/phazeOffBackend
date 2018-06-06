const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameSchema = new Schema({
	cards: [String],
	players: [String],
	type: {
		title: String,
		limit: Number
	},
	winner: String
});

const Game = mongoose.model('game', GameSchema);

module.exports = Game;
