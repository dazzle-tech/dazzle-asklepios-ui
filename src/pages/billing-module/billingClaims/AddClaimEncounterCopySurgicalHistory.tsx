
import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBedPulse } from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useCreateClaimEncounterCopySurgicalHistoryMutation, useUpdateClaimEncounterCopySurgicalHistoryMutation } from '@/services/billing/claimEncounterCopySurgicalHistoryService';

interface Props {
  open: boolean;
  setOpen: () => void;
  initialData: any;
  claimEncounterCopyId: number;
}

interface SurgicalHistoryForm {
  id?: number;
  surgery: string;
  facility: string;
  anesthesiaType: string | null;
  complications: string[];
  implantsOrDevicesDescription: string;
  hasImplantsOrDevices: boolean;
  dateOfSurgery: Date | string | number | null;
  adverseReactionsToAnesthesia: string[];
  patientIsFree: boolean;
  freeText: string | null;
}

const emptySurgicalHistoryForm: SurgicalHistoryForm = {
  surgery: '',
  facility: '',
  anesthesiaType: null,
  complications: [],
  implantsOrDevicesDescription: '',
  hasImplantsOrDevices: false,
  dateOfSurgery: null,
  adverseReactionsToAnesthesia: [],
  patientIsFree: false,
  freeText: null
};

const toDate = (
  value: Date | string | number | null | undefined
) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const date = value instanceof Date
    ? new Date(value)
    : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const toNoonTimestamp = (
  value: Date | string | number | null | undefined
) => {
  const date = toDate(value);

  if (!date) {
    return null;
  }

  date.setHours(12, 0, 0, 0);

  return date.getTime();
};

const toStringArray = (
  value: string | string[] | null | undefined
) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return value
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
};

const stripUndefined = (obj: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  );

