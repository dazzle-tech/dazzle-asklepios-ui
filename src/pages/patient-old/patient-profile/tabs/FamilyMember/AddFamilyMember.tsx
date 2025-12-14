import 'react-tabs/style/react-tabs.css';
import '../styles.less';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { InputGroup, Form, Input } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useState } from 'react';
import SearchIcon from '@rsuite/icons/Search';
import { Checkbox } from 'rsuite';
import { faPeopleRoof } from '@fortawesome/free-solid-svg-icons';
import { useSavePatientRelationMutation } from '@/services/patientService';
import { useAppDispatch } from '@/hooks';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PatientSearch from './PatientSearch';
import './style.less';
const AddFamilyMember = ({ open, setOpen, localPatient, selectedPatientRelation, setSelectedPatientRelation, refetch }) => {
    const [patientSearchTarget, setPatientSearchTarget] = useState('primary'); // primary, relation, etc..
    const [searchResultVisible, setSearchResultVisible] = useState(false);
    const [savePatientRelation, savePatientRelationMutation] = useSavePatientRelationMutation();
    const dispatch = useAppDispatch();
    // Fetch LOV data for various fields
    const { data: relationsLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');
    const { data: categoryLovQueryResponse } = useGetLovValuesByCodeQuery('FAMILY_MMBR_CAT');
    // handle Search Function
    const search = target => {
        setPatientSearchTarget(target);
        setSearchResultVisible(true);
    };
    // handle Save Family Member Function
    const handleSaveFamilyMembers = () => {
        savePatientRelation({
            ...selectedPatientRelation,
            patientKey: localPatient.key,
        }).unwrap()
            .then(() => {
                refetch();
            })
        refetch();
    }
    //Effects
    useEffect(() => {
        if (savePatientRelationMutation.status === 'fulfilled') {
            setSelectedPatientRelation(savePatientRelationMutation.data);
            setOpen(false);
            dispatch(notify({msg:'Relation Saved Successfully',sev: 'success'}));
        }
    }, [savePatientRelationMutation]);
    //MyModal Content
const [isNextOfKin, setIsNextOfKin] = useState(false);

    const modalContent = (
        <Form fluid className='patient-realition-container'>
            <MyInput
                required
                width={300}
                fieldLabel="Relation Type"
                fieldType="select"
                fieldName="relationTypeLkey"
                selectData={relationsLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={selectedPatientRelation}
                setRecord={setSelectedPatientRelation}
            />
            <MyInput
                required
                width={300}
                fieldLabel="Category"
                fieldType="select"
                fieldName="categoryTypeLkey"
                selectData={categoryLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={selectedPatientRelation}
                setRecord={setSelectedPatientRelation}
            />
            <Form.Group>
                <InputGroup inside style={{ width: 300, direction: 'ltr' }}>
                    <Input
                        width={230}
                        disabled={true}
                        placeholder={'Search Relative Patient'}
                        value={selectedPatientRelation.relativePatientObject?.fullName ?? ''}
                    />
                    <InputGroup.Button onClick={() => search('relation')}>
                        <SearchIcon />
                    </InputGroup.Button>
                </InputGroup>
            </Form.Group>
            <Form.Group>
                <div className='check-box-next-of-kim-position'>
  <Checkbox
    checked={isNextOfKin}
    onChange={(_, checked) => setIsNextOfKin(checked)}
  >
    Next of Kin
  </Checkbox></div>
</Form.Group>

{isNextOfKin && (
  <>
    <MyInput
      width={300}
      fieldLabel="Email"
      fieldType="text"
      fieldName="email"
      record={selectedPatientRelation}
      setRecord={setSelectedPatientRelation}
      required
    />
    <MyInput
      width={300}
      fieldLabel="Phone Number"
      fieldType="text"
      fieldName="phone"
      record={selectedPatientRelation}
      setRecord={setSelectedPatientRelation}
      required
    />
  </>
)}

        </Form>
    );

    return (
        <>
            <PatientSearch selectedPatientRelation={selectedPatientRelation} setSelectedPatientRelation={setSelectedPatientRelation} searchResultVisible={searchResultVisible} setSearchResultVisible={setSearchResultVisible} patientSearchTarget={patientSearchTarget} setPatientSearchTarget={setPatientSearchTarget} />
            <MyModal
                size="xs"
                open={open}
                setOpen={setOpen}
                title="New/Edit Patient Relation"
                steps={[{ title: "Patient Relation", icon:<FontAwesomeIcon icon={ faPeopleRoof }/>}]}
                bodyheight='60vh'
                footerButtons={null}
                actionButtonLabel="Save"
                actionButtonFunction={handleSaveFamilyMembers}
                content={modalContent}
            /></>
    );
}
export default AddFamilyMember;
