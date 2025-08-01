import { isWithinNext4Months } from './helpers';

// Function to transform new Zoho data format to deal format (from App.jsx)
export const transformZohoDataToDeals = (rawDeals) => {
  if (!rawDeals || rawDeals.length === 0) return [];

  const deals = rawDeals
    .map((deal, index) => {
      const transformedDeal = {
        id: deal.id || `deal-${index + 1}`,
        url: `https://crm.zoho.com/crm/org675315567/tab/Potentials/${deal.id}`,
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
    .filter(deal => isWithinNext4Months(deal.closeDate));

  return deals;
};

// Function to transform Zoho data to deal format (from App_old.jsx)
export const transformZohoDataToDealsOld = (columns, rows) => {
  if (!columns || !rows || rows.length === 0) return [];

  const columnMap = {};
  columns.forEach((col, index) => {
    columnMap[col] = index;
  });

  const deals = rows
    .map((row, index) => {
      const deal = {
        id: `deal-${index + 1}`,
        potential_id: row[columnMap['Potential ID']],
        url: row[columnMap['CRM URL']],
        title: row[columnMap['Potential Name']] || 'Untitled Deal',
        value: row[columnMap['Total Value']] || 0,
        company: row[columnMap['Account Name']] || 'Unknown Company',
        contact: row[columnMap['Contact Role']] || 'Unknown Contact',
        closeDate: row[columnMap['Date']] || new Date().toISOString().split('T')[0],
        stage: row[columnMap['Stage']] || 'Unknown Stage',
        probability: 0,
        owner: row[columnMap['Owner Name']] || 'Unknown Owner',
      };

      return deal;
    })
    .filter(deal => isWithinNext4Months(deal.closeDate));

  return deals;
};