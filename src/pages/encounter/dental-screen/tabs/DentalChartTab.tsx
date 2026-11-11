import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { Panel, SelectPicker } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTooth,
  faClockRotateLeft,
  faXmark,
  faSpinner,
  faCircleInfo
} from '@fortawesome/free-solid-svg-icons';

import Translate from '@/components/Translate';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import DentalChart from '@/components/NewDentalChart';

import { newApDentalChartTooth } from '@/types/model-types-constructor';
import { toothDisplayLabel } from '@/utils/toothNumber';

import { useGetChartByIdQuery } from '@/services/dental/dentalChartService';
import { useGetAllDentalActionsQuery } from '@/services/setup/dental-action/dentalActionService';
import { useGetAllCdtQuery } from '@/services/setup/cdtCodeService';
import { useGetServicesByCategoryQuery } from '@/services/setup/serviceService';

import './ChartTab.less';

const EMPTY_VALUE = '—';

const SURFACE_LABELS: Record<string, string> = {
  MESIAL: 'Mesial',
  DISTAL: 'Distal',
  BUCCAL: 'Buccal',
  LINGUAL: 'Lingual',
  OCCLUSAL: 'Occlusal',
  INCISAL: 'Incisal',
  PALATAL: 'Palatal',
  LABIAL: 'Labial',
  FACIAL: 'Facial'
};

type ChartViewportProps = {
  children: React.ReactNode;
  layoutKey: string;
};

/**
 * Fits the complete chart into the available width.
 * The transformed height is reserved so the next section stays below it.
 */
