import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';

import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import SearchPatientCriteria from '@/components/SearchPatientCriteria';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { useSearchBillingPendingQueueQuery } from '@/services/encounters/patientEncounterService';
import MyInput from '@/components/MyInput';
import { useNavigate } from 'react-router-dom';
import {
    useLazyGetEncounterBillingSummaryQuery
} from '@/services/billing/billingTransactionService';
import MyButton from '@/components/MyButton/MyButton';
interface BillingPendingQueueModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
}

const getDefaultDateRange = () => {
    const today = new Date();

    const toDate = today.toISOString().split('T')[0];

    const from = new Date(today);
    from.setDate(from.getDate() - 7);

    const fromDate = from.toISOString().split('T')[0];

    return {
        fromDate,
        toDate
    };
};

const BillingPendingQueueModal: React.FC<BillingPendingQueueModalProps> = ({
    open,
    setOpen
}) => {
    const defaultDateRange = getDefaultDateRange();

    const navigate = useNavigate();

    const [dateInputKey, setDateInputKey] = useState(0);

    const [filterRecord, setFilterRecord] = useState<any>({
        patientName: '',
        searchByField: 'fullName',
        mrn: '',
        encounterNumber: '',
        fromDate: defaultDateRange.fromDate,
        toDate: defaultDateRange.toDate
    });

    const [searchRecord, setSearchRecord] = useState<any>({
        patientName: '',
        searchByField: 'fullName',
        mrn: '',
        encounterNumber: '',
        fromDate: defaultDateRange.fromDate,
        toDate: defaultDateRange.toDate
    });

    const [page, setPage] = useState(0);
    const [size, setSize] = useState(15);
    const [billingData, setBillingData] = useState<Record<number, any>>({});

    const [getEncounterBillingSummary] =
        useLazyGetEncounterBillingSummaryQuery();


    const {
        data: pendingQueueData,
        isLoading: pendingQueueLoading
    } = useSearchBillingPendingQueueQuery(
        {
            patientName:
                searchRecord.searchByField === 'fullName'
                    ? searchRecord.patientName || undefined
                    : undefined,

            mrn:
                searchRecord.searchByField === 'patientMrn'
                    ? searchRecord.patientName || undefined
                    : undefined,

            encounterNumber:
                searchRecord.encounterNumber || undefined,

            fromDate:
                searchRecord.fromDate || undefined,

            toDate:
                searchRecord.toDate || undefined,

            page,
            size,
            sort: 'id,desc'
        },
        {
            skip: !open
        }
    );

    const handleOpenAccounting = (row: any) => {
        if (!row?.id || !row?.patient) {
            return;
        }

        setOpen(false);

        navigate('/billing-accounting', {
            state: {
                fromPage: 'BillingPendingQueue',
                patient: row.patient,
                encounterId: Number(row.id)
            }
        });
    };

    const rows = pendingQueueData?.data ?? [];
    const totalCount = pendingQueueData?.totalCount ?? 0;

    useEffect(() => {
        if (!rows.length) {
            setBillingData({});
            return;
        }

        const loadBillingData = async () => {
            const billingResults = await Promise.all(
                rows.map(async (row: any) => {
                    if (!row?.id) {
                        return null;
                    }

                    try {
                        const result =
                            await getEncounterBillingSummary({
                                encounterId: row.id
                            }).unwrap();

                        return {
                            id: row.id,
                            data: result
                        };
                    } catch (error) {
                        console.error(
                            `Failed to load billing summary for encounter ${row.id}`,
                            error
                        );

                        return null;
                    }
                })
            );

            const nextBillingData: Record<number, any> = {};

            billingResults.forEach(result => {
                if (result?.id) {
                    nextBillingData[result.id] = result.data;
                }
            });

            setBillingData(nextBillingData);
        };

        loadBillingData();
    }, [rows, getEncounterBillingSummary]);

    const handlePatientSearchClick = () => {
        setPage(0);

        setSearchRecord({
            ...filterRecord
        });
    };

    const handleSearch = () => {
        setPage(0);

        setSearchRecord({
            ...filterRecord
        });
    };

    const handleClear = () => {
        const defaultDates = getDefaultDateRange();

        const clearedRecord = {
            patientName: '',
            searchByField: 'fullName',
            mrn: '',
            encounterNumber: '',
            fromDate: defaultDates.fromDate,
            toDate: defaultDates.toDate
        };

        setFilterRecord(clearedRecord);
        setSearchRecord(clearedRecord);
        setPage(0);

        setDateInputKey(prev => prev + 1);
    };

    const handlePageChange = (_: any, newPage: number) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setSize(parseInt(event.target.value, 10));
        setPage(0);
    };


    const getBillingSummary = (row: any) => {
        return billingData?.[row?.id] ?? null;
    };

    const getAmount = (row: any) => {
        const billing = getBillingSummary(row);

        return (
            billing?.netAmount ??
            billing?.grossAmount ??
            billing?.items?.reduce(
                (total: number, item: any) =>
                    total + Number(item?.netAmount ?? 0),
                0
            ) ??
            '-'
        );
    };

    const columns = [
        {
            key: 'encounterNumber',
            title: 'Encounter Number'
        },
        {
            key: 'patientName',
            title: 'Patient Name',
            render: (row: any) =>
                [
                    row?.patient?.firstName,
                    row?.patient?.secondName,
                    row?.patient?.thirdName,
                    row?.patient?.lastName
                ]
                    .filter(Boolean)
                    .join(' ')
        },
        {
            key: 'mrn',
            title: 'MRN',
            render: (row: any) =>
                row?.patient?.medicalRecordNumber ?? ''
        },
        {
            key: 'department',
            title: 'Department',
            render: (row: any) =>
                row?.departmentId ?? ''
        },
        {
            key: 'practitioner',
            title: 'Practitioner',
            render: (row: any) =>
                row?.practitionerId ?? ''
        },
        {
            key: 'date',
            title: 'Date',
            render: (row: any) =>
                row?.encounterDate ?? ''
        },
        {
            key: 'amount',
            title: 'Amount',
            render: (row: any) =>
                getAmount(row)
        },
        {
            key: 'status',
            title: 'Status',
            render: (row: any) =>
                row?.status ?? ''
        },
        {
            key: 'action',
            title: 'Action',
            render: (row: any) => (
                <MyButton
                    onClick={() => handleOpenAccounting(row)}
                >
                    Accounting
                </MyButton>
            )
        }
    ];

    const filters = (
        <>
            <Form fluid>
                <div className="results-filters-handle-position">

                    <MyInput
                        key={`fromDate-${dateInputKey}`}
                        fieldName="fromDate"
                        fieldType="date"
                        fieldLabel="From Date"
                        record={filterRecord}
                        setRecord={setFilterRecord}
                        width="100%"
                    />

                    <MyInput
                        key={`toDate-${dateInputKey}`}
                        fieldName="toDate"
                        fieldType="date"
                        fieldLabel="To Date"
                        record={filterRecord}
                        setRecord={setFilterRecord}
                        width="100%"
                    />

                    <div style={{ marginTop: '0.5vw' }}>
                        <SearchPatientCriteria
                            record={filterRecord}
                            setRecord={setFilterRecord}
                            liveSearchMinLength={0}
                            onSearchClick={handlePatientSearchClick}
                            searchOnIconClickOnly={true}
                        />
                    </div>

                    <MyInput
                        fieldName="encounterNumber"
                        fieldType="text"
                        fieldLabel="Encounter Number"
                        record={filterRecord}
                        setRecord={setFilterRecord}
                        placeholder="Search Encounter Number"
                        width="100%"
                    />

                </div>
            </Form>

            <AdvancedSearchFilters
                showAdvancedButton={false}
                searchOnClick={handleSearch}
                clearOnClick={handleClear}
            />
        </>
    );

    const content = (
        <div>
            <MyTable
                height={450}
                loading={pendingQueueLoading}
                data={rows}
                columns={columns}
                filters={filters}
                page={page}
                rowsPerPage={size}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />
        </div>
    );

    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Billing Pending Queue"
            size="90vw"
            bodyheight="85vh"
            content={content}
            hideActionBtn={true}
            cancelButtonLabel="Close"
        />
    );
};

export default BillingPendingQueueModal;