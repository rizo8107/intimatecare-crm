import { PaymentData, EbookAccess, TelegramSubscription } from '../types';
import { fetchApi } from './api';

// Enhanced version of TelegramSubscription with additional fields for analytics
export interface EnhancedTelegramSubscription extends Omit<TelegramSubscription, 'phone_number'> {
  status: 'active' | 'expired' | 'pending';
  daysRemaining?: number;
  hasPayment?: boolean;
  paymentId?: string;
  phone_number: string | number;
}

// Get integrated data with access status
export interface PaymentWithAccessStatus extends PaymentData {
  hasAccess?: boolean;
  ebookAccessId?: string | number;
  telegramSubscriptionId?: string;
  isExpired?: boolean;
}

// Payment analytics API functions
export const getPaymentAnalytics = async (): Promise<PaymentData[]> => {
  try {
    const payments = await fetchApi('payments_kb_all?select=*', {
      method: 'GET'
    });
    return payments;
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    return [];
  }
};

// Ebook access data API functions
export const getEbookAccessData = async (): Promise<EbookAccess[]> => {
  try {
    const accesses = await fetchApi('khushboo_drive?select=*', {
      method: 'GET'
    });
    return accesses;
  } catch (error) {
    console.error('Error fetching ebook access data:', error);
    return [];
  }
};

// Telegram subscription API functions
export const getActiveSubscriptions = async (): Promise<TelegramSubscription[]> => {
  try {
    const subscriptions = await fetchApi('telegram_subscriptions?select=*', {
      method: 'GET'
    });
    return subscriptions;
  } catch (error) {
    console.error('Error fetching active telegram subscriptions:', error);
    return [];
  }
};

export const getExpiredSubscriptions = async (): Promise<TelegramSubscription[]> => {
  try {
    const expiredSubscriptions = await fetchApi('telegram_sub_deleted?select=*', {
      method: 'GET'
    });
    return expiredSubscriptions;
  } catch (error) {
    console.error('Error fetching expired telegram subscriptions:', error);
    return [];
  }
};

// Analytics summary functions
export interface AnalyticsSummary {
  totalPayments: number;
  totalRevenue: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  ebookAccesses: number;
  pendingAccesses: number; // Payments without associated access
  subscriptionRevenue: number;
  ebookRevenue: number;
  conversionRate: number; // % of payments that resulted in subscription
  renewalRate: number; // % of expired subscriptions that were renewed
  averageSubscriptionValue: number;
  expiringWithin7Days: number; // Subscriptions expiring soon
}

// Get enhanced telegram subscriptions with status information
// Function to get enhanced telegram subscriptions with status information
export const getEnhancedTelegramSubscriptions = async (): Promise<EnhancedTelegramSubscription[]> => {
  try {
    const [activeSubscriptions, expiredSubscriptions, payments] = await Promise.all([
      getActiveSubscriptions(),
      getExpiredSubscriptions(),
      getPaymentAnalytics()
    ]);

    const today = new Date();
    
    // Process active subscriptions
    const activeEnhanced = activeSubscriptions.map(sub => {
      // Check if subscription has a corresponding payment
      const payment = payments.find(p => 
        p.email.toLowerCase() === (sub.email?.toLowerCase() || '') || 
        String(p.phone) === String(sub.phone_number)
      );

      // Calculate days remaining
      const expiryDate = new Date(sub.expiry_date);
      const daysRemaining = Math.max(0, Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24)));

      return {
        ...sub,
        status: 'active' as const,
        daysRemaining,
        hasPayment: !!payment,
        paymentId: payment?.razorpay_order_id
      };
    });

    // Process expired subscriptions
    const expiredEnhanced = expiredSubscriptions.map(sub => {
      // Check if subscription has a corresponding payment
      const payment = payments.find(p => 
        p.email.toLowerCase() === (sub.email?.toLowerCase() || '') || 
        String(p.phone) === String(sub.phone_number)
      );

      // Check if this subscription was renewed (exists in active subscriptions)
      const isRenewed = activeSubscriptions.some(activeSub => 
        (activeSub.email?.toLowerCase() === sub.email?.toLowerCase()) || 
        String(activeSub.phone_number) === String(sub.phone_number) || 
        activeSub.telegram_user_id === sub.telegram_user_id
      );

      return {
        ...sub,
        status: isRenewed ? 'expired' as const : 'expired' as const,  // Will differentiate with color in UI
        hasPayment: !!payment,
        paymentId: payment?.razorpay_order_id
      };
    });

    // Find telegram-related payments that don't have subscriptions
    const telegramPayments = payments.filter(p => 
      p.product.toLowerCase().includes('telegram') || 
      p.product.toLowerCase().includes('intimate_talks')
    );

    const pendingSubscriptions = telegramPayments
      .filter(payment => {
        const email = payment.email.toLowerCase();
        const phone = String(payment.phone);
        
        // Check if this payment doesn't have any subscription (active or expired)
        return !activeEnhanced.some(sub => 
          (sub.email?.toLowerCase() === email) || 
          String(sub.phone_number) === phone
        ) && 
        !expiredEnhanced.some(sub => 
          (sub.email?.toLowerCase() === email) || 
          String(sub.phone_number) === phone
        );
      })
      .map(payment => {
        // Create a pending subscription entry
        return {
          id: payment.razorpay_order_id,
          customer_name: "Unknown",
          telegram_username: "Pending",
          telegram_user_id: 0,
          plan_duration: "Unknown",
          plan_name: payment.product,
          start_date: payment.created_at || "",
          expiry_date: "",
          reminder_date: "",
          phone_number: payment.phone,
          email: payment.email,
          lead_id: null,
          signed: false,
          status: 'pending' as const,
          hasPayment: true,
          paymentId: payment.razorpay_order_id
        } as EnhancedTelegramSubscription;
      });

    // Combine all subscriptions
    return [...activeEnhanced, ...expiredEnhanced, ...pendingSubscriptions];
  } catch (error) {
    console.error('Error enhancing telegram subscriptions:', error);
    return [];
  }
};

