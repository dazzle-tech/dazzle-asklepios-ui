import React
 from "react";
 import Section from "@/components/Section";
import { Col, Row, Text } from "rsuite";
import DiagnosticsOrder from "../../diagnostics-order";
import SectionContainer from "@/components/SectionsoContainer";
import DrugOrder from "../../drug-order";
import AddEditFluidOrder from "../../iv-fluid-order/AddEditFluidOrder";
import IVFluidOrder from "../../iv-fluid-order";
import BloodOrder from "../../blood-order";
import Procedure from "../../procedure";
import Referrals from "../../procedure";
import OperationRequest from "../../operation-request/OperationRequest";
import Consultation from "../../consultation";
 const Orders=({encounter ,patient ,edit}) => {
  return (
   <>
      <Row >
        <Col md={24}> 
        <SectionContainer title={<Text>Labs and Imaging</Text> } content={<DiagnosticsOrder patient={patient} encounter={encounter} edit={edit}/>} />
        </Col>
      </Row>
      <Row >
        <Col md={24}> 
        <SectionContainer title={<Text>Medications</Text> } content={<DrugOrder patient={patient}  encounter={encounter} edit={edit}/>} />
        </Col>
      </Row>
      <Row >
        <Col md={24}> 
        <SectionContainer title={<Text>Fluids to be Given</Text> } content={<IVFluidOrder />} />
        </Col>
      </Row>
      <Row >
        <Col md={24}> 
        <SectionContainer title={<Text>Blood to be Given</Text> } content={<BloodOrder/>} />
        </Col>
      </Row>
      <Row >
        <Col md={24}>
        <SectionContainer title={<Text>Procedures Planned</Text> } content={<Referrals patient={patient} encounter={encounter} edit={edit}/>} />
        
         </Col>
      </Row>
        <Row >
        <Col md={24}>
        <SectionContainer title={<Text>Major Operations</Text> } content={<OperationRequest patient={patient} encounter={encounter} edit={edit}/>} />
        </Col>
        </Row>
        <Row >
        <Col md={24}>
        <SectionContainer title={<Text>Consultation Request</Text> } content={<Consultation patient={patient} encounter={encounter} edit={edit}/>} />
        </Col>
      </Row>
   </>
  );
}
export default Orders;