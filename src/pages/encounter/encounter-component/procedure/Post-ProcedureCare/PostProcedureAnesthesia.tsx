import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import { useAppDispatch } from "@/hooks";
import { useSavePostProcedurAnesthesiaMutation } from "@/services/procedureService";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { newApPostProcedureAnesthesia } from "@/types/model-types-constructor";
import { notify } from "@/utils/uiReducerActions";
import { set } from "lodash";
import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Col, Divider, Form, Row, Text } from "rsuite";
export type anesthsiaRef = {
    handleSave: () => void;
};
type AnesthesiaProps = {
    procedure: any,
    user: any
};
const PostProcedureAnesthesia= forwardRef<anesthsiaRef, AnesthesiaProps>(({ procedure, user, ...props }, ref) => {
    const dispatch = useAppDispatch();
    // Fetching the LOV values for Aldrete score components
    const { data: oxsatQueryResponse } = useGetLovValuesByCodeQuery('ALDRETE_OXSAT');
    const { data: conscLovQueryResponse } = useGetLovValuesByCodeQuery('ALDRETE_CONSC');
    const { data: circuLovQueryResponse } = useGetLovValuesByCodeQuery('ALDRETE_CIRCU');
    const { data: respirLovQueryResponse } = useGetLovValuesByCodeQuery('ALDRETE_RESPIR');
    const { data: activityLovQueryResponse } = useGetLovValuesByCodeQuery('ALDRETE_ACTIVITY');
    const [anesthesia, setAnesthesia] = useState({ ...newApPostProcedureAnesthesia });
    const [saveAnesthesia,saveAnesthesiaMutation] = useSavePostProcedurAnesthesiaMutation();
//calculate aldrete score based on the selected values
  useEffect(() => {
    const oxsatscore = oxsatQueryResponse?.object?.find(item => item.key === anesthesia?.oxygenSaturationLkey)?.score || 0;
    const conscscore = conscLovQueryResponse?.object?.find(item => item.key === anesthesia?.consciousnessLkey)?.score || 0;
    const circuscore = circuLovQueryResponse?.object?.find(item => item.key === anesthesia?.circulationLkey)?.score || 0;
    const respirscore = respirLovQueryResponse?.object?.find(item => item.key === anesthesia?.respirationLkey)?.score || 0;
    const activityscore = activityLovQueryResponse?.object?.find(item => item.key === anesthesia?.activityLkey)?.score || 0;

    const aldreteScore = oxsatscore + conscscore + circuscore + respirscore + activityscore;
   

    setAnesthesia(prev => ({
        ...prev,
        aldreteScore
    }));
}, [
    anesthesia?.oxygenSaturationLkey,
    anesthesia?.consciousnessLkey,
    anesthesia?.circulationLkey,
    anesthesia?.respirationLkey,
    anesthesia?.activityLkey,
    oxsatQueryResponse,
    conscLovQueryResponse,
    circuLovQueryResponse,
    respirLovQueryResponse,
    activityLovQueryResponse
]);
// Update the anesthesia state when saveAnesthesiaMutation changes
    useEffect(()=>{
        
        setAnesthesia(saveAnesthesiaMutation?.data || newApPostProcedureAnesthesia);
    },[saveAnesthesiaMutation]);
// Function to handle saving the anesthesia data
    const handleSave = async () => {
        try {
            const response = await saveAnesthesia({
                ...anesthesia,
                procedureKey: procedure?.key,
                createdBy: user?.key,
            }).unwrap();
            dispatch(notify({ msg: 'Saved Anesthesia Successfully', sev: "success" }));
        } catch (error) {
            dispatch(notify({ msg: 'Error saving anesthesia', sev: "error" }));
        }
    }
    // use to
    useImperativeHandle(ref, () => ({
             handleSave
          }));
    return ( <div  className='container-form' ref={ref}>
            <div  className='title-div'>
                <Text>Post-Procedure Anesthesia</Text> 
            </div>
            <Divider />
        <Row gutter={15} className="r">
            <Form fluid>
                <Col md={12}>
                    <MyInput
                        width="100%"
                        da selectData={oxsatQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldType="select"
                        fieldName={"oxygenSaturationLkey"}
                        record={anesthesia}
                        setRecord={setAnesthesia}
                        searchable={false}
                    />
                     <MyInput
                        width="100%"
                        selectData={conscLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldType="select"
                        fieldName={"consciousnessLkey"}
                        record={anesthesia}
                        setRecord={setAnesthesia}
                        searchable={false}
                        />

                    <MyInput
                        width="100%"
                        selectData={circuLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldType="select"
                        fieldName={"circulationLkey"}
                        record={anesthesia}
                        setRecord={setAnesthesia}
                        searchable={false}/>

                </Col>
                <Col md={12}>
                <MyInput
                        width="100%"
                        selectData={respirLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldType="select"
                        fieldName={"respirationLkey"}
                        record={anesthesia}
                        setRecord={setAnesthesia}
                        searchable={false}/>

                    <MyInput
                        width="100%"
                        selectData={activityLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldType="select"
                        fieldName={"activityLkey"}
                        record={anesthesia}
                        setRecord={setAnesthesia}
                        searchable={false}
                        />
                    <MyInput
                        width="100%"
                        fieldType="number"
                        
                        fieldName='aldreteScore'
                        record={anesthesia}
                        setRecord={setAnesthesia}/>

                </Col></Form>
              
        </Row>
    </div>);
});
export default PostProcedureAnesthesia;