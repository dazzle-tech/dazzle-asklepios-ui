import React, { useEffect, useState } from 'react';
import {
    FlexboxGrid,
    IconButton,
    Input,
    Table,
    Grid,
    Row,
    Col,
    ButtonToolbar,
    Text,
    InputGroup,
    SelectPicker,
    Modal,
    Button,
    Form,
    Toggle
} from 'rsuite';
import { useAppDispatch, useAppSelector } from '@/hooks';
import VoiceCitation from '@/components/VoiceCitation';
import { newApPatientPlan } from '@/types/model-types-constructor';
import { notify } from '@/utils/uiReducerActions';
import { useSavePatientPlanMutation , useGetPatientPlansQuery} from '@/services/encounterService';
import { initialListRequest } from '@/types/types';
const Plan = () => {
    const dispatch = useAppDispatch();
    const patientSlice = useAppSelector(state => state.patient);
    const [savePlan, savePlanMutation] = useSavePatientPlanMutation();
    const [listRequest, setListRequest] = useState({
        ...initialListRequest,
        pageSize: 100,
        timestamp: new Date().getMilliseconds(),
        sortBy: 'createdAt',
        sortType: 'desc',
        filters: [
          {
            fieldName: 'patient_key',
            operator: 'match',
            value: patientSlice.patient.key
          },
          {
            fieldName: 'visit_key',
            operator: 'match',
            value: patientSlice.encounter.key
          }
          
        ]
      });
      const patientPlanListResponse =  useGetPatientPlansQuery(listRequest);
      const [localPlan, setLocalPlan] = useState({ ...newApPatientPlan, patientKey: patientSlice.patient.key, visitKey: patientSlice.encounter.key });
      useEffect(() => {
        if (patientPlanListResponse.data?.object?.length > 0) {
            setLocalPlan(patientPlanListResponse.data.object[0]);
        }
      }, [patientPlanListResponse.data]);
      console.log(localPlan);
    const saveChanges = async () => {
        try {
            await savePlan({...localPlan}).unwrap();
            dispatch(notify('saved  Successfully'));
        } catch (error) {

            console.error("Encounter save failed:", error);
            dispatch(notify('saved  fill'));
        }
    };
    console.log("patientkey:" + patientSlice.patient.key);
    console.log("patientvisit:" + patientSlice.encounter.key);
    return (<>
        <Grid fluid  >
            <Row gutter={15} style={{ height: '70px' }}>
                <Col xs={12} >
                    <div style={{ marginBottom: "8px", marginTop: "7px" , fontSize:"12px" }}> Physician Recommendations</div>
                    <VoiceCitation
                        originalRecord={localPlan}
                        record={{ ...localPlan }}
                        setRecord={setLocalPlan}
                        fieldName="physicianRecommendations"
                        saveMethod={saveChanges}
                        rows={4}
                    />
                </Col>

                <Col xs={12}>
                    <div style={{ marginBottom: "8px", marginTop: "7px", fontSize:"12px" }}>   Patient Education</div>
                    <VoiceCitation
                        originalRecord={localPlan}
                        record={{ ...localPlan}}
                        setRecord={setLocalPlan}
                        fieldName="patientEducations"
                        saveMethod={saveChanges}
                        rows={4}
                    />
                </Col>
            </Row>

            <Row gutter={15} style={{ height: '70px' }}>
                <Col xs={12}>
                    <div style={{ marginBottom: "10px", marginTop: "10px", fontSize:"12px" }}> Lifestyle Modification</div>
                    <VoiceCitation
                        originalRecord={localPlan}
                        record={{ ...localPlan}}
                        setRecord={setLocalPlan}
                        fieldName="lifestyleModifications"
                        saveMethod={saveChanges}
                        rows={4}
                    />
                </Col>

                <Col xs={12}>
                    <div style={{ marginBottom: "10px", marginTop: "10px", fontSize:"12px" }}>General Instructions</div>
                    <VoiceCitation
                        originalRecord={localPlan}
                        record={{ ...localPlan}}
                        setRecord={setLocalPlan}
                        fieldName="generalInstructions"
                        saveMethod={saveChanges}
                        rows={4}
                    />
                </Col>
            </Row>

        </Grid>
    </>);
}
export default Plan;