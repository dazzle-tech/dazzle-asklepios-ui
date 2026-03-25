import React from 'react';
import FluidAdministration from './FluidAdministration';
import FluidAdministrationTable from './FluidAdministrationTable';
import SectionContainer from '@/components/SectionsoContainer';

const FluidAdministrationSection = ({ fluidOrder, setFluidOrder, addLog }) => {
          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (<div dir={dir}>
    <SectionContainer
      title={<p className="font-small">Fluid Administration</p>}
      content={
        <>
          <FluidAdministration
            fluidOrder={fluidOrder}
            setFluidOrder={setFluidOrder}
            addLog={addLog}
          />
          <FluidAdministrationTable
            fluidOrder={fluidOrder}
            setFluidOrder={setFluidOrder}
            addLog={addLog}
          />
        </>
      }
    />
    </div>
  );
};

export default FluidAdministrationSection;
