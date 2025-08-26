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
import '../styles.less';
import { newApPatient, newApPatientInsurance } from '@/types/model-types-constructor';
import { useDispatch } from 'react-redux';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import { faFileCsv,faPrint } from '@fortawesome/free-solid-svg-icons';
import ReactDOMServer from 'react-dom/server';
import MyButton from '@/components/MyButton/MyButton';

const InformationDesk = () => {
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
  const [sortColumn, setSortColumn] = useState('fullName');
  type SortType = 'asc' | 'desc';
  const [sortType, setSortType] = useState<SortType>('asc');
const [page, setPage] = useState(0);
const [rowsPerPage, setRowsPerPage] = useState(10);

const companionDummyRow = {
  companioncard:'test',
  fullName: 'Jane Smith',
  patientMrn: 'MRN987654',
  visitTypeLkey: 'INPATIENT',
  visitTypeLvalue: { lovDisplayVale: 'Inpatient' },
  visitId: 'VIS123456',
  departmentName: 'Cardiology',
  room: '302B',
  location: 'Building A - 3rd Floor',
  bed: 'B12',
  genderLkey: 'F',
  genderLvalue: { lovDisplayVale: 'Female' },
  responsiblePhysicianId: 'PHY001',
  responsiblePhysician: { fullName: 'Dr. Adam Johnson' },
  daysOfStaying: 5,
  encounterStatusLkey: 'ONGOING',
  encounterStatusLvalue: { lovDisplayVale: 'Ongoing' }
};


  // table columns
const columns = [
  { key: 'companioncard', title: 'Companion Card', dataKey: 'companioncard' },

  { key: 'fullName', title: 'Patient Name', dataKey: 'fullName' },
  { key: 'patientMrn', title: 'MRN', dataKey: 'patientMrn' },

  {
    key: 'visitType',
    title: 'Visit Type',
    render: rowData =>
      rowData.visitTypeLvalue
        ? rowData.visitTypeLvalue.lovDisplayVale
        : rowData.visitTypeLkey
  },

  { key: 'visitId', title: 'Visit ID', dataKey: 'visitId' },
  { key: 'departmentName', title: 'Department Name', dataKey: 'departmentName' },
  { key: 'room', title: 'Room', dataKey: 'room' },
  { key: 'location', title: 'Location', dataKey: 'location' },
  { key: 'bed', title: 'Bed', dataKey: 'bed' },

  {
    key: 'gender',
    title: 'Sex at Birth',
    render: rowData =>
      rowData.genderLvalue
        ? rowData.genderLvalue.lovDisplayVale
        : rowData.genderLkey
  },

  {
    key: 'responsiblePhysician',
    title: 'Responsible Physician',
    render: rowData =>
      rowData.responsiblePhysician?.fullName || rowData.responsiblePhysicianId || '-'
  },

  {
    key: 'daysOfStaying',
    title: 'Days of Staying',
    render: rowData =>
      rowData.daysOfStaying !== undefined ? rowData.daysOfStaying : '-'
  },

  {
    key: 'encounterStatus',
    title: 'Encounter Status',
    render: rowData =>
      rowData.encounterStatusLvalue
        ? rowData.encounterStatusLvalue.lovDisplayVale
        : rowData.encounterStatusLkey
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

const sortedData = [...[companionDummyRow]].sort((a, b) => {
  const aVal = a[sortColumn];
  const bVal = b[sortColumn];
  if (aVal === bVal) return 0;
  return sortType === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
});
const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);


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
            <MyButton prefixIcon={() => <FontAwesomeIcon icon={faPrint} />}>
              Print Card
            </MyButton>
          </div>
        </div>
      </div>
<MyTable
  data={paginatedData}
  columns={columns}
  height={800}
  loading={false}
  sortColumn={sortColumn}
  sortType={sortType}
  onSortChange={(col, type) => {
    setSortColumn(col);
    setSortType(type);
  }}
  page={page}
  rowsPerPage={rowsPerPage}
  totalCount={sortedData.length}
  onPageChange={(_, newPage) => setPage(newPage)}
  onRowsPerPageChange={e => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  }}
/>

    </div>
  );
};

export default InformationDesk;
