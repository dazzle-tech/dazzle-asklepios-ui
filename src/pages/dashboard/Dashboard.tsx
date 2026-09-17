import Translate from '@/components/Translate';
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Panel, SelectPicker, Loader, Message } from 'rsuite';
import { Link } from 'react-router-dom';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useSelector } from 'react-redux';
import {
  StimulsoftReportTemplate,
  useGetViewableStimulsoftDashboardsQuery,
  useLazyGetStimulsoftReportTemplateByIdQuery,
} from '@/services/reports/stimulsoftReportService';
import { normalizeStimulsoftTemplateJson } from '@/reports/stimulsoft/reportPrintParameters';
import './styles.less';

const StimulsoftViewerHost = React.lazy(
  () =>
    import(
      /* webpackChunkName: "stimulsoft-viewer-host" */
      '@/reports/stimulsoft/StimulsoftViewerHost'
    )
);

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const mode = useSelector((state: any) => state.ui.mode);
  const authSlice = useAppSelector(state => state.auth);
  const selectedDepartment = authSlice?.selectedDepartment;
  const departmentId =
    selectedDepartment?.departmentId ?? selectedDepartment?.id ?? null;
  const facilityId = selectedDepartment?.facilityId ?? null;

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [templateJson, setTemplateJson] = useState<string | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: dashboards = [], isFetching } =
    useGetViewableStimulsoftDashboardsQuery(
      { facilityId, departmentId },
      { refetchOnMountOrArgChange: true }
    );
  const [loadTemplate] = useLazyGetStimulsoftReportTemplateByIdQuery();

  const activeDashboards = useMemo(
    () => dashboards.filter(item => item.isActive !== false && item.id),
    [dashboards]
  );

  useEffect(() => {
    dispatch(setPageCode('Dashboard'));
    dispatch(setDivContent('Dashboard'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    if (!activeDashboards.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !activeDashboards.some(item => item.id === selectedId)) {
      setSelectedId(activeDashboards[0].id ?? null);
    }
  }, [activeDashboards, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setTemplateJson(null);
      setError(null);
      setLoadingTemplate(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoadingTemplate(true);
      setError(null);
      try {
        const template = await loadTemplate(selectedId, false).unwrap();
        if (cancelled) return;
        const json = normalizeStimulsoftTemplateJson(template);
        if (!json) {
          setTemplateJson(null);
          setError('This dashboard has no template to display.');
          return;
        }
        setTemplateJson(json);
      } catch (err: any) {
        if (cancelled) return;
        setTemplateJson(null);
        setError(
          err?.data?.message ||
            err?.message ||
            'Failed to load the Stimulsoft dashboard.'
        );
      } finally {
        if (!cancelled) setLoadingTemplate(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [loadTemplate, selectedId]);

  const selectedDashboard: StimulsoftReportTemplate | undefined =
    activeDashboards.find(item => item.id === selectedId);
  const viewerParams = useMemo(() => {
    const next: Record<string, string> = {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    if (facilityId) next.facilityId = String(facilityId);
    if (departmentId) next.departmentId = String(departmentId);
    return next;
  }, [departmentId, facilityId]);

  return (
    <Panel className={mode === 'dark' ? 'dashboard-dark' : ''}>
      <div className="stimulsoft-dashboard-toolbar">
        <SelectPicker
          data={activeDashboards.map(item => ({
            label: item.name || item.code,
            value: item.id,
          }))}
          value={selectedId}
          onChange={value => setSelectedId(value ? Number(value) : null)}
          placeholder="Select dashboard"
          searchable
          cleanable={false}
          disabled={!activeDashboards.length}
          style={{ minWidth: 280 }}
        />
      </div>

      {isFetching || loadingTemplate ? (
        <div style={{ padding: 48 }}>
          <Loader center content="Loading dashboard…" />
        </div>
      ) : error ? (
        <Message type="error" showIcon>
          {error}
        </Message>
      ) : !activeDashboards.length ? (
        <Message type="info" showIcon>
          <Translate>
            No Stimulsoft dashboards are available yet. Create one in Dashboard
            Designer.
          </Translate>{' '}
          <Link to="/dashboard-designer">Dashboard Designer</Link>
        </Message>
      ) : templateJson ? (
        <React.Suspense
          fallback={
            <div style={{ padding: 48 }}>
              <Loader center content="Opening dashboard…" />
            </div>
          }
        >
          <StimulsoftViewerHost
            sessionKey={`${selectedId}-${departmentId}-${facilityId}-${templateJson.length}-${mode}`}
            templateJson={templateJson}
            params={viewerParams}
            uiMode={mode === 'dark' ? 'dark' : 'light'}
            height="calc(100vh - 220px)"
            onError={setError}
          />
        </React.Suspense>
      ) : (
        <Message type="warning" showIcon>
          {selectedDashboard?.name || 'This dashboard'} has no template to
          display.
        </Message>
      )}
    </Panel>
  );
};

export default Dashboard;
