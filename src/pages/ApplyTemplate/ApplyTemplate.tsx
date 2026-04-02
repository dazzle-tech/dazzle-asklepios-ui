import * as React from "react";
import MyModal from "@/components/MyModal/MyModal";
import { useNavigate } from "react-router-dom";
import type { AvailabilityGenerationBatchApplyDTO, AvailabilityTemplateResponseVM } from "@/types/model-types-new";
import ApplyTemplateStepOne from "./components/ApplyTemplateStepOne";
import ApplyTemplateStepTwo from "./components/ApplyTemplateStepTwo";

const stepItems = [
  {
    title: "Apply Template",
    description: "Configure template and preview slots",
    icon: 1,
  },
  {
    title: "Review & Confirm",
    description: "Review and confirm generated appointments",
    icon: 2,
  },
];

type ApplyTemplateProps = {
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>> | ((open: boolean) => void);
  selectedTemplate?: AvailabilityTemplateResponseVM | null;
};

const ApplyTemplate: React.FC<ApplyTemplateProps> = ({ open, setOpen, selectedTemplate }) => {
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = React.useState(true);
  const [isStepOneValid, setIsStepOneValid] = React.useState(true);
  const [formState, setFormState] = React.useState<AvailabilityGenerationBatchApplyDTO>({
    templateId: selectedTemplate?.id ?? 0,
    startDate: "",
    endDate: "",
    deferred: false,
    deferredAt: null,
    scope: "DEPARTMENT",
    holidayHandlingMode: null,
  } as AvailabilityGenerationBatchApplyDTO);
  const isControlled = typeof open === "boolean" && typeof setOpen === "function";
  const modalOpen = isControlled ? open : internalOpen;
  const modalSetOpen = isControlled ? setOpen : setInternalOpen;

  const modalSteps = React.useMemo(
    () =>
      stepItems.map((item, idx) =>
        idx === 0
          ? {
              ...item,
              disabledNext: !isStepOneValid,
            }
          : item
      ),
    [isStepOneValid]
  );

  const handleClose = () => {
    modalSetOpen(false);
    if (!isControlled) {
      navigate(-1);
    }
  };

  React.useEffect(() => {
    setFormState(prev => ({
      ...prev,
      templateId: selectedTemplate?.id ?? 0,
      startDate: "",
      endDate: "",
      childTemplateId: null as any,
      scope: "DEPARTMENT",
      holidayHandlingMode: null,
    }));
  }, [selectedTemplate?.id]);

  return (
    <MyModal
      open={modalOpen}
      setOpen={modalSetOpen}
      title={selectedTemplate?.templateName ? `Apply Template - ${selectedTemplate.templateName}` : "Apply Template to Period"}
      position="center"
      size="full"
      bodyheight="calc(100vh - 220px)"
      content={(stepNumber) =>
        stepNumber === 0 ? (
          <ApplyTemplateStepOne
            selectedTemplate={selectedTemplate}
            dto={formState}
            setDto={setFormState}
            onValidationChange={setIsStepOneValid}
          />
        ) : (
          <ApplyTemplateStepTwo selectedTemplate={selectedTemplate} dto={formState} />
        )
      }
      steps={modalSteps}
      handleCancelFunction={handleClose}
      cancelButtonLabel="Close"
      actionButtonLabel="Apply Template"
      actionButtonFunction={handleClose}
      modalColor="var(--primary-blue)"
      customClassName="apply-template-modal"
    />
  );
};

export default ApplyTemplate;
