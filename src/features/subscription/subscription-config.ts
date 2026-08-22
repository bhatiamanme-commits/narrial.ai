export type PlanId = 'starter' | 'pro';
export type BillingInterval = 'monthly' | 'yearly';

export type SubscriptionProduct = {
  id: string;
  interval: BillingInterval;
  formattedPrice: string;
  billingNote: string;
  minorUnits: number;
};

type SubscriptionPlan = {
  id: PlanId;
  benefits: string[];
  supportingLabel?: string;
  products: Partial<Record<BillingInterval, SubscriptionProduct>>;
};

export const SUBSCRIPTION_PLANS: Record<PlanId, SubscriptionPlan> = {
  starter: {
    id: 'starter',
    benefits: ['150 credits / month', 'Remove watermark', 'AI clipping with Virality score', 'AI animated captions in 20+ languages', 'Powerful editor on web'],
    products: {
      monthly: { id: 'starter-monthly', interval: 'monthly', formattedPrice: '₹1,000.00 /month', billingNote: 'Billed monthly', minorUnits: 100000 },
    },
  },
  pro: {
    id: 'pro',
    benefits: ['3,600 credits / year, available instantly', 'Input from 10+ sources', 'Multiple aspect ratios (9:16, 1:1, 16:9)', '100GB cloud storage to save projects'],
    supportingLabel: 'Everything in Starter plan, plus:',
    products: {
      yearly: { id: 'pro-yearly', interval: 'yearly', formattedPrice: '₹12,800.00 /year', billingNote: 'approx. ₹1,066.67/month', minorUnits: 1280000 },
      monthly: { id: 'pro-monthly', interval: 'monthly', formattedPrice: '₹2,150.00 /month', billingNote: 'Billed monthly', minorUnits: 215000 },
    },
  },
};

export function calculateYearlyDiscount(yearlyMinor: number, monthlyMinor: number): number {
  return Math.round((1 - yearlyMinor / (monthlyMinor * 12)) * 100);
}

export function getSubscriptionProduct(planId: PlanId, interval: BillingInterval): SubscriptionProduct {
  const product = SUBSCRIPTION_PLANS[planId].products[interval];
  if (!product) throw new Error('This subscription option is unavailable.');
  return product;
}