export const getAnalyticsSummary = async (): Promise<AnalyticsSummary> => {
  try {
    const [payments, ebookAccesses, enhancedSubscriptions] = await Promise.all([
      getPaymentAnalytics(),
      getEbookAccessData(),
      getEnhancedTelegramSubscriptions()
    ]);
    
    const activeSubscriptions = enhancedSubscriptions.filter(sub => sub.status === 'active');
    const expiredSubscriptions = enhancedSubscriptions.filter(sub => sub.status === 'expired');
    const pendingSubscriptions = enhancedSubscriptions.filter(sub => sub.status === 'pending');

    // Separate payments by type
    const telegramPayments = payments.filter(p => 
      p.product.toLowerCase().includes('telegram') || 
      p.product.toLowerCase().includes('intimate_talks')
    );
    
    const ebookPayments = payments.filter(p => 
      p.product.toLowerCase().includes('ebook')
    );
    
    const today = new Date();
    const expiringWithin7Days = activeSubscriptions.filter(sub => {
      if (!sub.expiry_date) return false;
      const expiryDate = new Date(sub.expiry_date);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
    }).length;
    
    // Calculate renewal rate: active subscriptions that were previously expired
    const renewalCount = activeSubscriptions.filter(activeSub => 
      expiredSubscriptions.some(expiredSub => 
        (expiredSub.email?.toLowerCase() === activeSub.email?.toLowerCase()) || 
        String(expiredSub.phone_number) === String(activeSub.phone_number) || 
        expiredSub.telegram_user_id === activeSub.telegram_user_id
      )
    ).length;
    
    const renewalRate = expiredSubscriptions.length > 0 ? 
      (renewalCount / expiredSubscriptions.length) * 100 : 0;
      
    // Calculate additional metrics
    const subscriptionRevenue = telegramPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const ebookRevenue = ebookPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    const conversionRate = telegramPayments.length > 0 ?
      ((activeSubscriptions.length + expiredSubscriptions.length) / telegramPayments.length) * 100 : 0;
    
    const averageSubscriptionValue = telegramPayments.length > 0 ?
      subscriptionRevenue / telegramPayments.length : 0;
    
    const summary: AnalyticsSummary = {
      totalPayments: payments.length,
      totalRevenue: payments.reduce((sum, payment) => sum + payment.amount, 0),
      activeSubscriptions: activeSubscriptions.length,
      expiredSubscriptions: expiredSubscriptions.length,
      ebookAccesses: ebookAccesses.length,
      pendingAccesses: pendingSubscriptions.length,
      subscriptionRevenue,
      ebookRevenue,
      conversionRate,
      renewalRate,
      averageSubscriptionValue,
      expiringWithin7Days
    };

    return summary;
  } catch (error) {
    console.error('Error calculating analytics summary:', error);
    return {
      totalPayments: 0,
      totalRevenue: 0,
      activeSubscriptions: 0,
      expiredSubscriptions: 0,
      ebookAccesses: 0,
      pendingAccesses: 0,
      subscriptionRevenue: 0,
      ebookRevenue: 0,
      conversionRate: 0,
      renewalRate: 0,
      averageSubscriptionValue: 0,
      expiringWithin7Days: 0
    };
  }
};

