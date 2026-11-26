import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus, faPills, faShare } from '@fortawesome/free-solid-svg-icons';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import { extractErrorMessage } from '@/utils';
import { useCreateOrGetPatientPrescriptionMutation } from '@/services/patients/Prescription/patientPrescriptionService';
import { newPatientPrescriptionMedication, newReferralRequest } from '@/types/model-types-constructor-new';
import DetailsModal from '@/pages/encounter/encounter-component/prescription-new/DetailsModal';
import FollowupAppointmentModal from '@/pages/appointments-new/scheduling-screen/components/FollowupAppointmentModal';
import AddEditReferralRequest from '@/pages/encounter/encounter-component/add-referral-request/AddEditReferralRequest';
import { useCreateReferralRequestMutation } from '@/services/medicalsheetsEncounter/referralRequestService';

type DentalSheetActionsProps = {
  patient?: any;
  encounter?: any;
  disabled?: boolean;
};

const DentalSheetActions: React.FC<DentalSheetActionsProps> = ({
  patient,
  encounter,
  disabled = false
}) => {
  const dispatch = useAppDispatch();
  const selectedFacility = useAppSelector(state => state.auth?.tenant?.selectedFacility);
  const selectedDepartment = useAppSelector(state => state.auth?.selectedDepartment);

  const [createOrGetPrescription, prescriptionState] = useCreateOrGetPatientPrescriptionMutation();
  const [createReferral] = useCreateReferralRequestMutation();

  const [medicationOpen, setMedicationOpen] = useState(false);
  const [prescriptionId, setPrescriptionId] = useState<number | null>(null);
  const [medication, setMedication] = useState<any>({ ...newPatientPrescriptionMedication });

  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [referral, setReferral] = useState<any>({ ...newReferralRequest });

  const patientId = Number(patient?.id ?? patient?.key);
  const encounterId = Number(encounter?.id);

  const handleAddMedication = async () => {
    if (!patientId || !encounterId) {
      dispatch(notify({ msg: 'Patient and encounter are required.', sev: 'warning' }));
      return;
    }

    try {
      const result = await createOrGetPrescription({
        patientId,
        encounterId,
        fromFacilityId: selectedFacility?.id ?? encounter?.facilityId ?? null,
        fromDepartmentId: encounter?.departmentId ?? selectedDepartment?.departmentId ?? null,
        urgencyLevel: 'NORMAL'
      } as any).unwrap();

      setPrescriptionId(result?.id ?? null);
      setMedication({
        ...newPatientPrescriptionMedication,
        prescriptionHeaderId: result?.id ?? null
      });
      setMedicationOpen(true);
    } catch (error: any) {
      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'Failed to open a draft prescription',
          sev: 'error'
        })
      );
    }
  };

  const handleSaveReferral = async () => {
    const missingFields: string[] = [];
    if (!referral?.referralType) missingFields.push('Referral Type');
    if (!referral?.toFacilityId) missingFields.push('To Facility');
    if (!referral?.toDepartmentId) missingFields.push('To Department');
    if (!referral?.priority) missingFields.push('Priority');
    if (!referral?.referralReason) missingFields.push('Referral Reason');

    if (missingFields.length) {
      dispatch(
        notify({
          msg: `Please fix the following fields:\n${missingFields
            .map(field => `• ${field}: is required`)
            .join('\n')}`,
          sev: 'warning'
        })
      );
      return false;
    }

    try {
      dispatch(showSystemLoader());
      const fromFacilityId = encounter?.facilityId || selectedFacility?.id;
      const fromDepartmentId = encounter?.departmentId || selectedDepartment?.departmentId;

      await createReferral({
        patientId,
        encounterId,
        referralType: referral.referralType,
        fromFacilityId: fromFacilityId ? Number(fromFacilityId) : null,
        fromDepartmentId: fromDepartmentId ? Number(fromDepartmentId) : null,
        toFacilityId:
          referral?.referralType === 'INTERNAL'
            ? selectedFacility?.id
              ? Number(selectedFacility.id)
              : null
            : referral?.toFacilityId
              ? Number(referral.toFacilityId)
              : null,
        toDepartmentId: referral?.toDepartmentId ? Number(referral.toDepartmentId) : null,
        referralReason: referral.referralReason,
        priority: referral.priority,
        status: 'REQUESTED'
      } as any).unwrap();

      dispatch(notify({ msg: 'Referral created successfully', sev: 'success' }));
      setReferralOpen(false);
      setReferral({ ...newReferralRequest });
      return true;
    } catch (error: any) {
      dispatch(notify({ msg: extractErrorMessage(error) || 'Save Failed', sev: 'warning' }));
      return false;
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  return (
    <>
      <div className="dental-procedure-sheet__actions">
        <MyButton
          disabled={disabled || prescriptionState.isLoading}
          prefixIcon={() => <FontAwesomeIcon icon={faPills} />}
          onClick={handleAddMedication}
        >
          <Translate>Add Medication</Translate>
        </MyButton>
        <MyButton
          disabled={disabled}
          prefixIcon={() => <FontAwesomeIcon icon={faCalendarPlus} />}
          onClick={() => setFollowUpOpen(true)}
        >
          <Translate>Create Follow-up</Translate>
        </MyButton>
        <MyButton
          disabled={disabled}
          prefixIcon={() => <FontAwesomeIcon icon={faShare} />}
          onClick={() => {
            setReferral({ ...newReferralRequest, patientId, encounterId });
            setReferralOpen(true);
          }}
        >
          <Translate>Referral Request</Translate>
        </MyButton>
      </div>

      <DetailsModal
        edit={disabled}
        open={medicationOpen}
        setOpen={setMedicationOpen}
        patient={patient}
        encounter={encounter}
        prescriptionMedication={medication}
        setPrescriptionMedications={setMedication}
        preKey={prescriptionId}
        openToAdd
        medicRefetch={() => undefined}
        setOrderMedication={() => undefined}
        drugKey={null}
        editing={false}
        existingMedications={[]}
      />

      <FollowupAppointmentModal
        from="Encounter"
        isOpen={followUpOpen}
        onClose={() => setFollowUpOpen(false)}
        patient={patient}
        appointmentData={{
          patientId: patientId || null,
          sourceEncounterId: encounterId || null
        }}
        resourceType={null}
        facility={selectedFacility}
        onSave={() => undefined}
        showOnly={false}
        selectedSlot={undefined}
      />

      <AddEditReferralRequest
        open={referralOpen}
        setOpen={setReferralOpen}
        width={900}
        referral={referral}
        setReferral={setReferral}
        encounter={encounter}
        handleSave={handleSaveReferral}
      />
    </>
  );
};

export default DentalSheetActions;
