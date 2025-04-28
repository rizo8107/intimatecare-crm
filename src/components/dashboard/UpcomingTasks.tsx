import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Link } from 'react-router-dom';
import { Task } from '../../types';
import { ArrowRight, Check } from 'lucide-react';
import { getLeads } from '../../services/api';

interface UpcomingTasksProps {
  tasks: Task[];
  isLoading: boolean;
}

const UpcomingTasks: React.FC<UpcomingTasksProps> = ({ tasks, isLoading }) => {
  const [leadMap, setLeadMap] = React.useState<Record<string, string>>({});
  
  React.useEffect(() => {
    const fetchLeadNames = async () => {
      try {
        const leads = await getLeads();
        const map: Record<string, string> = {};
        leads.forEach(lead => {
          map[lead.id] = lead.name;
        });
        setLeadMap(map);
      } catch (error) {
        console.error('Error fetching lead names:', error);
      }
    };
    
    fetchLeadNames();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0);
    const isTomorrow = date.setHours(0, 0, 0, 0) === tomorrow.setHours(0, 0, 0, 0);
    
    if (isToday) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-amber-100 text-amber-800',
    high: 'bg-red-100 text-red-800',
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex justify-between items-center">
        <CardTitle className="text-base font-medium">Upcoming Tasks</CardTitle>
        <Link 
          to="/tasks" 
          className="text-xs text-blue-600 hover:underline flex items-center"
        >
          View All <ArrowRight size={12} className="ml-1" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No upcoming tasks
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Link 
                key={task.id}
                to={`/leads/view/${task.leadId}`}
                className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5">
                    <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center">
                      {task.completed && <Check size={12} className="text-green-500" />}
                    </div>
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {task.title}
                      </h4>
                      
                      <span className={`text-xs rounded-full px-2 py-0.5 ml-2 ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <p className="text-xs text-gray-700 truncate">
                        {leadMap[task.leadId] || 'Loading...'}
                      </p>
                      
                      <p className="text-xs text-gray-500">
                        {formatDate(task.dueDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingTasks;