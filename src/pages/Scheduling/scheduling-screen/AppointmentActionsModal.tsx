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

const AppointmentActionsModal = ({ isActionsModalOpen, onActionsModalClose, appointment, onStatusChange, editAppointment, viewAppointment  }) => {

    const [changeAppointmentStatus, changeAppointmentStatusMutation] = useChangeAppointmentStatusMutation()
    const dispatch = useAppDispatch();
    const [localAppointmentData, setLocalAppoitmentData] = useState(appointment)
    const [resonModal, setResonModal] = useState(false)
    const { data: resonLovQueryResponse } = useGetLovValuesByCodeQuery('APP_NOSHOW_REASON');

    const handleCheckIn = () => {
        const appointmentData = appointment?.appointmentData
        changeAppointmentStatus({ ...appointmentData, appointmentStatus: "Checked-In",noShowReasonLkey:null }).then(() => {
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
        changeAppointmentStatus({ ...appointmentData, appointmentStatus: "Confirmed",noShowReasonLkey:null }).then(() => {
            dispatch(notify('Appointment Confirmed Successfully'));
            onStatusChange()
            onActionsModalClose()

        })
    }

    const handleHide = () => {
        console.log(localAppointmentData)
        changeAppointmentStatus({...localAppointmentData, appointmentStatus: "No-Show" }).then(() => {
            dispatch(notify('Appointment has been hidden Successfully'));
            onStatusChange()
            onActionsModalClose()
            setResonModal(false)

        })
    }

    const handleCancel = () => {
        const appointmentData = appointment?.appointmentData
        changeAppointmentStatus({ ...appointmentData, appointmentStatus: "Canceled" ,noShowReasonLkey:null}).then(() => {
            dispatch(notify('Appointment has been hidden Successfully'));
            onStatusChange()
            onActionsModalClose()
        })
    }

    
    const handleChangeAction = () => {
        onActionsModalClose()
        editAction()
    }


    return (
        <div>
            <Modal open={
                isActionsModalOpen
            } onClose={onActionsModalClose}>
                <Modal.Header>
                    <Modal.Title>{appointment?.appointmentData.fullName}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <ButtonToolbar>
                        <Button disabled={appointment?.appointmentData.appointmentStatus == "Checked-In"} onClick={handleCheckIn} style={{ width: 120, height: 40 }} color="cyan" appearance="primary">
                            Check-In
                        </Button>
                        <Button disabled={appointment?.appointmentData.appointmentStatus == "Confirmed"} onClick={handleConfirm} style={{ width: 120, height: 40 }} color="violet" appearance="primary">
                            Confirm
                        </Button>
                        <Button disabled={appointment?.appointmentData.appointmentStatus == "No-Show"} onClick={() => setResonModal(true)} style={{ width: 120, height: 40 }} color="blue" appearance="primary">
                            No-show
                        </Button>

                    </ButtonToolbar>
                    <br />

                    <ButtonToolbar>
                        <Button  onClick={()=> viewAppointment() }  style={{ width: 120, height: 40 }} color="cyan" appearance="primary">
                            View
                        </Button>
                        <Button  onClick={()=> editAppointment() }  style={{ width: 120, height: 40 }} color="violet" appearance="primary">
                            Change
                        </Button>
                        <Button onClick={handleCancel} style={{ width: 120, height: 40 }} color="blue" appearance="primary">
                            Cancel
                        </Button>
                        

                    </ButtonToolbar>
                    <br />
                    <IconButton style={{ width: 200, height: 40 }} icon={<PageIcon />} color="cyan" appearance="ghost">
                        Print Certificate
                    </IconButton>
                    <br />
                    <br />

                    <Button style={{
                        width: 200,
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
                </Modal.Body>

            </Modal>



            <Modal backdrop={"static"} open={resonModal} onClose={() => setResonModal(false)}>
                <Modal.Header>
                    <Modal.Title>Please specify a reason for hiding this Appointment.</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <br />

                    <Form layout="inline">
                        <MyInput
                            width={350}
                            column
                            fieldLabel="Hide Reason"
                            fieldType="select"
                            fieldName="noShowReasonLkey"
                            selectData={resonLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={localAppointmentData}
                            setRecord={setLocalAppoitmentData}
                        />
                        <br />
                        <MyInput
                            width={350}
                            column
                            fieldName="Other Reasons"
                            record={localAppointmentData}
                            setRecord={setLocalAppoitmentData}
                            disabled
                        />
                    </Form>


                </Modal.Body>
                <Modal.Footer>
                    <IconButton onClick={() => { handleHide() }} color="violet" appearance="primary" icon={<CheckIcon />}>
                        Save
                    </IconButton>
                    <Divider vertical />
                    <IconButton onClick={() => { setResonModal(false) }} color="blue" appearance="primary" icon={<BlockIcon />}>
                        Cancel
                    </IconButton>
                </Modal.Footer>
            </Modal>
        </div>
    );

}
export default AppointmentActionsModal;