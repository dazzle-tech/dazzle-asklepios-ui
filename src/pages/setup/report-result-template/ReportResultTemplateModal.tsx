// ReportResultTemplateModal.tsx
import React, { useState, useEffect } from "react";
import { ContentState, convertToRaw, EditorState } from "draft-js";
import draftToHtml from "draftjs-to-html";
import htmlToDraft from "html-to-draftjs";
import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

import MyModal from "@/components/MyModal/MyModal";
import MyInput from "@/components/MyInput";
import Translate from "@/components/Translate/Translate";

import { Form, Row, Col } from "rsuite";
import { useDispatch } from "react-redux";

import {
  hideSystemLoader,
  notify,
  showSystemLoader,
} from "@/utils/uiReducerActions";

import "./style.less";

interface ReportResultTemplateModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  initialData?: {
    id?: number;
    name: string;
    templateValue: string;
  };
  onSave: (data: {
    id?: number | null;
    name: string;
    templateValue: string;
  }) => Promise<void> | void;
  readOnly?: boolean;
}

const ReportResultTemplateModal: React.FC<
  ReportResultTemplateModalProps
> = ({
  open,
  setOpen,
  initialData,
  onSave,
  readOnly = false,
}) => {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: "",
    templateValue: "",
  });

  const [editorState, setEditorState] =
    useState(EditorState.createEmpty());

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setFormData({
        name: initialData.name ?? "",
        templateValue: initialData.templateValue ?? "",
      });

      if (initialData.templateValue) {
        const blocks = htmlToDraft(
          initialData.templateValue
        );

        const contentState =
          ContentState.createFromBlockArray(
            blocks.contentBlocks,
            blocks.entityMap
          );

        setEditorState(
          EditorState.createWithContent(contentState)
        );
      } else {
        setEditorState(EditorState.createEmpty());
      }
    } else {
      setFormData({
        name: "",
        templateValue: "",
      });

      setEditorState(EditorState.createEmpty());
    }
  }, [initialData, open]);

  const handleSave = async () => {
    if (readOnly) return;

    const htmlContent = draftToHtml(
      convertToRaw(editorState.getCurrentContent())
    );

    if (!formData?.name?.trim()) {
      dispatch(
        notify({
          msg: "Please Enter Report Name",
          sev: "warning",
        })
      );
      return;
    }

    const plainText = htmlContent
      ?.replace(/<[^>]*>/g, "")
      ?.replace(/&nbsp;/g, "")
      ?.trim();

    if (!plainText) {
      dispatch(
        notify({
          msg: "Please enter report template content",
          sev: "warning",
        })
      );
      return;
    }

    try {
      dispatch(showSystemLoader());

      await onSave({
        id: initialData?.id ?? null,
        name: formData.name.trim(),
        templateValue: htmlContent,
      });

      dispatch(
        notify({
          msg: initialData?.id
            ? "Report Template updated successfully"
            : "Report Template created successfully",
          sev: "success",
        })
      );

      setOpen(false);
    } catch {
      dispatch(
        notify({
          msg: "Failed to save Report Template",
          sev: "error",
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const direction =
    localStorage.getItem("direction") || "LTR";

  const isRTL = direction === "RTL";
  const dir = isRTL ? "rtl" : "ltr";

  return (
    <div dir={dir}>
      <MyModal
        open={open}
        setOpen={setOpen}
        title={
          <Translate>
            {initialData
              ? readOnly
                ? "View Template"
                : "Edit Template"
              : "Add Template"}
          </Translate>
        }
        actionButtonLabel={
          readOnly ? undefined : "Save"
        }
        actionButtonFunction={
          readOnly ? undefined : handleSave
        }
        size="40vw"
        bodyheight="65vh"
        content={
          <div dir={dir}>
            <Form fluid>
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
            </Form>

            <div
              style={{
                marginTop: "15px",
                marginBottom: "10px",
                fontWeight: 600,
              }}
            >
              <Translate>
                Report Template
              </Translate>
            </div>

            <Row>
              <Col md={24}>
                <Editor
                  editorState={editorState}
                  onEditorStateChange={
                    readOnly
                      ? () => {}
                      : setEditorState
                  }
                  readOnly={readOnly}
                  toolbarHidden={readOnly}
                  placeholder="Write your report here..."
                  editorStyle={{
                    minHeight: "60vh",
                    overflow: "auto",
                    width: "100%",
                    border:
                      "1px solid var(--rs-border-primary)",
                    padding: "8px",
                  }}
                  editorClassName="custom-editor"
                />
              </Col>
            </Row>
          </div>
        }
      />
    </div>
  );
};

export default ReportResultTemplateModal;