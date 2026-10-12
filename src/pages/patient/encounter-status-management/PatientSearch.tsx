import React, { useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { Form, Message } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import {
  useGetPatientsByAnyDocumentNumberQuery,
  useGetPatientsByFullNameQuery,
  useGetPatientsByMedicalRecordNumberQuery,
  useGetPatientsByPrimaryPhoneQuery
} from '@/services/patient/patientService';
import { useGetPrimaryDocumentByPatientQuery } from '@/services/patients/patientDocumentsService';
import type { Patient } from '@/types/model-types-new';
import { formatDate, formatEnumString } from '@/utils';

type SearchField = 'fullName' | 'mrn' | 'documentNumber' | 'primaryMobile';
type SearchRecord = { field: SearchField; keyword: string };
type Props = {
  selectedPatientId?: number;
  onSelectPatient: (patient: Patient) => void;
};

const searchFields = [
  { label: 'Patient Name', value: 'fullName' },
  { label: 'MRN', value: 'mrn' },
  { label: 'Document Number', value: 'documentNumber' },
  { label: 'Primary Mobile', value: 'primaryMobile' }
];
const initialSearch: SearchRecord = { field: 'fullName', keyword: '' };

const DocumentNumber = ({ patientId }: { patientId?: number }) => {
  const { currentData, isFetching, isError } = useGetPrimaryDocumentByPatientQuery(
    patientId ?? skipToken
  );
  if (isFetching) return <Translate>Loading...</Translate>;
  if (isError) return <Translate>Unavailable</Translate>;
  return <>{currentData?.number || '-'}</>;
};

const PatientSearch = ({ selectedPatientId, onSelectPatient }: Props) => {
  const [record, setRecord] = useState<SearchRecord>(initialSearch);
  const [search, setSearch] = useState<SearchRecord | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const paging = { page, size: rowsPerPage, sort: 'id,asc' };

  // Match the existing patient search: only the chosen criterion calls its endpoint.
  const byName = useGetPatientsByFullNameQuery(
    search?.field === 'fullName' ? { ...paging, keyword: search.keyword } : skipToken
  );
  const byMrn = useGetPatientsByMedicalRecordNumberQuery(
    search?.field === 'mrn' ? { ...paging, medicalRecordNumber: search.keyword } : skipToken
  );
  const byDocument = useGetPatientsByAnyDocumentNumberQuery(
    search?.field === 'documentNumber' ? { ...paging, number: search.keyword } : skipToken
  );
  const byMobile = useGetPatientsByPrimaryPhoneQuery(
    search?.field === 'primaryMobile' ? { ...paging, phone: search.keyword } : skipToken
  );
  const results = search
    ? { fullName: byName, mrn: byMrn, documentNumber: byDocument, primaryMobile: byMobile }[
        search.field
      ]
    : undefined;

  const handleSearch = () => {
    const keyword = record.keyword.trim();
    if (!keyword) return;
    setPage(0);
    setSearch({ ...record, keyword });
  };

  const columns = [
    {
      key: 'patientName',
      title: <Translate>Patient Name</Translate>,
      render: (row: Patient) =>
        [row.firstName, row.secondName, row.thirdName, row.lastName].filter(Boolean).join(' ') ||
        '-'
    },
    {
      key: 'medicalRecordNumber',
      title: <Translate>MRN</Translate>,
      render: (row: Patient) => row.medicalRecordNumber || '-'
    },
    {
      key: 'documentNumber',
      title: <Translate>Document Number</Translate>,
      render: (row: Patient) => <DocumentNumber patientId={row.id} />
    },
    {
      key: 'primaryMobileNumber',
      title: <Translate>Primary Mobile</Translate>,
      render: (row: Patient) => row.primaryMobileNumber || '-'
    },
    {
      key: 'sexAtBirth',
      title: <Translate>Gender</Translate>,
      render: (row: Patient) => formatEnumString(row.sexAtBirth) || '-'
    },
    {
      key: 'dateOfBirth',
      title: <Translate>Date of Birth</Translate>,
      render: (row: Patient) => (row.dateOfBirth ? formatDate(new Date(row.dateOfBirth)) : '-')
    },
    {
      key: 'action',
      title: <Translate>Action</Translate>,
      render: (row: Patient) => (
        <MyButton
          appearance="ghost"
          disabled={row.id == null || row.id === selectedPatientId}
          onClick={() => onSelectPatient(row)}
        >
          {row.id === selectedPatientId ? 'Selected' : 'Select'}
        </MyButton>
      )
    }
  ];

  return (
    <>
      <SectionContainer
        title={<Translate>Patient Search</Translate>}
        content={
          <Form fluid className="encounter-status-management-search" onSubmit={handleSearch}>
            <MyInput
              fieldName="field"
              fieldType="select"
              fieldLabel="Search By"
              record={record}
              setRecord={setRecord}
              selectData={searchFields}
              selectDataLabel="label"
              selectDataValue="value"
              cleanable={false}
              searchable={false}
              width={220}
            />
            <MyInput
              fieldName="keyword"
              fieldLabel={searchFields.find(field => field.value === record.field)?.label}
              record={record}
              setRecord={setRecord}
              enterClick={handleSearch}
              width={280}
            />
            <div className="encounter-status-management-search-buttons">
            <MyButton onClick={handleSearch} disabled={!record.keyword.trim()}>
              Search
            </MyButton>
            <MyButton
              appearance="ghost"
              onClick={() => {
                setRecord(initialSearch);
                setSearch(null);
                setPage(0);
              }}
            >
              Clear
            </MyButton>
            </div>
          </Form>
        }
      />
      <SectionContainer
        title={<Translate>Patient Results</Translate>}
        content={
          <>
            {results?.isError && (
              <Message type="error">
                <Translate>Unable to load patients.</Translate>{' '}
                <MyButton appearance="link" onClick={() => results.refetch()}>
                  Retry
                </MyButton>
              </Message>
            )}
            <MyTable
              data={results?.currentData?.data ?? []}
              columns={columns}
              loading={results?.isFetching ?? false}
              page={page}
              rowsPerPage={rowsPerPage}
              totalCount={results?.currentData?.totalCount ?? 0}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              onRowsPerPageChange={event => {
                setRowsPerPage(Number(event.target.value));
                setPage(0);
              }}
              dontTranslateData
            />
          </>
        }
      />
    </>
  );
};

export default PatientSearch;
