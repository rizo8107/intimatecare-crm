import React, { useState, useEffect } from 'react';
import { getStudentSessions, updateStudentSession, deleteStudentSession } from '../services/api';
import { StudentSession } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { 
  Search, 
  Calendar, 
  Clock, 
  Trash2, 
  Edit, 
  CheckCircle, 
  X, 
  Filter, 
  RefreshCw,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  CreditCard,
  ExternalLink,
  Save,
  Eye,
  FileText
} from 'lucide-react';

const StudentSessionPage: React.FC = () => {
  const [sessions, setSessions] = useState<StudentSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<StudentSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [editingSession, setEditingSession] = useState<StudentSession | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [viewingIdCard, setViewingIdCard] = useState<string | null>(null);
  const [highlightedSessionId, setHighlightedSessionId] = useState<string | null>(null);

  // Form state for editing - expanded fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    course_and_year: '',
    location: '',
    session_date: '',
    session_time: '',
    // session_end_time: '', // Removed as it's not in DB
    notes: '',
    price: '',
    gender: '',
    id_card: ''
  });

  // Convert 24-hour time to 12-hour format
  const formatTime12Hour = (time24: string): string => {
    if (!time24) return '';
    const [hoursStr, minutesStr] = time24.split(':');
    if (isNaN(parseInt(hoursStr)) || isNaN(parseInt(minutesStr))) return ''; // Basic validation
    const hour = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  // Convert 12-hour time to 24-hour format
  const formatTime24Hour = (time12: string): string => {
    if (!time12) return '';
    const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) {
      // Check if it's already in 24-hour format (e.g., "14:30")
      const twentyFourHourMatch = time12.match(/^(\d{2}):(\d{2})$/);
      if (twentyFourHourMatch) return time12;
      return ''; // Return empty or original if format is completely unexpected
    }
    
    let [, hoursStr, minutesStr, ampm] = match;
    let hour = parseInt(hoursStr);
    const minutes = minutesStr.padStart(2, '0');
    
    if (ampm.toUpperCase() === 'PM' && hour !== 12) {
      hour += 12;
    } else if (ampm.toUpperCase() === 'AM' && hour === 12) { // Midnight case: 12 AM is 00 hours
      hour = 0;
    }
    
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };

  // Load student sessions
  const loadSessions = async () => {
    try {
      setIsLoading(true);
      setIsSyncing(true);
      setError(null);
      const data = await getStudentSessions();
      setSessions(data);
      applyFilters(data, searchTerm, statusFilter);
      setIsSyncing(false);
      setIsLoading(false);
    } catch (error) {
      setError('Failed to load student sessions. Please try again.');
      setIsSyncing(false);
      setIsLoading(false);
      console.error('Error loading student sessions:', error);
    }
  };

  // Apply filters to sessions
  const applyFilters = (data: StudentSession[], search: string, status: string) => {
    let filtered = [...data];
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(session => 
        session.name.toLowerCase().includes(searchLower) ||
        session.email.toLowerCase().includes(searchLower) ||
        session.college.toLowerCase().includes(searchLower) ||
        session.phone.includes(searchLower)
      );
    }
    
    // Apply status filter
    if (status !== 'all') {
      filtered = filtered.filter(session => 
        status === 'completed' ? session.completed : !session.completed
      );
    }
    
    setFilteredSessions(filtered);
  };

  // Handle search and filter changes
  useEffect(() => {
    applyFilters(sessions, searchTerm, statusFilter);
  }, [searchTerm, statusFilter, sessions]);

  // Initial load
  useEffect(() => {
    loadSessions();
  }, []);

  // Handle session update
  const handleUpdateSession = async (id: string, data: Partial<StudentSession>) => {
    try {
      // setIsSyncing(true); // This is managed by the caller (handleSaveEdit)
      const updatedSessionFromApi = await updateStudentSession(id, data);
      
      setSessions(prevSessions => 
        prevSessions.map(s => (s.id === id ? updatedSessionFromApi : s))
      );
      // The useEffect hook watching 'sessions', 'searchTerm', and 'statusFilter' 
      // will automatically re-calculate and set 'filteredSessions'.
      
      setHighlightedSessionId(updatedSessionFromApi.id);
      setTimeout(() => {
        setHighlightedSessionId(null);
      }, 3000); // Highlight for 3 seconds
    } catch (err) { 
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error updating session: ${errorMessage}`); // Set specific error
      console.error('Error updating session:', err);
      throw err; // Re-throw error so handleSaveEdit can also know about it
    }
    // No finally block here; isSyncing is handled by the caller (handleSaveEdit)
  };

  // Handle session deletion
  const handleDeleteSession = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        setIsSyncing(true);
        await deleteStudentSession(id);
        loadSessions();
      } catch (error) {
        setError('Failed to delete session. Please try again.');
        setIsSyncing(false);
        console.error('Error deleting session:', error);
      }
    }
  };

  // Handle edit button click
  const handleEditClick = (session: StudentSession) => {
    setEditingSession(session);
    setFormData({
      name: session.name || '',
      email: session.email || '',
      phone: session.phone || '',
      college: session.college || '',
      course_and_year: session.course_and_year || '',
      location: session.location || '',
      session_date: session.session_date || '',
      session_time: session.session_time || '',
      // session_end_time: session.session_end_time || '', // Removed
      notes: session.notes || '',
      price: session.price?.toString() || '',
      gender: session.gender || '',
      id_card: session.id_card || ''
    });
    setIsEditing(true);
  };

  // Handle form field changes
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingSession) return;
    
    // Create a copy of formData and remove session_end_time if it exists (it shouldn't be in formData anymore)
    const { session_end_time, ...dataToSave } = formData as any; 

    try {
      const updateData: Partial<StudentSession> = {
        ...dataToSave, // Use dataToSave which doesn't have session_end_time
        price: dataToSave.price ? parseFloat(dataToSave.price) : undefined // Use undefined if price is empty/invalid
      };
      
      await handleUpdateSession(editingSession.id, updateData);
      setIsEditing(false);
      setEditingSession(null);
    } catch (error) {
      console.error('Error saving edit:', error);
      // Optionally, set an error state here to show in UI
    }
  };

  // Handle ID card view
  const handleViewIdCard = (idCardUrl: string) => {
    if (idCardUrl) {
      let previewUrl = idCardUrl;
      // Attempt to convert various Google Drive link formats to an embeddable preview link
      // Handles:
      // - drive.google.com/file/d/FILE_ID/view?usp=sharing
      // - drive.google.com/file/d/FILE_ID/edit?usp=sharing
      // - drive.google.com/open?id=FILE_ID
      // - drive.google.com/uc?id=FILE_ID&export=view (less common for direct sharing)
      const driveRegex = /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9-_]+)/;
      const match = idCardUrl.match(driveRegex);
      
      if (match && match[1]) {
        const fileId = match[1];
        previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      }
      // If it's already a preview link, do nothing.
      // If it's a different GDrive link structure not caught by regex, it will use the original URL.
      setViewingIdCard(previewUrl);
    }
  };

  // Handle complete session
  const handleCompleteSession = async (id: string) => {
    try {
      await handleUpdateSession(id, { completed: true });
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  // Loading state
  if (isLoading && !sessions.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">{error}</div>
            <button 
              onClick={loadSessions}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Student Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search by name, email, college or phone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters {showFilters ? '▲' : '▼'}
              </button>
              
              <button
                onClick={loadSessions}
                disabled={isSyncing}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
          
          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Filter Sessions</h3>
                <button 
                  onClick={() => {
                    setStatusFilter('all');
                    setSearchTerm('');
                  }}
                  className="text-sm text-blue-500 hover:text-blue-700 flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Clear Filters
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'completed' | 'pending')}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="all">All Sessions</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Total Sessions</h3>
              <p className="text-2xl font-bold text-blue-600 mt-2">{sessions.length}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Completed Sessions</h3>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {sessions.filter(s => s.completed).length}
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Pending Sessions</h3>
              <p className="text-2xl font-bold text-yellow-600 mt-2">
                {sessions.filter(s => !s.completed).length}
              </p>
            </div>
          </div>

          {/* Session Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.length > 0 ? (
              filteredSessions.map(session => (
                <div 
                  key={session.id} 
                  className={`bg-white rounded-xl shadow-lg border overflow-hidden transition-all duration-300 hover:shadow-xl 
                    ${
                      session.completed ? 'border-green-200 bg-gradient-to-br from-green-50 to-white' : 'border-blue-200 bg-gradient-to-br from-blue-50 to-white'
                    }
                    ${
                      highlightedSessionId === session.id ? 'ring-4 ring-yellow-400 ring-offset-2 shadow-2xl scale-105' : ''
                    }`}
                >
                  <div className={`px-6 py-4 ${session.completed ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'} flex justify-between items-center`}>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">
                        {session.completed ? 'Completed' : 'Pending'}
                      </span>
                      {session.completed && <CheckCircle className="h-4 w-4 text-white" />}
                    </div>
                    <div className="flex gap-2">
                      {!session.completed && (
                        <button 
                          onClick={() => handleCompleteSession(session.id)}
                          className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                          title="Mark as completed"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleEditClick(session)}
                        className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                        title="Edit session"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                        title="Delete session"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-xl text-gray-900 mb-1">{session.name}</h3>
                        <div className="flex items-center text-gray-600 text-sm mb-1">
                          <Mail className="h-4 w-4 mr-2" />
                          <span>{session.email}</span>
                        </div>
                        <div className="flex items-center text-gray-600 text-sm">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{session.phone}</span>
                        </div>
                      </div>
                      {session.id_card && (
                        <button
                          onClick={() => handleViewIdCard(session.id_card)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                        >
                          <CreditCard className="h-4 w-4" />
                          <span>ID Card</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-700">
                        <GraduationCap className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="font-medium mr-2">College:</span>
                        <span>{session.college}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-700">
                        <FileText className="h-4 w-4 mr-2 text-green-500" />
                        <span className="font-medium mr-2">Course:</span>
                        <span>{session.course_and_year}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-700">
                        <MapPin className="h-4 w-4 mr-2 text-red-500" />
                        <span className="font-medium mr-2">Location:</span>
                        <span>{session.location}</span>
                      </div>
                      
                      {session.gender && (
                        <div className="flex items-center text-sm text-gray-700">
                          <User className="h-4 w-4 mr-2 text-purple-500" />
                          <span className="font-medium mr-2">Gender:</span>
                          <span className="capitalize">{session.gender}</span>
                        </div>
                      )}
                      
                      {session.price && (
                        <div className="flex items-center text-sm text-gray-700">
                          <span className="font-medium mr-2">Price:</span>
                          <span className="text-green-600 font-semibold">₹{session.price}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      {session.session_date && session.session_time ? (
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-700">
                            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="font-medium mr-2">Date:</span>
                            <span>{new Date(session.session_date).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-700">
                            <Clock className="h-4 w-4 mr-2 text-green-500" />
                            <span className="font-medium mr-2">Time:</span>
                            <span>{formatTime12Hour(session.session_time)}</span>
                            {/* {session.session_end_time && (
                              <span> - {formatTime12Hour(session.session_end_time)}</span>
                            )} // Removed */}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>No session scheduled</span>
                        </div>
                      )}
                      
                      {session.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                          <p className="text-sm text-gray-600">{session.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-16 w-16 mx-auto" />
                </div>
                <p className="text-gray-500 text-lg">No sessions found matching your filters.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Edit Modal */}
      {isEditing && editingSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Edit Session Details</h2>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Personal Information
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="h-4 w-4 inline mr-1" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleFieldChange('gender', e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CreditCard className="h-4 w-4 inline mr-1" />
                      ID Card URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formData.id_card}
                        onChange={(e) => handleFieldChange('id_card', e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Enter Google Drive link for ID card"
                      />
                      {formData.id_card && (
                        <button
                          type="button"
                          onClick={() => handleViewIdCard(formData.id_card)}
                          className="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Academic & Session Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Academic & Session Details
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <GraduationCap className="h-4 w-4 inline mr-1" />
                      College/University
                    </label>
                    <input
                      type="text"
                      value={formData.college}
                      onChange={(e) => handleFieldChange('college', e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter college/university name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileText className="h-4 w-4 inline mr-1" />
                      Course & Year
                    </label>
                    <input
                      type="text"
                      value={formData.course_and_year}
                      onChange={(e) => handleFieldChange('course_and_year', e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="e.g., B.Tech 3rd Year"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleFieldChange('location', e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter location"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Price (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleFieldChange('price', e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter session price"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Session Timing */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Session Timing
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Adjusted to md:grid-cols-2 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Session Date
                      </label>
                      <input
                        type="date"
                        value={formData.session_date}
                        onChange={(e) => handleFieldChange('session_date', e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Start Time {/* Changed from Session Time to Start Time for clarity */}
                      </label>
                      <input
                        type="time"
                        value={formData.session_time}
                        onChange={(e) => handleFieldChange('session_time', e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    
                    {/* End Time Input Field Removed */}
                  </div>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    rows={4}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                    placeholder="Add any notes about the session..."
                  ></textarea>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors font-medium flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ID Card Viewer Modal */}
      {viewingIdCard && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Student ID Card</h2>
              <div className="flex gap-2">
                <a
                  href={viewingIdCard}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
                <button
                  onClick={() => setViewingIdCard(null)}
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="h-[calc(90vh-80px)]">
              <iframe
                src={viewingIdCard} // This will be the previewUrl
                className="w-full h-full border-0"
                title="Student ID Card"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms" // Added sandbox
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSessionPage;
