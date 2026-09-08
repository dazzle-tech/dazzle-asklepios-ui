import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBaby } from '@fortawesome/free-solid-svg-icons';
import '../style.less';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import {
  useCreateFLACCPainScaleMutation,
  useUpdateFLACCPainScaleMutation
} from '@/services/encounters/flaccPainSacoreService';

import {
  FLACCPainScale,
  FLACCPainScaleCreateDTO,
  FLACCPainScaleUpdateDTO
} from '@/types/model-types-new';
import { useEnumOptions } from '@/services/enumsApi';
import { notify } from '@/utils/uiReducerActions';
import { extractErrorMessage } from '@/utils';
import { useAppDispatch } from '@/hooks';

interface NewFlaccProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  patient: any;
  encounter: any;
  edit?: boolean;
  recordToEdit?: FLACCPainScale | null;
  refetch?: () => void;
}

const NewFlacc = ({
  open,
  setOpen,
  patient,
  encounter,
  edit = false,
  recordToEdit,
  refetch
}: NewFlaccProps) => {
  const dispatch = useAppDispatch();
  const [record, setRecord] = useState<any>({});

  const [createFLACC, { isLoading: isCreating }] =
    useCreateFLACCPainScaleMutation();

  const [updateFLACC, { isLoading: isUpdating }] =
    useUpdateFLACCPainScaleMutation();

  const { data: faceFlaccLovQueryResponse } =
    useGetLovValuesByCodeQuery('FLACC_FACE');

  const { data: legsFlaccLovQueryResponse } =
    useGetLovValuesByCodeQuery('FLACC_LEGS');

  const { data: activityFlaccLovQueryResponse } =
    useGetLovValuesByCodeQuery('FLACC_ACTIVITY');

  const { data: cryFlaccLovQueryResponse } =
    useGetLovValuesByCodeQuery('FLACC_CRY');

  const { data: consolabilityFlaccLovQueryResponse } =
    useGetLovValuesByCodeQuery('FLACC_CONSO');

  const painLevelEnum = useEnumOptions('FLACCPainLevel');

  useEffect(() => {
    if (!open) {
      setRecord({});
      return;
    }

    if (edit && recordToEdit) {
      setRecord({
        id: recordToEdit.id,
        patientId: recordToEdit.patientId,
        encounterId: recordToEdit.encounterId,
        faceLov: recordToEdit.faceLov,
        legsLov: recordToEdit.legsLov,
        activityLov: recordToEdit.activityLov,
        cryLov: recordToEdit.cryLov,
        consolabilityLov: recordToEdit.consolabilityLov,
        totalScore: recordToEdit.totalScore
      });
    } else {
      setRecord({
        patientId: patient?.id,
        encounterId: encounter?.id
      });
    }
  }, [open, edit, recordToEdit, patient, encounter]);

  useEffect(() => {
    const selectedValues = [
      {
        key: record.faceLov,
        values: faceFlaccLovQueryResponse?.object ?? []
      },
      {
        key: record.legsLov,
        values: legsFlaccLovQueryResponse?.object ?? []
      },
      {
        key: record.activityLov,
        values: activityFlaccLovQueryResponse?.object ?? []
      },
      {
        key: record.cryLov,
        values: cryFlaccLovQueryResponse?.object ?? []
      },
      {
        key: record.consolabilityLov,
        values: consolabilityFlaccLovQueryResponse?.object ?? []
      }
    ];

    const hasSelection = selectedValues.some(item => item.key);

    if (!hasSelection) {
      setRecord(prev => ({
        ...prev,
        totalScore: undefined,
        painLevel: undefined
      }));
      return;
    }

    const totalScore = selectedValues.reduce((total, item) => {
      if (!item.key) {
        return total;
      }

      const selectedLov = item.values.find(
        lov => lov.key === item.key
      );

      return total + Number(selectedLov?.score ?? 0);
    }, 0);

    let painLevel;

    if (totalScore === 0) {
      painLevel = 'NO_PAIN';
    } else if (totalScore <= 3) {
      painLevel = 'MILD_PAIN';
    } else if (totalScore <= 6) {
      painLevel = 'MODERATE_PAIN';
    } else {
      painLevel = 'SEVERE_PAIN';
    }

    setRecord(prev => ({
      ...prev,
      totalScore,
      painLevel
    }));
  }, [
    record.faceLov,
    record.legsLov,
    record.activityLov,
    record.cryLov,
    record.consolabilityLov,
    faceFlaccLovQueryResponse,
    legsFlaccLovQueryResponse,
    activityFlaccLovQueryResponse,
    cryFlaccLovQueryResponse,
    consolabilityFlaccLovQueryResponse
  ]);

  const handleSave = async () => {
    const validationErrors: string[] = [];

    if (!record.faceLov) {
      validationErrors.push('Face is required.');
    }

    if (!record.legsLov) {
      validationErrors.push('Legs is required.');
    }

    if (!record.activityLov) {
      validationErrors.push('Activity is required.');
    }

    if (!record.cryLov) {
      validationErrors.push('Cry is required.');
    }

    if (!record.consolabilityLov) {
      validationErrors.push('Consolability is required.');
    }

    if (validationErrors.length > 0) {
      dispatch(
        notify({
          msg: validationErrors.join(' '),
          sev: 'warning'
        })
      );
      return;
    }

    try {
      if (edit) {
        const payload: FLACCPainScaleUpdateDTO = {
          id: record.id,
          patientId: record.patientId,
          encounterId: record.encounterId,
          faceLov: record.faceLov,
          legsLov: record.legsLov,
          activityLov: record.activityLov,
          cryLov: record.cryLov,
          consolabilityLov: record.consolabilityLov
        };

        await updateFLACC(payload).unwrap();
      } else {
        const payload: FLACCPainScaleCreateDTO = {
          patientId: record.patientId,
          encounterId: record.encounterId,
          faceLov: record.faceLov,
          legsLov: record.legsLov,
          activityLov: record.activityLov,
          cryLov: record.cryLov,
          consolabilityLov: record.consolabilityLov
        };

        await createFLACC(payload).unwrap();
      }

      setOpen(false);
      setRecord({});
      refetch?.();
    } catch (error) {
      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'Failed to save FLACC record.',
          sev: 'warning'
        })
      );
    }
  };

  const content = (
    <Form fluid>
      <div className="flex-row-5-1">
        <MyInput
          width={120}
          fieldName="faceLov"
          fieldLabel="Face"
          fieldType="select"
          record={record}
          setRecord={setRecord}
          selectData={faceFlaccLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          required
        />

        <MyInput
          width={120}
          fieldName="legsLov"
          fieldLabel="Legs"
          fieldType="select"
          record={record}
          setRecord={setRecord}
          selectData={legsFlaccLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          required
        />

        <MyInput
          width={120}
          fieldName="activityLov"
          fieldLabel="Activity"
          fieldType="select"
          record={record}
          setRecord={setRecord}
          selectData={activityFlaccLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          required
        />
      </div>

      <div className="flex-row-5-1">
        <MyInput
          width={120}
          fieldName="cryLov"
          fieldLabel="Cry"
          fieldType="select"
          record={record}
          setRecord={setRecord}
          selectData={cryFlaccLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          required
        />

        <MyInput
          width={120}
          fieldName="consolabilityLov"
          fieldLabel="Consolability"
          fieldType="select"
          record={record}
          setRecord={setRecord}
          selectData={consolabilityFlaccLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          required
        />
      </div>

      <div className="flex-row-5-1">
        <MyInput
          width={180}
          fieldName="totalScore"
          fieldType="number"
          record={record}
          setRecord={setRecord}
          disabled={true}
          showZero
        />

        <MyInput
          width={180}
          fieldName="painLevel"
          fieldType="select"
          record={record}
          setRecord={setRecord}
          selectData={painLevelEnum ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          disabled={true}
        />
      </div>
    </Form>
  );

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={edit ? 'Edit FLACC Record' : 'Add FLACC Record'}
      actionButtonLabel={edit ? 'Update' : 'Save'}
      size="27vw"
      actionButtonFunction={handleSave}
      isDisabledActionBtn={isCreating || isUpdating}
      position="center"
      steps={[
        {
          title: edit ? 'Edit FLACC Record' : 'Add FLACC Record',
          icon: <FontAwesomeIcon icon={faBaby} />
        }
      ]}
      content={<div dir={dir}>{content}</div>}
    />
  );
};

export default NewFlacc;
