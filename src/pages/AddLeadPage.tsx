import React from 'react';
import LeadForm from '../components/leads/LeadForm';
import { createLead } from '../services/api';
import { Lead } from '../types';
import { useAppContext } from '../context/AppContext';

const AddLeadPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { refreshData } = useAppContext();

  const handleSubmit = async (data: Partial<Lead>) => {
    try {
      setIsSubmitting(true);
      await createLead(data as Omit<Lead, 'id' | 'createdAt'>);
      await refreshData();
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <LeadForm 
        onSubmit={handleSubmit} 
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default AddLeadPage;