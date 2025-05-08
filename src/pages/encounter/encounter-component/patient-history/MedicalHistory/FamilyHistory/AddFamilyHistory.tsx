import React from 'react';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { faPeopleRoof } from '@fortawesome/free-solid-svg-icons';

const AddFamilyHistory = ({ open, setOpen }) => {

    // Fetch LOV data for various fields
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
                fieldLabel="Realation"
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
                fieldLabel="Inherited Diseases"
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
            title="Add/Edit Family History"
            steps={[{title: "Family History",icon: faPeopleRoof}]}
            actionButtonFunction={""}
            position='right'
            bodyheight={550}
            size='500px'
            content={content}
        ></MyModal>
    );
};
export default AddFamilyHistory;