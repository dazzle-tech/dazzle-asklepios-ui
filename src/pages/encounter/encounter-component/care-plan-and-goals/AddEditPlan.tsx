import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNotesMedical } from '@fortawesome/free-solid-svg-icons';
import "./styles.less";
const AddEditPlan = ({
  open,
  setOpen,
  width,
  plan,
  setPlan,
}) => {
 
  // Fetch goal Types Lov list response
  const { data: goalTypeLovQueryResponse } = useGetLovValuesByCodeQuery('SHOTTERM_LONGTERM');
  // Fetch job Roles Lov list response
  const { data: jobRolesLovQueryResponse } = useGetLovValuesByCodeQuery('CLINICAL_JOB_ROLES');
  // Fetch status Lov list response
  const { data: statusLovQueryResponse } = useGetLovValuesByCodeQuery('DENT_PLAN_TRTMNT_STATUS');

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <div className='container-of-fields-plan'>
                <div className='container-of-field-plan'>
              <MyInput
                fieldName="problem"
                record={plan}
                setRecord={setPlan}
                width="100%"
              />
              </div>
              <div className='container-of-field-plan'>
               <MyInput
                fieldName="goal"
                record={plan}
                setRecord={setPlan}
                width="100%"
              />
              </div>
              </div>
              <br/>
              <div className='container-of-fields-plan'>
                <div className='container-of-field-plan'>
             <MyInput
                fieldName="goalType"
                fieldType="select"
                selectData={goalTypeLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={plan}
                setRecord={setPlan}
                width="100%"
              />
              </div>
              <div className='container-of-field-plan'>
              <MyInput
                fieldName="interventions"
                record={plan}
                setRecord={setPlan}
                width="100%"
              />
              </div>
              </div>
              <br/>
               <MyInput
                fieldName="responsible"
                fieldType="checkPicker"
                selectData={jobRolesLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record=""
                setRecord=""
                width="100%"
              />
              <div className='container-of-fields-plan'>
                <div className='container-of-field-plan'>
              <MyInput
                width="100%"
                fieldType='date'
                fieldName="startPlannedDate"
                record={plan}
                setRecord={setPlan}
              />
              </div>
              <div className='container-of-field-plan'>
              <MyInput
                width="100%"
                fieldType='date'
                fieldName="targetPlannedDate"
                record={plan}
                setRecord={setPlan}
              />
              </div>
              </div>
              <br/>
              <div className='container-of-fields-plan'>
                <div className='container-of-field-plan'>
             <MyInput
                width="100%"
                fieldType='date'
                fieldName="reassessmentrPlannedDate"
                record={plan}
                setRecord={setPlan}
              />
              </div>
              <div className='container-of-field-plan'>
              <MyInput
                width="100%"
                fieldName="evaluationNotes"
                record={plan}
                setRecord={setPlan}
              />
              </div>
              </div>
              <br/>
              <MyInput
                fieldName="status"
                fieldType="select"
                selectData={statusLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={plan}
                setRecord={setPlan}
                width="100%"
              />
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={"New Plan"}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={'Save'}
      actionButtonFunction=""
      steps={[{ title: 'Plan', icon:<FontAwesomeIcon icon={faNotesMedical} />}]}
      size={width > 600 ? '36vw' : '25vw'}
    />
  );
};
export default AddEditPlan;
