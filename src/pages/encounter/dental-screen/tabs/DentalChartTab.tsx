import React from 'react';
import { Panel, Stack, ButtonToolbar, SelectPicker, Whisper, Tooltip, IconButton } from 'rsuite';
import * as icons from '@rsuite/icons';
import Translate from '@/components/Translate';
import DentalChart from '@/components/NewDentalChart';
import { newApDentalChartTooth } from '@/types/model-types-constructor';
import { useGetActionsQuery, useGetChartDataQuery } from '@/services/dentalService';
import { useGetCdtsQuery, useGetServicesQuery } from '@/services/setupService';
import { initialListRequest } from '@/types/types';
import { Box } from '@mui/material';
import StackItem from 'rsuite/esm/Stack/StackItem';
import MyTable from '@/components/MyTable'; // Update the path to your MyTable component
import './styles.less';
import ToothActionCard from '@/components/NewDentalChart/ToothActionCard/ToothActionCard';

const ChartTab = ({
  currentChart,
  setCurrentChart,
  originalChart,
  previousCharts,
  selectedPreviousChartKey,
  setSelectedPreviousChartKey,
  selectedTooth,
  setSelectedTooth,
  cancelPreviousChartView,
  treatmentPlanTrigger,
  setTreatmentPlanTrigger,
  encounter
}) => {
  // Dental actions
  const [dentalActionsListRequest, setDentalActionsListRequest] = React.useState({
    ...initialListRequest,
    pageSize: 1000
  });
  const dentalActionsListResponse = useGetActionsQuery(dentalActionsListRequest);
  const [dentalActionsMap, setDentalActionsMap] = React.useState({});

  // Dental services
  const [dentalServicesListRequest, setDentalServicesListRequest] = React.useState({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'category_lkey',
        operator: 'match',
        value: '6418596687583232'
      }
    ],
    pageSize: 1000
  });
  const dentalServicesListResponse = useGetServicesQuery(dentalServicesListRequest);
  const [dentalServicesMap, setDentalServicesMap] = React.useState({});

  // CDT codes
  const [cdtListRequest, setCdtListRequest] = React.useState({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'type_lkey',
        operator: 'match',
        value: '277273303968200'
      }
    ],
    pageSize: 1000
  });
  const cdtListResponse = useGetCdtsQuery(cdtListRequest);
  const [cdtMap, setCdtMap] = React.useState({});

  // Previous chart data
  const previousChartDataResponse = useGetChartDataQuery(selectedPreviousChartKey, {
    skip: !selectedPreviousChartKey || selectedPreviousChartKey === ''
  });

  // Cache dental actions
  React.useEffect(() => {
    if (dentalActionsListResponse.status === 'fulfilled') {
      const actionCache = {};
      dentalActionsListResponse.data.object.map(action => {
        actionCache[action.key] = action;
      });
      setDentalActionsMap(actionCache);
    }
  }, [dentalActionsListResponse]);

  // Cache dental services
  React.useEffect(() => {
    if (dentalServicesListResponse.status === 'fulfilled') {
      const servicesCache = {};
      dentalServicesListResponse.data.object.map(service => {
        servicesCache[service.key] = service;
      });
      setDentalServicesMap(servicesCache);
    }
  }, [dentalServicesListResponse]);

  // Cache CDT codes
  React.useEffect(() => {
    if (cdtListResponse.status === 'fulfilled') {
      const cdtCache = {};
      cdtListResponse.data.object.map(cdt => {
        cdtCache[cdt.key] = cdt;
      });
      setCdtMap(cdtCache);
    }
  }, [cdtListResponse]);

  // Handle previous chart data
  React.useEffect(() => {
    if (previousChartDataResponse && previousChartDataResponse.isSuccess) {
      if (previousChartDataResponse.data.object) {
        setCurrentChart(previousChartDataResponse.data.object);
      }
    }
  }, [previousChartDataResponse, setCurrentChart]);

  return (
    <Box className="dental-chart-tab-container">
      <Panel
        bordered
        className="dental-visit-chart"
        header={
          <Box>
            <Stack justifyContent="space-between" alignItems="flex-start">
              <StackItem>
                <Translate>Current Visit Chart</Translate>
                {currentChart.key !== originalChart.key && (
                  <small style={{ color: 'rgb(120,120,120)' }}>
                    Previewing History Chart ({currentChart.chartDate})
                  </small>
                )}
                <br />
              </StackItem>

              <StackItem>
                <ButtonToolbar>
                  <SelectPicker
                    onClean={cancelPreviousChartView}
                    placeholder="Previous Charts"
                    data={previousCharts}
                    labelKey={'chartDate'}
                    valueKey="key"
                    value={selectedPreviousChartKey}
                    style={{ width: '200px' }}
                    onChange={e => {
                      if (e) setSelectedPreviousChartKey(e);
                      else cancelPreviousChartView();
                    }}
                  />
                </ButtonToolbar>
              </StackItem>
            </Stack>
            <Box className="selected-tooth-cleaner">
              {selectedTooth?.key && (
                <>
                  <small>(Selected Tooth <strong>#{selectedTooth?.toothNumber}</strong>)</small>
                  <IconButton
                    title="Clear Selection"
                    appearance="link"
                    disabled={!selectedTooth || !selectedTooth.key}
                    onClick={() => {
                      setSelectedTooth({ ...newApDentalChartTooth });
                    }}
                    icon={<icons.BlockRound />}
                  />
                </>
              )}
            </Box>
          </Box>
        }
      >
        <DentalChart
          disabled={currentChart.key !== originalChart.key}
          chartObject={currentChart}
          setChartObject={setCurrentChart}
          selectedTooth={selectedTooth}
          setSelectedTooth={setSelectedTooth}
          dentalActionsList={dentalActionsListResponse.data?.object ?? []}
          dentalActionsMap={dentalActionsMap}
          dentalServicesList={dentalServicesListResponse.data?.object ?? []}
          dentalServicesMap={dentalServicesMap}
          cdtList={cdtListResponse.data?.object ?? []}
          cdtMap={cdtMap}
          treatmentPlanTrigger={treatmentPlanTrigger}
          setTreatmentPlanTrigger={setTreatmentPlanTrigger}
          cdtLoading={cdtListResponse.isLoading}
          servicesLoading={dentalServicesListResponse.isLoading}
        />
      </Panel>
      <Panel
        bordered
        className="dental-actions-table"
        header={
          <Box>
            <Translate>Current Chart Actions</Translate>
            {currentChart.key !== originalChart.key && (
              <small style={{ color: 'rgb(120,120,120)' }}>
                Previewing History Chart ({currentChart.chartDate})
              </small>
            )}
          </Box>
        }
      >
        {currentChart?.chartActions?.map(tooth => (
          <ToothActionCard
            key={tooth.key}
            date={tooth.createdAt}
            toothNumber={tooth.toothNumber}
            action={dentalActionsMap[tooth.actionKey]?.description || '-'}
            type={
              dentalActionsMap[tooth.actionKey]?.type === 'treatment' ? 'Treatment' : 'Condition'
            }
            surface={tooth.surfaceLvalue?.lovDisplayVale ?? '-'}
            note={tooth.note}
            existing={tooth.existing}
          />
        ))}
        {/* <MyTable
          data={currentChart.chartActions || []}
          columns={columns}
          height={500}
          loading={false}
        /> */}
      </Panel>
    </Box>
  );
};

export default ChartTab;
