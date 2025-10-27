import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { ApInventoryTransaction, ApInventoryTransfer, ApPatient, ApPatientInsurance } from '@/types/model-types';
import { useGetLovValuesByCodeQuery, useGetProductQuery, useGetUomGroupsUnitsQuery, useGetWarehouseQuery } from '@/services/setupService';
import MyTable from '@/components/MyTable';
import { initialListRequest, ListRequest } from '@/types/types';
import { addFilterToListRequest, conjureValueBasedOnKeyFromList } from '@/utils';
import './styles.less'
import { newApInventoryTransaction, newApInventoryTransfer, newApPatient, newApPatientInsurance } from '@/types/model-types-constructor';
import { useDispatch } from 'react-redux';
import { faFileExport, faMagnifyingGlass, faPlus } from '@fortawesome/free-solid-svg-icons';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import { faFileCsv } from '@fortawesome/free-solid-svg-icons';
import ReactDOMServer from 'react-dom/server';
import MyButton from '@/components/MyButton/MyButton';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { formatDateWithoutSeconds } from '@/utils';
import { useGetInventoryTransactionsAttachmentQuery, useGetInventoryTransactionsProductQuery, useGetInventoryTransactionsQuery, useGetInventoryTransferQuery } from '@/services/inventoryTransactionService';
import Translate from '@/components/Translate';
import AddEditTransfer from './AddEditTransfer';
const inventoryTransfer = () => {

    const [open, setOpen] = useState(false);
    const [searchPatient, setSearchPatient] = useState<ApPatient>({ ...newApPatient });
    const [transfer, setTransfer] = useState<ApInventoryTransfer>({ ...newApInventoryTransfer });
    const [insurancePatient, setInsurancePatient] = useState<ApPatientInsurance>({ ...newApPatientInsurance });
    const [dateFilter, setDateFilter] = useState({ fromDate: '', toDate: '' });
    // Fetch LOV data for various fields
    const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
    const { data: documentTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
    const { data: primaryInsuranceProviderLovQueryResponse } = useGetLovValuesByCodeQuery('INS_PROVIDER');
    const [transactionListRequest, setTransactionListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            },
        ],
    });

    const [transactionProductListRequest, setTransactionProductListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            },
        ],
    });

    const { data: transstatusListResponse, refetch: refetchTransStatus } = useGetLovValuesByCodeQuery('LABRAD_ORDER_STATUS');

    const { data: transReasonInListResponse } = useGetLovValuesByCodeQuery('STOCK_IN_REASONS');

    const { data: transReasonOutListResponse } = useGetLovValuesByCodeQuery('STOCK_OUT_REASONS');

    const { data: warehouseListResponse } = useGetWarehouseQuery(transactionListRequest);

    // const { data: inventoryTransListResponse } = useGetInventoryTransactionsQuery(transactionListRequest);

    const { data: inventoryTransAttachmentListResponse, refetch: refetchTransAttachment } = useGetInventoryTransactionsAttachmentQuery(transactionListRequest);

    const { data: inventoryTransListResponse, refetch: refetchTransProduct } = useGetInventoryTransferQuery(transactionProductListRequest);

    // Initialize list request with default filters
    const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest, filters: [] });


    const [productsListRequest, setProductsListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            }
        ],
    });
    const {
        data: productListResponseLoading,
        refetch: refetchProduct,
        isFetching: productListIsFetching
    } = useGetProductQuery(productsListRequest);

    const [uomListRequest, setUomListRequest] = useState<ListRequest>({ ...initialListRequest });

    const {
        data: uomGroupsUnitsListResponse,
        refetch: refetchUomGroupsUnit,
    } = useGetUomGroupsUnitsQuery(uomListRequest);

    const calculateCost = (totalQuantity, unitCost) => {
        return totalQuantity * unitCost;
    };

    const columns = [
        { key: 'index', title: '#', render: (rowData, rowIndex) => rowIndex + 1 },
        { key: 'transNo', title: 'Transfer No', dataKey: 'transNo' },
        { key: 'transReason', title: 'Transfer Reason', dataKey: 'transReason' },
        {
            key: 'fromWarehouse',
            title: <Translate>From Warehouse</Translate>,
            flexGrow: 4,
            render: rowData => (
                <span>
                    {conjureValueBasedOnKeyFromList(
                        warehouseListResponse?.object ?? [],
                        rowData.fromWarehouseKey,
                        'warehouseName'
                    )}
                </span>
            )
        },
        {
            key: 'toWarehouse',
            title: <Translate>To Warehouse</Translate>,
            flexGrow: 4,
            render: rowData => (
                <span>
                    {conjureValueBasedOnKeyFromList(
                        warehouseListResponse?.object ?? [],
                        rowData.toWarehouseKey,
                        'warehouseName'
                    )}
                </span>
            )
        },
        {
            key: 'statusLkey',
            title: <Translate>Transfer Status</Translate>,
            flexGrow: 4,
            render: rowData => (
                <span>
                    {conjureValueBasedOnKeyFromList(
                        transstatusListResponse?.object ?? [],
                        rowData.statusLkey,
                        'lovDisplayVale'
                    )}
                </span>
            )
        },
        { key: 'note', title: 'NOTE', dataKey: 'note' },
        {
            key: 'createdAt',
            title: 'Initiated By/At',
            flexGrow: 4,
            render: (row: any) =>
                row?.createdAt ? (
                    <>
                        <br />
                        <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>
                    </>
                ) : (
                    ' '
                ),
        }
    ];
    // handle manual search from date to date 
    const handleManualSearch = () => {
        if (dateFilter.fromDate && dateFilter.toDate) {
            const formattedFromDate = dateFilter.fromDate;
            const formattedToDate = dateFilter.toDate;
            setListRequest(
                addFilterToListRequest(
                    'created_at',
                    'between',
                    formattedFromDate + '_' + formattedToDate,
                    listRequest
                )
            );
        } else if (dateFilter.fromDate) {
            const formattedFromDate = dateFilter.fromDate;
            setListRequest(
                addFilterToListRequest('created_at', 'gte', formattedFromDate, listRequest)
            );
        } else if (dateFilter.toDate) {
            const formattedToDate = dateFilter.toDate;
            setListRequest(
                addFilterToListRequest('created_at', 'lte', formattedToDate, listRequest)
            );
        } else {
            setListRequest({ ...listRequest, filters: [] });
        }
    };
    // handle search of dob
    const handleDOFSearch = () => {
        const dob = searchPatient?.dob;
        setListRequest(
            addFilterToListRequest(
                'dob',
                'match',
                dob,
                listRequest
            )
        );

    };
    // Effects
    useEffect(() => {
        handleManualSearch();
    }, []);
    useEffect(() => {
        setListRequest((prevState) => ({
            ...prevState,
            filters: [
                ...prevState.filters.filter(
                    (filter) =>
                        !['gender_lkey', 'document_type_lkey', 'insurance_provider_lkey'].includes(
                            filter.fieldName
                        )
                ),
                searchPatient.genderLkey && {
                    fieldName: 'gender_lkey',
                    operator: 'match',
                    value: searchPatient.genderLkey,
                },
                searchPatient.documentTypeLkey && {
                    fieldName: 'document_type_lkey',
                    operator: 'match',
                    value: searchPatient.documentTypeLkey,
                },
                insurancePatient.insuranceProviderLkey && {
                    fieldName: 'insurance_provider_lkey',
                    operator: 'match',
                    value: insurancePatient.insuranceProviderLkey,
                },
            ].filter(Boolean),
        }));
    }, [searchPatient.genderLkey, searchPatient.documentTypeLkey, insurancePatient.insuranceProviderLkey]);
    useEffect(() => {
        handleManualSearch();
    }, [dateFilter]);
    useEffect(() => {
        handleDOFSearch();
    }, [searchPatient?.dob]);

    const dispatch = useDispatch();
    const divContent = (
           "Transfer Product"
    );
    // page header setup
    dispatch(setPageCode('Inventory_Transfer'));
    dispatch(setDivContent(divContent));

    useEffect(() => {
        return () => {
            dispatch(setPageCode(''));
            dispatch(setDivContent('  '));
        };
    }, [location.pathname, dispatch]);

