import React, { useEffect, useState } from "react";
import { Button, ButtonToolbar, IconButton, Modal } from "rsuite";
import "./styles.less";
import PageIcon from '@rsuite/icons/Page';
import { faPrint, faSackDollar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useChangeAppointmentStatusMutation } from "@/services/appointmentService";
import { notify } from "@/utils/uiReducerActions";
import { useAppDispatch } from "@/hooks";

const AppointmentActionsModal = ({ isActionsModalOpen, onActionsModalClose, appointment, onStatusChange }) => {

    const [changeAppointmentStatus, changeAppointmentStatusMutation] = useChangeAppointmentStatusMutation()
    const dispatch = useAppDispatch();
    const [reRenderModal, setReRenderModal] = useState(true)

    const handleCheckIn = () => {
        const appointmentData = appointment?.appointmentData
        changeAppointmentStatus({ ...appointmentData, appointmentStatus: "Checked-In" }).then(() => {
            dispatch(notify('Appointment Checked-In Successfully'));
            onStatusChange()
            onActionsModalClose()

        })
    }

    const handleConfirm = () => {
        const appointmentData = appointment?.appointmentData
        changeAppointmentStatus({ ...appointmentData, appointmentStatus: "Queued" }).then(() => {
            dispatch(notify('Appointment Confirmed Successfully'));
            onStatusChange()
            onActionsModalClose()

        })
    }

    const handleHide = () => {
        const appointmentData = appointment?.appointmentData
        changeAppointmentStatus({ ...appointmentData, appointmentStatus: "No-Show" }).then(() => {
            dispatch(notify('Appointment has been hidden Successfully'));
            onStatusChange()
            onActionsModalClose()

        })
    }

    const handleView = () => {
        const appointmentData = appointment?.appointmentData
        changeAppointmentStatus({ ...appointmentData, appointmentStatus: "No-Show" }).then(() => {
            dispatch(notify('Appointment has been hidden Successfully'));
            onStatusChange()
            onActionsModalClose()

        })
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
                        <Button disabled={appointment?.appointmentData.appointmentStatus == "Queued"}  onClick={handleConfirm} style={{ width: 120, height: 40 }} color="violet" appearance="primary">
                            Confirm
                        </Button>
                        <Button  disabled={appointment?.appointmentData.appointmentStatus == "No-Show"} onClick={handleHide}  style={{ width: 120, height: 40 }} color="blue" appearance="primary">
                            No-show
                        </Button>

                    </ButtonToolbar>
                    <br />

                    <ButtonToolbar>
                        <Button style={{ width: 120, height: 40 }} color="cyan" appearance="primary">
                            View
                        </Button>
                        <Button style={{ width: 120, height: 40 }} color="violet" appearance="primary">
                            Change
                        </Button>
                        <Button style={{ width: 120, height: 40 }} color="blue" appearance="primary">
                            Cancel
                        </Button>
                        <Button onClick={() => console.log(appointment)} style={{ width: 120, height: 40 }} color="blue" appearance="primary">
                            Test
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
        </div>
    );

}
export default AppointmentActionsModal;