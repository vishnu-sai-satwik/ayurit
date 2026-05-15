import Joi from "joi";
import { DataService } from "../services/dataService.js";
import { getSocket } from "../socket/index.js";

const createSchema = Joi.object({
  name: Joi.string().required(),
  calories: Joi.number().required(),
  protein: Joi.number().required(),
  carbs: Joi.number().required(),
  fats: Joi.number().required()
});

export const createFood = async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const food = await DataService.createFood(value);
    getSocket()?.emit("food:created", food);
    return res.status(201).json(food);
  } catch (err) {
    return next(err);
  }
};

export const listFoods = async (req, res, next) => {
  try {
    const foods = await DataService.listFoods();
    return res.json(foods);
  } catch (err) {
    return next(err);
  }
};
