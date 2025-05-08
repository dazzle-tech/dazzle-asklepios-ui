import React from 'react';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { faLungsVirus } from '@fortawesome/free-solid-svg-icons';

const AddPatientProblem = ({ open, setOpen }) => {

    // Fetch LOV data for various fields
    const { data: allergyLovQueryResponse } = useGetLovValuesByCodeQuery('ALLERGY_RES_STATUS');
    const { data: diagnosisTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DIAGNOSIS_STATUS');
    const { data: relationLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');

    // Modal Content 
    const content = (
        <Form fluid layout='inline' className='fields-container'>
            <MyInput
                width={200}
                column
                fieldLabel="Condition"
                fieldName=""
                record={""}
                setRecord={""}
            />
            <MyInput
                width={200}
                column
                fieldLabel="Date of diagnosis"
                fieldType='date'
                fieldName=""
                record={""}
                setRecord={""}
            />
            <MyInput
                column
                width={200}
                fieldLabel="Status"
                fieldType="select"
                fieldName=""
                selectData={allergyLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={""}
                setRecord={""}
                searchable={false}
            />
            <MyInput
                width={200}
                column
                fieldLabel="Type"
                fieldType="select"
                fieldName=""
                selectData={diagnosisTypeLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={""}
                setRecord={""}
                searchable={false}
            />
            <MyInput
                width={200}
                column
                fieldLabel="Date of resolution"
                fieldType='date'
                fieldName=""
                record={""}
                setRecord={""}
            />Recent
            
            <MyInput
                width={200}
                column
                fieldLabel="Source of information"
                fieldType="select"
                fieldName=""
                selectData={relationLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={""}
                setRecord={""}
                searchable={false}
            />
            <MyInput
                width={200}
                column
                fieldLabel="By Patient"
                fieldType="checkbox"
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
            title="Add/Edit Patient Problem"
            steps={[{title: "Patient Problem",icon: faLungsVirus}]}
            actionButtonFunction={""}
            position='right'
            bodyheight={550}
            size='500px'
            content={content}
        ></MyModal>
    );
};
export default AddPatientProblem;