// Get payments with enhanced access status information
export const getPaymentsWithAccessStatus = async (): Promise<{ payments: PaymentWithAccessStatus[], summary: AnalyticsSummary }> => {
  try {
    const [payments, ebookAccesses, activeSubscriptions, expiredSubscriptions] = await Promise.all([
      getPaymentAnalytics(),
      getEbookAccessData(),
      getActiveSubscriptions(),
      getExpiredSubscriptions()
    ]);
    
    // Create maps for faster lookups
    const activeSubscriptionMap = new Map<string, TelegramSubscription>();
    activeSubscriptions.forEach(sub => {
      if (sub.email) {
        activeSubscriptionMap.set(sub.email.toLowerCase(), sub);
      }
    });
    
    const ebookAccessMap = new Map<string, EbookAccess>();
    ebookAccesses.forEach(access => {
      ebookAccessMap.set(access.user_email.toLowerCase(), access);
    });
    
    const expiredSubscriptionMap = new Map<string, TelegramSubscription>();
    expiredSubscriptions.forEach(sub => {
      if (sub.email) {
        expiredSubscriptionMap.set(sub.email.toLowerCase(), sub);
      }
    });
    
    // Enhance payments with access status
    const enhancedPayments = payments.map(payment => {
      const enhancedPayment: PaymentWithAccessStatus = { ...payment };
      const email = payment.email.toLowerCase();
      
      // Check for ebook access
      if (payment.product.toLowerCase().includes('ebook')) {
        const ebookAccess = ebookAccessMap.get(email);
        if (ebookAccess) {
          enhancedPayment.hasAccess = true;
          enhancedPayment.ebookAccessId = ebookAccess.id;
        } else {
          enhancedPayment.hasAccess = false;
        }
      }
      
      // Check for telegram subscription
      if (payment.product.toLowerCase().includes('telegram') || 
          payment.product.toLowerCase().includes('intimate_talks')) {
        const activeSub = activeSubscriptionMap.get(email);
        const expiredSub = expiredSubscriptionMap.get(email);
        
        if (activeSub) {
          enhancedPayment.hasAccess = true;
          enhancedPayment.isExpired = false;
          enhancedPayment.telegramSubscriptionId = activeSub.id;
        } else if (expiredSub) {
          enhancedPayment.hasAccess = true;
          enhancedPayment.isExpired = true;
          enhancedPayment.telegramSubscriptionId = expiredSub.id;
        } else {
          enhancedPayment.hasAccess = false;
        }
      }
      
      return enhancedPayment;
    });
    
    // Count payments that don't have associated access
    const ebookPayments = payments.filter(p => p.product.toLowerCase().includes('ebook'));
    const telegramPayments = payments.filter(p => 
      p.product.toLowerCase().includes('telegram') || 
      p.product.toLowerCase().includes('intimate_talks')
    );

    // Calculate pending accesses
    const ebookEmails = new Set(ebookAccesses.map(a => a.user_email.toLowerCase()));
    const telegramEmails = new Set([
      ...activeSubscriptions.filter(s => s.email).map(s => s.email!.toLowerCase()), 
      ...expiredSubscriptions.filter(s => s.email).map(s => s.email!.toLowerCase())
    ]);

    const pendingEbooks = ebookPayments.filter(p => 
      !ebookEmails.has(p.email.toLowerCase())
    ).length;
    
    const pendingTelegram = telegramPayments.filter(p => 
      !telegramEmails.has(p.email.toLowerCase())
    ).length;
    
    // Calculate additional analytics metrics
    const subscriptionRevenue = telegramPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const ebookRevenue = ebookPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    const conversionRate = telegramPayments.length > 0 ?
      ((activeSubscriptions.length + expiredSubscriptions.length) / telegramPayments.length) * 100 : 0;
      
    // Calculate renewal rate: active subscriptions that were previously expired
    const renewalCount = activeSubscriptions.filter(activeSub => 
      expiredSubscriptions.some(expiredSub => 
        (activeSub.email && expiredSub.email && 
          activeSub.email.toLowerCase() === expiredSub.email.toLowerCase()) || 
        (activeSub.phone_number && expiredSub.phone_number &&
          String(activeSub.phone_number) === String(expiredSub.phone_number)) || 
        (activeSub.telegram_user_id && expiredSub.telegram_user_id &&
          activeSub.telegram_user_id === expiredSub.telegram_user_id)
      )
    ).length;
    
    const renewalRate = expiredSubscriptions.length > 0 ? 
      (renewalCount / expiredSubscriptions.length) * 100 : 0;
    
    const averageSubscriptionValue = telegramPayments.length > 0 ?
      subscriptionRevenue / telegramPayments.length : 0;
      
    // Calculate subscriptions expiring within 7 days
    const today = new Date();
    const expiringWithin7Days = activeSubscriptions.filter(sub => {
      if (!sub.expiry_date) return false;
      const expiryDate = new Date(sub.expiry_date);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
    }).length;

    return { 
      payments: enhancedPayments, 
      summary: {
        totalPayments: payments.length,
        totalRevenue: payments.reduce((sum, payment) => sum + payment.amount, 0),
        activeSubscriptions: activeSubscriptions.length,
        expiredSubscriptions: expiredSubscriptions.length,
        ebookAccesses: ebookAccesses.length,
        pendingAccesses: pendingEbooks + pendingTelegram,
        subscriptionRevenue,
        ebookRevenue,
        conversionRate,
        renewalRate,
        averageSubscriptionValue,
        expiringWithin7Days
      }
    };
  } catch (error) {
    console.error('Error getting payments with access status:', error);
    return { 
      payments: [], 
      summary: {
        totalPayments: 0,
        totalRevenue: 0,
        activeSubscriptions: 0,
        expiredSubscriptions: 0,
        ebookAccesses: 0,
        pendingAccesses: 0,
        subscriptionRevenue: 0,
        ebookRevenue: 0,
        conversionRate: 0,
        renewalRate: 0,
        averageSubscriptionValue: 0,
        expiringWithin7Days: 0
      } 
    };
  }
};
