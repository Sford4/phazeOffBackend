const router = require('express-promise-router')();

const categoriesController = require('../controllers/categories');
const { validateParam, validateBody, schemas } = require('../helpers/routeHelpers');

router
	.route('/')
	.get(categoriesController.index)
	.post(validateBody(schemas.categorySchema), categoriesController.newCategory);

router
	.route('/:id')
	.get(validateParam(schemas.idSchema, 'id'), categoriesController.getCategory)
	.put(
		[validateParam(schemas.idSchema, 'id'), validateBody(schemas.categorySchema)],
		categoriesController.replaceCategory
	)
	.delete(validateParam(schemas.idSchema, 'id'), categoriesController.deleteCategory);

module.exports = router;
