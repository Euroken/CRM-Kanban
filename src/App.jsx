import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';
import {
  Search,
  User,
} from 'lucide-react';

import { useCurrentUser } from './hooks/useCurrentUser';
import { useZohoCRMData } from './hooks/useZohoCRMData';
import { useAdminUserSelector, UserSelector } from './hooks/useAdminUserSelector';
import { DroppableMonth } from './components/DroppableMonth';
import { DateSelectionModal } from './components/DateSelectionModal';
import { monthColors } from './constants/colors';
import { formatCurrency, calculateTotal } from './utils/helpers';

const CRMPipelineKanban = () => {
  const { currentUser, userLoading, accessDenied } = useCurrentUser();
  
  // Admin user selector hook
  const { isAdmin, allUsers, selectedUser, usersLoading, handleUserChange } = useAdminUserSelector(currentUser);
  
  // Use selectedUser (for admins) or currentUser (for regular users) to fetch deals
  const userForDeals = selectedUser || currentUser;
  const { dealsByMonth, loading, setDealsByMonth } = useZohoCRMData(userForDeals);
  
  const [activeDeal, setActiveDeal] = useState(null);
  const [activeContainer, setActiveContainer] = useState(null);

  // State for the date selection modal
  const [showDateModal, setShowDateModal] = useState(false);
  const [dealToUpdate, setDealToUpdate] = useState(null);
  const [targetMonthForUpdate, setTargetMonthForUpdate] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement to start dragging
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Custom collision detection algorithm
  const collisionDetectionStrategy = (args) => {
    if (activeContainer) {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter(
          (container) => container.id in dealsByMonth
        ),
      });
    }

    // Start by finding any intersecting droppable
    const pointerIntersections = pointerWithin(args);
    const intersections = pointerIntersections.length > 0
      ? pointerIntersections
      : rectIntersection(args);

    let overId = null;

    if (intersections.length > 0) {
      overId = intersections[0].id;

      if (overId in dealsByMonth) {
        const containerItems = dealsByMonth[overId];

        if (containerItems.length > 0) {
          overId = closestCenter({
            ...args,
            droppableContainers: args.droppableContainers.filter(
              (container) => container.id !== overId && containerItems.map(item => item.id).includes(container.id)
            ),
          })[0]?.id || overId;
        }
      }
    }

    return overId ? [{ id: overId }] : [];
  };

  const findContainer = (id) => {
    if (id in dealsByMonth) {
      return id;
    }

    for (const [containerId, items] of Object.entries(dealsByMonth)) {
      if (items.find(item => item.id === id)) {
        return containerId;
      }
    }

    return null;
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const { id } = active;

    console.log('Drag Start: Active ID:', id);

    if (id in dealsByMonth) {
      console.log(`Drag Start: Active ID "${id}" is a month container.`);
      setActiveContainer(id);
      return;
    }

    const container = findContainer(id);
    if (container) {
      const deal = dealsByMonth[container].find(item => item.id === id);
      console.log(`Drag Start: Active ID "${id}" is a deal. Container ID: "${container}", Deal details:`, deal);
      setActiveDeal(deal);
    } else {
      console.log(`Drag Start: Active ID "${id}" not found in any container.`);
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    const { id: activeId } = active;
    const overId = over?.id;

    console.log(`Drag Over: Active ID: "${activeId}", Over ID: "${overId}"`);

    if (!overId || activeId === overId) {
      return;
    }

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    console.log(`Drag Over: Active Container: "${activeContainer}", Over Container: "${overContainer}"`);

    if (!activeContainer || !overContainer) {
      console.log('Drag Over: Could not find active or over container.');
      return;
    }

    // Visual reordering within the same container, but actual data move is in handleDragEnd
    // For cross-container drags, we don't update state here, it's handled by the modal
    if (activeContainer === overContainer) {
      setDealsByMonth(prev => {
        const activeItems = prev[activeContainer];
        const activeIndex = activeItems.findIndex(item => item.id === activeId);
        const overIndex = prev[overContainer].findIndex(item => item.id === overId);

        return {
          ...prev,
          [overContainer]: arrayMove(prev[overContainer], activeIndex, overIndex),
        };
      });
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    const { id: activeId } = active;
    const overId = over?.id;

    console.log(`Drag End: Active ID: "${activeId}", Over ID: "${overId}"`);

    setActiveDeal(null);
    setActiveContainer(null);

    if (!overId) {
      console.log('Drag End: No over ID, drag cancelled or dropped outside.');
      return;
    }

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    console.log(`Drag End: Active Container: "${activeContainer}", Over Container: "${overContainer}"`);

    if (!activeContainer || !overContainer) {
      console.log('Drag End: Could not find active or over container.');
      return;
    }

    if (activeContainer !== overContainer) {
      // Deal was dragged to a different month, open modal for date selection
      console.log(`Drag End: Deal moved from "${activeContainer}" to "${overContainer}". Opening date selection modal.`);
      setDealToUpdate(activeDeal); // activeDeal is set in handleDragStart
      setTargetMonthForUpdate(overContainer);
      setShowDateModal(true);
    } else {
      // Deal was reordered within the same month (already handled by handleDragOver for visual feedback)
      console.log('Drag End: Deal reordered within the same container.');
      // No need to setDealsByMonth here again, as handleDragOver already did the visual reorder.
      // If you want to persist the reorder, you'd do it here (e.g., to a backend).
    }
  };

  // Function to handle date confirmation from the modal
  const handleDateConfirm = async (dealId, newCloseDate) => {
    console.log(`Confirming date for deal ${dealId}: New Close Date: ${newCloseDate}`);

    const dealToMove = Object.values(dealsByMonth).flat().find(deal => deal.id === dealId);

    if (!dealToMove) {
      console.error(`Deal with ID ${dealId} not found for update.`);
      setShowDateModal(false);
      setDealToUpdate(null);
      setTargetMonthForUpdate(null);
      return;
    }

    // Determine the new month based on the newCloseDate
    const newDate = new Date(newCloseDate);
    const newMonthKey = newDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    // --- Production Mode: Update Zoho CRM ---
    if (import.meta.env.MODE !== 'development') {
      console.log('Production mode: Attempting to update Zoho CRM record.');
      try {
        const updateData = {
          id: dealToMove.id, // Use potential_id for Zoho CRM update
          Closing_Date: newCloseDate,
        };

        console.log(updateData);

        
        const response = await ZOHO.CRM.API.updateRecord({
          Entity: 'Deals',
          APIData: updateData,
          Trigger: [],
        });
        

        console.log('Zoho CRM Update Response:', response);

        if (response && response.data && response.data[0] && response.data[0].code === 'SUCCESS') {
          console.log('Zoho CRM record updated successfully.');
          // Proceed with local state update only after successful Zoho update
        } else {
          console.error('Failed to update Zoho CRM record:', response);
          // Optionally, show an error message to the user
          // For now, we'll just log and not update local state
          setShowDateModal(false);
          setDealToUpdate(null);
          setTargetMonthForUpdate(null);
          return;
        }
      } catch (error) {
        console.error('Error updating Zoho CRM record:', error);
        // Optionally, show an error message to the user
        setShowDateModal(false);
        setDealToUpdate(null);
        setTargetMonthForUpdate(null);
        return;
      }
    } else {
      console.log('Development mode: Skipping Zoho CRM update.');
    }

    // --- Local State Update (for both dev and successful prod updates) ---
    setDealsByMonth(prevDealsByMonth => {
      const updatedDealsByMonth = { ...prevDealsByMonth };
      let movedDeal = null;
      let oldMonth = null;

      // Find the deal and remove it from its old month
      for (const monthKey in updatedDealsByMonth) {
        const dealIndex = updatedDealsByMonth[monthKey].findIndex(deal => deal.id === dealId);
        if (dealIndex !== -1) {
          movedDeal = { ...updatedDealsByMonth[monthKey][dealIndex], closeDate: newCloseDate };
          updatedDealsByMonth[monthKey].splice(dealIndex, 1);
          oldMonth = monthKey;
          break;
        }
      }

      if (movedDeal) {
        // Ensure the target month array exists
        if (!updatedDealsByMonth[newMonthKey]) {
          updatedDealsByMonth[newMonthKey] = [];
        }
        // Add the deal to the new month
        updatedDealsByMonth[newMonthKey].push(movedDeal);
        console.log(`Deal ${dealId} moved from ${oldMonth} to ${newMonthKey} with new closeDate: ${newCloseDate}`);
      } else {
        console.error(`Deal with ID ${dealId} not found for local state update.`);
      }

      return updatedDealsByMonth;
    });

    // Close the modal and reset states
    setShowDateModal(false);
    setDealToUpdate(null);
    setTargetMonthForUpdate(null);
  };


  if (userLoading) {
    return (
      <div className="h-screen w-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="h-screen w-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white shadow-lg rounded-lg">
          <h2 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700 text-lg">
            We're sorry, but we could not load your user information.
            Please ensure you are accessing this application from within Zoho CRM.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Zoho deals...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen w-screen bg-gray-50 flex flex-col">
        <div className="bg-white shadow-sm border-b p-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Monthly Deals</h1>
            <p className="text-gray-600">
              Zoho potentials for current and next 3 months
              {isAdmin && selectedUser && selectedUser.id !== currentUser?.id && (
                <span className="ml-2 text-blue-600 font-medium">
                  (Viewing as {selectedUser.name})
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Admin User Selector */}
            <UserSelector
              isAdmin={isAdmin}
              allUsers={allUsers}
              selectedUser={selectedUser}
              usersLoading={usersLoading}
              onUserChange={handleUserChange}
            />
            
            {/* Current User Display */}
            <div className="flex items-center gap-2">
              <p className='text-sm'>
                {isAdmin ? 'Logged in as:' : 'Viewing as:'}
              </p>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <User className="w-4 h-4" /> 
                {currentUser?.name || 'Loading...'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-6 p-6 h-full">
            {Object.keys(dealsByMonth).length === 0 ? (
              <div className="flex items-center justify-center w-full h-full">
                <p className="text-gray-500">
                  No deals found for the next 4 months
                  {userForDeals?.name && ` for ${userForDeals.name}`}...
                </p>
              </div>
            ) : (
              Object.entries(dealsByMonth).map(([month, monthDeals], index) => (
                <div key={month} className="flex-1 min-w-0 h-full">
                  <DroppableMonth
                    month={month}
                    colorClass={monthColors[index % monthColors.length]}
                    currentUser={userForDeals}
                  >
                    {monthDeals}
                  </DroppableMonth>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border-t p-4 text-sm flex items-center justify-between">
          <div>
            Total Value (Next 4 Months):{' '}
            <span className="text-green-600 font-semibold">
              {formatCurrency(calculateTotal(Object.values(dealsByMonth).flat()))}
            </span>
            {userForDeals?.name && (
              <span className="ml-2 text-gray-500">
                for {userForDeals.name}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">Last updated: {new Date().toLocaleString()}</div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDeal && (
            <div className="bg-white rounded-lg shadow-xl border-2 border-blue-400 p-4 rotate-2 scale-105 cursor-grabbing">
              <h3 className="font-semibold text-sm text-gray-800">{activeDeal.title}</h3>
              <div className="text-xs mt-2 text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="text-green-600 font-medium">{formatCurrency(activeDeal.value)}</span>
                  {activeDeal.probability > 0 && (
                    <span className="text-gray-500">({activeDeal.probability}%)</span>
                  )}
                </div>
                <div className="mt-1">
                  {activeDeal.company}
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </div>

      {/* Date Selection Modal */}
      {showDateModal && dealToUpdate && targetMonthForUpdate && (
        <DateSelectionModal
          show={showDateModal}
          onClose={() => setShowDateModal(false)}
          deal={dealToUpdate}
          targetMonthYear={targetMonthForUpdate}
          onConfirm={handleDateConfirm}
        />
      )}
    </DndContext>
  );
};

export default CRMPipelineKanban;