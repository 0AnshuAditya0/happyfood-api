const Joi = require('joi');

const variationSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
  calories: Joi.number().optional(),
  spiceLevel: Joi.string().valid('Mild', 'Medium', 'Hot', 'Extra Hot', 'Insane').optional()
});

const dishSchema = Joi.object({
  id: Joi.string().required(), // Unique slug
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().min(10).required(),
  country: Joi.string().min(2).required(),
  region: Joi.string().allow('', null),
  tags: Joi.array().items(Joi.string()).min(1).required(),
  difficulty: Joi.string().valid('Easy', 'Medium', 'Hard').required(),
  calories: Joi.number().required(),
  protein: Joi.number().required(),
  carbs: Joi.number().required(),
  fat: Joi.number().required(),
  fiber: Joi.number().required(),
  dietaryInfo: Joi.array().items(Joi.string()).min(1).required(),
  spiceLevel: Joi.string().valid('Mild', 'Medium', 'Hot', 'Extra Hot', 'Insane').required(),
  allergens: Joi.array().items(Joi.string()).required(),
  cookingMethod: Joi.string().required(),
  mealType: Joi.string().required(),
  season: Joi.string().required(),
  instructions: Joi.string().min(10).required(),
  variations: Joi.array().items(variationSchema).optional(),
  cookTime: Joi.number().required(),
  servings: Joi.number().required(),
  source: Joi.string().allow('', null),
  image: Joi.string().uri().optional()
});

function validateDish(dish) {
  return dishSchema.validate(dish, { abortEarly: false, stripUnknown: true });
}

module.exports = { validateDish, dishSchema };
