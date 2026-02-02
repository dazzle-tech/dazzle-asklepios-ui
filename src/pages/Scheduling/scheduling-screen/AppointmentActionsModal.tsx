import React, { useEffect, useState } from "react";
import { Button, ButtonToolbar, Divider, Form, IconButton, Input, Modal } from "rsuite";
import "./styles.less";
import PageIcon from '@rsuite/icons/Page';
import { faPrint, faSackDollar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useChangeAppointmentStatusMutation } from "@/services/appointmentService";
import { notify } from "@/utils/uiReducerActions";
import { useAppDispatch } from "@/hooks";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import MyInput from "@/components/MyInput";
import CheckIcon from '@rsuite/icons/Check';
import BlockIcon from '@rsuite/icons/Block';
import { useCompleteEncounterRegistrationMutation } from "@/services/encounterService";
import { newApEncounter } from "@/types/model-types-constructor";
import { faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { calculateAgeFormat } from "@/utils";
import MyModal from "@/components/MyModal/MyModal";
import MyButton from "@/components/MyButton/MyButton";
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { useGetResourceByIdQuery } from '@/services/setup/resource/ResourceService';

const AppointmentActionsModal = ({ isActionsModalOpen, onActionsModalClose, appointment, onStatusChange, editAppointment, viewAppointment }) => {

    const [changeAppointmentStatus, changeAppointmentStatusMutation] = useChangeAppointmentStatusMutation()
    const dispatch = useAppDispatch();
    const [localAppointmentData, setLocalAppoitmentData] = useState(appointment)
    const [resonModal, setResonModal] = useState(false)
    const [resonType, setResonType] = useState(null)
    const { data: noShowResonLovQueryResponse } = useGetLovValuesByCodeQuery('APP_NOSHOW_REASON');
    const { data: cancelResonLovQueryResponse } = useGetLovValuesByCodeQuery('APP_CANCEL_REASON');
    const [reasonKey, setResonKey] = useState<any>(null)
    const [otherReason, setOtherReason] = useState<any>(null)
    const [saveEncounter, saveEncounterMutation] = useCompleteEncounterRegistrationMutation();
    const [localEncounter, setLocalEncounter] = useState({ ...newApEncounter,discharge:false });

    // Fetch the selected resource to get its resourceKey (similar to PatientQuickAppointment)
    const { data: selectedResource } = useGetResourceByIdQuery(localAppointmentData?.resourceKey, {
        skip: !localAppointmentData?.resourceKey
    });

    const handleCheckIn = () => {
        const appointmentData = appointment?.appointmentData
        changeAppointmentStatus({ ...appointmentData, appointmentStatus: "Checked-In", reasonLkey: null, otherReason: null })
            .unwrap()
            .then(() => {
                dispatch(notify({ msg: 'Appointment Checked-In Successfully', sev: 'success' }));
                onStatusChange()
                onActionsModalClose()
                setLocalEncounter({ ...newApEncounter, discharge: false })
            })
            .catch((error) => {
                console.error('Error checking in appointment:', error);
                if (error?.status === 422) {
                    // Validation error - already handled by the mutation
                } else {
                    dispatch(notify({ msg: 'An error occurred while checking in the appointment', sev: 'warn' }));
                }
            });
    }
    const handleSaveVisit = (data) => {
        // Check if the resource type is department-based (similar to PatientQuickAppointment)
        const isDepartmentBasedResource = ['CLINIC', 'INPATIENT_ADMISSION', 'DAY_CASE', 'EMERGENCY'].includes(data?.resourceTypeLkey);
        
        // Get resourceKey - use data.resourceKey or fallback to localAppointmentData.resourceKey
        const resourceKeyToUse = data?.resourceKey || localAppointmentData?.resourceKey;
        
        // For department-based resources, use the resourceKey as departmentKey
        // For other resources, use the departmentKey as is (or null if not set)
        const departmentKeyToSave = isDepartmentBasedResource 
            ? resourceKeyToUse 
            : (data?.departmentKey || localAppointmentData?.departmentKey);

        const visit = {
            ...localEncounter,
            patientAge: data?.patient?.dob ? calculateAgeFormat(data.patient.dob) + '' : '',
            patientKey: data?.patient?.key,
            patientFullName: data?.patient?.fullName,
            encounterStatusLkey: "91063195286200",
            plannedStartDate: data?.appointmentStart,
            resourceTypeLkey: data?.resourceTypeLkey || localAppointmentData?.resourceTypeLkey,
            visitTypeLkey: data?.visitTypeLkey || localAppointmentData?.visitTypeLkey,
            resourceKey: resourceKeyToUse,
            departmentKey: departmentKeyToSave ? String(departmentKeyToSave) : departmentKeyToSave
        }
        
        saveEncounter(visit)
            .unwrap()
            .then(() => {
                // Success - encounter saved
            })
            .catch((error) => {
                console.error('Error saving encounter:', error);
                // Extract error message from API response
                const errorMessage = error?.data?.message || error?.message || 'An error occurred while saving the encounter';
                
                // Always show error message to user, regardless of status code
                dispatch(notify({ msg: errorMessage, sev: 'warning' }));
            });
    };

    useEffect(() => {
        if (appointment)
            setLocalAppoitmentData(appointment.appointmentData)
    }, [appointment])

    useEffect(() => {
        if (localAppointmentData) {
            // Handle local appointment data if needed
        }
    }, [localAppointmentData])

    const handleConfirm = () => {
        const appointmentData = appointment?.appointmentData || localAppointmentData
        changeAppointmentStatus({ ...appointmentData, appointmentStatus: "Confirmed", reasonLkey: null, otherReason: null })
            .unwrap()
            .then(() => {
                dispatch(notify({ msg: 'Appointment Confirmed Successfully', sev: 'success' }));
                onStatusChange()
                onActionsModalClose()
                setLocalEncounter({ ...newApEncounter, discharge: false })
                
                // Save encounter after appointment is confirmed
                // Use localAppointmentData which is properly set and has the resourceKey
                handleSaveVisit(localAppointmentData || appointmentData)
            })
            .catch((error) => {
                console.error('Error confirming appointment:', error);
                // Extract error message from API response
                const errorMessage = error?.data?.message || error?.message || 'An error occurred while confirming the appointment';
                
                // Always show error message to user
                dispatch(notify({ msg: errorMessage, sev: 'warning' }));
            });
    }

const handleNonShow = () => {
  const payload = {
    ...localAppointmentData,
    appointmentStatus: 'No-Show',
    reasonLkey: reasonKey?.reasonLkey,
    otherReason: otherReason?.otherReason
  };

  console.log('🚨 NO-SHOW PAYLOAD', payload);

  changeAppointmentStatus(payload)
    .unwrap()
    .then(() => {
      dispatch(notify({ msg: 'Appointment Status has been changed Successfully', sev: 'success' }));
      onStatusChange();
      onActionsModalClose();
      setResonModal(false);
      setResonType(null);
      setOtherReason(null);
      setResonKey(null);
    });
};


const handleCancel = () => {
  const appointmentData = appointment?.appointmentData;

  const payload = {
    ...appointmentData,
    appointmentStatus: 'Canceled',
    reasonLkey: reasonKey?.reasonLkey,
    otherReason: otherReason?.otherReason
  };

  console.log('🚨 CANCEL PAYLOAD', payload);

  changeAppointmentStatus(payload)
    .unwrap()
    .then(() => {
      dispatch(notify({ msg: 'Appointment has been canceled Successfully', sev: 'success' }));
      onStatusChange();
      onActionsModalClose();
      setResonType(null);
      setOtherReason(null);
      setResonKey(null);
    });
};



    const handleChangeAction = () => {
        onActionsModalClose()
    }


    // Appoinment Actions Modal Content
    const actionsModalContent = (
        <Form fluid layout="inline">
            <MyButton width="250px" disabled={["Checked-In", "Confirmed"].includes(appointment?.appointmentData.appointmentStatus)} onClick={handleCheckIn} color="cyan" appearance="primary">
                Check-In
            </MyButton>
            <MyButton width="250px" disabled={appointment?.appointmentData.appointmentStatus == "Confirmed"} onClick={handleConfirm} color="violet" appearance="primary">
                Confirm
            </MyButton>
            <MyButton width="250px" disabled={["No-Show", "Confirmed"].includes(appointment?.appointmentData.appointmentStatus)} onClick={() => { setResonType('No-show'), setResonModal(true) }} color="blue" appearance="primary">
                No-show
            </MyButton>
            <MyButton width="250px" onClick={() => viewAppointment(appointment?.appointmentData)} color="cyan" appearance="primary">
                View
            </MyButton>
            <MyButton width="250px" disabled={["Confirmed"].includes(appointment?.appointmentData.appointmentStatus)} onClick={() => editAppointment()} color="violet" appearance="primary">
                Change
            </MyButton>
            <MyButton width="250px" disabled={["Canceled", "Confirmed"].includes(appointment?.appointmentData.appointmentStatus)} onClick={() => { setResonType('Cancel') }} color="blue" appearance="primary">
                Cancel
            </MyButton>
        </Form>
    );
    // Cancel/No-Show Modal Content
    const cancelModalContent = (
        <Form fluid layout="vertical">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 520, maxWidth: '100%' }}>
                <MyInput
                    width="100%"
                    column
                    fieldLabel="Reason"
                    fieldType="select"
                    fieldName="reasonLkey"
                    selectData={resonType === 'Cancel' ? cancelResonLovQueryResponse?.object : noShowResonLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={reasonKey}
                    setRecord={setResonKey}
                />
                <MyInput
                    width="100%"
                    column
                    fieldLabel="Other Reason"
                    fieldName="otherReason"
                    record={otherReason}
                    setRecord={setOtherReason}
                />
            </div>
        </Form>
    );
    return (
        <div>
            <MyModal
                open={isActionsModalOpen}
                setOpen={onActionsModalClose}
                title={`${appointment?.title}  ${appointment?.fromTo}  ${appointment?.appointmentData.appointmentStatus}`}
                size="38vw"
                bodyheight="50vh"
                position="right"
                content={actionsModalContent}
                hideBack={true}
                hideActionBtn={true}
                steps={[{
                    title: "Appoinment Actions", icon: <FontAwesomeIcon icon={faCalendarCheck} />,
                    footer: <>
                        <MyButton appearance="ghost" prefixIcon={() => <PageIcon />}>
                            Print Certificate
                        </MyButton>
                        <MyButton appearance="ghost" prefixIcon={() => <FontAwesomeIcon icon={faSackDollar} />}>
                            Add Payment
                        </MyButton>
                    </>
                }]}
            />
            <MyModal
                open={resonType}
                setOpen={setResonType}
                title={`${`Please add the Appointment ${resonType} Reason. `}`}
                size="38vw"
                bodyheight="50vh"
                position="right"
                content={cancelModalContent}
                actionButtonFunction={() => { resonType === 'Cancel' ? handleCancel() : handleNonShow() }}
                isDisabledActionBtn={!(otherReason || reasonKey)}
                steps={[{ title: "Reason", icon: <FontAwesomeIcon icon={faClock} /> }]}
            />
        </div>
    );
}
export default AppointmentActionsModal;