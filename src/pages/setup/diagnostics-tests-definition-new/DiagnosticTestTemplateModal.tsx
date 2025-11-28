import React, { useState, useEffect } from "react";
import { ContentState, convertToRaw, EditorState } from "draft-js";
import draftToHtml from "draftjs-to-html";
import htmlToDraft from "html-to-draftjs";
import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import MyModal from "@/components/MyModal/MyModal";
import MyInput from "@/components/MyInput";
import { Form } from "rsuite";
import { useDispatch } from "react-redux";
import {
  hideSystemLoader,
  notify,
  showSystemLoader,
} from "@/utils/uiReducerActions";
import { useSaveDiagnosticTestTemplateMutation } from "@/services/DiagnosticTestTemplate";
import { useGetAllReportTemplatesQuery } from "@/services/reportTemplateService";
import './styles.less';

interface DiagnosticTestTemplateModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;

  testId: number; // required
  initialData?: {
    id?: number;
    name: string;
    templateValue: string;
  };

  readOnly?: boolean;
  onSaved?: () => void; // callback after save
}

const DiagnosticTestTemplateModal: React.FC<
  DiagnosticTestTemplateModalProps
> = ({ open, setOpen, testId, initialData, readOnly = false, onSaved }) => {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: "",
    templateValue: "",
  });

    const { data: reportTemplates } = useGetAllReportTemplatesQuery({
    page: 0,
    size: 9999,
    sort: "name,asc",
  });

  const templateOptions = reportTemplates?.data?.map(t => ({
    label: t.name,
    value: t.id,
    full: t
  })) ?? [];

  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  const [saveTemplate] = useSaveDiagnosticTestTemplateMutation();


  const handleChooseTemplate = (id) => {
  const selected = templateOptions.find(t => t.value === id);
  if (!selected) return;

  // load template value into editor
  const html = selected.full.templateValue || "<p></p>";

  const blocks = htmlToDraft(html);
  const content = ContentState.createFromBlockArray(blocks.contentBlocks, blocks.entityMap);
  setEditorState(EditorState.createWithContent(content));

  // also update formData
  setFormData(prev => ({
    ...prev,
    templateValue: html
  }));
};


  // Load initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        templateValue: initialData.templateValue,
      });

      if (initialData.templateValue) {
        const blocks = htmlToDraft(initialData.templateValue);
        const content = ContentState.createFromBlockArray(
          blocks.contentBlocks,
          blocks.entityMap
        );
        setEditorState(EditorState.createWithContent(content));
      }
    } else {
      setFormData({ name: "", templateValue: "" });
      setEditorState(EditorState.createEmpty());
    }
  }, [initialData, open]);

  // Save
  const handleSave = async () => {
    if (readOnly) return;

    const htmlContent = draftToHtml(
      convertToRaw(editorState.getCurrentContent())
    );

    // Validate name
    if (!formData.name.trim()) {
      dispatch(
        notify({
          msg: "Please enter Template Name",
          sev: "error",
        })
      );
      return;
    }

    // Validate content
    if (!htmlContent || htmlContent === "<p></p>\n") {
      dispatch(
        notify({
          msg: "Please enter Template Content",
          sev: "error",
        })
      );
      return;
    }

    try {
      dispatch(showSystemLoader());

      await saveTemplate({
        diagnosticTestId: testId,
        name: formData.name.trim(),
        templateValue: htmlContent,
      }).unwrap();


      dispatch(
        notify({
          msg: initialData?.id
            ? "Diagnostic Test Template updated successfully"
            : "Diagnostic Test Template created successfully",
          sev: "success",
        })
      );

      onSaved?.();
      setOpen(false);
    } catch (err) {
      console.log("Save Diagnostic Template Error", err);
      dispatch(
        notify({
          msg: "Failed to save Diagnostic Template",
          sev: "error",
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
      title={
        initialData
          ? readOnly
            ? "View Diagnostic Template"
            : "Edit Diagnostic Template"
          : "Add Diagnostic Template"
      }
      actionButtonLabel={readOnly ? undefined : "Save"}
      actionButtonFunction={readOnly ? undefined : handleSave}
      size="50vw"
      bodyheight="38vw"
      content={
        <Form fluid layout="inline">
          <MyInput
            column
            width="100%"
            fieldLabel="Template Name"
            fieldName="name"
            fieldType="text"
            record={formData}
            setRecord={setFormData}
            required
            disabled={readOnly}
          />


          <div className="diagnostic-test-template-modal-editor-contant-container">
          <MyInput
            column
            fieldName="selectReadyTemplate"
            fieldLabel="Choose Definition Template"
            fieldType="select"
            selectData={templateOptions}
            selectDataLabel="label"
            selectDataValue="value"
            width="12vw"
            record={{ selectReadyTemplate: null }}
            setRecord={(rec) => handleChooseTemplate(rec.selectReadyTemplate)}
          />
          <div className="diagnostic-template-label">Add Template Manually</div>
          {/* Editor */}


          <Editor
            toolbar={{
              options: [
                "inline",
                "blockType",
                "fontSize",
                "fontFamily",
                "list",
                "textAlign",
                "link",
              ],
              inline: { inDropdown: true },
              list: { inDropdown: true },
              textAlign: { inDropdown: true },
              link: { inDropdown: true },
            }}
            editorStyle={{
              height: "40vh",
              width: "100%",
              border: "1px solid #ccc",
              overflow: "auto",
            }}
            editorState={editorState}
            onEditorStateChange={readOnly ? () => {} : setEditorState}
            toolbarHidden={readOnly}
            readOnly={readOnly}
            editorClassName="custom-editor"
            placeholder="Write your template here..."
          /></div>
        </Form>
      }
    />
  );
};

export default DiagnosticTestTemplateModal;
