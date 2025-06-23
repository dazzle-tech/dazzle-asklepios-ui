import React, { useState } from 'react';
import './styles.less';
import { useAppDispatch } from '@/hooks';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import { initialListRequest, ListRequest } from '@/types/types';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { notify } from '@/utils/uiReducerActions';
import { faBed } from '@fortawesome/free-solid-svg-icons';
import { useGetResourceTypeQuery } from '@/services/appointmentService';
import { newApAdmitOutpatientInpatient } from '@/types/model-types-constructor';
import { useGetPractitionersQuery } from '@/services/setupService';
import { useAdmitToInpatientEncounterMutation } from '@/services/encounterService';
const AdmitToInpatientModal = ({ open, setOpen, encounter }) => {
    const [admitToInpatient, setAdmitToInpatient] = useState({ ...newApAdmitOutpatientInpatient });
    const inpatientDepartmentListResponse = useGetResourceTypeQuery("4217389643435490");
    const dispatch = useAppDispatch();
    const [saveAdmitToInpatient, saveAdmitToInpatientMutation] = useAdmitToInpatientEncounterMutation();

    const [physicanListRequest, setPhysicanListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            },
            {
                fieldName: 'job_role_lkey',
                operator: 'match',
                value: '157153854130600'
            }
        ],
        pageSize: 1000
    });
    const { data: practitionerListResponse } = useGetPractitionersQuery(physicanListRequest);
    // handle save To admit outpatient to inpatient function
    const handleSave = async () => {
        try {
            const saveAdmit = await saveAdmitToInpatient({
                ...admitToInpatient,
                fromEncounterKey: encounter?.key
            }).unwrap();
            dispatch(notify({ msg: 'Billing Approval Sent', sev: 'success' }));
            setOpen(false);
            setAdmitToInpatient({ ...newApAdmitOutpatientInpatient });

        } catch (error) {
        }
    };
    // modal content
    const modalContent = (
        <Form fluid layout="inline" className='fields-container'>
            <MyInput
                require
                column
                fieldLabel="Select Department"
                fieldType="select"
                fieldName="inpatientDepartmentKey"
                selectData={inpatientDepartmentListResponse?.data?.object ?? []}
                selectDataLabel="name"
                selectDataValue="key"
                record={admitToInpatient}
                setRecord={setAdmitToInpatient}
                width={190}
            />
            <MyInput
                require
                column
                fieldLabel="Responsible physician"
                fieldType="select"
                fieldName="physicianKey"
                selectData={practitionerListResponse?.object ?? []}
                selectDataLabel="practitionerFullName"
                selectDataValue="key"
                record={admitToInpatient}
                setRecord={setAdmitToInpatient}
                width={190}
            />
            <MyInput
                column
                fieldType='textarea'
                fieldLabel="Admission Notes"
                fieldName='admissionNotes'
                record={admitToInpatient}
                setRecord={setAdmitToInpatient}
                width={390}
            />
        </Form>);
    return (<MyModal
        open={open}
        setOpen={setOpen}
        title="Admit to Inpatient"
        steps={[{ title: "Admit to Inpatient", icon: <FontAwesomeIcon icon={faBed} /> }]}
        size="30vw"
        bodyheight='400px'
        actionButtonFunction={handleSave}
        content={modalContent}
    />);
}
export default AdmitToInpatientModal