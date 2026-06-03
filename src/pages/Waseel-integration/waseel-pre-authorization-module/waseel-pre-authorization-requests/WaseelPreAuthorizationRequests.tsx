import React, { useMemo, useState } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileExcel,
  faFilePdf
} from '@fortawesome/free-solid-svg-icons';
import { Tooltip, Whisper } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import './styles.less';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { MdOutlineRemoveRedEye } from 'react-icons/md';
import { FaEye, FaRotate } from 'react-icons/fa6';
import PreviewWaseelPreAuthorizationRequests from './PreviewWaseelPreAuthorizationRequests';
import { FaPrint } from 'react-icons/fa';

type StatusType = 'APPROVED' | 'REJECTED' | 'PENDING' | 'PARTIAL';

type PreAuthRecord = {
  id: number;
  preAuthRefNo: string;
  encounterNo: string;
  mrn: string;
  patientName: string;
  insuranceCompany: string;
  memberId: string;
  diagnosisCode: string;
  procedureCode: string;
  requestedAmount: number;
  approvedAmount: number;
  status: StatusType;
  approvalNumber: string;
  requestDate: string;
  responseDate: string;
  requestedBy: string;
  doctorName: string;
  rejectionReason?: string;
  validUntil?: string;
};

type Filters = {
  preAuthId: string;
  approvalNumber: string;
  encounterNo: string;
  mrn: string;
  patientName: string;
  insuranceCompany: string | null;
  memberId: string;
  status: StatusType | null;
  doctorName: string | null;
  requestDateFrom: string | null;
  requestDateTo: string | null;
  validUntil: string | null;
  requestedBy: string;
};

const initialFilters: Filters = {
  preAuthId: '',
  approvalNumber: '',
  encounterNo: '',
  mrn: '',
  patientName: '',
  insuranceCompany: null,
  memberId: '',
  status: null,
  doctorName: null,
  requestDateFrom: null,
  requestDateTo: null,
  validUntil: null,
  requestedBy: ''
};

const insuranceOptions = [
  { label: 'MedNet', value: 'MedNet' },
  { label: 'NextCare', value: 'NextCare' },
  { label: 'GlobeMed', value: 'GlobeMed' }
];

const statusOptions = [
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Partial', value: 'PARTIAL' }
];

const doctorOptions = [
  { label: 'Dr. Ahmad', value: 'Dr. Ahmad' },
  { label: 'Dr. Khaled', value: 'Dr. Khaled' },
  { label: 'Dr. Sami', value: 'Dr. Sami' }
];

const mockData: PreAuthRecord[] = [
  {
    id: 1001,
    preAuthRefNo: 'INS-PA-55421',
    encounterNo: 'ENC-44521',
    mrn: 'MRN-00125',
    patientName: 'John Smith',
    insuranceCompany: 'MedNet',
    memberId: 'MEM-55211',
    diagnosisCode: 'I10',
    procedureCode: 'PROC-001',
    requestedAmount: 1200,
    approvedAmount: 1000,
    status: 'PARTIAL',
    approvalNumber: 'APR-2211',
    requestDate: '2026-05-20 10:30',
    responseDate: '2026-05-20 13:15',
    requestedBy: 'admin',
    doctorName: 'Dr. Ahmad',
    rejectionReason: '',
    validUntil: '2026-06-20'
  },
  {
    id: 1002,
    preAuthRefNo: 'INS-PA-55422',
    encounterNo: 'ENC-44522',
    mrn: 'MRN-00126',
    patientName: 'Sarah Ali',
    insuranceCompany: 'NextCare',
    memberId: 'MEM-99871',
    diagnosisCode: 'E11',
    procedureCode: 'MRI-BRAIN',
    requestedAmount: 2000,
    approvedAmount: 2000,
    status: 'APPROVED',
    approvalNumber: 'APR-3311',
    requestDate: '2026-05-21 08:20',
    responseDate: '2026-05-21 09:00',
    requestedBy: 'farouk',
    doctorName: 'Dr. Khaled',
    rejectionReason: '',
    validUntil: '2026-07-01'
  },
  {
    id: 1003,
    preAuthRefNo: 'INS-PA-55423',
    encounterNo: 'ENC-44523',
    mrn: 'MRN-00127',
    patientName: 'Adam Noor',
    insuranceCompany: 'GlobeMed',
    memberId: 'MEM-77112',
    diagnosisCode: 'J20',
    procedureCode: 'LAB-CBC',
    requestedAmount: 300,
    approvedAmount: 0,
    status: 'REJECTED',
    approvalNumber: '',
    requestDate: '2026-05-22 11:00',
    responseDate: '2026-05-22 12:45',
    requestedBy: 'nurse1',
    doctorName: 'Dr. Sami',
    rejectionReason: 'Policy not covered',
    validUntil: ''
  }
];

