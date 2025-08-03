import React, { useEffect, useState } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, ContentState, convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { newApDiagnosticOrderTests } from '@/types/model-types-constructor';
import { notify } from '@/utils/uiReducerActions';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Image } from '@rsuite/icons';
import { FaBold, FaItalic, FaLink } from 'react-icons/fa6';
import { ButtonGroup, Col, Form, IconButton, List, Row } from 'rsuite';

const AddReportModal = ({
  open,
  setOpen,
  saveReport,
  report,
  setReport,
  saveTest,
  test,
  setTest,
  resultFetch
}) => {
  const dispatch = useAppDispatch();
  const { data: severityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');

  const [editorState, setEditorState] = useState(EditorState.createEmpty());

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

  const isDisabled = report.statusLkey === '265089168359400';

  return (
    <MyModal
      title="Add Report"
      open={open}
      setOpen={setOpen}
      steps={[{ title: 'Report', icon: <FontAwesomeIcon icon={faFileLines} /> }]}
      actionButtonFunction={handleSave}
      size="30vw"
      bodyheight="65vh"
      content={
        <>
          <Row>
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
                editorStyle={{ height: '60vh', width: '100%', border: '1px solid #ccc', padding: '8px' }}
                editorState={editorState}
                onEditorStateChange={setEditorState}
                placeholder="Write your report here..."
                readOnly={isDisabled}
              />
            </Col>
          </Row>
        </>
      }
    />
  );
};

export default AddReportModal;
