import React, { useState, useEffect } from 'react';
import { ContentState, convertToRaw, EditorState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { useDispatch } from 'react-redux';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import './style.less';

interface ReportResultTemplateModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  initialData?: {
    id?: number;
    name: string;
    templateValue: string;
  };

  onSave: (data: { id?: number | null; name: string; templateValue: string }) => void;
  readOnly?: boolean;
}


const ReportResultTemplateModal: React.FC<ReportResultTemplateModalProps> = ({
  open,
  setOpen,
  initialData,
  onSave,
  readOnly = false
}) => {

  const [formData, setFormData] = useState({
    name: '',
    templateValue: ''
  });

  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const dispatch = useDispatch();

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        templateValue: initialData.templateValue
      });

      if (initialData.templateValue) {
        const blocksFromHtml = htmlToDraft(initialData.templateValue || '');
        const { contentBlocks, entityMap } = blocksFromHtml;
        const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
        setEditorState(EditorState.createWithContent(contentState));
      } else {
        setEditorState(EditorState.createEmpty());
      }
    } else {
      setFormData({ name: '', templateValue: '' });
      setEditorState(EditorState.createEmpty());
    }
  }, [initialData, open]);


  // Save handler
const handleSave = async () => {
  if (readOnly) return;

  const htmlContent = draftToHtml(convertToRaw(editorState.getCurrentContent()));

  // 🚨 Check empty Report Name
  if (!formData?.name?.trim()) {
    dispatch(
      notify({
        msg: "Please Enter Report Name",
        sev: "error"
      })
    );
    return;
  }

  // 🚨 Check empty Template content
  if (!htmlContent || htmlContent === "<p></p>\n") {
    dispatch(
      notify({
        msg: "Please enter report template content",
        sev: "error"
      })
    );
    return;
  }

  // 💾 Save Template
  try {
    dispatch(showSystemLoader());

    await onSave({
      id: initialData?.id ?? null,
      name: formData.name.trim(),
      templateValue: htmlContent
    });

    dispatch(
      notify({
        msg: initialData?.id
          ? "Report Template updated successfully"
          : "Report Template created successfully",
        sev: "success"
      })
    );

    console.log("Template Value", htmlContent);
    setFormData(prev => ({ ...prev, templateValue: htmlContent }));
    setOpen(false);

  } catch (err) {
    console.log("Report Template Save Error:", err);
    dispatch(
      notify({
        msg: "Failed to save Report Template",
        sev: "error"
      })
    );
  } finally {
    dispatch(hideSystemLoader());
  }
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
          {/* Name Input */}
          <div className="test-name-my-input-handle">
            <MyInput
              width="100%"
              fieldLabel="Report Name"
              fieldName="name"
              record={formData}
              setRecord={setFormData}
              fieldType="text"
              required
              disabled={readOnly}
            />
          </div>

          {/* Editor Label */}
          <div className="report-template-label">Report Template</div>

          {/* Rich Text Editor */}
          <div className="editor-template-label">
            <Editor
              toolbar={{
                options: ['inline', 'blockType', 'fontSize', 'fontFamily', 'list', 'textAlign', 'link'],
                inline: { inDropdown: true },
                list: { inDropdown: true },
                textAlign: { inDropdown: true },
                link: { inDropdown: true },
              }}
              editorStyle={{
                height: '40vh',
                width: '100%',
                border: '1px solid #ccc',
                overflow: 'auto'
              }}
              editorState={editorState}
              onEditorStateChange={readOnly ? () => { } : setEditorState}
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
