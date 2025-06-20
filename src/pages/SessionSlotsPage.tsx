import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Clock, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  DollarSign,
  X,
  Save
} from 'lucide-react';
import { 
  getSessionTypes, 
  createSessionType, 
  updateSessionType, 
  deleteSessionType,
  getAvailableSlots,
  createAvailableSlot,
  updateAvailableSlot,
  deleteAvailableSlot,
  getActiveInstructors,
  getStudentSessionBySlot,
  getStudentSessionForm
} from '../services/api';
import { SessionType, AvailableSlot, SlotStatus, Instructor, StudentSessionForm } from '../types';
import { format, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';

// Simple Calendar Component
interface SimpleCalendarProps {
  slots: AvailableSlot[];
  onDateSelect: (date: Date) => void;
}

const SimpleCalendar: React.FC<SimpleCalendarProps> = ({ slots, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get days in current month view
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Check if a date has any slots
  const hasSlots = (date: Date) => {
    return slots.some(slot => isSameDay(new Date(slot.slot_date), date));
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const prevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  return (
    <div className="calendar">
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="p-1 rounded-full hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-medium">{format(currentMonth, 'MMMM yyyy')}</h3>
        <button onClick={nextMonth} className="p-1 rounded-full hover:bg-gray-100">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {monthDays.map((day, i) => {
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);
          const hasAvailableSlots = hasSlots(day);
          
          return (
            <button
              key={i}
              onClick={() => {
                setSelectedDate(day);
                onDateSelect(day);
              }}
              className={`
                h-10 w-full rounded-full flex items-center justify-center text-sm
                ${!isCurrentMonth ? 'text-gray-300' : ''}
                ${isToday ? 'border border-blue-500' : ''}
                ${isSelected ? 'bg-blue-500 text-white' : ''}
                ${hasAvailableSlots && !isSelected ? 'bg-green-100 text-green-800 font-medium' : ''}
                ${isCurrentMonth && !isSelected && !isToday && !hasAvailableSlots ? 'hover:bg-gray-100' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const SessionSlotsPage: React.FC = () => {
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [filteredSlots, setFilteredSlots] = useState<AvailableSlot[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'types' | 'slots'>('slots');
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SlotStatus | 'all'>('all');
  const [selectedSessionType, setSelectedSessionType] = useState<string>('all');

  // Modal states
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [selectedInstructorGroup, setSelectedInstructorGroup] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<SessionType | null>(null);
  const [editingSlot, setEditingSlot] = useState<AvailableSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showOnlySelectedDate, setShowOnlySelectedDate] = useState(false);

  // Form data
  const [typeFormData, setTypeFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    price: 0
  });

  const [slotFormData, setSlotFormData] = useState({
    instructor_id: '',
    session_type_id: '',
    slot_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:00',
    status: 'available' as SlotStatus
  });

  // Bulk slot creation
  const [bulkSlotMode, setBulkSlotMode] = useState(false);
  const [bulkSlotData, setBulkSlotData] = useState({
    instructor_id: '',
    session_type_id: '',
    slot_date: format(new Date(), 'yyyy-MM-dd'),
    day_start_time: '09:00',
    day_end_time: '17:00',
    slot_duration: 60,
    status: 'available' as SlotStatus
  });
  const [generatedSlots, setGeneratedSlots] = useState<Array<{start_time: string, end_time: string}>>([]);
  const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [availableSlots, searchTerm, statusFilter, selectedSessionType]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [typesData, slotsData, instructorsData] = await Promise.all([
        getSessionTypes(),
        getAvailableSlots(),
        getActiveInstructors()
      ]);
      setSessionTypes(typesData);
      setAvailableSlots(slotsData);
      setFilteredSlots(slotsData);
      setInstructors(instructorsData);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...availableSlots];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(slot => 
        slot.instructor_name?.toLowerCase().includes(lowerSearchTerm) ||
        slot.session_types?.name.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(slot => slot.status === statusFilter);
    }

    if (selectedSessionType !== 'all') {
      filtered = filtered.filter(slot => slot.session_type_id === selectedSessionType);
    }

    setFilteredSlots(filtered);
  };

  const formatTime12Hour = (time24: string): string => {
    if (!time24) return '';
    const [hoursStr, minutesStr] = time24.split(':');
    const hour = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCreateType = async () => {
    try {
      const newType = await createSessionType(typeFormData);
      setSessionTypes([...sessionTypes, newType]);
      setShowTypeModal(false);
      resetTypeForm();
    } catch (err) {
      setError('Failed to create session type');
    }
  };

  const handleCreateSlot = async () => {
    try {
      setError(null);
      await createAvailableSlot({
        instructor_id: slotFormData.instructor_id,
        session_type_id: slotFormData.session_type_id,
        slot_date: slotFormData.slot_date,
        start_time: slotFormData.start_time,
        end_time: slotFormData.end_time,
        status: slotFormData.status,
        booking_status: false
      });
      await loadData();
      setShowSlotModal(false);
      resetSlotForm();
    } catch (err) {
      setError('Failed to create slot. Please try again.');
      console.error('Error creating slot:', err);
    }
  };

  const resetTypeForm = () => {
    setTypeFormData({
      name: '',
      description: '',
      duration_minutes: 60,
      price: 0
    });
    setEditingType(null);
  };

  const resetSlotForm = () => {
    setSlotFormData({
      instructor_id: '',
      session_type_id: '',
      slot_date: '',
      start_time: '',
      end_time: '',
      status: 'available'
    });
    setEditingSlot(null);
  };

  const generateTimeSlots = () => {
    if (!bulkSlotData.day_start_time || !bulkSlotData.day_end_time || !bulkSlotData.slot_duration) {
      return;
    }

    const slots: Array<{start_time: string, end_time: string}> = [];
    const startTime = new Date(`2000-01-01T${bulkSlotData.day_start_time}:00`);
    const endTime = new Date(`2000-01-01T${bulkSlotData.day_end_time}:00`);
    const durationMs = bulkSlotData.slot_duration * 60 * 1000;

    let currentTime = new Date(startTime);
    
    while (currentTime < endTime) {
      const slotEndTime = new Date(currentTime.getTime() + durationMs);
      
      if (slotEndTime <= endTime) {
        const startTimeStr = currentTime.toTimeString().slice(0, 5);
        const endTimeStr = slotEndTime.toTimeString().slice(0, 5);
        
        slots.push({
          start_time: startTimeStr,
          end_time: endTimeStr
        });
      }
      
      currentTime = new Date(currentTime.getTime() + durationMs);
    }

    setGeneratedSlots(slots);
    setSelectedSlots(new Set(slots.map((_, index) => index)));
  };

  // Generate slots when bulk slot data changes
  useEffect(() => {
    if (bulkSlotMode) {
      generateTimeSlots();
    }
  }, [bulkSlotData.day_start_time, bulkSlotData.day_end_time, bulkSlotData.slot_duration, bulkSlotMode]);

  // Group slots by instructor for card view
  const instructorGroups = useMemo(() => {
    const groups: { [key: string]: { instructor: Instructor | null; slots: AvailableSlot[]; sessionTypes: Set<string> } } = {};
    
    filteredSlots.forEach(slot => {
      const instructorId = slot.instructor_id;
      if (!groups[instructorId]) {
        groups[instructorId] = {
          instructor: instructors.find(i => i.id === instructorId) || null,
          slots: [],
          sessionTypes: new Set()
        };
      }
      groups[instructorId].slots.push(slot);
      if (slot.session_types?.name) {
        groups[instructorId].sessionTypes.add(slot.session_types.name);
      }
    });
    
    // Sort slots within each instructor group
    Object.keys(groups).forEach(instructorId => {
      groups[instructorId].slots.sort((a, b) => {
        const dateCompare = new Date(a.slot_date).getTime() - new Date(b.slot_date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.start_time.localeCompare(b.start_time);
      });
    });
    
    return groups;
  }, [filteredSlots, instructors]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading session slots...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Slots Management</h1>
        <p className="text-gray-600">Manage session types and available time slots</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('slots')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'slots'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Available Slots ({filteredSlots.length})
            </button>
            <button
              onClick={() => setActiveTab('types')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'types'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Session Types ({sessionTypes.length})
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'slots' && (
        <div>
          {/* Filters and Search */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by session type or instructor..."
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as SlotStatus | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
                <select
                  value={selectedSessionType}
                  onChange={(e) => setSelectedSessionType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  {sessionTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <div className="mb-4 flex gap-2">
                  <button
                    onClick={() => {
                      setBulkSlotMode(false);
                      setShowSlotModal(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Single Slot
                  </button>
                  <button
                    onClick={() => {
                      setBulkSlotMode(true);
                      setShowSlotModal(true);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
                  >
                    <CalendarIcon className="w-4 h-4" />
                    Bulk Create
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Slots Grid */}
          <div className="space-y-6">
            {!showCalendarView ? (
              // Instructor Cards View
              Object.keys(instructorGroups).map(instructorId => {
                const group = instructorGroups[instructorId];
                const nextSlot = group.slots.find(slot => new Date(slot.slot_date) >= new Date());
                
                return (
                  <div 
                    key={instructorId} 
                    className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedInstructorGroup(instructorId);
                      setShowCalendarView(true);
                    }}
                  >
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 rounded-t-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">{group.instructor?.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {group.slots.length} slot{group.slots.length !== 1 ? 's' : ''} • {Array.from(group.sessionTypes).join(', ')}
                          </p>
                          {group.instructor?.specialization && (
                            <p className="text-xs text-blue-600 mt-1">{group.instructor.specialization}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {group.instructor?.hourly_rate && (
                            <p className="text-sm font-medium text-green-600">${group.instructor.hourly_rate}/hr</p>
                          )}
                          <p className="text-xs text-gray-500">Click to view calendar</p>
                        </div>
                      </div>
                    </div>
                    
                    {nextSlot && (
                      <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Next Available Slot</p>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CalendarIcon className="w-4 h-4" />
                                {formatDate(nextSlot.slot_date)}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                {formatTime12Hour(nextSlot.start_time)} - {formatTime12Hour(nextSlot.end_time)}
                              </div>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            nextSlot.status === 'available' ? 'bg-green-100 text-green-800' :
                            nextSlot.status === 'booked' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {nextSlot.status}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              // Calendar View for Selected Instructor
              selectedInstructorGroup && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 rounded-t-lg">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">
                        {instructorGroups[selectedInstructorGroup]?.instructor_name}'s Available Slots
                      </h2>
                      <button
                        onClick={() => setShowCalendarView(false)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" /> Back to Instructors
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {/* Calendar Component */}
                    <div className="mb-8 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-md font-medium">Available Dates</h3>
                        {selectedDate && (
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-gray-600">
                              {showOnlySelectedDate ? (
                                <span>Showing slots for: <strong>{format(selectedDate, 'MMMM d, yyyy')}</strong></span>
                              ) : (
                                <span>All dates shown</span>
                              )}
                            </div>
                            <button 
                              onClick={() => setShowOnlySelectedDate(!showOnlySelectedDate)}
                              className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                            >
                              {showOnlySelectedDate ? 'Show All Dates' : 'Filter By Date'}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="calendar-container">
                        <SimpleCalendar 
                          slots={instructorGroups[selectedInstructorGroup]?.slots || []} 
                          onDateSelect={(date) => {
                            // Set the selected date
                            setSelectedDate(date);
                            setShowOnlySelectedDate(true);
                            
                            // Filter slots for the selected date
                            const filteredSlots = instructorGroups[selectedInstructorGroup]?.slots.filter(
                              slot => isSameDay(new Date(slot.slot_date), date)
                            ) || [];
                            
                            // Scroll to the first slot for this date if any exist
                            if (filteredSlots.length > 0) {
                              const slotElement = document.getElementById(`slot-${filteredSlots[0].id}`);
                              if (slotElement) {
                                slotElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {instructorGroups[selectedInstructorGroup]?.slots
                        .filter(slot => !showOnlySelectedDate || (selectedDate && isSameDay(new Date(slot.slot_date), selectedDate)))
                        .map(slot => (
                        <div 
                          key={slot.id} 
                          id={`slot-${slot.id}`}
                        >
                          <Card 
                            className={`hover:shadow-md transition-shadow border-l-4 ${isSameDay(new Date(slot.slot_date), new Date()) ? 'border-l-blue-500 bg-blue-50' : 'border-l-green-500'}`}>
                          <CardHeader className={`pb-3 ${
                            slot.status === 'available' ? 'bg-green-50' : 
                            slot.status === 'booked' ? 'bg-blue-50' : 'bg-gray-50'
                          }`}>
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CalendarIcon className="w-4 h-4" />
                                {formatDate(slot.slot_date)}
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                slot.status === 'available' ? 'bg-green-100 text-green-800' :
                                slot.status === 'booked' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {slot.status}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                {formatTime12Hour(slot.start_time)} - {formatTime12Hour(slot.end_time)}
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {slot.session_types?.name || 'Unknown Session Type'}
                              </div>
                              {slot.session_types?.duration_minutes && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Clock className="w-4 h-4" />
                                  {slot.session_types.duration_minutes} minutes
                                </div>
                              )}
                              {slot.session_types?.price && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <DollarSign className="w-4 h-4" />
                                  ${slot.session_types.price}
                                </div>
                              )}
                            </div>
                            <div className="mt-4 flex gap-2 justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSlot(slot);
                                  setSlotFormData({
                                    instructor_id: slot.instructor_id,
                                    session_type_id: slot.session_type_id,
                                    slot_date: slot.slot_date,
                                    start_time: slot.start_time,
                                    end_time: slot.end_time,
                                    status: slot.status
                                  });
                                  setShowSlotModal(true);
                                }}
                                className="bg-blue-50 text-blue-600 p-2 rounded-full hover:bg-blue-100 flex items-center justify-center"
                                title="Edit slot"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (confirm('Are you sure you want to delete this slot?')) {
                                    try {
                                      await deleteAvailableSlot(slot.id);
                                      setAvailableSlots(availableSlots.filter(s => s.id !== slot.id));
                                    } catch (err) {
                                      setError('Failed to delete slot');
                                    }
                                  }
                                }}
                                className="bg-red-50 text-red-600 p-2 rounded-full hover:bg-red-100 flex items-center justify-center"
                                title="Delete slot"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              {(slot.booking_status || slot.status === 'booked') && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const studentSession = await getStudentSessionBySlot(slot.id);
                                    if (studentSession) {
                                      alert(`Student: ${studentSession.name}\nEmail: ${studentSession.email}\nPhone: ${studentSession.phone}\nCollege: ${studentSession.college}\nSession Type: ${studentSession.session_type}\nDate: ${studentSession.session_date}\nTime: ${studentSession.session_time}`);
                                    } else {
                                      alert('No student session details found for this slot.');
                                    }
                                  }}
                                  className="bg-blue-50 text-blue-600 p-2 rounded-full hover:bg-blue-100 flex items-center justify-center"
                                  title="View Student Session Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {filteredSlots.length === 0 && (
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No slots found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' || selectedSessionType !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first slot'
                }
              </p>
              <button
                onClick={() => setShowSlotModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add First Slot
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'types' && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Session Types</h2>
            <button
              onClick={() => setShowTypeModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Session Type
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessionTypes.map(type => (
              <Card key={type.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{type.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {type.description && (
                      <p className="text-sm text-gray-600">{type.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {type.duration_minutes} minutes
                    </div>
                    {type.price && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        ${type.price}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        setEditingType(type);
                        setTypeFormData({
                          name: type.name,
                          description: type.description || '',
                          duration_minutes: type.duration_minutes,
                          price: type.price || 0
                        });
                        setShowTypeModal(true);
                      }}
                      className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md hover:bg-blue-100 flex items-center justify-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('Are you sure you want to delete this session type?')) {
                          try {
                            await deleteSessionType(type.id);
                            setSessionTypes(sessionTypes.filter(t => t.id !== type.id));
                          } catch (err) {
                            setError('Failed to delete session type');
                          }
                        }
                      }}
                      className="bg-red-50 text-red-600 px-3 py-2 rounded-md hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Session Type Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingType ? 'Edit Session Type' : 'Create Session Type'}
              </h3>
              <button
                onClick={() => {
                  setShowTypeModal(false);
                  resetTypeForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={typeFormData.name}
                  onChange={(e) => setTypeFormData({...typeFormData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1-on-1 Tutoring"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={typeFormData.description}
                  onChange={(e) => setTypeFormData({...typeFormData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Brief description of the session type"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={typeFormData.duration_minutes}
                  onChange={(e) => setTypeFormData({...typeFormData, duration_minutes: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  value={typeFormData.price}
                  onChange={(e) => setTypeFormData({...typeFormData, price: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowTypeModal(false);
                  resetTypeForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={editingType ? async () => {
                  try {
                    const updatedType = await updateSessionType(editingType.id, typeFormData);
                    setSessionTypes(sessionTypes.map(t => t.id === editingType.id ? updatedType : t));
                    setShowTypeModal(false);
                    resetTypeForm();
                  } catch (err) {
                    setError('Failed to update session type');
                  }
                } : handleCreateType}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingType ? 'Update Type' : 'Create Type'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slot Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingSlot ? 'Edit Slot' : bulkSlotMode ? 'Bulk Create Slots' : 'Create Slot'}
              </h3>
              <button
                onClick={() => {
                  setShowSlotModal(false);
                  resetSlotForm();
                  setBulkSlotMode(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {bulkSlotMode ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
                  <select
                    value={bulkSlotData.instructor_id}
                    onChange={(e) => setBulkSlotData({...bulkSlotData, instructor_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select instructor</option>
                    {instructors.filter(instructor => instructor.is_active).map(instructor => (
                      <option key={instructor.id} value={instructor.id}>{instructor.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
                  <select
                    value={slotFormData.instructor_id}
                    onChange={(e) => setSlotFormData({...slotFormData, instructor_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select instructor</option>
                    {instructors.filter(instructor => instructor.is_active).map(instructor => (
                      <option key={instructor.id} value={instructor.id}>{instructor.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {bulkSlotMode ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
                  <select
                    value={bulkSlotData.session_type_id}
                    onChange={(e) => setBulkSlotData({...bulkSlotData, session_type_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select session type</option>
                    {sessionTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
                  <select
                    value={slotFormData.session_type_id}
                    onChange={(e) => setSlotFormData({...slotFormData, session_type_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select session type</option>
                    {sessionTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {bulkSlotMode ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={bulkSlotData.slot_date}
                    onChange={(e) => setBulkSlotData({...bulkSlotData, slot_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={slotFormData.slot_date}
                    onChange={(e) => setSlotFormData({...slotFormData, slot_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {bulkSlotMode ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day Start Time</label>
                  <input
                    type="time"
                    value={bulkSlotData.day_start_time}
                    onChange={(e) => setBulkSlotData({...bulkSlotData, day_start_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={slotFormData.start_time}
                    onChange={(e) => setSlotFormData({...slotFormData, start_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {bulkSlotMode ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day End Time</label>
                  <input
                    type="time"
                    value={bulkSlotData.day_end_time}
                    onChange={(e) => setBulkSlotData({...bulkSlotData, day_end_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={slotFormData.end_time}
                    onChange={(e) => setSlotFormData({...slotFormData, end_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {bulkSlotMode ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slot Duration (minutes)</label>
                  <input
                    type="number"
                    value={bulkSlotData.slot_duration}
                    onChange={(e) => setBulkSlotData({...bulkSlotData, slot_duration: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={slotFormData.status}
                    onChange={(e) => setSlotFormData({...slotFormData, status: e.target.value as SlotStatus})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="available">Available</option>
                    <option value="booked">Booked</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              )}

              {/* Generated Slots Preview for Bulk Mode */}
              {bulkSlotMode && generatedSlots.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generated Time Slots ({generatedSlots.length} slots)
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
                    <div className="grid grid-cols-2 gap-2">
                      {generatedSlots.map((slot, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded border text-sm cursor-pointer transition-colors ${
                            selectedSlots.has(index)
                              ? 'bg-blue-100 border-blue-300 text-blue-700'
                              : 'bg-white border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            const newSelected = new Set(selectedSlots);
                            if (newSelected.has(index)) {
                              newSelected.delete(index);
                            } else {
                              newSelected.add(index);
                            }
                            setSelectedSlots(newSelected);
                          }}
                        >
                          {formatTime12Hour(slot.start_time)} - {formatTime12Hour(slot.end_time)}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Click slots to select/deselect. {selectedSlots.size} of {generatedSlots.length} selected.
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowSlotModal(false);
                  resetSlotForm();
                  setBulkSlotMode(false);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              {bulkSlotMode ? (
                <button type="submit"
                  onClick={async () => {
                    try {
                      const slotsToCreate = generatedSlots.filter((_, index) => selectedSlots.has(index));
                      for (const slot of slotsToCreate) {
                        await createAvailableSlot({
                          instructor_id: bulkSlotData.instructor_id,
                          session_type_id: bulkSlotData.session_type_id,
                          slot_date: bulkSlotData.slot_date,
                          start_time: slot.start_time,
                          end_time: slot.end_time,
                          status: bulkSlotData.status,
                          booking_status: false
                        });
                      }
                      await loadData();
                      setShowSlotModal(false);
                      resetSlotForm();
                      setBulkSlotMode(false);
                      setGeneratedSlots([]);
                      setSelectedSlots(new Set());
                    } catch (err) {
                      setError('Failed to create slots');
                    }
                  }}
                  disabled={selectedSlots.size === 0}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Create {selectedSlots.size} Slots
                </button>
              ) : (
                <button type="submit"
                  onClick={editingSlot ? async () => {
                    try {
                      const updatedSlot = await updateAvailableSlot(editingSlot.id, slotFormData);
                      setAvailableSlots(availableSlots.map(s => s.id === editingSlot.id ? updatedSlot : s));
                      setShowSlotModal(false);
                      resetSlotForm();
                    } catch (err) {
                      setError('Failed to update slot');
                    }
                  } : handleCreateSlot}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingSlot ? 'Update Slot' : 'Create Slot'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionSlotsPage;
