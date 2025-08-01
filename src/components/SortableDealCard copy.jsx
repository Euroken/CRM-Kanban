import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, User, Calendar, GripVertical, X, Edit, Trash2 } from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/helpers';

// Menu Popover Component
const MenuPopover = ({ isOpen, onClose, onView, deal }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-8 z-50 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
      <div className="px-3 py-2 border-b border-gray-100">
        <p className="text-xs font-medium text-gray-900 truncate">{deal.title}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onView?.(deal);
          onClose();
        }}
        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
      >
        <Edit className="w-3 h-3" />
        View Potential
      </button>
    </div>
  );
};

// Contact Hover Card Component
const ContactHoverCard = ({ contact, isVisible, position }) => {
  if (!isVisible) return null;

  const [name, email, phone] = contact.split('|'); // Assuming contact format: "Name|email@domain.com|+1234567890"

  return (
    <div 
      className="fixed z-50 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4"
      style={{ 
        left: position.x, 
        top: position.y - 10,
        transform: 'translateY(-100%)'
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
          {contact.split(' ').map(n => n[0]).join('').substring(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900">{name || contact}</h4>
          {email && <p className="text-xs text-gray-600 mt-1">{email}</p>}
          {phone && <p className="text-xs text-gray-600">{phone}</p>}
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">Primary Contact</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SortableDealCard = ({ deal, currentUser, month }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: deal.id 
  });
  
  const [showMenu, setShowMenu] = useState(false);
  const [showContactCard, setShowContactCard] = useState(false);
  const [contactPosition, setContactPosition] = useState({ x: 0, y: 0 });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 'auto',
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowMenu(!showMenu);
  };

  const handleContactClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setContactPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setShowContactCard(true);
  };

  const handleContactMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setContactPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setShowContactCard(true);
  };

  const handleContactMouseLeave = () => {
    setTimeout(() => setShowContactCard(false), 200);
  };

  const handleView = (deal) => {
    window.open(deal.url);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-white rounded-lg shadow-sm border p-4 mb-3 hover:shadow-md transition-all relative ${
          isDragging ? 'opacity-50 rotate-2 scale-105 shadow-xl z-50' : ''
        }`}
      >
        {/* Drag Handle */}
        <div 
          {...attributes}
          {...listeners}
          className="absolute left-2 top-2 p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        <div className="ml-6"> {/* Add margin to account for drag handle */}
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 pr-2">{deal.title}</h3>
            <div className="relative">
              <button
                onClick={handleMenuClick}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
              <MenuPopover
                isOpen={showMenu}
                onClose={() => setShowMenu(false)}
                onView={handleView}
                deal={deal}
              />
            </div>
          </div>

          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <span className="text-green-600 font-medium">{formatCurrency(deal.value)}</span>
              {deal.probability > 0 && currentUser && !currentUser.isFallback && (
                <span className="text-gray-500">({deal.probability}%)</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{deal.company}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(deal.closeDate)}</span>
            </div>
          </div>

          <div className="mt-3 flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Stage: <span className="font-medium">{deal.stage || deal.probability}</span>
            </div>
            <button
              onClick={handleContactClick}
              onMouseEnter={handleContactMouseEnter}
              onMouseLeave={handleContactMouseLeave}
              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium hover:bg-blue-100 hover:text-blue-600 transition-colors"
            >
              {deal.contact.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </button>
          </div>
        </div>
      </div>

      {/* Contact Hover Card */}
      
      <ContactHoverCard
        contact={deal.contact}
        isVisible={showContactCard}
        position={contactPosition}
      />

      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </>
  );
};