// DiagnosticTestTemplate.tsx
import React, { useEffect, useState } from "react";
import MyModal from "@/components/MyModal/MyModal";
import { useDispatch } from "react-redux";
import {
  useGetDiagnosticTestTemplateByTestIdQuery,
  useSaveDiagnosticTestTemplateMutation,
} from "@/services/DiagnosticTestTemplate";
import DiagnosticTestTemplateModal from "./DiagnosticTestTemplateModal";

const DiagnosticTestTemplate = ({ open, setOpen, testId, testName }) => {
  const dispatch = useDispatch();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const { data, isLoading, refetch } =
    useGetDiagnosticTestTemplateByTestIdQuery(testId);

  useEffect(() => {
    if (open) {
      if (data && data.id) {
        setSelectedTemplate({
          id: data.id,
          name: data.name,
          templateValue: data.templateValue,
        });
      } else {
        setSelectedTemplate(null);
      }

      setModalOpen(true);
    }
  }, [open, data]);

  return (
    <>
      <MyModal
        open={open}
        setOpen={setOpen}
        title={`Diagnostic Test Template - ${testName}`}
        size="0"
        bodyheight="0"
        hideCancel
        hideActionBtn
        content={<></>}
      />

      {modalOpen && (
        <DiagnosticTestTemplateModal
          open={modalOpen}
          setOpen={(val) => {
            setModalOpen(val);
            if (!val) setOpen(false);
          }}
          testId={testId}
          initialData={selectedTemplate}
          readOnly={false}
          onSaved={() => {
            refetch();
            setModalOpen(false);
            setOpen(false);
          }}
        />
      )}
    </>
  );
};

export default DiagnosticTestTemplate;
