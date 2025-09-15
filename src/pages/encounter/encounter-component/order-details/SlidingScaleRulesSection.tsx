import React from 'react';
import MyTable from '@/components/MyTable/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import './styles.less';

const SlidingScaleRulesSection = ({ rules, columns, canEdit, onRowClick }) => {
  return (
    <div className="margin-section ">
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
