// Subscription Management API
// Handles subscription creation, verification, and management

const express = require('express');
const router = express.Router();

// In-memory storage for subscriptions (replace with database in production)
let subscriptions = new Map();
let subscriptionPlans = {
  basic: {
    id: 'basic',
    name: 'Horror4Ever Basic',
    price: 500, // $5.00 in cents
    interval: 'month',
    features: [
      'Early access to new games',
      'Make suggestions',
      'Personalized profiles'
    ]
  }
};

// Middleware to check if user is subscribed
function checkSubscription(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.cookies?.horror4ever_member_token;
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // In production, verify token and get user ID
  const userId = token; // Simplified for demo
  const subscription = subscriptions.get(userId);
  
  req.userId = userId;
  req.isSubscribed = subscription && subscription.status === 'active';
  req.subscription = subscription;
  
  next();
}

// Get subscription status
router.get('/status', checkSubscription, (req, res) => {
  res.json({
    isSubscribed: req.isSubscribed,
    subscription: req.subscription,
    plan: req.subscription ? subscriptionPlans[req.subscription.planId] : null
  });
});

// Create subscription (simulated - in production, integrate with Stripe/PayPal)
router.post('/create', checkSubscription, async (req, res) => {
  try {
    const { planId = 'basic', paymentMethod } = req.body;
    
    if (!subscriptionPlans[planId]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // In production, process payment with Stripe/PayPal
    // For now, simulate successful payment
    const subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: req.userId,
      planId,
      status: 'active',
      createdAt: new Date().toISOString(),
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      cancelAtPeriodEnd: false
    };

    subscriptions.set(req.userId, subscription);

    res.json({
      success: true,
      subscription,
      plan: subscriptionPlans[planId]
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Cancel subscription
router.post('/cancel', checkSubscription, async (req, res) => {
  try {
    if (!req.subscription) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // In production, cancel with payment processor
    req.subscription.cancelAtPeriodEnd = true;
    subscriptions.set(req.userId, req.subscription);

    res.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the current period',
      subscription: req.subscription
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Reactivate subscription
router.post('/reactivate', checkSubscription, async (req, res) => {
  try {
    if (!req.subscription) {
      return res.status(400).json({ error: 'No subscription found' });
    }

    req.subscription.cancelAtPeriodEnd = false;
    subscriptions.set(req.userId, req.subscription);

    res.json({
      success: true,
      message: 'Subscription reactivated',
      subscription: req.subscription
    });
  } catch (error) {
    console.error('Subscription reactivation error:', error);
    res.status(500).json({ error: 'Failed to reactivate subscription' });
  }
});

// Get available plans
router.get('/plans', (req, res) => {
  res.json({
    plans: Object.values(subscriptionPlans)
  });
});

// Webhook for payment processor (in production)
router.post('/webhook', (req, res) => {
  // Handle webhooks from Stripe/PayPal
  // Update subscription status based on payment events
  res.json({ received: true });
});

module.exports = router; 