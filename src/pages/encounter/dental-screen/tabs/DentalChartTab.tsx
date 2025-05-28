import React, { useEffect, useMemo } from 'react';
import { Panel, Stack, ButtonToolbar, SelectPicker, IconButton } from 'rsuite';
import * as icons from '@rsuite/icons';
import Translate from '@/components/Translate';
import DentalChart from '@/components/NewDentalChart';
import ToothActionCard from '@/components/NewDentalChart/ToothActionCard/ToothActionCard';
import { newApDentalChartTooth } from '@/types/model-types-constructor';
import { useGetActionsQuery, useGetChartDataQuery } from '@/services/dentalService';
import { useGetCdtsQuery, useGetServicesQuery } from '@/services/setupService';
import { initialListRequest } from '@/types/types';
import { Box, Typography } from '@mui/material';
import './styles.less';
import ToothIcon from '@/images/svgs/ToothIcon';
import DentalRecordIcon from '@/images/svgs/DentalRecordIcon';

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
  isLoading
}) => {
  const dentalActionsRes = useGetActionsQuery({ ...initialListRequest, pageSize: 1000 });
  const dentalServicesRes = useGetServicesQuery({
    ...initialListRequest,
    filters: [{ fieldName: 'category_lkey', operator: 'match', value: '6418596687583232' }],
    pageSize: 1000
  });
  const cdtListRes = useGetCdtsQuery({
    ...initialListRequest,
    filters: [{ fieldName: 'type_lkey', operator: 'match', value: '277273303968200' }],
    pageSize: 1000
  });
  const prevChartRes = useGetChartDataQuery(selectedPreviousChartKey, {
    skip: !selectedPreviousChartKey
  });

  const dentalActionsMap = useMemo(() => {
    if (dentalActionsRes.isSuccess) {
      return dentalActionsRes.data.object.reduce((acc, item) => {
        acc[item.key] = item;
        return acc;
      }, {});
    }
    return {};
  }, [dentalActionsRes.data]);

  const dentalServicesMap = useMemo(() => {
    if (dentalServicesRes.isSuccess) {
      return dentalServicesRes.data.object.reduce((acc, item) => {
        acc[item.key] = item;
        return acc;
      }, {});
    }
    return {};
  }, [dentalServicesRes.data]);

  const cdtMap = useMemo(() => {
    if (cdtListRes.isSuccess) {
      return cdtListRes.data.object.reduce((acc, item) => {
        acc[item.key] = item;
        return acc;
      }, {});
    }
    return {};
  }, [cdtListRes.data]);

  useEffect(() => {
    if (prevChartRes.isSuccess && prevChartRes.data.object) {
      setCurrentChart(prevChartRes.data.object);
    }
  }, [prevChartRes]);

  const isPreviewingHistory = currentChart.key !== originalChart.key;

  return (
    <Box className="dental-chart-tab-container">
      <Panel
        bordered
        className="dental-visit-chart"
        header={
          <Box>
            <Stack justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Translate>Current Visit Chart</Translate>
                {isPreviewingHistory && (
                  <small style={{ color: 'rgb(120,120,120)' }}>
                    Previewing History Chart ({currentChart.chartDate})
                  </small>
                )}
              </Box>

              <ButtonToolbar>
                <SelectPicker
                  placeholder="Previous Charts"
                  data={previousCharts}
                  labelKey="chartDate"
                  valueKey="key"
                  value={selectedPreviousChartKey}
                  style={{ width: 200 }}
                  onChange={val =>
                    val ? setSelectedPreviousChartKey(val) : cancelPreviousChartView()
                  }
                  onClean={cancelPreviousChartView}
                />
              </ButtonToolbar>
            </Stack>

            {selectedTooth?.key && (
              <Box className="selected-tooth-cleaner">
                <small>
                  (Selected Tooth <strong>#{selectedTooth?.toothNumber}</strong>)
                </small>
                <IconButton
                  title="Clear Selection"
                  appearance="link"
                  icon={<icons.BlockRound />}
                  onClick={() => setSelectedTooth({ ...newApDentalChartTooth })}
                />
              </Box>
            )}
          </Box>
        }
      >
        {isLoading ? (
          <Box className="loading-dental-chart">
            <ToothIcon />
            <Typography>Loading Chart...</Typography>
          </Box>
        ) : (
          <DentalChart
            disabled={isPreviewingHistory}
            chartObject={currentChart}
            setChartObject={setCurrentChart}
            selectedTooth={selectedTooth}
            setSelectedTooth={setSelectedTooth}
            dentalActionsList={dentalActionsRes.data?.object ?? []}
            dentalActionsMap={dentalActionsMap}
            dentalServicesList={dentalServicesRes.data?.object ?? []}
            dentalServicesMap={dentalServicesMap}
            cdtList={cdtListRes.data?.object ?? []}
            cdtMap={cdtMap}
            treatmentPlanTrigger={treatmentPlanTrigger}
            setTreatmentPlanTrigger={setTreatmentPlanTrigger}
            cdtLoading={cdtListRes.isLoading}
            servicesLoading={dentalServicesRes.isLoading}
          />
        )}
      </Panel>

      <Panel
        bordered
        className="dental-actions-table"
        header={
          <Box>
            <Translate>Current Chart Actions</Translate>
            {isPreviewingHistory && (
              <small style={{ color: 'rgb(120,120,120)' }}>
                Previewing History Chart ({currentChart.chartDate})
              </small>
            )}
          </Box>
        }
      >
        {isLoading ? (
          <Box className="loading-dental-chart">
            <DentalRecordIcon />
            <Typography>Loading Actions...</Typography>
          </Box>
        ) : currentChart?.chartActions?.length ? (
          currentChart.chartActions.map(tooth => (
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
          ))
        ) : (
          <Box className="empty-actions-status">
            <Typography className="empty-actions-label">No actions</Typography>
          </Box>
        )}
      </Panel>
    </Box>
  );
};

export default ChartTab;
