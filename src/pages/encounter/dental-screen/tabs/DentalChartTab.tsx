'use client';

import React from 'react';
import { Panel, Stack, ButtonToolbar, SelectPicker, Whisper, Tooltip, IconButton } from 'rsuite';
import * as icons from '@rsuite/icons';
import Translate from '@/components/Translate';
import DentalChart from '@/components/DentalChart';
import { newApDentalChartTooth } from '@/types/model-types-constructor';
import { useGetActionsQuery, useGetChartDataQuery } from '@/services/dentalService';
import { useGetCdtsQuery, useGetServicesQuery } from '@/services/setupService';
import { initialListRequest } from '@/types/types';
import { Box } from '@mui/material';
import StackItem from 'rsuite/esm/Stack/StackItem';
import MyTable from '@/components/MyTable'; // Update the path to your MyTable component

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

  // Define table data
  const columns = [
    {
      key: 'existing',
      title: <Translate>Existing</Translate>,
      render: rowData => <Translate>{rowData.existing ? 'Yes' : 'No'}</Translate>
    },
    {
      key: 'toothNumber',
      title: <Translate>Tooth #</Translate>,
      dataKey: 'toothNumber'
    },
    {
      key: 'actionKey',
      title: <Translate>Action</Translate>,
      render: rowData => (
        <Translate>{dentalActionsMap[rowData.actionKey]?.description || '-'}</Translate>
      )
    },
    {
      key: 'type',
      title: <Translate>Type</Translate>,
      render: rowData => (
        <small>
          {dentalActionsMap[rowData.actionKey]?.type === 'treatment' ? (
            <b style={{ color: 'green' }}>Treatment</b>
          ) : (
            <b style={{ color: 'red' }}>Condition</b>
          )}
        </small>
      )
    },
    {
      key: 'surfaceLvalue',
      title: <Translate>Surface</Translate>,
      render: rowData => <small>{rowData.surfaceLvalue?.lovDisplayVale ?? '-'}</small>
    },
    {
      key: 'note',
      title: <Translate>Note</Translate>,
      render: rowData =>
        rowData.note && (
          <Whisper
            placement="right"
            controlId="control-id-hover"
            trigger="hover"
            speaker={
              <Tooltip>
                <span style={{ fontSize: '20px' }}>{rowData.note}</span>
              </Tooltip>
            }
          >
            <icons.Message style={{ fontSize: '20px' }} />
          </Whisper>
        )
    }
  ];

  return (
    <>
      <Panel
        bordered
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
        <MyTable
          data={currentChart.chartActions || []}
          columns={columns}
          height={500}
          loading={false}
        />
      </Panel>

      <Panel
        bordered
        header={
          <Stack justifyContent="space-between">
            <StackItem>
              <Translate>Current Visit Chart</Translate>
              {currentChart.key !== originalChart.key && (
                <small style={{ color: 'rgb(120,120,120)' }}>
                  Previewing History Chart ({currentChart.chartDate})
                </small>
              )}
              {selectedTooth?.key && (
                <span>
                  <small>(Selection: Tooth #{selectedTooth.toothNumber})</small>
                  <IconButton
                    title="Clear Selection"
                    appearance="link"
                    disabled={!selectedTooth || !selectedTooth.key}
                    onClick={() => {
                      setSelectedTooth({ ...newApDentalChartTooth });
                    }}
                    icon={<icons.BlockRound />}
                  />
                </span>
              )}
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
          zoom={0.35}
        />
      </Panel>
    </>
  );
};

export default ChartTab;
