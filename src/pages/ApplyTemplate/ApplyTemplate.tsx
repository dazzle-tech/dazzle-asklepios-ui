import * as React from "react";
import MyModal from "@/components/MyModal/MyModal";
import { useNavigate } from "react-router-dom";
import type { AvailabilityGenerationBatchApplyDTO, AvailabilityTemplateResponseVM } from "@/types/model-types-new";
import { useApplyAvailabilityTemplateMutation } from "@/services/appointment/availabilityGenerationBatchService/availabilityGenerationBatchService";
import ApplyTemplateStepOne, { type ApplyTemplateStepOneHandle } from "./components/ApplyTemplateStepOne";
import ApplyTemplateStepTwo from "./components/ApplyTemplateStepTwo";
import { formatLocalDateTimeForApi } from "./applyTemplateDateUtils";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";

function buildApplyAvailabilityPayload(dto: AvailabilityGenerationBatchApplyDTO): AvailabilityGenerationBatchApplyDTO {
  const scope = String((dto as any)?.scope ?? "").trim().toUpperCase();
  const childId = Number((dto as any)?.childTemplateId ?? 0);
  const effectiveTemplateId =
    scope === "SPECIFIC_RESOURCE" && childId > 0 ? childId : Number(dto.templateId ?? 0);
  return {
    templateId: effectiveTemplateId,
    startDate: formatLocalDateTimeForApi(dto.startDate),
    endDate: formatLocalDateTimeForApi(dto.endDate),
    deferred: dto.deferred,
    deferredAt: dto.deferredAt ?? null,
    scope: dto.scope,
    holidayHandlingMode: dto.holidayHandlingMode ?? null,
  };
}

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
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const stepOneRef = React.useRef<ApplyTemplateStepOneHandle>(null);
  const [applyAvailabilityTemplate, { isLoading: isApplying }] = useApplyAvailabilityTemplateMutation();
  const [internalOpen, setInternalOpen] = React.useState(true);
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
            disabledNext: false,
          }
          : item
      ),
    []
  );

  const handleBeforeNext = React.useCallback(
    async (activeStep: number) => {
      if (activeStep !== 0) return true;
      const result = stepOneRef.current?.validate();
      if (!result?.ok) {
        const msg =
          result.messages.length > 0
            ? result.messages.join(" ")
            : "Please complete all required fields before continuing.";
        dispatch(notify({ msg, sev: "warning" }));
        return false;
      }
      return true;
    },
    [dispatch]
  );

  const handleClose = React.useCallback(() => {
    modalSetOpen(false);
    if (!isControlled) {
      navigate(-1);
    }
  }, [isControlled, modalSetOpen, navigate]);

  // extract the error message from the bad request that coming from the backend
  const extractErrorMessage = (response: any): string => {
    try {
      const msg = response?.data?.message;
      if (typeof msg === 'string') {
        return msg.replace(/^error\./i, '');
      }
      return '';
    } catch {
      return '';
    }
  };


  const handleApplyTemplate = React.useCallback(async () => {
    const payload = buildApplyAvailabilityPayload(formState);
    await applyAvailabilityTemplate(payload).unwrap()
      .then(() => {
        dispatch(
          notify({
            msg: 'Applied Successfully',
            sev: 'success'
          })
        );
      })
      .catch((e) => {
        const errorMsg = extractErrorMessage(e) || 'Save Failed';
        dispatch(notify({ msg: errorMsg, sev: 'warning' }));
      });
    handleClose();
  }, [applyAvailabilityTemplate, formState, handleClose]);

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
            ref={stepOneRef}
            selectedTemplate={selectedTemplate}
            dto={formState}
            setDto={setFormState}
          />
        ) : (
          <ApplyTemplateStepTwo selectedTemplate={selectedTemplate} dto={formState} />
        )
      }
      steps={modalSteps}
      onBeforeNext={handleBeforeNext}
      handleCancelFunction={handleClose}
      cancelButtonLabel="Close"
      actionButtonLabel="Apply Template"
      actionButtonFunction={handleApplyTemplate}
      isDisabledActionBtn={isApplying}
      modalColor="var(--primary-blue)"
      customClassName="apply-template-modal"
    />
  );
};

export default ApplyTemplate;