const AddClaimEncounterCopySurgicalHistory = ({
  open,
  setOpen,
  initialData,
  claimEncounterCopyId
}: Props) => {
  const dispatch = useAppDispatch();

  const [formData, setFormData] =
    useState<SurgicalHistoryForm>(
      emptySurgicalHistoryForm
    );

  const [openImplants, setOpenImplants] = useState({
    open: false
  });

  const { data: anesthesiaLov } =
    useGetLovValuesByCodeQuery('ANESTH_TYPES');

  const { data: complicationsLov } =
    useGetLovValuesByCodeQuery('PROC_COMPLIC');

  const { data: adverseLov } =
    useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');

  const [
    createSurgicalHistory
  ] =
    useCreateClaimEncounterCopySurgicalHistoryMutation();

  const [
    updateSurgicalHistory
  ] =
    useUpdateClaimEncounterCopySurgicalHistoryMutation();

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...emptySurgicalHistoryForm,
        ...stripUndefined(initialData),
        patientIsFree: initialData.patientIsFree ?? false,
        dateOfSurgery: toDate(
          initialData.dateOfSurgery
        ),
        adverseReactionsToAnesthesia:
          toStringArray(
            initialData.adverseReactionsToAnesthesia
          ),
        complications: toStringArray(
          initialData.complications
        )
      });

      setOpenImplants({
        open: initialData.hasImplantsOrDevices ?? false
      });

      return;
    }

    setFormData({
      ...emptySurgicalHistoryForm
    });

    setOpenImplants({
      open: false
    });
  }, [initialData, open]);

  const validateBeforeSave = () => {
    const errors: string[] = [];

    if (formData.patientIsFree) {
      if (!formData.freeText?.trim()) {
        errors.push('Free Text is required');
      }

      return errors;
    }

    if (!formData.surgery?.trim()) {
      errors.push('Surgery is required');
    }

    const surgeryDateValue =
      toDate(formData.dateOfSurgery);

    if (!surgeryDateValue) {
      errors.push('Date of surgery is required');
    } else {
      const surgeryDate =
        new Date(surgeryDateValue);

      surgeryDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (surgeryDate > today) {
        errors.push(
          'Date of surgery cannot be in the future'
        );
      }
    }

    if (!formData.facility?.trim()) {
      errors.push('Facility is required');
    }

    if (!formData.anesthesiaType) {
      errors.push('Anesthesia type is required');
    }

    if (
      openImplants.open &&
      !formData.implantsOrDevicesDescription?.trim()
    ) {
      errors.push(
        'Implants/Devices Description is required'
      );
    }

    return errors;
  };

  const handleSave = async () => {
    const errors = validateBeforeSave();

    if (errors.length) {
      dispatch(
        notify({
          msg: errors
            .map(error => `• ${error}`)
            .join('\n'),
          sev: 'warning'
        })
      );

      return;
    }

    const isFree =
      formData.patientIsFree === true;

    const payload = {
      surgery: isFree
        ? null
        : formData.surgery?.trim() || null,

      facility: isFree
        ? null
        : formData.facility?.trim() || null,

      anesthesiaType: isFree
        ? null
        : formData.anesthesiaType || null,

      dateOfSurgery: isFree
        ? null
        : toNoonTimestamp(
            formData.dateOfSurgery
          ),

      complications: isFree
        ? null
        : formData.complications?.length
          ? formData.complications.join(',')
          : null,

      adverseReactionsToAnesthesia: isFree
        ? null
        : formData.adverseReactionsToAnesthesia?.length
          ? formData.adverseReactionsToAnesthesia.join(',')
          : null,

      hasImplantsOrDevices: isFree
        ? null
        : openImplants.open,

      implantsOrDevicesDescription:
        isFree
          ? null
          : openImplants.open
            ? formData
                .implantsOrDevicesDescription
                ?.trim() || null
            : null,

      patientIsFree: isFree,

      freeText: isFree
        ? formData.freeText?.trim() || null
        : null
    };

    try {
      if (formData.id) {
        await updateSurgicalHistory({
          id: formData.id,
          ...payload
        }).unwrap();

        dispatch(
          notify({
            msg: 'Surgical history updated successfully',
            sev: 'success'
          })
        );
      } else {
        await createSurgicalHistory({
          claimEncounterCopyId,
          ...payload
        }).unwrap();

        dispatch(
          notify({
            msg: 'Surgical history added successfully',
            sev: 'success'
          })
        );
      }

      setOpen();

      setFormData({
        ...emptySurgicalHistoryForm
      });

      setOpenImplants({
        open: false
      });
    } catch (error: any) {
      const message =
        error?.data?.message ||
        error?.data?.detail ||
        error?.error ||
        'Failed to save Surgical History.';

      dispatch(
        notify({
          msg: message,
          sev: 'error'
        })
      );
    }
  };

  const content = (
    <Form
      fluid
      layout="inline"
      className="fields-container"
    >
      <MyInput
        width="14vw"
        column
        fieldLabel="Patient Is Free"
        fieldType="checkbox"
        fieldName="patientIsFree"
        record={formData}
        setRecord={setFormData}
      />

      {formData.patientIsFree ? (
        <MyInput
          width="28vw"
          column
          required
          fieldLabel="Free Text"
          fieldType="textarea"
          fieldName="freeText"
          record={formData}
          setRecord={setFormData}
        />
      ) : (
        <>
          <MyInput
            width="14vw"
            column
            required
            fieldLabel="Surgery"
            fieldName="surgery"
            record={formData}
            setRecord={setFormData}
          />

          <MyInput
            width="14vw"
            column
            required
            fieldLabel="Date of surgery"
            fieldType="date"
            fieldName="dateOfSurgery"
            disableFutureDates
            record={formData}
            setRecord={setFormData}
          />

          <MyInput
            width="14vw"
            column
            required
            fieldLabel="Facility"
            fieldName="facility"
            record={formData}
            setRecord={setFormData}
          />

          <MyInput
            width="14vw"
            column
            required
            fieldLabel="Anesthesia Type"
            fieldType="select"
            fieldName="anesthesiaType"
            selectData={anesthesiaLov?.object ?? []}
            selectDataLabel="lovDisplayVale"
            disableByField="isValid"
            selectDataValue="key"
            record={formData}
            setRecord={setFormData}
          />

          <MyInput
            width="28vw"
            column
            fieldLabel="Complications"
            fieldType="checkPicker"
            fieldName="complications"
            selectData={complicationsLov?.object ?? []}
            selectDataLabel="lovDisplayVale"
            disableByField="isValid"
            selectDataValue="key"
            record={formData}
            setRecord={setFormData}
          />

          <MyInput
            width="28vw"
            column
            fieldLabel="Complications Details"
            fieldType="textarea"
            fieldName="complicationsDetails"
            record={{
              ...formData,
              complicationsDetails: (
                formData.complications || []
              )
                .map(selectedKey => {
                  const item =
                    (
                      complicationsLov?.object ?? []
                    ).find(
                      lov =>
                        lov.key === selectedKey
                    );

                  return (
                    item?.lovDisplayVale ||
                    selectedKey
                  );
                })
                .filter(Boolean)
                .join(', ')
            }}
            setRecord={() => {}}
            disabled
          />

          <MyInput
            width="28vw"
            column
            fieldLabel="Adverse Reactions"
            fieldType="checkPicker"
            fieldName="adverseReactionsToAnesthesia"
            selectData={adverseLov?.object ?? []}
            selectDataLabel="lovDisplayVale"
            disableByField="isValid"
            selectDataValue="key"
            record={formData}
            setRecord={setFormData}
          />

          <MyInput
            width="28vw"
            column
            fieldLabel="Adverse Reactions Details"
            fieldType="textarea"
            fieldName="adverseReactionsDetails"
            record={{
              ...formData,
              adverseReactionsDetails: (
                formData.adverseReactionsToAnesthesia ||
                []
              )
                .map(selectedKey => {
                  const item =
                    (
                      adverseLov?.object ?? []
                    ).find(
                      lov =>
                        lov.key === selectedKey
                    );

                  return (
                    item?.lovDisplayVale ||
                    selectedKey
                  );
                })
                .filter(Boolean)
                .join(', ')
            }}
            setRecord={() => {}}
            disabled
          />

          <MyInput
            width="14vw"
            column
            fieldLabel="Implants or Devices"
            fieldType="checkbox"
            fieldName="open"
            record={openImplants}
            setRecord={setOpenImplants}
          />

          <MyInput
            width="14vw"
            column
            fieldLabel="Implants/Devices Description"
            fieldName="implantsOrDevicesDescription"
            record={formData}
            setRecord={setFormData}
            disabled={!openImplants.open}
            required={openImplants.open}
          />
        </>
      )}
    </Form>
  );

  const direction =
    localStorage.getItem('direction') || 'LTR';

  const dir =
    direction === 'RTL' ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={
        initialData
          ? 'Edit Surgical History'
          : 'Add Surgical History'
      }
      steps={[
        {
          title: 'Surgical History',
          icon: (
            <FontAwesomeIcon
              icon={faBedPulse}
            />
          )
        }
      ]}
      actionButtonFunction={handleSave}
      position="right"
      size="33vw"
      content={
        <div dir={dir}>
          {content}
        </div>
      }
    />
  );
};

export default AddClaimEncounterCopySurgicalHistory;
