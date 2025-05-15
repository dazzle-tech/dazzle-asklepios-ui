import React, { useState } from 'react';
import { Form } from 'rsuite';
import '../styles.less';
import { useAppDispatch } from '@/hooks';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { useSavePatientPreferredHealthProfessionalMutation } from '@/services/patientService';
import { useGetPractitionersQuery } from '@/services/setupService';
import { faHospitalUser } from '@fortawesome/free-solid-svg-icons';
import { notify } from '@/utils/uiReducerActions';
import MyModal from '@/components/MyModal/MyModal';
import { newApPractitioner, newApPatientPreferredHealthProfessional } from '@/types/model-types-constructor';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";import { initialListRequest, ListRequest } from '@/types/types';
import { useGetFacilitiesQuery } from '@/services/setupService';

const AddPrefferdHealthProfessionalModal = ({ open, setOpen, patient, patientHP, setPatientHP,practitioner,setPractitioner ,refetch }) => {
    const [savePatientPH] = useSavePatientPreferredHealthProfessionalMutation();
    const dispatch = useAppDispatch();

    // Fetch LOV data for various fields
    const { data: specialityLovQueryResponse } = useGetLovValuesByCodeQuery('PRACT_SPECIALTY');
    // Initialize List Request Filters
    const [listRequest] = useState<ListRequest>({
        ...initialListRequest,
        pageSize: 1000,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ]
    });
    const [practitionerListRequest] = useState<ListRequest>({
        ...initialListRequest,
        pageSize: 1000,
        filters: [
            {
                fieldName: 'is_valid',
                operator: 'match',
                value: "true"
            }, {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ]
    });

    //List Responses
    // Fetch Facility list
    const { data: facilityListResponse } = useGetFacilitiesQuery(listRequest);
    // Fetch Practitioner list
    const { data: practitionerListResponse } = useGetPractitionersQuery({ ...practitionerListRequest });
    // Fetch and map the practitioner list for select input
    const practitionerList = (practitionerListResponse?.object ?? []).map(item => ({
        value: item.key,
        label: item.practitionerFullName,
        practitioner: item
    }));
    // Fetch and map the facility list for select input
    const facilityList = (facilityListResponse?.object ?? []).map(item => ({
        value: item.key,
        label: item.facilityName,

    }));
    // handle Clear Modal
    const handleClearModal = () => {
        setPatientHP({ ...newApPatientPreferredHealthProfessional });
        setPractitioner({ ...newApPractitioner });
        setOpen(false);
    };
    // handle Save PH Patient
    const handleSave = () => {
        savePatientPH({ ...patientHP, patientKey: patient?.key }).unwrap()
        .then(() => {
            if (patientHP.key === undefined) {
                dispatch(notify('Preferred Health Professional Added Successfully'));
            } else {
                dispatch(notify('Preferred Health Professional Updated Successfully'));
            }
            refetch(); 
            handleClearModal();
        })
        .catch((error) => {
            console.error('Error saving Preferred Health Professional:', error);
        });
    };
    
    //MyModal content 
    const content = () => (
        <Form layout='inline' className='ph-main-container' fluid>
            <MyInput
                column
                fieldLabel="HP Name"
                fieldType="select"
                fieldName="practitionerKey"
                selectData={practitionerList}
                selectDataLabel="label"
                selectDataValue="value"
                record={patientHP}
                setRecord={(updatedPatientHP) => {
                    setPatientHP({
                        ...updatedPatientHP,
                        practitionerKey: updatedPatientHP.practitionerKey || null
                    });
                    const selectedPractitioner = practitionerList.find(item => item.value === updatedPatientHP.practitionerKey);
                    setPractitioner(selectedPractitioner ? selectedPractitioner.practitioner : {});
                }}
            />
            <MyInput
                disabled
                column
                fieldLabel="Speciality"
                fieldType="select"
                fieldName="speciality"
                selectData={specialityLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={practitioner}
                setRecord={setPractitioner}
            />

            <MyInput
                column
                fieldLabel="HP Organization"
                fieldType="select"
                fieldName="facilityKey"
                selectData={facilityList}
                selectDataLabel="label"
                selectDataValue="value"
                record={patientHP}
                setRecord={setPatientHP}
            />

            <MyInput
                column
                fieldLabel="Network Affiliation"
                fieldType="text"
                fieldName="networkAffiliation"
                record={patientHP}
                setRecord={setPatientHP}
            />
            <MyInput
                column
                fieldLabel="Email"
                fieldType="text"
                fieldName="practitionerEmail"
                record={practitioner}
                setRecord={setPractitioner}
                disabled
            />
            <MyInput
                column
                fieldLabel="Telephone No."
                fieldType="text"
                fieldName="practitionerPhoneNumber"
                record={practitioner}
                setRecord={setPractitioner}
                disabled
            />
            <MyInput
                column
                fieldLabel="Related with"
                fieldType="text"
                fieldName="relatedWith"
                record={patientHP}
                setRecord={setPatientHP}
            />
        </Form>
    );
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="New/Edit Patient Preferred Health Professional"
            actionButtonLabel="Save"
            bodyheight='65vh'
            actionButtonFunction={handleSave}
            steps={[{ title: "Preferred Health Professional", icon: <FontAwesomeIcon icon={faHospitalUser }/>}]}
            size="35vw"
            content={content}
        />
    );
};
export default AddPrefferdHealthProfessionalModal;
