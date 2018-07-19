const Joi = require('joi');

module.exports = {
	validateParam: (schema, name) => {
		return (req, res, next) => {
			const result = Joi.validate({ param: req['params'][name] }, schema);
			if (result.error) {
				return res.status(400).json(result.error);
			}

			if (!req.value) req.value = {};
			if (!req.value['params']) req.value['params'] = {};

			req.value['params'][name] = result.value.param;
			next();
		};
	},

	validateBody: schema => {
		return (req, res, next) => {
			const result = Joi.validate(req.body, schema);

			if (result.error) {
				return res.status(400).json(result.error);
			}

			if (!req.value) req.value = {};
			if (!req.value['body']) req.value['body'] = {};

			req.value['body'] = result.value;
			next();
		};
	},

	schemas: {
		userSchema: Joi.object().keys({
			userName: Joi.string().required(),
			email: Joi.string().email().required()
		}),

		userOptionalSchema: Joi.object().keys({
			userName: Joi.string(),
			email: Joi.string().email()
		}),

		categorySchema: Joi.object().keys({
			title: Joi.string().required(),
			cards: Joi.array().items(Joi.string()).required()
		}),

		gameSchema: Joi.object().keys({
			categories: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).required(),
			players: Joi.array()
				.items(
					Joi.object().keys({
						avatar: Joi.string().required(),
						username: Joi.string().required(),
						cardsWon: Joi.array().required(),
						cardsInPlay: Joi.array().required()
					})
				)
				.required(),
			gameType: Joi.object().keys({
				title: Joi.string().required(),
				limit: Joi.string().required()
			}),
			organizer: Joi.string().required()
		}),

		idSchema: Joi.object().keys({
			param: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
		})
	}
};
