import { addDays, formatISO } from 'date-fns';
import {
    Customer,
    DunningAttempt,
    Invoice,
    Plan,
    Subscription,
    SubscriptionStatus,
    UsageRecord
} from '../types';
import { calculateNextBillingDate } from '../utils/billingCycles';
import { calculateProration } from '../utils/proration';
import { calculateTax } from '../utils/tax';

class BillingEngine {
  private subscriptions: Subscription[] = [];
  private invoices: Invoice[] = [];
  private dunningAttempts: DunningAttempt[] = [];
  private usageRecords: UsageRecord[] = [];

  // Simulate database
  constructor() {
    // Load from local storage or init empty
  }

  recordUsage(subscriptionId: string, quantity: number, action: 'increment' | 'set' = 'increment') {
    const record: UsageRecord = {
      id: `usg_${Math.random().toString(36).substr(2, 9)}`,
      subscription_id: subscriptionId,
      quantity,
      action,
      timestamp: formatISO(new Date()),
    };
    this.usageRecords.push(record);
  }

  getUsageForPeriod(subscription: Subscription): number {
    const start = new Date(subscription.current_period_start);
    const end = new Date(subscription.current_period_end);
    
    const records = this.usageRecords.filter(r => 
      r.subscription_id === subscription.id &&
      new Date(r.timestamp) >= start &&
      new Date(r.timestamp) <= end
    );

    let total = 0;
    // Simple logic: if 'set', it overrides previous? Or just sum increments?
    // Assuming 'increment' adds to total. 'set' sets the total for that moment (maybe for gauges).
    // For simplicity, let's just sum increments.
    records.forEach(r => {
      if (r.action === 'increment') {
        total += r.quantity;
      } else if (r.action === 'set') {
        // If 'set' is used, we might take the last 'set' value?
        // Let's assume 'set' means "current usage is X", so we take the max or last?
        // Let's stick to increments for now as it's safer for this demo.
        total = r.quantity; 
      }
    });
    return total;
  }

  createSubscription(customer: Customer, plan: Plan): Subscription {
    const now = new Date();
    const trialEnd = plan.trial_days ? addDays(now, plan.trial_days) : undefined;
    const status = plan.trial_days ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE;
    const periodEnd = trialEnd || calculateNextBillingDate(now, plan.interval);

    const subscription: Subscription = {
      id: `sub_${Math.random().toString(36).substr(2, 9)}`,
      customer_id: customer.id,
      plan_id: plan.id,
      plan,
      status,
      current_period_start: formatISO(now),
      current_period_end: formatISO(periodEnd),
      billing_cycle_anchor: formatISO(now),
      cancel_at_period_end: false,
      trial_start: formatISO(now),
      trial_end: trialEnd ? formatISO(trialEnd) : undefined,
    };

    this.subscriptions.push(subscription);
    return subscription;
  }

  processBillingCycle(subscriptionId: string): Invoice | null {
    const subscription = this.subscriptions.find(s => s.id === subscriptionId);
    if (!subscription) return null;

    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);

