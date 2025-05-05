import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { Send, CheckCircle, AlertCircle, Users, Info, Save, Trash, Edit, BookOpen } from 'lucide-react';
import { 
  getBotInfo, 
  sendMessage, 
  getMessageTemplates, 
  saveMessageTemplate, 
  deleteMessageTemplate, 
  useMessageTemplate as applyMessageTemplate,
  MessageTemplate,
  TelegramUser
} from '../../services/telegramService';
import { getTelegramSubscriptions } from '../../services/api';
import { TelegramSubscription } from '../../types';
import StatusBadge from '../ui/StatusBadge';

// Campaign message status
type MessageStatus = 'pending' | 'sent' | 'failed';

// Message type for tracking campaign messages
type CampaignMessage = {
  leadId: string;
  leadName: string;
  status: MessageStatus;
  error?: string;
  sentAt?: Date;
  telegramUserId?: number;
};

const TelegramCampaign: React.FC = () => {
  const { filteredLeads, isLoading } = useAppContext();
  
  // State for campaign
  const [message, setMessage] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [campaignMessages, setCampaignMessages] = useState<CampaignMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showOnlyWithTelegram, setShowOnlyWithTelegram] = useState(true);
  const [botInfo, setBotInfo] = useState<{name: string; username: string} | null>(null);
  const [botInfoLoading, setBotInfoLoading] = useState(false);
  const [telegramSubscriptions, setTelegramSubscriptions] = useState<TelegramSubscription[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
  
  // Template management state
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  
  // Fetch Telegram subscriptions
  useEffect(() => {
    const fetchTelegramSubscriptions = async () => {
      setIsLoadingSubscriptions(true);
      try {
        const subscriptions = await getTelegramSubscriptions();
        setTelegramSubscriptions(subscriptions);
      } catch (error) {
        console.error('Error fetching Telegram subscriptions:', error);
      } finally {
        setIsLoadingSubscriptions(false);
      }
    };
    
    fetchTelegramSubscriptions();
  }, []);
  
  // Load message templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const loadedTemplates = await getMessageTemplates();
        setTemplates(loadedTemplates);
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    };
    
    loadTemplates();
    
    // Add event listener to update templates when localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'telegram_message_templates') {
        loadTemplates();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Filtered leads that have Telegram subscriptions
  const eligibleLeads = showOnlyWithTelegram 
    ? filteredLeads.filter(lead => lead.hasTelegramSubscription)
    : filteredLeads;
  
  // Handle lead selection
  const toggleLeadSelection = (leadId: string) => {
    if (selectedLeads.includes(leadId)) {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    } else {
      setSelectedLeads([...selectedLeads, leadId]);
    }
  };
  
  // Select/deselect all leads
  const toggleSelectAll = () => {
    if (selectedLeads.length === eligibleLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(eligibleLeads.map(lead => lead.id));
    }
  };
  
  // Fetch bot info on component mount
  useEffect(() => {
    const fetchBotInfo = async () => {
      setBotInfoLoading(true);
      try {
        const response = await getBotInfo();
        if (response.ok && response.result) {
          // Type assertion to handle the unknown type
          const botData = response.result as TelegramUser;
          setBotInfo({
            name: botData.first_name,
            username: botData.username
          });
        }
      } catch (error) {
        console.error('Error fetching bot info:', error);
      } finally {
        setBotInfoLoading(false);
      }
    };
    
    fetchBotInfo();
  }, []);

  // Find Telegram user ID for a lead
  const getTelegramUserIdForLead = (leadId: string): number | undefined => {
    const lead = filteredLeads.find(l => l.id === leadId);
    if (!lead || !lead.telegramSubscriptionId) return undefined;
    
    const subscription = telegramSubscriptions.find(s => s.id === lead.telegramSubscriptionId);
    return subscription?.telegram_user_id;
  };
  
  // Send campaign messages
  const sendCampaign = async () => {
    if (!message.trim()) {
      alert('Please enter a message to send');
      return;
    }
    
    if (selectedLeads.length === 0) {
      alert('Please select at least one lead to send the message to');
      return;
    }
    
    setIsSending(true);
    
    // Initialize campaign messages
    const initialMessages: CampaignMessage[] = selectedLeads.map(leadId => {
      const lead = filteredLeads.find(l => l.id === leadId);
      const telegramUserId = getTelegramUserIdForLead(leadId);
      
      return {
        leadId,
        leadName: lead?.name || 'Unknown',
        status: 'pending',
        telegramUserId
      };
    });
    
    setCampaignMessages(initialMessages);
    
    // Process each lead
    for (const leadId of selectedLeads) {
      try {
        const lead = filteredLeads.find(l => l.id === leadId);
        if (!lead) continue;
        
        // Get the Telegram user ID from our database
        const telegramUserId = getTelegramUserIdForLead(leadId);
        
        if (!telegramUserId) {
          throw new Error('No Telegram user ID found for this lead');
        }
        
        // Send message using the Telegram API
        const response = await sendMessage(telegramUserId.toString(), message);
        
        if (!response.ok) {
          throw new Error(response.description || 'Failed to send message');
        }
        
        // Update status to sent
        setCampaignMessages(prev => 
          prev.map(msg => 
            msg.leadId === leadId 
              ? { ...msg, status: 'sent', sentAt: new Date() } 
              : msg
          )
        );
      } catch (error) {
        // Update status to failed
        setCampaignMessages(prev => 
          prev.map(msg => 
            msg.leadId === leadId 
              ? { ...msg, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' } 
              : msg
          )
        );
      }
    }
    
    setIsSending(false);
  };
  
  // Save current message as template
  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      alert('Please enter a template name');
      return;
    }
    
    if (!message.trim()) {
      alert('Cannot save empty template');
      return;
    }
    
    try {
      if (editingTemplate) {
        // Update existing template
        await saveMessageTemplate(newTemplateName, message, editingTemplate.id);
        const updatedTemplates = await getMessageTemplates();
        setTemplates(updatedTemplates);
        setShowTemplateManager(false);
        setEditingTemplate(null);
        setNewTemplateName('');
      } else {
        // Create new template
        const newTemplate = await saveMessageTemplate(newTemplateName, message);
        setTemplates([...templates, newTemplate]);
        setShowTemplateManager(false);
        setNewTemplateName('');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template. Please try again.');
    }
  };
  
  // Delete a template
  const handleDeleteTemplate = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        const success = await deleteMessageTemplate(id);
        if (success) {
          setTemplates(templates.filter(t => t.id !== id));
        } else {
          alert('Failed to delete template. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('Failed to delete template. Please try again.');
      }
    }
  };
  
  // Helper function to update template usage
  const updateTemplateUsage = async (templateId: string, templateContent: string) => {
    try {
      // Set message content immediately
      setMessage(templateContent);
      setShowTemplateManager(false);
      
      // Update usage count in background
      await applyMessageTemplate(templateId);
      const updatedTemplates = await getMessageTemplates();
      setTemplates(updatedTemplates);
    } catch (error) {
      console.error('Error updating template usage:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Telegram Campaign</h1>
        <div className="flex items-center space-x-4">
          {isLoadingSubscriptions && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="animate-pulse">Loading subscriptions...</span>
            </div>
          )}
          {botInfoLoading ? (
            <div className="flex items-center text-sm text-gray-600">
              <span className="animate-pulse">Loading bot info...</span>
            </div>
          ) : botInfo ? (
            <div className="flex items-center text-sm text-gray-600">
              <Info size={16} className="mr-1" />
              <span>Using bot: <strong>{botInfo.name}</strong> (@{botInfo.username})</span>
            </div>
          ) : (
            <div className="flex items-center text-sm text-red-600">
              <AlertCircle size={16} className="mr-1" />
              <span>Could not connect to Telegram bot</span>
            </div>
          )}
          <label className="flex items-center space-x-2 text-sm">
            <input 
              type="checkbox" 
              checked={showOnlyWithTelegram} 
              onChange={() => setShowOnlyWithTelegram(!showOnlyWithTelegram)}
              className="rounded text-blue-600"
            />
            <span>Show only leads with Telegram</span>
          </label>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose Message */}
        <Card>
          <CardHeader>
            <CardTitle>Compose Message</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={() => {
                      // Show templates or load a template
                      if (templates.length > 0) {
                        setShowTemplateManager(true);
                      } else {
                        alert('No templates saved yet. Create a template first.');
                      }
                    }}
                    title="Use Templates"
                  >
                    <BookOpen size={16} className="mr-1" />
                    <span>Templates</span>
                  </Button>
                </div>
                <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-40 rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                placeholder="Enter your campaign message here...
Use {{name}} for recipient's name and other variables."
              />
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className="flex items-center space-x-1"
                    onClick={() => {
                      if (!message.trim()) {
                        alert('Please enter a message to save as template');
                        return;
                      }
                      setEditingTemplate(null);
                      setNewTemplateName('');
                      setShowTemplateManager(true);
                    }}
                    title="Save as template"
                    size="sm"
                  >
                    <Save size={16} />
                    <span>Save Template</span>
                  </Button>
                  <Button
                    variant="primary"
                    className="flex items-center space-x-2"
                    onClick={sendCampaign}
                    disabled={isSending || selectedLeads.length === 0 || !message.trim()}
                    size="sm"
                  >
                    <Send size={16} />
                    <span>Send Campaign</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Campaign Results */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaignMessages.length > 0 ? (
                <div className="overflow-y-auto max-h-64">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lead
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sent At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {campaignMessages.map((msg) => (
                        <tr key={msg.leadId}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{msg.leadName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {msg.status === 'sent' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle size={12} className="mr-1" /> Sent
                              </span>
                            )}
                            {msg.status === 'failed' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800" title={msg.error}>
                                <AlertCircle size={12} className="mr-1" /> Failed
                              </span>
                            )}
                            {msg.status === 'pending' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {msg.sentAt ? new Date(msg.sentAt).toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No messages sent yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Lead Selection */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Select Leads</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleSelectAll}
              className="flex items-center space-x-1"
            >
              <Users size={16} />
              <span>{selectedLeads.length === eligibleLeads.length ? 'Deselect All' : 'Select All'}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading leads...</div>
          ) : eligibleLeads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No leads available{showOnlyWithTelegram ? ' with Telegram subscriptions' : ''}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Select
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telegram
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {eligibleLeads.map((lead) => (
                    <tr 
                      key={lead.id}
                      className={`hover:bg-gray-50 transition-colors duration-150 ease-in-out ${selectedLeads.includes(lead.id) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input 
                          type="checkbox" 
                          checked={selectedLeads.includes(lead.id)} 
                          onChange={() => toggleLeadSelection(lead.id)}
                          className="rounded text-blue-600"
                          aria-label={`Select ${lead.name}`}
                          title={`Select ${lead.name}`}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                            <div className="text-sm text-gray-500">{lead.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lead.company}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.hasTelegramSubscription ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Subscribed (ID: {getTelegramUserIdForLead(lead.id) || 'Unknown'})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Not Subscribed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Template Manager Modal */}
      {showTemplateManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {editingTemplate ? 'Edit Template' : 'Save Message as Template'}
                </h3>
                <button
                  onClick={() => setShowTemplateManager(false)}
                  className="text-gray-500 hover:text-gray-700"
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter a name for this template"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Content
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={6}
                    placeholder="Enter your template content here...\nUse {{name}} for recipient's name and other variables."
                  />
                </div>
                
                <div className="text-xs text-gray-500 italic">
                  Use <code>{'{{name}}'}</code> for recipient's name and other variables.
                </div>
                
                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowTemplateManager(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSaveTemplate}
                    disabled={!newTemplateName.trim() || !message.trim()}
                    size="sm"
                  >
                    Save
                  </Button>
                </div>
                
                {/* Template List */}
                {templates.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">Saved Templates</h4>
                    <div className="max-h-40 overflow-y-auto">
                      {templates.map(template => (
                        <div 
                          key={template.id} 
                          className="flex justify-between items-center py-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        >
                          <div 
                            className="flex-1 truncate pr-2" 
                            onClick={() => updateTemplateUsage(template.id, template.content)}
                          >
                            <span className="text-sm font-medium">{template.name}</span>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => {
                                setEditingTemplate(template);
                                setNewTemplateName(template.name);
                                setMessage(template.content);
                              }}
                              className="p-1 text-yellow-600 hover:text-yellow-900"
                              title="Edit template"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="p-1 text-red-600 hover:text-red-900"
                              title="Delete template"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TelegramCampaign;
