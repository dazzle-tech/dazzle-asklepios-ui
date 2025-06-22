import MyButton from "@/components/MyButton/MyButton";
import React from "react";
import { Col, Divider, Row, Text } from "rsuite";
import '../styles.less'
import Diagnosis from "./Diagnosis";
import ProcedureVitals from "./ProcedureVitals";
import AdministeredMedications from "./AdministeredMedications ";
const PostProcedureCare = ({ procedure, setActiveTab, user }) => {


    return (<>
        <Row gutter={15} className="r">
            <Col md={12}>
                {/* Procedure Care */}
                <Diagnosis procedure={procedure} user={user} />
                <br />
                <Row>
                    <Col md={24}>
                    <AdministeredMedications procedure={procedure} user={user} />
                  </Col>
                </Row>
            </Col>
            <Col md={12}>
                <ProcedureVitals procedure={procedure} user={user} /></Col>

        </Row>

        <div className='bt-div'>

            <div className="bt-right">

                <MyButton onClick={() => setActiveTab("5")}>Complate and Next</MyButton>
            </div>
        </div></>)
}
export default PostProcedureCare;