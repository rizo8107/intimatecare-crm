// Telegram API service
// This service handles communication with the Telegram Bot API
import { supabase } from './supabaseClient';

// Telegram bot token from the user
const TELEGRAM_BOT_TOKEN = '8077094761:AAGolW23bFBbP6AURLFonsF83RBWLRUcfQY';
const TELEGRAM_API_BASE_URL = 'https://api.telegram.org/bot';
const TEMPLATE_STORAGE_KEY = 'telegram_message_templates';

// Flag to determine if we're using the database or localStorage
// Temporarily set to false until we resolve the RLS policy issue
const USE_DATABASE_STORAGE = false;

// Default user ID in UUID format for templates
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

// Types
export interface TelegramMessage {
  chatId: string;
  text: string;
}

// Template interface
export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
}

// Define the possible result types from Telegram API
export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: {
    id: number;
    type: string;
    title?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  date: number;
  message_text?: string; // Renamed to avoid conflict with TelegramMessage.text
}

export interface TelegramResponse {
  ok: boolean;
  result?: TelegramUser | TelegramMessage | unknown;
  description?: string;
}
/**
 * Send a message to a Telegram user
 * @param chatId Telegram chat ID
 * @param text Message text
 * @returns API response
 */
export const sendMessage = async (chatId: string, text: string): Promise<TelegramResponse> => {
  try {
    const response = await fetch(`${TELEGRAM_API_BASE_URL}${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API error: ${errorData.description || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    throw error;
  }
};

/**
 * Get information about the Telegram bot
 * @returns Bot information
 */
export const getBotInfo = async (): Promise<TelegramResponse> => {
  try {
    const response = await fetch(`${TELEGRAM_API_BASE_URL}${TELEGRAM_BOT_TOKEN}/getMe`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API error: ${errorData.description || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting bot info:', error);
    throw error;
  }
};

/**
 * Send a campaign message to multiple users
 * @param chatIds Array of chat IDs
 * @param text Message text
 * @returns Object with success and error counts
 */
export const sendCampaignMessage = async (chatIds: string[], text: string): Promise<{ success: number; errors: number; errorMessages: string[] }> => {
  const results = {
    success: 0,
    errors: 0,
    errorMessages: [] as string[],
  };
  
  const sendPromises = chatIds.map(async (chatId) => {
    try {
      await sendMessage(chatId, text);
      results.success++;
      return true;
    } catch (error) {
      results.errors++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.errorMessages.push(`Failed to send to ${chatId}: ${errorMessage}`);
      return false;
    }
  });
  
  await Promise.all(sendPromises);
  
  return results;
};

/**
 * Save a message template
 * @param name Template name
 * @param content Template content
 * @param id Optional ID for updating existing template
 * @returns The saved template
 */
export const saveMessageTemplate = async (name: string, content: string, id?: string): Promise<MessageTemplate> => {
  if (USE_DATABASE_STORAGE) {
    // Using Supabase database
    if (id) {
      // Update existing template
      const { data, error } = await supabase
        .from('message_templates')
        .update({ name, content, updated_at: new Date() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating template:', error);
        throw error;
      }
      
      return {
        id: data.id,
        name: data.name,
        content: data.content,
        createdAt: new Date(data.created_at),
        lastUsed: data.last_used ? new Date(data.last_used) : undefined,
        useCount: data.use_count || 0
      };
    } else {
      // Create new template
      const { data, error } = await supabase
        .from('message_templates')
        .insert({
          name,
          content,
          template_type: 'telegram',
          user_id: DEFAULT_USER_ID // Using a default user_id in UUID format
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating template:', error);
        throw error;
      }
      
      return {
        id: data.id,
        name: data.name,
        content: data.content,
        createdAt: new Date(data.created_at),
        useCount: data.use_count || 0
      };
    }
  }
  
  // Using localStorage
  const templates = await getMessageTemplates();
  const now = new Date();
  
  if (id) {
    // Update existing template
    const templateIndex = templates.findIndex(t => t.id === id);
    if (templateIndex !== -1) {
      templates[templateIndex] = {
        ...templates[templateIndex],
        name,
        content,
        updatedAt: now
      };
    } else {
      throw new Error(`Template with ID ${id} not found`);
    }
  } else {
    // Create new template
    const newTemplate: MessageTemplate = {
      id: Date.now().toString(),
      name,
      content,
      createdAt: now,
      useCount: 0
    };
    templates.unshift(newTemplate);
  }
  
  localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
  return templates.find(t => t.name === name) as MessageTemplate;
};

/**
 * Get all message templates
 * @returns Array of message templates
 */
export const getMessageTemplates = async (): Promise<MessageTemplate[]> => {
  if (USE_DATABASE_STORAGE) {
    // Using Supabase database
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('template_type', 'telegram')
      .eq('user_id', DEFAULT_USER_ID) // Filter by the same user_id used in saveMessageTemplate
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
    
    return data.map(item => ({
      id: item.id,
      name: item.name,
      content: item.content,
      createdAt: new Date(item.created_at),
      lastUsed: item.last_used ? new Date(item.last_used) : undefined,
      useCount: item.use_count || 0
    }));
  }
  
  // Using localStorage
  const templatesJson = localStorage.getItem(TEMPLATE_STORAGE_KEY);
  if (!templatesJson) return [];
  
  try {
    const templates = JSON.parse(templatesJson);
    return templates.map((template: Partial<MessageTemplate>) => ({
      ...template,
      createdAt: new Date(template.createdAt as string | number | Date),
      lastUsed: template.lastUsed ? new Date(template.lastUsed as string | number | Date) : undefined
    }));
  } catch (error) {
    console.error('Error parsing templates:', error);
    return [];
  }
};

/**
 * Delete a message template
 * @param id Template ID to delete
 * @returns True if deleted successfully
 */
export const deleteMessageTemplate = async (id: string): Promise<boolean> => {
  if (USE_DATABASE_STORAGE) {
    // Using Supabase database
    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', DEFAULT_USER_ID); // Filter by user_id for RLS policy
    
    if (error) {
      console.error('Error deleting template:', error);
      return false;
    }
    
    return true;
  }
  
  // Using localStorage
  const templates = await getMessageTemplates();
  const initialLength = templates.length;
  
  const filteredTemplates = templates.filter(template => template.id !== id);
  
  if (filteredTemplates.length === initialLength) {
    // No template was removed
    return false;
  }
  
  localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(filteredTemplates));
  return true;
};

/**
 * Update a message template
 * @param id Template ID to update
 * @param updates Object with name and/or content to update
 * @returns Updated template or null if not found
 */
export const updateMessageTemplate = async (
  id: string, 
  updates: Partial<Pick<MessageTemplate, 'name' | 'content'>>
): Promise<MessageTemplate | null> => {
  if (USE_DATABASE_STORAGE) {
    // Using Supabase database
    const { data, error } = await supabase
      .from('message_templates')
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', id)
      .eq('user_id', DEFAULT_USER_ID) // Filter by user_id for RLS policy
      .select()
      .single();
    
    if (error) {
      console.error('Error updating template:', error);
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      content: data.content,
      createdAt: new Date(data.created_at),
      lastUsed: data.last_used ? new Date(data.last_used) : undefined,
      useCount: data.use_count || 0
    };
  }
  
  // Using localStorage
  const templates = await getMessageTemplates();
  const templateIndex = templates.findIndex(template => template.id === id);
  
  if (templateIndex === -1) {
    return null;
  }
  
  templates[templateIndex] = {
    ...templates[templateIndex],
    ...updates,
  };
  
  localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
  return templates[templateIndex];
};

/**
 * Use a message template and update its usage statistics
 * @param id Template ID to use
 * @returns The template content or null if not found
 */
export const useMessageTemplate = async (id: string): Promise<string | null> => {
  if (USE_DATABASE_STORAGE) {
    // Using Supabase database
    // First, get the current template
    const { data: template, error: fetchError } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', id)
      .eq('user_id', DEFAULT_USER_ID) // Filter by user_id for RLS policy
      .single();
    
    if (fetchError) {
      console.error('Error fetching template:', fetchError);
      return null;
    }
    
    // Update usage statistics
    const { error: updateError } = await supabase
      .from('message_templates')
      .update({
        last_used: new Date(),
        use_count: (template.use_count || 0) + 1
      })
      .eq('id', id)
      .eq('user_id', DEFAULT_USER_ID); // Filter by user_id for RLS policy
    
    if (updateError) {
      console.error('Error updating template usage:', updateError);
      // Continue anyway, as we still want to return the content
    }
    
    return template.content;
  }
  
  // Using localStorage
  const templates = await getMessageTemplates();
  const templateIndex = templates.findIndex(template => template.id === id);
  
  if (templateIndex === -1) {
    return null;
  }
  
  // Update usage statistics
  templates[templateIndex] = {
    ...templates[templateIndex],
    lastUsed: new Date(),
    useCount: (templates[templateIndex].useCount || 0) + 1
  };
  
  localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
  return templates[templateIndex].content;
};

/**
 * Apply template variables to a message template
 * @param templateContent The template content with variables like {{name}}
 * @param variables Object with variable values, e.g. { name: 'John' }
 * @returns Processed message with variables replaced
 */
export const processTemplateVariables = (templateContent: string, variables: Record<string, string>): string => {
  let processedContent = templateContent;
  
  // Replace each variable
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedContent = processedContent.replace(regex, value);
  });
  
  return processedContent;
};

export default {
  sendMessage,
  sendCampaignMessage,
  getBotInfo,
  saveMessageTemplate,
  getMessageTemplates,
  deleteMessageTemplate,
  updateMessageTemplate,
  useMessageTemplate,
  processTemplateVariables
};
