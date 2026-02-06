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

import { useGetAllReportTemplatesQuery } from '@/services/setup/report-template/reportTemplateService';
import {
  useUpdateRadiologyReportMutation
} from '@/services/setup/diagnosticTest/diagnosticOrderTestReportService';
import AttachmentUploadModal from '@/components/AttachmentUploadModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import {
  newDiagnosticOrderTestReportUpdateRequestDTO
} from '@/types/model-types-constructor-new';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines, faUpload } from '@fortawesome/free-solid-svg-icons';
import { Col, Form, Row } from 'rsuite';

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  report: any;
  setReport: (r: any) => void;
  resultFetch?: () => void;
  attachmentRefetch?: () => void;
  disableEdit?: boolean;
};

const AddReportModal = ({
  open,
  setOpen,
  report,
  setReport,
  resultFetch,
  attachmentRefetch,
  disableEdit
}: Props) => {
  const dispatch = useAppDispatch();

  const [updateReport] = useUpdateRadiologyReportMutation();

  const { data: severityLovQueryResponse } =
    useGetLovValuesByCodeQuery('SEVERITY');

  const { data: readyTemplatesResponse } =
    useGetAllReportTemplatesQuery({
      page: 0,
      size: 9999,
      sort: 'name,asc'
    });

  const [attachmentsModalOpen, setAttachmentsModalOpen] =
    useState(false);
  const [editorState, setEditorState] =
    useState(EditorState.createEmpty());

  const templateOptions =
    readyTemplatesResponse?.data?.map((t) => ({
      label: t.name,
      value: t.id,
      full: t
    })) ?? [];

  useEffect(() => {
    if (report?.report) {
      const blocks = htmlToDraft(report.report);
      const contentState =
        ContentState.createFromBlockArray(
          blocks.contentBlocks,
          blocks.entityMap
        );
      setEditorState(EditorState.createWithContent(contentState));
    } else {
      setEditorState(EditorState.createEmpty());
    }
  }, [report?.report]);

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

    try {
      const htmlContent = draftToHtml(
        convertToRaw(editorState.getCurrentContent())
      );

      const updateDTO = {
        report: htmlContent,
        severity: report.severity,
        imageStatus: report.imageStatus,
        processingStatus: report.processingStatus
      };


      await updateReport({
        reportId: report.id,
        body: updateDTO
      }).unwrap();

      dispatch(
        notify({ msg: 'Report updated successfully', sev: 'success' })
      );

      resultFetch?.();
      setOpen(false);
    } catch (e) {
      dispatch(
        notify({ msg: 'Failed to update report', sev: 'error' })
      );
    }
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

    setEditorState(EditorState.createWithContent(content));
    setReport((prev) => ({ ...prev, report: html }));
  };

  const isDisabled =
    disableEdit ||
    !report?.id ||
    report?.processingStatus === 'RESULT_APPROVED';

  /* ===============================
   * Render
   * =============================== */
  return (
    <MyModal
      title="Add Report"
      open={open}
      setOpen={setOpen}
      steps={[
        { title: 'Report', icon: <FontAwesomeIcon icon={faFileLines} /> }
      ]}
      actionButtonFunction={isDisabled ? () => {} : handleSave}
      isDisabledActionBtn={isDisabled}
      size="40vw"
      bodyheight="65vh"
      content={
        <>
          <Row className="mb-2">
            <Col md={24}>
              <Form fluid>
                <MyInput
                  width="100%"
                  disabled={isDisabled}
                  fieldName="severity"
                  fieldType="select"
                  selectData={severityLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={report}
                  setRecord={setReport}
                />
              </Form>
            </Col>
          </Row>
          <Row>
            <Col md={24}>
              <MyButton
                appearance="ghost"
                radius="0px"
                onClick={() => setAttachmentsModalOpen(true)}
                color="#969797ff"
              >
                <FontAwesomeIcon icon={faUpload} />
              </MyButton>
            </Col>
          </Row>
          {!isDisabled && (
            <Row className="mb-2">
              <Col md={24}>
                <Form fluid layout="inline">
                  <MyInput
                    column
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
                  />
                </Form>
              </Col>
            </Row>
          )}

          {/* Editor */}
          <Row>
            <div className="diagnostic-template-label">
              Add Report Manually
            </div>
            <Col md={24}>
              <Editor
                editorState={editorState}
                onEditorStateChange={setEditorState}
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

          {/* Attachments Modal */}
          <AttachmentUploadModal
            isOpen={attachmentsModalOpen}
            setIsOpen={setAttachmentsModalOpen}
            actionType="add"
            refecthData={attachmentRefetch}
            attachmentSource={report}
            attatchmentType="RADIOLOGY_REPORT"
            patientKey={report?.patientKey}
            onSuccess={() => {
              attachmentRefetch?.();
              resultFetch?.();
            }}
          />
        </>
      }
    />
  );
};

export default AddReportModal;
