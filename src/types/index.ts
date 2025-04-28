export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: LeadStatus;
  createdAt: string;
  lastContactedAt: string | null;
  assignedTo: string | null;
  value: number;
  // Reference IDs for linked data
  telegramSubscriptionId?: string;
  ebookAccessId?: number;
  // Flags to indicate if lead has related data
  hasTelegramSubscription?: boolean;
  hasEbookAccess?: boolean;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'negotiation' | 'closed-won' | 'closed-lost';

export interface Note {
  id: string;
  leadId: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface Task {
  id: string;
  leadId: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar: string;
}

export interface DashboardSummary {
  totalLeads: number;
  newLeadsThisWeek: number;
  leadsClosedThisMonth: number;
  totalValue: number;
  leadsByStatus: Record<LeadStatus, number>;
  upcomingTasks: number;
}

export interface TelegramSubscription {
  id: string;
  customer_name: string;
  telegram_username: string;
  telegram_user_id: number;
  phone_number: string;
  plan_duration: string;
  plan_name: string;
  start_date: string;
  expiry_date: string;
  reminder_date: string;
  // Fields for data linking
  email?: string; // Added to link with leads and ebook access
  leadId?: string; // Reference to associated lead
}

export interface EbookAccess {
  id: number;
  user_email: string;
  user_name: string;
  payment_id: string;
  amount: number;
  created_at: string;
  // Fields for data linking
  phone_number?: string; // Added to link with telegram subscriptions
  leadId?: string; // Reference to associated lead
}

export interface PaymentData {
  amount: number;
  currency: string;
  status: string;
  razorpay_order_id: string;
  phone: number;
  email: string;
  product: string;
  created_at?: string;
}