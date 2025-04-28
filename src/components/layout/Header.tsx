import React from 'react';
import { Bell, Search, Plus, Menu } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useLocation, useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { searchTerm, setSearchTerm, currentUser } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/leads')) {
      if (path === '/leads/new') return 'Add New Lead';
      if (path.includes('/edit')) return 'Edit Lead';
      if (path.includes('/view')) return 'Lead Details';
      return 'Leads';
    }
    if (path.startsWith('/tasks')) return 'Tasks';
    if (path.startsWith('/reports')) return 'Reports';
    if (path.startsWith('/settings')) return 'Settings';
    return 'Intimatecare CRM';
  };

  const showAddButton = location.pathname === '/leads';
  const showSearch = ['/leads', '/tasks'].includes(location.pathname);

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="lg:hidden -ml-0.5 -mt-0.5 h-10 w-10 inline-flex items-center justify-center rounded-md hover:bg-gray-100"
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            
            <h1 className="text-xl font-semibold text-gray-800 truncate">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {showSearch && (
              <div className="hidden md:block relative w-full max-w-xs">
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search size={16} />}
                  fullWidth
                />
              </div>
            )}
            
            {showAddButton && (
              <Button 
                variant="primary"
                size="sm"
                icon={<Plus size={16} />}
                onClick={() => navigate('/leads/new')}
                className="hidden sm:flex"
              >
                Add Lead
              </Button>
            )}
            
            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-full hover:bg-gray-100">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>
              
              <div className="relative">
                <button className="relative flex rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <img
                    src={currentUser?.avatar || 'https://randomuser.me/api/portraits/men/1.jpg'}
                    alt="User avatar"
                    className="h-8 w-8 rounded-full ring-2 ring-white"
                  />
                  <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-400 ring-2 ring-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile search bar */}
        {showSearch && (
          <div className="md:hidden -mt-2 pb-3 px-1">
            <Input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={16} />}
              fullWidth
            />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;