    if (now >= periodEnd) {
      // Billing is due
      const invoice = this.generateInvoice(subscription);
      
      // Attempt payment
      const paymentSuccess = this.attemptPayment(invoice);

      if (paymentSuccess) {
        this.handleSuccessfulPayment(subscription, invoice);
      } else {
        this.handleFailedPayment(subscription, invoice);
      }
      
      return invoice;
    }
    return null;
  }

  generateInvoice(subscription: Subscription): Invoice {
    const now = new Date();
    let amount = subscription.plan.amount;
    let quantity = 1;
    let description = `Subscription to ${subscription.plan.name}`;

    if (subscription.plan.pricing_model === 'usage') {
      const usage = this.getUsageForPeriod(subscription);
      quantity = usage;
      amount = usage * subscription.plan.amount; // Assuming plan.amount is unit price
      description = `Usage for ${subscription.plan.name} (${usage} units)`;
    }

    // Mock customer fetch
    const customer: Customer = { id: subscription.customer_id, email: 'test@example.com', address: { country: 'US', state: 'CA', city: 'San Francisco', postal_code: '94105', line1: '123 Market St' } }; 
    
    const taxInfo = calculateTax(amount, customer);
    const total = amount + taxInfo.tax_amount;

    const invoice: Invoice = {
      id: `inv_${Math.random().toString(36).substr(2, 9)}`,
      customer_id: subscription.customer_id,
      subscription_id: subscription.id,
      status: 'draft',
      currency: subscription.plan.currency,
      amount_due: total,
      amount_paid: 0,
      amount_remaining: total,
      subtotal: amount,
      tax: taxInfo.tax_amount,
      total: total,
      line_items: [
        {
          id: `li_${Math.random().toString(36).substr(2, 9)}`,
          description: description,
          quantity: quantity,
          unit_amount: subscription.plan.amount,
          amount: amount,
          currency: subscription.plan.currency,
          period: {
            start: subscription.current_period_start,
            end: subscription.current_period_end
          }
        }
      ],
      created_at: formatISO(now),
      due_date: formatISO(addDays(now, 7)), // Net 7
    };

    this.invoices.push(invoice);
    return invoice;
  }

  attemptPayment(invoice: Invoice): boolean {
    // Simulate payment processing
    // In a real app, this would call Stripe/Xendit API
    const success = Math.random() > 0.1; // 90% success rate
    return success;
  }

  handleSuccessfulPayment(subscription: Subscription, invoice: Invoice) {
    invoice.status = 'paid';
    invoice.amount_paid = invoice.total;
    invoice.amount_remaining = 0;
    invoice.paid_at = formatISO(new Date());

    // Advance billing period
    const nextPeriodEnd = calculateNextBillingDate(subscription.current_period_end, subscription.plan.interval);
    subscription.current_period_start = subscription.current_period_end;
    subscription.current_period_end = formatISO(nextPeriodEnd);
    subscription.status = SubscriptionStatus.ACTIVE;
  }

  handleFailedPayment(subscription: Subscription, invoice: Invoice) {
    invoice.status = 'open';
    subscription.status = SubscriptionStatus.PAST_DUE;
    
    // Start Dunning
    this.startDunningProcess(subscription, invoice);
  }

  startDunningProcess(subscription: Subscription, invoice: Invoice) {
    const attempt: DunningAttempt = {
      id: `dun_${Math.random().toString(36).substr(2, 9)}`,
      subscription_id: subscription.id,
      invoice_id: invoice.id,
      attempt_number: 1,
      next_retry: formatISO(addDays(new Date(), 3)), // First retry in 3 days
      status: 'pending'
    };
    this.dunningAttempts.push(attempt);
  }

  upgradeSubscription(subscriptionId: string, newPlan: Plan): Invoice | null {
    const subscription = this.subscriptions.find(s => s.id === subscriptionId);
    if (!subscription) return null;

    const now = formatISO(new Date());
    const proration = calculateProration(
      subscription.plan,
      newPlan,
      subscription.current_period_start,
      subscription.current_period_end,
      now
    );

    // Apply changes
    subscription.plan = newPlan;
    subscription.plan_id = newPlan.id;

    // If there is a charge due to upgrade, generate an invoice immediately
    if (proration.net_proration > 0) {
      // Generate immediate invoice for proration
       const invoice: Invoice = {
        id: `inv_proration_${Math.random().toString(36).substr(2, 9)}`,
        customer_id: subscription.customer_id,
        subscription_id: subscription.id,
        status: 'open',
        currency: newPlan.currency,
        amount_due: proration.net_proration,
        amount_paid: 0,
        amount_remaining: proration.net_proration,
        subtotal: proration.net_proration,
        tax: 0, // Simplified
        total: proration.net_proration,
        line_items: [
          {
            id: `li_pror_${Math.random().toString(36).substr(2, 9)}`,
            description: `Upgrade to ${newPlan.name} (Prorated)`,
            quantity: 1,
            unit_amount: proration.net_proration,
            amount: proration.net_proration,
            currency: newPlan.currency,
          }
        ],
        created_at: now,
        due_date: now,
      };
      this.invoices.push(invoice);
      return invoice;
    }

    return null;
  }

  getSubscriptions(): Subscription[] {
    return this.subscriptions;
  }

  getInvoices(customerId?: string): Invoice[] {
    if (customerId) {
      return this.invoices.filter(i => i.customer_id === customerId);
    }
    return this.invoices;
  }

  getSubscription(id: string): Subscription | undefined {
    return this.subscriptions.find(s => s.id === id);
  }
}

export const billingEngine = new BillingEngine();
