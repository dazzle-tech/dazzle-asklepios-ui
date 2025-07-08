import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppDispatch } from '@/hooks';
import { Checkbox, Form, Panel } from 'rsuite';
import { useSaveFunctionalAssessmentMutation, useGetFunctionalAssessmentsQuery } from '@/services/encounterService';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { newApFunctionalAssessment } from '@/types/model-types-constructor';
import { ApFunctionalAssessment } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CancellationModal from '@/components/CancellationModal';
import { MdModeEdit } from 'react-icons/md';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import { Tabs } from 'rsuite';
import MyInput from '@/components/MyInput';
import { useGetPractitionersQuery } from '@/services/setupService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
const NewRound = ({ patient, encounter, edit }) => {
  
const [physicanListRequest, setPhysicanListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            },
            {
                fieldName: 'job_role_lkey',
                operator: 'match',
                value: '157153854130600'
            }
        ],
        pageSize: 1000
    });
    const { data: practitionerListResponse } = useGetPractitionersQuery(physicanListRequest);
    const { data: shiftsLovQueryResponse } = useGetLovValuesByCodeQuery('SHIFTS');
    return (
<Panel>
       <div className='bt-div'>
        <Form fluid layout='inline'>
            <MyInput
                    column
                    width={200}
                    fieldLabel="Round Start Time"
                    fieldName='roundStartTime'
                    fieldType='datetime'
                    record={""}
                    setRecord={""} />
             <MyInput
                    column
                    width={200}
                    fieldLabel="Lead Physician"
                    fieldName='roundStartTime'
                    fieldType='select'
                    selectData={practitionerListResponse?.object ?? []}
                    selectDataLabel="practitionerFullName"
                    selectDataValue="key"
                    record={""}
                    setRecord={""}/>
            <MyInput
                    column
                    width={200}
                    fieldLabel="Shift"
                    fieldName='shift'
                    fieldType='select'
                    selectData={shiftsLovQueryResponse?.object ?? []}
                    selectDataLabel="value"
                    selectDataValue="key"
                    record={""}
                    setRecord={""}/>
                
            </Form>
            </div>
</Panel>
    );
};
export default NewRound;


