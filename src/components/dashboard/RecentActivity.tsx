import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { getLeads, getLeadNotes } from '../../services/api';
import { Lead, Note } from '../../types';
import StatusBadge from '../ui/StatusBadge';
import { MessagesSquare, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ActivityItem {
  id: string;
  type: 'lead_created' | 'note_added' | 'status_changed';
  leadId: string;
  leadName: string;
  timestamp: string;
  content?: string;
  status?: string;
}

const RecentActivity: React.FC = () => {
  const [activities, setActivities] = React.useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        
        // For a real app, you would have an API endpoint for activities
        // Here we'll simulate activities by combining leads and notes
        const leads = await getLeads();
        
        // Create activity items for lead creation
        const leadActivities: ActivityItem[] = leads.map(lead => ({
          id: `lead-${lead.id}`,
          type: 'lead_created',
          leadId: lead.id,
          leadName: lead.name,
          timestamp: lead.createdAt,
          content: `${lead.name} from ${lead.company} was added as a new lead.`
        }));
        
        // Get notes for each lead
        const notesPromises = leads.map(lead => getLeadNotes(lead.id));
        const notesResults = await Promise.all(notesPromises);
        
        // Flatten notes and create activity items
        const noteActivities: ActivityItem[] = notesResults
          .flat()
          .map((note, index) => {
            const lead = leads.find(l => l.id === note.leadId);
            return {
              id: `note-${note.id}`,
              type: 'note_added',
              leadId: note.leadId,
              leadName: lead?.name || 'Unknown Lead',
              timestamp: note.createdAt,
              content: note.content
            };
          });
        
        // Combine all activities and sort by timestamp (newest first)
        const allActivities = [...leadActivities, ...noteActivities]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5); // Only take the 5 most recent
        
        setActivities(allActivities);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchActivities();
  }, []);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex justify-between items-center">
        <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
        <Link 
          to="/activities" 
          className="text-xs text-blue-600 hover:underline flex items-center"
        >
          View All <ArrowRight size={12} className="ml-1" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No recent activity
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <MessagesSquare size={16} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <Link 
                    to={`/leads/view/${activity.leadId}`}
                    className="text-sm font-medium text-blue-600 hover:underline block"
                  >
                    {activity.leadName}
                  </Link>
                  <p className="text-sm line-clamp-2 text-gray-700">
                    {activity.content}
                  </p>
                  <span className="text-xs text-gray-500">
                    {formatTime(activity.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;