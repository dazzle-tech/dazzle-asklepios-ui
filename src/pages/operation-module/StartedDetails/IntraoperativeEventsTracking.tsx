import { useSaveIntraoperativeEventsMutation } from "@/services/operationService";
import { newApOperationIntraoperativeEvents } from "@/types/model-types-constructor";
import React,{useState} from "react";
import { Col, Divider, Form, Row, Text } from "rsuite";
const IntraoperativeEventsTracking=()=>{
    const [intraoperative,setIntraoperative]=useState({...newApOperationIntraoperativeEvents});
    const [save]=useSaveIntraoperativeEventsMutation();
    return(<Form fluid>
        <Row gutter={15}>
            <Col md={12}>
             <Row>
                    <Col md={24} >
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Patient Preparation</Text>
                            </div>
                            <Divider />
                         


                        </div></Col>

                </Row>

            </Col>
            <Col md={12}>
            </Col>
        </Row>
    </Form>)
}
export default IntraoperativeEventsTracking;