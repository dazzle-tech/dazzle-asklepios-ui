import React, { useEffect, useState } from 'react';
import {Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { ApPatient, ApPatientInsurance } from '@/types/model-types';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyTable from '@/components/MyTable';
import { initialListRequest, ListRequest } from '@/types/types';
import { addFilterToListRequest } from '@/utils';
import './styles.less'
import { newApPatient, newApPatientInsurance } from '@/types/model-types-constructor';
import { useDispatch } from 'react-redux';
import { faFileExport, faMagnifyingGlass, faPlus } from '@fortawesome/free-solid-svg-icons';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import { faFileCsv } from '@fortawesome/free-solid-svg-icons';
import ReactDOMServer from 'react-dom/server';
import MyButton from '@/components/MyButton/MyButton';
import { da } from 'date-fns/locale';
const InventoryTransaction = () => {
    const [searchPatient, setSearchPatient] = useState<ApPatient>({ ...newApPatient });
    const [insurancePatient, setInsurancePatient] = useState<ApPatientInsurance>({ ...newApPatientInsurance });
    const [dateFilter, setDateFilter] = useState({ fromDate: '', toDate: '' });
    // Fetch LOV data for various fields
    const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
    const { data: documentTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
    const { data: primaryInsuranceProviderLovQueryResponse } = useGetLovValuesByCodeQuery('INS_PROVIDER');
    // Initialize list request with default filters
    const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest, filters: [] });
    // table columns
    const columns = [
        { key: 'index', title: '#', render: (rowData, rowIndex) => rowIndex + 1 },
        { key: 'transactionId', title: 'TRANSACTION ID', dataKey: 'transactionId' },
        { key: 'transactionType', title: 'Transaction Type', dataKey: 'transactionType' },
        { key: 'Performed', title: 'Performed By/At', dataKey: 'Performed By/At' },
        { key: 'Warehouse', title: 'Warehouse', dataKey: 'Warehouse' },
        { key: 'ProductCode', title: 'Product Code', dataKey: 'ProductCode' },
        { key: 'ProductName', title: 'PRODUCT NAME', render: rowData => rowData.productNameLvalue ? rowData.productNameLvalue.lovDisplayVale : rowData.productNameLkey },
        { key: 'Quantity', title: 'QUANTITY', dataKey: 'Quantity' },
        { key: 'Base UOM', title: 'BASE UOM', dataKey: 'baseUom' },
        { key: 'Lot/Serial', title: 'LOT/SERIAL', dataKey: 'lotSerial' },
        { key: 'ExpiryDate', title: 'EXPIRY DATE', dataKey: 'expiryDate' },
        { key: 'CostperUnit', title: 'COST PER UNIT', dataKey: 'costPerUnit' },
        { key: 'TotalCost', title: 'TOTAL COST', dataKey: 'totalCost' },
        { key: 'AverageCostAfter', title: 'Average Cost After', dataKey: 'AverageCostAfter' },
        { key: 'Notes', title: 'Notes', dataKey: 'notes' },
        { key: 'LinkedDocument', title: 'Linked Document', render: () => <span>Actions</span> }
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
                        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faPlus} />} >Add Transaction</MyButton>
                        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faFileExport} />} >Export to Xsl</MyButton>
                    </div>
                </div>
            </div>
            <MyTable
                data={[]}
                columns={columns}
                height={800}
                loading={false}
            />
        </div>
    );
};

export default InventoryTransaction;