const filters = (<>                <Form layout='inline' fluid>
                    <MyInput
                        column
                        fieldLabel="From Date"
                        fieldType="date"
                        fieldName="fromDate"
                        record={dateFilter}
                        setRecord={setDateFilter}
                    />
                    <MyInput
                        column
                        fieldLabel="To Date"
                        fieldType="date"
                        fieldName="toDate"
                        record={dateFilter}
                        setRecord={setDateFilter}
                    />
                    <MyInput
                        column
                        fieldLabel="To Warehouse "
                        fieldType="select"
                        fieldName="documentTypeLkey"
                        selectData={[]}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={searchPatient}
                        setRecord={setSearchPatient}
                    />
                    <MyInput
                        column
                        fieldLabel="From Warehouse"
                        fieldType="select"
                        fieldName="warehouseLkey"
                        selectData={[]}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={insurancePatient}
                        setRecord={setInsurancePatient}
                    />
                </Form>
                
                          <AdvancedSearchFilters searchFilter={true}/>
</>);

const tablebuttons = (<><div className='btns-group'>
                        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faPlus} />} onClick={() => setOpen(true)}>Initiate Transfer</MyButton>
                    </div></>);
    return (<>


            <MyTable
                data={inventoryTransListResponse?.object ?? []}
                columns={columns}
                filters={filters}
                tableButtons={tablebuttons}
                height={800}
                loading={false}
            />
            <AddEditTransfer open={open} setOpen={setOpen} transfer={transfer} setTransfer={setTransfer} refetch={refetchTransProduct} />

    </>);
};

export default inventoryTransfer;
