import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import './styles.less';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Translate from '@/components/Translate';
import {
    Form,
    Panel,
    Text,
    Tabs,
    Divider,
    Steps,
    ButtonToolbar
} from 'rsuite';
import { faList, faPlay, faCheck, faRectangleXmark } from '@fortawesome/free-solid-svg-icons';
import MyInput
    from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import {
    useGetProcedureListQuery,
} from '@/services/setupService';
import {
    useSaveProceduresMutation
} from '@/services/encounterService';
import { notify } from '@/utils/uiReducerActions';
import { initialListRequest, ListRequest } from '@/types/types';
import PatientSide from '../../encounter-main-info-section/PatienSide';
import MyButton from '@/components/MyButton/MyButton';
import MyStepper from '@/components/MyStepper';
const Perform = ({ edit, patient, encounter, procedure, setProcedure }) => {
    const dispatch = useAppDispatch();
    const { data: CategoryLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');
    const { data: priorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');
    const { data: bodypartLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');
    const { data: sideLovQueryResponse } = useGetLovValuesByCodeQuery('SIDES');

    const [saveProcedures, saveProcedureMutation] = useSaveProceduresMutation();

    const [listRequestPro, setListRequestPro] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'category_lkey',
                operator: 'match',
                value: procedure.categoryKey
            }
        ]
    });
    const { data: procedureQueryResponse, refetch: profetch } = useGetProcedureListQuery(
        listRequestPro,
        { skip: procedure.categoryKey == undefined }
    );
    const handleChangeStatus = async status => {
        try {
            await saveProcedures({
                ...procedure,
                statusLkey: status
            })
                .unwrap()
                .then(() => {

                });

            dispatch(notify({msg:'Changed Status Successfully',sev:"success"}));
        } catch (error) {
            dispatch(notify('Changed Status Failed'));
        }
    };

    const stepsData = [
    {
      key: '1',
      value: 'Procedure Registration'
     
    },
    {
      key: '2',
      value: 'Pre-Procedure Assessment'
    },
    {
      key: '3',
      value: 'Procedure Performing'
    }
    ,
    {
        key:'4',
        value:'Post-Procedure Care and Follow-up'
    },
    {
        key:'5',
        value:'Equipment and Logistics'
    },
    {
        key:"6",
        value:"Completed"
    }
  ];
    return (<div className='container'>
        <div className='left-box'>
              <Form layout="inline" fluid disabled={true}>
            <MyInput
                column
                width={200}
                fieldType="select"
                fieldLabel="Category Type"
                selectData={CategoryLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                fieldName={'categoryKey'}
                record={procedure}
                setRecord={setProcedure}
            />
            <MyInput
                column
                width={200}
                fieldType="select"
                fieldLabel="Procedure Name"
                selectData={procedureQueryResponse?.object ?? []}
                selectDataLabel="name"
                selectDataValue="key"
                fieldName={'procedureNameKey'}
                record={procedure}
                setRecord={setProcedure}
            />

            <MyInput
                column
                width={200}
                fieldType="select"
                fieldLabel="Priority"
                selectData={priorityLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                fieldName={'priorityLkey'}
                record={procedure}
                setRecord={setProcedure}
            />

            <MyInput
                column
                width={200}
                fieldType="select"
                fieldLabel="Body Part "
                selectData={bodypartLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                fieldName={'bodyPartLkey'}
                record={procedure}
                setRecord={setProcedure}
            />
            <MyInput
                column
                width={200}
                fieldType="select"
                fieldLabel="Side"
                selectData={sideLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                fieldName={'sideLkey'}
                record={procedure}
                setRecord={setProcedure}
            />
        </Form>
            <Divider />
            <div className='container'>
            <MyButton
                appearance="ghost"
                onClick={() => handleChangeStatus('3621794252137516')}
                prefixIcon={() => <FontAwesomeIcon icon={faList} />}> Awaiting Consent</MyButton>
            <MyButton
                appearance="ghost"
                onClick={() => handleChangeStatus('3621681578985655')}
                prefixIcon={() => <FontAwesomeIcon icon={faPlay} />}
            >Start Procedure</MyButton>
            <MyButton
                appearance="ghost"
                prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}
                onClick={() => handleChangeStatus('3621707345048408')}
            >Complete Procedure</MyButton>
       

                <MyButton
                    appearance="ghost"
                    onClick={() => handleChangeStatus('3621690096636149')}
                    prefixIcon={() => <FontAwesomeIcon
                        icon={faRectangleXmark}

                    />}
                >Cancel Procedure</MyButton>
         
         </div>
            <Divider />

            <MyStepper stepsList={stepsData} activeStep={1}/>
            <Divider />
            <Tabs defaultActiveKey="1" appearance="subtle">
                 <Tabs.Tab eventKey="1" title="Procedure Registration" ></Tabs.Tab>
                 <Tabs.Tab eventKey="2" title="Pre-Procedure Assessment" ></Tabs.Tab>
                 <Tabs.Tab eventKey="3" title="Procedure Performing" ></Tabs.Tab>
                 <Tabs.Tab eventKey="4" title="Post-Procedure Care and Follow-up" ></Tabs.Tab>
                 <Tabs.Tab eventKey="5" title="Equipment and Logistics" ></Tabs.Tab>
              
                 </Tabs>
          </div>
        <div className='right-box'>
            <PatientSide patient={patient} encounter={encounter} />
        </div>
    </div>)
}
export default Perform;