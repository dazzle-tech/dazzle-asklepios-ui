import React, { useEffect, useState } from 'react';
import { Modal, Button, Placeholder, Form, InputGroup, Divider, Input, Toggle, RadioGroup, Radio, Table, IconButton, SelectPicker, ButtonToolbar, Drawer, Pagination } from 'rsuite';
import './styles.less';
import Translate from '@/components/Translate';
import { Block, Check, DocPass, Edit, History, Icon, PlusRound, Detail } from '@rsuite/icons';
import TrashIcon from '@rsuite/icons/Trash';
import { FaClock, FaPencil, FaPlus, FaQuestion } from 'react-icons/fa6';
import { useGetPractitionersQuery } from '@/services/setupService'
import RemindOutlineIcon from '@rsuite/icons/RemindOutline';
import { initialListRequest, ListRequest } from '@/types/types';
const { Column, HeaderCell, Cell } = Table;
import MyLabel from '@/components/MyLabel';
import MyInput from '@/components/MyInput';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { newApPractitioner, newApPatientPreferredHealthProfessional } from '@/types/model-types-constructor';
import { ApPractitioner, ApPatientPreferredHealthProfessional } from '@/types/model-types';
import {
    useGetLovValuesByCodeQuery,
    useGetFacilitiesQuery

} from '@/services/setupService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPen } from '@fortawesome/free-solid-svg-icons';
import {
    useSavePatientPreferredHealthProfessionalMutation,
    useGetPatientPreferredHealthProfessionalQuery,
    useDeletePatientPreferredHealthProfessionalMutation

} from '@/services/patientService';
import { notify } from '@/utils/uiReducerActions';
import { disconnect } from 'process';
const PreferredHealthProfessional = ({ patient, isClick }) => {
    const dispatch = useAppDispatch();
    const [patientHP, setPatientHP] = useState<ApPatientPreferredHealthProfessional>({ ...newApPatientPreferredHealthProfessional })
    const [practitioner, setPractitioner] = useState<ApPractitioner>({ ...newApPractitioner });
    const [preferredHealthModalOpen, setPreferredHealthModalOpen] = useState(false);
    const [deletePreferredHealthModalOpen, setDeletePreferredHealthModalOpen] = useState(false);
    const [savePatientPH, savePatientPHMutation] = useSavePatientPreferredHealthProfessionalMutation();
    const [deletePatientPH, deletePatientPHMutation] = useDeletePatientPreferredHealthProfessionalMutation();
    const [editable, setEditable] = useState(false);
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ]
    });
    const [patientPreferredHealthProfessional, setPatientPreferredHealthProfessional] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ]
    });

    const { data: patientPreferredHealthProfessionalResponse, refetch: patientPreferredHealthProfessionalRefetch } =
        useGetPatientPreferredHealthProfessionalQuery(patientPreferredHealthProfessional, { skip: !patient.key });

    const [practitionerListRequest, setPractitionerListRequest] =
        useState<ListRequest>({
            ...initialListRequest,
            filters: [
                {
                    fieldName: 'is_valid',
                    operator: 'match',
                    value: "true"
                }, {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined
                }
            ]
        });
    //Lov
    const { data: specialityLovQueryResponse } = useGetLovValuesByCodeQuery('PRACT_SPECIALTY');
    //List
    const { data: facilityListResponse } = useGetFacilitiesQuery(listRequest);
    const { data: practitionerListResponse } = useGetPractitionersQuery({ ...practitionerListRequest });
    const practitionerList = (practitionerListResponse?.object ?? []).map(item => ({
        value: item.key,
        label: item.practitionerFullName,
        practitioner: item
    }));
    const facilityList = (facilityListResponse?.object ?? []).map(item => ({
        value: item.key,
        label: item.facilityName,

    }));
    const handleSave = () => {
        savePatientPH({ ...patientHP, patientKey: patient?.key }).unwrap().then(() => {
            if (patientHP.key === undefined) {
                dispatch(notify('Preferred Health Professional Added Successfully'));
            }
            else if (patientHP.key != undefined) {
                dispatch(notify('Preferred Health Professional Updated Successfully'));
            }
            patientPreferredHealthProfessionalRefetch();
            handleClearDeletePH();
        }

        );
        handleClearDeletePH();
    };
    const handleClearDeletePH = () => {
        setPatientHP({ ...newApPatientPreferredHealthProfessional });
        setPractitioner({ ...newApPractitioner });
        setDeletePreferredHealthModalOpen(false);
        setPreferredHealthModalOpen(false);
    };
    const handleDeletePH = () => {
        deletePatientPH({ ...patientHP }).unwrap().then(() => {
            dispatch(notify('Preferred Health Professional Deleted Successfully'));
            patientPreferredHealthProfessionalRefetch();
        })
        handleClearDeletePH();
    };
    const isSelectedPH = rowData => {
        if (rowData && patientHP && patientHP.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    useEffect(() => {
        setPatientPreferredHealthProfessional((prev) => ({
            ...prev,
            filters: [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined,
                },
                ...(patient?.key
                    ? [
                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key,
                        }
                    ]
                    : []),
            ],
        }));
    }, [patient]);

    return (
        <div>
            <Modal open={preferredHealthModalOpen} onClose={() => setPreferredHealthModalOpen(false)}>
                <Modal.Header>
                    <Modal.Title>New/Edit Patient Preferred Health Professional</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form style={{ display: 'flex', gap: '10px' }}>
                        <Form style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px', marginBottom: '10px' }}>
                                <div>
                                    <MyLabel label="HP Name" />
                                </div>
                                <SelectPicker
                                    data={practitionerList}
                                    value={patientHP?.practitionerKey || null}
                                    onChange={(value) => {
                                        const selectedItem = practitionerList.find((item) => item.value === value);
                                        setPatientHP({ ...patientHP, practitionerKey: value });
                                        setPractitioner(selectedItem?.practitioner || {});
                                    }}
                                    style={{ width: 265 }}
                                    labelKey="label"
                                    valueKey="value"
                                />
                            </div>

                            <MyInput
                                disabled
                                fieldLabel="Speciality"
                                fieldType="select"
                                fieldName="speciality"
                                selectData={specialityLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={practitioner}
                                setRecord={setPractitioner} />
                            <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px', marginBottom: '10px' }}>
                                <div>
                                    <MyLabel label="HP Organization" />
                                </div>
                                <SelectPicker
                                    data={facilityList}
                                    value={patientHP?.facilityKey || null}
                                    onChange={(value) => {
                                        const selectedItem = facilityList.find((item) => item.value === value);
                                        setPatientHP({ ...patientHP, facilityKey: value });
                                    }}
                                    style={{ width: 265 }}
                                    labelKey="label"
                                    valueKey="value"
                                />
                            </div>

                            <MyInput
                                fieldLabel="Network Affiliation"
                                fieldType="text"
                                fieldName="networkAffiliation"
                                record={patientHP}
                                setRecord={setPatientHP}
                            />
                        </Form>
                        <Form style={{ display: 'flex', flexDirection: 'column' }}>
                            <MyInput
                                fieldLabel="Email"
                                fieldType="text"
                                fieldName="practitionerEmail"
                                record={practitioner}
                                setRecord={setPractitioner}

                                disabled
                            />
                            <MyInput
                                fieldLabel="Telephone No."
                                fieldType="text"
                                fieldName="practitionerPhoneNumber"
                                record={practitioner}
                                setRecord={setPractitioner}
                                disabled
                            />
                            <MyInput
                                fieldLabel="Related with"
                                fieldType="text"
                                fieldName="relatedWith"
                                record={patientHP}
                                setRecord={setPatientHP}
                            />
                        </Form>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={() => setPreferredHealthModalOpen(false)} color='blue'
                        appearance="ghost">
                        Cancel
                    </Button>
                    <Divider vertical />
                    <Button
                        onClick={() =>
                            handleSave()
                        }
                        color='violet'
                        appearance="primary"
                    >
                        Save
                    </Button>
                </Modal.Footer>
            </Modal>

            <ButtonToolbar style={{ padding: 1 }}>
                <Button style={{ backgroundColor: ' #00b1cc', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}
                    onClick={() => {
                        setPatientHP({ ...newApPatientPreferredHealthProfessional });
                        setPractitioner({ ...newApPractitioner });

                        setPreferredHealthModalOpen(true);

                    }}
                    disabled={isClick}>
                    <PlusRound />   New Preferred Health Professional
                </Button>




                <Button
                    disabled={isClick || !editable}
                    onClick={() => {
                        setPreferredHealthModalOpen(true);
                    }}
                    appearance="ghost"
                    style={{ border: '1px solid #00b1cc', backgroundColor: 'white', color: '#00b1cc', marginLeft: "3px" }}

                >

                    <FontAwesomeIcon icon={faUserPen} style={{ marginRight: '5px', color: '#007e91' }} />

                    <span>Edit</span>
                </Button>

                <Button
                    disabled={isClick || !editable}

                    style={{ border: '1px solid  #007e91', backgroundColor: 'white', color: '#007e91', display: 'flex', alignItems: 'center', gap: '5px' }}

                    onClick={() => { setDeletePreferredHealthModalOpen(true) }}
                >
                    <TrashIcon /> <Translate>Delete</Translate>
                </Button>

            </ButtonToolbar>

            <br />
            <Modal open={deletePreferredHealthModalOpen} onClose={handleClearDeletePH}>
                <Modal.Header>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        <RemindOutlineIcon style={{ color: '#ffca61', marginRight: '8px', fontSize: '24px' }} />
                        <Translate style={{ fontSize: '24px' }} >
                            Are you sure you want to delete this Record?
                        </Translate>
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={handleClearDeletePH} appearance="ghost" color='cyan'
                    >
                        Cancel
                    </Button>
                    <Button onClick={() => handleDeletePH()}
                        appearance="primary"
                    >
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
            <Table
                height={600}

                headerHeight={40}
                rowHeight={50}
                bordered
                cellBordered

                data={patientPreferredHealthProfessionalResponse?.object ?? []}
                onRowClick={rowData => {
                    setPatientHP(rowData);
                    setEditable(true)
                    setPractitioner(rowData?.practitioner);

                }}
                rowClassName={isSelectedPH}

            >
                <Column sortable flexGrow={4}>
                    <HeaderCell>
                        <Translate>Name of the HP</Translate>
                    </HeaderCell>
                    <Cell>{rowData => rowData.practitioner.practitionerFullName}</Cell>
                </Column>
                <Column sortable flexGrow={4}>
                    <HeaderCell>
                        <Translate>Speciality </Translate>
                    </HeaderCell>
                    <Cell>{rowData => rowData.practitioner.specialtyLvalue
                        ? rowData.practitioner.specialtyLvalue.lovDisplayVale
                        : rowData.specialtyLkey
                    }
                    </Cell>
                </Column>
                <Column sortable flexGrow={4}>
                    <HeaderCell>
                        <Translate>Telephone no.</Translate>
                    </HeaderCell><Cell>{rowData => rowData.practitioner.practitionerPhoneNumber}</Cell>
                </Column>
                <Column sortable flexGrow={4}>
                    <HeaderCell>
                        <Translate>Email</Translate>
                    </HeaderCell><Cell>{rowData => rowData.practitioner.practitionerEmail}</Cell>
                </Column>
                <Column sortable flexGrow={4}>
                    <HeaderCell>
                        <Translate>HP Organization</Translate>
                    </HeaderCell>
                    <Cell>{rowData => rowData.facility.facilityName}</Cell>
                </Column>
                <Column sortable flexGrow={4}>
                    <HeaderCell>
                        <Translate>Network Affiliation</Translate>
                    </HeaderCell>
                    <Cell dataKey="networkAffiliation" />
                </Column>
                <Column sortable flexGrow={4}>
                    <HeaderCell>
                        <Translate>Related with</Translate>
                    </HeaderCell>
                    <Cell dataKey="relatedWith" />
                </Column>
            </Table>
        </div>
    );
};

export default PreferredHealthProfessional;
