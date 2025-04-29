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
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import { faFileCsv } from '@fortawesome/free-solid-svg-icons';
import ReactDOMServer from 'react-dom/server';
import MyButton from '@/components/MyButton/MyButton';
const FacilityPatientList = () => {
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
        { key: 'created_at', title: 'REGISTRATION DATE', dataKey: 'created_at' },
        { key: 'patientMrn', title: 'MRN', dataKey: 'patientMrn' },
        { key: 'fullName', title: 'FULL NAME', dataKey: 'fullName' },
        { key: 'gender', title: 'SEX AT BIRTH', render: rowData => rowData.genderLvalue ? rowData.genderLvalue.lovDisplayVale : rowData.genderLkey },
        { key: 'dob', title: 'DOB', dataKey: 'dob' },
        { key: 'documentType', title: 'DOCUMENT TYPE', render: rowData => rowData.documentTypeLvalue ? rowData.documentTypeLvalue.lovDisplayVale : rowData.documentTypeLkey },
        { key: 'documentNo', title: 'DOCUMENT NUMBER', dataKey: 'documentNo' },
        { key: 'phone', title: 'PRIMARY PHONE NUMBER', dataKey: 'phone' },
        { key: 'insurance', title: 'PRIMARY INSURANCE PROVIDER', dataKey: 'insurance' },
        { key: 'plan', title: 'PLAN', dataKey: 'plan' },
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
            <h5>Facility Patients List</h5>
        </div>
    );
    // page header setup
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('P_Facility'));
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
                        fieldLabel="Date of Birth"
                        fieldType="date"
                        fieldName="dob"
                        record={searchPatient}
                        setRecord={setSearchPatient}
                    />
                    <MyInput
                        column
                        fieldLabel="Sex at Birth"
                        fieldType="select"
                        fieldName="genderLkey"
                        selectData={genderLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={searchPatient}
                        setRecord={setSearchPatient}
                    />
                    <MyInput
                        column
                        fieldLabel="Document Type"
                        fieldType="select"
                        fieldName="documentTypeLkey"
                        selectData={documentTypeLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={searchPatient}
                        setRecord={setSearchPatient}
                    />
                    <MyInput
                        column
                        fieldLabel="Primary Insurance Provider"
                        fieldType="select"
                        fieldName="insuranceProviderLkey"
                        selectData={primaryInsuranceProviderLovQueryResponse?.object ?? []}
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
                        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faFileCsv} />} >Export to Xsl</MyButton>
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

export default FacilityPatientList;
