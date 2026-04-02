// DiagnosticTestTemplateModal.tsx
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
import {
  useCreateDiagnosticTestTemplateMutation,
  useUpdateDiagnosticTestTemplateMutation,
} from "@/services/setup/report-template/DiagnosticTestTemplate";
import { useGetAllReportTemplatesQuery } from "@/services/setup/report-template/reportTemplateService";
import "./styles.less";

interface DiagnosticTestTemplateModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;

  testId: number;
  initialData?: {
    id?: number;
    name: string;
    templateValue: string;
  };

  readOnly?: boolean;
  onSaved?: () => void;
}

const DiagnosticTestTemplateModal: React.FC<DiagnosticTestTemplateModalProps> = ({
  open,
  setOpen,
  testId,
  initialData,
  readOnly = false,
  onSaved,
}) => {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: "",
    templateValue: "",
  });

  const [selectedReadyTemplateId, setSelectedReadyTemplateId] =
    useState<number | null>(null);

  const { data: reportTemplates } = useGetAllReportTemplatesQuery({
    page: 0,
    size: 9999,
    sort: "name,asc",
  });

  const templateOptions =
    reportTemplates?.data?.map((t) => ({
      label: t.name,
      value: t.id,
      full: t,
    })) ?? [];

  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  // ✅ split create/update hooks
  const [createTemplate] = useCreateDiagnosticTestTemplateMutation();
  const [updateTemplate] = useUpdateDiagnosticTestTemplateMutation();

  const handleChooseTemplate = (id: number) => {
    setSelectedReadyTemplateId(id);
    const selected = templateOptions.find((t) => t.value === id);
    if (!selected) return;

    const html = selected.full.templateValue || "<p></p>";

    const blocks = htmlToDraft(html);
    const content = ContentState.createFromBlockArray(
      blocks.contentBlocks,
      blocks.entityMap
    );
    setEditorState(EditorState.createWithContent(content));

    // also update formData
    setFormData((prev) => ({
      ...prev,
      name: prev.name?.trim() ? prev.name : selected.full.name, // optional autofill
      templateValue: html,
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
      } else {
        setEditorState(EditorState.createEmpty());
      }
    } else {
      setFormData({ name: "", templateValue: "" });
      setEditorState(EditorState.createEmpty());
    }

    setSelectedReadyTemplateId(null);
  }, [initialData, open]);

  const handleSave = async () => {
    if (readOnly) return;

    const htmlContent = draftToHtml(
      convertToRaw(editorState.getCurrentContent())
    );

    if (!formData.name.trim()) {
      dispatch(notify({ msg: "Please enter Template Name", sev: "warning" }));
      return;
    }

    if (!htmlContent || htmlContent === "<p></p>\n") {
      dispatch(notify({ msg: "Please enter Template Content", sev: "warning" }));
      return;
    }

    try {
      dispatch(showSystemLoader());

      if (initialData?.id) {
        await updateTemplate({
          id: initialData.id,
          diagnosticTestId: testId,
          name: formData.name.trim(),
          templateValue: htmlContent,
          isActive: true,
        }).unwrap();
      } else {
        await createTemplate({
          diagnosticTestId: testId,
          name: formData.name.trim(),
          templateValue: htmlContent,
          isActive: true,
        }).unwrap();
      }

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

            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

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
        <Form fluid layout="inline" dir={dir}>
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
              searchable
              record={{ selectReadyTemplate: selectedReadyTemplateId }}
              setRecord={(rec) =>
                handleChooseTemplate(rec.selectReadyTemplate)
              }
              disabled={readOnly}
            />

            <div className="diagnostic-template-label">
              Add Template Manually
            </div>

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
            />
          </div>
        </Form>
      }
    />
  );
};

export default DiagnosticTestTemplateModal;
