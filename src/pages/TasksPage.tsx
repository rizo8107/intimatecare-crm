import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Task, Lead } from '../types';
import { getLeads, getLeadTasks, updateTask } from '../services/api';
import { Check, CalendarClock, X, Circle, Filter } from 'lucide-react';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Record<string, Lead>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch leads to get names
        const fetchedLeads = await getLeads();
        const leadsMap: Record<string, Lead> = {};
        fetchedLeads.forEach(lead => {
          leadsMap[lead.id] = lead;
        });
        setLeads(leadsMap);
        
        // Fetch tasks for all leads
        const leadIds = fetchedLeads.map(lead => lead.id);
        const tasksPromises = leadIds.map(id => getLeadTasks(id));
        const tasksArrays = await Promise.all(tasksPromises);
        
        // Flatten tasks arrays
        const allTasks = tasksArrays.flat();
        
        // Sort by due date
        const sortedTasks = allTasks.sort((a, b) => 
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );
        
        setTasks(sortedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      await updateTask(taskId, { completed });
      setTasks(prev => 
        prev.map(task => task.id === taskId ? { ...task, completed } : task)
      );
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'completed') return task.completed;
    if (filter === 'upcoming') return !task.completed;
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = taskDate.getTime() === today.getTime();
    const isTomorrow = taskDate.getTime() === tomorrow.getTime();
    const isPast = taskDate < today;
    
    if (isToday) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isPast) {
      return `Overdue: ${date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getDueDateClass = (dateString: string, completed: boolean) => {
    if (completed) return '';
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);
    
    if (taskDate < today) {
      return 'text-red-600 font-medium';
    }
    return '';
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-amber-100 text-amber-800',
    high: 'bg-red-100 text-red-800',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Tasks</CardTitle>
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
            >
              <option value="all">All Tasks</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-4 py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No tasks found. Create a task from a lead's page.
          </div>
        ) : (
          <div className="space-y-3 divide-y divide-gray-100 pt-4">
            {filteredTasks.map((task) => {
              const lead = leads[task.leadId];
              return (
                <div 
                  key={task.id}
                  className={`pt-3 first:pt-0 ${task.completed ? 'opacity-75' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">
                      <button
                        onClick={() => toggleTaskCompletion(task.id, !task.completed)}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center focus:outline-none transition-colors ${
                          task.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {task.completed ? <Check size={14} /> : <Circle size={14} className="text-transparent" />}
                      </button>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap justify-between mb-1">
                        <h3 className={`font-medium text-base ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.title}
                        </h3>
                        
                        <div className="flex items-center space-x-2 ml-auto">
                          <span className={`text-xs rounded-full px-2 py-0.5 ${priorityColors[task.priority]}`}>
                            {task.priority}
                          </span>
                          {!task.completed && (
                            <button
                              onClick={() => toggleTaskCompletion(task.id, true)}
                              className="text-green-600 hover:text-green-700"
                              title="Mark as completed"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          {task.completed && (
                            <button
                              onClick={() => toggleTaskCompletion(task.id, false)}
                              className="text-amber-600 hover:text-amber-700"
                              title="Mark as incomplete"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className={`text-sm mb-2 ${task.completed ? 'text-gray-400' : 'text-gray-700'}`}>
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex flex-col sm:flex-row sm:items-center text-xs">
                        <div className="flex items-center mb-1 sm:mb-0">
                          <CalendarClock size={14} className="mr-1 text-gray-400" />
                          <span className={getDueDateClass(task.dueDate, task.completed)}>
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                        
                        {lead && (
                          <Link 
                            to={`/leads/view/${lead.id}`}
                            className="sm:ml-4 text-blue-600 hover:underline flex items-center"
                          >
                            {lead.name} - {lead.company}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TasksPage;