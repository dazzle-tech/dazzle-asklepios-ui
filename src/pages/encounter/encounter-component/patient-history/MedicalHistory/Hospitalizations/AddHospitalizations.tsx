import React from 'react';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { faHospitalUser } from '@fortawesome/free-solid-svg-icons';

const AddHospitalizations = ({ open, setOpen }) => {

    // Fetch LOV data for various fields
    const { data: admissionTypeLovQueryResponse } = useGetLovValuesByCodeQuery('ADMISSION_TYPE');

    // Modal Content 
    const content = (
        <Form fluid layout='inline' className='fields-container'>
            <MyInput
                width={200}
                column
                fieldLabel="Facility"
                fieldName=""
                record={""}
                setRecord={""}
            />
            <MyInput
                width={200}
                column
                fieldLabel="Reason"
                fieldName=""
                record={""}
                setRecord={""}
            />
            <MyInput
                column
                width={200}
                fieldLabel="Admission Type"
                fieldType="select"
                fieldName=""
                selectData={admissionTypeLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={""}
                setRecord={""}
            />
            <MyInput
                width={200}
                column
                fieldLabel="Date of admission"
                fieldType='date'
                fieldName=""
                record={""}
                setRecord={""}
            />
            <MyInput
                width={200}
                column
                fieldLabel="Length of stay"
                fieldName=""
                record={""}
                setRecord={""}
            />
            <MyInput
                width={200}
                column
                fieldLabel="Outcomes"
                fieldName=""
                record={""}
                setRecord={""}
            />
            <MyInput
                width={200}
                column
                fieldLabel="Medical Interventions Performed"
                fieldType='textarea'
                fieldName=""
                record={""}
                setRecord={""}
            />
        </Form>
    )
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Add/Edit Hospitalizations"
            steps={[{title: "Hospitalizations",icon: faHospitalUser}]}
            actionButtonFunction={""}
            position='right'
            bodyheight={550}
            size='500px'
            content={content}
        ></MyModal>
    );
};
export default AddHospitalizations;