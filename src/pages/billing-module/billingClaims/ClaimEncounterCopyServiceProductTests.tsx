import React, { useMemo, useState } from 'react';
import { MdModeEdit, MdAddCircleOutline } from 'react-icons/md';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import Translate from '@/components/Translate';
import UserDateCell from '@/components/UserDateCell';

import { useGetPatientServicesAndProductsByEncounterQuery } from '@/services/encounters/patientServicesAndProductsService';
import { useGetAllActiveDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetClaimEncounterCopyDiagnosticOrderTestReportsQuery } from '@/services/billing/claimEncounterCopyDiagnosticOrderTestReportService';
import { useGetClaimEncounterCopyDiagnosticOrderTestResultsQuery } from '@/services/billing/claimEncounterCopyDiagnosticOrderTestResultService';
import { PatientServiceAndProduct, ServiceSource } from '@/types/model-types-new';

import ClaimEncounterCopyDiagnosticOrderLabResultModal from './ClaimEncounterCopyDiagnosticOrderLabResultModal';
import AddClaimEncounterCopyDiagnosticOrderTestReport from './AddClaimEncounterCopyDiagnosticOrderTestReport';

interface ClaimEncounterCopyServiceProductTestsProps {
  claimEncounterCopyId: number;
  encounterId?: number;
}

const RESULT_BILLING_ITEM_TYPES = ['LABORATORY', 'RADIOLOGY'];

/**
 * Laboratory / radiology tests ordered from the Service & Products medical sheet.
 * They have no diagnostic order, so their claim results are linked by patientServiceProductId.
 */
const isServiceProductTest = (item: PatientServiceAndProduct) =>
  item.serviceSource === ServiceSource.SERVICE_AND_PRODUCT &&
  RESULT_BILLING_ITEM_TYPES.includes(item.billingItemType) &&
  item.diagnosticTestId != null;

