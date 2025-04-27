import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Checkbox, IconButton, Table } from 'rsuite';
import { useSaveTreadmillStresseMutation, useGetTreadmillStressesQuery } from '@/services/encounterService';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import Translate from '@/components/Translate';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import MyButton from '@/components/MyButton/MyButton';
import { newApTreadmillStress } from '@/types/model-types-constructor';
import { ApTreadmillStress } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import PlusIcon from '@rsuite/icons/Plus';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CancellationModal from '@/components/CancellationModal';
import AddTreadmillStress from './AddTreadmillStress';
const { Column, HeaderCell, Cell } = Table
const TreadmillStress = ({ patient, encounter }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const [open, setOpen] = useState(false);
    const [treadmillStress, setTreadmillStress] = useState<ApTreadmillStress>({
        ...newApTreadmillStress,
        preTestSystolicBp: null,
        preTestDiastolicBp: null,
        exerciseDuration: null,
        maximumHeartRateAchieved: null,
        targetHeartRate: null,
        postTestSystolicBp: null,
        postTestDiastolicBp: null,
        recoveryTime: null,
    });
    const [saveTreadmillStress] = useSaveTreadmillStresseMutation();
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
    const [treadmillStressStatus, setTreadmillStressStatus] = useState('');
    const [allData, setAllData] = useState(false);
    const dispatch = useAppDispatch();

    // Initialize list request with default filters
    const [treadmillStressListRequest, setTreadmillStressListRequest] = useState<ListRequest>({
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

    // Fetch the list of  Treadmill Stress based on the provided request, and provide a refetch function
    const { data: treadmillStressResponse, refetch: refetchTreadmillStress } = useGetTreadmillStressesQuery(treadmillStressListRequest);

    // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
    const isSelected = rowData => {
        if (rowData && treadmillStress && treadmillStress.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };

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

    // Handle Cancle Function
    const handleCancle = () => {
        //TODO convert key to code
        saveTreadmillStress({ ...treadmillStress, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime(), deletedBy: authSlice.user.key }).unwrap().then(() => {
            dispatch(notify('Treadmill Stress Canceled Successfully'));
            refetchTreadmillStress();
        });
        setPopupCancelOpen(false);
    };

    // Effects
    useEffect(() => {
        setTreadmillStressListRequest((prev) => ({
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
        setTreadmillStressListRequest((prev) => ({
            ...prev,
            filters: [
                ...(treadmillStressStatus !== ''
                    ? [
                        {
                            fieldName: 'status_lkey',
                            operator: 'match',
                            value: treadmillStressStatus,
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
    }, [treadmillStressStatus, allData]);
    useEffect(() => {
        setTreadmillStressListRequest((prev) => {
            const filters =
                treadmillStressStatus != '' && allData
                    ? [

                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                    ]
                    : treadmillStressStatus === '' && allData
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
    }, [allData, treadmillStressStatus]);
    return (
        <div>
            <div className='bt-div'>
                <MyButton onClick={() => { setPopupCancelOpen(true) }} prefixIcon={() => <CloseOutlineIcon />} disabled={!treadmillStress?.key}>
                    <Translate>Cancel</Translate>
                </MyButton>
                <Checkbox onChange={(value, checked) => {
                    if (checked) {
                        //TODO convert key to code
                        setTreadmillStressStatus('3196709905099521');
                    }
                    else {
                        setTreadmillStressStatus('');
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
            <Table
                height={600}
                data={treadmillStressResponse?.object ?? []}
                rowKey="key"
                expandedRowKeys={expandedRowKeys}
                renderRowExpanded={renderRowExpanded}
                shouldUpdateScroll={false}
                onRowClick={rowData => {
                    setTreadmillStress({
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
                        <Translate>Test Indication</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.indication}
                    </Cell>
                </Column >
                <Column flexGrow={3} fullText>
                    <HeaderCell align="center">
                        <Translate>Baseline ECG Findings</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            rowData?.baselineEcgFindingsLvalue
                                ? rowData?.baselineEcgFindingsLvalue.lovDisplayVale
                                : rowData?.baselineEcgFindingsLkey
                        }
                    </Cell>
                </Column>
                <Column flexGrow={3} fullText>
                    <HeaderCell align="center">
                        <Translate>Bruce Protocol Stage</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            rowData?.bruceProtocolStageLvalue
                                ? rowData?.bruceProtocolStageLvalue.lovDisplayVale
                                : rowData?.bruceProtocolStageLkey
                        }
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Exercise Duration</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            <> {rowData?.exerciseDuration} {" Minutes"}

                            </>
                        }
                    </Cell>
                </Column>
                <Column flexGrow={4} fullText>
                    <HeaderCell align="center">
                        <Translate>Maximum Heart Rate Achieved</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            <> {rowData?.maximumHeartRateAchieved} {" BPM"}

                            </>
                        }
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Recovery Time </Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            <> {rowData?.recoveryTime} {" Minutes"}
                            </>
                        }
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Pre-Test BP</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.preTestDiastolicBp != null && rowData?.preTestSystolicBp != null
                            ? ((2 * rowData?.preTestDiastolicBp + rowData?.preTestSystolicBp) / 3).toFixed(2)
                            : ''}
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Post-Test BP </Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.postTestDiastolicBp != null && rowData?.postTestSystolicBp != null
                            ? ((2 * rowData?.postTestDiastolicBp + rowData?.postTestSystolicBp) / 3).toFixed(2)
                            : ''}
                    </Cell>
                </Column>
            </Table>
            <AddTreadmillStress open={open} setOpen={setOpen} patient={patient} encounter={encounter} treadmillStressObject={treadmillStress} refetch={refetchTreadmillStress} />
            <CancellationModal title="Cancel Chief Complaint Symptoms" fieldLabel="Cancellation Reason" open={popupCancelOpen} setOpen={setPopupCancelOpen} object={treadmillStress} setObject={setTreadmillStress} handleCancle={handleCancle} fieldName="cancellationReason" />
        </div>
    );
};
export default TreadmillStress;