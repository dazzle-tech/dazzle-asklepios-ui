import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Form, Loader, Message, Row, Col } from 'rsuite';
import { useDispatch } from 'react-redux';

import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { notify } from '@/utils/uiReducerActions';
import { loadStimulsoftDesigner } from '@/reports/stimulsoft/loadStimulsoftDesigner';
import {
  DesignerSchema,
  getLocalDesignerSchema,
} from '@/reports/stimulsoft/reportDesignerSchema';
import {
  StimulsoftReportTemplate,
  parseDepartmentIds,
  parseUserIds,
  serializeDepartmentIds,
  serializeUserIds,
  useCreateStimulsoftReportTemplateMutation,
  useLazyGetStimulsoftDesignerSchemaQuery,
  useLazyGetStimulsoftReportTemplateByIdQuery,
  useUpdateStimulsoftReportTemplateMutation,
} from '@/services/reports/stimulsoftReportService';
import type { StimulsoftDesignerHostHandle } from '@/reports/stimulsoft/StimulsoftDesignerHost';
import { normalizeStimulsoftTemplateJson } from '@/reports/stimulsoft/reportPrintParameters';
import {
  StimulsoftDesignerMode,
  templateTypeFromMode,
} from '@/reports/stimulsoft/stimulsoftDesignerMode';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
import { useGetUsersBasicQuery } from '@/services/userService';
import './styles.less';

const StimulsoftDesignerHost = React.lazy(
  () =>
    import(
      /* webpackChunkName: "stimulsoft-designer-host" */
      '@/reports/stimulsoft/StimulsoftDesignerHost'
    )
);

const EMPTY_DETAILS = {
  name: '',
  code: '',
  description: '',
  facilityId: null as number | null,
  departmentIds: [] as number[],
  module: '',
  jobRole: null as string | null,
  userIds: [] as number[],
};

const STEPS_BY_MODE: Record<
  StimulsoftDesignerMode,
  { title: string; description: string; icon: number }[]
> = {
  report: [
    {
      title: 'Details',
      description: 'Report name, facility and module',
      icon: 1,
    },
    {
      title: 'Design',
      description: 'Layout the report template',
      icon: 2,
    },
  ],
  dashboard: [
    {
      title: 'Details',
      description: 'Dashboard name, facility and audience',
      icon: 1,
    },
    {
      title: 'Design',
      description: 'Layout the dashboard template',
      icon: 2,
    },
  ],
};

type Details = typeof EMPTY_DETAILS;

const toFacilityId = (template?: StimulsoftReportTemplate | null): number | null => {
  const numeric = Number(template?.facilityId);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const mapTemplateToDetails = (template?: StimulsoftReportTemplate | null): Details => ({
  name: template?.name ?? '',
  code: template?.code ?? '',
  description: template?.description ?? '',
  facilityId: toFacilityId(template),
  departmentIds: parseDepartmentIds(template?.departmentIds),
  module: template?.module ?? '',
  jobRole: template?.jobRole ? String(template.jobRole) : null,
  userIds: parseUserIds(template?.userIds),
});

const MountWhenVisible = ({
  visible,
  reset,
  className,
  children,
}: {
  visible: boolean;
  reset?: boolean;
  className?: string;
  children: React.ReactNode;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (reset) {
      setMounted(false);
      return;
    }
    if (visible) setMounted(true);
  }, [reset, visible]);

  if (!mounted) return null;

  return (
    <div className={className} hidden={!visible}>
      {children}
    </div>
  );
};

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  initialData?: StimulsoftReportTemplate | null;
  onSaved?: () => void;
  mode?: StimulsoftDesignerMode;
};

