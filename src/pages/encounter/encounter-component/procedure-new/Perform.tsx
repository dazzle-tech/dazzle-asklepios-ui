import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyStepper from '@/components/MyStepper';
import { useAppDispatch } from '@/hooks';
import {
    useCancelProcdureMutation,
    useChangeProcedureStatusMutation
} from '@/services/patients/patientProcedureService';
import { useGetProcedureByIdQuery } from '@/services/setup/procedure/procedureService';
import { useEnumOptions } from '@/services/enumsApi';
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
    const dispatch = useAppDispatch();
    const categoryOptions = useEnumOptions('ProcedureCategory');
    const priorityOptions = useEnumOptions('Priority');
    const [activeTab, setActiveTab] = useState<string>('1');
    const [openCancellationModal, setOpenCancellationModal] = useState(false);
    const [changeStatus] = useChangeProcedureStatusMutation();
    const [cancelProcedure] = useCancelProcdureMutation();
    const { data: procedureSetup } = useGetProcedureByIdQuery(
        { id: procedure?.procedureId },
        { skip: !procedure?.procedureId }
    );
    const summary = {
        ...procedure,
        categoryType: procedureSetup?.categoryType,
        procedureName: procedureSetup?.name
    };

    const applyUpdate = (updated: any, msg: string) => {
        setProcedure({ ...procedure, ...updated });
        proRefetch();
        dispatch(notify({ msg, sev: 'success' }));
    };

    const handleChangeStatus = async (status: string) => {
        try {
            const updated = await changeStatus({ id: procedure.id, status }).unwrap();
            applyUpdate(updated, 'Changed Status Successfully');
        } catch (error: any) {
            dispatch(notify({ msg: error?.data?.title ?? 'Changed Status Failed', sev: 'error' }));
        }
    };

    const handleCancel = async () => {
        try {
            const updated = await cancelProcedure({
                id: procedure.id,
                cancellationReason: procedure.cancellationReason || ''
            }).unwrap();
            setOpenCancellationModal(false);
            applyUpdate(updated, 'Cancelled Successfully');
        } catch (error: any) {
            dispatch(notify({ msg: error?.data?.title ?? 'Cancel Failed', sev: 'error' }));
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
     {title: "Procedure Registration", content: <ProcedureRegistration procedure={procedure} setProcedure={setProcedure} setActiveTab={setActiveTab} />},
     {title: "Pre-Procedure Assessment", content: <PreProcedureAssessment procedure={procedure} setActiveTab={setActiveTab} patient={patient}/>},
     {title: "Procedure Performing", content: <ProcedurePerforming procedure={procedure} setActiveTab={setActiveTab} />},
     {title: "Post-Procedure Care and Follow-up", content: <PostProcedureCare procedure={procedure} setActiveTab={setActiveTab} />},
     {title: "Equipment and Logistics", content: <EquipmentAndLogistics procedure={procedure} setActiveTab={setActiveTab} />},
    ];
    return (<div className='container'>
        <div className='left-box'>
            <Form layout="inline" fluid disabled={true}>
                <MyInput
                    column
                    width={200}
                    fieldType="select"
                    fieldLabel="Category Type"
                    selectData={categoryOptions ?? []}
                    selectDataLabel="label"
                    selectDataValue="value"
                    fieldName="categoryType"
                    record={summary}
                    setRecord={() => undefined}
                />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Procedure Name"
                    fieldName="procedureName"
                    record={summary}
                    setRecord={() => undefined}
                />
                <MyInput
                    column
                    width={200}
                    fieldType="select"
                    fieldLabel="Priority"
                    selectData={priorityOptions ?? []}
                    selectDataLabel="label"
                    selectDataValue="value"
                    fieldName="priority"
                    record={summary}
                    setRecord={() => undefined}
                />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Body Part"
                    fieldName="bodyPart"
                    record={summary}
                    setRecord={() => undefined}
                />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Side"
                    fieldName="side"
                    record={summary}
                    setRecord={() => undefined}
                />
            </Form>
            <Divider />
            <div className='container'>
                <MyButton
                    appearance="ghost"
                    onClick={() => handleChangeStatus('AWAITING_CONSENT')}
                    prefixIcon={() => <FontAwesomeIcon icon={faList} />}> Awaiting Consent</MyButton>
                <MyButton
                    appearance="ghost"
                    onClick={() => handleChangeStatus('STARTED')}
                    prefixIcon={() => <FontAwesomeIcon icon={faPlay} />}
                >Start Procedure</MyButton>
                <MyButton
                    appearance="ghost"
                    prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}
                    onClick={() => handleChangeStatus('COMPLETED')}
                >Complete Procedure</MyButton>


                <MyButton
                    appearance="ghost"
                    onClick={() => setOpenCancellationModal(true)}
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
             lazy
            />
            <CancellationModal
                open={openCancellationModal}
                setOpen={setOpenCancellationModal}
                fieldName="cancellationReason"
                fieldLabel="Cancellation Reason"
                title="Cancellation"
                object={procedure}
                setObject={setProcedure}
                handleCancle={handleCancel}
                required
            />
        </div>
        <div className='right-box'>
            <PatientSide patient={patient} encounter={encounter} />
        </div>
    </div>);
};
export default Perform;