const ChartViewport = ({
  children,
  layoutKey
}: ChartViewportProps) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [size, setSize] = useState({
    scale: 1,
    height: 0,
    width: 0
  });

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;

    if (!viewport || !content) return;

    let frame = 0;
    let disposed = false;

    const measure = () => {
      if (disposed) return;

      const availableWidth = viewport.clientWidth;
      const naturalWidth = Math.max(
        content.scrollWidth,
        content.offsetWidth
      );
      const naturalHeight = Math.max(
        content.scrollHeight,
        content.offsetHeight
      );

      if (!availableWidth || !naturalWidth || !naturalHeight) return;

      const scale = Math.min(1, availableWidth / naturalWidth);

      const next = {
        scale,
        height: Math.ceil(naturalHeight * scale),
        width: Math.ceil(naturalWidth * scale)
      };

      setSize(previous =>
        previous.scale === next.scale &&
        previous.height === next.height &&
        previous.width === next.width
          ? previous
          : next
      );
    };

    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    const observer = new ResizeObserver(scheduleMeasure);

    observer.observe(viewport);
    observer.observe(content);

    content.addEventListener('load', scheduleMeasure, true);
    window.addEventListener('resize', scheduleMeasure);

    document.fonts?.ready.then(() => {
      if (!disposed) scheduleMeasure();
    });

    scheduleMeasure();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      content.removeEventListener('load', scheduleMeasure, true);
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, [layoutKey]);

  return (
    <div
      ref={viewportRef}
      className="dct-chart-viewport"
      style={{ height: size.height || undefined }}
    >
      <div
        className="dct-chart-position"
        style={{
          width: size.width || undefined,
          height: size.height || undefined
        }}
      >
        <div
          ref={contentRef}
          className="dct-chart-content"
          style={{
            transform: `scale(${size.scale})`
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

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
  isLoading,
  patient,
  encounter
}) => {
  const dentalActionsRes = useGetAllDentalActionsQuery({
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });

  const { data: serviceList, isLoading: servicesLoading } =
    useGetServicesByCategoryQuery({
      page: 0,
      size: 1000,
      category: 'DENTAL'
    });

  const cdtListRes = useGetAllCdtQuery({
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });

  const prevChartRes = useGetChartByIdQuery(
    selectedPreviousChartId,
    { skip: !selectedPreviousChartId }
  );

  const dentalActionsMap = useMemo(
    () =>
      (dentalActionsRes.data?.data ?? []).reduce(
        (map: Record<number, any>, item: any) => {
          map[item.id] = item;
          return map;
        },
        {}
      ),
    [dentalActionsRes.data]
  );

  const dentalServicesMap = useMemo(
    () =>
      (serviceList?.data ?? []).reduce(
        (map: Record<number, any>, item: any) => {
          map[item.id] = item;
          return map;
        },
        {}
      ),
    [serviceList]
  );

  const cdtMap = useMemo(
    () =>
      (cdtListRes.data?.data ?? []).reduce(
        (map: Record<number, any>, item: any) => {
          map[item.id] = item;
          return map;
        },
        {}
      ),
    [cdtListRes.data]
  );

  useEffect(() => {
    if (
      selectedPreviousChartId &&
      prevChartRes.currentData &&
      String(prevChartRes.currentData.id) ===
        String(selectedPreviousChartId)
    ) {
      setCurrentChart(prevChartRes.currentData);
    }
  }, [
    selectedPreviousChartId,
    prevChartRes.currentData,
    setCurrentChart
  ]);

  const isPreviewingHistory =
    currentChart?.id != null &&
    originalChart?.id != null &&
    String(currentChart.id) !== String(originalChart.id);

  const historyLoading =
    Boolean(selectedPreviousChartId) && prevChartRes.isFetching;

  const chartLoading = isLoading || historyLoading;

  const chartActions = useMemo(
    () => currentChart?.chartActions ?? [],
    [currentChart?.chartActions]
  );

  const teethById = useMemo(
    () =>
      (currentChart?.teeth ?? []).reduce(
        (map: Record<number, any>, tooth: any) => {
          if (tooth.id != null) map[tooth.id] = tooth;
          return map;
        },
        {}
      ),
    [currentChart?.teeth]
  );

  const clearToothSelection = () =>
    setSelectedTooth({ ...newApDentalChartTooth });

  const returnToCurrentChart = () => {
    clearToothSelection();
    cancelPreviousChartView();
  };

  const numberingSystem = currentChart?.numberingSystem || 'UNIVERSAL';

  const selectedToothLabel = selectedTooth?.toothNumber
    ? toothDisplayLabel(selectedTooth.toothNumber, numberingSystem)
    : EMPTY_VALUE;

  const actionColumns = useMemo(
    () => [
      {
        key: 'toothNumber',
        title: <Translate>Tooth Number</Translate>,
        width: 125,
        render: (row: any) => {
          const number =
            row.toothNumber ||
            teethById[row.toothId]?.toothNumber;

          return (
            <span className="dct-tooth-number">
              {number ? toothDisplayLabel(number, numberingSystem) : EMPTY_VALUE}
            </span>
          );
        }
      },
      {
        key: 'action',
        title: <Translate>Action</Translate>,
        width: 250,
        render: (row: any) => (
          <span className="dct-action-name">
            {dentalActionsMap[row.dentalActionId]?.description ||
              EMPTY_VALUE}
          </span>
        )
      },
      {
        key: 'type',
        title: <Translate>Type</Translate>,
        width: 125,
        render: (row: any) => {
          const type = dentalActionsMap[row.dentalActionId]?.type;

          if (!type) return EMPTY_VALUE;

          const treatment = type === 'TREATMENT';

          return (
            <span
              className={`dct-type ${
                treatment
                  ? 'dct-type--treatment'
                  : 'dct-type--condition'
              }`}
            >
              <Translate>
                {treatment ? 'Treatment' : 'Condition'}
              </Translate>
            </span>
          );
        }
      },
      {
        key: 'surface',
        title: <Translate>Surface</Translate>,
        width: 115,
        render: (row: any) =>
          SURFACE_LABELS[row.surface] || row.surface || EMPTY_VALUE
      },
      {
        key: 'existing',
        title: <Translate>Existing</Translate>,
        width: 100,
        render: (row: any) => (
          <Translate>{row.existing ? 'Yes' : 'No'}</Translate>
        )
      },
      {
        key: 'anesthesiaUsed',
        title: <Translate>Anesthesia Used</Translate>,
        width: 170,
        render: (row: any) =>
          row.anesthesiaUsed || EMPTY_VALUE
      },
      {
        key: 'dose',
        title: <Translate>Dose</Translate>,
        width: 85,
        render: (row: any) => row.dose ?? EMPTY_VALUE
      },
      {
        key: 'note',
        title: <Translate>Notes</Translate>,
        width: 260,
        render: (row: any) => (
          <span className="dct-action-note">
            {row.note || EMPTY_VALUE}
          </span>
        )
      }
    ],
    [dentalActionsMap, teethById, numberingSystem]
  );

  const direction =
    (localStorage.getItem('direction') || 'LTR').toUpperCase() === 'RTL'
      ? 'rtl'
      : 'ltr';

  return (
    <div className="dct-page" dir={direction}>
      <Panel bordered className="dct-chart-panel">
        <div className="dct-panel-header">
          <div className="dct-heading">
            <h4>
              <FontAwesomeIcon icon={faTooth} />
              <Translate>
                {isPreviewingHistory
                  ? 'Previous Visit Chart'
                  : 'Current Visit Chart'}
              </Translate>
            </h4>

            <p>
              <Translate>
                {isPreviewingHistory
                  ? 'Previous chart shown for reference.'
                  : 'Select a tooth to view or record a chart action.'}
              </Translate>
            </p>
          </div>

          <div className="dct-chart-controls">
            <SelectPicker
              placeholder="Previous Charts"
              aria-label="Previous Charts"
              data={previousCharts ?? []}
              labelKey="chartDate"
              valueKey="id"
              value={selectedPreviousChartId}
              loading={historyLoading}
              disabled={isLoading}
              className="dct-history-picker"
              onChange={value => {
                clearToothSelection();

                if (value != null) {
                  setSelectedPreviousChartId(value);
                } else {
                  cancelPreviousChartView();
                }
              }}
            />

            {(isPreviewingHistory || selectedPreviousChartId != null) && (
              <MyButton
                appearance="ghost"
                prefixIcon={() => (
                  <FontAwesomeIcon icon={faClockRotateLeft} />
                )}
                onClick={returnToCurrentChart}
              >
                <Translate>Current Chart</Translate>
              </MyButton>
            )}
          </div>
        </div>

        <div className="dct-chart-toolbar">
          <div className="dct-chart-context">
            {isPreviewingHistory ? (
              <span className="dct-history-label">
                <FontAwesomeIcon icon={faClockRotateLeft} />
                <Translate>History Chart</Translate>
                {currentChart?.chartDate && (
                  <span>{currentChart.chartDate}</span>
                )}
              </span>
            ) : (
              <span className="dct-current-label">
                <Translate>Current Visit</Translate>
              </span>
            )}
          </div>

          {selectedTooth?.id ? (
            <div className="dct-selected-tooth">
              <span>
                <Translate>Selected Tooth</Translate>
                {' '}
                <strong>#{selectedToothLabel}</strong>
              </span>

              <MyButton
                appearance="link"
                prefixIcon={() => (
                  <FontAwesomeIcon icon={faXmark} />
                )}
                onClick={clearToothSelection}
              >
                <Translate>Clear</Translate>
              </MyButton>
            </div>
          ) : (
            <span className="dct-selection-hint">
              <Translate>No tooth selected</Translate>
            </span>
          )}
        </div>

        {selectedPreviousChartId != null && prevChartRes.isError && (
          <div className="dct-error" role="alert">
            <FontAwesomeIcon icon={faCircleInfo} />

            <span>
              <Translate>Could not load the previous chart.</Translate>
            </span>

            <MyButton
              appearance="link"
              onClick={() => prevChartRes.refetch()}
            >
              <Translate>Retry</Translate>
            </MyButton>
          </div>
        )}

        <div className="dct-chart-body">
          {chartLoading ? (
            <div className="dct-loading" role="status">
              <FontAwesomeIcon icon={faSpinner} spin />
              <Translate>Loading Chart...</Translate>
            </div>
          ) : currentChart ? (
            <ChartViewport
              layoutKey={`${currentChart.id ?? 'chart'}-${
                currentChart.teeth?.length ?? 0
              }`}
            >
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
                patientId={patient?.id}
                encounterId={encounter?.id}
                cdtLoading={cdtListRes.isLoading}
                servicesLoading={servicesLoading}
              />
            </ChartViewport>
          ) : (
            <div className="dct-empty">
              <FontAwesomeIcon icon={faTooth} />
              <Translate>No dental chart available.</Translate>
            </div>
          )}
        </div>
      </Panel>

      <Panel bordered className="dct-actions-panel">
        <div className="dct-panel-header">
          <div className="dct-heading">
            <div className="dct-title-row">
              <h4>
                <Translate>
                  {isPreviewingHistory
                    ? 'Previous Chart Actions'
                    : 'Current Chart Actions'}
                </Translate>
              </h4>

              <span className="dct-count">
                {chartActions.length}
              </span>
            </div>

            <p>
              <Translate>
                Treatments and conditions recorded on the displayed chart.
              </Translate>
            </p>
          </div>

          {isPreviewingHistory && (
            <span className="dct-readonly-label">
              <Translate>View Only</Translate>
            </span>
          )}
        </div>

        <div className="dct-actions-table">
          <MyTable
            data={chartActions}
            columns={actionColumns}
            loading={chartLoading || dentalActionsRes.isLoading}
            height={Math.min(
              420,
              Math.max(180, chartActions.length * 75 + 70)
            )}
          />
        </div>
      </Panel>
    </div>
  );
};

export default ChartTab;