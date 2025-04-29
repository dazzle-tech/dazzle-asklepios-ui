import React, { useEffect, useState } from 'react';
import './styles.less';
import {IconButton,Table,Checkbox} from 'rsuite';
import Translate from '@/components/Translate';
import CheckOutlineIcon from '@rsuite/icons/CheckOutline';
import CancellationModal from '@/components/CancellationModal';
import { useAppSelector, useAppDispatch } from '@/hooks';
import MyButton from '@/components/MyButton/MyButton';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import PlusIcon from '@rsuite/icons/Plus';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import { useSaveEncounterVaccineMutation, useGetEncounterVaccineQuery } from '@/services/observationService'
import { ApVaccine, ApVaccineBrands, ApEncounterVaccination } from '@/types/model-types';
import { newApVaccine, newApVaccineBrands, newApVaccineDose, newApEncounterVaccination } from '@/types/model-types-constructor';
import AddEncounterVaccine from './AddEncounterVaccine';
const { Column, HeaderCell, Cell } = Table;
const VaccinationTab = ({ disabled, patient, encounter }) => {
    const authSlice = useAppSelector(state => state.auth);
    const dispatch = useAppDispatch();
    const [vaccine, setVaccine] = useState<ApVaccine>({ ...newApVaccine });
    const [vaccineBrand, setVaccineBrand] = useState<ApVaccineBrands>({ ...newApVaccineBrands, volume: null });
    const [vaccineDose, setVaccineDose] = useState<any>({ ...newApVaccineDose });
    const [encounterVaccination, setEncounterVaccination] = useState<ApEncounterVaccination>({ ...newApEncounterVaccination });
    const [popupOpen, setPopupOpen] = useState(false);
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const [encounterStatus, setEncounterStatus] = useState('');
    const [allData, setAllDate] = useState(false);
    const reviewedAt = (new Date()).getTime();
    const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
    const [saveEncounterVaccine] = useSaveEncounterVaccineMutation();

   // Initialize List Request Filters
    const [encounterVaccineListRequest, setEncounterVaccineListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
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
            {
                fieldName: 'encounter_key',
                operator: 'match',
                value: encounter?.key
            }
        ],
    });
   
    //List Responses
    // Fetch Encounter Vaccinelist
    const { data: encounterVaccineListResponseLoading, refetch: encounterVaccine } = useGetEncounterVaccineQuery(encounterVaccineListRequest);
    /// handleFunctions
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
                <Column flexGrow={1} fullText>
                    <HeaderCell>Created At</HeaderCell>
                    <Cell >
                        {rowData => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString("en-GB") : ""}
                    </Cell>
                </Column>
                <Column flexGrow={1} fullText>
                    <HeaderCell>Created By</HeaderCell>
                    <Cell >
                        {rowData => rowData?.createByUser?.fullName}
                    </Cell>
                </Column>
                <Column flexGrow={1} fullText>
                    <HeaderCell>Updated At</HeaderCell>
                    <Cell >

                        {rowData => rowData.updatedAt ? new Date(rowData.updatedAt).toLocaleString("en-GB") : ""}
                    </Cell>
                </Column>
                <Column flexGrow={1} fullText>
                    <HeaderCell>Updated By</HeaderCell>
                    <Cell >
                        {rowData => rowData?.updateByUser?.fullName}
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell>Reviewed At</HeaderCell>
                    <Cell dataKey="reviewedAt" >
                        {rowData => rowData.reviewedAt ? new Date(rowData.reviewedAt).toLocaleString("en-GB") : ""}
                    </Cell>
                </Column>
                <Column flexGrow={1} fullText>
                    <HeaderCell>Reviewed By</HeaderCell>
                    <Cell >
                        {rowData => rowData?.reviewedByUser?.fullName}
                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell>Cancelled At</HeaderCell>
                    <Cell dataKey="deletedAt" >
                        {rowData => rowData.deletedAt ? new Date(rowData.deletedAt).toLocaleString("en-GB") : ""}
                    </Cell>
                </Column>
                <Column flexGrow={1} fullText>
                    <HeaderCell>Cancelled By</HeaderCell>
                    <Cell >
                        {rowData => rowData?.deleteByUser?.fullName}
                    </Cell>
                </Column>
                <Column flexGrow={1} fullText>
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
    const isSelected = rowData => {
        if (rowData && encounterVaccination && encounterVaccination.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    //handle Cancle Vaccine
    const handleCancle = () => {
        saveEncounterVaccine({ ...encounterVaccination, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime(), deletedBy: authSlice.user.key }).unwrap().then(() => {
            dispatch(notify('Encounter Vaccine Canceled Successfully'));
            encounterVaccine();   
        });
        setPopupCancelOpen(false);
    };
    //handle Reviewe Vaccine
    const handleReviewe = () => {
        saveEncounterVaccine({ ...encounterVaccination, statusLkey: "3721622082897301", reviewedAt: reviewedAt, reviewedBy: authSlice.user.key, updatedBy: authSlice.user.key }).unwrap().then(() => {
            dispatch(notify('Encounter Vaccine Reviewed Successfully'));
            encounterVaccine();
        });
    }
   // Effects
    useEffect(() => {
         // TODO update status to be a LOV value
        if (encounter?.encounterStatusLkey === '91109811181900') {
            setIsEncounterStatusClosed(true);
        }
    }, [encounter?.encounterStatusLkey]);
    useEffect(() => {
        setEncounterVaccineListRequest((prev) => ({
            ...prev,
            filters: [
                ...(encounterStatus !== ''
                    ? [
                        {
                            fieldName: 'status_lkey',
                            operator: 'match',
                            value: encounterStatus,
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
        setEncounterVaccineListRequest((prev) => {
            const filters =
                encounterStatus != '' && allData
                    ? [

                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                    ]
                    : encounterStatus === '' && allData
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
    }, [encounterStatus, allData]);
    return (<div>
        <AddEncounterVaccine open={popupOpen} setOpen={setPopupOpen} patient={patient} encounter={encounter} encounterVaccination={encounterVaccination} setEncounterVaccination={setEncounterVaccination} vaccineObject={vaccine} vaccineDoseObjet={vaccineDose} vaccineBrandObject={vaccineBrand} isDisabled={disabled}/>
        <div className='bt-div'>
            <MyButton prefixIcon={() => <CloseOutlineIcon />} onClick={() => { setPopupCancelOpen(true) }} disabled={encounterVaccination.key === undefined || encounterVaccination.statusLkey === '3196709905099521' || isEncounterStatusClosed || disabled || encounterVaccination.key != undefined ? encounter.key != encounterVaccination.encounterKey : false} >
            Cancel
            </MyButton>
            <MyButton disabled={encounterVaccination.key === undefined || encounterVaccination.statusLkey === '3721622082897301' || encounterVaccination.statusLkey === '3196709905099521' || encounterVaccination.key != undefined ? encounter.key != encounterVaccination.encounterKey : false || isEncounterStatusClosed || disabled} prefixIcon={() => <CheckOutlineIcon />} onClick={handleReviewe}>
                Review
            </MyButton>
            <Checkbox onChange={(value, checked) => {if (checked) {setEncounterStatus('3196709905099521');} else {setEncounterStatus('');}}}>
                Show Cancelled
            </Checkbox>
            <Checkbox onChange={(value, checked) => {if (checked) { setAllDate(true); }else {setAllDate(false); } }}>
                Show All Vaccines
            </Checkbox>
            <div className='bt-right'>
                <MyButton prefixIcon={() => <PlusIcon />} onClick={() => setPopupOpen(true)}>Add</MyButton>
            </div>
        </div>
        <Table
            autoHeight
            data={encounterVaccineListResponseLoading?.object ?? []}
            rowKey="key"
            expandedRowKeys={expandedRowKeys}
            renderRowExpanded={renderRowExpanded}
            shouldUpdateScroll={false}
            onRowClick={rowData => {
                setEncounterVaccination({
                    ...rowData
                });
                setVaccineBrand({ ...rowData.vaccineBrands });
                setVaccineDose({ ...rowData.vaccineDose })
                setVaccine({ ...rowData.vaccine })

            }}
            rowClassName={isSelected}
        >
            <Column width={70}  >
                <HeaderCell>#</HeaderCell>
                <ExpandCell rowData={rowData => rowData} dataKey="key" expandedRowKeys={expandedRowKeys} onChange={handleExpanded} />
            </Column>
            <Column flexGrow={2} fullText>
                <HeaderCell  >
                    <Translate>Vaccine Name</Translate>
                </HeaderCell>
                <Cell>
                    {rowData =>
                        rowData.vaccine?.vaccineName
                    }
                </Cell>
            </Column >
            <Column flexGrow={2} fullText>
                <HeaderCell  >
                    <Translate>Brand Name</Translate>
                </HeaderCell>
                <Cell>
                    {rowData =>
                        rowData.vaccineBrands?.brandName
                    }
                </Cell>
            </Column>
            <Column flexGrow={2} fullText>
                <HeaderCell  >
                    <Translate>Dose Number</Translate>
                </HeaderCell>
                <Cell>
                    {rowData =>
                        rowData.vaccineDose?.doseNameLvalue
                            ? rowData.vaccineDose?.doseNameLvalue.lovDisplayVale
                            : rowData.vaccineDose?.doseNameLkey
                    }
                </Cell>
            </Column>
            <Column flexGrow={2} fullText>
                <HeaderCell  >
                    <Translate>Date of Administration</Translate>
                </HeaderCell>
                <Cell>
                    {rowData => {
                        if (!rowData.dateAdministered) return "  ";
                        const date = new Date(rowData.dateAdministered);
                        return date.toLocaleString("en-GB");
                    }}
                </Cell>
            </Column>
            <Column flexGrow={3} fullText>
                <HeaderCell  >
                    <Translate>Actual Side and Site of Administration</Translate>
                </HeaderCell>
                <Cell dataKey="actualSide" />
            </Column>
            <Column flexGrow={1} fullText>
                <HeaderCell  >
                    <Translate>ROA</Translate>
                </HeaderCell>
                <Cell>
                    {rowData =>
                        rowData?.vaccine?.roaLvalue
                            ? rowData?.vaccine?.roaLvalue?.lovDisplayVale
                            : rowData?.vaccine?.roaLkey
                    }

                </Cell>
            </Column>
            <Column flexGrow={2} fullText>
                <HeaderCell  >
                    <Translate>Vaccination Location</Translate>
                </HeaderCell>
                <Cell dataKey="externalFacilityName" />
            </Column>
            <Column flexGrow={2} fullText>
                <HeaderCell  >
                    <Translate>Is Reviewed</Translate>
                </HeaderCell>
                <Cell>
                    {rowData =>
                        rowData.reviewedAt === 0 ? "No" : "Yes"
                    }
                </Cell>
            </Column>
            <Column flexGrow={2} fullText>
                <HeaderCell  >
                    <Translate>Total Vaccine Doses</Translate>
                </HeaderCell>
                <Cell>
                    {rowData =>
                        rowData?.vaccine?.numberOfDosesLvalue
                            ? rowData?.vaccine?.numberOfDosesLvalue?.lovDisplayVale
                            : rowData?.vaccine?.numberOfDosesLkey
                    }
                </Cell>
            </Column>
            <Column flexGrow={1} fullText>
                <HeaderCell  >
                    <Translate>Status</Translate>
                </HeaderCell>
                <Cell>
                    {rowData =>
                        rowData?.statusLvalue
                            ? rowData?.statusLvalue?.lovDisplayVale
                            : rowData?.statusLkey
                    }
                </Cell>
            </Column>
        </Table>
        <CancellationModal open={popupCancelOpen}
         setOpen={setPopupCancelOpen} 
         object={encounterVaccination} 
         setObject={setEncounterVaccination} 
         handleCancle={handleCancle} 
         fieldName="cancellationReason" 
         fieldLabel="Cancellation Reason"
         title="Cancellation"/>
    </div>);
};
export default VaccinationTab;