import { DashboardSummary, EbookAccess, Lead, LeadStatus, Note, PaymentData, Task, TelegramSubscription } from '../types';

const API_URL = 'https://crm-supabase.7za6uc.easypanel.host/rest/v1';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzQ5ODM5NDAwLCJleHAiOjE5MDc2MDU4MDB9.sWCsUjb5xqDn6pIkPlhHScIHJ1ytr8rlTH-SdrHLuZE';

const headers = {
  'apikey': API_KEY,
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Helper function to make API requests
async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}/${endpoint}`;
  try {
    const response = await fetch(url, {
      headers,
      ...options,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`
      );
    }

    return response.json();
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