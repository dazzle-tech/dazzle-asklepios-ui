import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useUpdateRadiologyReportMutation
} from '@/services/setup/diagnosticTest/diagnosticOrderTestReportService';
import { useGetDiagnosticTestTemplateByTestIdQuery } from '@/services/setup/report-template/DiagnosticTestTemplate';
import { useGetActiveReportTemplatesQuery } from '@/services/setup/report-template/reportTemplateService';
import { notify } from '@/utils/uiReducerActions';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  ContentState,
  convertToRaw,
  EditorState
} from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import React, { useEffect, useState } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { Col, Form, Row } from 'rsuite';

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;

  report: any;
  setReport: (r: any) => void;

  orderTest?: any;
  order?: any;

  resultFetch?: () => void;
  attachmentRefetch?: () => void;

  disableEdit?: boolean;
  disableDefaultTemplate?: boolean;
};






const isEmptyHtml = (html?: string) => {
  if (!html) return true;
  const cleaned = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, '')
    .trim();
  return cleaned.length === 0;
};


const AddReportModal = ({
  open,
  setOpen,
  report,
  setReport,
  orderTest,
  order,
  resultFetch,
  disableEdit,
  disableDefaultTemplate = false
}: Props) => {


  const dispatch = useAppDispatch();
  const [userTouchedEditor, setUserTouchedEditor] = useState(false);

  const [defaultApplied, setDefaultApplied] = useState(false);

  const [updateReport] = useUpdateRadiologyReportMutation();

  const severityOptions = useEnumOptions('Severity');

  const { data: readyTemplatesResponse } =
    useGetActiveReportTemplatesQuery({
      page: 0,
      size: 9999,
      sort: 'name,asc'
    });

  const diagnosticTestId = orderTest?.testId;
  const encounterId = order?.encounterId;


  const { data: defaultTemplate } =
    useGetDiagnosticTestTemplateByTestIdQuery(
      diagnosticTestId!,
      { skip: !diagnosticTestId }
    );

  const [editorState, setEditorState] =
    useState(EditorState.createEmpty());

  const templateOptions =
    readyTemplatesResponse?.data?.map((t) => ({
      label: t.name,
      value: t.id,
      full: t
    })) ?? [];


  const handleSave = async () => {
    if (!report?.id) {
      dispatch(
        notify({
          msg: 'Report does not exist to edit',
          sev: 'warning'
        })
      );
      return;
    }

    const htmlContent = draftToHtml(
      convertToRaw(editorState.getCurrentContent())
    );

    try {
      await updateReport({
        reportId: report.id,
        body: {
          report: htmlContent,
          severity: report.severity,
          radiologistInformation: report.radiologistInformation,
          criticalFindings: report.criticalFindings,
          radiologistComments: report.radiologistComments
        }
      }).unwrap();


      dispatch(
        notify({ msg: 'Report updated successfully', sev: 'success' })
      );

      resultFetch?.();
      setOpen(false);
    } catch {
      dispatch(
        notify({ msg: 'Failed to update report', sev: 'error' })
      );
    }
  };



  const handleEditorChange = (state: EditorState) => {
    setUserTouchedEditor(true);
    setEditorState(state);
  };



  const handleChooseTemplate = (templateId: number) => {
    const selected = templateOptions.find(
      (t) => t.value === templateId
    );
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


  const isDisabled =
    disableEdit ||
    !report?.id ||
    report?.processingStatus === 'RESULT_APPROVED';

  const safeReportHtml =
    typeof report?.report === 'string'
      ? report.report
      : '';

  const safeDefaultTemplateHtml =
    typeof defaultTemplate?.templateValue === 'string'
      ? defaultTemplate.templateValue
      : '';



  useEffect(() => {
    if (!open) return;

    setEditorState(EditorState.createEmpty());
    setUserTouchedEditor(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (userTouchedEditor) return;
    if (!isEmptyHtml(report?.report)) {
      const blocks = htmlToDraft(report.report);
      const contentState = ContentState.createFromBlockArray(
        blocks.contentBlocks,
        blocks.entityMap
      );
      setEditorState(EditorState.createWithContent(contentState));
      setDefaultApplied(true);
      return;
    }
    if (disableDefaultTemplate) {
      setEditorState(EditorState.createEmpty());
      setDefaultApplied(true);
      return;
    }
    if (
      !defaultApplied &&
      !isEmptyHtml(defaultTemplate?.templateValue)
    ) {
      const blocks = htmlToDraft(defaultTemplate.templateValue);
      const contentState = ContentState.createFromBlockArray(
        blocks.contentBlocks,
        blocks.entityMap
      );
      setEditorState(EditorState.createWithContent(contentState));
      setDefaultApplied(true);
    }
  }, [
    open,
    report?.report,
    defaultTemplate?.templateValue,
    userTouchedEditor,
    disableDefaultTemplate,
    defaultApplied
  ]);

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
      <MyModal
        title="Add Report"
        open={open}
        setOpen={setOpen}
        steps={[
          { title: 'Report', icon: <FontAwesomeIcon icon={faFileLines} /> }
        ]}
        actionButtonFunction={isDisabled ? () => { } : handleSave}
        isDisabledActionBtn={isDisabled}
        size="40vw"
        bodyheight="65vh"
        content={
          <div dir={dir}>
              <Row>
                <Col md={24}>
                  <Form fluid>
                    <MyInput
                      width="12vw"
                      disabled={isDisabled}
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
                    {!isDisabled && (<MyInput
                      fieldName="selectReadyTemplate"
                      fieldLabel="Choose Ready Template"
                      fieldType="select"
                      selectData={templateOptions}
                      selectDataLabel="label"
                      selectDataValue="value"
                      width="12vw"
                      record={{ selectReadyTemplate: null }}
                      setRecord={(rec) =>
                        handleChooseTemplate(rec.selectReadyTemplate)
                      }
                    />)}
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

            {/* Editor */}
            <Row>
              <Col md={24}>
                <Editor
                  editorState={editorState}
                  onEditorStateChange={handleEditorChange}
                  readOnly={isDisabled}
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
                    disabled={true}
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
                    disabled={true}
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

export default AddReportModal;
