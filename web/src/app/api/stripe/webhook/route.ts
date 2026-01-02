import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceFailed(invoice);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const priceId = session.metadata?.priceId;

  if (!userId) {
    console.error("Missing userId in checkout session metadata");
    return;
  }

  // Determine tier from price ID
  let tier: "FREE" | "TIER1" | "TIER2" | "TIER3" = "FREE";
  if (priceId === process.env.STRIPE_PRICE_TIER1) {
    tier = "TIER1";
  } else if (priceId === process.env.STRIPE_PRICE_TIER2) {
    tier = "TIER2";
  } else if (priceId === process.env.STRIPE_PRICE_TIER3) {
    tier = "TIER3";
  }

  // Update user tier
  await prisma.user.update({
    where: { id: userId },
    data: {
      tier,
      stripeCustomerId: session.customer as string,
    },
  });

  // Create or update subscription record
  if (session.subscription) {
    const stripeSubscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    const subscriptionStatus = stripeSubscription.status.toUpperCase() as "ACTIVE" | "CANCELED" | "INCOMPLETE" | "INCOMPLETE_EXPIRED" | "PAST_DUE" | "TRIALING" | "UNPAID";
    
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeSubscriptionId: session.subscription as string,
        stripePriceId: stripeSubscription.items.data[0].price.id,
        status: subscriptionStatus,
        stripeCurrentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
      update: {
        stripeSubscriptionId: session.subscription as string,
        stripePriceId: stripeSubscription.items.data[0].price.id,
        status: subscriptionStatus,
        stripeCurrentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    });
  }

  // Log the event
  await prisma.auditLog.create({
    data: {
      adminId: userId,
      action: "SUBSCRIPTION_CREATED",
      targetType: "subscription",
      details: { tier, sessionId: session.id },
    },
  });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error("User not found for customer:", customerId);
    return;
  }

  // Determine tier from price
  const priceId = subscription.items.data[0].price.id;
  let tier: "FREE" | "TIER1" | "TIER2" | "TIER3" = "FREE";

  if (priceId === process.env.STRIPE_PRICE_TIER1) {
    tier = "TIER1";
  } else if (priceId === process.env.STRIPE_PRICE_TIER2) {
    tier = "TIER2";
  } else if (priceId === process.env.STRIPE_PRICE_TIER3) {
    tier = "TIER3";
  }

  // Update user and subscription
  await prisma.user.update({
    where: { id: user.id },
    data: { tier },
  });

  const subscriptionStatus = subscription.status.toUpperCase() as "ACTIVE" | "CANCELED" | "INCOMPLETE" | "INCOMPLETE_EXPIRED" | "PAST_DUE" | "TRIALING" | "UNPAID";
  
  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: subscriptionStatus,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
    update: {
      stripePriceId: priceId,
      status: subscriptionStatus,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: user.id,
      action: "SUBSCRIPTION_UPDATED",
      targetType: "subscription",
      targetId: user.id,
      details: { tier, subscriptionId: subscription.id },
    },
  });
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error("User not found for customer:", customerId);
    return;
  }

  // Downgrade to free
  await prisma.user.update({
    where: { id: user.id },
    data: { tier: "FREE" },
  });

  await prisma.subscription.update({
    where: { userId: user.id },
    data: {
      status: "CANCELED",
      cancelAtPeriodEnd: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: user.id,
      action: "SUBSCRIPTION_CANCELED",
      targetType: "subscription",
      targetId: user.id,
      details: { subscriptionId: subscription.id },
    },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  await prisma.auditLog.create({
    data: {
      adminId: user.id,
      action: "PAYMENT_SUCCEEDED",
      targetType: "invoice",
      targetId: invoice.id,
      details: { 
        invoiceId: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
      },
    },
  });
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  await prisma.auditLog.create({
    data: {
      adminId: user.id,
      action: "PAYMENT_FAILED",
      targetType: "invoice",
      targetId: invoice.id,
      details: { 
        invoiceId: invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
      },
    },
  });

  // Optionally send email notification about failed payment
}
