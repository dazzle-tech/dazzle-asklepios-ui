import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Form, Loader, Message, Panel, Stack } from 'rsuite';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';
import { loadStimulsoftDesigner } from '@/reports/stimulsoft/loadStimulsoftDesigner';
import {
  DesignerSchema,
  getLocalDesignerSchema,
} from '@/reports/stimulsoft/reportDesignerSchema';
import {
  useCreateStimulsoftReportTemplateMutation,
  useLazyGetStimulsoftDesignerSchemaQuery,
  useLazyGetStimulsoftReportTemplateByIdQuery,
  useUpdateStimulsoftReportTemplateMutation,
} from '@/services/reports/stimulsoftReportService';

import type { StimulsoftDesignerHostHandle } from '@/reports/stimulsoft/StimulsoftDesignerHost';
import { normalizeStimulsoftTemplateJson } from '@/reports/stimulsoft/reportPrintParameters';

const StimulsoftDesignerHost = React.lazy(
  () =>
    import(
      /* webpackChunkName: "stimulsoft-designer-host" */
      '@/reports/stimulsoft/StimulsoftDesignerHost'
    )
);

const StimulsoftReportDesignerPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const params = useParams();
  const templateId = params.id ? Number(params.id) : null;
  const isNew = !templateId;

  const [meta, setMeta] = useState({
    name: '',
    code: '',
    description: '',
    facilityId: null as number | null,
    departmentIds: '' as string,
    module: '' as string | null,
  });
  const [templateJson, setTemplateJson] = useState<string | null>(null);
  const [schema, setSchema] = useState<DesignerSchema>(getLocalDesignerSchema());
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState(
    isNew ? 'Loading Stimulsoft designer…' : 'Loading Stimulsoft designer and template…'
  );
  const [error, setError] = useState<string | null>(null);
  const savedIdRef = useRef<number | null>(templateId);
  const designerRef = useRef<StimulsoftDesignerHostHandle | null>(null);
  const metaRef = useRef(meta);
  metaRef.current = meta;

  const [loadTemplate] = useLazyGetStimulsoftReportTemplateByIdQuery();
  const [loadSchema] = useLazyGetStimulsoftDesignerSchemaQuery();
  const [createTemplate] = useCreateStimulsoftReportTemplateMutation();
  const [updateTemplate] = useUpdateStimulsoftReportTemplateMutation();

  useEffect(() => {
    dispatch(setPageCode('STIMULSOFT_REPORT_DESIGNER'));
    dispatch(
      setDivContent(isNew ? 'New Report Template' : 'Edit Report Template')
    );
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch, isNew]);

  useEffect(() => {
    let cancelled = false;

    const prepare = async () => {
      try {
        setError(null);
        setReady(false);
        setPhase(
          templateId
            ? 'Loading Stimulsoft designer and template…'
            : 'Loading Stimulsoft designer…'
        );

        const designerLoad = loadStimulsoftDesigner();
        const templateLoad = templateId
          ? loadTemplate(templateId).unwrap()
          : Promise.resolve(null);
        const schemaLoad = templateId
          ? loadSchema(templateId)
              .unwrap()
              .catch(() => null)
          : Promise.resolve(null);

        const [, template, remoteSchema] = await Promise.all([
          designerLoad,
          templateLoad,
          schemaLoad,
        ]);

        const nextCode = template?.code ?? '';
        const nextSchema =
          remoteSchema || getLocalDesignerSchema(nextCode || undefined);

        if (cancelled) return;

        if (template) {
          savedIdRef.current = template.id ?? templateId;
          setMeta({
            name: template.name ?? '',
            code: nextCode,
            description: template.description ?? '',
            facilityId: template.facilityId ?? null,
            departmentIds: template.departmentIds ?? '',
            module: template.module ?? '',
          });
          setTemplateJson(
            normalizeStimulsoftTemplateJson(template) || null
          );
        }

        setSchema(nextSchema);
        setReady(true);
      } catch (err: any) {
        if (cancelled) return;
        const message =
          err?.message ||
          err?.data?.message ||
          'Failed to open the Stimulsoft designer.';
        setError(message);
        dispatch(notify({ msg: message, sev: 'error' }));
      }
    };

    prepare();
    return () => {
      cancelled = true;
    };
  }, [dispatch, loadSchema, loadTemplate, templateId]);

  const handleSave = useCallback(
    async (json: string) => {
      const current = metaRef.current;
      if (!current.name?.trim() || !current.code?.trim()) {
        dispatch(
          notify({
            msg: 'Please enter a template name and code before saving.',
            sev: 'warning',
          })
        );
        return;
      }

      try {
        setSaving(true);
        const body = {
          code: current.code.trim(),
          name: current.name.trim(),
          description: current.description,
          templateJson: json,
          isActive: true,
          facilityId: current.facilityId,
          departmentIds: current.departmentIds,
          module: current.module || null,
        };

        if (savedIdRef.current) {
          await updateTemplate({ id: savedIdRef.current, ...body }).unwrap();
        } else {
          const created = await createTemplate(body).unwrap();
          savedIdRef.current = created.id ?? null;
          if (created.id) {
            navigate(`/report-designer/${created.id}`, { replace: true });
          }
        }

        dispatch(
          notify({ msg: 'Report template saved successfully', sev: 'success' })
        );
      } catch (err: any) {
        dispatch(
          notify({
            msg:
              err?.data?.message ||
              err?.data?.detail ||
              err?.error?.data?.message ||
              err?.error?.data?.detail ||
              err?.message ||
              'Failed to save report template',
            sev: 'error',
          })
        );
      } finally {
        setSaving(false);
      }
    },
    [createTemplate, dispatch, navigate, updateTemplate]
  );

  const handleToolbarSave = useCallback(async () => {
    const json =
      designerRef.current?.getTemplateJson() ?? templateJson;
    if (!json) {
      dispatch(
        notify({
          msg: 'Please wait for the designer to finish loading, then save.',
          sev: 'warning',
        })
      );
      return;
    }
    await handleSave(json);
  }, [dispatch, handleSave, templateJson]);

  return (
    <div className="stimulsoft-designer-page" style={{ padding: 16 }}>
      <Panel bordered>
        <Stack spacing={12} alignItems="flex-end" wrap>
          <Button appearance="subtle" onClick={() => navigate('/report-designer')}>
            <Translate>Back</Translate>
          </Button>
          <Button
            appearance="primary"
            loading={saving}
            disabled={!ready || saving}
            onClick={handleToolbarSave}
          >
            <Translate>Save</Translate>
          </Button>
          <Form layout="inline">
            <MyInput
              fieldLabel="Name"
              fieldName="name"
              record={meta}
              setRecord={setMeta}
              width={220}
              required
            />
            <MyInput
              fieldLabel="Code"
              fieldName="code"
              record={meta}
              setRecord={setMeta}
              width={180}
              required
            />
            <MyInput
              fieldLabel="Description"
              fieldName="description"
              record={meta}
              setRecord={setMeta}
              width={280}
            />
          </Form>
        </Stack>

        {error && (
          <Message type="error" style={{ marginTop: 16 }} showIcon>
            {error}
          </Message>
        )}

        {!ready && !error && (
          <div style={{ padding: 48 }}>
            <Loader center content={phase} />
          </div>
        )}

        {ready && (
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
              onSave={handleSave}
            />
          </React.Suspense>
        )}
      </Panel>
    </div>
  );
};

export default StimulsoftReportDesignerPage;
