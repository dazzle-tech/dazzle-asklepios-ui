import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetDiagnosticTestTemplateByTestIdQuery } from '@/services/setup/report-template/DiagnosticTestTemplate';
import { useGetActiveReportTemplatesQuery } from '@/services/setup/report-template/reportTemplateService';
import { notify } from '@/utils/uiReducerActions';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ContentState, convertToRaw, EditorState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import React, { useEffect, useState } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { Col, Form, Row } from 'rsuite';

import {
  useCreateClaimEncounterCopyDiagnosticOrderTestReportMutation,
  useUpdateClaimEncounterCopyDiagnosticOrderTestReportMutation
} from '@/services/billing/claimEncounterCopyDiagnosticOrderTestReportService';

import {
  ClaimEncounterCopyDiagnosticOrderTestReport,
  ClaimEncounterCopyDiagnosticOrderTestReportCreateDTO,
  ClaimEncounterCopyDiagnosticOrderTestReportUpdateDTO
} from '@/types/model-types-new';

interface AddClaimEncounterCopyDiagnosticOrderTestReportProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  claimEncounterCopyId: number;
  orderTestId: number;
  testId?: number;
  testName?: string;
  initialData?: ClaimEncounterCopyDiagnosticOrderTestReport | null;
}

const isEmptyHtml = (html?: string) => {
  if (!html) return true;
  const cleaned = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, '')
    .trim();
  return cleaned.length === 0;
};

