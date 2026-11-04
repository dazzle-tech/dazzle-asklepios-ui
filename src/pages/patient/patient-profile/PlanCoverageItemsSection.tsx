import React, { useEffect } from 'react';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import SectionContainer from '@/components/SectionsoContainer';
import { formatEnumString } from '@/utils';

import { useGetItemsByPlanQuery } from '@/services/setup/payer/PayorPlanService';

interface Props {
  planId?: number | null;
}

const PlanCoverageItemsSection: React.FC<Props> = ({ planId }) => {
  const {
    data: itemsResp,
    isFetching,
    refetch
  } = useGetItemsByPlanQuery(
    {
      planId: Number(planId),
      page: 0,
      size: 1000
    },
    { skip: !planId }
  );

  useEffect(() => {
    if (planId) {
      refetch();
    }
  }, [planId, refetch]);

  if (!planId) return null;

  const columns = [
    {
      key: 'itemType',
      title: <Translate>Type</Translate>,
      flexGrow: 3,
      render: (row: any) => formatEnumString(row.itemType)
    },
    {
      key: 'coverageType',
      title: <Translate>Coverage Type</Translate>,
      flexGrow: 3,
      render: (row: any) => formatEnumString(row.coverageType)
    },
    {
      key: 'amount',
      title: <Translate>Covered Amount</Translate>,
      flexGrow: 2,
      dataKey: 'amount'
    }
  ];

  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <SectionContainer
      title={<Translate>Plan Coverage Items</Translate>}
      minHeight="auto"
      content={<div dir={dir}>
        <MyTable
          height={220}
          loading={isFetching}
          data={itemsResp?.data ?? []}
          columns={columns}
        />
        </div>
      }
    />
  );
};

export default PlanCoverageItemsSection;