const ClaimEncounterCopyServiceProductTests = ({
  claimEncounterCopyId,
  encounterId
}: ClaimEncounterCopyServiceProductTestsProps) => {
  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const { data: servicesResponse, isFetching } =
    useGetPatientServicesAndProductsByEncounterQuery(
      { encounterId: encounterId as number, size: 1000 },
      { skip: !encounterId }
    );

  const { data: resultCopies = [] } =
    useGetClaimEncounterCopyDiagnosticOrderTestResultsQuery({ claimEncounterCopyId });

  const { data: reportCopies = [] } =
    useGetClaimEncounterCopyDiagnosticOrderTestReportsQuery({ claimEncounterCopyId });

  const { data: diagnosticTestsResponse } =
    useGetAllActiveDiagnosticTestsQuery({ page: 0, size: 1000 });

  const testNameMap = useMemo(() => {
    const map = new Map<number, string>();

    diagnosticTestsResponse?.data?.forEach((test: any) => {
      map.set(test.id, test.name);
    });

    return map;
  }, [diagnosticTestsResponse]);

  const rows = useMemo(() => {
    return (servicesResponse?.data ?? []).filter(isServiceProductTest).map(item => {
      const isLab = item.billingItemType === 'LABORATORY';
      const isOwnCopy = (copy: { patientServiceProductId?: number | null }) =>
        copy.patientServiceProductId === item.id;
      const copies: any[] = isLab
        ? resultCopies.filter(isOwnCopy)
        : reportCopies.filter(isOwnCopy);

      return {
        ...item,
        testId: item.diagnosticTestId,
        isLab,
        copies,
        copy: copies[0] ?? null,
        isCopied: copies.length > 0,
        testName:
          testNameMap.get(item.diagnosticTestId as number) ||
          item.itemName ||
          `Test #${item.diagnosticTestId}`
      };
    });
  }, [servicesResponse, resultCopies, reportCopies, testNameMap]);

  const handleOpen = (row: any) => {
    setSelectedRow(row);
    setOpenModal(true);
  };

  const isRowSelected = (row: any) =>
    row.id === selectedRow?.id ? 'selected-row' : '';

  const columns = [
    {
      key: 'testName',
      title: <Translate>Test</Translate>,
      flexGrow: 2,
      render: (row: any) => row.testName
    },
    {
      key: 'billingItemType',
      title: <Translate>Type</Translate>,
      flexGrow: 1,
      render: (row: any) => (
        <MyBadgeStatus
          contant={row.billingItemType}
          color={row.isLab ? '#007bff' : '#6f42c1'}
        />
      )
    },
    {
      key: 'createdDate',
      title: <Translate>Ordered Date</Translate>,
      flexGrow: 1.5,
      render: (row: any) =>
        row.createdDate ? new Date(row.createdDate).toLocaleString() : '-'
    },
    {
      key: 'value',
      title: <Translate>Results Filled</Translate>,
      flexGrow: 1,
      render: (row: any) => (row.isCopied ? `${row.copies.length} filled` : '-')
    },
    {
      key: 'copyStatus',
      title: <Translate>Copy Status</Translate>,
      flexGrow: 1.5,
      render: (row: any) => (
        <MyBadgeStatus
          contant={row.isCopied ? 'COPIED' : 'NOT COPIED'}
          color={row.isCopied ? '#28a745' : '#6c757d'}
        />
      )
    },
    {
      key: 'originalCreatedDate',
      title: <Translate>ORIGINAL CREATED AT / BY</Translate>,
      render: (row: any) =>
        row.copy ? (
          <UserDateCell
            login={row.copy.originalCreatedBy}
            date={row.copy.originalCreatedDate}
          />
        ) : (
          '-'
        )
    },
    {
      key: 'copyCreatedDate',
      title: <Translate>CREATED AT / BY</Translate>,
      render: (row: any) =>
        row.copy ? (
          <UserDateCell
            login={row.copy.createdBy}
            date={row.copy.createdDate}
          />
        ) : (
          '-'
        )
    },
    {
      key: 'copyLastModifiedDate',
      title: <Translate>UPDATED AT / BY</Translate>,
      render: (row: any) =>
        row.copy ? (
          <UserDateCell login={row.copy.lastModifiedBy} date={row.copy.lastModifiedDate} />
        ) : (
          '-'
        )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row: any) => {
        const ActionIcon = row.isCopied ? MdModeEdit : MdAddCircleOutline;

        return (
          <div className="flex-gap-12" onClick={e => e.stopPropagation()}>
            <ActionIcon
              size={22}
              fill="var(--primary-gray)"
              className="pointer"
              onClick={event => {
                event.stopPropagation();
                handleOpen(row);
              }}
            />
          </div>
        );
      }
    }
  ];

  return (
    <div dir={dir}>
      <MyTable
        height={350}
        data={rows}
        loading={isFetching}
        columns={columns}
        rowKey="id"
        onRowClick={row => setSelectedRow(row)}
        rowClassName={isRowSelected}
      />

      {selectedRow?.isLab && (
        <ClaimEncounterCopyDiagnosticOrderLabResultModal
          open={openModal}
          setOpen={setOpenModal}
          claimEncounterCopyId={claimEncounterCopyId}
          orderTest={selectedRow}
          patientServiceProductId={selectedRow.id}
          testName={selectedRow.testName}
          existingCopies={selectedRow.copies}
        />
      )}

      {selectedRow && !selectedRow.isLab && (
        <AddClaimEncounterCopyDiagnosticOrderTestReport
          open={openModal}
          setOpen={setOpenModal}
          claimEncounterCopyId={claimEncounterCopyId}
          patientServiceProductId={selectedRow.id}
          testId={selectedRow.testId}
          testName={selectedRow.testName}
          initialData={selectedRow.copy ?? null}
        />
      )}
    </div>
  );
};

export default ClaimEncounterCopyServiceProductTests;
