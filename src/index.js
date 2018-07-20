import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
var _ = require('lodash');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
var io = require('socket.io')(http);
app.use(morgan('dev'));
app.use(cors());

import http from 'http';
const server = http.Server(app);

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/codeworkr-rest-api', () => {
	console.log('Connected to mongodb.');
});

const users = require('./routes/users');
const categories = require('./routes/categories');
const games = require('./routes/games');

try {
	const port = process.env.PORT || 4000;
	server.listen(port);
	console.log(`Listening on port: ${port}`);
} catch (err) {
	console.log('INIT_ERROR:', err);
}

// Middlewares
app.use(morgan('dev'));
app.use(bodyParser.json());

// Routes
app.use('/categories', categories);
app.use('/users', users);
app.use('/games', games);

// Catch 404 Errors and forward them to error handler
app.use((req, res, next) => {
	const err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// Error handler function
app.use((err, req, res, next) => {
	const error = app.get('env') === 'development' ? err : {};
	const status = err.status || 500;

	// Respond to client
	res.status(status).json({
		error: {
			message: error.message
		}
	});

	// Respond to ourselves
	console.error(err);
});

var checkForWinner = game => {
	console.log('checkForWinner triggered');
	for (let i = 0; i < game.players.length; i++) {
		if (game.players[i].cardsWon.length >= game.gameType.limit) {
			return game.players[i];
		}
	}
	return null;
};

var startTimer = (addCode, gameType) => {
	let countdown = gameType.limit * 60;
	setInterval(function() {
		countdown--;
		if (countdown > 0) {
			io.in(addCode).emit('timer', countdown);
		} else {
			console.log('OUT OF TIME');
			io.in(addCode).emit('outOfTime');
		}
	}, 1000);
};

// WEB SOCKET STUFF
const Game = require('./models/game');
io.listen(server);
io.on('connection', socket => {
	console.log('a user connected');

	socket.on('join', async (addCode, user, gameId) => {
		console.log('join: ', { addCode: addCode, username: user, gameId: gameId });
		socket.join(addCode, () => {
			console.log('joined room', addCode);
		});

		let game = await Game.findById(gameId);
		let foundUser = game.players.find(player => {
			return player.username === user.username;
		});
		// console.log('user found', foundUser);
		if (!foundUser) {
			let newUser = {
				avatar: user.avatar,
				username: user.username,
				cardsWon: [],
				cardsInPlay: []
			};
			console.log('had to add player', newUser);
			game.players.push(newUser);
			await game.save();
			io.in(addCode).emit('playerJoined', game);
		}
	});
	socket.on('startGame', (addCode, gameType) => {
		// console.log('start game triggered', addCode);
		io.in(addCode).emit('startGame');
		if (gameType.title === 'time') {
			startTimer(addCode, gameType);
		}
	});
	socket.on('leave', async (addCode, user, gameId) => {
		// console.log('start game triggered', addCode);
		socket.leave(addCode, () => {
			console.log('left room', addCode);
		});
		let game = await Game.findById(gameId);
		let players = game.players.filter(player => {
			return player.username !== user.username;
		});
		game.players = players;
		await game.save();
		io.in(addCode).emit('playerLeft', game);
	});

	socket.on('drawCard', async (player, addCode, gameId) => {
		console.log('drawCard triggered');
		// draw card
		let game = await Game.findById(gameId);
		// if the game has run out of cards
		if (!game.cards.length) {
			io.in(addCode).emit('out of cards');
			return;
		}
		let newCard = game.cards[Math.floor(Math.random() * game.cards.length)];
		console.log('player at drawcard', player);
		game.players.map(onePlayer => {
			if (onePlayer.username === player) {
				onePlayer.cardsInPlay.push(newCard);
				console.log('onePlayer', onePlayer);
			}
		});
		game.cards.splice(game.cards.indexOf(newCard), 1);
		await game.save();
		// io.in(addCode).emit('cardDrawn', newCard);
		io.in(addCode).emit('cardDrawn', game);
		// 50% chance of phaze off starting
		if (Math.random() >= 0.5) {
			let playersArr = game.players;
			let playersInPhazeOff = [];
			let playerJudging = null;
			let numPlayersForPhazeOff = 2;
			// if 4+ players 25% chance 3 people in phaze off
			if (game.players.length > 3 && Math.random() >= 0.75) {
				numPlayersForPhazeOff = 3;
			}
			for (let i = 0; i > numPlayersForPhazeOff; i++) {
				let playerInPhazeOff = playersArr[Math.floor(Math.random() * playersArr.length)];
				if (playerInPhazeOff.cardsInPlay.length) {
					playersInPhazeOff.push(playerInPhazeOff);
				}
				for (let k = 0; k < playersArr.length; k++) {
					if (playersArr[k].username === playerInPhazeOff.username) playersArr.splice(k, 1);
				}
			}
			// 33% chance participants' cards are shuffled around
			if (playersInPhazeOff.length > 1 && Math.random() >= 0.66) {
				let cardsToBeFoughtOver = [];
				for (let i = 0; i < playersInPhazeOff.length; i++) {
					cardsToBeFoughtOver.push(
						playersInPhazeOff[i].cardsInPlay[playersInPhazeOff[i].cardsInPlay.length - 1]
					);
					playersInPhazeOff[i].cardsInPlay.pop();
				}
				for (let i = 0; i < playersInPhazeOff.length; i++) {
					let randomCard = cardsToBeFoughtOver[Math.floor(Math.random() * cardsToBeFoughtOver.length)];
					playersInPhazeOff[i].cardsInPlay.push(randomCard);
					cardsToBeFoughtOver.splice(cardsToBeFoughtOver.indexOf(randomCard), 1);
				}
				// update game with randomized changes
				for (let i = 0; i < game.players.length; i++) {
					for (let k = 0; i < playersInPhazeOff.length; k++) {
						if (game.players[i].username === playersInPhazeOff[k].username) {
							game.players[i].cardsInPlay = playersInPhazeOff[k].cardsInPlay;
						}
					}
				}
				await game.save();
				io.in(addCode).emit('updateGame', game);
			}

			// non-phaze off player chosen as judge
			playerJudging = playersArr[Math.floor(Math.random() * playersArr.length)];
			// send to all players in room addCode
			if (playersInPhazeOff.length > 1) {
				io.in(addCode).emit('PHAZE OFF!', { playersInPhazeOff, playerJudging });
			}
		}
	});

	socket.on('phazeOffResult', async (losers, winner, addCode, gameId) => {
		let game = await Game.findById(gameId);
		let cardsForWinner = [];
		// GIVE WINNER LAST CARD OF EVERY LOSER
		for (let i = 0; i < game.players.length; i++) {
			if (losers.includes(game.players[i].username)) {
				cardsForWinner.push(game.players[i].cardsInPlay[game.players[i].cardsInPlay.length - 1]);
				game.players[i].cardsInPlay.pop();
			}
		}
		game.players.map(onePlayer => {
			if (onePlayer.username === winner) {
				onePlayer.cardsWon.push(cardsForWinner);
			}
		});
		// UPDATE BACKEND
		await game.save();
		if (game.gameType.title === 'points') {
			let ultimateWinner = checkForWinner(game);
			if (ultimateWinner) {
				io.in(addCode).emit('gameWon', { ultimateWinner });
			} else {
				io.in(addCode).emit('phazeOffResolved', { losers, winner, game });
			}
		} else {
			io.in(addCode).emit('phazeOffResolved', { losers, winner, game });
		}
	});
});
