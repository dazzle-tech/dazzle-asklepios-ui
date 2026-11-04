import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks';
import { Form } from 'rsuite';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyModal from '@/components/MyModal/MyModal';
import './styles.less';
import { faSignOutAlt, faFileMedical  } from '@fortawesome/free-solid-svg-icons';
import { useEnumOptions } from '@/services/enumsApi';
import { PatientEncounterDischarge } from '@/types/model-types-new';
import { newPatientEncounterDischarge } from '@/types/model-types-constructor-new';
import { useMarkBedAsInCleaningMutation } from '@/services/setup/room/bedService';
import MyInput from '@/components/MyInput';
import { useLazyGetActiveAssignmentByEncounterIdQuery } from '@/services/patients/emergency/encounterAssignToBedService';
import { useDischargeEncounterMutation } from '@/services/encounters/patientEncounterService';
import dayjs from 'dayjs';
import MyButton from '@/components/MyButton/MyButton';
import DischargeReportModal from './DischargeReportModal';

const EncounterDischarge = ({
  open,
  setOpen,
  encounter,
  refetch = null,
  onSuccess
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  encounter: any;
  refetch?: (() => void) | null;
  onSuccess?: () => void;
}) => {
  const dispatch = useAppDispatch();

  const [localEncounter, setLocalEncounter] = useState<PatientEncounterDischarge>({
    ...newPatientEncounterDischarge,
    dischargeAt: new Date()
  });

  const [dischargeEncounter] = useDischargeEncounterMutation();
  const [markBedAsInCleaning] = useMarkBedAsInCleaningMutation();
  const [getActiveAssignmentByEncounterId] = useLazyGetActiveAssignmentByEncounterIdQuery();

  const dischargeTypeEnum = useEnumOptions('DischargeType');

  const handleCompleteEncounter = async () => {
    try {
      const encounterId = encounter?.id ?? encounter?.key;

      if (!encounterId) {
        dispatch(notify({ msg: 'Encounter ID is required', sev: 'error' }));
        return;
      }

      const numericId = typeof encounterId === 'string' ? Number(encounterId) : encounterId;

      if (!localEncounter.dischargeType) {
        dispatch(notify({ msg: 'Discharge Type is required', sev: 'error' }));
        return;
      }

      if (!localEncounter.dischargeAt) {
        dispatch(notify({ msg: 'Discharge Date Time is required', sev: 'error' }));
        return;
      }

      const dischargePayload: PatientEncounterDischarge = {
        encounterId: numericId,
        dischargeType: localEncounter.dischargeType,
        dischargeAt: dayjs(localEncounter.dischargeAt).format('YYYY-MM-DDTHH:mm:ss')
      };

      let bedId: number | null = null;

      try {
        const activeAssignment = await getActiveAssignmentByEncounterId({
          encounterId: numericId
        }).unwrap();

        bedId = activeAssignment?.bedId ?? null;
      } catch (bedError: any) {
        const isNotFoundError =
          bedError?.status === 404 ||
          bedError?.originalStatus === 404 ||
          bedError?.data?.status === 404;

        if (!isNotFoundError) {
          dispatch(
            notify({
              msg: 'Failed to load active bed assignment before discharge',
              sev: 'warning'
            })
          );
        }
      }

      await dischargeEncounter({
        id: numericId,
        body: dischargePayload
      }).unwrap();

      if (bedId) {
        try {
          await markBedAsInCleaning({ id: bedId }).unwrap();
        } catch {
          dispatch(
            notify({
              msg: 'Encounter discharged but bed status update failed',
              sev: 'warning'
            })
          );
        }
      }

      dispatch(notify({ msg: 'Encounter Discharged Successfully', sev: 'success' }));
      setOpen(false);

      if (refetch) {
        refetch();
      }

      onSuccess?.();
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.detail ||
        error?.message ||
        'An error occurred while discharging the encounter';

      dispatch(notify({ msg: errorMessage, sev: 'error' }));
    }
  };

  const [openReportModal, setOpenReportModal] = useState(false);
  const [reportEncounterId, setReportEncounterId] = useState<number | null>(null);

  const handleGenerateDischargeReport = () => {
    const encounterId = encounter?.id ?? encounter?.key;

    if (!encounterId) {
      dispatch(notify({ msg: 'Encounter ID is required', sev: 'error' }));
      return;
    }

    const numericId = typeof encounterId === 'string' ? Number(encounterId) : encounterId;

    setReportEncounterId(numericId);
    setOpenReportModal(true);
  };

  const content = (
    <Form fluid layout="inline" className="encounter-discharge-form">
      <MyInput
        column
        width={300}
        fieldLabel="Discharge Type"
        fieldType="select"
        fieldName="dischargeType"
        selectData={dischargeTypeEnum ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={localEncounter}
        setRecord={setLocalEncounter}
        searchable={false}
      />

      <MyInput
        column
        width={300}
        fieldLabel="Date Time"
        fieldType="datetime"
        fieldName="dischargeAt"
        record={localEncounter}
        setRecord={setLocalEncounter}
      />
       <MyButton
        prefixIcon={() => <FontAwesomeIcon icon={faFileMedical} />}
        onClick={handleGenerateDischargeReport}
        appearance="ghost"
      >
        Generate Discharge Report
      </MyButton>
    </Form>
  );

  useEffect(() => {
    if (encounter) {
      const encounterId = encounter?.id ?? encounter?.key;

      setLocalEncounter({
        ...newPatientEncounterDischarge,
        encounterId: encounterId ? Number(encounterId) : null,
        dischargeType: encounter?.dischargeType ?? null,
        dischargeAt: encounter?.dischargeAt ? new Date(encounter.dischargeAt) : new Date()
      });
    }
  }, [encounter]);

  return (
    <>
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Disposition"
      actionButtonFunction={handleCompleteEncounter}
      position="center"
      size="28vw"
      bodyheight="70vh"
      steps={[
        {
          title: 'Disposition',
          icon: <FontAwesomeIcon icon={faSignOutAlt} />
        }
      ]}
      content={content}
    />
    <DischargeReportModal
        open={openReportModal}
        setOpen={setOpenReportModal}
        encounterId={reportEncounterId}
      />
      </>
  );
};

export default EncounterDischarge;