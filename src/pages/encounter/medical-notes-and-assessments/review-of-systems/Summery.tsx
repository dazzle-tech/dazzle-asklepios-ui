import MyModal from '@/components/MyModal/MyModal';
import { faListCheck } from '@fortawesome/free-solid-svg-icons';
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Col, Form, Row } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';
import { PatientEncounter } from '@/types/model-types-new';
import { useUpdateEncounterMutation } from '@/services/encounters/patientEncounterService';
import { useAppDispatch } from '@/hooks';
const Summary =({open ,setOpen,list ,encounter,setEncounter,system})=>{

  const { data: bodySystemsDetailLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_SYS_DETAIL');
       const dispatch = useAppDispatch();
      const [updateEncounter] = useUpdateEncounterMutation();
    
      const toEncounterPayload = (encounter: any): PatientEncounter=> ({
        id: Number(encounter?.id),
        patientId: Number(encounter?.patientId ?? encounter?.patient?.id),
        encounterNumber: encounter?.encounterNumber ?? null,
        facilityId: Number(encounter?.facilityId),
        departmentId: Number(encounter?.departmentId),
        practitionerId: encounter?.practitionerId ?? null,
        paymentDate: encounter?.paymentDate,
        amount: encounter?.amount,
        encounterType: encounter?.encounterType,
        encounterReason: encounter?.encounterReason,
        followUpEncounterId: encounter?.followUpEncounterId ?? encounter?.followUpEncounter?.id ?? null,
        priorityLevel: encounter?.priorityLevel,
        originType: encounter?.originType ?? null,
        originName: encounter?.originName ?? null,
        notes: encounter?.notes ?? null,
        departmentDailySequenceNumber: encounter?.departmentDailySequenceNumber ?? null,
        encounterDate: encounter?.encounterDate ?? null,
        status: encounter?.status,
        chiefComplaint: encounter?.chiefComplaint ?? null,
        hasPrescription: Boolean(encounter?.hasPrescription),
        hasOrder: Boolean(encounter?.hasOrder),
        isObserved: Boolean(encounter?.isObserved),
        physicalExaminationSummery: encounter?.physicalExaminationSummery ?? null,
      });
    
      const saveChanges = async () => {
        try {
          const idToUpdate = encounter?.id ;
    
          if (!idToUpdate) {
            dispatch(notify({ msg: 'No encounter id to update', sev: 'error' }));
            return;
          }
    
          const payload = toEncounterPayload(encounter);
    
          if (!payload.patientId || !payload.facilityId || !payload.departmentId) {
            dispatch(
              notify({
                msg: 'Missing required fields: patientId / facilityId / departmentId',
                sev: 'error'
              })
            );
            return;
          }
    
          
    
          const updatedEncounter = await updateEncounter({
            id: idToUpdate,
            body: {...encounter,patientId:encounter?.patient?.id }
          }).unwrap();
    
          setEncounter(updatedEncounter);
          dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
        } catch {
          dispatch(notify({ msg: 'Save Failed', sev: 'error' }));
        }
      };
    return(<>
        <MyModal
        position='right'
        open={open} 
        setOpen={setOpen}
        title="Findings"
        hideActionBtn
        hideCancel
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
                <p>{system?.object?.find((i)=>i.key===item.bodySystem)?.lovDisplayVale}</p>
                <p>{item.systemDetailLvalue ? item.systemDetailLvalue.lovDisplayVale
                  : item.systemDetailLkey}</p>
                  <p>{bodySystemsDetailLovQueryResponse?.object.find((i)=>i.key===item.systemDetail)?.lovDisplayVale}</p>
                <p> {item.note}</p>
              </div>
            ))}
         
        </div>
        <Row>
          <Col md={24}>
          <Form fluid>
            <MyInput
              width="100%"
              fieldType='textarea'
              fieldLabel='Additional Findings Summery'
              fieldName='physicalExaminationSummery'
              record={encounter}
              setRecord={setEncounter}
            />
          </Form>
          </Col>
          </Row>
          <Row>
          <Col md={3}>

           <MyButton
           onClick={saveChanges}
           >Save</MyButton></Col>
          
           </Row>
        </Row>
       }>
        </MyModal>
        </>)
}
export default Summary;