import { faCalendarCheck, faCreditCard, faListCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { MdAttachFile, MdModeEdit } from 'react-icons/md';
import { Checkbox, HStack, Panel, Tooltip, Whisper } from 'rsuite';

import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import PatientPrevTests from './PatientPrevTests';
import PreviewDiagnosticsOrder from './PreviewDiagnosticsOrder';
import { useGetDepartmentsBulkMutation } from '@/services/security/departmentService';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';

type Props = {
  tableContainerRef: any;

  orderId: any;
  tableVersion: number;

  loadTests: boolean;
  normalizedOrderTestList: any[];

  // selection helpers
  selectedRows: number[];
  setSelectedRows: (v: number[]) => void;
  selectableRowIds: number[];
  isAllSelected: boolean;
  isIndeterminate: boolean;
  handleCheckboxChange: (id: number) => void;

  // misc
  test: any;
  setTest: (v: any) => void;
  setAttachmentsModalOpen: (v: boolean) => void;

  normalizeOrderTest: (row: any) => any;
  setOrderTest: (v: any) => void;

  setTestCardModal: (v: boolean) => void;

  handleEdit: (row: any) => void;
  onRescheduleAppointment?: (row: any) => void;
  resolveReasonLabel: (k?: string) => string;

  // preview
  previewDiagnosticsOrder: any;
  setPreviewDiagnosticsOrder: (v: any) => void;

  // patient
  patient: any;
};

const DiagnosticsOrderTable: React.FC<Props> = props => {
  const {
    tableContainerRef,
    orderId,
    tableVersion,
    loadTests,
    normalizedOrderTestList,

    selectedRows,
    setSelectedRows,
    selectableRowIds,
    isAllSelected,
    isIndeterminate,
    handleCheckboxChange,

    setTest,
    setAttachmentsModalOpen,
    normalizeOrderTest,
    setOrderTest,
    setTestCardModal,
    handleEdit,
    onRescheduleAppointment,
    resolveReasonLabel,

    previewDiagnosticsOrder,
    setPreviewDiagnosticsOrder,

    patient
  } = props;

  const isSelected = (rowData: any, currentOrderTest: any) => {
    const rowId = rowData?.id ?? rowData?.key;
    const selectedId = currentOrderTest?.id ?? currentOrderTest?.key;
    if (rowId && selectedId && rowId === selectedId) return 'selected-row';
    return '';
  };

  const [getDepartmentsBulk] = useGetDepartmentsBulkMutation();

  const departmentIds = React.useMemo(() => {
  const ids = normalizedOrderTestList
    .map(r => r.receivedDepartmentId ?? r.receivedLabId)
    .filter(Boolean);

  return Array.from(new Set(ids));
}, [normalizedOrderTestList]);
const [departmentsMap, setDepartmentsMap] = useState<Map<number, any>>(new Map());

useEffect(() => {
  if (!departmentIds.length) return;

  getDepartmentsBulk(departmentIds)
    .unwrap()
    .then(res => {
      const map = new Map<number, any>(res.map((d: any) => [Number(d.id), d]));
      setDepartmentsMap(map);
    });
}, [departmentIds]);
const getDepartmentName = (id?: number) =>
  departmentsMap.get(id)?.name ?? id;
  const tableColumns: any[] = [
    {
      key: 'check',
      title: (
        <Checkbox
          checked={isAllSelected}
          indeterminate={isIndeterminate}
          disabled={selectableRowIds.length === 0}
          onChange={(_, checked) => {
            setSelectedRows(checked ? selectableRowIds : []);
          }}
        />
      ),
      flexGrow: 1,
      render: (rowData: any) => {
        const rowId = Number(rowData.id);
        const isDisabled = rowData.status !== 'NEW';
        return (
          <Checkbox
            checked={selectedRows.includes(rowId)}
            disabled={isDisabled}
            onChange={() => handleCheckboxChange(rowId)}
          />
        );
      }
    },
    {
      key: 'orderTypeLkey',
      title: <Translate>ORDER TYPE</Translate>,
      flexGrow: 1,
      fullText: true,
      render: (rowData: any) => <>{formatEnumString(rowData.orderType)}</>
    },
    {
      key: 'test',
      title: <Translate>TEST NAME</Translate>,
      flexGrow: 2,
      fullText: true,
      render: (rowData: any) =>
        rowData.test?.testName ?? rowData.test?.name ?? rowData.testName ?? ''
    },
    {
      key: 'internalCode',
      dataKey: 'internalCode',
      title: <Translate>INTERNAL CODE</Translate>,
      flexGrow: 2,
      fullText: true,
      render: (rowData: any) => rowData.test?.internalCode ?? rowData.test?.code ?? rowData.internalCode ?? ''
    },
    {
      key: 'status',
      dataKey: 'status',
      title: <Translate>STATUS</Translate>,
      flexGrow: 1,
      fullText: true,
      render: (rowData: any) => <>{formatEnumString(rowData.status)}</>
    },
    {
      key: 'receivedDepartmentId',
      dataKey: 'receivedDepartmentId',
      title: <Translate>RECEIVED Department</Translate>,
      fullText: true,
      flexGrow: 1,
      render: (rowData: any) => {
        const deptId = rowData.receivedDepartmentId ?? rowData.receivedLabId;
        return getDepartmentName(deptId);
      }
    },
    {
      key: 'reason',
      title: <Translate>REASON</Translate>,
      flexGrow: 1,
      fullText: true,
      render: (rowData: any) => resolveReasonLabel(rowData.reason ?? rowData.reasonLkey)
    },
    {
      key: 'notes',
      title: <Translate>NOTES</Translate>,
      flexGrow: 1,
      render: (rowData: any) => rowData.notes ?? ''
    },
    {
      key: 'attachments',
      title: <Translate>ATTACHMENTS</Translate>,
      flexGrow: 1,
      render: (rowData: any) => (
        <MdAttachFile
          size={20}
          fill={rowData?.id ? 'var(--primary-gray)' : '#ccc'}
          style={{ cursor: rowData?.id ? 'pointer' : 'not-allowed' }}
          onClick={() => {
            if (!rowData?.id) return;
            setTest(rowData);
            setAttachmentsModalOpen(true);
          }}
        />
      )
    },
    {
      key: 'submitDate',
      dataKey: 'submitDate',
      title: <Translate>SUBMIT DATE</Translate>,
      flexGrow: 2,
      fullText: true,
      render: (rowData: any) => (
        <span className="date-table-style">{formatDateWithoutSeconds(rowData.submitDate)}</span>
      )
    },
    {
      key: 'details',
      title: <Translate>ADD DETAILS</Translate>,
      flexGrow: 2,
      fullText: true,
      render: (rowData: any) => {
        const rowStatus = String(rowData?.status ?? '').toUpperCase();
        const isRescheduled = rowStatus.includes('RESCHEDULE');
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Whisper placement="top" speaker={<Tooltip>Edit</Tooltip>}>
              <span style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                <MdModeEdit onClick={() => handleEdit(rowData)} className="icons-styles" color="var(--primary-gray)" />
              </span>
            </Whisper>

            <Whisper placement="top" speaker={<Tooltip>Pre-test assessment</Tooltip>}>
              <FontAwesomeIcon color="var(--primary-gray)" className="icons-styles" icon={faListCheck} />
            </Whisper>

            <Whisper placement="top" speaker={<Tooltip>Test card</Tooltip>}>
              <HStack spacing={10}>
                <FontAwesomeIcon
                  icon={faCreditCard}
                  className="icons-styles"
                  color="var(--primary-gray)"
                  onClick={() => {
                    setOrderTest(normalizeOrderTest(rowData));
                    setTest(rowData.test);
                    setTestCardModal(true);
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </HStack>
            </Whisper>

            <Whisper placement="top" speaker={<Tooltip>Reschedule appointment</Tooltip>}>
              <FontAwesomeIcon
                icon={faCalendarCheck}
                className="icons-styles"
                color={isRescheduled ? '#b9c0cc' : 'var(--primary-gray)'}
                onClick={() => {
                  if (isRescheduled) return;
                  onRescheduleAppointment?.(rowData);
                }}
                style={{ cursor: isRescheduled ? 'not-allowed' : 'pointer' }}
              />
            </Whisper>
          </div>
        );
      }
    },
    {
      key: 'createdAtBy',
      title: <Translate>Created At/By</Translate>,
      expandable: true,
      render: (rowData: any) => (
        <>
          <span>{rowData.createdBy}</span>
          <br />
          <span className="date-table-style">{formatDateWithoutSeconds(rowData.createdAt)}</span>
        </>
      )
    },
    {
      key: 'updatedAtBy',
      title: <Translate>Updated At/By</Translate>,
      expandable: true,
      render: (rowData: any) => (
        <>
          <span>{rowData.lastModifiedBy}</span>
          <br />
          <span className="date-table-style">
            {formatDateWithoutSeconds(rowData.lastModifiedDate)}
          </span>
        </>
      )
    },
    {
      key: 'cancelledAtBy',
      title: <Translate>Cancelled At/By</Translate>,
      expandable: true,
      render: (rowData: any) => (
        <>
          <span>{rowData.cancelledBy}</span>
          <br />
          <span className="date-table-style">
            {formatDateWithoutSeconds(rowData.cancelledDate)}
          </span>
        </>
      )
    },
    {
      key: 'cancellationReason',
      dataKey: 'cancellationReason',
      title: <Translate>Cancellation Reason</Translate>,
      expandable: true
    }
  ];

  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
  <div dir={dir}>
    <div className="table-row-margins">
      <div ref={tableContainerRef}>
        <MyTable
          key={`${orderId}-${tableVersion}`}
          columns={tableColumns}
          loading={loadTests}
          data={orderId ? normalizedOrderTestList : []}
          onRowClick={(rowData: any) => {
            const rowId = Number(rowData.id);
            if (rowData.status === 'NEW') {
              handleCheckboxChange(rowId);
            }
            setOrderTest(normalizeOrderTest(rowData));
            setTest(rowData.test ?? {});
            setPreviewDiagnosticsOrder(rowData);
          }}
          rowClassName={(rowData: any) => isSelected(rowData, null)}
        />
      </div>

      <PreviewDiagnosticsOrder open={!!previewDiagnosticsOrder} orderTest={previewDiagnosticsOrder} />

      <Panel header="Patient Orders Test" collapsible expanded className="panel-style">
        <PatientPrevTests patient={
          //add new patient edits
          patient} />
      </Panel>
    </div>
  </div>
  );
};

export default DiagnosticsOrderTable;
