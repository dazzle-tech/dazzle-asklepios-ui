import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Checkbox, IconButton, Table } from 'rsuite';
import { useSaveComplaintSymptomsMutation, useGetComplaintSymptomsQuery } from '@/services/encounterService';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import Translate from '@/components/Translate';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import { newApComplaintSymptoms } from '@/types/model-types-constructor';
import { ApComplaintSymptoms } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CancellationModal from '@/components/CancellationModal';
import AddChiefComplaintSymptoms from './AddChiefComplaintSymptoms';
const { Column, HeaderCell, Cell } = Table
const ChiefComplaintSymptoms = ({ patient, encounter }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const [complaintSymptoms, setComplaintSymptoms] = useState<ApComplaintSymptoms>({ ...newApComplaintSymptoms, duration: null });
    const [open, setOpen] = useState(false);
    const [saveComplaintSymptoms] = useSaveComplaintSymptomsMutation();
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
    const [complaintSymptomsStatus, setComplaintSymptomsStatus] = useState('');
    const [allData, setAllData] = useState(false);
    const dispatch = useAppDispatch();

    // Initialize list request with default filters
    const [complaintSymptomsListRequest, setComplaintSymptomsListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
            , {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key
            },
            {
                fieldName: 'encounter_key',
                operator: 'match',
                value: encounter?.key
            }
        ],
    });

    // Fetch the list of Complaint Symptoms based on the provided request, and provide a refetch function
    const { data: complaintSymptomsResponse, refetch: refetchComplaintSymptoms } = useGetComplaintSymptomsQuery(complaintSymptomsListRequest);
    const handleExpanded = (rowData) => {
        let open = false;
        const nextExpandedRowKeys = [];

        expandedRowKeys.forEach(key => {
            if (key === rowData.key) {
                open = true;
            } else {
                nextExpandedRowKeys.push(key);
            }
        });
        if (!open) {
            nextExpandedRowKeys.push(rowData.key);
        }
        setExpandedRowKeys(nextExpandedRowKeys);
    };
    const renderRowExpanded = rowData => {
        return (
            <Table
                data={[rowData]}
                bordered
                cellBordered
                style={{ width: '100%', marginTop: '10px' }}
                height={100}
            >
                <Column flexGrow={2} align="center" fullText>
                    <HeaderCell>Created At / Created By</HeaderCell>
                    <Cell>
                        {rowData => (
                            <>
                                {rowData.createdAt ? new Date(rowData.createdAt).toLocaleString("en-GB") : ""}
                                {" / "}
                                {rowData?.createByUser?.fullName}
                            </>
                        )}
                    </Cell>
                </Column>
                <Column flexGrow={2} align="center" fullText>
                    <HeaderCell>Updated At / Updated By</HeaderCell>
                    <Cell>
                        {rowData => (
                            <>
                                {rowData.updatedAt ? new Date(rowData.updatedAt).toLocaleString("en-GB") : ""}
                                {" / "}
                                {rowData?.updateByUser?.fullName}
                            </>
                        )}
                    </Cell>
                </Column>

                <Column flexGrow={2} align="center" fullText>
                    <HeaderCell>Cancelled At / Cancelled By</HeaderCell>
                    <Cell dataKey="deletedAt" >
                        {rowData => (
                            <>
                                {rowData.deletedAt ? new Date(rowData.updatedAt).toLocaleString("en-GB") : ""}
                                {" / "}
                                {rowData?.deleteByUser?.fullName}
                            </>
                        )}
                    </Cell>
                </Column>
                <Column flexGrow={2} align="center" fullText>
                    <HeaderCell>Cancelliton Reason</HeaderCell>
                    <Cell dataKey="cancellationReason" />
                </Column>
            </Table>


        );
    };
    const ExpandCell = ({ rowData, dataKey, expandedRowKeys, onChange, ...props }) => (
        <Cell {...props} style={{ padding: 5 }}>
            <IconButton
                appearance="subtle"
                onClick={() => {
                    onChange(rowData);
                }}
                icon={
                    expandedRowKeys.some(key => key === rowData["key"]) ? (
                        <CollaspedOutlineIcon />
                    ) : (
                        <ExpandOutlineIcon />
                    )
                }
            />
        </Cell>
    );
    // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
    const isSelected = rowData => {
        if (rowData && complaintSymptoms && complaintSymptoms.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };

    // Handle Cancel Complaint Symptoms Record
    const handleCancle = () => {
        //TODO convert key to code
        saveComplaintSymptoms({ ...complaintSymptoms, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime(), deletedBy: authSlice.user.key }).unwrap().then(() => {
            dispatch(notify('Treadmill Complaint Symptoms Successfully'));
            refetchComplaintSymptoms();
        });
        setPopupCancelOpen(false);
    };

    // Effects
    useEffect(() => {
        setComplaintSymptomsListRequest((prev) => ({
            ...prev,
            filters: [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined,
                },
                ...(patient?.key && encounter?.key
                    ? [
                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                        {
                            fieldName: 'encounter_key',
                            operator: 'match',
                            value: encounter?.key
                        },
                    ]
                    : []),
            ],
        }));
    }, [patient?.key, encounter?.key]);
    useEffect(() => {
        setComplaintSymptomsListRequest((prev) => ({
            ...prev,
            filters: [
                ...(complaintSymptomsStatus !== ''
                    ? [
                        {
                            fieldName: 'status_lkey',
                            operator: 'match',
                            value: complaintSymptomsStatus,
                        },
                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key,
                        },
                        ...(allData === false
                            ? [
                                {
                                    fieldName: 'encounter_key',
                                    operator: 'match',
                                    value: encounter?.key,
                                },
                            ]
                            : []),
                    ]
                    : [
                        {
                            fieldName: 'deleted_at',
                            operator: 'isNull',
                            value: undefined,
                        },
                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key,
                        },
                        ...(allData === false
                            ? [
                                {
                                    fieldName: 'encounter_key',
                                    operator: 'match',
                                    value: encounter?.key,
                                },
                            ]
                            : []),
                    ]),
            ],
        }));
    }, [complaintSymptomsStatus, allData]);
    useEffect(() => {
        setComplaintSymptomsListRequest((prev) => {
            const filters =
                complaintSymptomsStatus != '' && allData
                    ? [

                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                    ]
                    : complaintSymptomsStatus === '' && allData
                        ? [
                            {
                                fieldName: 'deleted_at',
                                operator: 'isNull',
                                value: undefined,
                            },
                            {
                                fieldName: 'patient_key',
                                operator: 'match',
                                value: patient?.key
                            },
                        ]
                        : prev.filters;

            return {
                ...initialListRequest,
                filters,
            };
        });
    }, [allData, complaintSymptomsStatus]);
    return (
        <div>
            <div className='bt-div'>
                <MyButton onClick={() => { setPopupCancelOpen(true) }} prefixIcon={() => <CloseOutlineIcon />} disabled={!complaintSymptoms?.key}>
                    <Translate>Cancel</Translate>
                </MyButton>
                <Checkbox onChange={(value, checked) => {
                    if (checked) {
                        //TODO convert key to code
                        setComplaintSymptomsStatus('3196709905099521');
                    }
                    else {
                        setComplaintSymptomsStatus('');
                    }
                }}>
                    Show Cancelled
                </Checkbox>
                <Checkbox onChange={(value, checked) => {
                    if (checked) {
                        setAllData(true);
                    }
                    else {
                        setAllData(false);
                    }
                }}>
                    Show All
                </Checkbox>
                <div className='bt-right'>
                    <MyButton prefixIcon={() => <PlusIcon />} onClick={() => setOpen(true)}>Add </MyButton>
                </div>
            </div>
            <AddChiefComplaintSymptoms open={open} setOpen={setOpen} patient={patient} encounter={encounter} complaintSymptom={complaintSymptoms} refetch={refetchComplaintSymptoms} />
            <Table
                height={600}
                data={complaintSymptomsResponse?.object ?? []}
                rowKey="key"
                expandedRowKeys={expandedRowKeys}
                renderRowExpanded={renderRowExpanded}
                shouldUpdateScroll={false}
                onRowClick={rowData => {
                    setComplaintSymptoms({
                        ...rowData
                    });
                }}
                rowClassName={isSelected}
            >
                <Column width={70} align="center">
                    <HeaderCell>#</HeaderCell>
                    <ExpandCell rowData={rowData => rowData} dataKey="key" expandedRowKeys={expandedRowKeys} onChange={handleExpanded} />
                </Column>

                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Onset Date</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.onsetDate ? new Date(rowData.onsetDate).toLocaleString("en-GB") : ""}
                    </Cell>
                </Column >
                <Column flexGrow={3} fullText>
                    <HeaderCell align="center">
                        <Translate>Duration</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            <>
                                {rowData?.duration}
                                {" "}
                                {rowData?.unitLvalue
                                    ? rowData?.unitLvalue.lovDisplayVale
                                    : rowData?.unitLkey}
                            </>

                        }
                    </Cell>
                </Column>
                <Column flexGrow={3} fullText>
                    <HeaderCell align="center">
                        <Translate>Pain Characteristics</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.painCharacteristics}
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Pain Location</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.painLocationLvalue
                            ? rowData?.painLocationLvalue.lovDisplayVale
                            : rowData?.painLocationLkey}
                    </Cell>
                </Column>
                <Column flexGrow={4} fullText>
                    <HeaderCell align="center">
                        <Translate>Radiation</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.radiation}
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Aggravating Factors</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.aggravatingFactors}
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Relieving Factors</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.relievingFactors}
                    </Cell>
                </Column>
            </Table>
            <CancellationModal title="Cancel Chief Complaint Symptoms" fieldLabel="Cancellation Reason" open={popupCancelOpen} setOpen={setPopupCancelOpen} object={complaintSymptoms} setObject={setComplaintSymptoms} handleCancle={handleCancle} fieldName="cancellationReason" />
        </div>
    );
};
export default ChiefComplaintSymptoms;