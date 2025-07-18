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
  signed?: boolean; // Indicates if the user has signed the agreement
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
  created_at?: string;
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

export interface StudentSession {
  id: string;
  name: string;
  gender: string;
  email: string;
  phone: string;
  college: string;
  course_and_year: string;
  academic_year: string;
  location: string;
  session_date: string | null;
  session_time: string | null;
  what_brings_to_session: string | null;
  hope_to_gain: string | null;
  specific_topics: string | null;
  spoken_to_someone_before: boolean;
  looking_for: string | null;
  anything_else: string | null;
  join_whatsapp_group: string | null;
  session_type: string;
  price: number;
  id_card: string | null;
  track: string | null;
  created_at?: string;
  notes: string | null;
  completed: boolean | null;
}

// Session Slots Management Types
export interface SessionType {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
  created_at?: string;
}

export type SlotStatus = 'available' | 'booked' | 'unavailable';

export interface AvailableSlot {
  id: string;
  instructor_id: string;
  session_type_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: SlotStatus;
  created_at?: string;
  updated_at?: string;
  instructor_name?: string;
  session_types?: SessionType;
  booking_status: boolean;
}

export interface StudentSessionForm {
  id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  course: string;
  location: string;
  gender: string;
  session_type: string;
  session_date: string;
  session_time: string;
  price: number;
  notes: string;
  id_card_url: string;
  created_at?: string;
}

// Instructor Content Management Types
export interface Instructor {
  id: string; // UUID
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  bio?: string;
  experience?: string;
  profile_image_url?: string;
  is_active?: boolean;
  highlight_color?: string;
  secondary_color?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InstructorHighlight {
  id?: number;
  instructor_id: string;
  title: string;
  icon_name?: string;
  icon_color?: string;
  display_order?: number;
}

export interface InstructorSupportArea {
  id?: number;
  instructor_id: string;
  category: string;
  title: string;
  description?: string;
  icon_name?: string;
  display_order?: number;
}

export interface InstructorOffering {
  id?: number;
  instructor_id: string;
  title: string;
  description?: string;
  icon_name?: string;
  display_order?: number;
}

export interface PageSection {
  id?: number;
  instructor_id: string;
  section_type: string; // 'intro', 'about', 'services', etc.
  title: string;
  subtitle?: string;
  content?: string;
  display_order?: number;
  // Using display_order instead of position as per our field access
}

export interface Testimonial {
  id?: number;
  instructor_id: string;
  client_name: string;
  client_description?: string; // Using this instead of client_role
  content: string;
  rating?: number;
  // Adding fields used in the form
  image_url?: string;
}

export interface StudentBooking {
  id: string;
  name: string;
  gender: string;
  email: string;
  phone: string;
  college: string;
  course_and_year: string;
  location: string;
  id_card_filename?: string;
  id_card_url?: string;
  Id_card?: string; // Legacy field for backward compatibility
  session_type: string;
  preferred_date: string;
  preferred_time: string;
  start_time?: string;
  end_time?: string;
  slot_id?: string;
  brings_to_session?: string;
  hopes_to_gain?: string;
  specific_topics?: string;
  spoken_to_someone?: string;
  looking_for?: string;
  anything_else?: string;
  join_whatsapp_channel?: string;
  price: number;
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  cf_order_id?: string;
  cf_payment_id?: string;
  payment_timestamp?: string;
  created_at?: string;
  updated_at?: string;
  status: 'PENDING' | 'BOOKED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  meeting_link?: string;
}