import CancellationModal from '@/components/CancellationModal';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import DiagnosticsTest from '@/pages/setup/diagnostics-tests-definition-new';
import {
  DiagnosticTestRequestStatus,
  useApproveDiagnosticTestRequestMutation,
  useDeleteDiagnosticTestRequestMutation,
  useFilterDiagnosticTestRequestsQuery,
  useRejectDiagnosticTestRequestMutation
} from '@/services/diagnosic-order/diagnosticTestRequestService';
import { useGetDepartmentByIdQuery } from '@/services/security/departmentService';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import React, { useMemo, useState } from 'react';
import { MdOutlineDescription } from 'react-icons/md';
import { Form, Tooltip, Whisper } from 'rsuite';
import ApproveRequestModal from './ApproveRequestModal';
import './style.less';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';

type Props = {
  page?: number;
  size?: number;
  height?: number;
  onRowClick?: (row: any) => void;
  hideActions?: boolean;
  requestType?: string;

};

const DepartmentCell = ({ departmentId }: { departmentId?: string }) => {
  const { data: department, isFetching } = useGetDepartmentByIdQuery(departmentId!, {
    skip: !departmentId
  });

  if (isFetching) return <span>Loading...</span>;
  return <span>{department?.name ?? '—'}</span>;
};

const RequestedTestTable: React.FC<Props> = ({
  page = 0,
  size = 10,
  height = 400,
  onRowClick,
  hideActions = false,
  requestType
}) => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);
  const [statusFilter, setStatusFilter] =
    useState<DiagnosticTestRequestStatus | undefined>();

  const [filterRecord, setFilterRecord] = useState<{ status?: string }>({});

  const { data: requestsResponse, isFetching, refetch } =
    useFilterDiagnosticTestRequestsQuery({
      type: requestType,
      page,
      size,
      sort: 'createdDate,desc',
      ...(filterRecord.status ? { status: filterRecord.status } : {})
    });

  const [deleteRequest] = useDeleteDiagnosticTestRequestMutation();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<any>(null);
  const [approveRequest] = useApproveDiagnosticTestRequestMutation();
  const [rejectRequest] = useRejectDiagnosticTestRequestMutation();
  const [openRejectedModal, setOpenRejectedModal] = useState(false);
  const [test, setTest] = useState<any>({});
  const [openDiagnosticsModal, setOpenDiagnosticsModal] = useState(false);
  const [selectedDiagnosticTestId, setSelectedDiagnosticTestId] = useState<number | null>(null);



  const confirmDelete = async () => {
    if (!selectedRequest?.id) return;

    try {
      await deleteRequest(selectedRequest.id).unwrap();

      dispatch(
        notify({
          msg: 'Request deleted successfully',
          sev: 'success'
        })
      );

      setDeleteModalOpen(false);
      setSelectedRequest(null);
      refetch();
    } catch (e: any) {
      let message = 'Failed to delete request';

      if (e?.data?.message) {
        message = e.data.message?.startsWith('error.')
          ? e.data.message.replace('error.', '')
          : e.data.message;
      } else if (e?.status === 403) {
        message = 'Only the creator can delete this request';
      }

      dispatch(
        notify({
          msg: message,
          sev: 'warning'
        })
      );
    }
  };

  const handleApproveConfirm = async () => {
    if (!approveTarget?.id) return;

    try {
      await approveRequest(approveTarget.id).unwrap();

      dispatch(
        notify({
          msg: 'Request approved successfully',
          sev: 'success'
        })
      );

      setApproveModalOpen(false);
      setApproveTarget(null);
      refetch();
    } catch (e: any) {
      dispatch(
        notify({
          msg: e?.data?.message ?? 'Approve failed',
          sev: 'error'
        })
      );
    }
  };

  const handleRejectedTest = async () => {
    if (!test?.id) return;

    if (!test?.rejectedReason?.trim()) {
      dispatch(
        notify({
          msg: 'Please enter rejection reason',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      await rejectRequest({
        id: test.id,
        body: { rejectedReason: test.rejectedReason }
      }).unwrap();

      dispatch(
        notify({
          msg: 'Request rejected successfully',
          sev: 'success'
        })
      );

      setOpenRejectedModal(false);
      setTest({});
      refetch();
    } catch (e: any) {
      dispatch(
        notify({
          msg: e?.data?.message ?? 'Reject failed',
          sev: 'error'
        })
      );
    }
  };

    const UserFullNameCell = ({ login }: { login?: string | null }) => {
      const { data: fullName } = useGetUserFullNameByLoginQuery(login!, {
        skip: !login
      });

      return <>{fullName || login || '-'}</>;
    };

    const UserDateCell = ({
      login,
      date
    }: {
      login?: string | null;
      date?: string | null;
    }) => (
      <>
        <UserFullNameCell login={login} />
        <br />
        <span className="date-table-style">
          {date ? formatDateWithoutSeconds(date) : '-'}
        </span>
      </>
    );

  const tableColumns = useMemo(
    () => [
      {
        key: 'type',
        title: <Translate>Type</Translate>,
        flexGrow: 1,
        render: (row: any) => <>{formatEnumString(row.type ?? '—')}</>
      },
      {
        key: 'name',
        title: <Translate>Name</Translate>,
        flexGrow: 1
      },
      {
        key: 'indication',
        title: <Translate>Request Reason</Translate>,
        flexGrow: 2
      },
      {
        key: 'status',
        title: <Translate>Status</Translate>,
        flexGrow: 1,
        render: (row: any) => <>{formatEnumString(row.status ?? '—')}</>
      },
      {
        key: 'fromDepartmentId',
        title: <Translate>From Department</Translate>,
        width: 180,
        render: (row: any) => <DepartmentCell departmentId={row.fromDepartmentId} />
      },
      {
        key: 'actions',
        title: <Translate>Actions</Translate>,
        width: 160,
        // align: 'center',
        render: (row: any) => {
          const requested = row.status === 'REQUESTED';

          return (
            <div className='request-test-icons-contianer-handle'>
              <Whisper
                placement="top"
                speaker={<Tooltip>Approve</Tooltip>}
                trigger="hover"
              >
                <span>
                  <FontAwesomeIcon
                    className='icon-radiologist-worklist-size'
                    icon={faCheckCircle}
                    style={{
                      cursor: 'pointer',
                      opacity: 1,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setApproveTarget(row);
                      setTest(row);
                      setApproveModalOpen(true);
                    }}
                  />
                </span>
              </Whisper>
              <Whisper
                placement="top"
                speaker={<Tooltip>Reject</Tooltip>}
                trigger="hover"
              >
                <span>
                  <WarningRoundIcon
                    className='icon-radiologist-worklist-size'
                    style={{
                      cursor: requested ? 'pointer' : 'not-allowed',
                      opacity: requested ? 1 : 0.4,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!requested) return;

                      setTest(row);
                      setOpenRejectedModal(true);
                    }}
                  />
                </span>
              </Whisper>
              <Whisper
                placement="top"
                speaker={<Tooltip>Open Diagnostic Test</Tooltip>}
                trigger="hover"
              >
                <span>
                  <MdOutlineDescription
                    size={24}
                    className="icon-radiologist-worklist-size"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTest(row);
                      setSelectedDiagnosticTestId(row.diagnosticTestId);
                      setOpenDiagnosticsModal(true);
                    }}
                  />
                </span>
              </Whisper>
            </div>
          );
        }
      },
      {
        key: 'createdAtBy',
        title: 'Requested by/at',
        dataKey: 'createdByAt',
        width: 150,
        expandable: true,
        render: (row: any) => (
          <UserDateCell
            login={row?.createdBy}
            date={row?.createdDate}
          />
        )
      }
    ],
    [hideActions]
  );


// Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <>
  <div dir={dir}>
      <MyTable
        columns={tableColumns}
        data={requestsResponse?.data || []}
        loading={isFetching}
        height={height}
        filters={
          <Form fluid>
            <MyInput
              fieldType="select"
              fieldName="status"
              fieldLabel="Status"
              record={filterRecord}
              setRecord={setFilterRecord}
              selectData={[
                { label: 'Requested', value: 'REQUESTED' },
                { label: 'Approved', value: 'APPROVED' },
                { label: 'Rejected', value: 'REJECTED' }
              ]}
              selectDataLabel="label"  
              selectDataValue="value"
              cleanable
            />  
          </Form>
        }
        rowClassName={rowData =>
          rowData && rowData.id === test?.id ? 'selected-row' : ''
        }
        onRowClick={(row) => {
          setTest(row)
        }}
      />

      <DeletionConfirmationModal
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        itemToDelete="test request"
        actionType="delete"
        actionButtonFunction={confirmDelete}
        confirmationQuestion={`Are you sure you want to delete "${selectedRequest?.name}"?`}
      />

      <ApproveRequestModal
        open={approveModalOpen}
        setOpen={setApproveModalOpen}
        request={approveTarget}
        onConfirm={handleApproveConfirm}
      />


      {test && (
        <CancellationModal
          open={openRejectedModal}
          setOpen={setOpenRejectedModal}
          fieldName="rejectedReason"
          handleCancle={handleRejectedTest}
          object={test}
          setObject={setTest}
          fieldLabel="Reject Reason"
          title="Reject"
          required
        />
      )}

      <MyModal
        open={openDiagnosticsModal}
        setOpen={setOpenDiagnosticsModal}
        title="Diagnostic Test"
        size="90vw"
        bodyheight="85vh"
        hideCancel={false}
        hideBack
        hideActionBtn
        content={() => (
          <DiagnosticsTest testRequest={test} />
        )}
      />
  </div>
    </>
  );
};

export default RequestedTestTable;