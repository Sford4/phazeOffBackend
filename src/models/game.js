const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameSchema = new Schema({
	cards: [String],
	addCode: String,
	players: [{ avatar: String, username: String, cardsWon: Array, cardsInPlay: Array }],
	gameType: {
		title: String,
		limit: String
	},
	organizer: String
});

const Game = mongoose.model('game', GameSchema);

module.exports = Game;
