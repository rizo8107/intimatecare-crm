import React, { useState, useEffect } from 'react';
import DashboardSummary from '../components/dashboard/DashboardSummary';
import RecentActivity from '../components/dashboard/RecentActivity';
import UpcomingTasks from '../components/dashboard/UpcomingTasks';
import SalesPieChart from '../components/dashboard/SalesPieChart';
import PurchasesBarChart from '../components/dashboard/PurchasesBarChart';
import { Task } from '../types';
import { getLeadTasks } from '../services/api';

const Dashboard: React.FC = () => {
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoadingTasks(true);
        
        // In a real app, we would have an API endpoint for getting all upcoming tasks
        // Here we'll concatenate tasks from all leads
        // Commented out the actual API call and using mock data instead
        // await fetch('https://crm-supabase.7za6uc.easypanel.host/rest/v1/leads', {
        //   headers: {
        //     'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE',
        //     'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE'
        //   }
        // }).then(res => res.json());
        
        // For this demo, we'll use our mock API instead of the actual fetch above
        const leadIds = ['1', '2', '3', '4', '5']; // Mock lead IDs
        const tasksPromises = leadIds.map(id => getLeadTasks(id));
        const tasksArrays = await Promise.all(tasksPromises);
        
        // Flatten tasks arrays
        const allTasks = tasksArrays.flat();
        
        // Sort by due date, filter uncompleted tasks, and take only a few
        const sortedTasks = allTasks
          .filter(task => !task.completed)
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
          .slice(0, 3);
        
        setUpcomingTasks(sortedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoadingTasks(false);
      }
    };
    
    fetchTasks();
  }, []);

  return (
    <div className="space-y-6">
      <DashboardSummary />
      
      <div className="grid grid-cols-1 gap-6">
        <PurchasesBarChart />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesPieChart />
        <div></div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <div></div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <UpcomingTasks 
          tasks={upcomingTasks} 
          isLoading={isLoadingTasks} 
        />
      </div>
    </div>
  );
};

export default Dashboard;