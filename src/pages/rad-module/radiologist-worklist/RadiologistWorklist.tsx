import React, { useEffect, useMemo, useState } from 'react';
import { Form, Whisper, Tooltip } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faClipboardCheck,
  faPrint,
  faSheetPlastic
} from '@fortawesome/free-solid-svg-icons';
import { useDispatch } from 'react-redux';
import MyInput from '@/components/MyInput';
import MyTable, { ColumnConfig } from '@/components/MyTable/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { setPageCode, setDivContent } from '@/reducers/divSlice';
import { useAppSelector } from '@/hooks';
import {
  useFilterRadiologyReportsQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestReportService';
import {
  useLazyGetDiagnosticOrderTestByIdQuery
} from '@/services/diagnosic-order/diagnosticOrderTestService';
import {
  useLazyGetDiagnosticOrderByIdQuery
} from '@/services/diagnosic-order/diagnosticOrderService';
import { useLazyGetPatientByIdQuery } from '@/services/patientService';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { useLazyGetDepartmentByIdQuery } from '@/services/security/departmentService';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import {useApproveRadiologyReportMutation} from '@/services/setup/diagnosticTest/diagnosticOrderTestReportService';
import { notify } from '@/utils/uiReducerActions';
import './style.less';
import AddReportModal from './AddReportModal';
import {
  newDiagnosticOrderTestReportResponseVM
} from '@/types/model-types-constructor-new';


type Props = {
  refetchAllRadData: () => Promise<void>;
};


const RadiologyImageList = ({ refetchAllRadData }: Props) => {
  const dispatch = useDispatch();
  const selectedDepartment = useAppSelector(
    state => state.auth.selectedDepartment
  );

const [openReportEditor, setOpenReportEditor] = useState(false);
const [selectedReportRow, setSelectedReportRow] = useState<any>(null);

const [orderTestReport, setOrderTestReport] =
  useState<any>({ ...newDiagnosticOrderTestReportResponseVM });

  const [orderTestsMap, setOrderTestsMap] = useState<Record<string, any>>({});
  const [ordersMap, setOrdersMap] = useState<Record<string, any>>({});
  const [patientsMap, setPatientsMap] = useState<Record<string, any>>({});
  const [fetchOrderTestById] =
    useLazyGetDiagnosticOrderTestByIdQuery();
  const [fetchOrderById] =
    useLazyGetDiagnosticOrderByIdQuery();
  const [fetchPatientById] =
    useLazyGetPatientByIdQuery();
  const [record, setRecord] = useState<any>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    dispatch(setPageCode('Radiology_Image_List'));
    dispatch(setDivContent('Radiology Image List'));
  }, [dispatch]);

  const [approveRadiologyReport, { isLoading: approving }] =
    useApproveRadiologyReportMutation();


  const { data, isFetching } = useFilterRadiologyReportsQuery({
    page,
    size: rowsPerPage,
    sort: `${sortColumn},${sortType}`,
    params: {
      departmentId: selectedDepartment?.departmentId,
      imageStatus: 'FINISHED'
    }
  });

  const radReportTableData = useMemo(
    () => (data?.data ?? []).filter(r => r.imageStatus === 'FINISHED'),
    [data]
  );

  const totalCount = data?.totalCount ?? 0;

  const [departmentsMap, setDepartmentsMap] = useState<Record<string, any>>({});
  const [fetchDepartmentById] = useLazyGetDepartmentByIdQuery();

  const departmentIds = useMemo(
    () =>
      Object.values(ordersMap)
        .map((o: any) => o.fromDepartmentId)
        .filter(Boolean)
        .map(String)
        .filter((id, i, arr) => arr.indexOf(id) === i),
    [ordersMap]
  );

    const orderTestIds = useMemo(
      () =>
        radReportTableData
          .map(r => r.orderTestId)
          .filter(Boolean)
          .map(String)
          .filter((id, i, arr) => arr.indexOf(id) === i),
      [radReportTableData]
    );

    const orderIds = useMemo(
      () =>
        Object.values(orderTestsMap)
          .map((ot: any) => ot.orderId)
          .filter(Boolean)
          .map(String)
          .filter((id, i, arr) => arr.indexOf(id) === i),
      [orderTestsMap]
    );

    const patientIds = useMemo(
      () =>
        Object.values(ordersMap)
          .map((o: any) => o.patientId)
          .filter(Boolean)
          .map(String)
          .filter((id, i, arr) => arr.indexOf(id) === i),
      [ordersMap]
    );

    useEffect(() => {
      orderTestIds.forEach(id => {
        if (orderTestsMap[id]) return;

        fetchOrderTestById(Number(id))
          .unwrap()
          .then(ot => {
            if (!ot) return;
            setOrderTestsMap(prev => ({ ...prev, [id]: ot }));
          })
          .catch(() => {});
      });
    }, [orderTestIds, fetchOrderTestById, orderTestsMap]);

    useEffect(() => {
      orderIds.forEach(id => {
        if (ordersMap[id]) return;

        fetchOrderById(Number(id))
          .unwrap()
          .then(order => {
            if (!order) return;
            setOrdersMap(prev => ({ ...prev, [id]: order }));
          })
          .catch(() => {});
      });
    }, [orderIds, fetchOrderById, ordersMap]);

    useEffect(() => {
      patientIds.forEach(id => {
        if (patientsMap[id]) return;

        fetchPatientById(id)
          .unwrap()
          .then(patient => {
            if (!patient) return;
            setPatientsMap(prev => ({ ...prev, [id]: patient }));
          })
          .catch(() => {});
      });
    }, [patientIds, fetchPatientById, patientsMap]);

    const FilterModel = (
      <Form fluid className="table-header-content">
        <MyInput
          width="180px"
          fieldLabel="Order Date From"
          fieldType="date"
          fieldName="fromDate"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          width="180px"
          fieldLabel="To"
          fieldType="date"
          fieldName="toDate"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          width="200px"
          fieldLabel="Patient Search"
          fieldName="search"
          fieldType="text"
          placeholder="Search..."
          record={record}
          setRecord={setRecord}
        />
      </Form>
    );

