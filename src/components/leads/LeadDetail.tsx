import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lead, Note, Task } from '../../types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import { 
  Edit, 
  ArrowLeft, 
  User, 
  Building, 
  Mail, 
  Phone, 
  Clock, 
  Plus, 
  Check, 
  CalendarClock,
  Flag,
  Trash2,
  MessageCircle,
  Book
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { getLeadNotes, createNote, deleteNote, getLeadTasks, createTask, updateTask, deleteTask } from '../../services/api';

interface LeadDetailProps {
  lead: Lead;
}

const LeadDetail: React.FC<LeadDetailProps> = ({ lead }) => {
  const navigate = useNavigate();
  const { getTelegramSubscriptionForLead, getEbookAccessForLead, showToast } = useAppContext();
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '', priority: 'medium' as 'low' | 'medium' | 'high' });
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'tasks' | 'linked-data'>('notes');
  
  // Get linked data for this lead
  const telegramSubscription = getTelegramSubscriptionForLead(lead.id);
  const ebookAccess = getEbookAccessForLead(lead.id);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingNotes(true);
        setIsLoadingTasks(true);
        
        console.log('Fetching notes for lead ID:', lead.id);
        const fetchedNotes = await getLeadNotes(lead.id);
        console.log('Fetched notes:', fetchedNotes);
        setNotes(fetchedNotes);
        setIsLoadingNotes(false);
        
        console.log('Fetching tasks for lead ID:', lead.id);
        const fetchedTasks = await getLeadTasks(lead.id);
        console.log('Fetched tasks:', fetchedTasks);
        setTasks(fetchedTasks);
        setIsLoadingTasks(false);
      } catch (error) {
        console.error('Error fetching lead details:', error);
        setIsLoadingNotes(false);
        setIsLoadingTasks(false);
      }
    };
    
    fetchData();
  }, [lead.id]);
  
  // Debug current state
  console.log('Current notes state:', notes);
  console.log('Current tasks state:', tasks);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      const createdNote = await createNote({
        leadId: lead.id,
        content: newNote,
        createdBy: '00000000-0000-0000-0000-000000000000', // Using a default UUID
      });
      
      setNotes((prev) => [createdNote, ...prev]);
      setNewNote('');
      showToast({
        type: 'success',
        message: 'Note added successfully',
        duration: 3000
      });
    } catch (error) {
      console.error('Error adding note:', error);
      showToast({
        type: 'error',
        message: 'Failed to add note',
        duration: 3000
      });
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim() || !newTask.dueDate) return;
    
    try {
      const createdTask = await createTask({
        leadId: lead.id,
        title: newTask.title,
        description: newTask.description,
        dueDate: newTask.dueDate,
        completed: false,
        priority: newTask.priority,
      });
      
      setTasks((prev) => [createdTask, ...prev]);
      setNewTask({ title: '', description: '', dueDate: '', priority: 'medium' });
      showToast({
        type: 'success',
        message: 'Task added successfully',
        duration: 3000
      });
    } catch (error) {
      console.error('Error adding task:', error);
      showToast({
        type: 'error',
        message: 'Failed to add task',
        duration: 3000
      });
    }
  };

  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      await updateTask(taskId, { completed });
      setTasks((prev) => 
        prev.map((task) => (task.id === taskId ? { ...task, completed } : task))
      );
      showToast({
        type: 'success',
        message: `Task marked as ${completed ? 'completed' : 'incomplete'}`,
        duration: 2000
      });
    } catch (error) {
      console.error('Error updating task:', error);
      showToast({
        type: 'error',
        message: 'Failed to update task status',
        duration: 3000
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
      showToast({
        type: 'info',
        message: 'Note deleted',
        duration: 2000
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      showToast({
        type: 'error',
        message: 'Failed to delete note',
        duration: 3000
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      showToast({
        type: 'info',
        message: 'Task deleted',
        duration: 2000
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast({
        type: 'error',
        message: 'Failed to delete task',
        duration: 3000
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return dateString || 'Unknown date';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return dateString || 'Unknown date';
    }
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-amber-100 text-amber-800',
    high: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          icon={<ArrowLeft size={16} />}
          onClick={() => navigate('/leads')}
        >
          Back to Leads
        </Button>
        
        <Button
          variant="primary"
          size="sm"
          icon={<Edit size={16} />}
          onClick={() => navigate(`/leads/edit/${lead.id}`)}
        >
          Edit Lead
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Lead Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-6 flex justify-center">
              <StatusBadge status={lead.status} size="lg" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <User size={20} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{lead.name}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Building size={20} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-medium">{lead.company}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Mail size={20} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a href={`mailto:${lead.email}`} className="font-medium text-blue-600 hover:underline">
                    {lead.email}
                  </a>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Phone size={20} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a href={`tel:${lead.phone}`} className="font-medium">
                    {lead.phone}
                  </a>
                </div>
              </div>
              
              {/* Linked Data Section */}
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Linked Data</p>
                <div className="space-y-2">
                  {/* Telegram Subscription */}
                  <div className="flex items-start space-x-3">
                    <MessageCircle size={20} className={`mt-0.5 ${telegramSubscription ? 'text-blue-500' : 'text-gray-300'}`} />
                    <div>
                      <p className="text-sm text-gray-500">Telegram Subscription</p>
                      {telegramSubscription ? (
                        <div className="text-sm">
                          <p className="font-medium">{telegramSubscription.plan_name}</p>
                          <p className="text-xs text-gray-500">
                            Expires: {new Date(telegramSubscription.expiry_date).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Not linked</p>
                      )}
                    </div>
                  </div>
                  
                  {/* eBook Access */}
                  <div className="flex items-start space-x-3">
                    <Book size={20} className={`mt-0.5 ${ebookAccess ? 'text-green-500' : 'text-gray-300'}`} />
                    <div>
                      <p className="text-sm text-gray-500">eBook Access</p>
                      {ebookAccess ? (
                        <div className="text-sm">
                          <p className="font-medium">Access Granted</p>
                          <p className="text-xs text-gray-500">
                            Purchased: {new Date(ebookAccess.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Not linked</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Clock size={20} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{formatDate(lead.createdAt)}</p>
                </div>
              </div>
              
              {lead.lastContactedAt && (
                <div className="flex items-start space-x-3">
                  <CalendarClock size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Last Contacted</p>
                    <p className="font-medium">{formatDate(lead.lastContactedAt)}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start space-x-3">
                <div className="text-gray-400 mt-0.5">$</div>
                <div>
                  <p className="text-sm text-gray-500">Deal Value</p>
                  <p className="font-medium">${lead.value.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <button
                  className={`pb-2 font-medium text-sm focus:outline-none ${
                    activeTab === 'notes' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('notes')}
                >
                  Notes
                </button>
                <button
                  className={`pb-2 font-medium text-sm focus:outline-none ${
                    activeTab === 'tasks' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('tasks')}
                >
                  Tasks
                </button>
                <button
                  className={`pb-2 font-medium text-sm focus:outline-none ${
                    activeTab === 'linked-data' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('linked-data')}
                >
                  Linked Data
                </button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-4">
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div className="flex space-x-3">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    rows={3}
                  />
                  <div className="flex-shrink-0">
                    <Button
                      variant="primary"
                      icon={<Plus size={16} />}
                      onClick={handleAddNote}
                    >
                      Add Note
                    </Button>
                  </div>
                </div>
                
                {isLoadingNotes ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    No notes yet. Add your first note above.
                    <div className="text-xs mt-2 text-gray-400">Debug: {JSON.stringify(notes)}</div>
                  </div>
                ) : (
                  <div className="space-y-4 mt-6">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-gray-500">
                            {formatDateTime(note.createdAt)}
                          </span>
                          <button 
                            className="text-gray-400 hover:text-red-500"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-sm whitespace-pre-line">{note.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium mb-3">Add New Task</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      placeholder="Task title"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      placeholder="Description (optional)"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      rows={2}
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Due Date
                        </label>
                        <input
                          type="datetime-local"
                          value={newTask.dueDate}
                          onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Priority
                        </label>
                        <select
                          value={newTask.priority}
                          onChange={(e) => setNewTask({...newTask, priority: e.target.value as 'low' | 'medium' | 'high'})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                    
                    <Button
                      variant="primary"
                      onClick={handleAddTask}
                      icon={<Plus size={16} />}
                      className="w-full"
                    >
                      Add Task
                    </Button>
                  </div>
                </div>
                
                {isLoadingTasks ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    No tasks yet. Add your first task above.
                  </div>
                ) : (
                  <div className="space-y-3 mt-4">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-4 rounded-lg border ${
                          task.completed 
                            ? 'bg-gray-50 border-gray-200' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="mr-3 mt-0.5">
                            <button
                              onClick={() => toggleTaskCompletion(task.id, !task.completed)}
                              className={`w-5 h-5 rounded-full border flex items-center justify-center focus:outline-none ${
                                task.completed
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'border-gray-300 hover:border-blue-500'
                              }`}
                            >
                              {task.completed && <Check size={12} />}
                            </button>
                          </div>
                          
                          <div className="flex-grow">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {task.title}
                              </h4>
                              
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs rounded-full px-2 py-0.5 ${priorityColors[task.priority]}`}>
                                  {task.priority}
                                </span>
                                <button 
                                  className="text-gray-400 hover:text-red-500"
                                  onClick={() => handleDeleteTask(task.id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            
                            {task.description && (
                              <p className={`text-sm mb-2 ${task.completed ? 'text-gray-400' : 'text-gray-700'}`}>
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex items-center text-xs text-gray-500">
                              <CalendarClock size={12} className="mr-1" />
                              Due: {formatDateTime(task.dueDate)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Linked Data Tab Content */}
            {activeTab === 'linked-data' && (
              <div className="space-y-6">
                {/* Telegram Subscription Details */}
                <div>
                  <h3 className="text-lg font-medium flex items-center mb-3">
                    <MessageCircle size={20} className="mr-2 text-blue-500" />
                    Telegram Subscription
                  </h3>
                  
                  {telegramSubscription ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-gray-500">Username</p>
                          <p className="font-medium">{telegramSubscription.telegram_username}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">User ID</p>
                          <p className="font-medium">{telegramSubscription.telegram_user_id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone Number</p>
                          <p className="font-medium">{telegramSubscription.phone_number || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Plan</p>
                          <p className="font-medium">{telegramSubscription.plan_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Duration</p>
                          <p className="font-medium">{telegramSubscription.plan_duration}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Start Date</p>
                          <p className="font-medium">{formatDate(telegramSubscription.start_date)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Expiry Date</p>
                          <p className="font-medium">{formatDate(telegramSubscription.expiry_date)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <div>
                            {(() => {
                              const today = new Date();
                              const expiry = new Date(telegramSubscription.expiry_date);
                              const diffTime = expiry.getTime() - today.getTime();
                              const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              
                              let statusClass = '';
                              let statusText = '';
                              
                              if (daysRemaining <= 0) {
                                statusClass = 'bg-red-100 text-red-800';
                                statusText = 'Expired';
                              } else if (daysRemaining <= 7) {
                                statusClass = 'bg-yellow-100 text-yellow-800';
                                statusText = 'Expiring Soon';
                              } else {
                                statusClass = 'bg-green-100 text-green-800';
                                statusText = 'Active';
                              }
                              
                              return (
                                <span className={`px-2 py-1 text-xs rounded-full ${statusClass}`}>
                                  {statusText}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No Telegram subscription linked to this lead.</p>
                    </div>
                  )}
                </div>
                
                {/* eBook Access Details */}
                <div>
                  <h3 className="text-lg font-medium flex items-center mb-3">
                    <Book size={20} className="mr-2 text-green-500" />
                    eBook Access
                  </h3>
                  
                  {ebookAccess ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-gray-500">User Name</p>
                          <p className="font-medium">{ebookAccess.user_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{ebookAccess.user_email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Payment ID</p>
                          <p className="font-medium">{ebookAccess.payment_id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Amount</p>
                          <p className="font-medium">₹{ebookAccess.amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Purchase Date</p>
                          <p className="font-medium">{formatDate(ebookAccess.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No eBook access linked to this lead.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeadDetail;