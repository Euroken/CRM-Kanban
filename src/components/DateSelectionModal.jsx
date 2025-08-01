import React, { useState, useEffect } from 'react';
import { getDaysInMonth } from '../utils/helpers'; // Import the new helper

export const DateSelectionModal = ({ show, onClose, deal, targetMonthYear, onConfirm }) => {
  if (!show) return null;

  // Parse targetMonthYear (e.g., "July 2025")
  const [targetMonthName, targetYearStr] = targetMonthYear.split(' ');
  const targetYear = parseInt(targetYearStr, 10);
  const targetMonthIndex = new Date(Date.parse(targetMonthName + " 1, 2000")).getMonth(); // Get 0-indexed month

  // Initialize selectedDay: try to use original deal day, otherwise default to 1
  const initialDay = deal?.closeDate ? new Date(deal.closeDate).getDate() : 1;
  const [selectedDay, setSelectedDay] = useState(initialDay);

  // Update selected day if target month/year changes or deal changes
  useEffect(() => {
    if (deal && targetMonthYear) {
      const currentDealDate = new Date(deal.closeDate);
      const currentDay = currentDealDate.getDate();
      const daysInTargetMonth = getDaysInMonth(targetYear, targetMonthIndex);

      // If the original day is valid for the new month, keep it, otherwise default to 1
      if (currentDay >= 1 && currentDay <= daysInTargetMonth) {
        setSelectedDay(currentDay);
      } else {
        setSelectedDay(1); // Default to 1st if original day is invalid for new month
      }
    }
  }, [deal, targetMonthYear, targetMonthIndex, targetYear]);


  const handleConfirm = () => {
    // Construct the new close date string
    // We need to ensure the month name is correctly mapped to a number for Date constructor
    const monthMap = {
      "January": 0, "February": 1, "March": 2, "April": 3, "May": 4, "June": 5,
      "July": 6, "August": 7, "September": 8, "October": 9, "November": 10, "December": 11
    };
    const newDate = new Date(targetYear, monthMap[targetMonthName], selectedDay);

    // Format new date to YYYY-MM-DD for consistency (Zoho expects this or similar)
    const year = newDate.getFullYear();
    const month = (newDate.getMonth() + 1).toString().padStart(2, '0');
    const day = newDate.getDate().toString().padStart(2, '0');
    const newCloseDate = `${year}-${month}-${day}`;

    onConfirm(deal.id, newCloseDate);
  };

  const daysInCurrentMonth = getDaysInMonth(targetYear, targetMonthIndex);
  const days = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 bg-gray-600/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Select New Close Date</h3>
        <p className="text-gray-600 mb-2">Deal: <span className="font-medium">{deal?.title}</span></p>
        <p className="text-gray-600 mb-4">Company: <span className="font-medium">{deal?.company}</span></p>

        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <label htmlFor="day-select" className="block text-sm font-medium text-gray-700 mb-1">Day</label>
            <select
              id="day-select"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={selectedDay}
              onChange={(e) => setSelectedDay(parseInt(e.target.value, 10))}
            >
              {days.map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="month-input" className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <input
              id="month-input"
              type="text"
              value={targetMonthName}
              disabled
              className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 bg-gray-100 cursor-not-allowed sm:text-sm rounded-md"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="year-input" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input
              id="year-input"
              type="text"
              value={targetYear}
              disabled
              className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 bg-gray-100 cursor-not-allowed sm:text-sm rounded-md"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 text-gray-800 rounded-md hover:bg-blue-700 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
