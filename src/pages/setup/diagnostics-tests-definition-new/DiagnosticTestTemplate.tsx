// DiagnosticTestTemplate.tsx
import React, { useEffect, useState } from "react";
import MyModal from "@/components/MyModal/MyModal";
import {
  useGetDiagnosticTestTemplateByTestIdQuery,
} from "@/services/setup/report-template/DiagnosticTestTemplate";
import DiagnosticTestTemplateModal from "./DiagnosticTestTemplateModal";

const DiagnosticTestTemplate = ({ open, setOpen, testId, testName }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<{
    id?: number;
    name: string;
    templateValue: string;
  } | null>(null);

  const { data, refetch } =
    useGetDiagnosticTestTemplateByTestIdQuery(testId, { skip: !testId });

  useEffect(() => {
    if (!open) return;

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
  }, [open, data]);

              // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <>
      {/* just a wrapper title modal (as you had) */}
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
          initialData={selectedTemplate ?? undefined}
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
