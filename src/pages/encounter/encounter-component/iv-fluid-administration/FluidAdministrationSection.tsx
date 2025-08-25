import React from 'react';
import Section from '@/components/Section';
import FluidAdministration from './FluidAdministration';
import FluidAdministrationTable from './FluidAdministrationTable';

const FluidAdministrationSection = ({ fluidOrder, setFluidOrder, addLog }) => {
  return (
    <Section
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
