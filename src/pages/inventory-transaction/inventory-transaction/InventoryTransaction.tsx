import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { ApInventoryTransaction, ApInventoryTransactionProduct, ApPatient, ApPatientInsurance } from '@/types/model-types';
import { useGetLovValuesByCodeQuery, useGetProductQuery, useGetUomGroupsUnitsQuery, useGetWarehouseQuery } from '@/services/setupService';
import MyTable from '@/components/MyTable';
import { initialListRequest, ListRequest } from '@/types/types';
import { addFilterToListRequest, conjureValueBasedOnKeyFromList } from '@/utils';
import './styles.less'
import { newApInventoryTransaction, newApInventoryTransactionProduct, newApPatient, newApPatientInsurance } from '@/types/model-types-constructor';
import { faEdit, faFileExport, faMagnifyingGlass, faPlus, faWarehouse } from '@fortawesome/free-solid-svg-icons';
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
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyModal from '@/components/MyModal/MyModal';
import ModalProductCard from '../product-catalog/ModalProductCard';
import InfoCardList from '@/components/InfoCardList';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';

const InventoryTransaction = () => {

    const dispatch = useAppDispatch();
    const [open, setOpen] = useState(false);
    const [searchTrans, setSearchTrans] = useState<ApInventoryTransactionProduct>({ ...newApInventoryTransactionProduct });
    const [inventoryTransaction, setInventoryTransaction] = useState<ApInventoryTransaction>({ ...newApInventoryTransaction });
    const [insurancePatient, setInsurancePatient] = useState<ApPatientInsurance>({ ...newApPatientInsurance });


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

    const { data: inventoryTransProductListResponse, refetch: refetchTransProduct, isLoading, isFetching } = useGetInventoryTransactionsProductQuery(transactionProductListRequest);

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

    // Pagination values
    const pageIndex = transactionProductListRequest.pageNumber - 1;
    const rowsPerPage = transactionProductListRequest.pageSize;
    const totalCount = inventoryTransProductListResponse?.extraNumeric ?? 0;
    const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });

    // Available fields for filtering
    const filterFields = [
        { label: 'Resource Type', value: 'resourceTypeLkey' },
        { label: 'Resource Name', value: 'resourceName' },
        { label: 'Status', value: 'isValid' },
        { label: 'Creation Date', value: 'createdAt' },
        { label: 'createdBy', value: 'Created By' }
    ];

    // Handle page change in navigation
    const handlePageChange = (_: unknown, newPage: number) => {
        setTransactionProductListRequest({ ...transactionProductListRequest, pageNumber: newPage + 1 });
    };
    // Handle change rows per page in navigation
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTransactionProductListRequest({
            ...transactionProductListRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1
        });
    };

      // Setting the encounter based on the selected row data
        const [dateFilter, setDateFilter] = useState({
            fromDate: new Date(),
            toDate: new Date()
        });
        // Setting the confirm date filter for transfer transactions
        const [confirmDateFilter, setConfirmDateFilter] = useState({
            fromDate: new Date(),
            toDate: new Date()
        });
        // Function to update filters in the list request
        const updateFilter = (fieldName: string, operator: string, value?: string | number) => {
            setListRequest(prev => {
                const newFilters = prev.filters.filter(f => f.fieldName !== fieldName);
                if (value !== undefined && value !== null && value !== '') {
                    newFilters.push({ fieldName, operator, value: String(value) });
                }
                return { ...prev, filters: newFilters, pageNumber: 1 };
            });
        };

        useEffect(() => {
            if (dateFilter.fromDate && dateFilter.toDate) {
                const from = new Date(dateFilter.fromDate);
                const to = new Date(dateFilter.toDate);
                from.setHours(0, 0, 0, 0);
                to.setHours(23, 59, 59, 999);
                updateFilter('created_at', 'between', `${from.getTime()}_${to.getTime()}`);
            } else {
                updateFilter('created_at', 'between', undefined);
            }
        }, [dateFilter]);

    const [openDetailsModal, setOpenDetailsModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [detailsType, setDetailsType] = useState<'product' | 'warehouse' | null>(null);

    const dataDetails = () => {

        return (
            <div >
                <MyModal
                    hideActionBtn
                    title={detailsType === 'product' ? 'Product Details' : 'Warehouse Details'}
                    open={openDetailsModal}
                    setOpen={setOpenDetailsModal}
                    size="xs"
                    bodyheight="30vh"
                    steps={[{ title: detailsType === 'product' ? 'Product Details' : 'Warehouse Details', icon: <FontAwesomeIcon icon={faWarehouse} /> }]}
                    content={
                        <>
                            {detailsType === 'product' && selectedItem && (
                                <div>
                                            <InfoCardList
                                                list={[selectedItem]}
                                                fields={[
                                                    'name',
                                                    'code',
                                                    'typeLkey',
                                                    'barecode',
                                                    'inventoryTypeLkey',
                                                ]}
                                                titleField="name"
                                                fieldLabels={{
                                                    name: 'Product Name',
                                                    code: 'Code',
                                                    typeLkey: 'Type',
                                                    barecode: 'Barcode',
                                                    inventoryTypeLkey: 'Inventory Type',
                                                }}
                                             
                                            />
                                    {/* <p><b>Code:</b> {selectedItem.code}</p>
                                    <p><b>Name:</b> {selectedItem.name}</p>
                                    <p><b>Description:</b> {selectedItem.barcode}</p> */}

                                </div>
                            )}

                            {detailsType === 'warehouse' && selectedItem && (
                                <div>
                                       <InfoCardList
                                                list={[selectedItem]}
                                                fields={[
                                                    'warehouseId',
                                                    'warehouseName',
                                                    'location',
                                                    'Capacity',
                                                    'departmenKey',
                                                ]}
                                                titleField="warehouseName"
                                                fieldLabels={{
                                                    warehouseName: 'Warehouse Name',
                                                    warehouseId: 'Code',
                                                    location: 'Location',
                                                    Capacity: 'Capacity',
                                                    departmenKey: 'Department',
                                                }}
                                             
                                            />

                                </div>
                            )}
                        </>

                    }
                ></MyModal>
            </div>
        );
    }
    const actionsForItems = rowData => {
        const handleViewTransactions = () => {
            console.log('View transactions for:', rowData.name);
            // TODO: Implement view transactions logic
        };


        return (
            <div className="container-of-actions">
                <FontAwesomeIcon
                    icon={faEdit}
                    title="Edit Transaction"
                    className="action-icon"
                    onClick={() => {
                        setOpen(true);
                        setInventoryTransaction(rowData?.transactionObj);
                    }}
                />
            </div>
        );
    };


    const columns = [
        {
            key: 'index', title: '#',
            render: (rowData, rowIndex) => {
                const page = transactionProductListRequest.pageNumber; // your current page (1-based)
                const pageSize = transactionProductListRequest.pageSize; // number of rows per page
                return (page - 1) * pageSize + (rowIndex + 1);
            }
        },
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
                <span
                    className="table-link"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(rowData.warehouseObj);
                        setDetailsType('warehouse');
                        setOpenDetailsModal(true);
                     
                    }}
                >
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
                <span
                    className="table-link"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(rowData.productObj);
                        setDetailsType('product');
                        setOpenDetailsModal(true);
                      
                    }}
                >
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
            key: 'totalCost',
            title: 'Total cost',
            flexGrow: 4,
            render: rowData => (
                <span>
                    {calculateCost(rowData.newQuentity, rowData.newCost).toFixed(2)}

                </span>
            )
        },
        {
            key: 'oldAvgCost',
            title: 'Avg cost Befor',
            dataKey: 'oldAvgCost'
        },
        {
            key: 'newAvgCost',
            title: 'Avg cost After',
            dataKey: 'newAvgCost'
        },
        { key: 'notes', title: 'Note', dataKey: 'notes' },
        {
            key: 'statusLkey',
            title: <Translate>Status</Translate>,
            width: 100,
            render: rowData => {
                const status = rowData?.statusLkey || '164797574082125';

                const getStatusConfig = status => {
                    switch (status) {
                        case '164797574082125':
                            return {
                                backgroundColor: 'var(--light-green)',
                                color: 'var(--primary-green)',
                                contant: 'New'
                            };
                        case '5959341154465084': //Requested
                            return {
                                backgroundColor: 'var(--light-blue)',
                                color: 'var(--primary-blue)',
                                contant: 'Requested'
                            };
                        case '1804482322306061':
                            return {
                                backgroundColor: 'var(--light-orange)',
                                color: 'var(--primary-orange)',
                                contant: 'Submitted'
                            };
                        // case 'Out of Stock':
                        //   return {
                        //     backgroundColor: 'var(--light-red)',
                        //     color: 'var(--primary-red)',
                        //     contant: 'Out of Stock'
                        //   };
                        // case 'Reserved':
                        //   return {
                        //     backgroundColor: 'var(--light-purple)',
                        //     color: 'var(--primary-purple)',
                        //     contant: 'Reserved'
                        //   };
                        default:
                            return {
                                backgroundColor: 'var(--background-gray)',
                                color: 'var(--primary-gray)',
                                contant: 'Unknown'
                            };
                    }
                };

                const config = getStatusConfig(status);
                return (
                    <MyBadgeStatus
                        backgroundColor={config.backgroundColor}
                        color={config.color}
                        contant={config.contant}
                    />
                );
            }
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
            key: 'actions',
            title: <Translate>Actions</Translate>,
            width: 120,
            render: rowData => actionsForItems(rowData)
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
                searchTrans.inventoryTransKey && {
                    fieldName: 'inventory_trans_key',
                    operator: 'match',
                    value:  searchTrans.inventoryTransKey ,
                },
            ].filter(Boolean),
        }));
    }, [ searchTrans.inventoryTransKey]);
    useEffect(() => {
        handleManualSearch();
    }, [dateFilter]);

    const divContent = (
            "Inventory Transaction"
    );
    // page header setup
    dispatch(setPageCode('Inventory_Transaction'));
    dispatch(setDivContent(divContent));

    const tablebuttons = (<div className='bt-right-group'>
                    <div className='btns-group'>
                        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faPlus} />} onClick={() => { setOpen(true), setInventoryTransaction({ ...newApInventoryTransaction }) }}>Add Transaction</MyButton>
                        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faFileExport} />} >Export to Xsl</MyButton>
                    </div>
                </div>);

