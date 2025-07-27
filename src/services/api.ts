import { 
  DashboardSummary, 
  EbookAccess, 
  Lead, 
  LeadStatus, 
  Note, 
  PaymentData, 
  StudentSession, 
  Task, 
  TelegramSubscription, 
  SessionType, 
  AvailableSlot, 

  Instructor,
  InstructorHighlight,
  InstructorSupportArea,
  InstructorOffering,
  StudentSessionForm,
  StudentBooking
} from '../types';

const API_URL = 'https://crm-supabase.7za6uc.easypanel.host/rest/v1';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NDk4Mzk0MDAsImV4cCI6MTkwNzYwNTgwMH0.RUr6v34x5v9ZPaSSjIgqamSeOtPyVpfv20r7wQ4niK0';

const headers = {
  'apikey': API_KEY,
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Instructor Content Management - Related Content

export async function createInstructorHighlight(highlightData: Omit<InstructorHighlight, 'id'>): Promise<InstructorHighlight> {
  return fetchApi('instructor_highlights', { method: 'POST', body: JSON.stringify(highlightData) });
}

export async function createInstructorSupportArea(supportAreaData: Omit<InstructorSupportArea, 'id'>): Promise<InstructorSupportArea> {
  return fetchApi('instructor_support_areas', { method: 'POST', body: JSON.stringify(supportAreaData) });
}

export async function createInstructorOffering(offeringData: Omit<InstructorOffering, 'id'>): Promise<InstructorOffering> {
  return fetchApi('instructor_offerings', { method: 'POST', body: JSON.stringify(offeringData) });
}

// Helper function to make API requests
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}/${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`
      );
    }

    // Check if the response has content before trying to parse it as JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 0) {
        return response.json();
      }
    }
    
    // For empty responses or non-JSON responses
    if (response.status === 204) {
      return null; // No content
    }
    
    try {
      return response.json();
    } catch (e) {
      return null; // Return null if JSON parsing fails
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`API request failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred while making the API request');
  }
}

