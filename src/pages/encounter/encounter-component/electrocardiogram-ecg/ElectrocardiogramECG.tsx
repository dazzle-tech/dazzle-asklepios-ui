import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Checkbox, IconButton, Table } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useSaveElectrocardiogramECGMutation, useGetElectrocardiogramECGsQuery } from '@/services/encounterService';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import Translate from '@/components/Translate';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import PlusIcon from '@rsuite/icons/Plus';
import { newApElectrocardiogramEcg } from '@/types/model-types-constructor';
import { ApElectrocardiogramEcg } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import AddElectrocardiogram from './AddElectrocardiogram';
const { Column, HeaderCell, Cell } = Table
const ElectrocardiogramECG = ({ patient, encounter }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const [open , setOpen] = useState(false);
    const [electrocardiogramEcg, setElectrocardiogramEcg] = useState<ApElectrocardiogramEcg>({
        ...newApElectrocardiogramEcg,
        stSegmentChangesLkey: null,
        waveAbnormalitiesLkey: null,
        heartRate: null,
        prInterval: null,
        qrsDuration: null,
        qtInterval: null
    });
    const [ saveElectrocardiogramECG ] = useSaveElectrocardiogramECGMutation();
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
    const [electrocardiogramEcgStatus, setElectrocardiogramEcgStatus] = useState('');
    const [allData, setAllData] = useState(false);
    const dispatch = useAppDispatch();

    // Initialize list request with default filters
    const [electrocardiogramEcgListRequest, setElectrocardiogramEcgListRequest] = useState<ListRequest>({
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
    
    // Fetch the list of Electrocardiogram ECG based on the provided request, and provide a refetch function
    const { data: electrocardiogramEcgResponse, refetch: refetchelectrocardiogramEcg } = useGetElectrocardiogramECGsQuery(electrocardiogramEcgListRequest);
    
    // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
    const isSelected = rowData => {
        if (rowData && electrocardiogramEcg && electrocardiogramEcg.key === rowData.key) {
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

    // Handle Cancel ElectrocardiogramECG Record Function
    const handleCancle = () => {
        //TODO convert key to code
        saveElectrocardiogramECG({ ...electrocardiogramEcg, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime(), deletedBy: authSlice.user.key }).unwrap().then(() => {
            dispatch(notify('ECG Canceled Successfully'));
            refetchelectrocardiogramEcg();
        });
        setPopupCancelOpen(false);
    };

    // Effects
    useEffect(() => {
        setElectrocardiogramEcgListRequest((prev) => ({
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
        setElectrocardiogramEcgListRequest((prev) => ({
            ...prev,
            filters: [
                ...(electrocardiogramEcgStatus !== ''
                    ? [
                        {
                            fieldName: 'status_lkey',
                            operator: 'match',
                            value: electrocardiogramEcgStatus,
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
    }, [electrocardiogramEcgStatus, allData]);
    useEffect(() => {
        setElectrocardiogramEcgListRequest((prev) => {
            const filters =
                electrocardiogramEcgStatus != '' && allData
                    ? [

                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                    ]
                    : electrocardiogramEcgStatus === '' && allData
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
    }, [allData, electrocardiogramEcgStatus]);
    return (
        <div>
            <div className='bt-div'>
            <MyButton onClick={() => { setPopupCancelOpen(true) }} prefixIcon={() => <CloseOutlineIcon />} disabled={!electrocardiogramEcg?.key}>
                    <Translate>Cancel</Translate>
                </MyButton>
                <Checkbox onChange={(value, checked) => {
                    if (checked) {
                        //TODO convert key to code
                        setElectrocardiogramEcgStatus('3196709905099521');
                    }
                    else {
                        setElectrocardiogramEcgStatus('');
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
                data={electrocardiogramEcgResponse?.object ?? []}
                rowKey="key"
                expandedRowKeys={expandedRowKeys}
                renderRowExpanded={renderRowExpanded}
                shouldUpdateScroll={false}
                onRowClick={rowData => {
                    setElectrocardiogramEcg({
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
                        <Translate>Indication</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.indication}
                    </Cell>
                </Column >
                <Column flexGrow={3} fullText>
                    <HeaderCell align="center">
                        <Translate>ECG Lead Type</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.ecgLeadType}
                    </Cell>
                </Column>
                <Column flexGrow={3} fullText>
                    <HeaderCell align="center">
                        <Translate>Heart Rate</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            <>
                                {rowData?.heartRate}
                                {" BPM"}
                            </>}

                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>PR Interval </Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            <>
                                {rowData?.prInterval}
                                {" ms"}
                            </>}

                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>QRS Duration </Translate>
                    </HeaderCell>
                    <Cell>

                        {rowData =>
                            <>
                                {rowData?.qrsDuration}
                                {" ms"}
                            </>}
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>QT Interval</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            <>
                                {rowData?.qtInterval}
                                {" ms"}
                            </>}

                    </Cell>
                </Column>
                <Column flexGrow={3} fullText>
                    <HeaderCell align="center">
                        <Translate>ST Segment Changes</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            rowData?.stSegmentChangesLvalue
                                ? rowData?.stSegmentChangesLvalue.lovDisplayVale
                                : rowData?.stSegmentChangesLkey
                        }
                    </Cell>
                </Column>
                <Column flexGrow={3} fullText>
                    <HeaderCell align="center">
                        <Translate>T Wave Abnormalities</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            rowData?.waveAbnormalitiesLvalue
                                ? rowData?.waveAbnormalitiesLvalue.lovDisplayVale
                                : rowData?.waveAbnormalitiesLkey
                        }
                    </Cell>
                </Column>
            </Table>
            <AddElectrocardiogram open={open} setOpen={setOpen}  patient={patient} encounter={encounter} electrocardiogramEcgObject={electrocardiogramEcg} refetch={refetchelectrocardiogramEcg}/>
            <CancellationModal title="Cancel ECG" fieldLabel="Cancellation Reason" open={popupCancelOpen} setOpen={setPopupCancelOpen} object={electrocardiogramEcg} setObject={setElectrocardiogramEcg} handleCancle={handleCancle} fieldName="cancellationReason" />
        </div>
    );
};
export default ElectrocardiogramECG;