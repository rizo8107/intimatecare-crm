import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Settings, 
  BarChart, 
  LogOut,
  X,
  Home,
  MessageCircle,
  BookOpen,
  ChevronDown,
  Send,
  GraduationCap,
  CalendarCheck
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAppContext();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: <LayoutDashboard size={20} />,
      exact: true 
    },
    { 
      name: 'Leads', 
      path: '/leads', 
      icon: <Users size={20} />
    },
    { 
      name: 'Tasks', 
      path: '/tasks', 
      icon: <Calendar size={20} />
    },
    { 
      name: 'Telegram', 
      path: '/telegram', 
      icon: <MessageCircle size={20} />,
      children: [
        {
          name: 'Subscriptions',
          path: '/telegram',
          icon: <MessageCircle size={16} />
        },
        {
          name: 'Campaign',
          path: '/telegram/campaign',
          icon: <Send size={16} />
        },
        {
          name: 'Payment Comparison',
          path: '/telegram/payment-comparison',
          icon: <BarChart size={16} />
        }
      ]
    },
    { 
      name: 'Student Sessions', 
      path: '/sessions', 
      icon: <GraduationCap size={20} />
    },
    { 
      name: 'Session Slots', 
      path: '/session-slots', 
      icon: <Calendar size={20} />
    },
    { 
      name: 'Bookings', 
      path: '/bookings', 
      icon: <CalendarCheck size={20} />
    },
    { 
      name: 'Ebooks', 
      path: '/ebooks', 
      icon: <BookOpen size={20} />
    },
    { 
      name: 'Reports', 
      path: '/reports', 
      icon: <BarChart size={20} />
    },
    { 
      name: 'Settings', 
      path: '/settings', 
      icon: <Settings size={20} />
    }
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };
  
  const toggleExpand = (name: string) => {
    setExpandedItems(prev => 
      prev.includes(name) 
        ? prev.filter(item => item !== name) 
        : [...prev, name]
    );
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200">
        <Link to="/" className="flex items-center gap-2" onClick={onClose}>
          <Home className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-semibold">Intimatecare CRM</span>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <div key={item.path}>
              {item.children ? (
                <div className="space-y-1">
                  <button
                    onClick={() => toggleExpand(item.name)}
                    className={`
                      w-full group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition
                      ${isActive(item.path)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <span className="mr-3">{item.icon}</span>
                      <span>{item.name}</span>
                    </div>
                    <ChevronDown 
                      size={16} 
                      className={`transition-transform ${expandedItems.includes(item.name) ? 'transform rotate-180' : ''}`} 
                    />
                  </button>
                  
                  {expandedItems.includes(item.name) && (
                    <div className="pl-10 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={onClose}
                          className={`
                            group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition
                            ${isActive(child.path, child.path === '/telegram')
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-50'
                            }
                          `}
                        >
                          <span className="mr-3">{child.icon}</span>
                          <span>{child.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition
                    ${isActive(item.path, item.exact)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-gray-200 p-4">
        {currentUser && (
          <div className="flex items-center gap-3 mb-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="h-10 w-10 rounded-full ring-2 ring-white"
            />
            <div>
              <p className="text-sm font-medium text-gray-700">{currentUser.name}</p>
              <p className="text-xs text-gray-500">{currentUser.email}</p>
            </div>
          </div>
        )}
        <button
          className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition"
        >
          <LogOut size={20} className="mr-3" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          {sidebarContent}
        </div>
      </div>

      {/* Mobile sidebar */}
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 lg:hidden" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
                {sidebarContent}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default Sidebar;