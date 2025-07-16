import React, { useState, useEffect } from 'react';
import { getInstructors, createInstructor } from '../services/api';
import { Instructor } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { 
  PlusCircle, 
  User, 
  Clock, 
  Star, 
  FileText, 
  Award,
  Layout,
  MessageCircle,
  Edit,
  Plus
} from 'lucide-react';

// Define types for all sections
interface InstructorProfile {
  name: string;
  email: string;
  specialization: string;
  bio: string;
  experience: string;
  profile_image_url?: string;
  highlight_color: string;
  secondary_color: string;
}

interface SessionType {
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  is_first_session: boolean;
}

interface InstructorHighlight {
  title: string;
  description: string;
  icon_name: string;
  icon_color: string;
  display_order: number;
}

interface SupportArea {
  category: string;
  title: string;
  description: string;
  icon_name: string;
  display_order: number;
}

interface Offering {
  title: string;
  description: string;
  icon_name: string;
  display_order: number;
}

interface PageSection {
  section_type: string;
  title: string;
  subtitle: string;
  content: string;
  display_order: number;
}

interface Testimonial {
  client_name: string;
  client_description: string;
  content: string;
  rating: number;
}

const InstructorsPage: React.FC = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state for each section
  const [profile, setProfile] = useState<InstructorProfile>({
    name: '',
    email: '',
    specialization: '',
    bio: '',
    experience: '',
    profile_image_url: '',
    highlight_color: '#3498db',
    secondary_color: '#2c3e50'
  });
  
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([
    { name: '', description: '', price: 0, duration_minutes: 60, is_first_session: false }
  ]);
  
  const [highlights, setHighlights] = useState<InstructorHighlight[]>([
    { title: '', description: '', icon_name: 'Award', icon_color: '#f1c40f', display_order: 1 }
  ]);
  
  const [supportAreas, setSupportAreas] = useState<SupportArea[]>([
    { category: '', title: '', description: '', icon_name: 'Star', display_order: 1 }
  ]);
  
  const [offerings, setOfferings] = useState<Offering[]>([
    { title: '', description: '', icon_name: 'FileText', display_order: 1 }
  ]);
  
  const [pageSections, setPageSections] = useState<PageSection[]>([
    { section_type: 'intro', title: '', subtitle: '', content: '', display_order: 1 }
  ]);
  
  const [testimonials, setTestimonials] = useState<Testimonial[]>([
    { client_name: '', client_description: '', content: '', rating: 5 }
  ]);
  

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const data = await getInstructors();
      setInstructors(data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch instructors.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Handle color picker changes
  const handleColorChange = (name: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Add/remove session types
  const addSessionType = () => {
    setSessionTypes([...sessionTypes, { name: '', description: '', price: 0, duration_minutes: 60, is_first_session: false }]);
  };
  
  const removeSessionType = (index: number) => {
    setSessionTypes(sessionTypes.filter((_, i) => i !== index));
  };
  
  // Update session type fields
  const updateSessionType = (index: number, field: keyof SessionType, value: any) => {
    const updatedSessionTypes = [...sessionTypes];
    updatedSessionTypes[index] = { ...updatedSessionTypes[index], [field]: value };
    setSessionTypes(updatedSessionTypes);
  };
  
  // Similar functions for other dynamic sections
  const addHighlight = () => {
    setHighlights([...highlights, { title: '', icon_name: 'Award', icon_color: '#f1c40f', display_order: highlights.length + 1 }]);
  };
  
  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };
  
  const updateHighlight = (index: number, field: keyof InstructorHighlight, value: any) => {
    const updatedHighlights = [...highlights];
    updatedHighlights[index] = { ...updatedHighlights[index], [field]: value };
    setHighlights(updatedHighlights);
  };
  
  // Functions for support areas
  const addSupportArea = () => {
    setSupportAreas([...supportAreas, { category: '', title: '', description: '', icon_name: 'Star', display_order: supportAreas.length + 1 }]);
  };
  
  const removeSupportArea = (index: number) => {
    setSupportAreas(supportAreas.filter((_, i) => i !== index));
  };
  
  const updateSupportArea = (index: number, field: keyof SupportArea, value: any) => {
    const updatedAreas = [...supportAreas];
    updatedAreas[index] = { ...updatedAreas[index], [field]: value };
    setSupportAreas(updatedAreas);
  };
  
  // Functions for offerings
  const addOffering = () => {
    setOfferings([...offerings, { title: '', description: '', icon_name: 'FileText', display_order: offerings.length + 1 }]);
  };
  
  const removeOffering = (index: number) => {
    setOfferings(offerings.filter((_, i) => i !== index));
  };
  
  const updateOffering = (index: number, field: keyof Offering, value: any) => {
    const updatedOfferings = [...offerings];
    updatedOfferings[index] = { ...updatedOfferings[index], [field]: value };
    setOfferings(updatedOfferings);
  };
  
  // Functions for page sections
  const addPageSection = () => {
    setPageSections([...pageSections, { section_type: 'content', title: '', subtitle: '', content: '', display_order: pageSections.length + 1 }]);
  };
  
  const removePageSection = (index: number) => {
    setPageSections(pageSections.filter((_, i) => i !== index));
  };
  
  const updatePageSection = (index: number, field: keyof PageSection, value: any) => {
    const updatedSections = [...pageSections];
    updatedSections[index] = { ...updatedSections[index], [field]: value };
    setPageSections(updatedSections);
  };
  
  // Functions for testimonials
  const addTestimonial = () => {
    setTestimonials([...testimonials, { client_name: '', client_description: '', content: '', rating: 5 }]);
  };
  
  const removeTestimonial = (index: number) => {
    setTestimonials(testimonials.filter((_, i) => i !== index));
  };
  
  const updateTestimonial = (index: number, field: keyof Testimonial, value: any) => {
    const updatedTestimonials = [...testimonials];
    updatedTestimonials[index] = { ...updatedTestimonials[index], [field]: value };
    setTestimonials(updatedTestimonials);
  };
  
  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name || !profile.email) {
      setError('Name and email are required.');
      return;
    }

    try {
      setLoading(true);
      
      // Create the instructor profile first
      const instructorToCreate: Partial<Instructor> = {
        name: profile.name,
        email: profile.email,
        specialization: profile.specialization,
        bio: profile.bio,
        // Include all other profile fields
        experience: profile.experience,
        profile_image_url: profile.profile_image_url,
        highlight_color: profile.highlight_color,
        secondary_color: profile.secondary_color
      };
      
      // TODO: Once instructor is created, add session types, highlights, etc.
      // This would require additional API functions for each related table
      
      await createInstructor(instructorToCreate as any);
      fetchInstructors(); // Refresh the list
      
      // Reset all form states
      setProfile({
        name: '',
        email: '',
        specialization: '',
        bio: '',
        experience: '',
        profile_image_url: '',
        highlight_color: '#3498db',
        secondary_color: '#2c3e50'
      });
      
      setSessionTypes([{ name: '', description: '', price: 0, duration_minutes: 60, is_first_session: false }]);
      setHighlights([{ title: '', icon_name: 'Award', icon_color: '#f1c40f', display_order: 1 }]);
      setSupportAreas([{ category: '', title: '', description: '', icon_name: 'Star', display_order: 1 }]);
      setOfferings([{ title: '', description: '', icon_name: 'FileText', display_order: 1 }]);
      setPageSections([{ section_type: 'intro', title: '', subtitle: '', content: '', display_order: 1 }]);
      setTestimonials([{ client_name: '', client_description: '', content: '', rating: 5 }]);
      
      setActiveTab('profile'); // Reset to first tab
      setError(null);
    } catch (err) {
      setError('Failed to create instructor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Instructor Management</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PlusCircle className="mr-2" />
            Add New Instructor
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Tab navigation */}
          <div className="border-b mb-4">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
              <li className="mr-2">
                <button
                  className={`inline-flex items-center p-4 border-b-2 rounded-t-lg ${activeTab === 'profile' ? 'border-blue-500 text-blue-600' : 'border-transparent hover:border-gray-300'}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <User className="mr-2 h-5 w-5" />
                  Profile
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`inline-flex items-center p-4 border-b-2 rounded-t-lg ${activeTab === 'sessions' ? 'border-blue-500 text-blue-600' : 'border-transparent hover:border-gray-300'}`}
                  onClick={() => setActiveTab('sessions')}
                >
                  <Clock className="mr-2 h-5 w-5" />
                  Session Types
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`inline-flex items-center p-4 border-b-2 rounded-t-lg ${activeTab === 'highlights' ? 'border-blue-500 text-blue-600' : 'border-transparent hover:border-gray-300'}`}
                  onClick={() => setActiveTab('highlights')}
                >
                  <Award className="mr-2 h-5 w-5" />
                  Highlights
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`inline-flex items-center p-4 border-b-2 rounded-t-lg ${activeTab === 'support' ? 'border-blue-500 text-blue-600' : 'border-transparent hover:border-gray-300'}`}
                  onClick={() => setActiveTab('support')}
                >
                  <Star className="mr-2 h-5 w-5" />
                  Support Areas
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`inline-flex items-center p-4 border-b-2 rounded-t-lg ${activeTab === 'offerings' ? 'border-blue-500 text-blue-600' : 'border-transparent hover:border-gray-300'}`}
                  onClick={() => setActiveTab('offerings')}
                >
                  <FileText className="mr-2 h-5 w-5" />
                  Offerings
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`inline-flex items-center p-4 border-b-2 rounded-t-lg ${activeTab === 'sections' ? 'border-blue-500 text-blue-600' : 'border-transparent hover:border-gray-300'}`}
                  onClick={() => setActiveTab('sections')}
                >
                  <Layout className="mr-2 h-5 w-5" />
                  Page Sections
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`inline-flex items-center p-4 border-b-2 rounded-t-lg ${activeTab === 'testimonials' ? 'border-blue-500 text-blue-600' : 'border-transparent hover:border-gray-300'}`}
                  onClick={() => setActiveTab('testimonials')}
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Testimonials
                </button>
              </li>
            </ul>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input name="name" value={profile.name} onChange={handleProfileChange} placeholder="Name" required />
                  <Input name="email" type="email" value={profile.email} onChange={handleProfileChange} placeholder="Email" required />
                  <Input name="specialization" value={profile.specialization} onChange={handleProfileChange} placeholder="Specialization" />
                  <Input name="experience" value={profile.experience} onChange={handleProfileChange} placeholder="Experience" />
                </div>
                <textarea name="bio" value={profile.bio} onChange={handleProfileChange} placeholder="Biography" className="w-full p-2 border rounded" />
                
                {/* Color pickers for instructor theme colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Highlight Color</label>
                    <Input 
                      type="color" 
                      name="highlight_color" 
                      value={profile.highlight_color} 
                      onChange={handleProfileChange} 
                      className="w-full h-8"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Secondary Color</label>
                    <Input 
                      type="color" 
                      name="secondary_color" 
                      value={profile.secondary_color} 
                      onChange={handleProfileChange} 
                      className="w-full h-8"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Session Types Tab */}
            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Session Types</h3>
                  <Button type="button" onClick={addSessionType} className="text-sm">Add Session Type</Button>
                </div>
                
                {sessionTypes.map((sessionType, index) => (
                  <div key={index} className="p-4 border rounded space-y-3">
                    <div className="flex justify-between">
                      <h4 className="font-medium">Session Type {index + 1}</h4>
                      <button 
                        type="button" 
                        onClick={() => removeSessionType(index)}
                        className="text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input 
                        name={`session-name-${index}`} 
                        value={sessionType.name} 
                        onChange={(e) => updateSessionType(index, 'name', e.target.value)}
                        placeholder="Session Name" 
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          name={`session-price-${index}`} 
                          type="number" 
                          value={sessionType.price} 
                          onChange={(e) => updateSessionType(index, 'price', Number(e.target.value))}
                          placeholder="Price" 
                        />
                        <Input 
                          name={`session-duration-${index}`} 
                          type="number" 
                          value={sessionType.duration_minutes} 
                          onChange={(e) => updateSessionType(index, 'duration_minutes', Number(e.target.value))}
                          placeholder="Duration (min)" 
                        />
                      </div>
                    </div>
                    
                    <textarea 
                      name={`session-desc-${index}`} 
                      value={sessionType.description} 
                      onChange={(e) => updateSessionType(index, 'description', e.target.value)}
                      placeholder="Description" 
                      className="w-full p-2 border rounded"
                    />
                    
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id={`session-first-${index}`}
                        checked={sessionType.is_first_session}
                        onChange={(e) => updateSessionType(index, 'is_first_session', e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor={`session-first-${index}`}>This is a first session</label>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Highlights Tab */}
            {activeTab === 'highlights' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Instructor Highlights</h3>
                  <Button type="button" onClick={addHighlight} className="text-sm">Add Highlight</Button>
                </div>
                
                {highlights.map((highlight, index) => (
                  <div key={index} className="p-4 border rounded space-y-3">
                    <div className="flex justify-between">
                      <h4 className="font-medium">Highlight {index + 1}</h4>
                      <button 
                        type="button" 
                        onClick={() => removeHighlight(index)}
                        className="text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <Input 
                        name={`highlight-title-${index}`} 
                        value={highlight.title} 
                        onChange={(e) => updateHighlight(index, 'title', e.target.value)}
                        placeholder="Title" 
                      />
                    </div>
                    
                    <textarea 
                      name={`highlight-desc-${index}`} 
                      value={highlight.description} 
                      onChange={(e) => updateHighlight(index, 'description', e.target.value)}
                      placeholder="Description" 
                      className="w-full p-2 border rounded"
                    />
                  </div>
                ))}
                
                {highlights.length === 0 && (
                  <p className="text-gray-500 italic">No highlights added. Click "Add Highlight" to create one.</p>
                )}
              </div>
            )}
            
            {/* Support Areas Tab */}
            {activeTab === 'support' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Support Areas</h3>
                  <Button type="button" onClick={addSupportArea} className="text-sm">Add Support Area</Button>
                </div>
                
                {supportAreas.map((supportArea, index) => (
                  <div key={index} className="p-4 border rounded space-y-3">
                    <div className="flex justify-between">
                      <h4 className="font-medium">Support Area {index + 1}</h4>
                      <button 
                        type="button" 
                        onClick={() => removeSupportArea(index)}
                        className="text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <Input 
                        name={`support-area-${index}`} 
                        value={supportArea.area} 
                        onChange={(e) => updateSupportArea(index, 'area', e.target.value)}
                        placeholder="Support Area" 
                      />
                    </div>
                    
                    <textarea 
                      name={`support-desc-${index}`} 
                      value={supportArea.description} 
                      onChange={(e) => updateSupportArea(index, 'description', e.target.value)}
                      placeholder="Description" 
                      className="w-full p-2 border rounded"
                    />
                  </div>
                ))}
                
                {supportAreas.length === 0 && (
                  <p className="text-gray-500 italic">No support areas added. Click "Add Support Area" to create one.</p>
                )}
              </div>
            )}
            
            {/* Offerings Tab */}
            {activeTab === 'offerings' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Offerings</h3>
                  <Button type="button" onClick={addOffering} className="text-sm">Add Offering</Button>
                </div>
                
                {offerings.map((offering, index) => (
                  <div key={index} className="p-4 border rounded space-y-3">
                    <div className="flex justify-between">
                      <h4 className="font-medium">Offering {index + 1}</h4>
                      <button 
                        type="button" 
                        onClick={() => removeOffering(index)}
                        className="text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <Input 
                        name={`offering-title-${index}`} 
                        value={offering.title} 
                        onChange={(e) => updateOffering(index, 'title', e.target.value)}
                        placeholder="Title" 
                      />
                    </div>
                    
                    <textarea 
                      name={`offering-desc-${index}`} 
                      value={offering.description} 
                      onChange={(e) => updateOffering(index, 'description', e.target.value)}
                      placeholder="Description" 
                      className="w-full p-2 border rounded"
                    />
                  </div>
                ))}
                
                {offerings.length === 0 && (
                  <p className="text-gray-500 italic">No offerings added. Click "Add Offering" to create one.</p>
                )}
              </div>
            )}
            
            {/* Page Sections Tab */}
            {activeTab === 'sections' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Page Sections</h3>
                  <Button type="button" onClick={addPageSection} className="text-sm">Add Page Section</Button>
                </div>
                
                {pageSections.map((section, index) => (
                  <div key={index} className="p-4 border rounded space-y-3">
                    <div className="flex justify-between">
                      <h4 className="font-medium">Page Section {index + 1}</h4>
                      <button 
                        type="button" 
                        onClick={() => removePageSection(index)}
                        className="text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input 
                        name={`section-title-${index}`} 
                        value={section.title} 
                        onChange={(e) => updatePageSection(index, 'title', e.target.value)}
                        placeholder="Title" 
                      />
                      <Input 
                        name={`section-position-${index}`} 
                        type="number" 
                        value={section.position} 
                        onChange={(e) => updatePageSection(index, 'position', Number(e.target.value))}
                        placeholder="Position" 
                      />
                    </div>
                    
                    <textarea 
                      name={`section-content-${index}`} 
                      value={section.content} 
                      onChange={(e) => updatePageSection(index, 'content', e.target.value)}
                      placeholder="Content" 
                      className="w-full p-2 border rounded h-32"
                    />
                  </div>
                ))}
                
                {pageSections.length === 0 && (
                  <p className="text-gray-500 italic">No page sections added. Click "Add Page Section" to create one.</p>
                )}
              </div>
            )}
            
            {/* Testimonials Tab */}
            {activeTab === 'testimonials' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Testimonials</h3>
                  <Button type="button" onClick={addTestimonial} className="text-sm">Add Testimonial</Button>
                </div>
                
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="p-4 border rounded space-y-3">
                    <div className="flex justify-between">
                      <h4 className="font-medium">Testimonial {index + 1}</h4>
                      <button 
                        type="button" 
                        onClick={() => removeTestimonial(index)}
                        className="text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input 
                        name={`testimonial-name-${index}`} 
                        value={testimonial.client_name} 
                        onChange={(e) => updateTestimonial(index, 'client_name', e.target.value)}
                        placeholder="Client Name" 
                      />
                      <Input 
                        name={`testimonial-role-${index}`} 
                        value={testimonial.client_role} 
                        onChange={(e) => updateTestimonial(index, 'client_role', e.target.value)}
                        placeholder="Client Role/Title" 
                      />
                    </div>
                    
                    <textarea 
                      name={`testimonial-content-${index}`} 
                      value={testimonial.content} 
                      onChange={(e) => updateTestimonial(index, 'content', e.target.value)}
                      placeholder="Testimonial content" 
                      className="w-full p-2 border rounded h-32"
                    />
                    
                    <div className="grid grid-cols-1 gap-4">
                      <Input 
                        name={`testimonial-image-${index}`} 
                        value={testimonial.image_url || ''} 
                        onChange={(e) => updateTestimonial(index, 'image_url', e.target.value)}
                        placeholder="Image URL (optional)" 
                      />
                    </div>
                  </div>
                ))}
                
                {testimonials.length === 0 && (
                  <p className="text-gray-500 italic">No testimonials added. Click "Add Testimonial" to create one.</p>
                )}
              </div>
            )}
            
            <div className="flex justify-between pt-4 mt-6 border-t">
              {activeTab !== 'profile' && (
                <Button type="button" onClick={() => {
                  const tabs = ['profile', 'sessions', 'highlights', 'support', 'offerings', 'sections', 'testimonials'];
                  const currentIndex = tabs.indexOf(activeTab);
                  setActiveTab(tabs[currentIndex - 1]);
                }}>
                  Previous
                </Button>
              )}
              
              <div>
                {activeTab !== 'testimonials' ? (
                  <Button type="button" onClick={() => {
                    const tabs = ['profile', 'sessions', 'highlights', 'support', 'offerings', 'sections', 'testimonials'];
                    const currentIndex = tabs.indexOf(activeTab);
                    setActiveTab(tabs[currentIndex + 1]);
                  }}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit">Create Instructor</Button>
                )}
              </div>
            </div>
            
            {error && <p className="text-red-500">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2" />
            Existing Instructors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading instructors...</p>
          ) : (
            <div className="space-y-4">
              {instructors.map(instructor => (
                <div key={instructor.id} className="p-4 border rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-bold text-lg">{instructor.name}</p>
                    <p className="text-sm text-gray-500">{instructor.email}</p>
                    <p className="text-sm">{instructor.specialization || 'No specialization'}</p>
                  </div>
                  {/* Removed is_active status badge since the column doesn't exist yet in the database */}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructorsPage;
