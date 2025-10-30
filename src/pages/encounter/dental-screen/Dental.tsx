import { useAppDispatch } from '@/hooks';
import React, { useEffect, useState } from 'react';
import { useGetDentalChartsByEncounterQuery } from '@/services/dentalService';
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
  const [selectedPreviousChartKey, setSelectedPreviousChartKey] = useState('');
  const [selectedTooth, setSelectedTooth] = useState({ ...newApDentalChartTooth });
  const [progressNotes, setProgressNotes] = useState([]);
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

  const tabData = [
    {
      title: 'Chart',
      content: (
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
          isLoading={dentalChartsResponse.isLoading}
        />
      )
    },
    {
      title: 'Progress Note',
      content: (
        <ProgressNotesTab
          progressNotes={progressNotes}
          setProgressNotes={setProgressNotes}
          currentChart={currentChart}
          dispatch={dispatch}
        />
      )
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
      <MyTab data={tabData} />
    </Box>
  );
};

export default Dental;
