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

const AppointmentActionsModal = ({ isActionsModalOpen, onActionsModalClose, appointment, onStatusChange, editAppointment, viewAppointment }) => {

    const [changeAppointmentStatus, changeAppointmentStatusMutation] = useChangeAppointmentStatusMutation()
    const dispatch = useAppDispatch();
    const [localAppointmentData, setLocalAppoitmentData] = useState(appointment)
    const [resonModal, setResonModal] = useState(false)
    const [resonType, setResonType] = useState(null)
    const { data: noShowResonLovQueryResponse } = useGetLovValuesByCodeQuery('APP_NOSHOW_REASON');
    const { data: cancelResonLovQueryResponse } = useGetLovValuesByCodeQuery('APP_CANCEL_REASON');
    const [reasonKey, setResonKey] = useState()
    const [otherReason, setOtherReason] = useState()
    const [saveEncounter, saveEncounterMutation] = useCompleteEncounterRegistrationMutation();
    const [localEncounter, setLocalEncounter] = useState({ ...newApEncounter,discharge:false });

    const handleCheckIn = () => {
        const appointmentData = appointment?.appointmentData
        changeAppointmentStatus({ ...appointmentData, appointmentStatus: "Checked-In", reasonLkey: null, otherReason: null }).then(() => {
            dispatch(notify('Appointment Checked-In Successfully'));
            onStatusChange()
            onActionsModalClose()
            setLocalEncounter({ ...newApEncounter,discharge:false })

        })
    }
    const handleSaveVisit = (data) => {
        const visit = {
            ...localEncounter,
            patientAge: data?.patient.dob ? calculateAgeFormat(data.patient.dob) + '' : '',
            patientKey: data?.patient.key,
            patientFullName: data?.patient.fullName,
            encounterStatusLkey: "91063195286200",
            plannedStartDate: data?.appointmentStart,
            resourceTypeLkey: data?.resourceTypeLkey,
            visitTypeLkey: data?.visitTypeLkey,
            resourceKey: data.resourceKey
        }
        saveEncounter(visit).unwrap();
    };

    useEffect(() => {
        if (appointment)
            setLocalAppoitmentData(appointment.appointmentData)
    }, [appointment])

    useEffect(() => {
        if (localAppointmentData)
            console.log(localAppointmentData)
    }, [localAppointmentData])

    const handleConfirm = () => {
        const appointmentData = appointment?.appointmentData
        changeAppointmentStatus({ ...appointmentData, appointmentStatus: "Confirmed", reasonLkey: null, otherReason: null }).then(() => {
            dispatch(notify('Appointment Confirmed Successfully'));
            onStatusChange()
            onActionsModalClose()
            setLocalEncounter({ ...newApEncounter,discharge:false })

        }).then(() => {
            handleSaveVisit(appointment?.appointmentData)
        })
    }

    const handleNonShow = () => {
        console.log(localAppointmentData)
        changeAppointmentStatus({ ...localAppointmentData, appointmentStatus: "No-Show", otherReason: otherReason?.otherReason, reasonLkey: reasonKey?.reasonLkey }).then(() => {
            dispatch(notify('Appointment Status has been changed Successfully'));
            onStatusChange()
            onActionsModalClose()
            setResonModal(false)
            setResonType(null)
            setOtherReason(null)
            setResonKey(null)
            setLocalEncounter({ ...newApEncounter,discharge:false })


        })
    }

    const handleCancel = () => {
        const appointmentData = appointment?.appointmentData
        changeAppointmentStatus({ ...appointmentData, appointmentStatus: "Canceled", otherReason: otherReason?.otherReason, reasonLkey: reasonKey?.reasonLkey }).then(() => {
            dispatch(notify('Appointment has been canceled Successfully'));
            onStatusChange()
            onActionsModalClose()
            setResonType(null)
            setOtherReason(null)
            setResonKey(null)
        })
    }


    const handleChangeAction = () => {
        onActionsModalClose()
    }

    useEffect(() => {
        console.log(appointment)
    }, [appointment])

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
            <MyButton width="250px" onClick={() => viewAppointment()} color="cyan" appearance="primary">
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
        <Form layout="inline">
            <MyInput
                width={400}
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
                width={400}
                column
                fieldLabel="Other Reason"
                fieldName="otherReason"
                record={otherReason}
                setRecord={setOtherReason}
            />
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