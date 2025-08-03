import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import { useAppDispatch } from "@/hooks";
import { useGetArrivalByOperationQuery, useSaveArrivalMutation } from "@/services/RecoveryService";
import { useGetUsersQuery } from "@/services/setupService";
import { newApOperationArrivalToRecoveryRoom } from "@/types/model-types-constructor";
import { initialListRequest } from "@/types/types";
import { notify } from "@/utils/uiReducerActions";
import React
, {
   useEffect,
   useState
} from "react";
import { Col, Divider, Row, Text } from "rsuite";
const ArrivalRecoveryRoom = ({ operation }) => {
   const dispatch = useAppDispatch();
   const [arrival, setArrival] = useState({ ...newApOperationArrivalToRecoveryRoom });

   const { data: arrivalByOperation } = useGetArrivalByOperationQuery(operation.key, {
      skip: !operation.key,
      selectFromResult: ({ data }) => ({
         data: data ? data : newApOperationArrivalToRecoveryRoom,
      }),
   });
   


   const [save] = useSaveArrivalMutation();

   const { data: userList } = useGetUsersQuery({
      ...initialListRequest,
      //to do Nurse code 
      filters: [
         {
            fieldName: 'job_role_lkey',
            operator: 'match',
            value: '157153858530600'
         }
      ]
   });

   // Fetching user list for the select input
   useEffect(() => {
      if (arrivalByOperation?.object) {
         setArrival(normalizeDates(arrivalByOperation.object));
      }
   }, [arrivalByOperation]);






   // Function to handle the save action

   const normalizeDates = (obj) => ({
      ...obj,
      arrivalTime: obj.arrivalTime ? new Date(obj.arrivalTime) : null,
      initialAssessmentTime: obj.initialAssessmentTime ? new Date(obj.initialAssessmentTime) : null,
   });
   const handleSave = async () => {
      try {
         await save({
            ...arrival, operationRequestKey: operation?.key,
            arrivalTime: arrival.arrivalTime ? new Date(arrival.arrivalTime).getTime() : null,
            initialAssessmentTime: arrival.initialAssessmentTime ? new Date(arrival.initialAssessmentTime).getTime() : null,
         }).unwrap();
         dispatch(notify({ msg: "Arrival saved successfully", sev: "success" }));

      } catch (error) {
         dispatch(notify({ msg: "Failed to save arrival", sev: "error" }));
         console.error("Failed to save arrival:", error);
      }
   }


   return (
      <div className="container-form">
         <div className="title-div">
            <Text>Arrival to Recovery Room</Text>
         </div>
         <Divider />
         <Row>
            <Col md={8}>
               <MyInput
                  width="100%"
                  fieldType="time"
                  fieldName="arrivalTime"
                  record={arrival}
                  setRecord={setArrival}
               />
            </Col>
            <Col md={8}>
               <MyInput width="100%" fieldName="accompaniedBy" record={arrival}
                  setRecord={setArrival} />
            </Col>
            <Col md={8}>
               <MyInput width="100%" fieldName="handoverSummary" record={arrival}
                  setRecord={setArrival} />
            </Col>
         </Row>
         <Row>
            <Col md={12}>
               <MyInput
                  width="100%"
                  fieldType="time"
                  fieldName="initialAssessmentTime"
                  record={arrival}
                  setRecord={setArrival}
               />
            </Col>
            <Col md={12}>
               <MyInput
                  width="100%"
                  fieldType="select"
                  fieldLabel="User"
                  selectData={userList?.object ?? []}
                  selectDataLabel="username"
                  selectDataValue="key"
                  fieldName="responsibleNurseKey"
                  record={arrival}
                  setRecord={setArrival}
               />
            </Col>
         </Row>
         <br />
         <Row>
            <div className="container-of-add-new-button">
               <MyButton color="var(--deep-blue)" width="90px" onClick={handleSave}>
                  Save
               </MyButton>
            </div>
         </Row>
      </div>
   );
}
export default ArrivalRecoveryRoom;