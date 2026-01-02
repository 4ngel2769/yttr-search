import Stripe from 'stripe';
import { prisma } from './prisma';
import { UserTier } from '@prisma/client';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Price IDs from Stripe Dashboard
export const PRICE_IDS = {
  TIER1: process.env.STRIPE_PRICE_TIER1!,
  TIER2: process.env.STRIPE_PRICE_TIER2!,
  TIER3: process.env.STRIPE_PRICE_TIER3!,
};

// Tier mapping from price ID
export const PRICE_TO_TIER: Record<string, UserTier> = {
  [process.env.STRIPE_PRICE_TIER1!]: UserTier.TIER1,
  [process.env.STRIPE_PRICE_TIER2!]: UserTier.TIER2,
  [process.env.STRIPE_PRICE_TIER3!]: UserTier.TIER3,
};

// Pricing info for display
export const PRICING = [
  {
    tier: 'FREE',
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      '30 searches per day',
      'Up to 50 videos per channel search',
      'Up to 50 URLs per batch',
      'Basic support',
    ],
    limits: {
      searchesPerDay: 30,
      videosPerSearch: 50,
      batchUrls: 50,
    },
  },
  {
    tier: 'TIER1',
    name: 'Starter',
    price: 9.99,
    priceId: PRICE_IDS.TIER1,
    features: [
      '120 searches per day',
      'Up to 100 videos per channel search',
      'Up to 100 URLs per batch',
      'Priority support',
      'Search history',
    ],
    limits: {
      searchesPerDay: 120,
      videosPerSearch: 100,
      batchUrls: 100,
    },
    popular: false,
  },
  {
    tier: 'TIER2',
    name: 'Pro',
    price: 24.99,
    priceId: PRICE_IDS.TIER2,
    features: [
      '340 searches per day',
      'Up to 250 videos per channel search',
      'Up to 500 URLs per batch',
      'Priority support',
      'Advanced analytics',
      'API access',
    ],
    limits: {
      searchesPerDay: 340,
      videosPerSearch: 250,
      batchUrls: 500,
    },
    popular: true,
  },
  {
    tier: 'TIER3',
    name: 'Enterprise',
    price: 49.99,
    priceId: PRICE_IDS.TIER3,
    features: [
      '500 searches per day',
      'Up to 500 videos per channel search',
      'Up to 1000 URLs per batch',
      'Dedicated support',
      'Advanced analytics',
      'Full API access',
      'Custom integrations',
    ],
    limits: {
      searchesPerDay: 500,
      videosPerSearch: 500,
      batchUrls: 1000,
    },
    popular: false,
  },
];

/**
 * Get or create Stripe customer for user
 */
export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, stripeCustomerId: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: {
      userId,
    },
  });

  // Save customer ID to user
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Create Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  userId: string,
  priceId: string,
  returnUrl: string
): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(userId);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${returnUrl}?canceled=true`,
    subscription_data: {
      metadata: {
        userId,
      },
    },
    allow_promotion_codes: true,
  });

  return session.url!;
}

/**
 * Create Stripe Customer Portal session
 */
export async function createPortalSession(userId: string, returnUrl: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    throw new Error('No Stripe customer found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Handle subscription created/updated
 */
export async function handleSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const tier = PRICE_TO_TIER[priceId] || UserTier.FREE;

  // Update user tier
  await prisma.user.update({
    where: { id: userId },
    data: {
      tier,
      stripeSubscriptionId: subscription.id,
    },
  });

  // Update or create subscription record
  await prisma.subscription.upsert({
    where: { userId },
    update: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: subscription.status.toUpperCase() as any,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    create: {
      userId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: subscription.status.toUpperCase() as any,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

/**
 * Handle subscription deleted/canceled
 */
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  // Downgrade user to free tier
  await prisma.user.update({
    where: { id: userId },
    data: {
      tier: UserTier.FREE,
      stripeSubscriptionId: null,
    },
  });

  // Update subscription record
  await prisma.subscription.update({
    where: { userId },
    data: {
      status: 'CANCELED',
    },
  });
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return null;
  }

  // Get pricing info
  const pricing = PRICING.find((p) => p.tier === subscription.stripePriceId);

  return {
    ...subscription,
    pricing,
  };
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  return subscription?.status === 'ACTIVE';
}