// Lead APIs
export async function getLeads(): Promise<Lead[]> {
  try {
    // Use payments_kb_all table as the source for leads
    const payments = await fetchApi('payments_kb_all?select=*');
    
    // Convert payment data to lead format
    return payments.map((payment: PaymentData) => {
      // Extract name from email (before @) and capitalize first letter
      const nameParts = payment.email.split('@')[0].split('.');
      const name = nameParts.map((part: string) => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ');
      
      // Generate a unique ID
      const id = payment.razorpay_order_id;
      
      return {
        id,
        name,
        company: payment.product,
        email: payment.email,
        phone: payment.phone.toString(),
        status: payment.status === 'SUCCESS' ? 'new' : 'contacted' as LeadStatus,
        createdAt: new Date().toISOString(),
        lastContactedAt: null,
        assignedTo: null,
        value: payment.amount // Keep the amount in rupees
      };
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }
}

export async function getLead(id: string): Promise<Lead | undefined> {
  try {
    // Get all payments and find the one with matching ID (razorpay_order_id)
    const payments = await fetchApi('payments_kb_all?select=*');
    const payment = payments.find((p: PaymentData) => p.razorpay_order_id === id);
    
    if (!payment) return undefined;
    
    // Convert to lead format
    const nameParts = payment.email.split('@')[0].split('.');
    const name = nameParts.map((part: string) => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
    
    return {
      id,
      name,
      company: payment.product,
      email: payment.email,
      phone: payment.phone.toString(),
      status: payment.status === 'SUCCESS' ? 'new' : 'contacted' as LeadStatus,
      createdAt: new Date().toISOString(),
      lastContactedAt: null,
      assignedTo: null,
      value: payment.amount // Keep the amount in rupees
    };
  } catch (error) {
    console.error(`Error fetching lead ${id}:`, error);
    throw error;
  }
}

export async function createLead(lead: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> {
  try {
    // Since we can't actually create leads in the database (no leads table),
    // we'll simulate a successful creation by returning a mock lead with an ID
    const id = `lead_${Date.now()}`;
    
    return {
      id,
      ...lead,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating lead:', error);
    throw error;
  }
}

export async function updateLead(id: string, lead: Partial<Lead>): Promise<Lead> {
  try {
    // Since we can't actually update leads in the database (no leads table),
    // we'll simulate a successful update by returning the updated lead
    const existingLead = await getLead(id);
    
    if (!existingLead) {
      throw new Error(`Lead with ID ${id} not found`);
    }
    
    return {
      ...existingLead,
      ...lead
    };
  } catch (error) {
    console.error(`Error updating lead ${id}:`, error);
    throw error;
  }
}

export async function deleteLead(id: string): Promise<void> {
  try {
    // Since we can't actually delete leads in the database (no leads table),
    // we'll just simulate a successful deletion
    console.log(`Simulated deletion of lead ${id}`);
    return;
  } catch (error) {
    console.error(`Error deleting lead ${id}:`, error);
    throw error;
  }
}

// Note APIs
export async function getLeadNotes(leadId: string): Promise<Note[]> {
  try {
    console.log('API: Fetching notes for lead ID:', leadId);
    // Try different query formats since the lead_id might be stored differently
    // First try with quotes
    let notes = await fetchApi(`notes?lead_id=eq."${leadId}"&order=created_at.desc`);
    
    // If no results, try without quotes
    if (Array.isArray(notes) && notes.length === 0) {
      console.log('API: No notes found with quoted lead_id, trying without quotes');
      notes = await fetchApi(`notes?lead_id=eq.${leadId}&order=created_at.desc`);
    }
    console.log('API: Raw notes from database:', notes);
    
    if (!Array.isArray(notes)) {
      console.error('API: Notes response is not an array:', notes);
      return [];
    }
    
    // Map the database fields to the frontend model
    const mappedNotes = notes.map((note: DbNote) => {
      const mappedNote = {
        id: note.id,
        leadId: note.lead_id,
        content: note.content,
        createdAt: note.created_at,
        createdBy: note.created_by
      };
      console.log('API: Mapped note:', mappedNote);
      return mappedNote;
    });
    
    console.log('API: Final mapped notes:', mappedNotes);
    return mappedNotes;
  } catch (error) {
    console.error(`Error fetching notes for lead ${leadId}:`, error);
    return []; // Return empty array instead of throwing to prevent UI errors
  }
}

export async function createNote(note: Omit<Note, 'id' | 'createdAt'>): Promise<Note> {
  try {
    // Map the JavaScript camelCase to database snake_case
    const newNote = {
      lead_id: note.leadId,
      content: note.content,
      created_by: note.createdBy,
      created_at: new Date().toISOString()
    };
    
    const result = await fetchApi('notes', {
      method: 'POST',
      body: JSON.stringify(newNote)
    });
    return result[0];
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
}

export async function deleteNote(id: string): Promise<void> {
  try {
    await fetchApi(`notes?id=eq.${id}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error(`Error deleting note ${id}:`, error);
    throw error;
  }
}

// Task APIs
interface DbNote {
  id: string;
  lead_id: string;
  content: string;
  created_at: string;
  created_by: string;
}

interface DbTask {
  id: string;
  lead_id: string;
  title: string;
  description: string;
  due_date: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

export async function getLeadTasks(leadId: string): Promise<Task[]> {
  try {
    console.log('API: Fetching tasks for lead ID:', leadId);
    // Try different query formats since the lead_id might be stored differently
    // First try with quotes
    let tasks = await fetchApi(`tasks?lead_id=eq."${leadId}"&order=due_date.asc`);
    
    // If no results, try without quotes
    if (Array.isArray(tasks) && tasks.length === 0) {
      console.log('API: No tasks found with quoted lead_id, trying without quotes');
      tasks = await fetchApi(`tasks?lead_id=eq.${leadId}&order=due_date.asc`);
    }
    console.log('API: Raw tasks from database:', tasks);
    
    if (!Array.isArray(tasks)) {
      console.error('API: Tasks response is not an array:', tasks);
      return [];
    }
    
    // Map the database fields to the frontend model
    const mappedTasks = tasks.map((task: DbTask) => {
      const mappedTask = {
        id: task.id,
        leadId: task.lead_id,
        title: task.title,
        description: task.description,
        dueDate: task.due_date,
        completed: task.completed,
        priority: task.priority
      };
      console.log('API: Mapped task:', mappedTask);
      return mappedTask;
    });
    
    console.log('API: Final mapped tasks:', mappedTasks);
    return mappedTasks;
  } catch (error) {
    console.error(`Error fetching tasks for lead ${leadId}:`, error);
    return []; // Return empty array instead of throwing to prevent UI errors
  }
}

export async function createTask(task: Omit<Task, 'id'>): Promise<Task> {
  try {
    // Map the JavaScript camelCase to database snake_case
    const newTask = {
      lead_id: task.leadId,
      title: task.title,
      description: task.description,
      due_date: task.dueDate,
      completed: task.completed,
      priority: task.priority
    };
    
    const result = await fetchApi('tasks', {
      method: 'POST',
      body: JSON.stringify(newTask)
    });
    return result[0];
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  try {
    const result = await fetchApi(`tasks?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    return result[0];
  } catch (error) {
    console.error(`Error updating task ${id}:`, error);
    throw error;
  }
}

export async function deleteTask(id: string): Promise<void> {
  try {
    await fetchApi(`tasks?id=eq.${id}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error(`Error deleting task ${id}:`, error);
    throw error;
  }
}

// Telegram Subscription APIs
export async function getTelegramSubscriptions(): Promise<TelegramSubscription[]> {
  try {
    const data = await fetchApi('telegram_subscriptions?select=*');
    
    // Define an interface for the raw API response
    interface RawTelegramSubscription {
      id: string;
      customer_name: string;
      telegram_username: string;
      telegram_user_id: number;
      'phone number'?: number;
      plan_duration: string;
      plan_name: string;
      start_date: string;
      expiry_date: string;
      reminder_date: string;
    }
    
    // Map the data to handle the 'phone number' field
    return data.map((item: RawTelegramSubscription) => ({
      ...item,
      // Map 'phone number' to 'phone_number' if it exists
      phone_number: item['phone number'] ? String(item['phone number']) : null,
    }));
  } catch (error) {
    console.error('Error fetching telegram subscriptions:', error);
    throw error;
  }
}

// Ebook Access APIs
export async function getEbookAccess(): Promise<EbookAccess[]> {
  try {
    return await fetchApi('khushboo_drive?select=*');
  } catch (error) {
    console.error('Error fetching ebook access data:', error);
    throw error;
  }
}

// Payment Data APIs
export async function getPaymentData(): Promise<PaymentData[]> {
  try {
    return await fetchApi('payments_kb_all?select=*');
  } catch (error) {
    console.error('Error fetching payment data:', error);
    throw error;
  }
}

// Data Linking APIs

// Function to link Telegram subscriptions with leads based on phone number and email
export async function linkTelegramSubscriptionsToLeads(): Promise<Lead[]> {
  try {
    const leads = await getLeads();
    const telegramSubscriptions = await getTelegramSubscriptions();
    
    // Create maps for quick lookup
    const leadsByPhone: Record<string, Lead[]> = {};
    const leadsByEmail: Record<string, Lead[]> = {};
    
    // Populate the lookup maps
    leads.forEach(lead => {
      if (lead.phone) {
        // Normalize phone number by removing non-digits
        const normalizedPhone = lead.phone.replace(/\D/g, '');
        if (!leadsByPhone[normalizedPhone]) {
          leadsByPhone[normalizedPhone] = [];
        }
        leadsByPhone[normalizedPhone].push(lead);
      }
      
      if (lead.email) {
        const email = lead.email.toLowerCase();
        if (!leadsByEmail[email]) {
          leadsByEmail[email] = [];
        }
        leadsByEmail[email].push(lead);
      }
    });
    
    // Create a map to track which leads have been matched
    const matchedLeadIds = new Set<string>();
    
    // Link telegram subscriptions to leads
    const updatedLeads = leads.map(lead => {
      // Skip if this lead already has a match
      if (matchedLeadIds.has(lead.id)) {
        return lead;
      }
      
      // Try to match by phone first
      if (lead.phone) {
        const normalizedLeadPhone = lead.phone.replace(/\D/g, '');
        
        // Find matching telegram subscription by phone number
        const matchingSubscription = telegramSubscriptions.find(sub => {
          if (!sub.phone_number) return false;
          const normalizedSubPhone = sub.phone_number.toString().replace(/\D/g, '');
          return normalizedSubPhone === normalizedLeadPhone;
        });
        
        if (matchingSubscription) {
          matchedLeadIds.add(lead.id);
          return {
            ...lead,
            telegramSubscriptionId: matchingSubscription.id,
            hasTelegramSubscription: true
          };
        }
      }
      
      // Try to match by email if phone match failed
      if (lead.email && telegramSubscriptions.some(sub => sub.email)) {
        const leadEmail = lead.email.toLowerCase();
        
        const matchingSubscription = telegramSubscriptions.find(sub => 
          sub.email && sub.email.toLowerCase() === leadEmail
        );
        
        if (matchingSubscription) {
          matchedLeadIds.add(lead.id);
          return {
            ...lead,
            telegramSubscriptionId: matchingSubscription.id,
            hasTelegramSubscription: true
          };
        }
      }
      
      return lead;
    });
    
    return updatedLeads;
  } catch (error) {
    console.error('Error linking telegram subscriptions to leads:', error);
    throw error;
  }
}

// Function to link eBook access with leads based on email and phone
export async function linkEbookAccessToLeads(): Promise<Lead[]> {
  try {
    const leads = await getLeads();
    const ebookAccess = await getEbookAccess();
    
    // Create maps for quick lookup
    const leadsByEmail: Record<string, Lead[]> = {};
    const leadsByPhone: Record<string, Lead[]> = {};
    
    // Populate the lookup maps
    leads.forEach(lead => {
      if (lead.email) {
        const email = lead.email.toLowerCase();
        if (!leadsByEmail[email]) {
          leadsByEmail[email] = [];
        }
        leadsByEmail[email].push(lead);
      }
      
      if (lead.phone) {
        const normalizedPhone = lead.phone.replace(/\D/g, '');
        if (!leadsByPhone[normalizedPhone]) {
          leadsByPhone[normalizedPhone] = [];
        }
        leadsByPhone[normalizedPhone].push(lead);
      }
    });
    
    // Create a map to track which leads have been matched
    const matchedLeadIds = new Set<string>();
    
    // Link ebook access to leads
    const updatedLeads = leads.map(lead => {
      // Skip if this lead already has a match
      if (matchedLeadIds.has(lead.id)) {
        return lead;
      }
      
      // Try to match by email first
      if (lead.email) {
        const leadEmail = lead.email.toLowerCase();
        
        // Find matching ebook access by email
        const matchingEbookAccess = ebookAccess.find(ebook => 
          ebook.user_email.toLowerCase() === leadEmail
        );
        
        if (matchingEbookAccess) {
          matchedLeadIds.add(lead.id);
          return {
            ...lead,
            ebookAccessId: matchingEbookAccess.id,
            hasEbookAccess: true
          };
        }
      }
      
      // Try to match by phone if email match failed
      if (lead.phone && ebookAccess.some(ebook => ebook.phone_number)) {
        const normalizedLeadPhone = lead.phone.replace(/\D/g, '');
        
        const matchingEbookAccess = ebookAccess.find(ebook => {
          if (!ebook.phone_number) return false;
          const normalizedEbookPhone = ebook.phone_number.toString().replace(/\D/g, '');
          return normalizedEbookPhone === normalizedLeadPhone;
        });
        
        if (matchingEbookAccess) {
          matchedLeadIds.add(lead.id);
          return {
            ...lead,
            ebookAccessId: matchingEbookAccess.id,
            hasEbookAccess: true
          };
        }
      }
      
      return lead;
    });
    
    return updatedLeads;
  } catch (error) {
    console.error('Error linking ebook access to leads:', error);
    throw error;
  }
}

// Function to get unified lead data with all related information
export async function getUnifiedLeadData(): Promise<Lead[]> {
  try {
    // First get leads with telegram subscriptions linked
    const leadsWithTelegram = await linkTelegramSubscriptionsToLeads();
    
    // Then link ebook access to those leads
    const unifiedLeads = await linkEbookAccessToLeads();
    
    // Merge the two sets of linked data
    const finalLeads = unifiedLeads.map(ebookLead => {
      const telegramLead = leadsWithTelegram.find(tgLead => tgLead.id === ebookLead.id);
      
      if (telegramLead && telegramLead.hasTelegramSubscription) {
        return {
          ...ebookLead,
          telegramSubscriptionId: telegramLead.telegramSubscriptionId,
          hasTelegramSubscription: true
        };
      }
      
      return ebookLead;
    });
    
    return finalLeads;
  } catch (error) {
    console.error('Error getting unified lead data:', error);
    throw error;
  }
}

// Dashboard APIs
export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    const [leads, tasks] = await Promise.all([
      getLeads(),
      fetchApi('tasks?select=*')
    ]);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newLeadsThisWeek = leads.filter(
      lead => new Date(lead.createdAt) > weekAgo
    ).length;

    const leadsClosedThisMonth = leads.filter(
      lead => (lead.status === 'closed-won' || lead.status === 'closed-lost') &&
      lead.lastContactedAt && new Date(lead.lastContactedAt) > monthAgo
    ).length;

    const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);

    const leadsByStatus = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const upcomingTasks = tasks.filter(
      (task: Task) => !task.completed && new Date(task.dueDate) > now
    ).length;

    return {
      totalLeads: leads.length,
      newLeadsThisWeek,
      leadsClosedThisMonth,
      totalValue,
      leadsByStatus,
      upcomingTasks
    };
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    throw error;
  }
}

// Student Session APIs
export async function getStudentSessions(): Promise<StudentSession[]> {
  try {
    const data = await fetchApi('student_session_form?select=*');
    return data.map((session: any) => ({
      ...session,
      price: parseFloat(session.price),
      spoken_to_someone_before: session.spoken_to_someone_before === 'TRUE' || session.spoken_to_someone_before === true,
      completed: session.completed === true
    }));
  } catch (error) {
    console.error('Error fetching student sessions:', error);
    throw error;
  }
}

export async function getStudentSession(id: string): Promise<StudentSession> {
  try {
    const data = await fetchApi(`student_session_form?id=eq.${id}&select=*`);
    if (data.length === 0) {
      throw new Error(`Student session with ID ${id} not found`);
    }
    const session = data[0];
    return {
      ...session,
      price: parseFloat(session.price),
      spoken_to_someone_before: session.spoken_to_someone_before === 'TRUE' || session.spoken_to_someone_before === true,
      completed: session.completed === true
    };
  } catch (error) {
    console.error(`Error fetching student session with ID ${id}:`, error);
    throw error;
  }
}

export async function updateStudentSession(id: string, sessionData: Partial<StudentSession>): Promise<StudentSession> {
  try {
    // Add Prefer header to get back representation of the updated record
    await fetchApi(`student_session_form?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Prefer': 'return=minimal' // Don't return the updated record
      },
      body: JSON.stringify(sessionData)
    });
    
    // Fetch the updated record separately
    return getStudentSession(id);
  } catch (error) {
    console.error(`Error updating student session with ID ${id}:`, error);
    throw error;
  }
}

export async function deleteStudentSession(id: string): Promise<void> {
  try {
    await fetchApi(`student_session_form?id=eq.${id}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error(`Error deleting student session with ID ${id}:`, error);
    throw error;
  }
}

// ===== SESSION TYPES API =====

export async function getSessionTypes(): Promise<SessionType[]> {
  try {
    const data = await fetchApi('session_types?order=name.asc');
    return data || [];
  } catch (error) {
    console.error('Error fetching session types:', error);
    throw error;
  }
}

export async function getSessionType(id: string): Promise<SessionType> {
  try {
    const data = await fetchApi(`session_types?id=eq.${id}&limit=1`);
    if (!data || data.length === 0) {
      throw new Error(`Session type with ID ${id} not found`);
    }
    return data[0];
  } catch (error) {
    console.error(`Error fetching session type with ID ${id}:`, error);
    throw error;
  }
}

export async function createSessionType(sessionTypeData: Omit<SessionType, 'id' | 'created_at'>): Promise<SessionType> {
  try {
    const data = await fetchApi('session_types', {
      method: 'POST',
      headers: {
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(sessionTypeData)
    });
    return data[0];
  } catch (error) {
    console.error('Error creating session type:', error);
    throw error;
  }
}

export async function updateSessionType(id: string, sessionTypeData: Partial<SessionType>): Promise<SessionType> {
  try {
    await fetchApi(`session_types?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(sessionTypeData)
    });
    return getSessionType(id);
  } catch (error) {
    console.error(`Error updating session type with ID ${id}:`, error);
    throw error;
  }
}

export async function deleteSessionType(id: string): Promise<void> {
  try {
    await fetchApi(`session_types?id=eq.${id}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error(`Error deleting session type with ID ${id}:`, error);
    throw error;
  }
}

// ===== AVAILABLE SLOTS API =====

export async function getAvailableSlots(): Promise<AvailableSlot[]> {
  try {
    // Get slots without trying to join with instructors or session_types
    const data = await fetchApi('available_slots?select=*&order=slot_date.asc,start_time.asc');
    
    // If we need instructor information, we'll need to fetch it separately
    // since there's no foreign key relationship in the database
    return data?.map((slot: any) => ({
      ...slot,
      instructor_name: 'Instructor', // Default since we can't join
      booking_status: slot.booking_status === 'true' || slot.booking_status === true
    })) || [];
  } catch (error) {
    console.error('Error fetching available slots:', error);
    throw error;
  }
}

export async function getAvailableSlot(id: string): Promise<AvailableSlot> {
  try {
    const data = await fetchApi(`available_slots?id=eq.${id}&select=*,session_types(*),instructors!fk_available_slots_instructor_id(name)`);
    if (!data || data.length === 0) {
      throw new Error('Available slot not found');
    }
    return {
      ...data[0],
      instructor_name: data[0].instructors?.name || 'Unknown Instructor',
      booking_status: data[0].booking_status === 'true' || data[0].booking_status === true
    };
  } catch (error) {
    console.error('Error fetching available slot:', error);
    throw error;
  }
}

export async function createAvailableSlot(slot: Omit<AvailableSlot, 'id' | 'created_at' | 'updated_at' | 'instructor_name' | 'session_types'>): Promise<AvailableSlot> {
  try {
    const data = await fetchApi('available_slots', {
      method: 'POST',
      body: JSON.stringify({
        ...slot,
        booking_status: slot.booking_status || false
      })
    });
    return data[0];
  } catch (error) {
    console.error('Error creating available slot:', error);
    throw error;
  }
}

export async function updateAvailableSlot(id: string, slot: Partial<AvailableSlot>): Promise<AvailableSlot> {
  try {
    const data = await fetchApi(`available_slots?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...slot,
        booking_status: slot.booking_status
      })
    });
    return data[0];
  } catch (error) {
    console.error('Error updating available slot:', error);
    throw error;
  }
}

export async function deleteAvailableSlot(id: string): Promise<void> {
  try {
    await fetchApi(`available_slots?id=eq.${id}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Error deleting available slot:', error);
    throw error;
  }
}

export async function getSlotsBySessionType(sessionTypeId: string): Promise<AvailableSlot[]> {
  try {
    const data = await fetchApi(
      `available_slots?session_type_id=eq.${sessionTypeId}&select=*,session_types(*),instructors!fk_available_slots_instructor_id(name)&order=slot_date.asc,start_time.asc`
    );
    return data?.map((slot: any) => ({
      ...slot,
      instructor_name: slot.instructors?.name || 'Unknown Instructor',
      booking_status: slot.booking_status === 'true' || slot.booking_status === true
    })) || [];
  } catch (error) {
    console.error(`Error fetching slots for session type ${sessionTypeId}:`, error);
    throw error;
  }
}

// Get available slots by instructor ID
export async function getAvailableSlotsByInstructor(instructorId: string): Promise<AvailableSlot[]> {
  try {
    // Use foreign key relationship to filter
    const data = await fetchApi(`available_slots?instructor_id=eq.${instructorId}&order=slot_date.asc,start_time.asc`);
    return (data?.map((slot: any) => ({
      ...slot,
      booking_status: slot.booking_status === 'true' || slot.booking_status === true
    })) || []);
  } catch (error) {
    console.error('Error fetching available slots only:', error);
    throw error;
  }
}

// ====== INSTRUCTOR SESSION TYPES MANAGEMENT ======

// Create session types for an instructor
export async function createInstructorSessionTypes(instructorId: string, sessionTypes: Omit<SessionType, 'id' | 'created_at' | 'updated_at' | 'instructor_id'>[]) {
  try {
    const sessionTypesWithInstructorId = sessionTypes.map(sessionType => ({
      ...sessionType,
      instructor_id: instructorId
    }));
    
    const data = await fetchApi('session_types', {
      method: 'POST',
      headers: {
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(sessionTypesWithInstructorId)
    });
    
    return data;
  } catch (error) {
    console.error('Error creating instructor session types:', error);
    throw error;
  }
}

// Get session types for an instructor
export async function getInstructorSessionTypes(instructorId: string): Promise<SessionType[]> {
  try {
    const data = await fetchApi(`session_types?instructor_id=eq.${instructorId}&order=name.asc`);
    return data || [];
  } catch (error) {
    console.error(`Error fetching session types for instructor ${instructorId}:`, error);
    throw error;
  }
}

// Update session types for an instructor
export async function updateInstructorSessionTypes(instructorId: string, sessionTypes: Partial<SessionType>[]) {
  try {
    const sessionTypesWithInstructorId = sessionTypes.map(sessionType => ({
      ...sessionType,
      instructor_id: instructorId
    }));
    
    const data = await fetchApi('session_types', {
      method: 'PATCH',
      headers: {
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(sessionTypesWithInstructorId)
    });
    
    return data;
  } catch (error) {
    console.error(`Error updating session types for instructor ${instructorId}:`, error);
    throw error;
  }
}

// Delete session types for an instructor
export async function deleteInstructorSessionTypes(instructorId: string, sessionTypeIds: string[]) {
  try {
    const promises = sessionTypeIds.map(sessionTypeId => fetchApi(`session_types?id=eq.${sessionTypeId}`, {
      method: 'DELETE'
    }));
    
    await Promise.all(promises);
  } catch (error) {
    console.error(`Error deleting session types for instructor ${instructorId}:`, error);
    throw error;
  }
}

export async function getAvailableSlotsOnly(): Promise<AvailableSlot[]> {
  try {
    const data = await fetchApi(
      'available_slots?status=eq.available&select=*,session_types(*),instructors!fk_available_slots_instructor_id(name)&order=slot_date.asc,start_time.asc'
    );
    return data?.map((slot: any) => ({
      ...slot,
      instructor_name: slot.instructors?.name || 'Unknown Instructor',
      booking_status: slot.booking_status === 'true' || slot.booking_status === true
    })) || [];
  } catch (error) {
    console.error('Error fetching available slots only:', error);
    throw error;
  }
}

// ====== INSTRUCTOR MANAGEMENT ======

// Get all instructors
export async function getInstructors(): Promise<Instructor[]> {
  try {
    const data = await fetchApi('instructors?order=name.asc');
    return data || [];
  } catch (error) {
    console.error('Error fetching instructors:', error);
    throw error;
  }
}

// Get all instructors (is_active column doesn't exist in database yet)
export async function getActiveInstructors(): Promise<Instructor[]> {
  try {
    const data = await fetchApi('instructors?order=name.asc');
    return data || [];
  } catch (error) {
    console.error('Error fetching active instructors:', error);
    throw error;
  }
}

// Get instructor by ID
export async function getInstructor(id: string): Promise<Instructor> {
  try {
    const data = await fetchApi(`instructors?id=eq.${id}`);
    if (!data || data.length === 0) {
      throw new Error(`Instructor with ID ${id} not found`);
    }
    return data[0];
  } catch (error) {
    console.error(`Error fetching instructor with ID ${id}:`, error);
    throw error;
  }
}

// Create new instructor
export async function createInstructor(instructorData: Omit<Instructor, 'id' | 'created_at' | 'updated_at'>): Promise<Instructor> {
  try {
    const data = await fetchApi('instructors', {
      method: 'POST',
      headers: {
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(instructorData)
    });
    return data[0];
  } catch (error) {
    console.error('Error creating instructor:', error);
    throw error;
  }
}

// Update instructor
export async function updateInstructor(id: string, instructorData: Partial<Instructor>): Promise<Instructor> {
  try {
    await fetchApi(`instructors?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(instructorData)
    });
    return getInstructor(id);
  } catch (error) {
    console.error(`Error updating instructor with ID ${id}:`, error);
    throw error;
  }
}

// Delete instructor
export async function deleteInstructor(id: string): Promise<void> {
  try {
    await fetchApi(`instructors?id=eq.${id}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error(`Error deleting instructor with ID ${id}:`, error);
    throw error;
  }
}

// Get instructor with their available slots
export async function getInstructorWithSlots(instructorId: string): Promise<Instructor & { available_slots: AvailableSlot[] }> {
  try {
    // Use the specific foreign key relationship
    const data = await fetchApi(`instructors?id=eq.${instructorId}&select=*,available_slots:available_slots!fk_available_slots_instructor_id(id,session_type_id,slot_date,start_time,end_time,status,session_types(*))`);
    
    if (!data || data.length === 0) {
      throw new Error(`Instructor with ID ${instructorId} not found`);
    }
    
    // Map the slots to include instructor_name
    const instructor = data[0];
    const slots = instructor.available_slots?.map((slot: any) => ({
      ...slot,
      instructor_name: instructor.name || 'Unknown Instructor',
      booking_status: slot.booking_status === 'true' || slot.booking_status === true
    })) || [];
    
    return {
      ...instructor,
      available_slots: slots
    };
  } catch (error) {
    console.error(`Error fetching instructor with slots for ID ${instructorId}:`, error);
    throw error;
  }
}

// Student Session Form API
export async function getStudentSessionForms(): Promise<StudentSessionForm[]> {
  try {
    const data = await fetchApi('student_session_form?order=created_at.desc');
    return data || [];
  } catch (error) {
    console.error('Error fetching student session forms:', error);
    throw error;
  }
}

export async function getStudentSessionForm(id: string): Promise<StudentSessionForm> {
  try {
    const data = await fetchApi(`student_session_form?id=eq.${id}`);
    if (!data || data.length === 0) {
      throw new Error('Student session form not found');
    }
    return data[0];
  } catch (error) {
    console.error('Error fetching student session form:', error);
    throw error;
  }
}

export async function getStudentSessionBySlot(slotDate: string, slotTime: string): Promise<StudentSessionForm | null> {
  try {
    const data = await fetchApi(`student_session_form?session_date=eq.${slotDate}&session_time=eq.${slotTime}`);
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error fetching student session by slot:', error);
    return null;
  }
}

export async function updateStudentSessionForm(id: string, form: Partial<StudentSessionForm>): Promise<StudentSessionForm> {
  try {
    const data = await fetchApi(`student_session_form?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(form)
    });
    return data[0];
  } catch (error) {
    console.error('Error updating student session form:', error);
    throw error;
  }
}

