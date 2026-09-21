// Stripe ka server-side client (sirf server par use hoga)
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);