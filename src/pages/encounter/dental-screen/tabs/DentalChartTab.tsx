import React, { useEffect, useMemo, useState } from 'react';
import { Panel, Stack, ButtonToolbar, SelectPicker, IconButton } from 'rsuite';
import * as icons from '@rsuite/icons';
import Translate from '@/components/Translate';
import DentalChart from '@/components/NewDentalChart';
import ToothActionCard from '@/components/NewDentalChart/ToothActionCard/ToothActionCard';
import { newApDentalChartTooth } from '@/types/model-types-constructor';
import { useGetChartByIdQuery } from '@/services/dental/dentalChartService';
import { useGetAllDentalActionsQuery } from '@/services/setup/dental-action/dentalActionService';
import { useGetAllCdtQuery } from '@/services/setup/cdtCodeService';
import { Box, Typography } from '@mui/material';
import './styles.less';
import ToothIcon from '@/images/svgs/ToothIcon';
import DentalRecordIcon from '@/images/svgs/DentalRecordIcon';

import { useGetServicesByCategoryQuery } from '@/services/setup/serviceService';

const ChartTab = ({
  currentChart,
  setCurrentChart,
  originalChart,
  previousCharts,
  selectedPreviousChartId,
  setSelectedPreviousChartId,
  selectedTooth,
  setSelectedTooth,
  cancelPreviousChartView,
  treatmentPlanTrigger,
  setTreatmentPlanTrigger,
  isLoading
}) => {
  const dentalActionsRes = useGetAllDentalActionsQuery({ page: 0, size: 1000, sort: 'id,asc' });

  const { data: serviceList, isLoading: servicesLoading } = useGetServicesByCategoryQuery({
    page: 0,
    size: 1000,
    category: 'DENTAL'
  });

  const cdtListRes = useGetAllCdtQuery({ page: 0, size: 1000, sort: 'id,asc' });

  const prevChartRes = useGetChartByIdQuery(selectedPreviousChartId, {
    skip: !selectedPreviousChartId
  });

  const dentalActionsMap = useMemo(() => {
    if (dentalActionsRes.isSuccess) {
      return (dentalActionsRes.data?.data ?? []).reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});
    }
    return {};
  }, [dentalActionsRes.data]);

  const dentalServicesMap = useMemo(() => {
    return (serviceList?.data ?? []).reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [serviceList]);

  const cdtMap = useMemo(() => {
    if (cdtListRes.isSuccess) {
      return (cdtListRes.data?.data ?? []).reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});
    }
    return {};
  }, [cdtListRes.data]);

  useEffect(() => {
    if (prevChartRes.isSuccess && prevChartRes.data) {
      setCurrentChart(prevChartRes.data);
    }
  }, [prevChartRes]);

  const isPreviewingHistory = currentChart?.id !== originalChart?.id;

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
                  valueKey="id"
                  value={selectedPreviousChartId}
                  style={{ width: 200 }}
                  onChange={val =>
                    val ? setSelectedPreviousChartId(val) : cancelPreviousChartView()
                  }
                  onClean={cancelPreviousChartView}
                />
              </ButtonToolbar>
            </Stack>

            {selectedTooth?.id && (
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
            dentalActionsList={dentalActionsRes.data?.data ?? []}
            dentalActionsMap={dentalActionsMap}
            dentalServicesList={serviceList?.data ?? []}
            dentalServicesMap={dentalServicesMap}
            cdtList={cdtListRes.data?.data ?? []}
            cdtMap={cdtMap}
            treatmentPlanTrigger={treatmentPlanTrigger}
            setTreatmentPlanTrigger={setTreatmentPlanTrigger}
            cdtLoading={cdtListRes.isLoading}
            servicesLoading={servicesLoading}
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
              key={tooth.id}
              date={Date.now()}
              toothNumber={tooth.toothNumber}
              action={dentalActionsMap[tooth.dentalActionId]?.description || '-'}
              type={
                dentalActionsMap[tooth.dentalActionId]?.type === 'TREATMENT'
                  ? 'Treatment'
                  : 'Condition'
              }
              surface={tooth.surface ?? '-'}
              note={tooth.note}
              existing={tooth.existing}
              anesthesiaUsed={tooth.anesthesiaUsed}
              dose={tooth.dose}
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
