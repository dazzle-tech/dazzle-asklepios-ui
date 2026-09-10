import React, {
  useCallback,
  useEffect,
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
  serializeDepartmentIds,
  useCreateStimulsoftReportTemplateMutation,
  useLazyGetStimulsoftDesignerSchemaQuery,
  useLazyGetStimulsoftReportTemplateByIdQuery,
  useUpdateStimulsoftReportTemplateMutation,
} from '@/services/reports/stimulsoftReportService';
import type { StimulsoftDesignerHostHandle } from '@/reports/stimulsoft/StimulsoftDesignerHost';
import { normalizeStimulsoftTemplateJson } from '@/reports/stimulsoft/reportPrintParameters';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
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
};

const STEPS = [
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
];

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
});

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  initialData?: StimulsoftReportTemplate | null;
  onSaved?: () => void;
};

const DesignStep = ({
  code,
  templateJson,
  designerRef,
}: {
  code: string;
  templateJson?: string | null;
  designerRef: React.MutableRefObject<StimulsoftDesignerHostHandle | null>;
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
}: Props) => {
  const dispatch = useDispatch();
  const designerRef = useRef<StimulsoftDesignerHostHandle | null>(null);
  const [details, setDetails] = useState<Details>({ ...EMPTY_DETAILS });
  const [templateJson, setTemplateJson] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [designerEnabled, setDesignerEnabled] = useState(false);
  const [templateReady, setTemplateReady] = useState(false);
  const [saving, setSaving] = useState(false);

  const [loadTemplate] = useLazyGetStimulsoftReportTemplateByIdQuery();
  const [createTemplate] = useCreateStimulsoftReportTemplateMutation();
  const [updateTemplate] = useUpdateStimulsoftReportTemplateMutation();
  const moduleOptions = useEnumOptions('Modules');
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
      setDesignerEnabled(false);
      setTemplateReady(false);
      setSaving(false);
      return;
    }

    setDetails(mapTemplateToDetails(initialData));
    setSavedId(initialData?.id ?? null);
    setTemplateJson(normalizeStimulsoftTemplateJson(initialData) || null);
    setDesignerEnabled(false);

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
    if (!details.module) {
      dispatch(notify({ msg: 'Please select a module.', sev: 'warning' }));
      return false;
    }
    return true;
  }, [details.code, details.module, details.name, dispatch]);

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
      setDesignerEnabled(true);
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
        module: details.module || null,
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
      details.module,
      details.name,
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
        notify({ msg: 'Report template saved successfully', sev: 'success' })
      );
      onSaved?.();
      setOpen(false);
    } catch (err: any) {
      dispatch(
        notify({
          msg: err?.data?.message || 'Failed to save report template',
          sev: 'error',
        })
      );
      throw err;
    } finally {
      setSaving(false);
    }
  }, [dispatch, onSaved, persist, setOpen, templateJson]);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={
        isEdit ? (
          <Translate>Edit Report Template</Translate>
        ) : (
          <Translate>New Report Template</Translate>
        )
      }
      size="full"
      bodyheight="calc(100vh - 240px)"
      enforceFocus={false}
      steps={STEPS}
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
                <Col xs={24} md={12}>
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
          {designerEnabled && (
            <div
              className="stimulsoft-report-design-step"
              hidden={stepNumber !== 1}
            >
              <DesignStep
                key={savedId ?? 'new'}
                code={details.code.trim()}
                templateJson={templateJson}
                designerRef={designerRef}
              />
            </div>
          )}
        </>
      )}
    />
  );
};

export default StimulsoftReportTemplateModal;
