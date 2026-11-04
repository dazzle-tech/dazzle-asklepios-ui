import { useAppDispatch } from '@/hooks';
import React, { useEffect, useState } from 'react';
import { useGetOrCreateChartForEncounterQuery } from '@/services/dental/dentalChartService';
import { newApDentalChart, newApDentalChartTooth } from '@/types/model-types-constructor';
import ChartTab from './tabs/DentalChartTab';
import ProgressNotesTab from './tabs/ProgressNotesTab';
import TreatmentPlanTab from './tabs/TreatmentPlanTab';
import { useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import MyTab from '@/components/MyTab';

const Dental = () => {
  const location = useLocation();
  const { patient, encounter } = location.state || {};
  const dispatch = useAppDispatch();

  const [originalChart, setOriginalChart] = useState({ ...newApDentalChart });
  const [currentChart, setCurrentChart] = useState({ ...newApDentalChart });
  const [previousCharts, setPreviousCharts] = useState([]);
  const [selectedPreviousChartId, setSelectedPreviousChartId] = useState(null);
  const [selectedTooth, setSelectedTooth] = useState({ ...newApDentalChartTooth });
  const [treatmentPlanTrigger, setTreatmentPlanTrigger] = useState(-1);

  // Fetch (or create) the dental chart for this encounter
  const dentalChartResponse = useGetOrCreateChartForEncounterQuery(encounter?.id, {
    skip: !encounter?.id
  });

  useEffect(() => {
    if (dentalChartResponse && dentalChartResponse.isSuccess && dentalChartResponse.data) {
      setOriginalChart(dentalChartResponse.data);
      setCurrentChart(dentalChartResponse.data);
      setPreviousCharts(dentalChartResponse.data.historyCharts ?? []);
    }
  }, [dentalChartResponse]);

  const cancelPreviousChartView = () => {
    setCurrentChart(originalChart);
    setSelectedPreviousChartId(null);
  };

  const tabData = [
    {
      title: 'Chart',
      content: (
        <ChartTab
          currentChart={currentChart}
          setCurrentChart={setCurrentChart}
          originalChart={originalChart}
          previousCharts={previousCharts}
          selectedPreviousChartId={selectedPreviousChartId}
          setSelectedPreviousChartId={setSelectedPreviousChartId}
          selectedTooth={selectedTooth}
          setSelectedTooth={setSelectedTooth}
          cancelPreviousChartView={cancelPreviousChartView}
          treatmentPlanTrigger={treatmentPlanTrigger}
          setTreatmentPlanTrigger={setTreatmentPlanTrigger}
          isLoading={dentalChartResponse.isLoading}
        />
      )
    },
    {
      title: 'Progress Note',
      content: <ProgressNotesTab chartId={currentChart?.id} dispatch={dispatch} />
    },
    {
      title: 'Treatment Plan',
      content: (
        <TreatmentPlanTab
          encounter={encounter}
          patient={patient}
          treatmentPlanTrigger={treatmentPlanTrigger}
          setTreatmentPlanTrigger={setTreatmentPlanTrigger}
          originalChart={originalChart}
          dispatch={dispatch}
        />
      )
    }
  ];

  return (
    <Box>
      <MyTab data={tabData} lazy/>
    </Box>
  );
};

export default Dental;
