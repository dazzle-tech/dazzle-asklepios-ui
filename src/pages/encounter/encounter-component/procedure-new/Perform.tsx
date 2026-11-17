import CancellationModal from '@/components/CancellationModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyButton from '@/components/MyButton/MyButton';
import { useAppDispatch } from '@/hooks';
import {
  useCancelProcdureMutation,
  useChangeProcedureStatusMutation,
  useGetProcedureEquipmentQuery,
  useGetProcedurePerformanceQuery,
  useGetProcedurePostCareQuery,
  useGetProcedurePreAssessmentQuery
} from '@/services/patients/patientProcedureService';
import { useGetProcedureByIdQuery } from '@/services/setup/procedure/procedureService';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import {
  faBoxOpen,
  faCheck,
  faClipboardCheck,
  faFileSignature,
  faHeartPulse,
  faList,
  faPlay,
  faRectangleXmark,
  faUser,
  faUserDoctor
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import React, { useRef, useState } from 'react';
import { FaArrowRight } from 'react-icons/fa6';
import { useSelector } from 'react-redux';
import PatientSide from '../../encounter-main-info-section/PatienSide';
import EquipmentAndLogistics from './EquipmentAndLogistics/EquipmentAndLogistics';
import PostProcedureCare from './Post-ProcedureCare/PostProcedureCare';
import PreProcedureAssessment from './Pre-ProcedureAssessment/PreProcedureAssessment';
import ProcedurePerforming from './ProcedurePerforming/ProcedurePerforming';
import ProcedureRegistration from './ProcedureRegistration';
import ProcedureReportButton from './ProcedureReportButton';
import {
  canMoveToStatus,
  getStatusColor,
  isClosedStatus,
  isRegistrationComplete
} from './procedureHelpers';
import './styles.less';
import type { ProcedureStepHandle } from './useStepForm';

const STEPS = [
  { label: 'Registration', icon: faFileSignature },
  { label: 'Assessment', icon: faClipboardCheck },
  { label: 'Performing', icon: faUserDoctor },
  { label: 'Post-Care', icon: faHeartPulse },
  { label: 'Equipment', icon: faBoxOpen }
];

const Perform = ({ edit, patient, encounter, procedure, setProcedure, proRefetch }) => {
  const dispatch = useAppDispatch();
  const mode = useSelector((state: any) => state.ui.mode);
  const stepRef = useRef<ProcedureStepHandle | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPatient, setShowPatient] = useState(false);
  const [openCancellationModal, setOpenCancellationModal] = useState(false);

  const [changeStatus] = useChangeProcedureStatusMutation();
  const [cancelProcedure] = useCancelProcdureMutation();

  const id = procedure?.id;
  const skip = { skip: !id };
  const { data: procedureSetup } = useGetProcedureByIdQuery(
    { id: procedure?.procedureId },
    { skip: !procedure?.procedureId }
  );
  const { data: preAssessment } = useGetProcedurePreAssessmentQuery(id, skip);
  const { data: performance } = useGetProcedurePerformanceQuery(id, skip);
  const { data: postCare } = useGetProcedurePostCareQuery(id, skip);
  const { data: equipment = [] } = useGetProcedureEquipmentQuery(id, skip);

  const status = procedure?.status;
  const readOnly = Boolean(edit) || isClosedStatus(status);
  const isLastStep = activeStep === STEPS.length - 1;
  const canMove = (target: string) => !edit && canMoveToStatus(status, target);

  const stepDone = [
    isRegistrationComplete(procedure),
    Boolean(preAssessment?.id),
    Boolean(performance?.id),
    Boolean(postCare?.id),
    equipment.length > 0
  ];

  const postCareDone = stepDone[3];

  // A step opens once every step before it is filled; unsaved input in the current one counts
  // because moving on saves it first. Closed procedures stay open for reading.
  const canOpenStep = (step: number) =>
    readOnly ||
    stepDone.slice(0, step).every((done, index) => done || (index === activeStep && isDirty));

  const saveStep = async () => {
    if (readOnly || !isDirty) return true;
    setIsSaving(true);
    try {
      return (await stepRef.current?.save()) ?? true;
    } finally {
      setIsSaving(false);
    }
  };

  const goToStep = async (step: number) => {
    if (step === activeStep) return;
    if (!canOpenStep(step)) {
      const missing = STEPS[stepDone.findIndex(done => !done)];
      dispatch(notify({ msg: `Complete ${missing.label} first`, sev: 'warning' }));
      return;
    }
    if (!(await saveStep())) return;
    setIsDirty(false);
    setActiveStep(step);
  };

  const applyUpdate = (updated: any, msg: string) => {
    setProcedure({ ...procedure, ...updated });
    proRefetch();
    dispatch(notify({ msg, sev: 'success' }));
  };

  const handleChangeStatus = async (target: string) => {
    const savesRegistration = activeStep === 0 && isDirty;
    if (!(await saveStep())) return;
    if (
      target !== 'AWAITING_CONSENT' &&
      !savesRegistration &&
      !isRegistrationComplete(procedure)
    ) {
      dispatch(notify({ msg: 'Complete the registration details first', sev: 'warning' }));
      setActiveStep(0);
      return;
    }
    try {
      const updated = await changeStatus({ id, status: target }).unwrap();
      applyUpdate(updated, 'Changed Status Successfully');
    } catch (error: any) {
      dispatch(notify({ msg: error?.data?.title ?? 'Changed Status Failed', sev: 'error' }));
    }
  };

  const handleCancel = async () => {
    try {
      const updated = await cancelProcedure({
        id,
        cancellationReason: procedure.cancellationReason || ''
      }).unwrap();
      setOpenCancellationModal(false);
      applyUpdate(updated, 'Cancelled Successfully');
    } catch (error: any) {
      dispatch(notify({ msg: error?.data?.title ?? 'Cancel Failed', sev: 'error' }));
    }
  };

  const stepProps = { ref: stepRef, procedure, onDirtyChange: setIsDirty };
  const stepContent = [
    <ProcedureRegistration key="0" {...stepProps} setProcedure={setProcedure} />,
    <PreProcedureAssessment key="1" {...stepProps} patient={patient} encounter={encounter} />,
    <ProcedurePerforming key="2" {...stepProps} />,
    <PostProcedureCare key="3" {...stepProps} />,
    <EquipmentAndLogistics
      key="4"
      procedure={procedure}
      patient={patient}
      encounter={encounter}
      readOnly={readOnly}
    />
  ][activeStep];

  const patientName = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ');
  const summary = [
    formatEnumString(procedureSetup?.categoryType),
    formatEnumString(procedure?.priority),
    formatEnumString(procedure?.procedureLevel),
    procedure?.bodyPart,
    procedure?.side,
    procedure?.scheduledDateTime ? formatDateWithoutSeconds(procedure.scheduledDateTime) : null
  ].filter(Boolean);

  const notice =
    status === 'WAITING_PRE_AUTHORIZATION'
      ? 'Waiting for pre-authorization. The procedure can start once it is approved.'
      : isClosedStatus(status)
      ? `This procedure is ${formatEnumString(status)} and is read only.`
      : edit
      ? 'This procedure is read only.'
      : null;

  return (
    <div className={clsx('perform-shell', { dark: mode === 'dark' })}>
      <div className="perform-main">
        <header className="perform-header">
          <div className="perform-title">
            <div className="perform-title-line">
              <h5>{procedureSetup?.name ?? 'Procedure'}</h5>
              <MyBadgeStatus
                contant={formatEnumString(status) || '-'}
                color={getStatusColor(status)}
              />
            </div>
            <div className="perform-meta">
              <strong>{patientName}</strong>
              {patient?.medicalRecordNumber && <span># {patient.medicalRecordNumber}</span>}
              {summary.map(value => (
                <span key={value}>{value}</span>
              ))}
            </div>
          </div>
          <div className="perform-actions">
            <ProcedureReportButton procedureRequestId={id} variant="ghost" />
            {canMove('AWAITING_CONSENT') && (
              <MyButton
                appearance="ghost"
                onClick={() => handleChangeStatus('AWAITING_CONSENT')}
                prefixIcon={() => <FontAwesomeIcon icon={faList} />}
              >
                Awaiting Consent
              </MyButton>
            )}
            {canMove('STARTED') && (
              <MyButton
                onClick={() => handleChangeStatus('STARTED')}
                prefixIcon={() => <FontAwesomeIcon icon={faPlay} />}
              >
                Start Procedure
              </MyButton>
            )}
            {!readOnly && (
              <MyButton
                appearance="ghost"
                onClick={() => setOpenCancellationModal(true)}
                prefixIcon={() => <FontAwesomeIcon icon={faRectangleXmark} />}
              >
                Cancel
              </MyButton>
            )}
          </div>
        </header>
        {notice && <div className="perform-notice">{notice}</div>}

        <nav className="perform-steps">
          {STEPS.map(({ label, icon }, index) => (
            <button
              type="button"
              key={label}
              className={clsx('perform-step', {
                'is-active': index === activeStep,
                'is-done': stepDone[index]
              })}
              disabled={!canOpenStep(index)}
              onClick={() => goToStep(index)}
            >
              <span className="perform-step-marker">
                <FontAwesomeIcon icon={stepDone[index] ? faCheck : icon} />
              </span>
              <span className="perform-step-label">{label}</span>
            </button>
          ))}
        </nav>

        <div className="perform-content">
          <div className={readOnly ? 'disabled-panel' : undefined}>{stepContent}</div>
        </div>

        <footer className="perform-footer">
          <MyButton
            appearance="ghost"
            disabled={activeStep === 0 || isSaving}
            onClick={() => goToStep(activeStep - 1)}
          >
            Back
          </MyButton>
          <span className={clsx('perform-save-state', { 'is-dirty': isDirty })}>
            <span className="perform-save-dot" />
            {readOnly ? 'Read only' : isDirty ? 'Unsaved changes' : 'All changes saved'}
          </span>
          <div className="perform-footer-actions">
            {!readOnly && !isLastStep && isDirty && (
              <MyButton loading={isSaving} onClick={saveStep}>
                Save
              </MyButton>
            )}
            {!isLastStep && (
              <MyButton
                appearance={isDirty ? 'ghost' : 'primary'}
                disabled={isSaving}
                onClick={() => goToStep(activeStep + 1)}
              >
                {readOnly || !isDirty ? 'Next' : 'Save & Next'}
              </MyButton>
            )}
            {canMove('COMPLETED') && postCareDone && (
              <MyButton
                appearance={isLastStep ? 'primary' : 'ghost'}
                disabled={isSaving}
                onClick={() => handleChangeStatus('COMPLETED')}
                prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}
              >
                Complete Procedure
              </MyButton>
            )}
          </div>
        </footer>

        <CancellationModal
          open={openCancellationModal}
          setOpen={setOpenCancellationModal}
          fieldName="cancellationReason"
          fieldLabel="Cancellation Reason"
          title="Cancellation"
          object={procedure}
          setObject={setProcedure}
          handleCancle={handleCancel}
          required
        />
      </div>
      <aside className={clsx('perform-patient', { 'is-open': showPatient })}>
        <button
          type="button"
          className="perform-patient-toggle"
          aria-label={showPatient ? 'Hide patient details' : 'Show patient details'}
          aria-expanded={showPatient}
          onClick={() => setShowPatient(shown => !shown)}
        >
          {showPatient ? <FaArrowRight /> : <FontAwesomeIcon icon={faUser} />}
        </button>
        {showPatient && (
          <div className="perform-patient-body">
            <PatientSide patient={patient} encounter={encounter} />
          </div>
        )}
      </aside>
    </div>
  );
};
export default Perform;
