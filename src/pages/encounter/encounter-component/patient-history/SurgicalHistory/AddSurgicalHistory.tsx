import React, { useState } from 'react';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { faBedPulse } from '@fortawesome/free-solid-svg-icons';

const AddSurgicalHistory = ({ open, setOpen }) => {
    const [openOtherField, setOpenOtherField] = useState({ open: false });
    const [openImplantsField, setOpenImplantsField] = useState({ open: false });
    // Fetch LOV data for various fields
    const { data: procLovQueryResponse } = useGetLovValuesByCodeQuery('PROC_COMPLIC');
    const { data: anesthTypeLovQueryResponse } = useGetLovValuesByCodeQuery('ANESTH_TYPES');
    const { data: medAdversLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');

    // Modal Content 
    const content = (
        <Form fluid layout='inline' className='fields-container'>
            <MyInput
                width={200}
                column
                fieldLabel="Surgery"
                fieldType="select"
                fieldName=""
                selectData={[]}
                selectDataLabel=""
                selectDataValue=""
                record={""}
                setRecord={""}
            />
            <MyInput
                width={200}
                column
                fieldLabel="Date of surgery"
                fieldType='date'
                fieldName=""
                record={""}
                setRecord={""}
            />
            <MyInput
                column
                width={200}
                fieldLabel="Other"
                fieldType="checkbox"
                fieldName="open"
                record={openOtherField}
                setRecord={setOpenOtherField}
            />
            <MyInput
                width={200}
                column
                fieldName=""
                record={""}
                setRecord={""}
                showLabel={false}
                disabled={!openOtherField?.open}
            />
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
                fieldLabel="Complications"
                fieldType="select"
                fieldName=""
                selectData={anesthTypeLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={""}
                setRecord={""}
            />
            <MyInput
                width={200}
                column
                fieldLabel="Type of Anesthesia used"
                fieldType="select"
                fieldName=""
                selectData={procLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={""}
                setRecord={""}
            />
            <MyInput
                width={200}
                column
                fieldLabel="Adverse reactions to anesthesia"
                fieldType="select"
                fieldName=""
                selectData={medAdversLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={""}
                setRecord={""}
            />
            <MyInput
                column
                width={200}
                fieldLabel="Implants or Devices"
                fieldType="checkbox"
                fieldName="open"
                record={openImplantsField}
                setRecord={setOpenImplantsField}
            />
            <MyInput
                width={200}
                column
                fieldName=""
                record={""}
                setRecord={""}
                showLabel={false}
                disabled={!openImplantsField?.open}
            />
        </Form>
    )
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Add/Edit Surgical History"
            steps={[{ title: "Surgical History", icon: faBedPulse }]}
            actionButtonFunction={""}
            position='right'
            bodyheight={550}
            size='500px'
            content={content}
        ></MyModal>
    );
};
export default AddSurgicalHistory;