const filters = (<>
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
                        record={searchTrans}
                        setRecord={setSearchTrans}
                    />
                    <MyInput
                        column
                        fieldLabel="Product Type"
                        fieldType="select"
                        fieldName="productTypeLkey"
                        selectData={[]}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={searchTrans}
                        setRecord={setSearchTrans}
                    />
                    <MyInput
                        column
                        fieldLabel="code"
                        fieldName="transactionId"
                        record={searchTrans}
                        setRecord={setSearchTrans}
                    />
                    <MyInput
                        column
                        fieldLabel="Transaction Type"
                        fieldType="select"
                        fieldName="documentTypeLkey"
                        selectData={[]}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={searchTrans}
                        setRecord={setSearchTrans}
                    />
                    <MyInput
                        column
                        fieldLabel="Warehouse Name"
                        fieldType="select"
                        fieldName="warehouseLkey"
                        selectData={[]}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={searchTrans}
                        setRecord={setSearchTrans}
                    />
                </Form>
                          <AdvancedSearchFilters searchFilter={true}/>

            </>);

    return (
        <div className='container-div'>
            
            <MyTable
                data={inventoryTransProductListResponse?.object ?? []}
                columns={columns}
                height={1000}
                loading={isLoading || isFetching}
                filters={filters}
                tableButtons={tablebuttons}
                page={pageIndex}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />
            <AddEditTransaction open={open} setOpen={setOpen} transaction={inventoryTransaction} setTransaction={setInventoryTransaction} refetch={refetchTransProduct} refetchAttachmentList={refetchTransAttachment} />
             {dataDetails()}
             
        </div>

    );
};

export default InventoryTransaction;                        