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
import { DroppableMonth } from './components/DroppableMonth';
import { monthColors } from './constants/colors';
import { formatCurrency, calculateTotal } from './utils/helpers';

const CRMPipelineKanban = () => {
  const { currentUser, userLoading, accessDenied } = useCurrentUser(); // Get accessDenied state
  const { dealsByMonth, loading, setDealsByMonth } = useZohoCRMData(currentUser);
  const [activeDeal, setActiveDeal] = useState(null);
  const [activeContainer, setActiveContainer] = useState(null);

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

    console.log('Drag Start: Active ID:', id); // Log active ID

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

    console.log(`Drag Over: Active ID: "${activeId}", Over ID: "${overId}"`); // Log active and over IDs

    if (!overId || activeId === overId) {
      return;
    }

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    console.log(`Drag Over: Active Container: "${activeContainer}", Over Container: "${overContainer}"`); // Log active and over containers

    if (!activeContainer || !overContainer) {
      console.log('Drag Over: Could not find active or over container.');
      return;
    }

    if (activeContainer !== overContainer) {
      console.log(`Drag Over: Moving deal from "${activeContainer}" to "${overContainer}".`);
      setDealsByMonth(prev => {
        const activeItems = prev[activeContainer];
        const overItems = prev[overContainer];

        const activeIndex = activeItems.findIndex(item => item.id === activeId);
        const overIndex = overId in prev
          ? overItems.length + 1
          : overItems.findIndex(item => item.id === overId);

        let newIndex;
        if (overId in prev) {
          newIndex = overItems.length + 1;
        } else {
          const isBelowOverItem = over &&
            activeIndex > overIndex &&
            event.delta.y > 0;

          newIndex = overIndex >= 0
            ? overIndex + (isBelowOverItem ? 1 : 0)
            : overItems.length + 1;
        }

        console.log(`Drag Over: Active Index: ${activeIndex}, Over Index: ${overIndex}, New Index: ${newIndex}`);

        return {
          ...prev,
          [activeContainer]: prev[activeContainer].filter(item => item.id !== activeId),
          [overContainer]: [
            ...prev[overContainer].slice(0, newIndex),
            activeItems[activeIndex],
            ...prev[overContainer].slice(newIndex, prev[overContainer].length),
          ],
        };
      });
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    const { id: activeId } = active;
    const overId = over?.id;

    console.log(`Drag End: Active ID: "${activeId}", Over ID: "${overId}"`); // Log active and over IDs

    setActiveDeal(null);
    setActiveContainer(null);

    if (!overId) {
      console.log('Drag End: No over ID, drag cancelled or dropped outside.');
      return;
    }

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    console.log(`Drag End: Active Container: "${activeContainer}", Over Container: "${overContainer}"`); // Log active and over containers

    if (!activeContainer || !overContainer) {
      console.log('Drag End: Could not find active or over container.');
      return;
    }

    if (activeContainer === overContainer) {
      console.log(`Drag End: Reordering deal within "${activeContainer}".`);
      setDealsByMonth(prev => {
        const activeIndex = prev[activeContainer].findIndex(item => item.id === activeId);
        const overIndex = prev[overContainer].findIndex(item => item.id === overId);
        console.log(`Drag End: Active Index: ${activeIndex}, Over Index: ${overIndex}`);

        return {
          ...prev,
          [overContainer]: arrayMove(prev[overContainer], activeIndex, overIndex),
        };
      });
    } else {
      console.log('Drag End: Deal was moved between different containers (handled by dragOver).');
    }
  };

  if (userLoading) { // Check userLoading first
    return (
      <div className="h-screen w-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) { // Show Access Denied if true
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

  if (loading) { // Then check for deals loading
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
            <p className="text-gray-600">Zoho potentials for current and next 3 months</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search deals..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className='text-sm'>Viewing as:</p>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <User className="w-4 h-4" /> {currentUser?.name || 'Loading...'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-6 p-6 h-full">
            {Object.keys(dealsByMonth).length === 0 ? (
              <div className="flex items-center justify-center w-full h-full">
                <p className="text-gray-500">No deals found for the next 4 months...</p>
              </div>
            ) : (
              Object.entries(dealsByMonth).map(([month, monthDeals], index) => (
                <div key={month} className="flex-1 min-w-0 h-full">
                  <DroppableMonth
                    month={month}
                    colorClass={monthColors[index % monthColors.length]}
                    currentUser={currentUser}
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
    </DndContext>
  );
};

export default CRMPipelineKanban;