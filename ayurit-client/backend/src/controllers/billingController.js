import Joi from "joi";
import { PlatformService } from "../services/platformService.js";

const updateBillingSchema = Joi.object({
  plan: Joi.string().valid("free_trial", "clinic", "enterprise").optional(),
  status: Joi.string().valid("active", "past_due", "cancelled").optional(),
  nextRenewalDate: Joi.string().allow(null, "").optional()
});

const addPaymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).default("INR"),
  method: Joi.string().default("card"),
  status: Joi.string().valid("paid", "failed", "refunded").default("paid")
});

export const getBilling = async (req, res, next) => {
  try {
    return res.json(PlatformService.getBilling());
  } catch (err) {
    return next(err);
  }
};

export const updateBilling = async (req, res, next) => {
  try {
    const { error, value } = updateBillingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const billing = PlatformService.updateBilling(value);
    PlatformService.addAuditLog({
      action: "billing.updated",
      actor: req.user.sub,
      target: billing.plan
    });

    return res.json(billing);
  } catch (err) {
    return next(err);
  }
};

export const addPayment = async (req, res, next) => {
  try {
    const { error, value } = addPaymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const payment = PlatformService.addPayment(value);
    PlatformService.addAuditLog({
      action: "billing.payment_added",
      actor: req.user.sub,
      target: payment.id
    });

    return res.status(201).json(payment);
  } catch (err) {
    return next(err);
  }
};
