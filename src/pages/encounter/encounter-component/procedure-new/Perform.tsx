import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyStepper from '@/components/MyStepper';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
    useSaveProceduresMutation
} from '@/services/procedureService';
import { useGetLovValuesByCodeQuery, useGetProcedureListQuery } from '@/services/setupService';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import { faCheck, faList, faPlay, faRectangleXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import {
    Divider,
    Form,
} from 'rsuite';
import PatientSide from '../../encounter-main-info-section/PatienSide';
import ProcedureRegistration from './ProcedureRegistration';
import './styles.less';
import PreProcedureAssessment from './Pre-ProcedureAssessment/PreProcedureAssessment';
import ProcedurePerforming from './ProcedurePerforming/ProcedurePerforming';
import PostProcedureCare from './Post-ProcedureCare/PostProcedureCare';
import EquipmentAndLogistics from './EquipmentAndLogistics/EquipmentAndLogistics';
import MyTab from '@/components/MyTab';
const Perform = ({ edit, patient, encounter, procedure, setProcedure,proRefetch }) => {
    const authSlice = useAppSelector(state => state.auth);
    const dispatch = useAppDispatch();
    const { data: CategoryLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');
    const { data: priorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');
    const { data: bodypartLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');
    const { data: sideLovQueryResponse } = useGetLovValuesByCodeQuery('SIDES');
    const [activeTab, setActiveTab] = useState<string>('1');
    const [saveProcedures] = useSaveProceduresMutation();

    const [listRequestPro] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'category_lkey',
                operator: 'match',
                value: procedure.categoryKey
            }
        ]
    });
    const { data: procedureQueryResponse } = useGetProcedureListQuery(
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
                    proRefetch();
             
                });

            dispatch(notify({ msg: 'Changed Status Successfully', sev: "success" }));
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
            key: '4',
            value: 'Post-Procedure Care and Follow-up'
        },
        {
            key: '5',
            value: 'Equipment and Logistics'
        },
        {
            key: "6",
            value: "Completed"
        }
    ];

    const tabData = [
     {title: "Procedure Registration", content: <ProcedureRegistration procedure={procedure} user={authSlice.user} setActiveTab={setActiveTab} />},
     {title: "Pre-Procedure Assessment", content: <PreProcedureAssessment procedure={procedure} setActiveTab={setActiveTab} user={authSlice.user} patient={patient}/>},
     {title: "Procedure Performing", content: <ProcedurePerforming procedure={procedure} setActiveTab={setActiveTab} user={authSlice.user} />},
     {title: "Post-Procedure Care and Follow-up", content: <PostProcedureCare procedure={procedure} setActiveTab={setActiveTab} user={authSlice.user}/>},
     {title: "Equipment and Logistics", content: <EquipmentAndLogistics procedure={procedure} setActiveTab={setActiveTab} user={authSlice.user}/>},
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

            <MyStepper stepsList={stepsData} activeStep={1} />
            <Divider />
            <MyTab 
             data={tabData}
             activeTab={activeTab}
             setActiveTab={setActiveTab}
            />
        </div>
        <div className='right-box'>
            <PatientSide patient={patient} encounter={encounter} />
        </div>
    </div>);
};
export default Perform;