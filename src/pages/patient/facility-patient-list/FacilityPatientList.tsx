import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { ApPatient, ApPatientInsurance } from '@/types/model-types';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyTable from '@/components/MyTable';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetDepartmentsQuery } from '@/services/setupService';
import { useGetRoomListQuery } from '@/services/setupService';
import { useGetPractitionersQuery } from '@/services/setupService';
import { useGetBedListQuery } from '@/services/setupService';
import { addFilterToListRequest } from '@/utils';
import './styles.less';
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
  const [insurancePatient, setInsurancePatient] = useState<ApPatientInsurance>({
    ...newApPatientInsurance
  });
  const [dateFilter, setDateFilter] = useState({ fromDate: '', toDate: '' });
  // Initialize list request with default filters
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: []
  });
  const [bedListRequest, setBedListRequest] = useState<ListRequest>({ ...initialListRequest });
  // Fetch LOV data for various fields
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  const { data: documentTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
  const { data: primaryInsuranceProviderLovQueryResponse } =
    useGetLovValuesByCodeQuery('INS_PROVIDER');
  const { data: encounterTypeLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_TYPE');
  const { data: departmentsResponse } = useGetDepartmentsQuery(initialListRequest);
  const { data: roomListResponseLoading } = useGetRoomListQuery(listRequest);
  const { data: bedListResponse } = useGetBedListQuery(bedListRequest);
  const { data: bedStatusLovQueryResponse } = useGetLovValuesByCodeQuery('BED_STATUS');
  const { data: practitionerListResponse } = useGetPractitionersQuery(initialListRequest);

  const [searchPatient, setSearchPatient] = useState<ApPatient>({
    ...newApPatient,
    encounterTypeLkey: '',
    bedStatusLkey: ''
  });
  const [selectedDepartments, setSelectedDepartments] = useState<any[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<any[]>([]);
  const [selectedBeds, setSelectedBeds] = useState<any[]>([]);
  const [responsiblePhysicians, setResponsiblePhysicians] = useState<any[]>([]);

  const dummyRow = {
    created_at: '2025-08-18',
    patientMrn: 'MRN123456',
    fullName: 'John Doe',
    genderLkey: 'M',
    genderLvalue: { lovDisplayVale: 'Male' },
    dob: '1990-01-01',
    documentTypeLkey: 'PASSPORT',
    documentTypeLvalue: { lovDisplayVale: 'Passport' },
    documentNo: 'P123456789',
    phone: '+1234567890',
    insurance: 'ACME Health',
    plan: 'Premium'
  };

  // table columns
  const columns = [
    { key: 'index', title: '#', render: (rowData, rowIndex) => rowIndex + 1 },
    { key: 'created_at', title: 'REGISTRATION DATE', dataKey: 'created_at' },
    { key: 'patientMrn', title: 'MRN', dataKey: 'patientMrn' },
    { key: 'fullName', title: 'FULL NAME', dataKey: 'fullName' },
    {
      key: 'gender',
      title: 'SEX AT BIRTH',
      render: rowData =>
        rowData.genderLvalue ? rowData.genderLvalue.lovDisplayVale : rowData.genderLkey
    },
    { key: 'dob', title: 'DOB', dataKey: 'dob' },
    {
      key: 'documentType',
      title: 'DOCUMENT TYPE',
      render: rowData =>
        rowData.documentTypeLvalue
          ? rowData.documentTypeLvalue.lovDisplayVale
          : rowData.documentTypeLkey
    },
    { key: 'documentNo', title: 'DOCUMENT NUMBER', dataKey: 'documentNo' },
    { key: 'phone', title: 'PRIMARY PHONE NUMBER', dataKey: 'phone' },
    { key: 'insurance', title: 'PRIMARY INSURANCE PROVIDER', dataKey: 'insurance' },
    { key: 'plan', title: 'PLAN', dataKey: 'plan' }
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
      setListRequest(addFilterToListRequest('created_at', 'gte', formattedFromDate, listRequest));
    } else if (dateFilter.toDate) {
      const formattedToDate = dateFilter.toDate;
      setListRequest(addFilterToListRequest('created_at', 'lte', formattedToDate, listRequest));
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };
  // handle search of dob
  const handleDOFSearch = () => {
    const dob = searchPatient?.dob;
    if (dob) {
      setListRequest(addFilterToListRequest('dob', 'match', dob, listRequest));
    }
  };

  // Effects
  useEffect(() => {
    handleManualSearch();
  }, []);
  useEffect(() => {
    setListRequest(prevState => ({
      ...prevState,
      filters: [
        ...prevState.filters.filter(
          filter =>
            !['gender_lkey', 'document_type_lkey', 'insurance_provider_lkey'].includes(
              filter.fieldName
            )
        ),
        searchPatient.genderLkey && {
          fieldName: 'gender_lkey',
          operator: 'match',
          value: searchPatient.genderLkey
        },

        searchPatient.documentTypeLkey && {
          fieldName: 'document_type_lkey',
          operator: 'match',
          value: searchPatient.documentTypeLkey
        },
        insurancePatient.insuranceProviderLkey && {
          fieldName: 'insurance_provider_lkey',
          operator: 'match',
          value: insurancePatient.insuranceProviderLkey
        }
      ].filter(Boolean)
    }));
  }, [
    searchPatient.genderLkey,
    searchPatient.documentTypeLkey,
    insurancePatient.insuranceProviderLkey
  ]);
  useEffect(() => {
    handleManualSearch();
  }, [dateFilter]);
  useEffect(() => {
    handleDOFSearch();
  }, [searchPatient?.dob]);

  const dispatch = useDispatch();
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Information Desk</h5>
    </div>
  );
  // page header setup
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('P_Facility'));
  dispatch(setDivContent(divContentHTML));
  return (
    <div className="container-div">
      <div className="field-btn-div">
        <Form layout="inline" fluid>
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
            searchable={false}
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
            searchable={false}
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
            searchable={false}
          />
          <MyInput
            column
            fieldLabel="Select Department"
            fieldType="checkPicker"
            selectData={departmentsResponse?.object ?? []}
            selectDataLabel="name"
            selectDataValue="key"
            fieldName="selectedDepartments"
            record={{ selectedDepartments }}
            setRecord={value => setSelectedDepartments(value.selectedDepartments)}
            searchable={false}
          />
          <MyInput
            column
            fieldLabel="Encounter Type"
            fieldType="select"
            fieldName="encounterTypeLkey"
            selectData={encounterTypeLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={searchPatient}
            setRecord={setSearchPatient}
            searchable={false}
          />
          <MyInput
            column
            fieldLabel="Select Room"
            fieldType="checkPicker"
            fieldName="selectedRooms"
            selectData={roomListResponseLoading?.object ?? []}
            selectDataLabel="name"
            selectDataValue="key"
            record={{ selectedRooms }}
            setRecord={val => setSelectedRooms(val.selectedRooms)}
            searchable={false}
          />

          <MyInput
            column
            fieldLabel="Select Bed"
            fieldType="checkPicker"
            fieldName="selectedBeds"
            selectData={bedListResponse?.object ?? []}
            selectDataLabel="name"
            selectDataValue="key"
            record={{ selectedBeds }}
            setRecord={val => setSelectedBeds(val.selectedBeds)}
            searchable={false}
          />

          <MyInput
            column
            fieldLabel="Bed Status"
            fieldType="select"
            fieldName="bedStatusLkey"
            selectData={bedStatusLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={searchPatient}
            setRecord={setSearchPatient}
            searchable={false}
          />
          <MyInput
            column
            fieldLabel="Responsible Physician"
            fieldType="checkPicker"
            fieldName="responsiblePhysicians"
            selectData={practitionerListResponse?.object ?? []}
            selectDataLabel="practitionerFullName"
            selectDataValue="key"
            record={{ responsiblePhysicians }}
            setRecord={val => setResponsiblePhysicians(val.responsiblePhysicians)}
            searchable={false}
          />
        </Form>
        <div className="bt-right-group">
          <div className="btns-group">
            <MyButton prefixIcon={() => <FontAwesomeIcon icon={faMagnifyingGlass} />}></MyButton>
            <MyButton prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}>Clear</MyButton>
            <MyButton prefixIcon={() => <FontAwesomeIcon icon={faFileCsv} />}>
              Export to Xsl
            </MyButton>
          </div>
        </div>
      </div>
      <MyTable data={[dummyRow]} columns={columns} height={800} loading={false} />
    </div>
  );
};

export default FacilityPatientList;
