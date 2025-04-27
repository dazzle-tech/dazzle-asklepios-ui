import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Checkbox, IconButton, Table } from 'rsuite';
import { useSaveAudiometryPuretoneMutation, useGetAudiometryPuretonesQuery } from '@/services/encounterService';
import PlusIcon from '@rsuite/icons/Plus';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import Translate from '@/components/Translate';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import MyButton from '@/components/MyButton/MyButton';
import CancellationModal from '@/components/CancellationModal';
import { newApAudiometryPuretone } from '@/types/model-types-constructor';
import { ApAudiometryPuretone } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import AddAudiometryPuretone from './AddAudiometryPuretone';
const { Column, HeaderCell, Cell } = Table
const AudiometryPuretone = ({ patient, encounter }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const [open, setOpen] = useState(false);
    const [audiometryPuretone, setAudiometryPuretone] = useState<ApAudiometryPuretone>({
        ...newApAudiometryPuretone
        , earExamFindingsLkey: null,
        airConductionFrequenciesLeft: null,
        airConductionFrequenciesRight: null,
        hearingThresholdsLeft: null,
        hearingThresholdsRight: null,
        boneConductionFrequenciesLeft: null,
        boneConductionFrequenciesRight: null,
        boneConductionThresholdsLeft: null,
        boneConductionThresholdsRight: null,
        maskedUsed: false,
        hearingLossTypeLkey: null,
        hearingLossDegreeLkey: null,
    });
    const [ saveAudiometryPureton ] = useSaveAudiometryPuretoneMutation();
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
    const [audiometryPuretonStatus, setAudiometryPuretonStatus] = useState('');
    const [allData, setAllData] = useState(false);
    const dispatch = useAppDispatch();

    // Initialize list request with default filters
    const [audiometryPuretoneListRequest, setAudiometryPuretoneListRequest] = useState<ListRequest>({
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

    // Fetch the list of Audiometry Pureton based on the provided request, and provide a refetch function
    const { data: audiometryPuretonResponse, refetch: refetchAudiometryPureton } = useGetAudiometryPuretonesQuery(audiometryPuretoneListRequest);

    // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
    const isSelected = rowData => {
        if (rowData && audiometryPuretone && audiometryPuretone.key === rowData.key) {
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
                style={{ width: '100%', marginTop: '10px', overflow: "visible" }}
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

    // Handle Audiometry Puretone Record
    const handleCancle = () => {
        //TODO convert key to code
        saveAudiometryPureton({ ...audiometryPuretone, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime(), deletedBy: authSlice.user.key }).unwrap().then(() => {
            dispatch(notify('Audiometry Pureton Canceled Successfully'));
            refetchAudiometryPureton();
        });
        setPopupCancelOpen(false);
    };

    // Effects
    useEffect(() => {
        setAudiometryPuretoneListRequest((prev) => ({
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
        setAudiometryPuretoneListRequest((prev) => ({
            ...prev,
            filters: [
                ...(audiometryPuretonStatus !== ''
                    ? [
                        {
                            fieldName: 'status_lkey',
                            operator: 'match',
                            value: audiometryPuretonStatus,
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
    }, [audiometryPuretonStatus, allData]);
    useEffect(() => {
        setAudiometryPuretoneListRequest((prev) => {
            const filters =
                audiometryPuretonStatus != '' && allData
                    ? [

                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                    ]
                    : audiometryPuretonStatus === '' && allData
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
    }, [allData, audiometryPuretonStatus]);
    return (
        <div>
            <div className='bt-div'>
                <MyButton onClick={() => { setPopupCancelOpen(true) }} prefixIcon={() => <CloseOutlineIcon />} disabled={!audiometryPuretone?.key}>
                    <Translate>Cancel</Translate>
                </MyButton>
                <Checkbox onChange={(value, checked) => {
                    if (checked) {
                        //TODO convert key to code
                        setAudiometryPuretonStatus('3196709905099521');
                    }
                    else {
                        setAudiometryPuretonStatus('');
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
                data={audiometryPuretonResponse?.object ?? []}
                rowKey="key"
                expandedRowKeys={expandedRowKeys}
                renderRowExpanded={renderRowExpanded}
                shouldUpdateScroll={false}
                onRowClick={rowData => {
                    setAudiometryPuretone({
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
                        <Translate>Test Environmen</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            rowData?.testEnvironment
                        }
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Test Reason</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            rowData?.testReason
                        }
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Ear Exam Findings</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.earExamFindingsLvalue
                            ? rowData?.earExamFindingsLvalue.lovDisplayVale
                            : rowData?.earExamFindingsLkey
                        }
                    </Cell>
                </Column >

                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Masked used</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            rowData?.maskedUsed
                        }
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Hearing Loss Type</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.hearingLossTypeLvalue
                            ? rowData?.hearingLossTypeLvalue.lovDisplayVale
                            : rowData?.hearingLossTypeLkey
                        }
                    </Cell>
                </Column>
                <Column flexGrow={3} fullText>
                    <HeaderCell align="center">
                        <Translate>Hearing Loss Degree</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.hearingLossDegreeLvalue
                            ? rowData?.hearingLossDegreeLvalue.lovDisplayVale
                            : rowData?.hearingLossDegreeLkey
                        }
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Recommendations </Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.recommendations}
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Additional Notes</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData?.additionalNotes}
                    </Cell>
                </Column>
            </Table>
            <CancellationModal title="Cancel Audiometry Puretone" fieldLabel="Cancellation Reason" open={popupCancelOpen} setOpen={setPopupCancelOpen} object={audiometryPuretone} setObject={setAudiometryPuretone} handleCancle={handleCancle} fieldName="cancellationReason" />
            <AddAudiometryPuretone open={open} setOpen={setOpen} patient={patient} encounter={encounter} audiometryPuretoneObject={audiometryPuretone} refetch={refetchAudiometryPureton} />
        </div>
    );
};
export default AudiometryPuretone;