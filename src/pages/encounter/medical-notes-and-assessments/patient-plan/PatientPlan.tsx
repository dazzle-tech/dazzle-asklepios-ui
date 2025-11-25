import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetEncountersQuery } from '@/services/encounterService';
import { initialListRequest } from '@/types/types';
import { newApEncounter } from '@/types/model-types-constructor';
import './styles.less';

const PatientPlan = ({  patient, localEncounter, setLocalEncounter }) => {
  const dispatch = useAppDispatch();

  const { data: planLovQueryResponse } = useGetLovValuesByCodeQuery('VISIT_CAREPLAN_OPT');

 console.log("localEncounter", localEncounter);
  

  

  useEffect(() => {
    if (localEncounter.planInstructionsLkey && planLovQueryResponse?.object?.length > 0) {
      const selected = planLovQueryResponse.object.find(
        item => item.key === localEncounter.planInstructionsLkey
      );
      if (selected) {
        setLocalEncounter(prev => ({
          ...prev,
          planInstructionsNote: prev.planInstructionsNote
            ? prev.planInstructionsNote + '\n' + selected.lovDisplayVale
            : selected.lovDisplayVale,
          planInstructionsLkey: null
        }));
      }
    }
  }, [localEncounter.planInstructionsLkey, planLovQueryResponse]);

  return (
    <Form fluid>
      <MyInput
        width="100%"
        fieldType="select"
        selectData={planLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        fieldName="planInstructionsLkey"
        record={localEncounter}
        setRecord={setLocalEncounter}
        fieldLabel="Plan Instruction"
        disabled={localEncounter.encounterStatusLkey === '91109811181900'}
      />
      <MyInput
        width="100%"
        fieldType="textarea"
        fieldName="planInstructionsNote"
        record={localEncounter}
        setRecord={setLocalEncounter}
        showLabel={false}
        row={4}
      />
    </Form>
  );
};

export default PatientPlan;
