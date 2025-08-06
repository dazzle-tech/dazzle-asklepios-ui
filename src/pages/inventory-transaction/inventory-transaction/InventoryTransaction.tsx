import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { ApInventoryTransaction, ApPatient, ApPatientInsurance } from '@/types/model-types';
import { useGetLovValuesByCodeQuery, useGetProductQuery, useGetUomGroupsUnitsQuery, useGetWarehouseQuery } from '@/services/setupService';
import MyTable from '@/components/MyTable';
import { initialListRequest, ListRequest } from '@/types/types';
import { addFilterToListRequest, conjureValueBasedOnKeyFromList } from '@/utils';
import './styles.less'
import { newApInventoryTransaction, newApPatient, newApPatientInsurance } from '@/types/model-types-constructor';
import { faFileExport, faMagnifyingGlass, faPlus } from '@fortawesome/free-solid-svg-icons';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import { faFileCsv } from '@fortawesome/free-solid-svg-icons';
import ReactDOMServer from 'react-dom/server';
import MyButton from '@/components/MyButton/MyButton';
import { formatDateWithoutSeconds } from '@/utils';
import AddEditTransaction from './AddEditTransaction';
import { useGetInventoryTransactionsAttachmentQuery, useGetInventoryTransactionsProductQuery, useGetInventoryTransactionsQuery } from '@/services/inventoryTransactionService';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
const InventoryTransaction = () => {

    const dispatch = useAppDispatch();
    const [open, setOpen] = useState(false);
    const [searchPatient, setSearchPatient] = useState<ApPatient>({ ...newApPatient });
    const [inventoryTransaction, setInventoryTransaction] = useState<ApInventoryTransaction>({ ...newApInventoryTransaction });
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
            }

        ],
    });

    const { data: transTypeListResponse, refetch: refetchTransType } = useGetLovValuesByCodeQuery('STOCK_TRANSACTION_TYPES');

    const { data: transReasonInListResponse } = useGetLovValuesByCodeQuery('STOCK_IN_REASONS');

    const { data: transReasonOutListResponse } = useGetLovValuesByCodeQuery('STOCK_OUT_REASONS');

    const { data: warehouseListResponse } = useGetWarehouseQuery(transactionListRequest);

    const { data: inventoryTransListResponse } = useGetInventoryTransactionsQuery(transactionListRequest);

    const { data: inventoryTransAttachmentListResponse, refetch: refetchTransAttachment } = useGetInventoryTransactionsAttachmentQuery(transactionListRequest);

    const { data: inventoryTransProductListResponse, refetch: refetchTransProduct } = useGetInventoryTransactionsProductQuery(transactionProductListRequest);

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
        {
            key: 'transactionId',
            title: <Translate>Transaction ID</Translate>,
            flexGrow: 4,
            render: rowData => (
                <span>
                    {conjureValueBasedOnKeyFromList(
                        inventoryTransListResponse?.object ?? [],
                        rowData.transactionObj?.transId,
                        'transId'
                    )}
                </span>
            )
        },
        {
            key: 'transactionType',
            title: <Translate>Transaction Type</Translate>,
            flexGrow: 4,
            render: rowData => (
                <span>
                    {conjureValueBasedOnKeyFromList(
                        transTypeListResponse?.object ?? [],
                        rowData.transactionObj?.transTypeLkey,
                        'lovDisplayVale'
                    )}
                </span>
            )
        },
        {
            key: 'transReason',
            title: <Translate>Transaction Reason</Translate>,
            flexGrow: 4,
            render: rowData => (
                <span>
                    {conjureValueBasedOnKeyFromList(
                        rowData.transactionObj?.transTypeLkey === '6509244814441399' ? transReasonInListResponse?.object ?? [] : transReasonOutListResponse?.object ?? [],
                        rowData.transactionObj?.transReasonLkey,
                        'lovDisplayVale'
                    )}
                </span>
            )
        },
        {
            key: 'warehouseName',
            title: <Translate>Warehouse Name</Translate>,
            flexGrow: 4,
            render: rowData => (
                <span>
                    {conjureValueBasedOnKeyFromList(
                        warehouseListResponse?.object ?? [],
                        rowData.warehouseObj?.key,
                        'warehouseName'
                    )}
                </span>
            )
        },
        {
            key: 'productName',
            title: <Translate>Product Name</Translate>,
            flexGrow: 4,
            render: rowData => (
                <span>
                    {conjureValueBasedOnKeyFromList(
                        productListResponseLoading?.object ?? [],
                        rowData.productObj?.key,
                        'name'
                    )}
                </span>
            )
        },
        {
            key: 'productcode',
            title: <Translate>Product code</Translate>,
            flexGrow: 4,
            render: rowData => (
                <span>
                    {conjureValueBasedOnKeyFromList(
                        productListResponseLoading?.object ?? [],
                        rowData.productObj?.key,
                        'code'
                    )}
                </span>
            )
        },
        { key: 'Quantity', title: 'QUANTITY', dataKey: 'newQuentity' },
        {
            key: 'productUOM',
            title: <Translate>Product Base UOM</Translate>,
            flexGrow: 4,
            render: rowData => (
                <span>
                    {conjureValueBasedOnKeyFromList(
                        uomGroupsUnitsListResponse?.object ?? [],
                        rowData.productObj?.baseUomKey,
                        'units'
                    )}
                </span>
            )
        },
        {
            key: 'productUOM',
            title: <Translate>Product Transaction UOM</Translate>,
            flexGrow: 4,
            render: rowData => (
                <span>
                    {conjureValueBasedOnKeyFromList(
                        uomGroupsUnitsListResponse?.object ?? [],
                        rowData.transUomKey,
                        'units'
                    )}
                </span>
            )
        },
        { key: 'newCost', title: 'COST PER UNIT', dataKey: 'newCost' },
        { key: 'expiryDate', title: 'EXPIRY DATE', dataKey: 'expiryDate' },
        { key: 'lotserialnumber', title: 'LOT/SERIAL Number', dataKey: 'lotserialnumber' },

        {
            key: 'AverageCostAfter',
            title: 'Average Cost After',
            flexGrow: 4,
            render: rowData => (
                <span>
                    {calculateCost(rowData.newQuentity, rowData.newCost).toFixed(2)}

                </span>
            )
        },
        {
            key: 'createdAt',
            title: 'Performed By/At',
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
        },

        {
            key: 'isvalid',
            title: <Translate>Status</Translate>,
            flexGrow: 4,
            render: rowData => (rowData.isvalid ? 'InValid' : 'Valid')
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
    useEffect(() => {
        return () => {
            dispatch(setPageCode(''));
            dispatch(setDivContent('  '));
        };
    }, [location.pathname, dispatch]);

    // Effects
    useEffect(() => {
        handleManualSearch();
    }, []);

    // useEffect(() => {
    //     setTransactionProductListRequest(prev => ({
    //         ...prev,
    //         filters: [
    //             {
    //                 fieldName: 'deleted_at',
    //                 operator: 'isNull',
    //                 value: undefined,
    //             },
    //             {
    //                 fieldName: 'productKey',
    //                 operator: 'match',
    //                 value: productKey ? productKey : undefined,
    //             }
    //         ]
    //     }));

    // }, [productKey]);

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

    const divContent = (
        <div style={{ display: 'flex' }}>
            <h5> Inventory Transaction</h5>
        </div>
    );
    // page header setup
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('Inventory_Transaction'));
    dispatch(setDivContent(divContentHTML));
    return (
        <div className='container-div'>
            {/* {productKey === null && ( */}
                <div className='field-btn-div'>
                    <Form layout='inline' fluid>
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
                        fieldLabel="Transaction ID"
                        fieldName="transactionId"
                        record={searchPatient}
                        setRecord={setSearchPatient}
                    />
                    <MyInput
                        column
                        fieldLabel="Product Type"
                        fieldType="select"
                        fieldName="productTypeLkey"
                        selectData={[]}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={searchPatient}
                        setRecord={setSearchPatient}
                    />
                    <MyInput
                        column
                        fieldLabel="code"
                        fieldName="transactionId"
                        record={searchPatient}
                        setRecord={setSearchPatient}
                    />
                    <MyInput
                        column
                        fieldLabel="Transaction Type"
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
                        fieldLabel="Warehouse Name"
                        fieldType="select"
                        fieldName="warehouseLkey"
                        selectData={[]}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={insurancePatient}
                        setRecord={setInsurancePatient}
                    />
                </Form>
                <div className='bt-right-group'>
                    <div className='btns-group'>
                        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faMagnifyingGlass} />} ></MyButton>
                        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faBroom} />} >Clear</MyButton>
                        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faPlus} />} onClick={() => setOpen(true)}>Add Transaction</MyButton>
                        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faFileExport} />} >Export to Xsl</MyButton>
                    </div>
                </div>
            </div>
            {/* )} */}
            <MyTable
                data={inventoryTransProductListResponse?.object ?? []}
                columns={columns}
                height={800}
                loading={false}
            />
            <AddEditTransaction open={open} setOpen={setOpen} transaction={inventoryTransaction} setTransaction={setInventoryTransaction} refetch={refetchTransProduct} refetchAttachmentList={refetchTransAttachment} />
        </div>

    );
};

export default InventoryTransaction;
