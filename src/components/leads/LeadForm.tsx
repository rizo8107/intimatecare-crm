import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lead, LeadStatus } from '../../types';
import Input from '../ui/Input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { User, Building, Mail, Phone, DollarSign, UserCheck } from 'lucide-react';

interface LeadFormProps {
  initialData?: Partial<Lead>;
  onSubmit: (data: Partial<Lead>) => Promise<void>;
  isLoading?: boolean;
}

const LeadForm: React.FC<LeadFormProps> = ({
  initialData = {},
  onSubmit,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'new',
    value: 0,
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'value' ? parseFloat(value) || 0 : value,
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.company?.trim()) {
      newErrors.company = 'Company is required';
    }
    
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (formData.value !== undefined && formData.value < 0) {
      newErrors.value = 'Value cannot be negative';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      await onSubmit(formData);
      navigate('/leads');
    } catch (error) {
      console.error('Error submitting form:', error);
      // Handle submission error
    }
  };

  const statusOptions: { value: LeadStatus; label: string }[] = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'closed-won', label: 'Closed (Won)' },
    { value: 'closed-lost', label: 'Closed (Lost)' },
  ];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData.id ? 'Edit Lead' : 'Add New Lead'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              error={errors.name}
              placeholder="John Smith"
              leftIcon={<User size={16} />}
              required
              fullWidth
            />
            
            <Input
              label="Company"
              name="company"
              value={formData.company || ''}
              onChange={handleChange}
              error={errors.company}
              placeholder="Acme Inc."
              leftIcon={<Building size={16} />}
              required
              fullWidth
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              error={errors.email}
              placeholder="john@example.com"
              leftIcon={<Mail size={16} />}
              required
              fullWidth
            />
            
            <Input
              label="Phone"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              error={errors.phone}
              placeholder="(555) 123-4567"
              leftIcon={<Phone size={16} />}
              fullWidth
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <UserCheck size={16} />
                </div>
                <select
                  name="status"
                  value={formData.status || 'new'}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <Input
              label="Deal Value ($)"
              type="number"
              name="value"
              value={formData.value?.toString() || '0'}
              onChange={handleChange}
              error={errors.value}
              leftIcon={<DollarSign size={16} />}
              fullWidth
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/leads')}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
          >
            {initialData.id ? 'Update Lead' : 'Create Lead'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default LeadForm;