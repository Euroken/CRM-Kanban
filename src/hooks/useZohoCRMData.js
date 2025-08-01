import { useState, useEffect } from 'react';
import { groupDealsByMonth } from '../utils/helpers';
import { transformZohoDataToDeals, transformZohoDataToDealsOld } from '../utils/zohoUtils';
import { getNext4Months } from '../utils/helpers';

export const useZohoCRMData = (currentUser) => {
  const [dealsByMonth, setDealsByMonth] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      setLoading(true);

      if (currentUser.isFallback) {
        try {
          const response = await fetch(`https://crm-kanban-893656151.development.catalystserverless.com/server/get-data/api/zoho?name=${encodeURIComponent(currentUser.name)}`);
          const data = await response.json();

          if (data.details && data.details.output) {
            const output = JSON.parse(data.details.output);
            const fetchedColumns = output.column_order || [];
            const fetchedRows = output.rows || [];

            const transformedDeals = transformZohoDataToDealsOld(fetchedColumns, fetchedRows);
            const groupedDeals = groupDealsByMonth(transformedDeals);
            setDealsByMonth(groupedDeals);
          } else {
            console.warn('No data returned from old Zoho API.');
            const next4Months = getNext4Months();
            const emptyMap = {};
            next4Months.forEach(month => {
              emptyMap[month.name] = [];
            });
            setDealsByMonth(emptyMap);
          }
        } catch (err) {
          console.error('Zoho old API fetch error:', err);
          const next4Months = getNext4Months();
          const emptyMap = {};
          next4Months.forEach(month => {
            emptyMap[month.name] = [];
          });
          setDealsByMonth(emptyMap);
        } finally {
          setLoading(false);
        }
      } else {
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

            const transformedDeals = transformZohoDataToDeals(rawDeals);
            console.log('Transformed Deals:', transformedDeals);

            const groupedDeals = groupDealsByMonth(transformedDeals);
            console.log('Grouped Deals by Month:', groupedDeals);

            setDealsByMonth(groupedDeals);
          } else {
            console.warn('No data returned from Zoho CRM search.');
            const next4Months = getNext4Months();
            const emptyMap = {};
            next4Months.forEach(month => {
              emptyMap[month.name] = [];
            });
            setDealsByMonth(emptyMap);
          }
        }).catch(function(error) {
          console.error('Zoho SDK fetch error:', error);
          const next4Months = getNext4Months();
          const emptyMap = {};
          next4Months.forEach(month => {
            emptyMap[month.name] = [];
          });
          setDealsByMonth(emptyMap);
        }).finally(function() {
          setLoading(false);
        });
      }
    };

    fetchData();
  }, [currentUser]);

  return { dealsByMonth, loading, setDealsByMonth };
};