const DesignStep = ({
  code,
  templateJson,
  designerRef,
  mode,
}: {
  code: string;
  templateJson?: string | null;
  designerRef: React.MutableRefObject<StimulsoftDesignerHostHandle | null>;
  mode: StimulsoftDesignerMode;
}) => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<DesignerSchema>(
    getLocalDesignerSchema(code)
  );
  const [loadSchema] = useLazyGetStimulsoftDesignerSchemaQuery();

  useEffect(() => {
    let cancelled = false;

    const prepare = async () => {
      try {
        setError(null);
        setReady(false);
        await loadStimulsoftDesigner();
        let nextSchema = getLocalDesignerSchema(code || undefined);
        try {
          if (code) {
            nextSchema = await loadSchema(code).unwrap();
          }
        } catch {
          nextSchema = getLocalDesignerSchema(code || undefined);
        }
        if (cancelled) return;
        setSchema(nextSchema);
        setReady(true);
      } catch (err: any) {
        if (cancelled) return;
        setError(
          err?.message ||
            err?.data?.message ||
            'Failed to load the Stimulsoft designer.'
        );
      }
    };

    prepare();
    return () => {
      cancelled = true;
    };
  }, [code, loadSchema]);

  if (error) {
    return (
      <Message type="error" showIcon>
        {error}
      </Message>
    );
  }

  if (!ready) {
    return (
      <div style={{ padding: 48 }}>
        <Loader center content="Loading Stimulsoft designer…" />
      </div>
    );
  }

  return (
    <React.Suspense
      fallback={
        <div style={{ padding: 48 }}>
          <Loader center content="Opening designer…" />
        </div>
      }
    >
      <StimulsoftDesignerHost
        ref={designerRef}
        templateJson={templateJson}
        schema={schema}
        mode={mode}
        height="calc(100vh - 320px)"
      />
    </React.Suspense>
  );
};

