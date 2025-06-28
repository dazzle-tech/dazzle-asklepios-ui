import MyButton from "@/components/MyButton/MyButton";
import React from "react";
import { Col, Divider, Row, Text } from "rsuite";
import '../styles.less'
import Diagnosis from "./Diagnosis";
import ProcedureVitals from "./ProcedureVitals";
import AdministeredMedications from "./AdministeredMedications ";
import PostProcedureAnesthesia from "./PostProcedureAnesthesia";
import PostProcedureChecklist from "./PostProcedureChecklist";
const PostProcedureCare = ({ procedure, setActiveTab, user }) => {


    return (<>
        <Row gutter={15} className="r">
            <Col md={12}>
                {/* Procedure Care */}
                <Row>
                      <Col md={24}>
                    <Diagnosis procedure={procedure} user={user} /></Col>
                </Row>
                
              
                <Row>
                    <Col md={24}>
                    <AdministeredMedications procedure={procedure} user={user} />
                  </Col>
                </Row>
                <Row>
                    <Col md={24}>
                    <PostProcedureAnesthesia procedure={procedure} user={user} /></Col>
                </Row>
                
            </Col>
            <Col md={12}>
            <Row>
                  <Col md={24}>
                <ProcedureVitals procedure={procedure} user={user} /></Col>
            </Row>
                
              <Row>
                  <Col md={24}>
                 <PostProcedureChecklist procedure={procedure} user={user} /></Col>        
              </Row>
               
                </Col>

        </Row>

        <div className='bt-div'>

            <div className="bt-right">

                <MyButton onClick={() => setActiveTab("5")}>Complete and Next</MyButton>
            </div>
        </div></>)
}
export default PostProcedureCare;