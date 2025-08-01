export const getNext4Months = () => {
  const months = [];
  const today = new Date();

  for (let i = 0; i < 4; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const monthName = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    // Modify this line to include the year in the name
    months.push({ name: `${monthName} ${year}`, year, date });
  }

  return months;
};

export const isWithinNext4Months = (dateString) => {
  if (!dateString) return false;
  
  const dealDate = new Date(dateString);
  const today = new Date();

  // Start of current month
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // First day of the 5th month (ensures we include ALL of the 4th month)
  const fifthMonthStart = new Date(today.getFullYear(), today.getMonth() + 4, 1);
  
  return dealDate >= currentMonthStart && dealDate < fifthMonthStart;
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
};

export const formatCurrency = (value) => {
  let cleanValue = value;

  if (typeof value === 'number') {
    cleanValue = value;
  } else if (typeof value === 'string') {
    cleanValue = value.replace(/[R$€£¥,\s]/g, '');
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

export const calculateTotal = (deals) => {
  return deals.reduce((sum, deal) => {
    let cleanValue = deal.value;

    if (typeof deal.value === 'string') {
      cleanValue = deal.value.replace(/[R$€£¥,\s]/g, '');
    }

    const numValue = parseFloat(cleanValue);
    return sum + (isNaN(numValue) ? 0 : numValue);
  }, 0);
};

export const groupDealsByMonth = (deals) => {
  const map = {};
  const next4Months = getNext4Months();

  next4Months.forEach(month => {
    // Use the new format (e.g., "July 2025") as the key
    map[month.name] = [];
  });

  deals.forEach(deal => {
    const date = new Date(deal.closeDate);
    const monthName = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    const monthKey = `${monthName} ${year}`; // Create the key in the same format

    if (map[monthKey] !== undefined) {
      map[monthKey].push(deal);
    }
  });

  return map;
};

// New helper function to get the number of days in a given month and year
export const getDaysInMonth = (year, monthIndex) => {
  // monthIndex is 0-indexed (0 for January, 11 for December)
  // Date(year, monthIndex + 1, 0) gives the last day of the month
  return new Date(year, monthIndex + 1, 0).getDate();
};
