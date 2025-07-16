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
  //'bg-purple-50 border-purple-200',
  //'bg-orange-50 border-orange-200',
  //'bg-teal-50 border-teal-200',
 // 'bg-red-50 border-red-200',
  //'bg-indigo-50 border-indigo-200',
  //'bg-lime-50 border-lime-200',
];

const CRMPipelineKanban = () => {

  const initialDeals = [
    { id: 'deal-1', title: 'Wright Millners', value: 30830, company: 'Acme Corp', contact: 'John Smith', closeDate: '2024-07-15', probability: 75 },
    { id: 'deal-2', title: 'Limpopo Gambling Board', value: "", company: 'TechCo', contact: 'Sarah Johnson', closeDate: '2024-08-20', probability: 50 },
    { id: 'deal-3', title: 'Enterprise Software License', value: 45000, company: 'BigCorp', contact: 'Mike Wilson', closeDate: '2024-09-01', probability: 85 },
    { id: 'deal-4', title: 'E-commerce Platform', value: 22000, company: 'RetailPlus', contact: 'Lisa Brown', closeDate: '2024-08-10', probability: 60 },
    { id: 'deal-5', title: 'CRM Integration', value: 12000, company: 'SalesForce Inc', contact: 'David Lee', closeDate: '2024-10-01', probability: 90 },
    { id: 'deal-6', title: 'Cloud Migration', value: 35000, company: 'CloudTech', contact: 'Emma Davis', closeDate: '2024-07-30', probability: 70 },
    { id: 'deal-7', title: 'Security Audit', value: 18000, company: 'SecureNet', contact: 'Tom Anderson', closeDate: '2024-09-10', probability: 65 },
    { id: 'deal-8', title: 'AI Research Partnership', value: 50000, company: 'InnovateX', contact: 'Alice Cooper', closeDate: '2024-07-25', probability: 80 },
    { id: 'deal-9', title: 'Digital Transformation Project', value: 35000, company: 'TechFuture', contact: 'Jason Lee', closeDate: '2024-08-15', probability: 55 },
    { id: 'deal-10', title: 'Blockchain Implementation', value: 42000, company: 'CryptoSoft', contact: 'Sophie Green', closeDate: '2024-09-05', probability: 90 },
    { id: 'deal-11', title: 'SaaS Onboarding', value: 15000, company: 'SaaSPro', contact: 'Paul Turner', closeDate: '2024-08-02', probability: 60 },
    { id: 'deal-12', title: 'IoT Network Deployment', value: 25000, company: 'TechWave', contact: 'George Knight', closeDate: '2024-09-30', probability: 80 },
    { id: 'deal-13', title: 'Cybersecurity Solutions', value: 28000, company: 'SecureNet', contact: 'Chloe Adams', closeDate: '2024-10-05', probability: 65 },
    { id: 'deal-14', title: 'Data Analytics Package', value: 45000, company: 'DataMind', contact: 'Sarah Harris', closeDate: '2024-07-18', probability: 50 },
    { id: 'deal-15', title: 'Enterprise App Upgrade', value: 27000, company: 'SmartTech', contact: 'Brian Parker', closeDate: '2024-08-22', probability: 70 },
    { id: 'deal-16', title: '5G Infrastructure', value: 52000, company: 'MobileTech', contact: 'Jessica Taylor', closeDate: '2024-09-15', probability: 85 },
    { id: 'deal-17', title: 'ERP System Integration', value: 43000, company: 'BigCorp', contact: 'Evan Thompson', closeDate: '2024-10-12', probability: 60 },
    { id: 'deal-18', title: 'Cloud Security Audit', value: 38000, company: 'CloudSec', contact: 'Kara Jenkins', closeDate: '2024-07-27', probability: 65 },
    { id: 'deal-19', title: 'Digital Marketing Campaign', value: 20000, company: 'AdTech', contact: 'Nina Clark', closeDate: '2024-08-28', probability: 75 },
    { id: 'deal-20', title: 'CRM System Development', value: 32000, company: 'RetailPlus', contact: 'Mark Evans', closeDate: '2024-09-20', probability: 70 },
    { id: 'deal-21', title: 'AI-Powered Analytics', value: 55000, company: 'DataVision', contact: 'Olivia Scott', closeDate: '2024-07-10', probability: 90 },
    { id: 'deal-22', title: 'Cloud-Based HR Solution', value: 48000, company: 'HRTech', contact: 'Liam Reed', closeDate: '2024-08-01', probability: 80 },
    { id: 'deal-23', title: 'Next-Gen Payment System', value: 43000, company: 'FinTech Corp', contact: 'Megan White', closeDate: '2024-09-17', probability: 75 },
    { id: 'deal-24', title: 'E-commerce Marketing', value: 15000, company: 'ShopRight', contact: 'Julia Morgan', closeDate: '2024-10-03', probability: 50 },
    { id: 'deal-25', title: 'Supply Chain Automation', value: 32000, company: 'LogisticsCo', contact: 'Cameron Evans', closeDate: '2024-07-12', probability: 85 },
    { id: 'deal-26', title: 'Remote Work Solutions', value: 24000, company: 'WorkTech', contact: 'Isabel Allen', closeDate: '2024-08-30', probability: 65 },
    { id: 'deal-27', title: 'Automated Testing Framework', value: 28000, company: 'TestCo', contact: 'Raymond Stone', closeDate: '2024-09-25', probability: 90 },
    { id: 'deal-28', title: 'Big Data Platform', value: 30000, company: 'DataVision', contact: 'Amanda Hughes', closeDate: '2024-10-10', probability: 50 },
    { id: 'deal-29', title: 'RPA Deployment', value: 23000, company: 'RPA Solutions', contact: 'David Brown', closeDate: '2024-07-22', probability: 60 },
    { id: 'deal-30', title: 'Telecommunications Expansion', value: 50000, company: 'TeleComTech', contact: 'Sophia Harris', closeDate: '2024-08-08', probability: 80 },
    { id: 'deal-31', title: 'AI Chatbot Integration', value: 37000, company: 'TechBot', contact: 'Tom Green', closeDate: '2024-09-12', probability: 85 },
    { id: 'deal-32', title: 'Cloud Data Migration', value: 44000, company: 'CloudShift', contact: 'Olivia King', closeDate: '2024-09-24', probability: 50 },
    { id: 'deal-33', title: 'Workforce Management Software', value: 19000, company: 'HRSoft', contact: 'Noah Young', closeDate: '2024-07-20', probability: 70 },
    { id: 'deal-34', title: 'Mobile App Development', value: 32000, company: 'AppTech', contact: 'Eva Morris', closeDate: '2024-08-13', probability: 90 },
    { id: 'deal-35', title: 'AI Marketing Automation', value: 38000, company: 'MarketeerX', contact: 'Lily Phillips', closeDate: '2024-09-29', probability: 60 },
    { id: 'deal-36', title: 'Financial Analytics Platform', value: 42000, company: 'FinAnalytics', contact: 'Isaac Turner', closeDate: '2024-07-08', probability: 75 },
    { id: 'deal-37', title: 'Healthcare Data Platform', value: 55000, company: 'HealthTech', contact: 'Ellen Parker', closeDate: '2024-08-05', probability: 85 },
    { id: 'deal-38', title: 'Virtual Reality Training', value: 28000, company: 'VRTech', contact: 'Aiden Scott', closeDate: '2024-09-19', probability: 50 },
    { id: 'deal-39', title: 'Smart City Solutions', value: 46000, company: 'UrbanTech', contact: 'Grace Lee', closeDate: '2024-07-23', probability: 65 },
    { id: 'deal-40', title: 'SaaS Platform Development', value: 33000, company: 'SaaSNext', contact: 'Zoe Clark', closeDate: '2024-08-04', probability: 90 },
    { id: 'deal-41', title: 'IT Infrastructure Upgrade', value: 47000, company: 'TechInfra', contact: 'Miles Davis', closeDate: '2024-09-03', probability: 60 },
    { id: 'deal-42', title: 'Mobile Payment Gateway', value: 24000, company: 'PayTech', contact: 'Lucas Harris', closeDate: '2024-08-09', probability: 75 },
    { id: 'deal-43', title: 'Voice Recognition System', value: 31000, company: 'VoiceTech', contact: 'Isabella Carter', closeDate: '2024-09-14', probability: 80 },
    { id: 'deal-44', title: 'Cloud Storage Service', value: 29000, company: 'CloudStore', contact: 'Liam White', closeDate: '2024-10-15', probability: 50 },
    { id: 'deal-45', title: 'Customer Engagement Platform', value: 39000, company: 'EngageTech', contact: 'James Wilson', closeDate: '2024-07-02', probability: 65 },
    { id: 'deal-46', title: 'R&D Lab Setup', value: 24000, company: 'InnovativeTech', contact: 'Natalie Green', closeDate: '2024-08-18', probability: 70 },
    { id: 'deal-47', title: 'Smart Home Integration', value: 52000, company: 'SmartHomeInc', contact: 'Henry Brown', closeDate: '2024-09-06', probability: 90 },
    { id: 'deal-48', title: 'IT Support Services', value: 22000, company: 'SupportTech', contact: 'Vera White', closeDate: '2024-07-04', probability: 55 },
    { id: 'deal-49', title: 'Financial Software Implementation', value: 46000, company: 'FinSoft', contact: 'Daniel Grey', closeDate: '2024-09-11', probability: 60 },
    { id: 'deal-50', title: 'Mobile Device Management', value: 35000, company: 'MobileTech', contact: 'Chris Jones', closeDate: '2024-08-25', probability: 80 }
  ];

  const [dealsByMonth, setDealsByMonth] = useState(() => {
    const map = {};
    initialDeals.forEach(deal => {
      const month = new Date(deal.closeDate).toLocaleString('default', { month: 'long' });
      if (!map[month]) map[month] = [];
      map[month].push(deal);
    });
    return map;
  });

  const [activeDeal, setActiveDeal] = useState(null);

  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/zoho')
      .then((res) => res.json())
      .then((data) => {
        // Parse the stringified JSON inside data.details.output
        if (data.details && data.details.output) {
          const output = JSON.parse(data.details.output);
          setColumns(output.column_order || []);
          setRows(output.rows || []);
        }
      })
      .catch((err) => console.error('Zoho fetch error:', err));
  }, []);

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
    if (!sourceMonth) return; // Safety check

    // Check if we're dropping over a month column
    if (Object.keys(dealsByMonth).includes(overId)) {
      const targetMonth = overId;
      
      if (sourceMonth !== targetMonth) {
        setDealsByMonth(prev => {
          const newMap = { ...prev };
          const sourceDeal = newMap[sourceMonth]?.find(d => d.id === activeId);
          
          if (!sourceDeal) return prev; // Safety check - don't update if deal not found
          
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
        
        if (!sourceDeal) return prev; // Safety check - don't update if deal not found
        
        // Remove from source
        newMap[sourceMonth] = newMap[sourceMonth].filter(d => d.id !== activeId);
        
        if (sourceMonth === targetMonth) {
          // Reordering within the same month
          const targetIndex = newMap[targetMonth].findIndex(d => d.id === overId);
          if (targetIndex >= 0) {
            newMap[targetMonth].splice(targetIndex, 0, sourceDeal);
          } else {
            // If target not found, just add to end
            newMap[targetMonth].push(sourceDeal);
          }
        } else {
          // Moving to a different month
          const targetIndex = newMap[targetMonth].findIndex(d => d.id === overId);
          if (targetIndex >= 0) {
            newMap[targetMonth].splice(targetIndex, 0, sourceDeal);
          } else {
            // If target not found, just add to end
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
    // Handle empty strings and zero values properly
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue === 0) {
      return "-";
    }
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(numValue);
  };

  // Helper function to calculate totals properly
  const calculateTotal = (deals) => {
    return deals.reduce((sum, deal) => {
      const numValue = parseFloat(deal.value);
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
           <div className="text-xs text-gray-500">Probability: <span className="font-medium">{deal.probability}%</span></div>
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
            {deal.contact.split(' ').map(n => n[0]).join('')}
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

  return (
    <>
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      // onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen w-screen bg-gray-50 flex flex-col">
        <div className="bg-white shadow-sm border-b p-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Monthly Deals</h1>
            <p className="text-gray-600">Ongoing potentials grouped by close month</p>
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
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-100">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add Deal
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-6 p-6 h-full">
            {Object.entries(dealsByMonth).map(([month, monthDeals], index) => (
              <div key={month} className="flex-shrink-0 w-80 h-full">
                <DroppableMonth
                  month={month}
                  colorClass={monthColors[index % monthColors.length]}
                >
                  {monthDeals}
                </DroppableMonth>
              </div>
            ))}
          </div>
        </div>

        {/*
        <div className="flex-1 overflow-x-auto">
          <div className="flex h-full min-w-full">
            {Object.entries(dealsByMonth).map(([month, monthDeals], index) => {
              const columnWidth = `${100 / Object.keys(dealsByMonth).length}%`;
              return (
                <div key={month} className="h-full p-3" style={{ width: columnWidth, minWidth: '320px' }}>
                  <DroppableMonth
                    month={month}
                    colorClass={monthColors[index % monthColors.length]}
                  >
                    {monthDeals}
                  </DroppableMonth>
                </div>
              );
            })}
          </div>
        </div>
        */}

        <div className="bg-white border-t p-4 text-sm flex items-center justify-between">
          <div>
            Total Value:{' '}
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
        <div className="mt-12">
  <h2 className="text-xl font-bold mb-4">Zoho Potentials Table</h2>
  <div className="overflow-x-auto border rounded-lg shadow">
    <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
      <thead className="bg-gray-100">
        <tr>
          {columns.map((col, i) => (
            <th
              key={i}
              className="px-4 py-2 font-medium text-gray-600 whitespace-nowrap"
            >
              {col.replace(/_/g, ' ')}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 bg-white">
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="px-4 py-4 text-gray-500 italic text-center"
            >
              Loading Zoho deals...
            </td>
          </tr>
        ) : (
          rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2 whitespace-nowrap">
                  {typeof cell === 'number' && columns[cellIndex] === 'Amount'
                    ? `R ${cell.toLocaleString()}`
                    : cell || '-'}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
</div>

    </>
  );
};

export default CRMPipelineKanban;