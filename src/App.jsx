import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  User,
  Calendar,
} from 'lucide-react';

const monthColors = [
  'bg-blue-50 border-blue-200',
  'bg-green-50 border-green-200',
  'bg-yellow-50 border-yellow-200',
  'bg-pink-50 border-pink-200',
];

const CRMPipelineKanban = () => {
  const [dealsByMonth, setDealsByMonth] = useState({});
  const [activeDeal, setActiveDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  // Function to get current user from Zoho CRM
  const getCurrentUser = async () => {
    console.log('🔄 Starting getCurrentUser function...');
    setUserLoading(true);
    
    const fallbackUser = {
      id: '3531584000057713001',
      name: 'Themba Zungu',
      email: 'zungu.t@itrtech.africa',
      profile: { name: 'Retentions' },
      role: { name: 'Sales' },
      isFallback: true
    };
    
    // Set a timeout to use fallback user if Zoho takes too long or fails
    const fallbackTimeout = setTimeout(() => {
      console.log('🔄 Using fallback user after timeout');
      setCurrentUser(fallbackUser);
      setUserLoading(false);
    }, 3000);
    
    try {
      // Check if ZOHO SDK is loaded
      if (typeof ZOHO === 'undefined') {
        console.error('❌ ZOHO SDK not loaded. Using fallback user immediately.');
        clearTimeout(fallbackTimeout);
        setCurrentUser(fallbackUser);
        setUserLoading(false);
        return;
      }
      
      console.log('✅ ZOHO SDK detected');
      
      // Check if CRM and CONFIG are available
      if (!ZOHO.CRM || !ZOHO.CRM.CONFIG) {
        console.error('❌ ZOHO.CRM.CONFIG not available. Using fallback user immediately.');
        clearTimeout(fallbackTimeout);
        setCurrentUser(fallbackUser);
        setUserLoading(false);
        return;
      }
      
      console.log('✅ ZOHO.CRM.CONFIG available');
      
      // Initialize the SDK first (important for embedded widgets)
      if (ZOHO.embeddedApp && ZOHO.embeddedApp.init) {
        console.log('🔄 Initializing ZOHO embedded app...');
        try {
          await Promise.race([
            ZOHO.embeddedApp.init(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Init timeout')), 3000))
          ]);
          console.log('✅ ZOHO embedded app initialized');
        } catch (initError) {
          console.error('❌ ZOHO embedded app init failed:', initError);
          // Continue anyway, might still work
        }
      }
      
      console.log('🔄 Calling ZOHO.CRM.CONFIG.getCurrentUser()...');
      
      // Add timeout wrapper for the getCurrentUser call
      const userResponse = await Promise.race([
        ZOHO.CRM.CONFIG.getCurrentUser(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getCurrentUser timeout')), 3500)
        )
      ]);
      
      console.log('✅ getCurrentUser response:', userResponse);
      
      // Parse the response according to Zoho documentation
      if (userResponse && userResponse.users && userResponse.users.length > 0) {
        const userData = userResponse.users[0];
        console.log('📊 User data:', userData);
        
        const currentUserData = {
          id: userData.id,
          name: userData.full_name || userData.name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
          email: userData.email,
          profile: userData.profile,
          role: userData.role
        };
        
        console.log('✅ Processed current user:', currentUserData);
        clearTimeout(fallbackTimeout);
        setCurrentUser(currentUserData);
        setUserLoading(false);
        
      } else {
        console.error('❌ No user data in response:', userResponse);
        throw new Error('No user data returned from Zoho');
      }
      
    } catch (error) {
      console.error('❌ Error in getCurrentUser:', error);
      
      // Only set fallback if the timeout hasn't already fired
      if (userLoading) {
        clearTimeout(fallbackTimeout);
        console.log('🔄 Using fallback user due to error');
        setCurrentUser(fallbackUser);
        setUserLoading(false);
      }
    }
    
    console.log('✅ getCurrentUser function completed');
  };

  // Function to get the next 4 months (current + next 3)
  const getNext4Months = () => {
    const months = [];
    const today = new Date();
    
    for (let i = 0; i < 4; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthName = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();
      months.push({ name: monthName, year, date });
    }
    
    return months;
  };

  // Function to check if a date falls within the next 4 months
  const isWithinNext4Months = (dateString) => {
    const dealDate = new Date(dateString);
    const today = new Date();
    
    // Start of current month
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // End of the 4th month (current + next 3)
    const fourthMonthEnd = new Date(today.getFullYear(), today.getMonth() + 4, 0);
    
    return dealDate >= currentMonthStart && dealDate <= fourthMonthEnd;
  };

  // Function to transform new Zoho data format to deal format
  const transformZohoDataToDeals = (rawDeals) => {
    if (!rawDeals || rawDeals.length === 0) return [];

    // Transform raw deals to deal objects and filter for next 4 months
    const deals = rawDeals
      .map((deal, index) => {
        const transformedDeal = {
          id: deal.id || `deal-${index + 1}`,
          potential_id: deal.Potential_No || deal.id,
          title: deal.Deal_Name || 'Untitled Deal',
          value: deal.Amount || 0,
          company: deal.Account_Name?.name || 'Unknown Company',
          contact: deal.Contact_Name?.name || 'Unknown Contact',
          closeDate: deal.Closing_Date || new Date().toISOString().split('T')[0],
          stage: deal.Stage || 'Unknown Stage',
          probability: deal.Probability || 0,
          owner: deal.Owner?.name || 'Unknown Owner',
          currency: deal.Currency || 'ZAR',
          expectedRevenue: deal.Expected_Revenue || 0,
          createdBy: deal.Created_By?.name || 'Unknown',
          modifiedTime: deal.Modified_Time || deal.Created_Time,
          leadSource: deal.Lead_Source || 'Unknown',
          industry: deal.Industry || 'Unknown',
          region: deal.Region || 'Unknown'
        };
        
        return transformedDeal;
      })
      .filter(deal => isWithinNext4Months(deal.closeDate)); // Filter for next 4 months

    return deals;
  };

  // Function to group deals by month (only for next 4 months)
  const groupDealsByMonth = (deals) => {
    const map = {};
    const next4Months = getNext4Months();
    
    // Initialize all 4 months with empty arrays
    next4Months.forEach(month => {
      map[month.name] = [];
    });
    
    // Group deals by month
    deals.forEach(deal => {
      const date = new Date(deal.closeDate);
      const month = date.toLocaleString('default', { month: 'long' });
      
      // Only add to map if it's one of our target months
      if (map[month] !== undefined) {
        map[month].push(deal);
      }
    });
    
    return map;
  };

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = () => {
      setLoading(true);

      const stageConditions = [
        '(Stage:equals:Initial Contact)',
        '(Stage:equals:Qualification)',
        '(Stage:equals:Awaiting Quote - Product)',
        '(Stage:equals:Awaiting Quote - Services)',
        '(Stage:equals:Quoted)',
        '(Stage:equals:Upside)',
        '(Stage:equals:Commit)',
        '(Stage:equals:At Risk)',
      ];

      const stageQuery = `${stageConditions.join('or')}`;
      const ownerQuery = `(Owner:equals:${currentUser.name})`;
      const searchQuery = `(${ownerQuery}and${stageQuery})`;

      console.log('Search Query:', searchQuery);

      ZOHO.CRM.API.searchRecord({
        Entity: 'Deals',
        Type: 'criteria',
        Query: searchQuery,
      }).then(function(response) {
        console.log('Full Zoho API Response:', response);
        
        if (response && response.data && response.data.length > 0) {
          const rawDeals = response.data;
          console.log(`Raw Deals for ${currentUser.name} with Open-like stages:`, rawDeals);
          
          // Transform the data to deals format (now filtered for next 4 months)
          const transformedDeals = transformZohoDataToDeals(rawDeals);
          console.log('Transformed Deals:', transformedDeals);
          
          // Group deals by month
          const groupedDeals = groupDealsByMonth(transformedDeals);
          console.log('Grouped Deals by Month:', groupedDeals);
          
          setDealsByMonth(groupedDeals);
        } else {
          console.warn('No data returned from Zoho CRM search.');
          // Initialize empty months
          const next4Months = getNext4Months();
          const emptyMap = {};
          next4Months.forEach(month => {
            emptyMap[month.name] = [];
          });
          setDealsByMonth(emptyMap);
        }
      }).catch(function(error) {
        console.error('Zoho SDK fetch error:', error);
        // Initialize empty months on error
        const next4Months = getNext4Months();
        const emptyMap = {};
        next4Months.forEach(month => {
          emptyMap[month.name] = [];
        });
        setDealsByMonth(emptyMap);
      }).finally(function() {
        setLoading(false);
      });
    };

    fetchData();
  }, [currentUser]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findDealMonth = (dealId) => {
    for (const [month, deals] of Object.entries(dealsByMonth)) {
      if (deals && deals.find(d => d.id === dealId)) return month;
    }
    return null;
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const dealId = active.id;
    const month = findDealMonth(dealId);
    if (month) {
      const deal = dealsByMonth[month].find(d => d.id === dealId);
      setActiveDeal(deal);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveDeal(null);
    
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the source month
    const sourceMonth = findDealMonth(activeId);
    if (!sourceMonth) return;

    // Check if we're dropping over a month column
    if (Object.keys(dealsByMonth).includes(overId)) {
      const targetMonth = overId;
      
      if (sourceMonth !== targetMonth) {
        setDealsByMonth(prev => {
          const newMap = { ...prev };
          const sourceDeal = newMap[sourceMonth]?.find(d => d.id === activeId);
          
          if (!sourceDeal) return prev;
          
          // Remove from source
          newMap[sourceMonth] = newMap[sourceMonth].filter(d => d.id !== activeId);
          
          // Add to target
          if (!newMap[targetMonth]) {
            newMap[targetMonth] = [];
          }
          newMap[targetMonth] = [...newMap[targetMonth], sourceDeal];
          
          return newMap;
        });
      }
      return;
    }

    // Check if we're dropping over another deal (for repositioning)
    const targetMonth = findDealMonth(overId);
    
    if (targetMonth && sourceMonth) {
      setDealsByMonth(prev => {
        const newMap = { ...prev };
        const sourceDeal = newMap[sourceMonth]?.find(d => d.id === activeId);
        
        if (!sourceDeal) return prev;
        
        // Remove from source
        newMap[sourceMonth] = newMap[sourceMonth].filter(d => d.id !== activeId);
        
        if (sourceMonth === targetMonth) {
          // Reordering within the same month
          const targetIndex = newMap[targetMonth].findIndex(d => d.id === overId);
          if (targetIndex >= 0) {
            newMap[targetMonth].splice(targetIndex, 0, sourceDeal);
          } else {
            newMap[targetMonth].push(sourceDeal);
          }
        } else {
          // Moving to a different month
          const targetIndex = newMap[targetMonth].findIndex(d => d.id === overId);
          if (targetIndex >= 0) {
            newMap[targetMonth].splice(targetIndex, 0, sourceDeal);
          } else {
            newMap[targetMonth].push(sourceDeal);
          }
        }
        
        return newMap;
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(date);
  };

  const formatCurrency = (value) => {
    // Handle various formats and extract numeric value
    let cleanValue = value;
    
    // If it's already a number, use it
    if (typeof value === 'number') {
      cleanValue = value;
    } else if (typeof value === 'string') {
      // Remove common currency symbols, spaces, and commas
      cleanValue = value.replace(/[R$€£¥,\s]/g, '');
      // Handle cases where value might be empty or contain only non-numeric characters
      if (cleanValue === '' || cleanValue === null || cleanValue === undefined) {
        return "-";
      }
    }
    
    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue) || numValue === 0) {
      return "-";
    }
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(numValue);
  };

  const calculateTotal = (deals) => {
    return deals.reduce((sum, deal) => {
      let cleanValue = deal.value;
      
      // Handle string values by cleaning them
      if (typeof deal.value === 'string') {
        cleanValue = deal.value.replace(/[R$€£¥,\s]/g, '');
      }
      
      const numValue = parseFloat(cleanValue);
      return sum + (isNaN(numValue) ? 0 : numValue);
    }, 0);
  };

  const SortableDealCard = ({ deal }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`bg-white rounded-lg shadow-sm border p-4 mb-3 cursor-move hover:shadow-md transition-shadow ${isDragging ? 'opacity-50' : ''}`}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-sm text-gray-800 line-clamp-2">{deal.title}</h3>
          <MoreHorizontal className="w-4 h-4 text-gray-400 cursor-pointer" />
        </div>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <span className="text-green-600 font-medium">{formatCurrency(deal.value)}</span>
            <span className="text-gray-500">({deal.probability}%)</span>
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
            Stage: <span className="font-medium">{deal.stage}</span>
          </div>
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
            {deal.contact.split(' ').map(n => n[0]).join('').substring(0, 2)}
          </div>
        </div>
      </div>
    );
  };

  const DroppableMonth = ({ month, children, colorClass }) => {
    const { setNodeRef } = useSortable({ id: month });

    return (
      <div ref={setNodeRef} className={`rounded-lg p-4 h-full flex flex-col ${colorClass}`}>
        <div className="mb-4">
          <h2 className="font-semibold text-gray-800">{month}</h2>
          <p className="text-sm text-gray-600">
            {children.length} deals • {formatCurrency(calculateTotal(children))}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SortableContext items={children.map(d => d.id)} strategy={verticalListSortingStrategy}>
            {children.map((deal, index) => (
              <SortableDealCard key={`${month}-${deal.id}-${index}`} deal={deal} />
            ))}
          </SortableContext>
        </div>
      </div>
    );
  };

  if (loading || userLoading) {
    return (
      <div className="h-screen w-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {userLoading ? 'Loading user information...' : 'Loading Zoho deals...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
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
                className="pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <p className='text-sm'>Viewing as:</p>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg">
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

        <DragOverlay>
          {activeDeal && (
            <div className="bg-white rounded-lg shadow-lg border-2 border-blue-400 p-4 rotate-2 scale-105">
              <h3 className="font-semibold text-sm text-gray-800">{activeDeal.title}</h3>
              <div className="text-xs mt-2 text-gray-600">
                {formatCurrency(activeDeal.value)}
              </div>
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default CRMPipelineKanban;