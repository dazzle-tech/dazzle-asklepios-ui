import React, { useEffect, useState } from 'react';
import './styles.less';
import { Checkbox } from 'rsuite';
import MyTable from '@/components/MyTable';
import CheckOutlineIcon from '@rsuite/icons/CheckOutline';
import CancellationModal from '@/components/CancellationModal';
import { useAppSelector, useAppDispatch } from '@/hooks';
import MyButton from '@/components/MyButton/MyButton';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import Translate from '@/components/Translate';
import PlusIcon from '@rsuite/icons/Plus';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import { MdModeEdit } from 'react-icons/md';
import { useSaveEncounterVaccineMutation, useGetEncounterVaccineQuery } from '@/services/observationService'
import { ApVaccine, ApVaccineBrands, ApEncounterVaccination } from '@/types/model-types';
import { newApVaccine, newApVaccineBrands, newApVaccineDose, newApEncounterVaccination } from '@/types/model-types-constructor';
import AddEncounterVaccine from './AddEncounterVaccine';
const VaccinationTab = ({ disabled, patient, encounter }) => {
    const authSlice = useAppSelector(state => state.auth);
    const dispatch = useAppDispatch();
    const [vaccine, setVaccine] = useState<ApVaccine>({ ...newApVaccine });
    const [vaccineBrand, setVaccineBrand] = useState<ApVaccineBrands>({ ...newApVaccineBrands, volume: null });
    const [vaccineDose, setVaccineDose] = useState<any>({ ...newApVaccineDose });
    const [encounterVaccination, setEncounterVaccination] = useState<ApEncounterVaccination>({ ...newApEncounterVaccination });
    const [popupOpen, setPopupOpen] = useState(false);
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
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
    const { data: encounterVaccineListResponseLoading, refetch: encounterVaccine, isLoading } = useGetEncounterVaccineQuery(encounterVaccineListRequest);


    const isSelected = rowData => {
        if (rowData && encounterVaccination && encounterVaccination.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    //handle Clear Fields
    const handleClearField = () => {
        setEncounterVaccination({ ...newApEncounterVaccination, statusLkey: null });
        setVaccine({
            ...newApVaccine,
            vaccineCode: '',
            vaccineName: '',
            typeLkey: null,
            roaLkey: null,
            durationUnitLkey: null,
            numberOfDosesLkey: null
        });
        setVaccineBrand({
            ...newApVaccineBrands,
            brandName: '',
            manufacturerLkey: null,
            unitLkey: null,
        });
        setVaccineDose({
            ...newApVaccineDose,
            fromAgeUnitLkey: null,
            toAgeUnitLkey: null,
            doseNameLkey: null,
        });
    };
    // Handle Add New Vaccine Record
    const handleAddNewVaccine = () => {
        handleClearField();
        setPopupOpen(true);
    }

    // Change page event handler
    const handlePageChange = (_: unknown, newPage: number) => {
        setEncounterVaccineListRequest({ ...encounterVaccineListRequest, pageNumber: newPage + 1 });
    };
    // Change number of rows per page
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEncounterVaccineListRequest({
            ...encounterVaccineListRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // Reset to first page
        });
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
    // Pagination values
    const pageIndex = encounterVaccineListRequest.pageNumber - 1;
    const rowsPerPage = encounterVaccineListRequest.pageSize;
    const totalCount = encounterVaccineListResponseLoading?.extraNumeric ?? 0;

    // Table Column
    const columns = [
        {
            key: 'vaccineName',
            title: 'Vaccine Name',
            render: (rowData: any) => rowData.vaccine?.vaccineName
        },
        {
            key: 'brandName',
            title: 'Brand Name',
            render: (rowData: any) => rowData.vaccineBrands?.brandName
        },
        {
            key: 'doseNumber',
            title: 'Dose Number',
            render: (rowData: any) =>
                rowData.vaccineDose?.doseNameLvalue?.lovDisplayVale ||
                rowData.vaccineDose?.doseNameLkey
        },
        {
            key: 'dateAdministered',
            title: 'Date of Administration',
            render: (rowData: any) => {
                if (!rowData.dateAdministered) return '';
                const date = new Date(rowData.dateAdministered);
                return date.toLocaleString('en-GB');
            }
        },
        {
            key: 'actualSide',
            title: 'Actual Side and Site of Administration',
            dataKey: 'actualSide',
            expandable: true,
        },
        {
            key: 'roa',
            title: 'ROA',
            render: (rowData: any) =>
                rowData.vaccine?.roaLvalue?.lovDisplayVale || rowData.vaccine?.roaLkey,
            expandable: true,
        },
        {
            key: 'externalFacilityName',
            title: 'Vaccination Location',
            dataKey: 'externalFacilityName',
            expandable: true,
        },
        {
            key: 'isReviewed',
            title: 'Is Reviewed',
            render: (rowData: any) => (rowData.reviewedAt === 0 ? 'No' : 'Yes')
        },
        {
            key: 'totalDoses',
            title: 'Total Vaccine Doses',
            render: (rowData: any) =>
                rowData.vaccine?.numberOfDosesLvalue?.lovDisplayVale ||
                rowData.vaccine?.numberOfDosesLkey
        },
        {
            key: 'status',
            title: 'Status',
            render: (rowData: any) =>
                rowData.statusLvalue?.lovDisplayVale || rowData.statusLkey
        },
        {
            key: "details",
            title: <Translate>Add details</Translate>,
            flexGrow: 2,
            fullText: true,
            render: rowData => {
                return (
                    <MdModeEdit
                        title="Edit"
                        size={24}
                        fill="var(--primary-gray)"
                        onClick={() => {
                            setEncounterVaccination({ ...rowData });
                            setVaccineBrand({ ...rowData.vaccineBrands });
                            setVaccineDose({ ...rowData.vaccineDose });
                            setVaccine({ ...rowData.vaccine });

                            setTimeout(() => {
                                setPopupOpen(true);
                            }, 0);
                        }}
                    />
                );
            }
        },
        {
            key: 'createdAt',
            title: 'Created At / Created By',
            expandable: true,
            render: (row: any) => `${new Date(row.createdAt).toLocaleString('en-GB')} / ${row?.createByUser?.fullName}`
        },
        {
            key: 'updatedAt',
            title: 'Updated At / Updated By',
            expandable: true,
            render: (row: any) => row?.updatedAt ? `${new Date(row.updatedAt).toLocaleString('en-GB')} / ${row?.updateByUser?.fullName}` : ' '
        },
        {
            key: 'deletedAt',
            title: 'Cancelled At / Cancelled By',
            expandable: true,
            render: (row: any) => row?.deletedAt ? `${new Date(row.deletedAt).toLocaleString('en-GB')} / ${row?.deleteByUser?.fullName}` : ' '
        },
        {
            key: 'cancellationReason',
            title: 'Cancellation Reason',
            dataKey: 'cancellationReason',
            expandable: true,
        }
    ];
    return (<div>
        <AddEncounterVaccine open={popupOpen} setOpen={setPopupOpen} patient={patient} encounter={encounter} encounterVaccination={encounterVaccination} setEncounterVaccination={setEncounterVaccination} vaccineObject={vaccine} vaccineDoseObjet={vaccineDose} vaccineBrandObject={vaccineBrand} isDisabled={disabled} refetch={encounterVaccine} />
        <div className='bt-div'>
            <MyButton prefixIcon={() => <CloseOutlineIcon />} onClick={() => { setPopupCancelOpen(true) }} disabled={encounterVaccination.key === undefined || encounterVaccination.statusLkey === '3196709905099521' || isEncounterStatusClosed || disabled || encounterVaccination.key != undefined ? encounter.key != encounterVaccination.encounterKey : false} >
                Cancel
            </MyButton>
            <MyButton disabled={encounterVaccination.key === undefined || encounterVaccination.statusLkey === '3721622082897301' || encounterVaccination.statusLkey === '3196709905099521' || encounterVaccination.key != undefined ? encounter.key != encounterVaccination.encounterKey : false || isEncounterStatusClosed || disabled} prefixIcon={() => <CheckOutlineIcon />} onClick={handleReviewe}>
                Review
            </MyButton>
            <Checkbox onChange={(value, checked) => { if (checked) { setEncounterStatus('3196709905099521'); } else { setEncounterStatus(''); } }}>
                Show Cancelled
            </Checkbox>
            <Checkbox onChange={(value, checked) => { if (checked) { setAllDate(true); } else { setAllDate(false); } }}>
                Show All Vaccines
            </Checkbox>
            <div className='bt-right'>
                <MyButton prefixIcon={() => <PlusIcon />} onClick={handleAddNewVaccine}>Add</MyButton>
            </div>
        </div>
        <MyTable
            data={encounterVaccineListResponseLoading?.object ?? []}
            columns={columns}
            loading={isLoading}
            onRowClick={rowData => {
                setEncounterVaccination({
                    ...rowData
                });
                setVaccineBrand({ ...rowData.vaccineBrands });
                setVaccineDose({ ...rowData.vaccineDose })
                setVaccine({ ...rowData.vaccine })
            }}
            rowClassName={isSelected}
            page={pageIndex}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
        />

        <CancellationModal open={popupCancelOpen}
            setOpen={setPopupCancelOpen}
            object={encounterVaccination}
            setObject={setEncounterVaccination}
            handleCancle={handleCancle}
            fieldName="cancellationReason"
            fieldLabel="Cancellation Reason"
            title="Cancellation" />
    </div>);
};
export default VaccinationTab;