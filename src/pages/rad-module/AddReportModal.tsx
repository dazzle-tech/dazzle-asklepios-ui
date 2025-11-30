import { ContentState, convertToRaw, EditorState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import React, { useEffect, useState } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { useGetAllReportTemplatesQuery } from "@/services/reportTemplateService";
import AttachmentUploadModal from '@/components/AttachmentUploadModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { newApDiagnosticOrderTests, newApDiagnosticOrderTestsRadReport } from '@/types/model-types-constructor';
import { notify } from '@/utils/uiReducerActions';
import { faFileLines, faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Col, Form, Row } from 'rsuite'
import { at } from 'lodash';


const AddReportModal = ({
  open,
  setOpen,
  saveReport,
  report,
  setReport,
  saveTest,
  test,
  setTest,
  resultFetch,
  attachmentRefetch,
  disableEdit
}) => {
  const dispatch = useAppDispatch();
  const { data: severityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const { data: readyTemplatesResponse } = useGetAllReportTemplatesQuery({
    page: 0,
    size: 9999,
    sort: "name,asc"
  });

  const templateOptions = readyTemplatesResponse?.data?.map(t => ({
    label: t.name,
    value: t.id,
    full: t
  })) ?? [];


  useEffect(() => {
    if (report?.reportValue) {
      const blocksFromHtml = htmlToDraft(report.reportValue);
      const { contentBlocks, entityMap } = blocksFromHtml;
      const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
      setEditorState(EditorState.createWithContent(contentState));
    } else {
      setEditorState(EditorState.createEmpty());
    }
  }, [report?.reportValue]);

  useEffect(() => {
    if (attachmentsModalOpen) {
      if (resultFetch && typeof resultFetch === 'function') {
        try {
          resultFetch();

        } catch (e) {
          console.warn('Cannot refetch query: ', e);
        }
      }

    }
  }, [attachmentsModalOpen]);

  const handleSave = async () => {
    try {
      const htmlContent = draftToHtml(convertToRaw(editorState.getCurrentContent()));

      // Submit report with HTML content
      await saveReport({
        ...report,
        reportValue: htmlContent,
        statusLkey: '265123250697000'
      }).unwrap();

      // Submit test
      const response = await saveTest({
        ...test,
        processingStatusLkey: '265123250697000'
      }).unwrap();

      // Reset and update
      setTest({ ...newApDiagnosticOrderTests });
      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
      setTest({ ...response });
      await resultFetch();
      setOpen(false);
    } catch (error) {
      dispatch(notify({ msg: 'Failed to save report.', sev: 'error' }));
    }
  };

  const handleChooseTemplate = (id) => {
    const selected = templateOptions.find(t => t.value === id);
    if (!selected) return;

    const html = selected.full.templateValue || "<p></p>";

    const blocks = htmlToDraft(html);
    const content = ContentState.createFromBlockArray(blocks.contentBlocks, blocks.entityMap);
    setEditorState(EditorState.createWithContent(content));

    setReport(prev => ({
      ...prev,
      reportValue: html
    }));
  };


  const isDisabled = report.statusLkey === '265089168359400';

  return (
    <MyModal
      title="Add Report"
      open={open}
      setOpen={setOpen}
      steps={[{ title: 'Report', icon: <FontAwesomeIcon icon={faFileLines} /> }]}
      actionButtonFunction={disableEdit?()=>{}:handleSave}
      isDisabledActionBtn={disableEdit?true:false}
      size="40vw"
      bodyheight="65vh"
      content={
        <>
          <Row className='mb-2'>
            <Col md={24}>
              <Form fluid>
                <MyInput
                  width="100%"
                  disabled={isDisabled}
                  fieldName="severityLkey"
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
              <MyButton appearance='ghost'
                radius="0px"
                onClick={() => setAttachmentsModalOpen(true)}
                color="#969797ff"><FontAwesomeIcon icon={faUpload} /></MyButton>
            </Col>
          </Row>
          <Row className="mb-2">
            <Col md={24}>
            <Form fluid layout='inline'>
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
                setRecord={(rec) => handleChooseTemplate(rec.selectReadyTemplate)}
              />
              </Form>
            </Col>
          </Row>

          <Row>
          <div className="diagnostic-template-label">Add Report Manually</div>
            <Col md={24}>
              <Editor
                toolbar={{
                  options: [
                    'inline',
                    'blockType',
                    'fontSize',
                    'fontFamily',
                    'list',
                    'textAlign',
                    'link'
                  ],
                  inline: { inDropdown: true },
                  list: { inDropdown: true },
                  textAlign: { inDropdown: true },
                  link: { inDropdown: true },
                  image: {
                    uploadEnabled: false,
                    previewImage: true
                  }
                }}
                editorStyle={{minHeight: '60vh', overflow: "auto", width: '100%', border: '1px solid var(--rs-border-primary)', padding: '8px'}}
                editorState={editorState}
                onEditorStateChange={setEditorState}
                placeholder="Write your report here..."
                readOnly={isDisabled} 
              />

            </Col>


          </Row>

          <AttachmentUploadModal
            isOpen={attachmentsModalOpen}
            setIsOpen={setAttachmentsModalOpen}
            actionType={'add'}
            refecthData={attachmentRefetch}
            attachmentSource={report}
            attatchmentType="RADIOLOGY_REPORT"
            patientKey={report?.patientKey}
            onSuccess={() => {
              setTest(prevTest => ({
                ...prevTest,
                updatedAt: Date.now() 
              }));
              attachmentRefetch();
              resultFetch();
            }}

          />
        </>
      }

    />
  );
};

export default AddReportModal;
