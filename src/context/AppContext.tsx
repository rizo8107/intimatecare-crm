import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lead, LeadStatus, PaymentData, User, TelegramSubscription, EbookAccess } from '../types';
import { 
  getLeads, 
  getPaymentData, 
  createLead, 
  getTelegramSubscriptions, 
  getEbookAccess, 
  getUnifiedLeadData,
  linkTelegramSubscriptionsToLeads,
  linkEbookAccessToLeads
} from '../services/api';
import ToastContainer, { ToastContext, ToastOptions } from '../components/ui/ToastContainer';

interface AppContextType {
  leads: Lead[];
  filteredLeads: Lead[];
  telegramSubscriptions: TelegramSubscription[];
  ebookAccess: EbookAccess[];
  isLoading: boolean;
  error: string | null;
  currentUser: User | null;
  setFilteredLeads: (leads: Lead[]) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: LeadStatus | 'all';
  setStatusFilter: (status: LeadStatus | 'all') => void;
  refreshData: () => Promise<void>;
  syncPaymentsToLeads: () => Promise<void>;
  syncAllData: () => Promise<void>;
  isSyncing: boolean;
  getTelegramSubscriptionForLead: (leadId: string) => TelegramSubscription | undefined;
  getEbookAccessForLead: (leadId: string) => EbookAccess | undefined;
  showToast: (options: ToastOptions) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Access toast context
  const toast = useContext(ToastContext);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [telegramSubscriptions, setTelegramSubscriptions] = useState<TelegramSubscription[]>([]);
  const [ebookAccess, setEbookAccess] = useState<EbookAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  
  // Mock current user - in a real app, this would come from auth
  const [currentUser] = useState<User>({
    id: 'user1',
    name: 'Alex Taylor',
    email: 'alex@example.com',
    role: 'admin',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
  });

  // Fetch all data including leads, telegram subscriptions, and ebook access
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Get unified lead data with all relationships
      const unifiedLeads = await getUnifiedLeadData();
      setLeads(unifiedLeads);
      setFilteredLeads(unifiedLeads);
      
      // Also fetch the related data for reference
      const fetchedTelegramSubs = await getTelegramSubscriptions();
      setTelegramSubscriptions(fetchedTelegramSubs);
      
      const fetchedEbookAccess = await getEbookAccess();
      setEbookAccess(fetchedEbookAccess);
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Apply filters when searchTerm or statusFilter changes
  useEffect(() => {
    let filtered = leads;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }
    
    // Apply search filter (case insensitive)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(lead => 
        lead.name.toLowerCase().includes(term) || 
        lead.company.toLowerCase().includes(term) || 
        lead.email.toLowerCase().includes(term) || 
        lead.phone.toLowerCase().includes(term)
      );
    }
    
    setFilteredLeads(filtered);
  }, [leads, searchTerm, statusFilter]);

  // Convert payment data to leads
  const convertPaymentToLead = (payment: PaymentData): Omit<Lead, 'id' | 'createdAt'> => {
    // Extract name from email (before @) and capitalize first letter
    const nameParts = payment.email.split('@')[0].split('.');
    const name = nameParts.map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
    
    return {
      name: name,
      company: payment.product,
      email: payment.email,
      phone: payment.phone.toString(),
      status: 'new' as LeadStatus,
      lastContactedAt: null,
      assignedTo: null,
      value: payment.amount / 100 // Convert from paise to rupees
    };
  };

  // Sync payments to leads
  const syncPaymentsToLeads = async () => {
    setIsSyncing(true);
    try {
      const payments = await getPaymentData();
      const existingEmails = leads.map(lead => lead.email.toLowerCase());
      
      // Filter out payments that already exist as leads
      const newPayments = payments.filter(
        payment => !existingEmails.includes(payment.email.toLowerCase())
      );
      
      if (newPayments.length === 0) {
        setError('No new payments to sync');
        return;
      }
      
      // Convert payments to leads and create them
      const leadPromises = newPayments.map(async (payment) => {
        const newLead = convertPaymentToLead(payment);
        return await createLead(newLead);
      });
      
      await Promise.all(leadPromises);
      
      // Refresh data to show new leads
      await fetchData();
      setError(null);
    } catch (err) {
      setError('Failed to sync payments to leads. Please try again later.');
      console.error('Error syncing payments:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Function to get telegram subscription for a specific lead
  const getTelegramSubscriptionForLead = (leadId: string): TelegramSubscription | undefined => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead || !lead.telegramSubscriptionId) return undefined;
    
    return telegramSubscriptions.find(sub => sub.id === lead.telegramSubscriptionId);
  };
  
  // Function to get ebook access for a specific lead
  const getEbookAccessForLead = (leadId: string): EbookAccess | undefined => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead || !lead.ebookAccessId) return undefined;
    
    return ebookAccess.find(ebook => ebook.id === lead.ebookAccessId);
  };
  
  // Function to sync all data sources and create relationships
  const syncAllData = async () => {
    setIsSyncing(true);
    try {
      // First sync payments to leads
      await syncPaymentsToLeads();
      
      // Then link telegram subscriptions and ebook access
      await linkTelegramSubscriptionsToLeads();
      await linkEbookAccessToLeads();
      
      // Refresh data to show updated relationships
      await fetchData();
      setError(null);
    } catch (err) {
      setError('Failed to sync all data. Please try again later.');
      console.error('Error syncing all data:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <ToastContainer position="top-right">
      <AppContext.Provider
        value={{
          leads,
          filteredLeads,
          telegramSubscriptions,
          ebookAccess,
          isLoading,
          error,
          currentUser,
          setFilteredLeads,
          searchTerm,
          setSearchTerm,
          statusFilter,
          setStatusFilter,
          refreshData: fetchData,
          syncPaymentsToLeads,
          syncAllData,
          isSyncing,
          getTelegramSubscriptionForLead,
          getEbookAccessForLead,
          showToast: toast.showToast,
        }}
      >
        {children}
      </AppContext.Provider>
    </ToastContainer>
  );
};