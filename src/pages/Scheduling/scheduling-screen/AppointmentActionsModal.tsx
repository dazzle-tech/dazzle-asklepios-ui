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

    const handleCheckIn = () => {
        const appointmentData = appointment?.appointmentData
        changeAppointmentStatus({ ...appointmentData, appointmentStatus: "Checked-In", reasonLkey: null, otherReason: null }).then(() => {
            dispatch(notify('Appointment Checked-In Successfully'));
            onStatusChange()
            onActionsModalClose()

        })
    }

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

        })
    }


    useEffect(() => {
        console.log(reasonKey)
        console.log(otherReason)

    }, [otherReason, reasonKey])

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

    return (
        <div>
            <Modal open={
                isActionsModalOpen
            } onClose={onActionsModalClose}>
                <Modal.Header>
                    <Modal.Title>{`${appointment?.title}  ${appointment?.fromTo}  ${appointment?.appointmentData.appointmentStatus}`}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <ButtonToolbar>
                        <Button disabled={appointment?.appointmentData.appointmentStatus == "Checked-In"} onClick={handleCheckIn} style={{ width: 120, height: 40 }} color="cyan" appearance="primary">
                            Check-In
                        </Button>
                        <Button disabled={appointment?.appointmentData.appointmentStatus == "Confirmed"} onClick={handleConfirm} style={{ width: 120, height: 40 }} color="violet" appearance="primary">
                            Confirm
                        </Button>
                        <Button disabled={appointment?.appointmentData.appointmentStatus == "No-Show"} onClick={() => { setResonType('No-show'), setResonModal(true) }} style={{ width: 120, height: 40 }} color="blue" appearance="primary">
                            No-show
                        </Button>

                    </ButtonToolbar>
                    <br />

                    <ButtonToolbar>
                        <Button onClick={() => viewAppointment()} style={{ width: 120, height: 40 }} color="cyan" appearance="primary">
                            View
                        </Button>
                        <Button onClick={() => editAppointment()} style={{ width: 120, height: 40 }} color="violet" appearance="primary">
                            Change
                        </Button>
                        <Button disabled={appointment?.appointmentData.appointmentStatus == "Canceled"} onClick={() => { setResonType('Cancel') }} style={{ width: 120, height: 40 }} color="blue" appearance="primary">
                            Cancel
                        </Button>


                    </ButtonToolbar>
                    <br />
                    <div style={{display:"flex",gap:"20px"}}>
                    <IconButton style={{ width: 180, height: 40 }} icon={<PageIcon />} color="cyan" appearance="ghost">
                        Print Certificate
                    </IconButton>


                    <Button style={{
                        width: 180,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        borderRadius: "5px",
                        height: 40
                    }}
                        color="blue" appearance="ghost" >

                        <FontAwesomeIcon icon={faSackDollar} style={{ marginRight: "25px", fontSize: "18px" }} />
                        <span style={{ marginLeft: "13px" }}>Add Payment</span>
                    </Button>
                    </div>
                  
                </Modal.Body>

            </Modal>



            <Modal backdrop={"static"} open={resonType} onClose={() => setResonType(null)}>
                <Modal.Header>
                    <Modal.Title>{`Please add the appointment ${resonType} reason. `}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <br />
                    <br />

                    <Form layout="inline">
                        <MyInput
                            width={350}
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
                        <br />
                        <MyInput
                            width={350}
                            column
                            fieldLabel="Other Reason"
                            fieldName="otherReason"
                            record={otherReason}
                            setRecord={setOtherReason}
                        />
                    </Form>

                    <br />
                    <br />
                </Modal.Body>
                <Modal.Footer>
                    <IconButton
                        disabled={!(otherReason || reasonKey)} onClick={() => { resonType === 'Cancel' ? handleCancel() : handleNonShow() }} color="violet" appearance="primary" icon={<CheckIcon />}>
                        Save
                    </IconButton>
                    <Divider vertical />
                    <IconButton onClick={() => { setResonType(null) }} color="blue" appearance="primary" icon={<BlockIcon />}>
                        Cancel
                    </IconButton>
                </Modal.Footer>
            </Modal>
        </div>
    );

}
export default AppointmentActionsModal;