const StimulsoftReportTemplateModal = ({
  open,
  setOpen,
  initialData,
  onSaved,
  mode = 'report',
}: Props) => {
  const dispatch = useDispatch();
  const designerRef = useRef<StimulsoftDesignerHostHandle | null>(null);
  const [details, setDetails] = useState<Details>({ ...EMPTY_DETAILS });
  const [templateJson, setTemplateJson] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [templateReady, setTemplateReady] = useState(false);
  const [saving, setSaving] = useState(false);

  const [loadTemplate] = useLazyGetStimulsoftReportTemplateByIdQuery();
  const [createTemplate] = useCreateStimulsoftReportTemplateMutation();
  const [updateTemplate] = useUpdateStimulsoftReportTemplateMutation();
  const moduleOptions = useEnumOptions('Modules');
  const jobRoles = useEnumOptions('JobRole');
  const selectedJobRole =
    mode === 'dashboard' ? String(details.jobRole || '').trim() : '';
  const { data: usersResponse, isFetching: usersLoading } =
    useGetUsersBasicQuery(
      {
        page: 0,
        size: 500,
        sort: 'id,asc',
        jobRole: selectedJobRole,
      },
      { skip: !selectedJobRole }
    );
  const userOptions = useMemo(() => {
    const payload = usersResponse?.data;
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.content)
        ? payload.content
        : Array.isArray(payload?.data)
          ? payload.data
          : [];
    const role = selectedJobRole.toUpperCase();
    const options = rows
      .filter((user: { jobRole?: string | null }) => {
        const userRole = String(user?.jobRole ?? '').trim().toUpperCase();
        return !userRole || userRole === role;
      })
      .map((user: { id?: number; firstName?: string; lastName?: string; login?: string }) => {
        const id = Number(user?.id);
        if (!Number.isFinite(id) || id <= 0) return null;
        const name = [user?.firstName, user?.lastName]
          .filter(Boolean)
          .join(' ')
          .trim();
        return {
          id,
          label: name || user?.login || `User ${id}`,
        };
      })
      .filter((option): option is { id: number; label: string } =>
        Boolean(option)
      );

    const known = new Set(options.map(option => option.id));
    details.userIds.forEach(id => {
      if (!known.has(id)) {
        options.push({ id, label: `User ${id}` });
      }
    });
    return options;
  }, [details.userIds, selectedJobRole, usersResponse]);
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});
  const facilities = Array.isArray(facilityListResponse)
    ? facilityListResponse
    : (facilityListResponse as any)?.data ??
      (facilityListResponse as any)?.content ??
      [];
  const selectedFacilityId = Number(details.facilityId) || 0;
  const { data: departmentsResponse, isFetching: departmentsLoading } =
    useGetActiveDepartmentByFacilityListQuery(
      { facilityId: selectedFacilityId },
      { skip: !selectedFacilityId }
    );
  const departments = Array.isArray(departmentsResponse)
    ? departmentsResponse
    : [];

  const isEdit = Boolean(initialData?.id);

  useEffect(() => {
    if (!open) {
      setDetails({ ...EMPTY_DETAILS });
      setTemplateJson(null);
      setSavedId(null);
      setTemplateReady(false);
      setSaving(false);
      return;
    }

    setDetails(mapTemplateToDetails(initialData));
    setSavedId(initialData?.id ?? null);
    setTemplateJson(normalizeStimulsoftTemplateJson(initialData) || null);

    if (!initialData?.id) {
      setTemplateReady(true);
      return;
    }

    setTemplateReady(false);
    loadTemplate(initialData.id, false)
      .unwrap()
      .then(template => {
        setTemplateJson(normalizeStimulsoftTemplateJson(template) || null);
        setDetails(mapTemplateToDetails(template));
        setSavedId(template.id ?? initialData.id ?? null);
      })
      .catch(() => undefined)
      .finally(() => setTemplateReady(true));
  }, [open, initialData, loadTemplate]);

  const validateDetails = useCallback(() => {
    if (!details.name?.trim()) {
      dispatch(notify({ msg: 'Please enter a template name.', sev: 'warning' }));
      return false;
    }
    if (!details.code?.trim()) {
      dispatch(notify({ msg: 'Please enter a template code.', sev: 'warning' }));
      return false;
    }
    if (mode !== 'dashboard' && !details.module) {
      dispatch(notify({ msg: 'Please select a module.', sev: 'warning' }));
      return false;
    }
    return true;
  }, [details.code, details.module, details.name, dispatch, mode]);

  const handleBeforeNext = useCallback(
    async (activeStep: number) => {
      if (activeStep !== 0) return true;
      if (!validateDetails()) return false;
      if (savedId && !templateReady) {
        dispatch(
          notify({
            msg: 'Please wait for the saved template to finish loading.',
            sev: 'warning',
          })
        );
        return false;
      }
      return true;
    },
    [dispatch, savedId, templateReady, validateDetails]
  );

  const persist = useCallback(
    async (json: string | null) => {
      if (!validateDetails()) return false;
      const body = {
        code: details.code.trim(),
        name: details.name.trim(),
        description: details.description,
        templateJson: json ?? templateJson ?? '',
        isActive: true,
        facilityId: selectedFacilityId || null,
        departmentIds: selectedFacilityId
          ? serializeDepartmentIds(details.departmentIds)
          : '',
        module: mode === 'dashboard' ? null : details.module || null,
        templateType: templateTypeFromMode(mode),
        ...(mode === 'dashboard'
          ? {
              jobRole: details.jobRole || null,
              userIds: details.jobRole
                ? serializeUserIds(details.userIds)
                : '',
            }
          : {}),
      };

      if (savedId) {
        await updateTemplate({ id: savedId, ...body }).unwrap();
      } else {
        const created = await createTemplate(body).unwrap();
        setSavedId(created.id ?? null);
      }
      return true;
    },
    [
      createTemplate,
      details.code,
      details.description,
      details.departmentIds,
      details.facilityId,
      details.jobRole,
      details.module,
      details.name,
      details.userIds,
      mode,
      savedId,
      selectedFacilityId,
      templateJson,
      updateTemplate,
      validateDetails,
    ]
  );

  const handleSave = useCallback(async () => {
    const json = designerRef.current?.getTemplateJson() ?? templateJson;
    if (!json) {
      dispatch(
        notify({
          msg: 'Please wait for the designer to finish loading, then save.',
          sev: 'warning',
        })
      );
      throw new Error('Designer not ready');
    }

    try {
      setSaving(true);
      await persist(json);
      dispatch(
        notify({
          msg:
            mode === 'dashboard'
              ? 'Dashboard template saved successfully'
              : 'Report template saved successfully',
          sev: 'success',
        })
      );
      onSaved?.();
      setOpen(false);
    } catch (err: any) {
      dispatch(
        notify({
          msg:
            err?.data?.message ||
            (mode === 'dashboard'
              ? 'Failed to save dashboard template'
              : 'Failed to save report template'),
          sev: 'error',
        })
      );
      throw err;
    } finally {
      setSaving(false);
    }
  }, [dispatch, mode, onSaved, persist, setOpen, templateJson]);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={
        isEdit ? (
          <Translate>
            {mode === 'dashboard'
              ? 'Edit Dashboard Template'
              : 'Edit Report Template'}
          </Translate>
        ) : (
          <Translate>
            {mode === 'dashboard'
              ? 'New Dashboard Template'
              : 'New Report Template'}
          </Translate>
        )
      }
      size="full"
      bodyheight="calc(100vh - 240px)"
      enforceFocus={false}
      steps={STEPS_BY_MODE[mode]}
      onBeforeNext={handleBeforeNext}
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      actionButtonLoading={saving}
      cancelButtonLabel="Cancel"
      customClassName="stimulsoft-report-template-modal"
      content={(stepNumber: number) => (
        <>
          <div
            className="stimulsoft-report-details-step"
            hidden={stepNumber !== 0}
          >
            <Form fluid>
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <MyInput
                    column
                    width="100%"
                    fieldLabel="Name"
                    fieldName="name"
                    record={details}
                    setRecord={setDetails}
                    required
                  />
                </Col>
                <Col xs={24} md={12}>
                  <MyInput
                    column
                    width="100%"
                    fieldLabel="Code"
                    fieldName="code"
                    record={details}
                    setRecord={setDetails}
                    required
                  />
                </Col>
              </Row>
              <Row gutter={24}>
                <Col xs={24} md={mode === 'dashboard' ? 24 : 12}>
                  <MyInput
                    column
                    width="100%"
                    fieldType="select"
                    fieldLabel="Facility"
                    fieldName="facilityId"
                    selectData={facilities}
                    selectDataLabel="name"
                    selectDataValue="id"
                    record={details}
                    setRecord={next => {
                      const nextFacilityId = Number(next.facilityId) || null;
                      const facilityChanged =
                        nextFacilityId !== (Number(details.facilityId) || null);
                      setDetails(
                        facilityChanged
                          ? { ...next, facilityId: nextFacilityId, departmentIds: [] }
                          : { ...next, facilityId: nextFacilityId }
                      );
                    }}
                    searchable
                  />
                </Col>
                {mode !== 'dashboard' && (
                  <Col xs={24} md={12}>
                    <MyInput
                      column
                      width="100%"
                      fieldType="select"
                      fieldLabel="Module"
                      fieldName="module"
                      selectData={moduleOptions}
                      selectDataLabel="label"
                      selectDataValue="value"
                      record={details}
                      setRecord={setDetails}
                      required
                      searchable
                    />
                  </Col>
                )}
              </Row>
              {!!selectedFacilityId && (
                <Row gutter={24}>
                  <Col xs={24}>
                    <MyInput
                      column
                      width="100%"
                      fieldType="checkPicker"
                      fieldLabel="Departments"
                      fieldName="departmentIds"
                      selectData={departments}
                      selectDataLabel="name"
                      selectDataValue="id"
                      placeholder="Select department(s)"
                      loading={departmentsLoading}
                      searchable
                      record={details}
                      setRecord={setDetails}
                    />
                  </Col>
                </Row>
              )}
              {mode === 'dashboard' && (
                <>
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <MyInput
                        column
                        width="100%"
                        fieldType="select"
                        fieldLabel="Job Role"
                        fieldName="jobRole"
                        selectData={jobRoles ?? []}
                        selectDataLabel="label"
                        selectDataValue="value"
                        record={{
                          ...details,
                          jobRole: details.jobRole || null,
                        }}
                        setRecord={next => {
                          const nextRole = next.jobRole
                            ? String(next.jobRole)
                            : null;
                          const roleChanged = nextRole !== (details.jobRole || null);
                          setDetails({
                            ...next,
                            jobRole: nextRole,
                            userIds: roleChanged ? [] : next.userIds ?? [],
                          });
                        }}
                        searchable
                        cleanable
                        isEnum
                        placeholder="Select"
                      />
                    </Col>
                  </Row>
                  {!!selectedJobRole && (
                    <Row gutter={24}>
                      <Col xs={24}>
                        <MyInput
                          column
                          width="100%"
                          fieldType="checkPicker"
                          fieldLabel="Users"
                          fieldName="userIds"
                          selectData={userOptions}
                          selectDataLabel="label"
                          selectDataValue="id"
                          placeholder="All users with this role"
                          loading={usersLoading}
                          searchable
                          record={details}
                          setRecord={setDetails}
                        />
                      </Col>
                    </Row>
                  )}
                </>
              )}
              <Row gutter={24}>
                <Col xs={24}>
                  <MyInput
                    column
                    width="100%"
                    fieldType="textarea"
                    fieldLabel="Description"
                    fieldName="description"
                    record={details}
                    setRecord={setDetails}
                  />
                </Col>
              </Row>
            </Form>
          </div>
          <MountWhenVisible
            className="stimulsoft-report-design-step"
            visible={stepNumber === 1}
            reset={!open}
          >
            <DesignStep
              key={savedId ?? 'new'}
              code={details.code.trim()}
              templateJson={templateJson}
              designerRef={designerRef}
              mode={mode}
            />
          </MountWhenVisible>
        </>
      )}
    />
  );
};

export default StimulsoftReportTemplateModal;
