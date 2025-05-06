import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks';
import {
    InputGroup,
    Form,
    Input,
    Panel,
    Text,
    Dropdown,
    DatePicker,
    Row,
    Col,
} from 'rsuite';
import PatientOrder from '../diagnostics-order';
import AttachmentModal from '@/components/AttachmentUploadModal/AttachmentUploadModal';
import CheckIcon from '@rsuite/icons/Check';
import { faBroom, faFile } from '@fortawesome/free-solid-svg-icons';

import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';

import { newApPatientDiagnose, newApProcedure } from '@/types/model-types-constructor';
import { useGetIcdListQuery } from '@/services/setupService';
import SearchIcon from '@rsuite/icons/Search';
import { initialListRequest, ListRequest } from '@/types/types';
import {
    useGetDepartmentsQuery,
    useGetProcedureListQuery,
} from '@/services/setupService';
import {
    useSaveProceduresMutation
} from '@/services/encounterService';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import AdvancedModal from '@/components/AdvancedModal';
import './styles.less'
import Diagnosis from './Diagnosis';
const Details = ({ patient, encounter, edit, procedure, setProcedure, openDetailsModal, setOpenDetailsModal ,proRefetch }) => {
    const [openOrderModel, setOpenOrderModel] = useState(false);
    const [editing, setEditing] = useState(false);
    const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
    const [saveProcedures, saveProcedureMutation] = useSaveProceduresMutation();
    const { data: faciltyypesLovQueryResponse } = useGetLovValuesByCodeQuery('FSLTY_TYP');
    const { data: bodypartLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');
    const { data: sideLovQueryResponse } = useGetLovValuesByCodeQuery('SIDES');
    const { data: CategoryLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');
    const { data: ProcedureLevelLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_LEVEL');
    const { data: priorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');
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
    const [indicationsDescription, setindicationsDescription] = useState<string>('');
    const [searchKeywordicd, setSearchKeywordicd] = useState('');

    const [icdListRequest, setIcdListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ]
    });
    const { data: icdListResponseLoading } = useGetIcdListQuery(icdListRequest);
    const modifiedData = (icdListResponseLoading?.object ?? []).map(item => ({
        ...item,
        combinedLabel: `${item.icdCode} - ${item.description}`
    }));
    const { data: departmentListResponse } = useGetDepartmentsQuery({ ...initialListRequest });
    const department = departmentListResponse?.object.filter(
        item => item.departmentTypeLkey === '5673990729647006'
    );
    useEffect(() => {
        if (procedure.indications != null || procedure.indications != '') {
            setindicationsDescription(prevadminInstructions => {
                const currentIcd = icdListResponseLoading?.object?.find(
                    item => item.key === procedure.indications
                );

                if (!currentIcd) return prevadminInstructions;

                const newEntry = `${currentIcd.icdCode}, ${currentIcd.description}.`;

                return prevadminInstructions ? `${prevadminInstructions}\n${newEntry}` : newEntry;
            });
        }
    }, [procedure.indications]);
    useEffect(() => {
        if (searchKeywordicd.trim() !== '') {
            setIcdListRequest({
                ...initialListRequest,
                filterLogic: 'or',
                filters: [
                    {
                        fieldName: 'icd_code',
                        operator: 'containsIgnoreCase',
                        value: searchKeywordicd
                    },
                    {
                        fieldName: 'description',
                        operator: 'containsIgnoreCase',
                        value: searchKeywordicd
                    }
                ]
            });
        }
    }, [searchKeywordicd]);

    useEffect(() => {
        setListRequestPro(prev => ({
            ...prev,
            filters: [
                ...(procedure?.categoryKey
                    ? [
                        {
                            fieldName: 'category_lkey',
                            operator: 'match',
                            value: procedure?.categoryKey
                        }
                    ]
                    : [])
            ]
        }));
    }, [procedure?.categoryKey]);
    useEffect(() => {
        if (procedure.currentDepartment) {
            setProcedure({ ...procedure, departmentKey: null, faciltyLkey: null });
        }
    }, [procedure.currentDepartment]);

    const dispatch = useAppDispatch();
    const handleClear = () => {
        setProcedure({
            ...newApProcedure,

            statusLkey: '3621653475992516',
            indications: indicationsDescription,
            bodyPartLkey: null,
            sideLkey: null,
            faciltyLkey: null,
            priorityLkey: null,
            procedureLevelLkey: null,
            departmentKey: null,
            categoryKey: null,
            procedureNameKey: null
        });
    };
    const handleSave = async () => {
        try {
            await saveProcedures({
                ...procedure,
                statusLkey: '3621653475992516',
                indications: indicationsDescription,
                encounterKey: encounter.key,
                scheduledDateTime: procedure.scheduledDateTime ? new Date(procedure?.scheduledDateTime)?.getTime() : null,
            })
                .unwrap()
                .then(() => {
                    proRefetch();
                    setOpenDetailsModal(false)
                });   
            handleClear();
            setOpenDetailsModal(false);
            dispatch(notify({ msg: 'Saved  Successfully', sev: "success" }));
        } catch (error) {
            dispatch(notify({ msg: 'Save Failed', sev: "error" }));
        }
    };
    const handleSearchIcd = value => {
        setSearchKeywordicd(value);
    };
    return (<>
        <AdvancedModal
            open={openDetailsModal}
            setOpen={setOpenDetailsModal}
            actionButtonFunction={handleSave}
            footerButtons={<div className='footer-buttons'>
                <MyButton
                    onClick={handleClear}
                    prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}
                >
                    Clear
                </MyButton>
                <MyButton
                    appearance='ghost'

                    onClick={() => {
                        setOpenOrderModel(true);
                    }}
                    disabled={editing}
                    prefixIcon={() => <CheckIcon />}>
                    Order Related Tests
                </MyButton>
                <MyButton
                    onClick={() => setAttachmentsModalOpen(true)}
                    prefixIcon={() => <FontAwesomeIcon icon={faFile} />}
                >Attachment File</MyButton></div>}
            rightContent={<>
                <Row gutter={20}>
                    <Col md={12}>
                        <Row className="rows-gap">
                            <Col md={12}>
                                <Form fluid>
                                    <MyInput

                                        disabled={editing}
                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="Category Type"
                                        selectData={CategoryLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName={'categoryKey'}
                                        record={procedure}
                                        setRecord={setProcedure}
                                    />
                                </Form>
                            </Col>
                            <Col md={12}>
                                <Form fluid>
                                    <MyInput

                                        disabled={editing}
                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="Procedure Name"
                                        selectData={procedureQueryResponse?.object ?? []}
                                        selectDataLabel="name"
                                        selectDataValue="key"
                                        fieldName={'procedureNameKey'}
                                        record={procedure}
                                        setRecord={setProcedure}
                                    />
                                </Form></Col>
                        </Row>
                        <Row className="rows-gap">
                            <Col md={12}>
                                <Form fluid>
                                    <MyInput

                                        disabled={editing}
                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="Procedure Level"
                                        selectData={ProcedureLevelLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName={'procedureLevelLkey'}
                                        record={procedure}
                                        setRecord={setProcedure}
                                    />
                                </Form>
                            </Col>
                            <Col md={12}>
                                <Form fluid>
                                    <MyInput

                                        disabled={editing}
                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="Priority"
                                        selectData={priorityLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName={'priorityLkey'}
                                        record={procedure}
                                        setRecord={setProcedure}
                                    />
                                </Form></Col>
                        </Row>
                        <Row className="rows-gap">
                            <Text className="font-style">Indication</Text>
                        </Row>
                        <Row className="rows-gap">
                            <Col md={24}>
                              
                                <Row>
                                    <Col md={24}>
                                        <InputGroup inside style={{ width: "100%" }}>
                                            <Input
                                                placeholder="Search ICD-10"
                                                value={searchKeywordicd}
                                                onChange={handleSearchIcd}
                                            />
                                            <InputGroup.Button>
                                                <SearchIcon />
                                            </InputGroup.Button>
                                        </InputGroup>
                                        {searchKeywordicd && (
                                            <Dropdown.Menu className="dropdown-menuresult">
                                                {modifiedData?.map(mod => (
                                                    <Dropdown.Item
                                                        key={mod.key}
                                                        eventKey={mod.key}
                                                        onClick={() => {
                                                            setProcedure({
                                                                ...procedure,
                                                                indications: mod.key
                                                            });
                                                            setSearchKeywordicd('');
                                                        }}
                                                    >
                                                        <span style={{ marginRight: '19px' }}>{mod.icdCode}</span>
                                                        <span>{mod.description}</span>
                                                    </Dropdown.Item>
                                                ))}
                                            </Dropdown.Menu>
                                        )}</Col>

                                </Row>
                                <Row>
                                    <Col md={24}>
                                        <Input
                                            as="textarea"
                                            disabled={true}
                                            onChange={e => setindicationsDescription}
                                            value={indicationsDescription || procedure.indications}
                                            style={{ width: "100%" }}
                                            rows={4}
                                        /></Col>
                                </Row>
                            </Col>
                        </Row>

                    </Col>
                    <Col md={12}>
                        <Row className="rows-gap">
                            <Col md={12}>
                                <Form fluid>

                                    <MyInput

                                        disabled={editing ? editing : procedure.currentDepartment}
                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="Facilty "
                                        selectData={faciltyypesLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName={'faciltyLkey'}
                                        record={procedure}
                                        setRecord={setProcedure}
                                    />
                                </Form>
                            </Col>
                            <Col md={12}>
                                <Form fluid>
                                    <MyInput

                                        disabled={editing ? editing : procedure.currentDepartment}
                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="Department"
                                        selectData={department ?? []}
                                        selectDataLabel="name"
                                        selectDataValue="key"
                                        fieldName={'departmentKey'}
                                        record={procedure}
                                        setRecord={setProcedure}
                                    />
                                </Form></Col>
                        </Row>
                        <Row className="rows-gap">
                            <Col md={12}>
                                <Form fluid>
                                    <MyInput

                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="Body Part "
                                        selectData={bodypartLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName={'bodyPartLkey'}
                                        record={procedure}
                                        setRecord={setProcedure}
                                    />
                                </Form>
                            </Col>
                            <Col md={12}>
                                <Form fluid>
                                    <MyInput

                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="Side"
                                        selectData={sideLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName={'sideLkey'}
                                        record={procedure}
                                        setRecord={setProcedure}
                                    />
                                </Form></Col>
                        </Row>
                        <Row className="rows-gap">
                            <Col md={12}>
                                <Form fluid>
                                    <MyInput
                                        width="100%"
                                        disabled={editing}
                                        fieldName='scheduledDateTime'
                                        fieldType='datetime'
                                        record={procedure}
                                        setRecord={setProcedure}
                                    />
                                </Form></Col>
                            <Col md={12}>
                                <Form fluid>
                                    <MyInput
                                        disabled={editing}
                                        width="100%"
                                        fieldType="checkbox"
                                        fieldName="currentDepartment"
                                        record={procedure}
                                        setRecord={setProcedure}
                                    />
                                </Form></Col>
                        </Row>
                        <Row className="rows-gap">
                            <Col md={24}>
                                <Form fluid>
                                    <MyInput
                                        width="100%"
                                        disabled={editing}
                                        fieldName="notes"
                                        fieldType="textarea"
                                        record={procedure}
                                        setRecord={setProcedure}
                                    />
                                </Form>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </>}
            rightTitle="Procedure"
            leftContent={<>
            <Diagnosis patient={patient} encounter={encounter}/></>}
        ></AdvancedModal>


        <AttachmentModal
            isOpen={attachmentsModalOpen}
            setIsOpen={setAttachmentsModalOpen}
            attachmentSource={procedure}
            attatchmentType={'PROCEDURE_ORDER'}
        />
        <MyModal
            open={openOrderModel}
            setOpen={setOpenOrderModel}
            size={'full'}
            title="Add Order"
            content={<PatientOrder edit={edit} patient={patient} encounter={encounter} />}
        ></MyModal>
    </>);
}
export default Details;