// ====== INSTRUCTOR HIGHLIGHTS MANAGEMENT ======

// Create highlights for an instructor
export async function createInstructorHighlights(instructorId: string, highlights: Omit<InstructorHighlight, 'id' | 'created_at' | 'updated_at' | 'instructor_id'>[]) {
  try {
    const highlightsWithInstructorId = highlights.map(highlight => ({
      ...highlight,
      instructor_id: instructorId
    }));
    
    const data = await fetchApi('instructor_highlights', {
      method: 'POST',
      headers: {
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(highlightsWithInstructorId)
    });
    
    return data;
  } catch (error) {
    console.error('Error creating instructor highlights:', error);
    throw error;
  }
}

// Get highlights for an instructor
export async function getInstructorHighlights(instructorId: string): Promise<InstructorHighlight[]> {
  try {
    const data = await fetchApi(`instructor_highlights?instructor_id=eq.${instructorId}&order=display_order.asc`);
    return data || [];
  } catch (error) {
    console.error('Error fetching instructor highlights:', error);
    throw error;
  }
}

// ====== INSTRUCTOR SUPPORT AREAS MANAGEMENT ======

// Create support areas for an instructor
export async function createInstructorSupportAreas(instructorId: string, supportAreas: Omit<SupportArea, 'id' | 'created_at' | 'updated_at' | 'instructor_id'>[]) {
  try {
    const areasWithInstructorId = supportAreas.map(area => ({
      ...area,
      instructor_id: instructorId
    }));
    
    const data = await fetchApi('instructor_support_areas', {
      method: 'POST',
      headers: {
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(areasWithInstructorId)
    });
    
    return data;
  } catch (error) {
    console.error('Error creating instructor support areas:', error);
    throw error;
  }
}

// Get support areas for an instructor
export async function getInstructorSupportAreas(instructorId: string): Promise<SupportArea[]> {
  try {
    const data = await fetchApi(`instructor_support_areas?instructor_id=eq.${instructorId}&order=display_order.asc`);
    return data || [];
  } catch (error) {
    console.error('Error fetching instructor support areas:', error);
    throw error;
  }
}

// ====== INSTRUCTOR OFFERINGS MANAGEMENT ======

// Create offerings for an instructor
export async function createInstructorOfferings(instructorId: string, offerings: Omit<InstructorOffering, 'id' | 'created_at' | 'updated_at' | 'instructor_id'>[]) {
  try {
    const offeringsWithInstructorId = offerings.map(offering => ({
      ...offering,
      instructor_id: instructorId
    }));
    
    const data = await fetchApi('instructor_offerings', {
      method: 'POST',
      headers: {
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(offeringsWithInstructorId)
    });
    
    return data;
  } catch (error) {
    console.error('Error creating instructor offerings:', error);
    throw error;
  }
}

// Get offerings for an instructor
export async function getInstructorOfferings(instructorId: string): Promise<InstructorOffering[]> {
  try {
    const data = await fetchApi(`instructor_offerings?instructor_id=eq.${instructorId}&order=display_order.asc`);
    return data || [];
  } catch (error) {
    console.error('Error fetching instructor offerings:', error);
    throw error;
  }
}

// ====== INSTRUCTOR PAGE SECTIONS MANAGEMENT ======

// Create page sections for an instructor
export async function createInstructorPageSections(instructorId: string, pageSections: Omit<PageSection, 'id' | 'created_at' | 'updated_at' | 'instructor_id'>[]) {
  try {
    const sectionsWithInstructorId = pageSections.map(section => ({
      ...section,
      instructor_id: instructorId
    }));
    
    const data = await fetchApi('instructor_page_sections', {
      method: 'POST',
      headers: {
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(sectionsWithInstructorId)
    });
    
    return data;
  } catch (error) {
    console.error('Error creating instructor page sections:', error);
    throw error;
  }
}

// Get page sections for an instructor
export async function getInstructorPageSections(instructorId: string): Promise<PageSection[]> {
  try {
    const data = await fetchApi(`instructor_page_sections?instructor_id=eq.${instructorId}&order=display_order.asc`);
    return data || [];
  } catch (error) {
    console.error('Error fetching instructor page sections:', error);
    throw error;
  }
}

// ====== INSTRUCTOR TESTIMONIALS MANAGEMENT ======

// Create testimonials for an instructor
export async function createInstructorTestimonials(instructorId: string, testimonials: Omit<Testimonial, 'id' | 'created_at' | 'updated_at' | 'instructor_id'>[]) {
  try {
    const testimonialsWithInstructorId = testimonials.map(testimonial => ({
      ...testimonial,
      instructor_id: instructorId
    }));
    
    const data = await fetchApi('instructor_testimonials', {
      method: 'POST',
      headers: {
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testimonialsWithInstructorId)
    });
    
    return data;
  } catch (error) {
    console.error('Error creating instructor testimonials:', error);
    throw error;
  }
}

// Get testimonials for an instructor
export async function getInstructorTestimonials(instructorId: string): Promise<Testimonial[]> {
  try {
    const data = await fetchApi(`instructor_testimonials?instructor_id=eq.${instructorId}&order=id.asc`);
    return data || [];
  } catch (error) {
    console.error('Error fetching instructor testimonials:', error);
    throw error;
  }
}

// Student Bookings API Functions
export async function getStudentBookings(): Promise<StudentBooking[]> {
  try {
    const data = await fetchApi('student_bookings?select=*');
    return data || [];
  } catch (error) {
    console.error('Error fetching student bookings:', error);
    throw error;
  }
}

export async function getStudentBookingById(id: string): Promise<StudentBooking> {
  try {
    const data = await fetchApi(`student_bookings?id=eq.${id}`);
    if (!data || data.length === 0) {
      throw new Error(`Student booking with ID ${id} not found`);
    }
    return data[0];
  } catch (error) {
    console.error(`Error fetching student booking with ID ${id}:`, error);
    throw error;
  }
}

export async function updateBookingStatus(id: string, status: 'BOOKED' | 'CANCELLED' | 'COMPLETED'): Promise<StudentBooking> {
  try {
    const data = await fetchApi(`student_bookings?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    return data[0];
  } catch (error) {
    console.error(`Error updating booking status for ID ${id}:`, error);
    throw error;
  }
}

export async function updateMeetingLink(id: string, meetingLink: string): Promise<StudentBooking> {
  try {
    const data = await fetchApi(`student_bookings?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ meeting_link: meetingLink })
    });
    return data[0];
  } catch (error) {
    console.error(`Error updating meeting link for booking ID ${id}:`, error);
    throw error;
  }
}