const WaseelPreAuthorizationRequests: React.FC = () => {
  const [filters, setFilters] = useState<Filters>({ ...initialFilters });
  const [appliedFilters, setAppliedFilters] = useState<Filters>({ ...initialFilters });
  const [filtersKey, setFiltersKey] = useState(0);

  const [selectedRow, setSelectedRow] = useState<PreAuthRecord | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openPreview, setOpenPreview] = useState(false);


  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const filteredData = useMemo(() => {
    const contains = (value: any, search: any) =>
      String(value ?? '')
        .toLowerCase()
        .includes(String(search ?? '').toLowerCase());

    return mockData.filter(row => {
      if (appliedFilters.preAuthId && !contains(row.id, appliedFilters.preAuthId)) return false;
      if (
        appliedFilters.approvalNumber &&
        !contains(row.approvalNumber, appliedFilters.approvalNumber)
      )
        return false;
      if (appliedFilters.encounterNo && !contains(row.encounterNo, appliedFilters.encounterNo))
        return false;
      if (appliedFilters.mrn && !contains(row.mrn, appliedFilters.mrn)) return false;
      if (appliedFilters.patientName && !contains(row.patientName, appliedFilters.patientName))
        return false;
      if (
        appliedFilters.insuranceCompany &&
        row.insuranceCompany !== appliedFilters.insuranceCompany
      )
        return false;
      if (appliedFilters.memberId && !contains(row.memberId, appliedFilters.memberId))
        return false;
      if (appliedFilters.status && row.status !== appliedFilters.status) return false;
      if (appliedFilters.doctorName && row.doctorName !== appliedFilters.doctorName) return false;
      if (appliedFilters.requestedBy && !contains(row.requestedBy, appliedFilters.requestedBy))
        return false;
      if (appliedFilters.validUntil && row.validUntil !== appliedFilters.validUntil) return false;

      if (
        appliedFilters.requestDateFrom &&
        row.requestDate.substring(0, 10) < appliedFilters.requestDateFrom
      )
        return false;

      if (
        appliedFilters.requestDateTo &&
        row.requestDate.substring(0, 10) > appliedFilters.requestDateTo
      )
        return false;

      return true;
    });
  }, [appliedFilters]);

  const pagedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  const handleSearch = () => {
    setAppliedFilters({ ...filters });
    setPage(0);
  };

  const handleReset = () => {
    setFilters({ ...initialFilters });
    setAppliedFilters({ ...initialFilters });
    setFiltersKey(prev => prev + 1);
    setPage(0);
  };

  const isSelected = (row: PreAuthRecord) => (row?.id === selectedRow?.id ? 'selected-row' : '');

  const columns = [
    {
      key: 'id',
      title: <Translate>Pre-Auth ID</Translate>,
      flexGrow: 2
    },
    {
      key: 'preAuthRefNo',
      title: <Translate>Insurance Ref No</Translate>,
      flexGrow: 3
    },
    {
      key: 'encounterNo',
      title: <Translate>Encounter No</Translate>,
      expandable: true,
      flexGrow: 3
    },
    {
      key: 'mrn',
      title: <Translate>MRN</Translate>,
      expandable: true,
      flexGrow: 2
    },
    {
      key: 'patientName',
      title: <Translate>Patient Name</Translate>,
      expandable: true,
      flexGrow: 4
    },
    {
      key: 'insuranceCompany',
      title: <Translate>Insurance Company</Translate>,
      flexGrow: 4
    },
    {
      key: 'memberId',
      title: <Translate>Member ID</Translate>,
      flexGrow: 3
    },
    {
      key: 'diagnosisCode',
      title: <Translate>Diagnosis Code</Translate>,
      flexGrow: 3
    },
    {
      key: 'procedureCode',
      title: <Translate>Procedure Code</Translate>,
      flexGrow: 3
    },
    {
      key: 'requestedAmount',
      title: <Translate>Requested Amount</Translate>,
      flexGrow: 3,
      render: (row: PreAuthRecord) => row.requestedAmount?.toLocaleString()
    },
    {
      key: 'approvedAmount',
      title: <Translate>Approved Amount</Translate>,
      flexGrow: 3,
      render: (row: PreAuthRecord) => row.approvedAmount?.toLocaleString()
    },
    {
      key: 'status',
      title: <Translate>Pre-Auth Status</Translate>,
      flexGrow: 3,
      render: (row: PreAuthRecord) => (
        <MyBadgeStatus
          contant={row.status}
          color={
            row.status === 'APPROVED'
              ? '#28a745'
              : row.status === 'REJECTED'
                ? '#dc3545'
                : row.status === 'PENDING'
                  ? '#ffc107'
                  : '#007bff'
          }
        />
      )
    },
    {
      key: 'approvalNumber',
      title: <Translate>Approval Number</Translate>,
      flexGrow: 3
    },
    {
      key: 'requestDate',
      title: <Translate>Request Date</Translate>,
      expandable: true,
      flexGrow: 3
    },
    {
      key: 'responseDate',
      title: <Translate>Response Date</Translate>,
      expandable: true,
      flexGrow: 3
    },
    {
      key: 'requestedBy',
      title: <Translate>Requested By</Translate>,
      expandable: true,
      flexGrow: 3
    },
    {
      key: 'doctorName',
      title: <Translate>Doctor Name</Translate>,
      flexGrow: 3
    },
    {
      key: 'rejectionReason',
      title: <Translate>Rejection Reason</Translate>,
      expandable: true,
      flexGrow: 4,
      render: (row: PreAuthRecord) => row.rejectionReason || '-'
    },
    {
      key: 'validUntil',
      title: <Translate>Valid Until</Translate>,
      flexGrow: 3,
      render: (row: PreAuthRecord) => row.validUntil || '-'
    },
    {
      key: 'action',
      dataKey: '',
      title: <Translate>ACTION</Translate>,
      width: 140,
      align: 'center',
      render: (row: PreAuthRecord) => {
        const canResubmit =
          row.status === 'REJECTED' || row.status === 'PARTIAL';

        const canPrint =
          row.status === 'APPROVED' || row.status === 'PARTIAL';

        return (
          <div className="container-of-icons">
            <Whisper
              placement="top"
              trigger="hover"
              container={() => document.body}
              speaker={<Tooltip>View</Tooltip>}
            >
              <span>
                <FaEye
                  className="icons-style"
                  size={20}
                  fill="var(--primary-gray)"
                  onClick={() => {
                    console.log('View pre-auth', row);
                  }}
                  style={{
                    cursor: 'pointer'
                  }}
                />
              </span>
            </Whisper>

            <Whisper
              placement="top"
              trigger="hover"
              container={() => document.body}
              speaker={<Tooltip>Resubmit</Tooltip>}
            >
              <span>
                <FaRotate
                  className="icons-style"
                  size={20}
                  fill="var(--primary-gray)"
                  onClick={() => {
                    if (!canResubmit) return;

                    console.log('Resubmit pre-auth', row);
                  }}
                  style={{
                    cursor: canResubmit ? 'pointer' : 'not-allowed',
                    opacity: canResubmit ? 1 : 0.35
                  }}
                />
              </span>
            </Whisper>

            <Whisper
              placement="top"
              trigger="hover"
              container={() => document.body}
              speaker={<Tooltip>Print</Tooltip>}
            >
              <span>
                <FaPrint
                  className="icons-style"
                  size={20}
                  fill="var(--primary-gray)"
                  onClick={() => {
                    if (!canPrint) return;

                    console.log('Print pre-auth', row);
                  }}
                  style={{
                    cursor: canPrint ? 'pointer' : 'not-allowed',
                    opacity: canPrint ? 1 : 0.35
                  }}
                />
              </span>
            </Whisper>
          </div>
        );
      }
    }
  ];

  const filterOptions = [
    {
      label: 'Pre-Auth ID',
      value: 'preAuthId',
      type: 'text'
    },
    {
      label: 'Approval Number',
      value: 'approvalNumber',
      type: 'text'
    },
    {
      label: 'Encounter No',
      value: 'encounterNo',
      type: 'text'
    },
    {
      label: 'MRN',
      value: 'mrn',
      type: 'text'
    },
    {
      label: 'Patient Name',
      value: 'patientName',
      type: 'text'
    },
    {
      label: 'Insurance Company',
      value: 'insuranceCompany',
      type: 'select',
      data: insuranceOptions
    },
    {
      label: 'Member ID',
      value: 'memberId',
      type: 'text'
    },
    {
      label: 'Pre-Auth Status',
      value: 'status',
      type: 'select',
      data: statusOptions
    },
    {
      label: 'Doctor Name',
      value: 'doctorName',
      type: 'select',
      data: doctorOptions
    },
    {
      label: 'Request Date From',
      value: 'requestDateFrom',
      type: 'date'
    },
    {
      label: 'Request Date To',
      value: 'requestDateTo',
      type: 'date'
    },
    {
      label: 'Approval Valid Until',
      value: 'validUntil',
      type: 'date'
    },
    {
      label: 'Requested By',
      value: 'requestedBy',
      type: 'text'
    }
  ];

  const [selectedFilter, setSelectedFilter] = useState<any>(null);

  const selectedFilterConfig = filterOptions.find(
    item => item.value === selectedFilter
  );

  const filtersForm = (
    <Form fluid className="pre-auth-filters-form">
      <div className="dynamic-filters-container">
        <MyInput
          fieldLabel="Filter By"
          fieldName="selectedFilter"
          fieldType="select"
          selectData={filterOptions}
          selectDataLabel="label"
          selectDataValue="value"
          searchable={false}
          record={{ selectedFilter }}
          setRecord={(value: any) => {
            setSelectedFilter(value.selectedFilter);
          }}
          width="250px"
        />

        {selectedFilterConfig?.type === 'text' && (
          <MyInput
            fieldName={selectedFilter}
            fieldLabel={selectedFilterConfig.label}
            fieldType="text"
            record={filters}
            setRecord={setFilters}
            width="250px"
          />
        )}

        {selectedFilterConfig?.type === 'date' && (
          <MyInput
            fieldName={selectedFilter}
            fieldLabel={selectedFilterConfig.label}
            fieldType="date"
            record={filters}
            setRecord={setFilters}
            width="250px"
          />
        )}

        {selectedFilterConfig?.type === 'select' && (
          <MyInput
            fieldName={selectedFilter}
            fieldLabel={selectedFilterConfig.label}
            fieldType="select"
            record={filters}
            setRecord={setFilters}
            selectData={selectedFilterConfig.data ?? []}
            selectDataLabel="label"
            selectDataValue="value"
            searchable
            cleanable
            width="250px"
          />
        )}

        <AdvancedSearchFilters
          showAdvancedButton={false}
          searchOnClick={handleSearch}
          clearOnClick={() => {
            setSelectedFilter(null);
            handleReset();
          }}
        />

      </div>
    </Form>
  );

  return (
    <div className="active-admins-page" dir={dir}>
      <MyTable
        data={pagedData}
        columns={columns}
        rowClassName={isSelected}
        onRowClick={(row: PreAuthRecord) => {
          setSelectedRow(row);
          setOpenPreview(true);
        }}
        filters={filtersForm}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={filteredData.length}
        onPageChange={(_: unknown, newPage: number) => setPage(newPage)}
        onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        tableButtons={
          <div className="container-of-add-new-button pre-auth-export-buttons">
            <MyButton
              prefixIcon={() => <FontAwesomeIcon icon={faFileExcel} />}
              color="var(--deep-blue)"
              onClick={() => console.log('Export Excel')}
              width="130px"
            >
              Export Excel
            </MyButton>

            <MyButton
              prefixIcon={() => <FontAwesomeIcon icon={faFilePdf} />}
              appearance="ghost"
              onClick={() => console.log('Export PDF')}
              width="120px"
            >
              Export PDF
            </MyButton>
          </div>
        }
        height={650}
      />

      {openPreview && (
        <PreviewWaseelPreAuthorizationRequests
          open={openPreview}
          preAuth={selectedRow}
          onClose={() => setOpenPreview(false)}
        />
      )}
    </div>
  );
};

export default WaseelPreAuthorizationRequests;