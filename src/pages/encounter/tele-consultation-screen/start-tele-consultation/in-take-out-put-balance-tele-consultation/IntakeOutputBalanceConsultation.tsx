import React, { useState } from 'react';
import FluidBalanceTable from './FluidBalanceTable';
import FluidBalanceChart from './FluidBalanceChart';
import IntakesTable from './IntakesTable';
import OutputsTable from './OutputsTable';
import SectionContainer from '@/components/SectionsoContainer';
import './style.less'; 

const IntakeOutputBalanceConsultation = () => {
  const balanceData = [
    { key: '1', date: '2025-02-15', totalIntake: 2500, totalOutput: 1800 },
    { key: '2', date: '2025-02-16', totalIntake: 2800, totalOutput: 2200 },
    { key: '3', date: '2025-02-17', totalIntake: 3200, totalOutput: 2900 },
    { key: '4', date: '2025-02-18', totalIntake: 2400, totalOutput: 2600 }
  ];

  const intakeData = [
    { key: '1', date: '2025-02-15', time: '08:30', intakeType: 'Oral Fluids', route: 'Oral', volume: 500 },
    { key: '2', date: '2025-02-15', time: '12:15', intakeType: 'IV Fluids', route: 'Intravenous', volume: 1000 },
    { key: '3', date: '2025-02-15', time: '16:45', intakeType: 'Oral Fluids', route: 'Oral', volume: 300 },
    { key: '4', date: '2025-02-15', time: '20:30', intakeType: 'IV Fluids', route: 'Intravenous', volume: 700 }
  ];

  const outputData = [
    { key: '1', date: '2025-02-15', time: '09:15', outputType: 'Urine', volume: 800 },
    { key: '2', date: '2025-02-15', time: '13:30', outputType: 'Urine', volume: 600 },
    { key: '3', date: '2025-02-15', time: '17:45', outputType: 'Urine', volume: 400 },
    { key: '4', date: '2025-02-15', time: '22:00', outputType: 'Urine', volume: 300 }
  ];

  const [selectedBalance, setSelectedBalance] = useState<any>(null);
  const chartData = balanceData.map(b => ({ x: b.date, y: b.totalIntake - b.totalOutput }));

  return (
    <div className="iob-container">
      <div className="iob-row">
        <div className="iob-half">
          <IntakesTable data={intakeData} totalIntake={2500} />
        </div>
        <div className="iob-half">
          <OutputsTable data={outputData} totalOutput={2100} />
        </div>
      </div>
        <SectionContainer
          title="Intake Output Balance"
          content={<><div className="iob-row">
        <div className="iob-half">
          <FluidBalanceTable data={balanceData} selected={selectedBalance} setSelected={setSelectedBalance} />
        </div>
        <div className="iob-half">
          <FluidBalanceChart chartData={chartData} maxValue={4000} />
        </div>
        </div></>}/>
    </div>
  );
};

export default IntakeOutputBalanceConsultation;
