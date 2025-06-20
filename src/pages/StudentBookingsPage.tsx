import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStudentBookings } from '../services/api';
import { StudentBooking } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

import Badge from '../components/ui/Badge';
import { format, parseISO } from 'date-fns';
import { Search, Filter, Calendar, RefreshCcw, FileText, ExternalLink } from 'lucide-react';

const StudentBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<StudentBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<StudentBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const data = await getStudentBookings();
      // Sort bookings by date (newest first)
      const sortedData = [...data].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setBookings(sortedData);
      setFilteredBookings(sortedData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch student bookings. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);
  
  // Handle refresh button click
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchBookings();
  };
  
  // Apply filters when searchTerm or statusFilter changes
  useEffect(() => {
    let filtered = bookings;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.name.toLowerCase().includes(term) || 
        booking.email.toLowerCase().includes(term) || 
        booking.phone.toLowerCase().includes(term) ||
        booking.college.toLowerCase().includes(term)
      );
    }
    
    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter]);

  const getStatusBadge = (status: StudentBooking['status']) => {
    switch (status) {
      case 'BOOKED':
        return <Badge variant="success">Booked</Badge>;
      case 'COMPLETED':
        return <Badge variant="default">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'NO_SHOW':
        return <Badge variant="warning">No Show</Badge>;
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  };
  
  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success">Paid</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'FAILED':
        return <Badge variant="danger">Failed</Badge>;
      case 'REFUNDED':
        return <Badge variant="warning">Refunded</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  if (isLoading && !isRefreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchBookings}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="Student Bookings" subtitle="View and manage all student session bookings." />
      
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <CardTitle>All Bookings ({filteredBookings.length})</CardTitle>
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
            disabled={isRefreshing}
          >
            <RefreshCcw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-md">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter bookings by status"
                >
                  <option value="all">All Statuses</option>
                  <option value="BOOKED">Booked</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="PENDING">Pending</option>
                  <option value="NO_SHOW">No Show</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800">{booking.name}</h3>
                        <p className="text-sm text-gray-500">{booking.email}</p>
                        <p className="text-xs text-gray-400">{booking.phone}</p>
                      </div>
                      <div>
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-sm font-medium">{format(parseISO(booking.preferred_date), 'MMM d, yyyy')}</span>
                          <span className="text-xs text-gray-500 ml-2">{booking.preferred_time}</span>
                        </div>
                      </div>
                      
                      {booking.id_card_url && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <a 
                            href={booking.id_card_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            ID Card <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{booking.session_type}</p>
                          <div className="flex items-center mt-1">
                            {getPaymentBadge(booking.payment_status)}
                            <span className="text-xs text-gray-500 ml-2">₹{booking.price}</span>
                          </div>
                        </div>
                        
                        <Link 
                          to={`/bookings/${booking.id}`} 
                          className="inline-flex items-center justify-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white rounded-lg shadow-sm border border-gray-100">
                {searchTerm || statusFilter !== 'all' ? (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="bg-gray-100 rounded-full p-3">
                      <Search className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-gray-600">No bookings match your filters</p>
                    <button 
                      onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="bg-gray-100 rounded-full p-3">
                      <Calendar className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-gray-600">No bookings found</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Pagination placeholder - can be implemented if needed */}
          {filteredBookings.length > 0 && (
            <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
              <div>Showing {filteredBookings.length} of {bookings.length} bookings</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentBookingsPage;
