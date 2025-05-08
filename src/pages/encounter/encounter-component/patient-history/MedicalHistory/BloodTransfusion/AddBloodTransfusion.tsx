import React from 'react';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { faHandHoldingDroplet } from '@fortawesome/free-solid-svg-icons';

const AddBloodTransfusion = ({ open, setOpen }) => {

    // Fetch LOV data for various fields
    const { data: bloodProductsLovQueryResponse } = useGetLovValuesByCodeQuery('BLOOD_PRODUCTS');
    const { data: bloodTransSourceLovQueryResponse } = useGetLovValuesByCodeQuery('BLOOD_TRANS_SOURCE');

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
                fieldLabel="Date"
                fieldType='date'
                fieldName=""
                record={""}
                setRecord={""}
            />
            <MyInput
                width={200}
                column
                fieldLabel="Indication"
                fieldName=""
                record={""}
                setRecord={""}
            />
            <MyInput
                column
                width={200}
                fieldLabel="Blood Product Transfused"
                fieldType="select"
                fieldName=""
                selectData={bloodProductsLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={""}
                setRecord={""}
                searchable={false}
            />
            <MyInput
                width={200}
                column
                fieldLabel="Source of Blood"
                fieldType="select"
                fieldName=""
                selectData={bloodTransSourceLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={""}
                setRecord={""}
                searchable={false}
            />
            <MyInput
                column
                width={150}
                fieldLabel="Volume"
                fieldType="number"
                fieldName=""
                record={""}
                setRecord={""}
                rightAddon="Ml"
                rightAddonwidth={50}

            />
            <MyInput
                width={200}
                column
                fieldLabel="Complication"
                fieldType="textarea"
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
            title="Add/Edit Blood Transfusion"
             steps={[{title: "Blood Transfusion",icon: faHandHoldingDroplet}]}
            actionButtonFunction={""}
            position='right'
            bodyheight={550}
            size='500px'
            content={content}
        ></MyModal>
    );
};
export default AddBloodTransfusion;