import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import { faUser, faIdCard, faPhone, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import MyInput from '@/components/MyInput';
import './styles.less';
import { newApEncounter, newApPatientInsurance } from '@/types/model-types-constructor';
import { ApPatientInsurance } from '@/types/model-types';
import { newApPatient } from '@/types/model-types-constructor';
import { ApPatient } from '@/types/model-types';
import MyModal from '@/components/MyModal/MyModal';
import { useGetLovValuesByCodeAndParentQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useSavePatientMutation } from '@/services/patientService';
import { useNavigate } from 'react-router-dom';
import { useSavePatientInsuranceMutation } from '@/services/patientService';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyButton from '@/components/MyButton/MyButton';
import './styles.less';
import { calculateAgeFormat } from '@/utils';
import { useCompleteEncounterRegistrationMutation } from '@/services/encounterService';
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { setRefetchEncounter } from '@/reducers/refetchEncounterState';


const CreateNewPatient = ({ open, setOpen }) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
    const [savePatientInsurance, savePatientInsuranceMutation] = useSavePatientInsuranceMutation();
    const [patientInsurance, setPatientInsurance] = useState<ApPatientInsurance>({ ...newApPatientInsurance });
    const [savePatient, savePatientMutation] = useSavePatientMutation();
    const [openNextDocument, setOpenNextDocument] = useState(false);
    const [localEncounter, setLocalEncounter] = useState({ ...newApEncounter, visitTypeLkey: '2041082245699228', patientKey: localPatient.key, plannedStartDate: new Date(), patientAge: calculateAgeFormat(localPatient.dob), discharge: false });
    const [saveEncounter, saveEncounterMutation] = useCompleteEncounterRegistrationMutation();
    const pageCode = useSelector((state: RootState) => state.div?.pageCode);
    // Fetch LOV data for various fields
    const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
    const { data: docTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
    const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');
    const { data: preferredWayOfContactLovQueryResponse } = useGetLovValuesByCodeQuery('PREF_WAY_OF_CONTACT');
    const { data: cityLovQueryResponse } = useGetLovValuesByCodeAndParentQuery({ code: 'CITY', parentValueKey: localPatient.countryLkey });
    const { data: isnuranceProviderTypeResponse } = useGetLovValuesByCodeQuery('INS_PROVIDER');
    const { data: isnurancePlanTypeResponse } = useGetLovValuesByCodeQuery('INS_PLAN_TYPS');

    // Handle Save Patient
    const handleSave = () => {
        savePatient({ ...localPatient, incompletePatient: false, unknownPatient: false })
            .unwrap()
            .then(() => {
                dispatch(notify({ msg: 'Patient Saved Successfully', sev: 'success' }));
            });
    };
    //handle Save Patient 
    const handleSavePatientAndQuick = async () => {
        try {
            // 1. Save patient and wait for the result
            const savedPatient = await savePatient({
                ...localPatient,
                incompletePatient: false,
                unknownPatient: false
            }).unwrap();

            // 2. Save encounter using saved patient key
            // 2. Save encounter using saved patient key
            if (pageCode === 'ER_Triage') {
                await saveEncounter({
                    ...localEncounter,
                    patientKey: savedPatient.key,
                    plannedStartDate: new Date(),
                    encounterStatusLkey: '91063195286200',
                    patientAge: calculateAgeFormat(savedPatient.dob),
                    visitTypeLkey: '2041082245699228',
                    resourceTypeLkey: '6743167799449277',
                    resourceKey: '7101086042442391',
                });
                dispatch(setRefetchEncounter(true));    
            }

            // 3. Update state and navigate
            setLocalPatient(savedPatient);
            setOpen(false);
            { pageCode !== 'ER_Triage' && navigate('/patient-profile', { state: { patient: savedPatient } }) };

            // 4. Clean up
            dispatch(notify({ msg: 'Patient added successfully', sev: 'success' }));
        } catch (error) {
            console.log('rejected')
        }
    };
    // Handle Go To Patient Profile 
    const goToPatientProfile = () => {
        setOpen(false);
        const privatePatientPath = '/patient-profile';
        navigate(privatePatientPath, { state: { patient: localPatient } });
        setLocalPatient({ ...newApPatient });
        setPatientInsurance({ ...newApPatientInsurance });
    };
    // Handle Save Patient Insurance
    const handleSaveInsurance = async () => {
        savePatientInsurance({ ...patientInsurance, patientKey: localPatient.key })
            .unwrap()
            .then(() => {
                dispatch(notify({ msg: 'Patient Insurance Added Successfully', sev: 'success' }));
                const privatePatientPath = '/patient-profile';
                navigate(privatePatientPath, { state: { patient: localPatient } });
                setOpen(false);
                setLocalPatient({ ...newApPatient });
                setPatientInsurance({ ...newApPatientInsurance });
            })
            .catch(error => {
                setPatientInsurance({ ...patientInsurance, primaryInsurance: false });
            });
    };
    // Modal Content 
    const conjureFormContent = stepNumber => {
        switch (stepNumber) {
            case 0:
                return (
                    <Form fluid layout="inline">
                        <span className="custom-text">
                            Basic Information
                        </span>
                        <MyInput
                            width={200}
                            required
                            column
                            fieldName="firstName"
                            record={localPatient}
                            setRecord={setLocalPatient}
                        />
                        <MyInput
                            width={200}
                            required
                            column
                            fieldName="secondName"
                            record={localPatient}
                            setRecord={setLocalPatient}
                        />
                        <MyInput
                            width={200}
                            column
                            fieldName="thirdName"
                            record={localPatient}
                            setRecord={setLocalPatient}
                        />
                        <MyInput
                            width={200}
                            required
                            column
                            fieldName="lastName"
                            record={localPatient}
                            setRecord={setLocalPatient}
                        />
                        <MyInput
                            width={200}
                            column
                            fieldType="date"
                            fieldLabel="DOB"
                            fieldName="dob"
                            record={localPatient}
                            setRecord={setLocalPatient}
                        />

                        <MyInput
                            width={200}
                            required
                            column
                            fieldLabel="Sex at Birth"
                            fieldType="select"
                            fieldName="genderLkey"
                            selectData={genderLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={localPatient}
                            setRecord={setLocalPatient}
                        />
                        <br />
                        <MyInput
                            column
                            width={200}
                            required
                            fieldName="phoneNumber"
                            fieldLabel="Primary Mobile Number"
                            record={localPatient}
                            setRecord={setLocalPatient}
                        />
                        <MyInput
                            column
                            width={200}
                            fieldLabel="Private Patient"
                            fieldType="checkbox"
                            fieldName="privatePatient"
                            record={localPatient}
                            setRecord={setLocalPatient}
                        />
                    </Form>
                );
            case 1:
                return (
                    <Form fluid layout="inline">
                        <span className="custom-text">
                            Document Information
                        </span>
                        <MyInput
                            width={200}
                            required
                            column
                            fieldLabel="Document Type"
                            fieldType="select"
                            fieldName="documentTypeLkey"
                            selectData={docTypeLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={localPatient}
                            setRecord={setLocalPatient}
                        />
                        <MyInput
                            required
                            width={200}
                            column
                            fieldLabel="Document Country"
                            fieldType="select"
                            fieldName="documentCountryLkey"
                            selectData={countryLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={localPatient}
                            setRecord={setLocalPatient}
                            disabled={localPatient.documentTypeLkey === 'NO_DOC'}
                        />
                        <MyInput
                            width={200}
                            required
                            column
                            fieldLabel="Document Number"
                            fieldName="documentNo"
                            record={localPatient}
                            setRecord={setLocalPatient}
                            disabled={localPatient.documentTypeLkey === 'NO_DOC'}
                        />
                    </Form>
                );
            case 2:
                return (
                    <Form fluid layout="inline" >
                        <span className="custom-text">
                            Contact Information
                        </span>
                        <MyInput
                            width={200}
                            column
                            fieldLabel="Secondary Number"
                            fieldName="secondaryMobileNumber"
                            record={localPatient}
                            setRecord={setLocalPatient}
                        />
                        <MyInput
                            width={200}
                            column
                            fieldName="homePhone"
                            record={localPatient}
                            setRecord={setLocalPatient}
                        />
                        <MyInput
                            width={200}
                            column
                            fieldName="email"
                            record={localPatient}
                            setRecord={setLocalPatient}
                        />
                        <MyInput
                            width={200}
                            column
                            fieldLabel="Preferred Way of Contact"
                            fieldType="select"
                            fieldName="preferredContactLkey"
                            selectData={preferredWayOfContactLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={localPatient}
                            setRecord={setLocalPatient}
                        />
                        <MyInput
                            width={200}
                            column
                            fieldName="emergencyContactName"
                            record={localPatient}
                            setRecord={setLocalPatient}
                        />
                        <MyInput
                            width={200}
                            column
                            fieldName="emergencyContactPhone"
                            record={localPatient}
                            setRecord={setLocalPatient}
                        />
                        <span className="custom-text">
                            Address Information
                        </span>
                        <MyInput
                            width={200}
                            column
                            fieldLabel="Country"
                            fieldType="select"
                            fieldName="countryLkey"
                            selectData={countryLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={localPatient}
                            setRecord={setLocalPatient}
                        />
                        <MyInput
                            width={200}
                            column
                            fieldLabel="State/Province"
                            fieldType="select"
                            fieldName="stateProvinceRegionLkey"
                            selectData={cityLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={localPatient}
                            setRecord={setLocalPatient}
                        />
                        <MyInput
                            width={200}
                            column
                            fieldLabel="City"
                            fieldType="select"
                            fieldName="cityLkey"
                            selectData={cityLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={localPatient}
                            setRecord={setLocalPatient}
                        />
                        <MyInput
                            width={200}
                            column
                            fieldLabel="Postal/ZIP code"
                            fieldName="postalCode"
                            record={localPatient}
                            setRecord={setLocalPatient}
                        />
                    </Form>

                );
            case 3:
                return (
                    <Form fluid layout="inline">
                        <span className="custom-text">
                            Insurance Information
                        </span>
                        <MyInput
                            column
                            width={200}
                            fieldLabel="Insurance Provider"
                            fieldType="select"
                            fieldName="insuranceProviderLkey"
                            selectData={isnuranceProviderTypeResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={patientInsurance}
                            setRecord={setPatientInsurance}
                            disabled={!localPatient.key}
                        />
                        <MyInput
                            width={200}
                            column
                            fieldLabel="Insurance Policy Number"
                            fieldName="insurancePolicyNumber"
                            record={patientInsurance}
                            setRecord={setPatientInsurance}
                            disabled={!localPatient.key}
                        />
                        <MyInput
                            width={200}
                            column
                            fieldLabel="Insurance Plan Type"
                            fieldType="select"
                            fieldName="insurancePlanTypeLkey"
                            selectData={isnurancePlanTypeResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={patientInsurance}
                            setRecord={setPatientInsurance}
                            disabled={!localPatient.key}
                        />
                        <MyInput
                            width={200}
                            column
                            fieldLabel="Group Number"
                            fieldName="groupNumber"
                            record={patientInsurance}
                            setRecord={setPatientInsurance}
                            disabled={!localPatient.key}
                        />
                        <MyInput
                            width={200}
                            column
                            fieldType="date"
                            fieldLabel="Expiration Date"
                            fieldName="expirationDate"
                            record={patientInsurance}
                            setRecord={setPatientInsurance}
                            disabled={!localPatient.key}
                        />
                    </Form>
                );
        };
    }

    // Effects
    useEffect(() => {
        if (savePatientMutation && savePatientMutation.status === 'fulfilled') {
            setLocalPatient(savePatientMutation.data);
            if (localPatient.documentTypeLkey) {
                setOpenNextDocument(true);
            }
        }
    }, [savePatientMutation]);
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Patient Registration"
            steps={[
                { title: 'Basic Info', icon: <FontAwesomeIcon icon={faUser} />, disabledNext: !localPatient?.key, footer: <MyButton onClick={pageCode === 'ER_Triage' ? handleSavePatientAndQuick : handleSave}>{pageCode === 'ER_Triage' ? "Save & Create Quick Appointment" : "Save"}</MyButton> },
                { title: 'Document', icon: <FontAwesomeIcon icon={faIdCard} />, disabledNext: !openNextDocument, footer: <MyButton onClick={handleSave} >Save</MyButton> },
                { title: 'Contact', icon: <FontAwesomeIcon icon={faPhone} />, footer: <MyButton onClick={handleSave} >Save</MyButton> },
                { title: 'Insurance', icon: <FontAwesomeIcon icon={faShieldHalved} />, footer: <MyButton onClick={handleSaveInsurance} >Save Insurance</MyButton> }
            ]}
            size="33vw"
            position='right'
            actionButtonLabel="Create"
            actionButtonFunction={() => { handleSave(); goToPatientProfile() }}
            content={conjureFormContent}
        />
    );
};
export default CreateNewPatient;
