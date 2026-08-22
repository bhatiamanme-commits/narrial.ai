import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateYearlyDiscount, getSubscriptionProduct, SUBSCRIPTION_PLANS } from './subscription-config.ts';

test('Starter and Pro plans map to distinct checkout products', () => {
  assert.equal(getSubscriptionProduct('starter', 'monthly').id, 'starter-monthly');
  assert.equal(getSubscriptionProduct('pro', 'yearly').id, 'pro-yearly');
  assert.equal(getSubscriptionProduct('pro', 'monthly').id, 'pro-monthly');
});

test('the Pro yearly discount is calculated from integer minor units', () => {
  const pro = SUBSCRIPTION_PLANS.pro;
  assert.equal(calculateYearlyDiscount(pro.products.yearly.minorUnits, pro.products.monthly.minorUnits), 50);
});
