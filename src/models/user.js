const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
	userName: String,
	email: String,
	categories: [
		{
			type: Schema.Types.ObjectId,
			ref: 'category'
		}
	]
});

const User = mongoose.model('user', UserSchema);

module.exports = User;
