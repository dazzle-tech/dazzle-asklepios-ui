import { useSaveIntraoperativeEventsMutation } from "@/services/operationService";
import { newApOperationIntraoperativeEvents } from "@/types/model-types-constructor";
import React,{useState} from "react";
import { Col, Divider, Form, Row, Text } from "rsuite";
const IntraoperativeEventsTracking=({operation})=>{
    const [intraoperative,setIntraoperative]=useState({...newApOperationIntraoperativeEvents});
    const [save]=useSaveIntraoperativeEventsMutation();
    return(<Form fluid>
        <Row gutter={15}>
            <Col md={12}>
             <Row>
                    <Col md={24} >
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Operation Details</Text>
                            </div>
                            <Divider />
                         


                        </div></Col>

                </Row>
                 <Row>
                    <Col md={24} >
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Intraoperative Events & Interventions</Text>
                            </div>
                            <Divider />
                         


                        </div></Col>

                </Row>
               

            </Col>
            <Col md={12}>
             <Row>
                    <Col md={24} >
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Surgical Instrument Tracking</Text>
                            </div>
                            <Divider />
                         


                        </div></Col>

                </Row>
                 <Row>
                    <Col md={24} >
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Time & Role Tracking</Text>
                            </div>
                            <Divider />
                         


                        </div></Col>

                </Row>
            </Col>
             <Row>
                    <Col md={24} >
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Medications, Fluids, and Transfusions</Text>
                            </div>
                            <Divider />
                         


                        </div></Col>

                </Row>
        </Row>
    </Form>)
}
export default IntraoperativeEventsTracking;