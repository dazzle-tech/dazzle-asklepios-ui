import Translate from '@/components/Translate';
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Panel, SelectPicker, Loader, Message, Form } from 'rsuite';
import { Link } from 'react-router-dom';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useSelector } from 'react-redux';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { notify } from '@/utils/uiReducerActions';
import {
  StimulsoftReportTemplate,
  useGetViewableStimulsoftDashboardsQuery,
  useLazyGetStimulsoftReportTemplateByIdQuery,
  useSetStimulsoftDashboardDefaultMutation,
} from '@/services/reports/stimulsoftReportService';
import {
  extractReportPrintParameters,
  normalizeStimulsoftTemplateJson,
  valuesFromParameters,
} from '@/reports/stimulsoft/reportPrintParameters';
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
  const viewerUserId = authSlice?.user?.id ?? null;
  const viewerJobRole = authSlice?.user?.jobRole ?? null;

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [templateJson, setTemplateJson] = useState<string | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftParams, setDraftParams] = useState<Record<string, any>>({});
  const [appliedParams, setAppliedParams] = useState<Record<string, string>>(
    {}
  );

  const { data: dashboards = [], isFetching } =
    useGetViewableStimulsoftDashboardsQuery(
      {
        facilityId,
        departmentId,
        jobRole: viewerJobRole,
        userId: viewerUserId,
      },
      { refetchOnMountOrArgChange: true }
    );
  const [loadTemplate] = useLazyGetStimulsoftReportTemplateByIdQuery();
  const [setDashboardDefault, { isLoading: savingDefault }] =
    useSetStimulsoftDashboardDefaultMutation();

  const activeDashboards = useMemo(
    () => dashboards.filter(item => item.isActive !== false && item.id),
    [dashboards]
  );
  const viewContextKey = `${facilityId ?? ''}|${departmentId ?? ''}|${viewerJobRole ?? ''}|${viewerUserId ?? ''}`;
  const viewContextRef = useRef(viewContextKey);

  useEffect(() => {
    dispatch(setPageCode('Dashboard'));
    dispatch(setDivContent('Dashboard'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    const contextChanged = viewContextRef.current !== viewContextKey;
    viewContextRef.current = viewContextKey;

    if (!activeDashboards.length) {
      setSelectedId(null);
      return;
    }

    setSelectedId(current => {
      if (
        !contextChanged &&
        current &&
        activeDashboards.some(item => item.id === current)
      ) {
        return current;
      }
      const preferred = activeDashboards.find(item => item.isUserDefault);
      return preferred?.id ?? activeDashboards[0].id ?? null;
    });
  }, [activeDashboards, viewContextKey]);

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

  const dashboardParameters = useMemo(() => {
    const extracted = extractReportPrintParameters(templateJson).filter(
      param => param.type !== 'department'
    );
    const hasDateRange = extracted.some(param =>
      /^(startDate|fromDate)$/i.test(param.name)
    );
    const filtered = hasDateRange
      ? extracted.filter(param => !/^date$/i.test(param.name))
      : extracted;
    const rank = (name: string) => {
      if (/^(startDate|fromDate)$/i.test(name)) return 0;
      if (/^(endDate|toDate)$/i.test(name)) return 1;
      return 2;
    };
    return [...filtered].sort((a, b) => rank(a.name) - rank(b.name));
  }, [templateJson]);

  useEffect(() => {
    const defaults = valuesFromParameters(dashboardParameters);
    setDraftParams(defaults);
    setAppliedParams(defaults);
  }, [dashboardParameters]);

  const selectedDashboard: StimulsoftReportTemplate | undefined =
    activeDashboards.find(item => item.id === selectedId);
  const viewerParams = useMemo(() => {
    const next: Record<string, string> = {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...appliedParams,
    };
    if (facilityId) next.facilityId = String(facilityId);
    if (departmentId) next.departmentId = String(departmentId);
    return next;
  }, [appliedParams, departmentId, facilityId]);
  const appliedParamsKey = useMemo(
    () =>
      dashboardParameters
        .map(param => `${param.name}:${appliedParams[param.name] || ''}`)
        .join('|'),
    [appliedParams, dashboardParameters]
  );

  const handleResetParams = () => {
    const defaults = valuesFromParameters(dashboardParameters);
    setDraftParams(defaults);
    setAppliedParams(defaults);
  };

  const handleSubmitParams = () => {
    const next: Record<string, string> = {};
    dashboardParameters.forEach(param => {
      const value = draftParams[param.name];
      next[param.name] = value == null ? '' : String(value);
    });
    setAppliedParams(next);
  };

  const handleSetDefault = async () => {
    if (!selectedId || viewerUserId == null || selectedDashboard?.isUserDefault) {
      return;
    }
    try {
      await setDashboardDefault({
        userId: Number(viewerUserId),
        templateId: selectedId,
      }).unwrap();
      dispatch(
        notify({ msg: 'Default dashboard saved', sev: 'success' })
      );
    } catch (err: any) {
      dispatch(
        notify({
          msg:
            err?.data?.message ||
            err?.data?.detail ||
            err?.message ||
            'Failed to save the default dashboard',
          sev: 'error',
        })
      );
    }
  };

  const dashboardOptions = activeDashboards.map(item => ({
    label: item.name || item.code,
    value: item.id,
    isUserDefault: item.isUserDefault === true,
  }));

  return (
    <Panel
      className={`stimulsoft-dashboard-page${mode === 'dark' ? ' dashboard-dark' : ''}`}
    >
      <div className="stimulsoft-dashboard-toolbar">
        <SelectPicker
          data={dashboardOptions}
          value={selectedId}
          onChange={value => setSelectedId(value ? Number(value) : null)}
          placeholder="Select dashboard"
          searchable
          cleanable={false}
          disabled={!activeDashboards.length}
          style={{ minWidth: 280 }}
          renderMenuItem={(label, item) => (
            <span className="stimulsoft-dashboard-option">
              <span>{label}</span>
              {item.isUserDefault ? (
                <span className="stimulsoft-dashboard-default-tag">Default</span>
              ) : null}
            </span>
          )}
          renderValue={(_value, item, selectedElement) =>
            item?.isUserDefault ? (
              <span className="stimulsoft-dashboard-option">
                <span>{item.label}</span>
                <span className="stimulsoft-dashboard-default-tag">Default</span>
              </span>
            ) : (
              selectedElement
            )
          }
        />
        <MyButton
          appearance="ghost"
          onClick={handleSetDefault}
          loading={savingDefault}
          disabled={
            savingDefault ||
            !selectedId ||
            viewerUserId == null ||
            selectedDashboard?.isUserDefault === true
          }
        >
          Set as my default
        </MyButton>
      </div>

      {dashboardParameters.length > 0 && templateJson ? (
        <Form
          className="stimulsoft-dashboard-params"
          layout="inline"
          onSubmit={event => {
            event.preventDefault();
            handleSubmitParams();
          }}
        >
          {dashboardParameters.map(param =>
            param.type === 'date' ? (
              <MyInput
                key={param.name}
                fieldType="date"
                fieldName={param.name}
                fieldLabel={param.label}
                record={draftParams}
                setRecord={setDraftParams}
                width={220}
              />
            ) : (
              <MyInput
                key={param.name}
                fieldType="text"
                fieldName={param.name}
                fieldLabel={param.label}
                record={draftParams}
                setRecord={setDraftParams}
                width={220}
              />
            )
          )}
          <div className="stimulsoft-dashboard-params-actions">
            <MyButton appearance="ghost" onClick={handleResetParams}>
              Reset
            </MyButton>
            <MyButton appearance="primary" onClick={handleSubmitParams}>
              Submit
            </MyButton>
          </div>
        </Form>
      ) : null}

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
          <div className="stimulsoft-dashboard-viewer-scroll">
            <StimulsoftViewerHost
              sessionKey={`${selectedId}-${departmentId}-${facilityId}-${templateJson.length}-${mode}-${appliedParamsKey}`}
              templateJson={templateJson}
              params={viewerParams}
              uiMode={mode === 'dark' ? 'dark' : 'light'}
              hideDashboardParameterControls={dashboardParameters.length > 0}
              height="100%"
              onError={setError}
            />
          </div>
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
