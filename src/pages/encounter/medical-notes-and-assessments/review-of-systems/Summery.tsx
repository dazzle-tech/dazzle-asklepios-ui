import MyModal from '@/components/MyModal/MyModal';
import { faListCheck } from '@fortawesome/free-solid-svg-icons';
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Col, Form, Row } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
const Summary =({open ,setOpen,list ,encounter,setEncounter,saveEncounter})=>{
    return(<>
        <MyModal
        position='right'
        open={open} 
        setOpen={setOpen}
        title="Findings"
        hideActionBtn
        hideCanel
        steps={[
          {
            title: "Findings", icon:<FontAwesomeIcon icon={faListCheck}/>,
           
          },
        ]}
        content={
            <Row>
           <div className='summery-div'>
          
            {list?.map((item, index) => (
              <div key={index} className='summery-div-child'>
                <p>{item.systemLkey}</p>
                <p>{item.systemDetailLvalue ? item.systemDetailLvalue.lovDisplayVale
                  : item.systemDetailLkey}</p>
                <p> {item.notes}</p>
              </div>
            ))}
         
        </div>
        <Row>
          <Col md={21}>
          <Form fluid>
            <MyInput
              width="100%"
              fieldName='physicalExamSummery'
              record={encounter}
              setRecord={setEncounter}
             showLabel={false}
            />
          </Form>
          </Col>
          <Col md={3}>

           <MyButton
           onClick={saveEncounter}
           >Save</MyButton></Col>
          
           </Row>
        </Row>
       }>
        </MyModal>
        </>)
}
export default Summary;