import { useAppDispatch } from '@/hooks';
import React, { useEffect, useState } from 'react';
import { useGetOrCreateChartForEncounterQuery } from '@/services/dental/dentalChartService';
import { newApDentalChart, newApDentalChartTooth } from '@/types/model-types-constructor';
import ChartTab from './tabs/DentalChartTab';
import ProgressNotesTab from './tabs/ProgressNotesTab';
import TreatmentPlanTab from './tabs/TreatmentPlan/TreatmentPlanTab';
import ClinicalDocumentationTab from './tabs/ClinicalDocumentationTab';
import DentalAttachmentsTab from './tabs/DentalAttachmentsTab';
import { useLocation } from 'react-router-dom';
import { Alert, Box, Button } from '@mui/material';
import MyTab from '@/components/MyTab';
import { extractErrorMessage } from '@/utils/extractErrorMessage';

const isSetupResolveError = (err: any): boolean => {
  const key = err?.data?.errorKey || err?.data?.message || '';
  const detail = err?.data?.detail || err?.data?.title || '';
  const blob = `${key} ${detail} ${extractErrorMessage(err) || ''}`.toLowerCase();
  return (
    blob.includes('setup.unresolved') ||
    blob.includes('setup.unavailable') ||
    blob.includes('setup.emptyteeth') ||
    blob.includes('dental chart setup') ||
    blob.includes('setup could not')
  );
};

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

  const setupError =
    dentalChartResponse.isError && isSetupResolveError(dentalChartResponse.error)
      ? extractErrorMessage(dentalChartResponse.error) ||
        'Dental chart setup could not be resolved for this encounter.'
      : null;

  const chartLoadError =
    dentalChartResponse.isError && !setupError
      ? extractErrorMessage(dentalChartResponse.error) ||
        'Failed to load the dental chart for this encounter.'
      : null;

  const retryChartLoad = () => {
    dentalChartResponse.refetch();
  };

  const tabData = [
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
    },
    {
      title: 'Clinical Documentation',
      content: <ClinicalDocumentationTab patient={patient} encounter={encounter} />
    },
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
          isLoading={dentalChartResponse.isLoading || dentalChartResponse.isFetching}
          patient={patient}
          encounter={encounter}
        />
      )
    },
    {
      title: 'Progress Note',
      content: <ProgressNotesTab chartId={currentChart?.id} dispatch={dispatch} />
    },
    {
      title: 'Attachments',
      content: <DentalAttachmentsTab patient={patient} encounter={encounter} />
    }
  ];

  return (
    <Box>
      {(setupError || chartLoadError) && (
        <Alert
          severity="warning"
          sx={{ m: 2 }}
          action={
            <Button color="inherit" size="small" onClick={retryChartLoad}>
              Retry
            </Button>
          }
        >
          {setupError || chartLoadError}
        </Alert>
      )}
      <MyTab data={tabData} lazy />
    </Box>
  );
};

export default Dental;
