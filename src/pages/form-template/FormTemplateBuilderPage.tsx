import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useState } from 'react';
import { Panel, Form as RsForm } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { useDispatch, useSelector } from 'react-redux';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';
import { useNavigate, useParams } from 'react-router-dom';

import { newFormTemplate } from '@/types/model-types-constructor-new';
import { FormTemplate } from '@/types/model-types-new';

import {
  useCreateFormTemplateMutation,
  useUpdateFormTemplateMutation,
  useLazyGetFormTemplateQuery
} from '@/services/setup/formTemplateService';

import { useGetDepartmentByFacilityQuery, useGetDepartmentsQuery, useLazyGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
import defaultV2Theme from "survey-core/themes";
import './styles.less';
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";

const FormTemplateBuilderPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const mode = useSelector((state: any) => state.ui.mode);

  const params = useParams();
  const templateId = params.id ? Number(params.id) : null;

  useEffect(() => {
    if (params.id && isNaN(Number(params.id))) {
      navigate('/error-403', { replace: true });
    }
  }, [params.id]);

  const [creator, setCreator] = useState<SurveyCreator | null>(null);
  const [template, setTemplate] = useState<FormTemplate>({ ...newFormTemplate });
  const [width, setWidth] = useState<number>(window.innerWidth);

  // APIs
  const [createTemplate, createMutation] = useCreateFormTemplateMutation();
  const [updateTemplate, updateMutation] = useUpdateFormTemplateMutation();
  const [loadTemplate] = useLazyGetFormTemplateQuery();

  // Header setup like your other pages
  useEffect(() => {
    const title = templateId ? <Translate>Edit Form Template</Translate> : <Translate>New Form Template</Translate>;
    dispatch(setPageCode('FormTemplateBuilder'));
    dispatch(setDivContent(title));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch, templateId]);

  useEffect(() => {
    document.documentElement.classList.add("surveyjs-mode");
    return () => document.documentElement.classList.remove("surveyjs-mode");
  }, []);

  // Resize
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const c = new SurveyCreator({
      showLogicTab: true,
      isAutoSave: false,
    });
     c.survey?.applyTheme(defaultV2Theme.DefaultLight); 
    setCreator(c);

    return () => setCreator(null);
  }, []);

  useEffect(() => {
    if (!creator) return;
    if (!templateId) {
      creator.JSON = {};
      return;
    }

    (async () => {
      const tpl = await loadTemplate(templateId).unwrap();
      setTemplate(tpl);

      try {
        creator.JSON = tpl?.formJson ? JSON.parse(tpl.formJson) : {};
      } catch (e) {
        console.error(e);
        creator.JSON = {};
      }
    })().catch(console.error);
  }, [creator, templateId, loadTemplate]);

  useEffect(() => {
    if (!creator) return;

    const onModified = () => {
      try {
        setTemplate(prev => ({
          ...prev,
          formJson: JSON.stringify(creator.JSON)
        }));
      } catch (e) {
        console.error(e);
      }
    };

    creator.onModified.add(onModified);
    onModified();

    return () => {
      creator.onModified.remove(onModified);
    };
  }, [creator]);


  const tenant = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('tenant') || 'null');
    } catch {
      return null;
    }
  }, []);

  const selectedFacility = tenant?.selectedFacility || null;
  const selectedFacilityId = selectedFacility?.id ?? selectedFacility?.facilityId ?? null;
  const selectedFacilityName = selectedFacility?.name ?? '';

  const { data: departmentListResponse, isFetching: deptFetching } =
    useGetDepartmentByFacilityQuery(
      { facilityId: selectedFacilityId, page: 0, size: 9999, sort: 'id,asc' },
      { skip: !selectedFacilityId }
    );
  useEffect(() => {
    if (selectedFacilityId && template?.facilityId !== selectedFacilityId) {
      setTemplate(prev => ({ ...prev, facilityId: selectedFacilityId }));
    }
  }, [selectedFacilityId]);


  useEffect(() => {
    if (!template?.departmentId) return;
    const dep = (departmentListResponse?.data ?? []).find((d: any) => d.id === template.departmentId);
    if (dep?.facilityId && dep.facilityId !== template.facilityId) {
      setTemplate(prev => ({ ...prev, facilityId: dep.facilityId }));
    }
  }, [template?.departmentId, departmentListResponse]);

  const validateRequiredFields = () => {
    const missing: string[] = [];
    if (!template?.name?.trim()) missing.push('Template Name');
    if (!template?.departmentId) missing.push('Department');
    if (!template?.facilityId) missing.push('Facility');
    if (!template?.formJson || template.formJson === '{}' || template.formJson === 'null') missing.push('Form Content');

    if (missing.length) {
      dispatch(
        notify({
          msg: `Please fix the following fields:\n${missing.map(x => `• ${x}: is required`).join('\n')}`,
          sev: 'error'
        })
      );
      return false;
    }
    return true;
  };

  const toNumberOrNull = (v: any) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const handleSave = () => {
    if (!validateRequiredFields()) return;

    const body = {
      name: template?.name?.trim(),
      description: template?.description ?? null,
      facilityId: toNumberOrNull(template?.facilityId),
      departmentId: toNumberOrNull(template?.departmentId),
      formJson:
        template?.formJson && template.formJson !== "null"
          ? template.formJson
          : JSON.stringify(creator?.JSON ?? {}),
    };

    if (!template?.id) {
      createTemplate(body as any)
        .unwrap()
        .then((created: any) => {
          dispatch(notify({ msg: "Template created successfully", sev: "success" }));
          navigate(`/form-template/${created.id}`);
        })
        .catch((e: any) => {
          console.error(e);
          dispatch(notify({ msg: "Failed to create template", sev: "error" }));
        });
    } else {
      updateTemplate({ id: Number(template.id), body: body as any })
        .unwrap()
        .then(() => dispatch(notify({ msg: "Template updated successfully", sev: "success" })))
        .catch((e: any) => {
          console.error(e);
          dispatch(notify({ msg: "Failed to update template", sev: "error" }));
        });
    }
  };

  // const handleSave = () => {
  //   // ... validation + body
  //   if (!template?.id) {
  //     createTemplate(template)
  //       .unwrap()
  //       .then((created: any) => {
  //         dispatch(notify({ msg: 'Template created successfully', sev: 'success' }));
  //         navigate(`../${created.id}`);
  //       })
  //       .catch(() => dispatch(notify({ msg: 'Failed to create template', sev: 'error' })));
  //   } else {
  //     updateTemplate({ id: template.id as number,body : template })
  //       .unwrap()
  //       .then(() => dispatch(notify({ msg: 'Template updated successfully', sev: 'success' })))
  //       .catch(() => dispatch(notify({ msg: 'Failed to update template', sev: 'error' })));
  //   }
  // };

  const saving = createMutation.isLoading || updateMutation.isLoading;

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  
  return (
    <Panel className={mode === 'dark' ? 'dashboard-dark' : ''} dir={dir}>

      <div style={styles.contentCard}>
        <RsForm>
          <div className={'form-template-grid'}>
            <MyInput
              width={width > 900 ? '18vw' : '100%'}
              fieldLabel={<Translate>Template Name</Translate>}
              fieldName="name"
              record={template}
              setRecord={setTemplate}
              required
            />


            <MyInput
              width={width > 900 ? '18vw' : '100%'}
              fieldLabel="Department"
              fieldName="departmentId"
              fieldType="select"
              selectData={departmentListResponse?.data ?? []}
              selectDataLabel="name"
              selectDataValue="id"
              record={template}
              setRecord={(updated: any) => {
                setTemplate(prev => ({ ...prev, departmentId: Number(updated.departmentId) }));
              }}
              required
              searchable
              menuMaxHeight={260}
              loading={deptFetching}
            />


            <MyInput
              width={width > 900 ? '18vw' : '100%'}
              fieldLabel="Description"
              fieldName="description"
              record={template}
              setRecord={setTemplate}
            />

            <MyButton appearance="ghost" onClick={() => navigate('/form-template')} width="90px">
              Back
            </MyButton>


            <MyButton
              color="var(--deep-blue)"
              onClick={handleSave}
              width="120px"
              disabled={saving}
            >
              {saving ? 'Saving...' : template?.id ? 'Save' : 'Create'}
            </MyButton>
          </div>




          <br />
          <DividerLine />
        </RsForm>

        {/* Builder */}
        {/* <div style={styles.builderWrap}>
          {!creator ? (
            <div style={{ padding: 12 }}>Loading builder…</div>
          ) : (
            <SurveyCreatorComponent creator={creator} />
          )}
        </div> */}
        <div className="surveyjs-scope" style={styles.builderWrap}>
          {!creator ? (
            <div style={{ padding: 12 }}>Loading builder…</div>
          ) : (
            <div className="survey-scope">
            <SurveyCreatorComponent creator={creator} />
              </div>
          )}
        </div>
      </div>
    </Panel>
  );
};

export default FormTemplateBuilderPage;

/** small divider component to match your style */
const DividerLine = () => (
  <div style={{ height: 1, background: '#eef3f9', margin: '12px 0' }} />
);

const styles: Record<string, React.CSSProperties> = {
  toolbarRow: {
    background: '#ffffff',
    border: '1px solid #e6edf5',
    borderRadius: 14,
    padding: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12
  },
  toolbarLeft: { display: 'flex', flexDirection: 'column' },
  pageTitle: { fontSize: 18, fontWeight: 800, color: '#1f2d3d' },
  breadcrumb: { fontSize: 12, color: '#7c8ea6', marginTop: 2 },

  contentCard: {
    background: '#ffffff',
    border: '1px solid #e6edf5',
    borderRadius: 14,
    padding: 12,
    minHeight: 'calc(100vh - 170px)'
  },
  builderWrap: {
    height: 'calc(100vh - 320px)', // more space for fields above
    minHeight: 520,
    border: '1px solid #eef3f9',
    borderRadius: 14,
    overflow: 'hidden'
  }
};
