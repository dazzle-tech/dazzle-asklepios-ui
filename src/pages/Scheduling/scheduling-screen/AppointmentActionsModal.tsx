import React from "react";
import { Button, ButtonToolbar, IconButton, Modal } from "rsuite";
import "./styles.less";
import PageIcon from '@rsuite/icons/Page';
import { faPrint, faSackDollar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const AppointmentActionsModal = ({ isActionsModalOpen, onActionsModalClose }) => {
    return (
        <div>
            <Modal open={
                isActionsModalOpen
            } onClose={onActionsModalClose}>
                <Modal.Header>
                    <Modal.Title>Selected Appointment</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <ButtonToolbar>
                        <Button style={{ width: 120, height: 40 }} color="cyan" appearance="primary">
                            Check-In
                        </Button>
                        <Button style={{ width: 120, height: 40 }} color="violet" appearance="primary">
                            Confirm
                        </Button>
                        <Button style={{ width: 120, height: 40 }} color="blue" appearance="primary">
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
                        <span style={{marginLeft:"13px"}}>Add Payment</span> 
                    </Button>
                </Modal.Body>

            </Modal>
        </div>
    );

}
export default AppointmentActionsModal;