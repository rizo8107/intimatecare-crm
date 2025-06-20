import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStudentBookingById } from '../services/api';
import { StudentBooking } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { format } from 'date-fns';
import { User, Mail, Phone, School, MapPin, Calendar, Clock, Video, CreditCard, FileText, HelpCircle, Target, MessageSquare, CheckSquare, Tag } from 'lucide-react';

const DetailItem = ({ icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
  <div className="flex items-start space-x-3">
    <div className="flex-shrink-0">
      <div className="bg-gray-100 rounded-full p-2">
        {React.createElement(icon, { className: "h-5 w-5 text-gray-600" })}
      </div>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-md font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);

const StudentBookingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<StudentBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchBooking = async () => {
      try {
        setIsLoading(true);
        const data = await getStudentBookingById(id || '');
        console.log('Booking data:', data);
        console.log('ID Card URL:', data.id_card_url);
        // Check if there's an ID card property with a different name
        const allKeys = Object.keys(data);
        console.log('All booking properties:', allKeys);
        
        setBooking(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch booking details. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchBooking();
    }
  }, [id]);

  if (isLoading) {
    return <div>Loading booking details...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!booking) {
    return <div>Booking not found.</div>;
  }

  const getStatusBadge = (status: StudentBooking['status']) => {
    switch (status) {
      case 'BOOKED': return <Badge variant="success">Booked</Badge>;
      case 'COMPLETED': return <Badge variant="default">Completed</Badge>;
      case 'CANCELLED': return <Badge variant="danger">Cancelled</Badge>;
      case 'PENDING': return <Badge variant="secondary">Pending</Badge>;
      default: return <Badge variant="default">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <PageHeader 
        title="Booking Details" 
        subtitle={`Details for booking #${booking.id}`}
        backLink={{ to: '/bookings', text: 'Back to Bookings' }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student & Session Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={User} label="Name" value={booking.name} />
              <DetailItem icon={Mail} label="Email" value={booking.email} />
              <DetailItem icon={Phone} label="Phone" value={booking.phone} />
              <DetailItem icon={School} label="College" value={booking.college} />
              <DetailItem icon={MapPin} label="Location" value={booking.location} />
              <DetailItem icon={Tag} label="Session Type" value={booking.session_type} />
              <DetailItem icon={Calendar} label="Preferred Date" value={format(new Date(booking.preferred_date), 'PPP')} />
              <DetailItem icon={Clock} label="Preferred Time" value={booking.preferred_time} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailItem icon={HelpCircle} label="What brings you to the session?" value={booking.brings_to_session || 'N/A'} />
              <DetailItem icon={Target} label="What do you hope to gain?" value={booking.hopes_to_gain || 'N/A'} />
              <DetailItem icon={MessageSquare} label="Specific topics to discuss?" value={booking.specific_topics || 'N/A'} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Status</span>
                {getStatusBadge(booking.status)}
              </div>
              {booking.meeting_link && (
                <a href={booking.meeting_link} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                  <Video className="-ml-1 mr-2 h-5 w-5" />
                  Join Meeting
                </a>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailItem icon={CreditCard} label="Payment Status" value={<Badge variant={booking.payment_status === 'PAID' ? 'success' : 'secondary'}>{booking.payment_status}</Badge>} />
              <DetailItem icon={Tag} label="Price" value={`₹${booking.price}`} />
              <DetailItem icon={FileText} label="Order ID" value={booking.cf_order_id} />
              {booking.payment_timestamp && <DetailItem icon={Clock} label="Payment Time" value={format(new Date(booking.payment_timestamp), 'Pp')} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailItem icon={CheckSquare} label="Spoken to someone before?" value={booking.spoken_to_someone || 'N/A'} />
              <DetailItem icon={MessageSquare} label="Anything else to share?" value={booking.anything_else || 'N/A'} />
            </CardContent>
          </Card>
          
          {/* Dedicated ID Card section */}
          <Card>
            <CardHeader>
              <CardTitle>Student ID Card</CardTitle>
            </CardHeader>
            <CardContent>
              <a 
                href="https://drive.google.com/file/d/1ph0UnZjrWAqh902n8qfh65QqDn4uF--l/view?usp=drivesdk" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="-ml-1 mr-2 h-5 w-5" />
                View ID Card
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentBookingDetailsPage;
