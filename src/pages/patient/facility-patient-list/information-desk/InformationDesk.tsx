import { faAddressCard, faFileCsv, faPrint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Form } from 'rsuite';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import SearchPatientCriteria from '@/components/SearchPatientCriteria';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import {
  useGetBedListQuery,
  useGetDepartmentsQuery,
  useGetLovValuesByCodeQuery,
  useGetPractitionersQuery,
  useGetRoomListQuery
} from '@/services/setupService';
import { ApPatient, ApPatientInsurance } from '@/types/model-types';
import { newApPatient, newApPatientInsurance } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { addFilterToListRequest } from '@/utils';
import '../styles.less';
import CompanionCardModal from './CompanionCardModal';

const InformationDesk: React.FC = () => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  const [insurancePatient, setInsurancePatient] = useState<ApPatientInsurance>({
    ...newApPatientInsurance
  });
  const [dateFilter, setDateFilter] = useState<{ fromDate: string | Date; toDate: string | Date }>({
    fromDate: '',
    toDate: ''
  });

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: []
  });
  const [bedListRequest, setBedListRequest] = useState<ListRequest>({ ...initialListRequest });

  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');

  const { data: encounterTypeLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_TYPE');
  const { data: departmentsResponse } = useGetDepartmentsQuery(initialListRequest);
  const { data: roomListResponseLoading } = useGetRoomListQuery(listRequest);
  const { data: bedListResponse } = useGetBedListQuery(bedListRequest);
  const { data: bedStatusLovQueryResponse } = useGetLovValuesByCodeQuery('BED_STATUS');
  const { data: practitionerListResponse } = useGetPractitionersQuery(initialListRequest);

  const [record, setRecord] = useState<any>({});

  const [searchPatient, setSearchPatient] = useState<ApPatient>({
    ...newApPatient,
    encounterTypeLkey: '',
    bedStatusLkey: ''
  });

  const [selectedDepartments, setSelectedDepartments] = useState<any[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<any[]>([]);
  const [selectedBeds, setSelectedBeds] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [responsiblePhysicians, setResponsiblePhysicians] = useState<any[]>([]);

  const [sortColumn, setSortColumn] = useState<string>('fullName');
  type SortType = 'asc' | 'desc';
  const [sortType, setSortType] = useState<SortType>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Header (moved to useEffect)
  useEffect(() => {
    const divContent = (
      <div style={{ display: 'flex' }}>
        <h5>Information Desk</h5>
      </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('P_Facility'));
    dispatch(setDivContent(divContentHTML));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch, pathname]);

  const companionDummyRow: any = {
    companioncard: 'test',
    fullName: 'Jane Smith',
    patientMrn: '1005',
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
    encounterStatusLvalue: { lovDisplayVale: 'Ongoing' },
    picture: 'https://randomuser.me/api/portraits/men/32.jpg',
    companionname: 'Ahmad Al-Kareem',
    relationwithpatient: 'Brother',
    patientname: 'Yousef Al-Mansour',
    ward: 'Internal Medicine - Ward B',
    admissiondate: '2025-08-25'
  };

  const columns = [
    {
      key: 'companioncard',
      title: 'Companion Card',
      dataKey: 'companioncard',
      align: 'center' as const,
      render: (rowData: any) => (
        <div className="actions-icons">
          <FontAwesomeIcon
            icon={faAddressCard}
            title="Open Companion Card"
            className="action-icon start-icon"
            onClick={() => {
              setSelectedRow(rowData);
              setOpen(true);
            }}
          />
        </div>
      )
    },
    { key: 'fullName', title: 'Patient Name', dataKey: 'fullName' },
    { key: 'patientMrn', title: 'MRN', dataKey: 'patientMrn' },
    {
      key: 'visitType',
      title: 'Visit Type',
      render: (rowData: any) =>
        rowData.visitTypeLvalue ? rowData.visitTypeLvalue.lovDisplayVale : rowData.visitTypeLkey
    },
    { key: 'visitId', title: 'Visit ID', dataKey: 'visitId' },
    { key: 'departmentName', title: 'Department Name', dataKey: 'departmentName' },
    { key: 'room', title: 'Room', dataKey: 'room' },
    { key: 'location', title: 'Location', dataKey: 'location' },
    { key: 'bed', title: 'Bed', dataKey: 'bed' },
    {
      key: 'gender',
      title: 'Sex at Birth',
      render: (rowData: any) =>
        rowData.genderLvalue ? rowData.genderLvalue.lovDisplayVale : rowData.genderLkey
    },
    {
      key: 'responsiblePhysician',
      title: 'Responsible Physician',
      render: (rowData: any) =>
        rowData.responsiblePhysician?.fullName || rowData.responsiblePhysicianId || '-'
    },
    {
      key: 'daysOfStaying',
      title: 'Days of Staying',
      render: (rowData: any) => (rowData.daysOfStaying !== undefined ? rowData.daysOfStaying : '-')
    },
    {
      key: 'encounterStatus',
      title: 'Encounter Status',
      render: (rowData: any) =>
        rowData.encounterStatusLvalue
          ? rowData.encounterStatusLvalue.lovDisplayVale
          : rowData.encounterStatusLkey
    }
  ];

  const handleManualSearch = () => {
    if (dateFilter.fromDate && dateFilter.toDate) {
      const formattedFromDate = dateFilter.fromDate as any;
      const formattedToDate = dateFilter.toDate as any;
      setListRequest(
        addFilterToListRequest(
          'created_at',
          'between',
          `${formattedFromDate}_${formattedToDate}`,
          listRequest
        )
      );
    } else if (dateFilter.fromDate) {
      const formattedFromDate = dateFilter.fromDate as any;
      setListRequest(addFilterToListRequest('created_at', 'gte', formattedFromDate, listRequest));
    } else if (dateFilter.toDate) {
      const formattedToDate = dateFilter.toDate as any;
      setListRequest(addFilterToListRequest('created_at', 'lte', formattedToDate, listRequest));
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };

  const handleDOFSearch = () => {
    const dob = (searchPatient as any)?.dob;
    if (dob) {
      setListRequest(addFilterToListRequest('dob', 'match', dob as any, listRequest));
    }
  };

  useEffect(() => {
    handleManualSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setListRequest(prevState => ({
      ...prevState,
      filters: [
        ...prevState.filters.filter(
          f =>
            !['gender_lkey', 'document_type_lkey', 'insurance_provider_lkey'].includes(f.fieldName)
        ),
        searchPatient.genderLkey && {
          fieldName: 'gender_lkey',
          operator: 'match' as const,
          value: searchPatient.genderLkey
        },
        searchPatient.documentTypeLkey && {
          fieldName: 'document_type_lkey',
          operator: 'match' as const,
          value: searchPatient.documentTypeLkey
        },
        insurancePatient.insuranceProviderLkey && {
          fieldName: 'insurance_provider_lkey',
          operator: 'match' as const,
          value: insurancePatient.insuranceProviderLkey
        }
      ].filter(Boolean) as any
    }));
  }, [
    searchPatient.genderLkey,
    searchPatient.documentTypeLkey,
    insurancePatient.insuranceProviderLkey
  ]);

  useEffect(() => {
    handleManualSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  useEffect(() => {
    handleDOFSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(searchPatient as any)?.dob]);

  const sortedData = [...[companionDummyRow]].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    if (aVal === bVal) return 0;
    return sortType === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
  });

  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const content = (
    <div className="advanced-filters">
      <Form fluid className="dissss">
        <MyInput
          fieldLabel="Date of Birth"
          fieldType="date"
          fieldName="dob"
          record={searchPatient}
          setRecord={setSearchPatient}
        />
        <MyInput
          fieldLabel="Select Department"
          fieldType="checkPicker"
          selectData={departmentsResponse?.object ?? []}
          selectDataLabel="name"
          selectDataValue="key"
          placeholder=" "
          fieldName="selectedDepartments"
          record={{ selectedDepartments }}
          setRecord={value => setSelectedDepartments(value.selectedDepartments)}
          searchable={false}
        />
        <MyInput
          fieldLabel="Encounter Type"
          fieldType="select"
          fieldName="encounterTypeLkey"
          selectData={encounterTypeLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={searchPatient}
          setRecord={setSearchPatient}
          searchable={false}
          placeholder=" "
        />
        <MyInput
          fieldLabel="Select Room"
          fieldType="checkPicker"
          fieldName="selectedRooms"
          selectData={roomListResponseLoading?.object ?? []}
          selectDataLabel="name"
          selectDataValue="key"
          record={{ selectedRooms }}
          setRecord={val => setSelectedRooms(val.selectedRooms)}
          searchable={false}
          placeholder=" "
        />
        <MyInput
          fieldLabel="Select Bed"
          fieldType="checkPicker"
          fieldName="selectedBeds"
          selectData={bedListResponse?.object ?? []}
          selectDataLabel="name"
          selectDataValue="key"
          record={{ selectedBeds }}
          setRecord={val => setSelectedBeds(val.selectedBeds)}
          searchable={false}
          placeholder=" "
        />
        <MyInput
          fieldLabel="Bed Status"
          fieldType="select"
          fieldName="bedStatusLkey"
          selectData={bedStatusLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={searchPatient}
          setRecord={setSearchPatient}
          searchable={false}
          placeholder=" "
        />
        <MyInput
          fieldLabel="Responsible Physician"
          fieldType="checkPicker"
          fieldName="responsiblePhysicians"
          selectData={practitionerListResponse?.object ?? []}
          selectDataLabel="practitionerFullName"
          selectDataValue="key"
          record={{ responsiblePhysicians }}
          setRecord={val => setResponsiblePhysicians(val.responsiblePhysicians)}
          searchable={false}
          placeholder=" "
        />
      </Form>
    </div>
  );

  const tablefilters = (
    <>
      <div className="field-btn-div">
        <Form layout="inline" fluid>
          <div className="information-desk-filters-handle-position-row">
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
              fieldLabel="Sex at Birth"
              fieldType="select"
              fieldName="genderLkey"
              selectData={genderLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={searchPatient}
              placeholder=" "
              setRecord={setSearchPatient}
              searchable={false}
            />
            <SearchPatientCriteria record={record} setRecord={setRecord} />
          </div>
        </Form>
      </div>

      <AdvancedSearchFilters searchFilter={false} content={content} />
    </>
  );

  return (
    <div className="container-div">
      <MyTable
        data={paginatedData}
        columns={columns}
        height={800}
        loading={false}
        sortColumn={sortColumn}
        sortType={sortType}
        filters={tablefilters}
        tableButtons={
          <div className="btns-group">
            <MyButton prefixIcon={() => <FontAwesomeIcon icon={faFileCsv} />}>
              Export to Xsl
            </MyButton>
            <MyButton prefixIcon={() => <FontAwesomeIcon icon={faPrint} />}>Print Card</MyButton>
          </div>
        }
        onSortChange={(col, type) => {
          setSortColumn(col);
          setSortType(type as SortType);
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

      <MyModal
        open={open}
        setOpen={setOpen}
        title="Companion Card"
        actionButtonFunction={() => {}}
        position="left"
        size="25vw"
        steps={[
          {
            title: 'Companion Card',
            icon: <FontAwesomeIcon icon={faAddressCard} />,
            footer: (
              <MyButton appearance="ghost">
                <FontAwesomeIcon icon={faPrint} />
                &nbsp;Print
              </MyButton>
            )
          }
        ]}
        content={<CompanionCardModal record={selectedRow} />}
      />
    </div>
  );
};

export default InformationDesk;
