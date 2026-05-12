import React, { useEffect, useState } from 'react';
import './styles.less';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import {
  faPersonDotsFromLine,
  faChevronDown,
  faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import { Col, Form, Row } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { resetRefetchEncounter, setRefetchEncounter } from '@/reducers/refetchEncounterState';

import clsx from 'clsx';
import {
  useAddPatientAllergyMutation,
  useUpdatePatientAllergyMutation
} from '@/services/encounters/patientAllergiesService';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllergensByTypeQuery } from '@/services/setup/allergensService';
import { useGetAllMedicationCategoriesClassesQuery } from '@/services/setup/medication-categories/MedicationCategoriesClassService';
import { useGetActiveIngredientsByDrugClassQuery } from '@/services/setup/activeIngredients/activeIngredientsService';
import { PatientAllergiesCreateDTO, PatientAllergiesUpdateDTO } from '@/types/model-types-new';
import {
  newPatientAllergiesCreateDTO,
  newPatientAllergiesUpdateDTO
} from '@/types/model-types-constructor-new';
import { extractPaginationFromLink } from '@/utils/paginationHelper';

const DetailsModal = ({
  open,
  setOpen,
  allerges,
  setAllerges,
  edit,
  patient,
  encounter,
  fetchallerges,
  openToAdd
}) => {
  const dispatch = useAppDispatch();
  const [patientAllergiesCreateDTO, setPatientAllergiesCreateDTO] =
    useState<PatientAllergiesCreateDTO>({
      ...newPatientAllergiesCreateDTO
    });
  const [patientAllergiesUpdateDTO, setPatientAllergiesUpdateDTO] =
    useState<PatientAllergiesUpdateDTO>({
      ...newPatientAllergiesUpdateDTO
    });
  const [reactions, setReactions] = useState({ reactions: [] });
  const [showAllFields, setShowAllFields] = useState(false);
  const [allergenPaginationParams, setAllergenPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: 'name,asc'
  });
  const [allergenOptions, setAllergenOptions] = useState<any[]>([]);
  // fetch data
  const { data: onsetLovQueryResponse } = useGetLovValuesByCodeQuery('ONSET');
  const { data: reactionLovQueryResponse } = useGetLovValuesByCodeQuery('ALLRGY_REACTION_TYP');
  const { data: treatmentstrategyLovQueryResponse } = useGetLovValuesByCodeQuery('TREAT_STRATGY');
  const { data: sourceofinformationLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');
  const { data: allgPropnLovQueryResponse } = useGetLovValuesByCodeQuery('ALLG_PROPN');
  const { data: criticalityLovQueryResponse } = useGetLovValuesByCodeQuery('CRITICALITY');
  const selectedAllergenType = allerges?.id
    ? patientAllergiesUpdateDTO?.allergenType
    : patientAllergiesCreateDTO?.allergenType;

  const { data: allergensListResponse, isFetching: isAllergensFetching } = useGetAllergensByTypeQuery(
    {
      type: selectedAllergenType,
      page: allergenPaginationParams.page,
      size: allergenPaginationParams.size,
      sort: allergenPaginationParams.sort
    },
    {
      skip: !selectedAllergenType
    }
  );
  const { data: medicationClassesListResponse, isLoading: isMedicationClassesLoaded } =
    useGetAllMedicationCategoriesClassesQuery({});
  const drugClassId = !allerges?.id
    ? patientAllergiesCreateDTO.medicationClassId
    : patientAllergiesUpdateDTO.medicationClassId;

  const { data: activeIngredientsAll } = useGetActiveIngredientsByDrugClassQuery(
    { drugClassIds: drugClassId ? [drugClassId] : [] },
    { skip: !drugClassId }
  );
  // fetch enum lists
  const allergyTypeEnumResponse = useEnumOptions('AllergenTypes');
  const severityEnumResponse = useEnumOptions('Severity');
  // actions
  const [addPatientAllergy] = useAddPatientAllergyMutation();
  const [updatePatientAllergy] = useUpdatePatientAllergyMutation();
  // allergen type
  const isMedication = allerges?.id
    ? patientAllergiesUpdateDTO?.allergenType === 'MEDICATION'
    : patientAllergiesCreateDTO?.allergenType === 'MEDICATION';
  const allergenHasMore = Boolean(allergensListResponse?.links?.next);
  const selectedAllergenId = allerges?.id
    ? patientAllergiesUpdateDTO?.allergenId
    : patientAllergiesCreateDTO?.allergenId;
  const selectedAllergenOption = (() => {
    if (!selectedAllergenType) return null;

    const allergenName =
      (allerges as any)?.allergenName ||
      (allerges as any)?.allergen?.name ||
      (allerges as any)?.allergyObject?.allergenName;

    if (!selectedAllergenId || !allergenName) return null;

    return {
      id: selectedAllergenId,
      name: allergenName
    };
  })();

  useEffect(() => {
    setAllergenPaginationParams(prev => ({
      ...prev,
      page: 0
    }));
    setAllergenOptions([]);

    if (!selectedAllergenType) {
      const resetAllergenRecord = !allerges?.id
        ? setPatientAllergiesCreateDTO
        : setPatientAllergiesUpdateDTO;

      resetAllergenRecord(prev => ({
        ...prev,
        allergenId: undefined
      }));
    }
  }, [selectedAllergenType, open]);

  useEffect(() => {
    if (!selectedAllergenType) {
      setAllergenOptions([]);
      return;
    }

    if (!allergensListResponse?.data) return;

    const rows = allergensListResponse.data ?? [];

    setAllergenOptions(prev => {
      if (allergenPaginationParams.page === 0) {
        return rows;
      }

      const seen = new Set(prev.map((item: any) => String(item?.id)));
      const merged = [...prev];

      rows.forEach((item: any) => {
        if (!seen.has(String(item?.id))) {
          merged.push(item);
        }
      });

      return merged;
    });
  }, [open, selectedAllergenType, allergensListResponse?.data, allergenPaginationParams.page]);

  useEffect(() => {
    if (!selectedAllergenType || !selectedAllergenId || !allergensListResponse?.links?.next) return;

    const foundInOptions = allergenOptions.some(item => String(item?.id) === String(selectedAllergenId));

    if (!foundInOptions) {
      const { page } = extractPaginationFromLink(allergensListResponse.links.next);
      setAllergenPaginationParams(prev => ({
        ...prev,
        page
      }));
    }
  }, [
    selectedAllergenId,
    allergenOptions,
    allergenPaginationParams.page,
    allergensListResponse?.links?.next
  ]);

const isOtherType = allerges?.id
  ? patientAllergiesUpdateDTO?.allergenType === 'OTHER'
  : patientAllergiesCreateDTO?.allergenType === 'OTHER';

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <div
            className={clsx({
              'disabled-panel': edit || allerges.statusLvalue?.valueCode === 'ARS_CANCEL'
            })}
          >
            <Form fluid>
              <Form fluid layout="inline">
                <MyInput
                  fieldType="select"
                  fieldLabel="Allergy Type"
                  selectData={allergyTypeEnumResponse ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  fieldName="allergenType"
                  record={!allerges?.id ? patientAllergiesCreateDTO : patientAllergiesUpdateDTO}
                  setRecord={
                    !allerges?.id ? setPatientAllergiesCreateDTO : setPatientAllergiesUpdateDTO
                  }
                  searchable={false}
                  required
                />
                {isMedication ? (
                  <>
                    <MyInput
                      fieldType="select"
                      fieldLabel="Medication Class"
                      selectData={medicationClassesListResponse ?? []}
                      selectDataLabel="name"
                      selectDataValue="id"
                      fieldName="medicationClassId"
                      record={!allerges?.id ? patientAllergiesCreateDTO : patientAllergiesUpdateDTO}
                      setRecord={
                        !allerges?.id ? setPatientAllergiesCreateDTO : setPatientAllergiesUpdateDTO
                      }
                      loading={isMedicationClassesLoaded}
                      required
                    />

                    <MyInput
                      fieldType="checkPicker"
                      fieldLabel="Active Ingredient"
                      selectData={activeIngredientsAll?.data ?? []}
                      selectDataLabel="name"
                      selectDataValue="id"
                      fieldName="activeIngredients"
                      record={!allerges?.id ? patientAllergiesCreateDTO : patientAllergiesUpdateDTO}
                      setRecord={
                        !allerges?.id ? setPatientAllergiesCreateDTO : setPatientAllergiesUpdateDTO
                      }
                      loading={isMedicationClassesLoaded}
                    />
                  </>
                ) : isOtherType ? (
                  <MyInput
                    fieldType="text"
                    fieldLabel="Allergen"
                    fieldName="allergenName"
                    record={!allerges?.id ? patientAllergiesCreateDTO : patientAllergiesUpdateDTO}
                    setRecord={
                      !allerges?.id ? setPatientAllergiesCreateDTO : setPatientAllergiesUpdateDTO
                    }
                    required
                  />
                ) : (
                  <MyInput
                    key={`allergen-${selectedAllergenType || 'none'}`}
                    fieldType="selectPagination"
                    fieldLabel="Allergen"
                    selectData={allergenOptions}
                    selectDataLabel="name"
                    selectDataValue="id"
                    fieldName="allergenId"
                    record={!allerges?.id ? patientAllergiesCreateDTO : patientAllergiesUpdateDTO}
                    setRecord={
                      !allerges?.id ? setPatientAllergiesCreateDTO : setPatientAllergiesUpdateDTO
                    }
                    searchable
                    loading={Boolean(selectedAllergenType && isAllergensFetching)}
                    hasMore={allergenHasMore}
                    onFetchMore={() => {
                      if (allergensListResponse?.links?.next) {
                        const { page } = extractPaginationFromLink(allergensListResponse.links.next);
                        setAllergenPaginationParams(prev => ({
                          ...prev,
                          page
                        }));
                      }
                    }}
                    required
                  />
                )}
                <MyInput
                  fieldType="select"
                  fieldLabel="Severity"
                  selectData={severityEnumResponse ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  fieldName="severity"
                  record={!allerges?.id ? patientAllergiesCreateDTO : patientAllergiesUpdateDTO}
                  setRecord={
                    !allerges?.id ? setPatientAllergiesCreateDTO : setPatientAllergiesUpdateDTO
                  }
                  searchable={false}
                  required
                />
              </Form>
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
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        fieldType="select"
                        fieldLabel="Criticality"
                        selectData={criticalityLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName="criticality"
                        record={
                          !allerges?.id ? patientAllergiesCreateDTO : patientAllergiesUpdateDTO
                        }
                        setRecord={
                          !allerges?.id
                            ? setPatientAllergiesCreateDTO
                            : setPatientAllergiesUpdateDTO
                        }
                        searchable={false}
                      />
                    </Col>
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        fieldName="certainty"
                        record={
                          !allerges?.id ? patientAllergiesCreateDTO : patientAllergiesUpdateDTO
                        }
                        setRecord={
                          !allerges?.id
                            ? setPatientAllergiesCreateDTO
                            : setPatientAllergiesUpdateDTO
                        }
                      />
                    </Col>
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        fieldType="select"
                        fieldLabel="Treatment Strategy"
                        selectData={treatmentstrategyLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName="treatmentStrategy"
                        record={
                          !allerges?.id ? patientAllergiesCreateDTO : patientAllergiesUpdateDTO
                        }
                        setRecord={
                          !allerges?.id
                            ? setPatientAllergiesCreateDTO
                            : setPatientAllergiesUpdateDTO
                        }
                        searchable={false}
                      />
                    </Col>
                  </Row>
                  <Row className="rows-gap">
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        fieldType="select"
                        fieldLabel="Onset"
                        selectData={onsetLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName="onset"
                        record={
                          !allerges?.id ? patientAllergiesCreateDTO : patientAllergiesUpdateDTO
                        }
                        setRecord={
                          !allerges?.id
                            ? setPatientAllergiesCreateDTO
                            : setPatientAllergiesUpdateDTO
                        }
                        searchable={false}
                      />
                    </Col>
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        fieldType="date"
                        fieldName="onsetDate"
                        record={
                          !allerges?.id ? patientAllergiesCreateDTO : patientAllergiesUpdateDTO
                        }
                        setRecord={
                          !allerges?.id
                            ? setPatientAllergiesCreateDTO
                            : setPatientAllergiesUpdateDTO
                        }
                        disabled={
                          !allerges?.id
                            ? patientAllergiesCreateDTO?.onsetDateUndefined
                            : patientAllergiesUpdateDTO?.onsetDateUndefined
                        }
                      />
                    </Col>
                    <Col md={8}>
                      <MyInput
                        fieldLabel="Undefined"
                        fieldName="onsetDateUndefined"
                        width="100%"
                        fieldType="checkbox"
                        record={
                          !allerges?.id ? patientAllergiesCreateDTO : patientAllergiesUpdateDTO
                        }
                        setRecord={
                          !allerges?.id
                            ? setPatientAllergiesCreateDTO
                            : setPatientAllergiesUpdateDTO
                        }
                      />
                    </Col>
                  </Row>
                  <Row className="rows-gap">
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        fieldType="select"
                        fieldLabel="Type of Propensity"
                        selectData={allgPropnLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName="typeOfPropensity"
                        record={
                          !allerges?.id ? patientAllergiesCreateDTO : patientAllergiesUpdateDTO
                        }
                        setRecord={
                          !allerges?.id
                            ? setPatientAllergiesCreateDTO
                            : setPatientAllergiesUpdateDTO
                        }
                        searchable={false}
                      />
                    </Col>
                    <Col md={8}>
                      <Form fluid>
                        <MyInput
                          disabled={
                            !allerges?.id
                              ? patientAllergiesCreateDTO?.byPatient
                              : patientAllergiesUpdateDTO?.byPatient
                          }
                          width="100%"
                          fieldType="select"
                          fieldLabel="Source of Information"
                          selectData={sourceofinformationLovQueryResponse?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          fieldName="sourceOfInformation"
                          record={
                            !allerges?.id ? patientAllergiesCreateDTO : patientAllergiesUpdateDTO
                          }
                          setRecord={
                            !allerges?.id
                              ? setPatientAllergiesCreateDTO
                              : setPatientAllergiesUpdateDTO
                          }
                        />
                      </Form>
                    </Col>
                    <Col md={8}>
                      <Form fluid>
                        <MyInput
                          fieldLabel="BY Patient"
                          fieldName="byPatient"
                          width="100%"
                          fieldType="checkbox"
                          record={
                            !allerges?.id ? patientAllergiesCreateDTO : patientAllergiesUpdateDTO
                          }
                          setRecord={
                            !allerges?.id
                              ? setPatientAllergiesCreateDTO
                              : setPatientAllergiesUpdateDTO
                          }
                        />
                      </Form>
                    </Col>
                  </Row>
                  <Row className="rows-gap">
                    <Row>
                      <Col md={24}>
                        <MyInput
                          width="100%"
                          fieldType="checkPicker"
                          fieldLabel="Allergic Reactions"
                          selectData={reactionLovQueryResponse?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          fieldName="reactions"
                          record={reactions}
                          setRecord={setReactions}
                        />
                      </Col>
                    </Row>
                    <MyInput
                      width="100%"
                      fieldLabel="Note"
                      fieldType="textarea"
                      fieldName="note"
                      height={90}
                      record={!allerges?.id ? patientAllergiesCreateDTO : patientAllergiesUpdateDTO}
                      setRecord={
                        !allerges?.id ? setPatientAllergiesCreateDTO : setPatientAllergiesUpdateDTO
                      }
                      allowEnterNewLine
                    />
                  </Row>
                </>
              )}
            </Form>
          </div>
        );
    }
  };

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

  // handle clear data
  const handleClear = () => {
    setPatientAllergiesCreateDTO({
      ...newPatientAllergiesCreateDTO,
      allergenId: undefined
    });
    setPatientAllergiesUpdateDTO({
      ...newPatientAllergiesUpdateDTO,
      allergenId: undefined
    });
  };

    const handleSave = async () => {
      if (!allerges?.id) {
        try {
          let errorMsg = '';

          if (!patientAllergiesCreateDTO.allergenType) {
            errorMsg += 'Allergen Type Can`t be empty';
          }

          if (!patientAllergiesCreateDTO.severity) {
            errorMsg += errorMsg ? ', Severity Can`t be empty' : 'Severity Can`t be empty';
          }

          // 🔥 NEW VALIDATION (OTHER)
          if (isOtherType) {
            const name = (patientAllergiesCreateDTO.allergenName || '').trim();
            if (!name) {
              errorMsg += errorMsg
                ? ', Allergen free text is required'
                : 'Allergen free text is required';
            }
          }

          if (
            patientAllergiesCreateDTO.onsetDate &&
            new Date(patientAllergiesCreateDTO.onsetDate) > new Date()
          ) {
            errorMsg += errorMsg
              ? ', Onset Date can`t be in the future'
              : 'Onset Date can`t be in the future';
          }

          if (!errorMsg) {
            const payload = {
              ...patientAllergiesCreateDTO,
              allergicReactions: reactions.reactions.join(', '),
              patientId: patient?.id,
              encounterId: encounter?.id,
              onsetDate: patientAllergiesCreateDTO?.onsetDate
                ? new Date(patientAllergiesCreateDTO?.onsetDate).toISOString()
                : '',

              // 🔥 أهم سطر
              allergenId: isOtherType ? null : patientAllergiesCreateDTO.allergenId,
              allergenName: isOtherType
                ? patientAllergiesCreateDTO.allergenName
                : undefined
            };

            await addPatientAllergy(payload).unwrap();

            dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
            setOpen(false);
            await fetchallerges();
            dispatch(resetRefetchEncounter());
            dispatch(setRefetchEncounter(true));
            await handleClear();
          } else {
            dispatch(notify({ msg: errorMsg, sev: 'warning' }));
          }
        } catch (error) {
          const errorMsg = extractErrorMessage(error) || 'Save Failed';
          dispatch(notify({ msg: errorMsg, sev: 'warning' }));
        }
      } else {
        try {
          let errorMsg = '';

          if (!patientAllergiesUpdateDTO.allergenType) {
            errorMsg += 'Allergen Type Can`t be empty';
          }

          if (!patientAllergiesUpdateDTO.severity) {
            errorMsg += errorMsg ? ', Severity Can`t be empty' : 'Severity Can`t be empty';
          }

          if (isOtherType) {
            const name = (patientAllergiesUpdateDTO.allergenName || '').trim();
            if (!name) {
              errorMsg += errorMsg
                ? ', Allergen is required'
                : 'Allergen is required';
            }
          }

          if (
            patientAllergiesUpdateDTO.onsetDate &&
            new Date(patientAllergiesUpdateDTO.onsetDate) > new Date()
          ) {
            errorMsg += errorMsg
              ? ', Onset Date can`t be in the future'
              : 'Onset Date can`t be in the future';
          }

          if (!errorMsg) {
            const objToAdd = {
              ...patientAllergiesUpdateDTO,
              allergicReactions: reactions.reactions.join(', '),
              onsetDate: patientAllergiesUpdateDTO?.onsetDate
                ? new Date(patientAllergiesUpdateDTO?.onsetDate).toISOString()
                : '',

              allergenId: isOtherType ? null : patientAllergiesUpdateDTO.allergenId,
              allergenName: isOtherType
                ? patientAllergiesUpdateDTO.allergenName
                : undefined
            };

            const updatedAllergy = await updatePatientAllergy({ id: allerges.id, dto: objToAdd }).unwrap();
            setAllerges(updatedAllergy);

            dispatch(
              notify({ msg: 'The patient Allergy has been updated successfully', sev: 'success' })
            );

            setOpen(false);
            await fetchallerges();
            dispatch(resetRefetchEncounter());
            dispatch(setRefetchEncounter(true));
            await handleClear();
          } else {
            dispatch(notify({ msg: errorMsg, sev: 'warning' }));
          }
        } catch (error) {
          const errorMsg = extractErrorMessage(error) || 'Save Failed';
          dispatch(notify({ msg: errorMsg, sev: 'warning' }));
        }
      }
    };

  // Effects
  useEffect(() => {
    if (allerges?.id)
      setPatientAllergiesUpdateDTO({
        id: allerges.id,
        allergenType: allerges.allergenType,
        allergenId: allerges.allergenId,
        allergenName: allerges.allergenName,
        severity: allerges.severity,
        medicationClassId: allerges.medicationClassId,
        criticality: allerges.criticality,
        certainty: allerges.certainty,
        treatmentStrategy: allerges.treatmentStrategy,
        onset: allerges.onset,
        onsetDateUndefined: allerges.onsetDateUndefined,
        onsetDate: allerges.onsetDate,
        typeOfPropensity: allerges.typeOfPropensity,
        byPatient: allerges.byPatient,
        sourceOfInformation: allerges.sourceOfInformation,
        note: allerges.note,
        allergicReactions: allerges.allergicReactions,
        activeIngredients: allerges.activeIngredients?.map(ai => ai.activeIngredientId) || []
      });
    else setPatientAllergiesCreateDTO({ ...newPatientAllergiesCreateDTO });
    setReactions({ reactions: [] });
  }, [allerges]);

useEffect(() => {
  if (!isOtherType) {
    setPatientAllergiesCreateDTO(prev => ({
      ...prev,
      allergenName: ''
    }));

    setPatientAllergiesUpdateDTO(prev => ({
      ...prev,
      allergenName: ''
    }));
  }
}, [patientAllergiesCreateDTO.allergenType, patientAllergiesUpdateDTO.allergenType]);

  useEffect(() => {
    if (allerges?.id && patientAllergiesUpdateDTO.allergicReactions) {
      setReactions({
        reactions: patientAllergiesUpdateDTO.allergicReactions
          .split(',')
          .map(r => r.trim())
          .filter(Boolean)
      });
    }
  }, [patientAllergiesUpdateDTO]);

  useEffect(() => {
    const isMedicationType = !allerges?.id
      ? patientAllergiesCreateDTO.allergenType === 'MEDICATION'
      : patientAllergiesUpdateDTO.allergenType === 'MEDICATION';

    if (!allerges?.id) {
      if (isMedicationType) {
        setPatientAllergiesCreateDTO(prev => ({
          ...prev,
          allergenId: undefined
        }));
      } else {
        setPatientAllergiesCreateDTO(prev => ({
          ...prev,
          medicationClassId: undefined,
          activeIngredients: []
        }));
      }
    } else {
      if (isMedicationType) {
        setPatientAllergiesUpdateDTO(prev => ({
          ...prev,
          allergenId: undefined
        }));
      } else {
        setPatientAllergiesUpdateDTO(prev => ({
          ...prev,
          medicationClassId: undefined,
          activeIngredients: []
        }));
      }
    }
  }, [patientAllergiesCreateDTO.allergenType, patientAllergiesUpdateDTO.allergenType]);

  useEffect(() => {
    if (allerges?.id) {
      if (patientAllergiesUpdateDTO?.onsetDateUndefined) {
        setPatientAllergiesUpdateDTO({ ...patientAllergiesUpdateDTO, onsetDate: null });
      }
    } else {
      if (patientAllergiesCreateDTO?.onsetDateUndefined) {
        setPatientAllergiesCreateDTO({ ...patientAllergiesCreateDTO, onsetDate: null });
      }
    }
  }, [
    patientAllergiesCreateDTO?.onsetDateUndefined,
    patientAllergiesUpdateDTO?.onsetDateUndefined
  ]);

  useEffect(() => {
    if (allerges?.id) {
      if (patientAllergiesUpdateDTO.byPatient) {
        setPatientAllergiesUpdateDTO({ ...patientAllergiesUpdateDTO, sourceOfInformation: null });
      }
    } else {
      if (patientAllergiesCreateDTO.byPatient) {
        setPatientAllergiesCreateDTO({ ...patientAllergiesCreateDTO, sourceOfInformation: null });
      }
    }
  }, [patientAllergiesCreateDTO.byPatient, patientAllergiesUpdateDTO.byPatient]);

  useEffect(() => {
    if (openToAdd) {
      handleClear();
    }
  }, [openToAdd]);

  useEffect(() => {
    setShowAllFields(!!allerges?.id);
  }, [allerges?.id]);

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={!allerges.id ? 'Add Allergy' : 'Edit Allergy'}
      actionButtonFunction={handleSave}
      isDisabledActionBtn={
        !edit ? (allerges.statusLvalue?.valueCode == 'ARS_CANCEL' ? true : false) : true
      }
      size="40vw"
      position="right"
      steps={[
        {
          title: 'Allergy',
          icon: <FontAwesomeIcon icon={faPersonDotsFromLine} />,
          footer: <MyButton onClick={handleClear}>Clear</MyButton>
        }
      ]}
      content={<div dir={dir}>{conjureFormContent()}</div>}
    />
  );
};
export default DetailsModal;
