import React from 'react';
import FluidAdministration from './FluidAdministration';
import FluidAdministrationTable from './FluidAdministrationTable';
import SectionContainer from '@/components/SectionsoContainer';

const FluidAdministrationSection = ({ fluidOrder, setFluidOrder, addLog }) => {
  return (
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
  );
};

export default FluidAdministrationSection;
