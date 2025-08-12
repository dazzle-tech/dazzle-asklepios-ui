// Import necessary libraries and components
import React, { useState, useEffect } from 'react';
import { ContentState, convertToRaw, EditorState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './style.less';
import { isOverflowing } from 'rsuite/esm/DOMHelper';

interface ReportResultTemplateModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  initialData?: {
    radiologyTestName: string[];
    reportTemplate: string;
  };
  onSave: (data: { radiologyTestName: string[]; reportTemplate: string }) => void;
  readOnly?: boolean;
}

const ReportResultTemplateModal: React.FC<ReportResultTemplateModalProps> = ({
  open,
  setOpen,
  initialData,
  onSave,
  readOnly = false
}) => {
  // State for form data and editor
  const [formData, setFormData] = useState({
    radiologyTestName: [] as string[],
    reportTemplate: ''
  });
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  // List of available tests
  const availableTests = [
    { key: '1', testName: 'Chest X-Ray', type: 'Radiology' },
    { key: '2', testName: 'CT Scan Abdomen', type: 'Radiology' },
    { key: '3', testName: 'Blood Test', type: 'Pathology' },
    { key: '4', testName: 'Urine Test', type: 'Pathology' }
  ];

  // Filter relevant tests
  const filteredTests = availableTests.filter(
    t => t.type === 'Radiology' || t.type === 'Pathology'
  );

  // Load initial data when modal opens
  useEffect(() => {
    if (initialData) {
      // Set existing data into form and editor
      setFormData({
        radiologyTestName: initialData.radiologyTestName || [],
        reportTemplate: initialData.reportTemplate || ''
      });
      if (initialData.reportTemplate) {
        const blocksFromHtml = htmlToDraft(initialData.reportTemplate);
        const { contentBlocks, entityMap } = blocksFromHtml;
        const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
        setEditorState(EditorState.createWithContent(contentState));
      } else {
        setEditorState(EditorState.createEmpty());
      }
    } else {
      // Reset form for new template
      setFormData({ radiologyTestName: [], reportTemplate: '' });
      setEditorState(EditorState.createEmpty());
    }
  }, [initialData, open]);

  // Save handler
  const handleSave = () => {
    if (readOnly) return;

    // Validate test name selection
    if (formData.radiologyTestName.length === 0) {
      alert('Please select at least one Radiology Test Name');
      return;
    }

    // Convert editor content to HTML
    const htmlContent = draftToHtml(convertToRaw(editorState.getCurrentContent()));

    // Validate content
    if (!htmlContent || htmlContent === '<p></p>\n') {
      alert('Please enter Report Template content');
      return;
    }

    // Trigger save with form data
    onSave({
      radiologyTestName: formData.radiologyTestName,
      reportTemplate: htmlContent
    });

    setOpen(false);
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={initialData ? (readOnly ? 'View Template' : 'Edit Template') : 'Add Template'}
      actionButtonLabel={readOnly ? undefined : 'Save'}
      actionButtonFunction={readOnly ? undefined : handleSave}
      size="50vw"
      bodyheight="37vw"
      content={
        <Form fluid>
          {/* Input for selecting test names */}
          <div className="test-name-my-input-handle">
            <MyInput
              width="100%"
              fieldLabel="Test Name"
              fieldName="radiologyTestName"
              record={formData}
              setRecord={setFormData}
              fieldType="multyPicker"
              selectData={filteredTests}
              selectDataLabel="testName"
              selectDataValue="key"
              required
              disabled={readOnly}
            />
          </div>
          {/* Editor label */}
          <div className="report-template-label">Report Template</div>
          {/* Rich text editor for the template content */}
          <div className="editor-template-label">
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
  editorStyle={{
    height: '40vh',
    width: '100%',
    border: '1px solid #ccc',
    overflow: 'auto'
  }}
  editorState={editorState}
  onEditorStateChange={readOnly ? () => {} : setEditorState}
  toolbarHidden={readOnly}
  readOnly={readOnly}
  editorClassName="custom-editor"
  placeholder="Write your report here..."
/>

          </div>
        </Form>
      }
    />
  );
};

export default ReportResultTemplateModal;
