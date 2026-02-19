import { create } from 'zustand';
import { PLANS } from '../constants/plans';
import { billingEngine } from '../services/billingEngine';
import { Customer, Invoice, Plan, Subscription } from '../types';

interface BillingState {
  subscriptions: Subscription[];
  invoices: Invoice[];
  availablePlans: Plan[];
  currentUsage: number;
  loading: boolean;
  error: string | null;

  // Actions
  initialize: (customerId: string) => Promise<void>;
  createSubscription: (customer: Customer, planId: string) => Promise<void>;
  upgradeSubscription: (subscriptionId: string, planId: string) => Promise<void>;
  processBillingCycle: (subscriptionId: string) => Promise<void>;
  fetchInvoices: (customerId: string) => Promise<void>;
  fetchUsage: (subscriptionId: string) => Promise<void>;
  recordUsage: (subscriptionId: string, quantity: number) => Promise<void>;
}

export const useBillingStore = create<BillingState>((set, get) => ({
  subscriptions: [],
  invoices: [],
  availablePlans: PLANS,
  currentUsage: 0,
  loading: false,
  error: null,

  initialize: async (customerId: string) => {
    set({ loading: true, error: null });
    try {
      // In a real app, fetching from API
      // Here we simulate by just getting from our in-memory engine
      // If empty, we might create a dummy one for demo purposes
      let subs = billingEngine.getSubscriptions().filter(s => s.customer_id === customerId);
      let invs = billingEngine.getInvoices(customerId);
      
      // DEMO: Create a dummy subscription if none exists
      if (subs.length === 0) {
        const dummyCustomer: Customer = { id: customerId, email: 'user@example.com', address: { country: 'ID', postal_code: '12345', city: 'Jakarta', line1: 'Jalan Sudirman' } };
        const sub = billingEngine.createSubscription(dummyCustomer, PLANS[0]);
        // Fast forward creation date to simulate history if needed, but for now just fresh
        subs = [sub];
        
        // Generate an initial invoice
        const inv = billingEngine.generateInvoice(sub);
        invs = [inv];
      }

      // AUTOMATION: Check for billing cycle processing
      // In a real app, this runs on the server via cron.
      // Here we simulate it by checking on load.
      subs.forEach(sub => {
        const newInvoice = billingEngine.processBillingCycle(sub.id);
        if (newInvoice) {
          invs.push(newInvoice);
        }
      });

      set({ subscriptions: subs, invoices: invs });
      
      // Fetch usage for the first subscription if exists
      if (subs.length > 0) {
        get().fetchUsage(subs[0].id);
      }

    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchUsage: async (subscriptionId: string) => {
    try {
      const sub = billingEngine.getSubscription(subscriptionId);
      if (sub) {
        const usage = billingEngine.getUsageForPeriod(sub);
        set({ currentUsage: usage });
      }
    } catch (err) {
      console.error(err);
    }
  },

  recordUsage: async (subscriptionId: string, quantity: number) => {
    try {
      billingEngine.recordUsage(subscriptionId, quantity);
      // Refresh usage display
      await get().fetchUsage(subscriptionId);
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  createSubscription: async (customer: Customer, planId: string) => {
    set({ loading: true, error: null });
    try {
      const plan = PLANS.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');

      const sub = billingEngine.createSubscription(customer, plan);
      set(state => ({
        subscriptions: [...state.subscriptions, sub],
        // If immediate charge needed (no trial), engine handles invoice generation logic but here we might need to refresh invoices
      }));
      
      // Refresh invoices just in case
      get().fetchInvoices(customer.id);
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  upgradeSubscription: async (subscriptionId: string, planId: string) => {
    set({ loading: true, error: null });
    try {
      const plan = PLANS.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');

      const invoice = billingEngine.upgradeSubscription(subscriptionId, plan);
      
      // Refresh state
      const updatedSubs = billingEngine.getSubscriptions(); // This gets all, filter needed in real app
      // We rely on engine being the source of truth for "database"
      // But for this store, we just update local state from engine
      
      // Re-fetch for current customer context (assuming we know it, or just update the specific sub)
      set(state => ({
        subscriptions: state.subscriptions.map(s => s.id === subscriptionId ? { ...s, plan, plan_id: plan.id } : s),
        invoices: invoice ? [...state.invoices, invoice] : state.invoices
      }));

    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  processBillingCycle: async (subscriptionId: string) => {
    // Debug/Demo function to force billing cycle processing
    set({ loading: true });
    try {
      const invoice = billingEngine.processBillingCycle(subscriptionId);
      if (invoice) {
        set(state => ({ invoices: [...state.invoices, invoice] }));
      }
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchInvoices: async (customerId: string) => {
    set({ loading: true });
    try {
      const invs = billingEngine.getInvoices(customerId);
      set({ invoices: invs });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  }
}));
