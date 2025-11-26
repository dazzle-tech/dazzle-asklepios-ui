// AddFamilyMember.tsx
import 'react-tabs/style/react-tabs.css';
import '../styles.less';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { InputGroup, Form, Input } from 'rsuite';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useMemo, useState } from 'react';
import SearchIcon from '@rsuite/icons/Search';
import { faPeopleRoof } from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch } from '@/hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PatientSearch from './PatientSearch';
import './style.less';

// ✅ new service (create + update)
import {
  useCreatePatientRelationMutation,
  useUpdatePatientRelationMutation,
} from '@/services/patients/PatientRelationService';

import { useEnumOptions } from '@/services/enumsApi';
import { useLazyGetByFirstGenderQuery } from '@/services/patients/RelationsMatrixService';

const AddFamilyMember = ({
  open,
  setOpen,
  localPatient,
  selectedPatientRelation,
  setSelectedPatientRelation,
  refetch,
}) => {
  const dispatch = useAppDispatch();

  const [patientSearchTarget, setPatientSearchTarget] = useState('relation');
  const [searchResultVisible, setSearchResultVisible] = useState(false);

  const [createRelation] = useCreatePatientRelationMutation();
  const [updateRelation] = useUpdatePatientRelationMutation();

  // LOVs
  const relations = useEnumOptions('RelationType');
  const categoryOptions = useEnumOptions('FamilyMemberCategory');

  const isEditMode = !!selectedPatientRelation?.id;
  const [allowedSecondGenders, setAllowedSecondGenders] = useState<string[] | null>(null);
console.log('allowedSecondGenders:', allowedSecondGenders);
  const [fetchMatrixByFirstGender] = useLazyGetByFirstGenderQuery();

  const firstGender = localPatient?.sexAtBirth || localPatient?.gender; // عدل حسب موديلك
  const relationType = selectedPatientRelation?.relationType;

  useEffect(() => {
    const loadAllowedGenders = async () => {
      if (!firstGender || !relationType) {
        setAllowedSecondGenders(null);
        return;
      }

      try {
        // نجيب كل matrix للـ firstGender
        const res = await fetchMatrixByFirstGender({
          gender: firstGender,
          page: 0,
          size: 1000,
          sort: 'id,asc',
        }).unwrap();

        const rows = res?.data ?? [];

        const allowed = Array.from(
          new Set(
            rows
              .filter(r => r.firstRelationCode === relationType)
              .map(r => r.secondPatientGender)
              .filter(Boolean)
          )
        );

        setAllowedSecondGenders(allowed.length ? allowed : null);
      } catch (e) {
        console.error('Failed to load matrix', e);
        setAllowedSecondGenders(null);
      }
    };

    loadAllowedGenders();
  }, [firstGender, relationType]);

  const search = (target) => {
    setPatientSearchTarget(target);
    setSearchResultVisible(true);
  };

  const handleSaveFamilyMembers = async () => {
    if (!localPatient?.id) {
      dispatch(notify({ msg: 'Patient is required', sev: 'error' }));
      return;
    }
    if (!selectedPatientRelation?.relationType) {
      dispatch(notify({ msg: 'Relation type is required', sev: 'error' }));
      return;
    }
    if (!selectedPatientRelation?.relativePatientId) {
      dispatch(notify({ msg: 'Relative patient is required', sev: 'error' }));
      return;
    }

    try {
      // payload matches backend VM:
      // create: { patientId, relativePatientId, relationType, categoryType }
      // update: {patientId, relativePatientId, relationType, categoryType }
    
      if (isEditMode) {
        const id = selectedPatientRelation.id;

        const body = {
          patientId: localPatient.id,
          relativePatientId: selectedPatientRelation.relativePatientId,
          relationType: selectedPatientRelation.relationType,
          categoryType: selectedPatientRelation.categoryType ?? null,
        };

        await updateRelation({ id, body }).unwrap();
        dispatch(notify({ msg: 'Relation updated successfully', sev: 'success' }));
      } else {
        const body = {
          patientId: localPatient.id,
          relativePatientId: selectedPatientRelation.relativePatientId,
          relationType: selectedPatientRelation.relationType,
          categoryType: selectedPatientRelation.categoryType ?? null,
        };

        await createRelation(body).unwrap();
        dispatch(notify({ msg: 'Relation saved successfully', sev: 'success' }));
      }


      refetch();
      setOpen(false);
      setSelectedPatientRelation(null);
    } catch (e: any) {
      console.error('Failed to save relation:', e);

      const msg =
        e?.data?.message ||
        e?.data?.properties?.message ||
        (typeof e?.data?.properties === 'string' ? e.data.properties : null) ||
        e?.data?.title ||
        e?.data?.detail ||
        'Failed to save relation';

      dispatch(notify({ msg, sev: 'error' }));
    }
  };

  // clear form when modal opens for "new"
  useEffect(() => {
    if (open && !isEditMode) {
      setSelectedPatientRelation(null);
    }
  }, [open]);

  const modalContent = (
    <Form fluid className="patient-realition-container">
      <MyInput
        required
        width={300}
        fieldLabel="Relation Type"
        fieldType="select"
        fieldName="relationType"
        selectData={relations}
        selectDataLabel="label"
        selectDataValue="value"
        record={selectedPatientRelation ?? {}}
        setRecord={setSelectedPatientRelation}
        searchable
      />

      <MyInput
        required
        width={300}
        fieldLabel="Category"
        fieldType="select"
        fieldName="categoryType"
        selectData={categoryOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={selectedPatientRelation ?? {}}
        setRecord={setSelectedPatientRelation}
        searchable
      />

      <Form.Group>
        <InputGroup inside style={{ width: 300, direction: 'ltr' }}>
          <Input
            width={230}
            placeholder="Search Relative Patient"
            value={
              selectedPatientRelation?.relativePatient?.firstName ??
              selectedPatientRelation?.relativePatient?.fullName ??
              ''
            }
            readOnly
          />
          <InputGroup.Button onClick={() => search('relation')}>
            <SearchIcon />
          </InputGroup.Button>
        </InputGroup>
      </Form.Group>
    </Form>
  );

  return (
    <>
      <PatientSearch
        selectedPatientRelation={selectedPatientRelation}
        setSelectedPatientRelation={(rec) => {
          // PatientSearch fills: relativePatientId + relativePatient
          setSelectedPatientRelation((prev) => ({
            ...(prev ?? {}),
            ...rec,
          }));
        }}
        searchResultVisible={searchResultVisible}
        setSearchResultVisible={setSearchResultVisible}
        patientSearchTarget={patientSearchTarget}
        setPatientSearchTarget={setPatientSearchTarget}
     allowedSecondGenders={allowedSecondGenders}

      />

      <MyModal
        size="xs"
        open={open}
        setOpen={setOpen}
        title={isEditMode ? 'Edit Patient Relation' : 'New Patient Relation'}
        steps={[
          {
            title: 'Patient Relation',
            icon: <FontAwesomeIcon icon={faPeopleRoof} />,
          },
        ]}
        bodyheight="60vh"
        footerButtons={null}
        actionButtonLabel={isEditMode ? 'Update' : 'Save'}
        actionButtonFunction={handleSaveFamilyMembers}
        content={modalContent}
      />
    </>
  );
};

export default AddFamilyMember;
