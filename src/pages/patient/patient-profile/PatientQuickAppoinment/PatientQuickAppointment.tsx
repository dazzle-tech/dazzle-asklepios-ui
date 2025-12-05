import { useAppDispatch } from '@/hooks';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyButton from '@/components/MyButton/MyButton';
import { newApEncounter } from '@/types/model-types-constructor';
import React, { useEffect, useState } from 'react';
import 'react-tabs/style/react-tabs.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import { faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';
import { faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';
import { useCompleteEncounterRegistrationMutation } from '@/services/encounterService';
import { useGetResourceByIdQuery } from '@/services/setup/resource/ResourceService';
import { notify } from '@/utils/uiReducerActions';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { calculateAgeFormat } from '@/utils';
import MyModal from '@/components/MyModal/MyModal';
import '../styles.less'
import RegistrationEncounter from './RegistrationEncounter';
import PatientPaymentInfo from './PatientPaymentInfo';
import AddPayment from './AddPayment';

const PatientQuickAppointment = ({ quickAppointmentModel, localPatient, setQuickAppointmentModel, localVisit, isDisabeld = false, onEncounterSaved }) => {
    const dispatch = useAppDispatch();
    const [localEncounter, setLocalEncounter] = useState({ ...newApEncounter, visitTypeLkey: '2041082245699228', patientKey: localPatient.key, plannedStartDate: new Date(), patientAge: calculateAgeFormat(localPatient.dob), discharge: false });
    const [validationResult, setValidationResult] = useState({});
    const [saveEncounter, saveEncounterMutation] = useCompleteEncounterRegistrationMutation();
    const [isReadOnly, setIsReadOnly] = useState(isDisabeld);
    const encounterStatusNew = '91063195286200'; // TODO change this to be fetched from redis based on LOV CODE

    // Fetch the selected resource to get its resourceKey
    const { data: selectedResource } = useGetResourceByIdQuery(localEncounter.resourceKey, {
        skip: !localEncounter.resourceKey
    });

    const validateRequiredFields = () => {
        const missingFields: string[] = [];
        if (!localEncounter?.facilityKey) {
            missingFields.push('Facility');
        }
        if (!localEncounter?.resourceTypeLkey) {
            missingFields.push('Resource Type');
        }
        if (!localEncounter?.resourceKey) {
            missingFields.push('Resource');
        }
        if (!localEncounter?.visitTypeLkey) {
            missingFields.push('Visit Type');
        }
        // Validate department for PRACTITIONER and PROCEDURE resource types
        if ((localEncounter?.resourceTypeLkey === '2039534205961578' || localEncounter?.resourceTypeLkey === 'PRACTITIONER' || localEncounter?.resourceTypeLkey === 'PROCEDURE') && !localEncounter?.departmentKey) {
            missingFields.push('Department');
        }
        if (missingFields.length > 0) {
            const lines = missingFields.map(field => `• ${field}: is required`);
            dispatch(
                notify({
                    msg: `Please fix the following fields:\n${lines.join('\n')}`,
                    sev: 'error'
                })
            );
            return false;
        }
        return true;
    };
    // Handle Save Encounter
    const handleSave = () => {
        if (!validateRequiredFields()) {
            return;
        }
        if (localEncounter && localEncounter.patientKey) {
            // For department-based resources (CLINIC, INPATIENT_ADMISSION, DAY_CASE, EMERGENCY),
            // use the resourceKey from the selected resource as departmentKey
            // For other resources, use the departmentKey as is
            const isDepartmentBasedResource = ['CLINIC', 'INPATIENT_ADMISSION', 'DAY_CASE', 'EMERGENCY'].includes(localEncounter?.resourceTypeLkey);
            const departmentKeyToSave = isDepartmentBasedResource 
                ? selectedResource?.resourceKey 
                : localEncounter.departmentKey;
            

            saveEncounter({
                ...localEncounter,
                patientKey: localPatient.key,
                plannedStartDate: new Date(),
                departmentKey: departmentKeyToSave,
                encounterStatusLkey: ["4217389643435490", "5433343011954425", "2039548173192779",'INPATIENT_ADMISSION','DAY_CASE','PROCEDURE'].includes(localEncounter?.resourceTypeLkey) ? "5256965920133084" : localEncounter?.resourceTypeLkey === "EMERGENCY" ? "8890456518264959" : encounterStatusNew,
                patientAge: calculateAgeFormat(localPatient.dob),
                visitTypeLkey: ['2039534205961578', '2039516279378421','CLINIC','PRACTITIONER'].includes(localEncounter.resourceTypeLkey) ? '2041082245699228' : null
            }).unwrap().then(() => {
            }).catch((e) => {

                if (e.status === 422) {
                    console.log("Validation error: Unprocessable Entity", e);

                } else {
                    console.log("An unexpected error occurred", e);
                    dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warn' }));
                }
            });
        } else {
            dispatch(notify({ msg: 'encounter not linked to patient', sev: 'error' }));
        }
    };
    // Handle Clear Fields
    const handleClear = () => {
        setLocalEncounter({
            ...newApEncounter, patientKey: localPatient.key, plannedStartDate: new Date(),
            encounterStatusLkey: undefined,
            encounterClassLkey: null,
            encounterPriorityLkey: null,
            encounterTypeLkey: null,
            serviceTypeLkey: null,
            patientStatusLkey: null,
            basedOnLkey: null,
            visitTypeLkey: null,
            physicalExamSummeryKey: null,
            dischargeTypeLkey: null,
            paymentTypeLkey: null,
            payerTypeLkey: null,
            locationTypeLkey: null,
            physicianKey: null,
            departmentKey: null,
            reasonLkey: null,
            discharge: false
        })
    };
    // Effects
    useEffect(() => {
        if (saveEncounterMutation && saveEncounterMutation.status === 'fulfilled') {
            setLocalEncounter(saveEncounterMutation.data);
            dispatch(notify({ msg: 'Encounter Saved Successfuly', sev: "success" }));
            // Notify parent component to refresh the encounter list
            if (onEncounterSaved) {
                onEncounterSaved();
            }
        } else if (saveEncounterMutation && saveEncounterMutation.status === 'rejected') {
            setValidationResult(saveEncounterMutation.error);
        }
    }, [saveEncounterMutation, onEncounterSaved]);
    useEffect(() => {
        if (localVisit?.key != undefined) {
            setLocalEncounter({ ...localVisit });
            setIsReadOnly(true);
        }
    }, [localVisit]);

    // This function returns the appropriate form component based on the current step number.
    // Step 0: Shows the RegistrationEncounter component.
    // Step 1: Shows the PatientPaymentInfo component.
    // Step 2: Shows the AddPayment component. 
    const conjureFormContent = stepNumber => {
        switch (stepNumber) {
            case 0:
                return (
                    <RegistrationEncounter localEncounter={localEncounter} setLocalEncounter={setLocalEncounter} isReadOnly={isReadOnly} localPatient={localPatient} />
                );
            case 1:
                return (
                    <PatientPaymentInfo localPatient={localPatient} localEncounter={localEncounter} setLocalEncounter={setLocalEncounter} isReadOnly={isReadOnly} />
                );
            case 2:
                return (
                    <AddPayment isReadOnly={isReadOnly} />
                );
        };
    };
    return (
        <MyModal
            open={quickAppointmentModel}
            setOpen={setQuickAppointmentModel}
            title="Quick Appointment"
            steps={[{
                title: 'Encounter', disabledNext: !localEncounter?.key, icon: <FontAwesomeIcon icon={faCalendarCheck} />, footer: <><MyButton prefixIcon={() => <FontAwesomeIcon icon={faBroom} />} onClick={handleClear} disabled={isReadOnly} >Clear</MyButton>
                    <MyButton
                        disabled={isReadOnly}
                        onClick={handleSave}
                        prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}>Save</MyButton> </>
            }
                , {
                title: 'Payment', icon: <FontAwesomeIcon icon={faFileInvoiceDollar} />, footer: <MyButton
                    disabled={isReadOnly}
                    prefixIcon={() => <AddOutlineIcon />}
                >
                   Add payment
                </MyButton>
            }
                , { title: 'Add Payment', icon: <FontAwesomeIcon icon={faMoneyBillWave} /> }]}
            content={(step) => conjureFormContent(step)}
            size="55vw"
            bodyheight="65vh"
            hideActionBtn={isReadOnly}
        />
    );
};
export default PatientQuickAppointment;