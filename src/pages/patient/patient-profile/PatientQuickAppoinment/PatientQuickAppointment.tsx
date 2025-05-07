import { useAppDispatch } from '@/hooks';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyButton from '@/components/MyButton/MyButton';
import { newApEncounter } from '@/types/model-types-constructor';
import React, { useEffect, useState } from 'react';
import 'react-tabs/style/react-tabs.css';
import { faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import { faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';
import { faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';
import { useCompleteEncounterRegistrationMutation } from '@/services/encounterService';
import { notify } from '@/utils/uiReducerActions';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { calculateAgeFormat } from '@/utils';
import MyModal from '@/components/MyModal/MyModal';
import '../styles.less'
import RegistrationEncounter from './RegistrationEncounter';
import PatientPaymentInfo from './PatientPaymentInfo';
import AddPayment from './AddPayment';
const PatientQuickAppointment = ({ quickAppointmentModel, localPatient, setQuickAppointmentModel, localVisit }) => {
    const dispatch = useAppDispatch();
    const [localEncounter, setLocalEncounter] = useState({ ...newApEncounter, visitTypeLkey: '2041082245699228', patientKey: localPatient.key, plannedStartDate: new Date(), patientAge: calculateAgeFormat(localPatient.dob) });
    const [validationResult, setValidationResult] = useState({});
    const [saveEncounter, saveEncounterMutation] = useCompleteEncounterRegistrationMutation();
    const [isReadOnly, setIsReadOnly] = useState(false);
    const encounterStatusNew = '91063195286200'; // TODO change this to be fetched from redis based on LOV CODE

    // Handle Save Encounter
    const handleSave = () => {
        if (localEncounter && localEncounter.patientKey) {
            saveEncounter({
                ...localEncounter,
                patientKey: localPatient.key,
                plannedStartDate: new Date(),
                encounterStatusLkey: encounterStatusNew,
                patientAge: calculateAgeFormat(localPatient.dob),
                visitTypeLkey: ['2039534205961578', '2039516279378421'].includes(localEncounter.resourceTypeLkey) ? '2041082245699228' : null
            }).unwrap().then(() => {
            }).catch((e) => {

                if (e.status === 422) {
                    console.log("Validation error: Unprocessable Entity", e);
                  
                } else {
                    console.log("An unexpected error occurred", e);
                    dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warn' }));
                }
            });;
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


        })
    };
    // Effects
    useEffect(() => {
        if (saveEncounterMutation && saveEncounterMutation.status === 'fulfilled') {
            setLocalEncounter(saveEncounterMutation.data);
            dispatch(notify('Encounter Saved Successfuly!'));
        } else if (saveEncounterMutation && saveEncounterMutation.status === 'rejected') {
            setValidationResult(saveEncounterMutation.error);
        }
    }, [saveEncounterMutation]);
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
                    <RegistrationEncounter localEncounter={localEncounter} setLocalEncounter={setLocalEncounter} isReadOnly={isReadOnly} />
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
    }
    return (
        <MyModal
            open={quickAppointmentModel}
            setOpen={setQuickAppointmentModel}
            title="Quick Appointment"
            steps={[{
                title: 'Encounter', disabledNext: !localEncounter?.key, icon: faCalendarCheck, footer: <><MyButton prefixIcon={() => <FontAwesomeIcon icon={faBroom} />} onClick={handleClear} disabled={isReadOnly} >Clear</MyButton>
                    <MyButton
                        disabled={isReadOnly}
                        onClick={handleSave}
                        prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}>Save</MyButton> </>
            }
                , {
                title: 'Payment', icon: faFileInvoiceDollar, footer: <MyButton
                    disabled={isReadOnly}
                    prefixIcon={() => <AddOutlineIcon />}
                >
                    <span>Add payment</span>
                </MyButton>
            }
                , { title: 'Add Payment', icon: faMoneyBillWave }]}
            content={(step) => conjureFormContent(step)}
            size="750px"
            bodyheight={400}
        />
    );
};
export default PatientQuickAppointment;
