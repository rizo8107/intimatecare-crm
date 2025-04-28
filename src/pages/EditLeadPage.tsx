import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import LeadForm from '../components/leads/LeadForm';
import { Lead } from '../types';
import { getLead, updateLead } from '../services/api';
import { useAppContext } from '../context/AppContext';

const EditLeadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshData } = useAppContext();

  useEffect(() => {
    const fetchLead = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const data = await getLead(id);
        if (data) {
          setLead(data);
        }
      } catch (error) {
        console.error('Error fetching lead:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLead();
  }, [id]);

  const handleSubmit = async (data: Partial<Lead>) => {
    if (!id) return;
    
    try {
      setIsSubmitting(true);
      await updateLead(id, data);
      await refreshData();
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-xl font-semibold text-gray-700">Lead not found</p>
      </div>
    );
  }

  return (
    <div>
      <LeadForm 
        initialData={lead} 
        onSubmit={handleSubmit} 
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default EditLeadPage;