const AddClaimEncounterCopyDiagnosticOrderTestReport = ({
  open,
  setOpen,
  claimEncounterCopyId,
  orderTestId,
  testId,
  testName,
  initialData
}: AddClaimEncounterCopyDiagnosticOrderTestReportProps) => {
  const dispatch = useAppDispatch();

  const [userTouchedEditor, setUserTouchedEditor] = useState(false);
  const [defaultApplied, setDefaultApplied] = useState(false);

  const [report, setReport] = useState<any>({
    severity: null,
    radiologistInformation: null,
    criticalFindings: null,
    radiologistComments: null
  });

  const [createReport] =
    useCreateClaimEncounterCopyDiagnosticOrderTestReportMutation();

  const [updateReport] =
    useUpdateClaimEncounterCopyDiagnosticOrderTestReportMutation();

  const severityOptions = useEnumOptions('Severity');

  const { data: readyTemplatesResponse } = useGetActiveReportTemplatesQuery({
    page: 0,
    size: 9999,
    sort: 'name,asc'
  });

  const { data: defaultTemplate } = useGetDiagnosticTestTemplateByTestIdQuery(
    testId!,
    { skip: !testId }
  );

  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  const templateOptions =
    readyTemplatesResponse?.data?.map((t: any) => ({
      label: t.name,
      value: t.id,
      full: t
    })) ?? [];

  useEffect(() => {
    if (initialData) {
      setReport({
        severity: initialData.severity ?? null,
        radiologistInformation: initialData.radiologistInformation ?? null,
        criticalFindings: initialData.criticalFindings ?? null,
        radiologistComments: initialData.radiologistComments ?? null
      });
    } else {
      setReport({
        severity: null,
        radiologistInformation: null,
        criticalFindings: null,
        radiologistComments: null
      });
    }
  }, [initialData, open]);

  useEffect(() => {
    if (!open) return;

    setEditorState(EditorState.createEmpty());
    setUserTouchedEditor(false);
    setDefaultApplied(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (userTouchedEditor) return;

    if (!isEmptyHtml(initialData?.report)) {
      const blocks = htmlToDraft(initialData!.report as string);
      const contentState = ContentState.createFromBlockArray(
        blocks.contentBlocks,
        blocks.entityMap
      );
      setEditorState(EditorState.createWithContent(contentState));
      setDefaultApplied(true);
      return;
    }

    if (
      !defaultApplied &&
      !isEmptyHtml(defaultTemplate?.templateValue)
    ) {
      const blocks = htmlToDraft(defaultTemplate!.templateValue);
      const contentState = ContentState.createFromBlockArray(
        blocks.contentBlocks,
        blocks.entityMap
      );
      setEditorState(EditorState.createWithContent(contentState));
      setDefaultApplied(true);
    }
  }, [
    open,
    initialData,
    defaultTemplate?.templateValue,
    userTouchedEditor,
    defaultApplied
  ]);

  const handleEditorChange = (state: EditorState) => {
    setUserTouchedEditor(true);
    setEditorState(state);
  };

  const handleChooseTemplate = (templateId: number) => {
    const selected = templateOptions.find(t => t.value === templateId);
    if (!selected) return;

    const html = selected.full.templateValue || '<p></p>';
    const blocks = htmlToDraft(html);
    const content = ContentState.createFromBlockArray(
      blocks.contentBlocks,
      blocks.entityMap
    );

    setUserTouchedEditor(true);
    setEditorState(EditorState.createWithContent(content));
  };

  const handleSave = async () => {
    const htmlContent = draftToHtml(convertToRaw(editorState.getCurrentContent()));

    const hasContent =
      !isEmptyHtml(htmlContent) ||
      report.radiologistInformation?.trim() ||
      report.criticalFindings?.trim() ||
      report.radiologistComments?.trim();

    if (!hasContent) {
      dispatch(
        notify({ msg: 'Report content is required', sev: 'warning' })
      );
      return;
    }

    try {
      if (initialData?.id) {
        const payload: ClaimEncounterCopyDiagnosticOrderTestReportUpdateDTO = {
          report: htmlContent,
          radiologistInformation: report.radiologistInformation,
          criticalFindings: report.criticalFindings,
          radiologistComments: report.radiologistComments,
          severity: report.severity
        };

        await updateReport({ id: initialData.id, data: payload }).unwrap();

        dispatch(
          notify({ msg: 'Report updated successfully', sev: 'success' })
        );
      } else {
        const payload: ClaimEncounterCopyDiagnosticOrderTestReportCreateDTO = {
          orderTestId,
          report: htmlContent,
          radiologistInformation: report.radiologistInformation,
          criticalFindings: report.criticalFindings,
          radiologistComments: report.radiologistComments,
          severity: report.severity
        };

        await createReport({ claimEncounterCopyId, data: payload }).unwrap();

        dispatch(
          notify({ msg: 'Report added successfully', sev: 'success' })
        );
      }

      setOpen(false);
    } catch (error: any) {
      const data = error?.data ?? {};
      const message =
        data?.detail ||
        data?.message ||
        data?.title ||
        error?.error ||
        'Unexpected error';

      dispatch(notify({ msg: message, sev: 'warning' }));
    }
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <MyModal
        title={testName || 'Radiology Report'}
        open={open}
        setOpen={setOpen}
        steps={[
          { title: 'Report', icon: <FontAwesomeIcon icon={faFileLines} /> }
        ]}
        actionButtonFunction={handleSave}
        size="40vw"
        bodyheight="65vh"
        content={
          <div dir={dir}>
            <Row>
              <Col md={24}>
                <Form fluid>
                  <MyInput
                    width="12vw"
                    fieldName="severity"
                    fieldLabel="Severity"
                    fieldType="select"
                    selectData={severityOptions ?? []}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={report}
                    setRecord={setReport}
                  />
                </Form>
              </Col>
            </Row>

            <Row>
              <Col md={24}>
                <Form fluid>
                  <MyInput
                    fieldName="selectReadyTemplate"
                    fieldLabel="Choose Ready Template"
                    fieldType="select"
                    selectData={templateOptions}
                    selectDataLabel="label"
                    selectDataValue="value"
                    width="12vw"
                    record={{ selectReadyTemplate: null }}
                    setRecord={rec => handleChooseTemplate(rec.selectReadyTemplate)}
                  />
                  <MyInput
                    width="100%"
                    fieldName="radiologistInformation"
                    fieldLabel="Radiologist Information"
                    fieldType="text"
                    record={report}
                    setRecord={setReport}
                    disabled={true}
                  />
                </Form>
              </Col>
            </Row>

            <Row>
              <Col md={24}>
                <Editor
                  editorState={editorState}
                  onEditorStateChange={handleEditorChange}
                  placeholder="Write your report here..."
                  editorStyle={{
                    minHeight: '60vh',
                    overflow: 'auto',
                    width: '100%',
                    border: '1px solid var(--rs-border-primary)',
                    padding: '8px'
                  }}
                />
              </Col>
            </Row>

            <Row>
              <Col md={24}>
                <Form fluid>
                  <MyInput
                    width="100%"
                    fieldName="criticalFindings"
                    fieldLabel="Critical Findings"
                    fieldType="textarea"
                    record={report}
                    setRecord={setReport}
                  />
                </Form>
              </Col>
            </Row>

            <Row>
              <Col md={24}>
                <Form fluid>
                  <MyInput
                    width="100%"
                    fieldName="radiologistComments"
                    fieldLabel="Radiologist Comments"
                    fieldType="textarea"
                    record={report}
                    setRecord={setReport}
                  />
                </Form>
              </Col>
            </Row>
          </div>
        }
      />
    </div>
  );
};

export default AddClaimEncounterCopyDiagnosticOrderTestReport;
