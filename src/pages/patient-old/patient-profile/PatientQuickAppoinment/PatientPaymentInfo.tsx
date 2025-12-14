import React, { useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { ApPatientInsurance } from '@/types/model-types';
import { newApPatientInsurance } from '@/types/model-types-constructor';
import { useGetPatientInsuranceQuery } from '@/services/patientService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
const PatientPaymentInfo = ({ localPatient, localEncounter, setLocalEncounter, isReadOnly }) => {
    const [patientInsurance, setPatientInsurance] = useState<ApPatientInsurance>({ ...newApPatientInsurance });
    const [validationResult, setValidationResult] = useState({});

    // Fetch LOV data for various fields
    const { data: paymentTypeLovQueryResponse } = useGetLovValuesByCodeQuery('PAY_TYPS');
    const { data: InsurancePlanTypeLovQueryResponse } = useGetLovValuesByCodeQuery('INS_PLAN_TYPS');

    // Fetches patient insurance information based on the patient's key.
    const { data: patientInsuranceResponse } = useGetPatientInsuranceQuery(
        {
            patientKey: localPatient?.key
        },
        { skip: !localPatient.key }
    );

    // Maps the response data into a new array with label, value, and full patientInsurance object.
    const data = (patientInsuranceResponse ?? []).map(item => ({
        label: item.insuranceProvider,
        value: item.key,
        patientInsurance: item
    }));

    return (
        <Form fluid layout="inline" className='fields-container'>
            <MyInput
                vr={validationResult}
                column
                disabled={true}
                fieldName="PatientBalance"
                selectData={[]}
                selectDataLabel=""
                selectDataValue="key"
                record={localEncounter}
                setRecord={setLocalEncounter}
            />
            <MyInput
                vr={validationResult}
                column
                disabled={true}
                fieldName="Fees"
                selectData={[]}
                selectDataLabel=""
                selectDataValue="key"
                record={localEncounter}
                setRecord={setLocalEncounter}
            />
            <MyInput
                vr={validationResult}
                column
                fieldType="select"
                fieldName="paymentTypeLkey"
                selectData={paymentTypeLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={localEncounter}
                setRecord={setLocalEncounter}
                disabled={isReadOnly}
            />
            <br />
            {localEncounter?.paymentTypeLkey === '330434908679093' ?
                <Form layout="inline" fluid className='fields-container'>
                    <MyInput
                        column
                        fieldLabel="Insurance Plan Type"
                        fieldType="select"
                        fieldName="insuranceKey"
                        selectData={data}
                        selectDataLabel="label"
                        selectDataValue="key"
                        record={localEncounter}
                        setRecord={(updated) => {
                            const selectedItem = data.find(item => item.key === updated.insuranceKey);
                            if (selectedItem) {
                                setPatientInsurance(selectedItem.patientInsurance || {});
                            } else {
                                setPatientInsurance({ ...newApPatientInsurance });
                            }
                            setLocalEncounter(updated);
                        }}
                    />
                    <MyInput
                        vr={validationResult}
                        column
                        disabled={true}
                        fieldName="insurancePolicyNumber"
                        record={patientInsurance}
                        setRecord={setPatientInsurance}
                    />
                    <MyInput
                        vr={validationResult}
                        column
                        disabled={true}
                        fieldName="groupNumber"
                        record={patientInsurance}
                        setRecord={setPatientInsurance}
                    />
                    <MyInput
                        vr={validationResult}
                        column
                        disabled={true}
                        fieldType="select"
                        fieldName="insurancePlanTypeLkey"
                        selectData={InsurancePlanTypeLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={patientInsurance}
                        setRecord={setPatientInsurance}
                    />
                    <MyInput
                        vr={validationResult}
                        column
                        disabled={true}
                        fieldName="authorizationNumbers"
                        record={patientInsurance}
                        setRecord={setPatientInsurance}
                    />
                    <MyInput
                        vr={validationResult}
                        column
                        fieldType="date"
                        disabled={true}
                        fieldName="expirationDate"
                        record={patientInsurance}
                        setRecord={setPatientInsurance}
                    /></Form> : <></>}
        </Form>
    )
};

export default PatientPaymentInfo;