const handleApprove = async (row: any) => {
  if (!row?.id) return;

  try {
    await approveRadiologyReport(row.id).unwrap();

    dispatch(
      notify({
        msg: 'Report Approved successfully',
        sev: 'success'
      })
    );

    await refetchAllRadData();
  } catch (e: any) {
    dispatch(
      notify({
        msg:
          e?.data?.message ||
          e?.data?.detail ||
          'Approve Failed',
        sev: 'error'
      })
    );
  }
};



  const columns: ColumnConfig[] = useMemo(() => [
    {
      key: 'department',
      title: 'Department',
      width: 160,
      render: row => {
        const order = ordersMap[String(row.orderId)];
        const department = departmentsMap[String(order?.fromDepartmentId)];

        return department?.name ?? '—';
      }
    },
    {
      key: 'patientName',
      title: 'Patient Name',
      width: 180,
      render: row => {
        const ot = orderTestsMap[String(row.orderTestId)];
        const order = ordersMap[String(ot?.orderId)];
        const patient = patientsMap[String(order?.patientId)];
        return patient?.fullName ?? '—';
      }
    },
    {
      key: 'mrn',
      title: 'MRN',
      width: 120,
      render: row => {
        const ot = orderTestsMap[String(row.orderTestId)];
        const order = ordersMap[String(ot?.orderId)];
        const patient = patientsMap[String(order?.patientId)];
        return patient?.patientMrn ?? '—';
      }
    },
    {
      key: 'report',
      title: 'Report',
      width: 80,
      align: 'center',
      render: (row) => (
        <Whisper speaker={<Tooltip>View Report</Tooltip>}>
          <span style={{ cursor: 'pointer' }}>
            <FontAwesomeIcon
              icon={faSheetPlastic}
              onClick={() => {
                setSelectedReportRow(row);

                setOrderTestReport({
                  ...newDiagnosticOrderTestReportResponseVM,
                  ...row
                });

                setOpenReportEditor(true);
              }}
            />
          </span>
        </Whisper>
      )
    },
    {
      key: 'status',
      title: 'Status',
      width: 120,
      render: row => (
        <MyBadgeStatus
          contant={formatEnumString(row.processingStatus)}
          backgroundColor="var(--light-green)"
          color="var(--primary-green)"
        />
      )
    },
    {
      key: 'orderByAt',
      title: 'Order By / At',
      width: 200,
      render: row => (
        <>
          {row.createdBy}
          <br />
          <span className="date-table-style">
            {formatDateWithoutSeconds(row.createdDate)}
          </span>
        </>
      )
    },
    {
      key: 'icons',
      title: '',
      width: 160,
      align: 'center',
      render: row => {
        const canApprove =
          row.processingStatus === 'RESULT_READY';

        return (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Whisper speaker={<Tooltip>Approve</Tooltip>}>
              <span>
                <FontAwesomeIcon
                  className='icon-radiologist-worklist-size'
                  icon={faCheckCircle}
                  style={{
                    cursor: canApprove ? 'pointer' : 'not-allowed',
                    opacity: canApprove ? 1 : 0.4,
                    color: canApprove ? '#969fb0' : '#999'
                  }}
                  onClick={() => {
                    if (!canApprove || approving) return;
                    handleApprove(row);
                  }}
                />
              </span>
            </Whisper>
            <Whisper speaker={<Tooltip>Send by Email</Tooltip>}>
              <FontAwesomeIcon icon={faEnvelope} className='icon-radiologist-worklist-size'/>
            </Whisper>
            <Whisper speaker={<Tooltip>Second Approval</Tooltip>}>
              <FontAwesomeIcon icon={faClipboardCheck} className='icon-radiologist-worklist-size'/>
            </Whisper>
            <Whisper speaker={<Tooltip>Print</Tooltip>}>
              <FontAwesomeIcon className='icon-radiologist-worklist-size' icon={faPrint} />
            </Whisper>

          </div>
        );
      }
    }

  ], [orderTestsMap, ordersMap, patientsMap]);


  useEffect(() => {
    departmentIds.forEach(id => {
      if (departmentsMap[id]) return;

      fetchDepartmentById(id)
        .unwrap()
        .then(dep => {
          if (!dep) return;
          setDepartmentsMap(prev => ({
            ...prev,
            [id]: dep
          }));
        })
        .catch(() => {});
    });
  }, [departmentIds, fetchDepartmentById, departmentsMap]);

  const isEditDisabled = useMemo(
    () => orderTestReport?.processingStatus === 'RESULT_APPROVED',
    [orderTestReport]
  );

  return (<>
    <MyTable
      data={radReportTableData}
      columns={columns}
      loading={isFetching}
      filters={FilterModel}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={totalCount}
      sortColumn={sortColumn}
      sortType={sortType}
      onRowClick={(rowData) => {
        setSelectedReportRow(rowData);
        setOrderTestReport({
          ...newDiagnosticOrderTestReportResponseVM,
          ...rowData
        });
      }}
      onSortChange={(col, type) => {
        setSortColumn(col);
        setSortType(type);
      }}
      onPageChange={(_, newPage) => setPage(newPage)}
      onRowsPerPageChange={e => {
        setRowsPerPage(Number(e.target.value));
        setPage(0);
      }}
    />

    <AddReportModal
      open={openReportEditor}
      setOpen={setOpenReportEditor}
      report={orderTestReport}
      setReport={setOrderTestReport}
      disableEdit={isEditDisabled}
      resultFetch={async () => {
        await refetchAllRadData();
      }}
      attachmentRefetch={async () => {
        await refetchAllRadData();
      }}
    />


  </>);
};

export default RadiologyImageList;
