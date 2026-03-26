import React from 'react';
import MyTable from '@/components/MyTable/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import './styles.less';

const SlidingScaleRulesSection = ({ rules, columns, canEdit, onRowClick }) => {

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div className="margin-section " dir={dir}>
      <SectionContainer
        title={<h6>Sliding Scale Rules</h6>}
        content={
          <MyTable
            data={rules}
            columns={columns}
            height={300}
            onRowClick={canEdit ? onRowClick : undefined}
          />
        }
      />
    </div>
  );
};

export default SlidingScaleRulesSection;
