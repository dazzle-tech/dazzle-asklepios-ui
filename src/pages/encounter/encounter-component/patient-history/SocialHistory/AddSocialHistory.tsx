import React, { useState } from 'react';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { faSmoking } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const AddSocialHistory = ({ open, setOpen }) => {
    const [openCurrentSmokerField, setOpenCurrentSmokerField] = useState({ open: false });
    const [openPreviousSmokerField, setOpenPreviousSmokerField] = useState({ open: false });
    const [openAlcoholConsumptionField, setOpenAlcoholConsumptionField] = useState({ open: false });
    const [openSubstanceUseField, setOpenSubstanceUseField] = useState({ open: false });

    // Fetch LOV data for various fields
    const { data: routeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const { data: frequentLovQueryResponse } = useGetLovValuesByCodeQuery('FREQUENT_USE');
    const { data: physicalLimitationsLovQueryResponse } = useGetLovValuesByCodeQuery('PHYSICAL_LIMITATION');
    const { data: diagnosedLovQueryResponse } = useGetLovValuesByCodeQuery('EATING_DISORDERS');

    // Modal Content 
    const content = (
        <Form fluid layout='inline' className='fields-container'>
            <MyInput
                width={200}
                column
                fieldType='checkbox'
                fieldLabel="Current Smoker"
                fieldName="open"
                record={openCurrentSmokerField}
                setRecord={setOpenCurrentSmokerField}
            />
            {openCurrentSmokerField?.open &&
                <>
                    <MyInput
                        width={200}
                        column
                        fieldLabel="Start date"
                        fieldType='date'
                        fieldName=""
                        record={""}
                        setRecord={""}
                    />
                    <MyInput
                        column
                        width={110}
                        fieldLabel="Amount"
                        fieldType="number"
                        fieldName=""
                        record={""}
                        setRecord={""}
                        rightAddon="pack\day"
                        rightAddonwidth={90}
                    />
                    <MyInput
                        width={200}
                        column
                        fieldLabel="Cigarette Type"
                        fieldName=""
                        record={""}
                        setRecord={""}
                    />
                </>
            }
            <MyInput
                width={200}
                column
                fieldType='checkbox'
                fieldLabel="Previous smoker"
                fieldName="open"
                record={openPreviousSmokerField}
                setRecord={setOpenPreviousSmokerField}
            />
            {openPreviousSmokerField?.open && <MyInput
                width={200}
                column
                fieldLabel="Quit date"
                fieldType='date'
                fieldName=""
                record={""}
                setRecord={""}
            />}
            <MyInput
                width={200}
                column
                fieldType='checkbox'
                fieldLabel="Exposure to second-hand smoke and third-hand smoke"
                fieldName=""
                record={""}
                setRecord={""}
            />
            <MyInput
                width={200}
                column
                fieldType='checkbox'
                fieldLabel="Alcohol Consumption"
                fieldName="open"
                record={openAlcoholConsumptionField}
                setRecord={setOpenAlcoholConsumptionField}
            />
            {openAlcoholConsumptionField?.open &&
                <MyInput
                    width={200}
                    column
                    fieldLabel="Type of alcohol"
                    fieldName=""
                    record={""}
                    setRecord={""}
                />
            }
            <MyInput
                width={200}
                column
                fieldLabel="Since when"
                fieldType='date'
                fieldName=""
                record={""}
                setRecord={""}
            />
            <MyInput
                width={200}
                column
                fieldType='checkbox'
                fieldLabel="Substance Use"
                fieldName="open"
                record={openSubstanceUseField}
                setRecord={setOpenSubstanceUseField}
            />
            {openSubstanceUseField.open &&
                <>
                    <MyInput
                        width={200}
                        column
                        fieldLabel="Route"
                        fieldType="select"
                        fieldName=""
                        selectData={routeLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={""}
                        setRecord={""}
                    />
                    <MyInput
                        width={200}
                        column
                        fieldLabel="Frequency"
                        fieldType="select"
                        fieldName=""
                        selectData={frequentLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={""}
                        setRecord={""}
                    />
                </>
            }
            <MyInput
                width={200}
                column
                fieldLabel="Physical limitations"
                fieldType="select"
                fieldName=""
                selectData={physicalLimitationsLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={""}
                setRecord={""}
            />
            <MyInput
                width={200}
                column
                fieldLabel="Diagnosed eating disorders"
                fieldType="select"
                fieldName=""
                selectData={diagnosedLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={""}
                setRecord={""}
            />
        </Form>
    )
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Add/Edit Social History"
            steps={[{ title: "Social History", icon: <FontAwesomeIcon icon={faSmoking}/>}]}
            actionButtonFunction={""}
            position='right'
            size='33vw'
            content={content}
        ></MyModal>
    );
};
export default AddSocialHistory;