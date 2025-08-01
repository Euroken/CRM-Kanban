import { useState, useEffect } from 'react';
import { ChevronDown, Users } from 'lucide-react';

// Admin user IDs who can view other users' deals
const ADMIN_USER_IDS = [
  '3531584000000177021', // Dominique Allner
  '3531584000320563001', // Matthew Dhlamini
  '3531584000044604001', // Luke Morkel
  '3531584000227567001', // Vuyani Mbethe
];

export const useAdminUserSelector = (currentUser) => {
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if current user is admin
  useEffect(() => {
    if (currentUser?.id) {
      const adminStatus = ADMIN_USER_IDS.includes(currentUser.id);
      setIsAdmin(adminStatus);
      
      // Set selected user to current user initially
      setSelectedUser(currentUser);
    }
  }, [currentUser]);

  // Fetch all users if current user is admin
  useEffect(() => {
    if (!isAdmin || !currentUser || currentUser.isFallback) return;

    const fetchAllUsers = async () => {
      setUsersLoading(true);
      
      try {
        if (typeof ZOHO === 'undefined' || !ZOHO.CRM?.API?.getAllUsers) {
          console.error('ZOHO.CRM.API.getAllUsers not available');
          return;
        }

        console.log('Fetching all users for admin...');
        
        const response = await ZOHO.CRM.API.getAllUsers({
          Type: 'ActiveUsers'
        });

        console.log('All Users Response:', response);

        if (response && response.users && response.users.length > 0) {
          const processedUsers = response.users
            .filter(user => user.status === 'active') // Only active users
            .map(user => ({
              id: user.id,
              name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
              email: user.email,
              profile: user.profile,
              role: user.role,
              first_name: user.first_name,
              last_name: user.last_name,
              isFallback: false
            }))
            .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

          console.log('Processed Users:', processedUsers);
          setAllUsers(processedUsers);
        } else {
          console.warn('No users returned from getAllUsers');
        }
      } catch (error) {
        console.error('Error fetching all users:', error);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchAllUsers();
  }, [isAdmin, currentUser]);

  const handleUserChange = (userId) => {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
    }
  };

  return {
    isAdmin,
    allUsers,
    selectedUser,
    usersLoading,
    handleUserChange
  };
};

// UserSelector Component
export const UserSelector = ({ isAdmin, allUsers, selectedUser, usersLoading, onUserChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isAdmin) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors min-w-[200px] justify-between"
        disabled={usersLoading}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            {usersLoading ? 'Loading...' : selectedUser?.name || 'Select User'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !usersLoading && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
            {allUsers.map(user => (
              <button
                key={user.id}
                onClick={() => {
                  onUserChange(user.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                  selectedUser?.id === user.id ? 'bg-blue-50 text-blue-800' : 'text-gray-700'
                }`}
              >
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {user.email} • {user.role?.name || 'No Role'}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};