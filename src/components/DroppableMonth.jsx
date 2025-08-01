import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { SortableDealCard } from './SortableDealCard';
import { formatCurrency, calculateTotal } from '../utils/helpers';

export const DroppableMonth = ({ month, children, colorClass, currentUser }) => {
  const { setNodeRef, isOver } = useDroppable({ id: month });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg p-4 h-full flex flex-col transition-colors ${colorClass} ${
        isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
      }`}
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{month}</h2> {/* This will display "Month Year" */}
        <p className="text-sm text-gray-600">
          {children.length} deals • {formatCurrency(calculateTotal(children))}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <SortableContext items={children.map(d => d.id)} strategy={verticalListSortingStrategy}>
          {children.map((deal, index) => (
            <SortableDealCard
              key={`${month}-${deal.id}-${index}`}
              deal={deal}
              currentUser={currentUser}
              month={month}
            />
          ))}
        </SortableContext>
        {/* Drop zone indicator when empty */}
        {children.length === 0 && isOver && (
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center text-blue-500">
            Drop deals here
          </div>
        )}
      </div>
    </div>
  );
};