import React, { useState, useEffect } from 'react';
import './styles.less';
import { useAppDispatch } from '@/hooks';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import { initialListRequest, ListRequest } from '@/types/types';
import MyInput from '@/components/MyInput';
import { notify } from '@/utils/uiReducerActions';
import { faBed } from '@fortawesome/free-solid-svg-icons';
import { useGetResourceTypeQuery } from '@/services/appointmentService';
import { newApAdmitOutpatientInpatient } from '@/types/model-types-constructor';
import { useGetPractitionersQuery } from '@/services/setupService';
import { useSavePatientAdmissionMutation } from '@/services/encounterService';
import { useGetRoomListQuery } from '@/services/setupService';
import { InputGroup, Form, Input } from 'rsuite';
import { ApAdmitOutpatientInpatient } from '@/types/model-types';
import { useGetIcdListQuery } from '@/services/setupService';
import { useGetBedListQuery } from '@/services/setupService';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@rsuite/icons/Search';
const PatientAdmission = ({ open, setOpen, admitToInpatientObject }) => {
    const [admitToInpatient, setAdmitToInpatient] = useState<ApAdmitOutpatientInpatient>({ ...newApAdmitOutpatientInpatient });
    const inpatientDepartmentListResponse = useGetResourceTypeQuery("4217389643435490");
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedicd10, setSelectedIcd10] = useState({ text: ' ' });
    const navigate = useNavigate();
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'department_key',
                operator: 'match',
                value: admitToInpatient?.admissionDepartmentKey
            }],
        pageSize: 100,
    });

    // Initialize the state for ICD list request with default values
    const [listIcdRequest, setListIcdRequest] = useState({ ...initialListRequest });
    // Fetch ICD list data based on the current request parameters
    const { data: icdListResponseData } = useGetIcdListQuery(listIcdRequest);
    // Transform the ICD list data by adding a combined label with code and description
    const modifiedData = (icdListResponseData?.object ?? []).map(item => ({
        ...item,
        combinedLabel: `${item.icdCode} - ${item.description}`
    }));
    const [bedListRequest, setBedListRequest] = useState<ListRequest>({
        ...initialListRequest,
        pageSize: 100,
        filters: [
            {
                fieldName: 'room_key',
                operator: 'match',
                value: admitToInpatient?.roomKey
            },
            {
                fieldName: 'status_lkey',
                operator: 'match',
                value: "5258243122289092"
            }
        ]
    });
    // Fetch Room list response
    const {
        data: roomListResponseLoading,
        refetch,
        isFetching
    } = useGetRoomListQuery(listRequest);
    const dispatch = useAppDispatch();
    const [saveAdmitToInpatient, saveAdmitToInpatientMutation] = useSavePatientAdmissionMutation();
    const { data: fetchBedsListQueryResponce } = useGetBedListQuery(bedListRequest, { skip: !admitToInpatient?.roomKey });

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
    // Handle the search input for the first search field
    const handleSearch = value => {
        setSearchKeyword(value);
    };

    // handle save To admit outpatient to inpatient function
    const handleSave = async () => {
        try {
            const saveAdmit = await saveAdmitToInpatient({
                ...admitToInpatient,
            }).unwrap();
            navigate("/inpatient-encounters-list")
            dispatch(notify({ msg: 'Admit Successfully', sev: 'success' }));
            setOpen(false);
            setAdmitToInpatient({ ...newApAdmitOutpatientInpatient });
        } catch (error) {
        }
    };
    // use Effect
    useEffect(() => {
        setAdmitToInpatient({ ...admitToInpatientObject, admissionDepartmentKey: admitToInpatientObject?.inpatientDepartmentKey });
    }, [admitToInpatientObject]);
    useEffect(() => {
        setListRequest((prev) => {
            let updatedFilters = [...(prev.filters || [])];
            updatedFilters = updatedFilters.filter(f => f.fieldName !== 'department_key');
            if (admitToInpatient) {
                updatedFilters.push({
                    fieldName: 'department_key',
                    operator: 'match',
                    value: admitToInpatient?.admissionDepartmentKey
                });
            }

            return {
                ...prev,
                filters: updatedFilters,
            };
        });
    }, [admitToInpatient]);
    useEffect(() => {
        setBedListRequest((prev) => {
            let updatedFilters = [...(prev.filters || [])];
            updatedFilters = updatedFilters.filter(f => f.fieldName !== 'room_key');
            if (admitToInpatient) {
                updatedFilters.push({
                    fieldName: 'room_key',
                    operator: 'match',
                    value: admitToInpatient?.roomKey
                });
            }

            return {
                ...prev,
                filters: updatedFilters,
            };
        });
    }, [admitToInpatient]);

    // modal content
    const modalContent = (
        <>  <Form fluid layout="inline" className='fields-container'>
            {<>
                <Form fluid layout="inline" className='container-search-field'>
                    <div className='content-div-search-field'>
                        <InputGroup className='content-input-search-field' inside>
                            <Input placeholder={'Search ICD-10'} value={searchKeyword} onChange={handleSearch} />
                            <InputGroup.Button>
                                <SearchIcon />
                            </InputGroup.Button>
                        </InputGroup>

                        {searchKeyword && (
                            <div className="dropdown-menu-icd">
                                {modifiedData?.map(mod => (
                                    <div
                                        key={mod.key}
                                        onClick={() => {
                                            setAdmitToInpatient({
                                                ...admitToInpatient,
                                                icd10: mod.key
                                            });
                                            setSelectedIcd10({ text: mod.combinedLabel });
                                            setSearchKeyword('');
                                        }}
                                        className='dropdown-menu-icd-item' >
                                        <span>{mod.icdCode}</span>
                                        <span>{mod.description}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Form>
            </>}
            <MyInput
                width={200}
                column
                fieldLabel="Medical Diagnosis"
                fieldName="text"
                record={selectedicd10}
                disabled={true}
            />
            <MyInput
                require
                column
                fieldLabel="Admission Department"
                fieldType="select"
                fieldName="admissionDepartmentKey"
                selectData={inpatientDepartmentListResponse?.data?.object ?? []}
                selectDataLabel="name"
                selectDataValue="key"
                record={admitToInpatient}
                setRecord={setAdmitToInpatient}
                width={190}
            />
            <MyInput
                require
                column
                fieldLabel="Select Room"
                fieldType="select"
                fieldName="roomKey"
                selectData={roomListResponseLoading?.object ?? []}
                selectDataLabel="name"
                selectDataValue="key"
                record={admitToInpatient}
                setRecord={setAdmitToInpatient}
                width={190}
                searchable={false}
            />
            <MyInput
                require
                column
                fieldLabel="Select Bed"
                fieldType="select"
                fieldName="bedKey"
                selectData={fetchBedsListQueryResponce?.object ?? []}
                selectDataLabel="name"
                selectDataValue="key"
                record={admitToInpatient}
                setRecord={setAdmitToInpatient}
                searchable={false}
                width={190}
            />
            <MyInput
                require
                column
                fieldLabel="Responsible Department"
                fieldType="select"
                fieldName="inpatientDepartmentKey"
                selectData={inpatientDepartmentListResponse?.data?.object ?? []}
                selectDataLabel="name"
                selectDataValue="key"
                record={admitToInpatient}
                setRecord={setAdmitToInpatient}
                width={190}
                disabled
            />
            <MyInput
                require
                column
                fieldLabel="Responsible physician"
                fieldType="select"
                fieldName="physicianKey"
                selectData={practitionerListResponse?.object ?? []}
                selectDataLabel="practitionerFullName"
                selectDataValue="key"
                record={admitToInpatient}
                setRecord={setAdmitToInpatient}
                width={190}
                disabled
            />
            <br />
        </Form>
            <Form fluid layout="inline" className='fields-container'>
                <MyInput
                    column
                    fieldType='textarea'
                    fieldLabel="Handoff Information"
                    fieldName='handoffInformation'
                    record={admitToInpatient}
                    setRecord={setAdmitToInpatient}
                    width={390}
                />
                <MyInput
                    column
                    fieldType='textarea'
                    fieldLabel="Reason of Admission"
                    fieldName='reasonOfAdmission'
                    record={admitToInpatient}
                    setRecord={setAdmitToInpatient}
                    width={390}
                /></Form></>);
    return (<MyModal
        open={open}
        setOpen={setOpen}
        title="Admit to Inpatient"
        steps={[{ title: "Admit to Inpatient", icon: <FontAwesomeIcon icon={faBed} /> }]}
        size="60vw"
        bodyheight='500px'
        actionButtonFunction={handleSave}
        content={modalContent}
    />);
}
export default PatientAdmission