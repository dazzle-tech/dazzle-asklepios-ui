import React, { useEffect, useRef, useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import {
  useAddPatientWarningMutation,
  useUpdatePatientWarningMutation
} from '@/services/encounters/patientWarningsService';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import {
  newPatientWarningsCreateDTO,
  newPatientWarningsUpdateDTO
} from '@/types/model-types-constructor-new';
import { notify } from '@/utils/uiReducerActions';
import { faChevronDown, faChevronUp, faWarning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import { Col, Form, Row } from 'rsuite';
import { resetRefetchEncounter, setRefetchEncounter } from '@/reducers/refetchEncounterState';

const DetailsModal = ({
  open,
  setOpen,
  warning,
  setWarning,
  fetchWarnings,
  patient,
  encounter,
  edit,
  openToAdd
}) => {
  const dispatch = useAppDispatch();

  // State
  const [patientWarningsCreateDTO, setPatientWarningsCreateDTO] = useState({
    ...newPatientWarningsCreateDTO
  });
  const [patientWarningsUpdateDTO, setPatientWarningsUpdateDTO] = useState({
    ...newPatientWarningsUpdateDTO
  });
  const [showAllFields, setShowAllFields] = useState(false);
  const originalWarningRef = useRef<any>(null);
  const savedRef = useRef(false);

  // Lists (LOVs + enums)
  const { data: warningTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_WARNING_TYPS');
  const { data: sourceofinformationLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');
  const severityEnumResponse = useEnumOptions('Severity');

  // Actions (mutations)
  const [addPatientWarning] = useAddPatientWarningMutation();
  const [updatePatientWarning] = useUpdatePatientWarningMutation();

  // extract error message from the error coming from the backend
  const extractErrorMessage = response => {
    try {
      const msg = response?.data?.message;
      if (typeof msg === 'string') return msg.replace(/^error\./i, '');
      return '';
    } catch {
      return '';
    }
  };

  const handleClear = () => {
    setPatientWarningsCreateDTO({ ...newPatientWarningsCreateDTO });
    setPatientWarningsUpdateDTO({ ...newPatientWarningsUpdateDTO });
  };

  const handleUpdateDTOWithSync = (newDto) => {
    setPatientWarningsUpdateDTO(newDto);
    if (warning?.id && open) {
      const { id, ...fieldsToSync } = newDto;
      setWarning(prev => ({ ...prev, ...fieldsToSync }));
    }
  };

  const handleSave = async () => {
    const isCreate = !warning?.id;
    const dto = isCreate ? patientWarningsCreateDTO : patientWarningsUpdateDTO;

    try {
      let errorMsg = '';

      if (!dto.warningType) {
        errorMsg += errorMsg ? ', Warning Type can`t be empty' : 'Warning Type can`t be empty';
      }

      if (!dto.severity) {
        errorMsg += errorMsg ? ', Severity can`t be empty' : 'Severity can`t be empty';
      }

      if (dto.onsetDate && new Date(dto.onsetDate) > new Date()) {
        errorMsg += errorMsg
          ? ', Onset Date can`t be in the future'
          : 'Onset Date can`t be in the future';
      }

      if (errorMsg) {
        dispatch(notify({ msg: errorMsg, sev: 'warning' }));
        return;
      }

      if (isCreate) {
        await addPatientWarning({
          ...patientWarningsCreateDTO,
          patientId: patient?.id,
          encounterId: encounter?.id,
          onsetDate: patientWarningsCreateDTO?.onsetDate
            ? new Date(patientWarningsCreateDTO?.onsetDate).toISOString()
            : ''
        }).unwrap();
        dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
      } else {
        const updatedWarning = await updatePatientWarning({
          id: warning.id,
          dto: {
            ...patientWarningsUpdateDTO,
            onsetDate: patientWarningsUpdateDTO?.onsetDate
              ? new Date(patientWarningsUpdateDTO?.onsetDate).toISOString()
              : ''
          }
        }).unwrap();
        setWarning(updatedWarning);
        dispatch(notify({ msg: 'Updated Successfully', sev: 'success' }));
      }

      savedRef.current = true;
      setOpen(false);
      await fetchWarnings();
      dispatch(resetRefetchEncounter());
      dispatch(setRefetchEncounter(true));
      handleClear();
    } catch (error) {
      const errorMsg = extractErrorMessage(error) || 'Save Failed';
      dispatch(notify({ msg: errorMsg, sev: 'warning' }));
    }
  };

  const conjureFormContent = () => (
    <div
      className={clsx({
        'disabled-panel': edit || warning?.status === 'CANCELLED'
      })}
    >
      <Form fluid>
        <Row className="rows-gap">
          <Col md={8}>
            <MyInput
              fieldType="select"
              fieldLabel="Warning Type"
              selectData={warningTypeLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              fieldName="warningType"
              record={!warning?.id ? patientWarningsCreateDTO : patientWarningsUpdateDTO}
              setRecord={!warning?.id ? setPatientWarningsCreateDTO : handleUpdateDTOWithSync}
              required
              width="100%"
            />
          </Col>
          <Col md={8}>
            <MyInput
              required
              fieldName="warning"
              record={!warning?.id ? patientWarningsCreateDTO : patientWarningsUpdateDTO}
              setRecord={!warning?.id ? setPatientWarningsCreateDTO : handleUpdateDTOWithSync}
              width="100%"
            />
          </Col>
          <Col md={8}>
            <MyInput
              fieldType="select"
              fieldLabel="Severity"
              selectData={severityEnumResponse ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              fieldName="severity"
              record={!warning?.id ? patientWarningsCreateDTO : patientWarningsUpdateDTO}
              setRecord={!warning?.id ? setPatientWarningsCreateDTO : handleUpdateDTOWithSync}
              searchable={false}
              required
              width="100%"
            />
          </Col>
        </Row>
        <br />
        <Row className="rows-gap">
          <Col md={24}>
            <MyButton
              prefixIcon={() => (
                <FontAwesomeIcon icon={showAllFields ? faChevronUp : faChevronDown} />
              )}
              onClick={() => setShowAllFields(!showAllFields)}
              color="var(--primary-blue)"
            >
              {showAllFields ? 'Hide Details' : 'More Details'}
            </MyButton>
          </Col>
        </Row>
        <br />
        {showAllFields && (
          <>
            <Row className="rows-gap">
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldType="date"
                  fieldName="onsetDate"
                  record={!warning?.id ? patientWarningsCreateDTO : patientWarningsUpdateDTO}
                  setRecord={
                    !warning?.id ? setPatientWarningsCreateDTO : setPatientWarningsUpdateDTO
                  }
                  disabled={
                    !warning?.id
                      ? patientWarningsCreateDTO?.onsetDateUndefined
                      : patientWarningsUpdateDTO?.onsetDateUndefined
                  }
                />
              </Col>
              <Col md={12}>
                <MyInput
                  fieldLabel="Undefined"
                  fieldName="onsetDateUndefined"
                  fieldType="checkbox"
                  record={!warning?.id ? patientWarningsCreateDTO : patientWarningsUpdateDTO}
                  setRecord={
                    !warning?.id ? setPatientWarningsCreateDTO : setPatientWarningsUpdateDTO
                  }
                />
              </Col>
            </Row>
            <Row className="rows-gap">
              <Col md={12}>
                <MyInput
                  disabled={
                    !warning?.id
                      ? patientWarningsCreateDTO?.byPatient
                      : patientWarningsUpdateDTO?.byPatient
                  }
                  width="100%"
                  fieldType="select"
                  fieldLabel="Source of Information"
                  selectData={sourceofinformationLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName="sourceOfInformation"
                  record={!warning?.id ? patientWarningsCreateDTO : patientWarningsUpdateDTO}
                  setRecord={
                    !warning?.id ? setPatientWarningsCreateDTO : setPatientWarningsUpdateDTO
                  }
                />
              </Col>
              <Col md={12}>
                <MyInput
                  fieldLabel="BY Patient"
                  fieldName="byPatient"
                  width="100%"
                  fieldType="checkbox"
                  record={!warning?.id ? patientWarningsCreateDTO : patientWarningsUpdateDTO}
                  setRecord={
                    !warning?.id ? setPatientWarningsCreateDTO : setPatientWarningsUpdateDTO
                  }
                />
              </Col>
            </Row>

            <Row className="rows-gap">
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldLabel="Note"
                  fieldType="textarea"
                  fieldName="note"
                  record={!warning?.id ? patientWarningsCreateDTO : patientWarningsUpdateDTO}
                  setRecord={!warning?.id ? setPatientWarningsCreateDTO : handleUpdateDTOWithSync}
                  allowEnterNewLine
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldLabel="Action Taken"
                  fieldType="textarea"
                  fieldName="actionTaken"
                  record={!warning?.id ? patientWarningsCreateDTO : patientWarningsUpdateDTO}
                  setRecord={!warning?.id ? setPatientWarningsCreateDTO : handleUpdateDTOWithSync}
                  allowEnterNewLine
                />
              </Col>
            </Row>
          </>
        )}
      </Form>
    </div>
  );

  // Effects
  useEffect(() => {
    if (open) {
      savedRef.current = false;
      if (warning?.id) {
        originalWarningRef.current = { ...warning };
      } else {
        originalWarningRef.current = null;
      }
    } else {
      if (!savedRef.current && originalWarningRef.current) {
        setWarning(originalWarningRef.current);
      }
      originalWarningRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (warning?.id) {
      setPatientWarningsUpdateDTO({
        id: warning.id,
        warningType: warning.warningType,
        warning: warning.warning,
        severity: warning.severity,
        onsetDateUndefined: warning.onsetDateUndefined,
        onsetDate: warning.onsetDate,
        byPatient: warning.byPatient,
        sourceOfInformation: warning.sourceOfInformation,
        note: warning.note,
        actionTaken: warning.actionTaken
      });
      const hasMoreDetails =
        warning.onsetDate ||
        warning.onsetDateUndefined ||
        warning.byPatient ||
        warning.sourceOfInformation ||
        warning.note ||
        warning.actionTaken;
      setShowAllFields(!!hasMoreDetails);
    } else {
      setPatientWarningsCreateDTO({ ...newPatientWarningsCreateDTO });
      setShowAllFields(false);
    }
  }, [warning?.id, open]);

  useEffect(() => {
    if (warning?.id) {
      if (patientWarningsUpdateDTO.onsetDateUndefined) {
        handleUpdateDTOWithSync({ ...patientWarningsUpdateDTO, onsetDate: '' });
      }
    } else {
      if (patientWarningsCreateDTO.onsetDateUndefined) {
        setPatientWarningsCreateDTO({ ...patientWarningsCreateDTO, onsetDate: '' });
      }
    }
  }, [patientWarningsCreateDTO.onsetDateUndefined, patientWarningsUpdateDTO.onsetDateUndefined]);

  useEffect(() => {
    if (warning?.id) {
      if (patientWarningsUpdateDTO.byPatient) {
        handleUpdateDTOWithSync({ ...patientWarningsUpdateDTO, sourceOfInformation: null });
      }
    } else {
      if (patientWarningsCreateDTO.byPatient) {
        setPatientWarningsCreateDTO({ ...patientWarningsCreateDTO, sourceOfInformation: null });
      }
    }
  }, [patientWarningsCreateDTO.byPatient, patientWarningsUpdateDTO.byPatient]);

  useEffect(() => {
    if (openToAdd) handleClear();
  }, [openToAdd]);

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={!warning?.id ? 'Add Warning' : 'Edit Warning'}
      actionButtonFunction={handleSave}
      isDisabledActionBtn={edit}
      size="40vw"
      position="right"
      steps={[
        {
          title: 'Warning',
          icon: <FontAwesomeIcon icon={faWarning} />,
          footer: <MyButton onClick={handleClear}>Clear</MyButton>
        }
      ]}
      content={<div dir={dir}>{conjureFormContent()}</div>}
    />
  );
};

export default DetailsModal;
