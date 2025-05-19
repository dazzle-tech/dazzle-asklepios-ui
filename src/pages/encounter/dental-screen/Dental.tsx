import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import React, { useEffect, useState } from 'react';
import { useGetDentalChartsByEncounterQuery } from '@/services/dentalService';
import { newApDentalChart, newApDentalChartTooth } from '@/types/model-types-constructor';
import { BlockUI } from 'primereact/blockui';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';

// Import components
import ChartTab from './tabs/DentalChartTab';
import ProgressNotesTab from './tabs/ProgressNotesTab';
import TreatmentPlanTab from './tabs/TreatmentPlanTab';
import XRayTab from './tabs/XRayTab';
import { useLocation } from 'react-router-dom';

const Dental = () => {
   const location = useLocation();
      const { patient, encounter, edit } = location.state || {};
  const dispatch = useAppDispatch();

  const [originalChart, setOriginalChart] = useState({ ...newApDentalChart });
  const [currentChart, setCurrentChart] = useState({ ...newApDentalChart });
  const [previousCharts, setPreviousCharts] = useState([]);
  const [selectedPreviousChartKey, setSelectedPreviousChartKey] = useState('');
  const [selectedTooth, setSelectedTooth] = useState({ ...newApDentalChartTooth });
  const [progressNotes, setProgressNotes] = useState([]);
  const [manualChartLoading, setManualChartLoading] = useState(false);
  const [treatmentPlanTrigger, setTreatmentPlanTrigger] = useState(-1);

  // Fetch dental charts
  const dentalChartsResponse = useGetDentalChartsByEncounterQuery(encounter?.key ?? '');

  useEffect(() => {
    if (dentalChartsResponse && dentalChartsResponse.isSuccess) {
      if (dentalChartsResponse.data.object) {
        setOriginalChart(dentalChartsResponse.data.object.currentChart);
        setCurrentChart(dentalChartsResponse.data.object.currentChart);
        setPreviousCharts(dentalChartsResponse.data.object.historyCharts);
        setProgressNotes(dentalChartsResponse.data.object.currentChart?.progressNotes ?? []);
      }
    }
  }, [dentalChartsResponse]);

  const cancelPreviousChartView = () => {
    setCurrentChart(originalChart);
    setSelectedPreviousChartKey('');
  };

  return (
    <BlockUI
      template={
        <h3 style={{ textAlign: 'center', color: 'white', top: '10%', position: 'absolute' }}>
          <Translate>Chart Loading</Translate>...
        </h3>
      }
      blocked={dentalChartsResponse.isLoading || manualChartLoading}
    >
      <br />
      <Tabs>
        <TabList>
          <Tab>
            <Translate>Chart</Translate>
          </Tab>
          <Tab>
            <Translate>Progress Note</Translate>
          </Tab>
          <Tab>
            <Translate>Treatment Plan</Translate>
          </Tab>
          <Tab>
            <Translate>X-Ray</Translate>
          </Tab>
        </TabList>

        <TabPanel>
          <ChartTab
            currentChart={currentChart}
            setCurrentChart={setCurrentChart}
            originalChart={originalChart}
            previousCharts={previousCharts}
            selectedPreviousChartKey={selectedPreviousChartKey}
            setSelectedPreviousChartKey={setSelectedPreviousChartKey}
            selectedTooth={selectedTooth}
            setSelectedTooth={setSelectedTooth}
            cancelPreviousChartView={cancelPreviousChartView}
            treatmentPlanTrigger={treatmentPlanTrigger}
            setTreatmentPlanTrigger={setTreatmentPlanTrigger}
            encounter={encounter}
          />
        </TabPanel>

        <TabPanel>
          <ProgressNotesTab
            progressNotes={progressNotes}
            setProgressNotes={setProgressNotes}
            currentChart={currentChart}
            dispatch={dispatch}
          />
        </TabPanel>

        <TabPanel>
          <TreatmentPlanTab
            encounter={encounter}
            patient={patient}
            treatmentPlanTrigger={treatmentPlanTrigger}
            setTreatmentPlanTrigger={setTreatmentPlanTrigger}
            originalChart={originalChart}
            dispatch={dispatch}
          />
        </TabPanel>

        <TabPanel>
          <XRayTab />
        </TabPanel>
      </Tabs>
    </BlockUI>
  );
};

export default Dental;
