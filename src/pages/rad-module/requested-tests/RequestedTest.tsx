import React, { useMemo, useState, useRef } from 'react';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { MdDelete, MdOutlineDescription } from 'react-icons/md';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetDepartmentByIdQuery } from '@/services/security/departmentService';
import {
  useFilterDiagnosticTestRequestsQuery,
  useDeleteDiagnosticTestRequestMutation,
  useSetDiagnosticTestForRequestMutation
} from '@/services/diagnosic-order/diagnosticTestRequestService';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import {
  useApproveDiagnosticTestRequestMutation,
  useRejectDiagnosticTestRequestMutation
} from '@/services/diagnosic-order/diagnosticTestRequestService';
import { MdCheck, MdClose } from 'react-icons/md';
import { Tooltip, Whisper } from 'rsuite';
import './style.less';
import { useCreateDiagnosticTestMutation } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useNavigate } from 'react-router-dom';
import ApproveRequestModal from './ApproveRequestModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import CancellationModal from '@/components/CancellationModal';
import MyModal from '@/components/MyModal/MyModal';
import DiagnosticsTest from '@/pages/setup/diagnostics-tests-definition-new';

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
  const currentUser = auth?.user?.login;
  const navigate = useNavigate();
  const [addDiagnosticTest, addDiagnosticTestMutation] = useCreateDiagnosticTestMutation();

  const TypeResponse = useEnumOptions('TestType');

  const { data: requestsResponse, isFetching, refetch } =
    useFilterDiagnosticTestRequestsQuery({
      type: requestType,
      page,
      size,
      sort: 'createdDate,desc'
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

  const [setDiagnosticTestForRequest] = useSetDiagnosticTestForRequestMutation();

  const openDeleteModal = (row: any) => {
    setSelectedRequest(row);
    setDeleteModalOpen(true);
  };

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
        title: <Translate>Indication</Translate>,
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
                speaker={<Tooltip>Delete</Tooltip>}
                trigger="hover"
              >
                <span>
                  <MdDelete
                    size={28}
                    className="icon-radiologist-worklist-size"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(row);
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
        render: (row: any) =>
          row?.createdDate ? (
            <>
              {row?.createdBy}
              <br />
              <span className="date-table-style">
                {formatDateWithoutSeconds(row.createdDate)}
              </span>
            </>
          ) : (
            ' '
          )
      }
    ],
    [hideActions]
  );

  const internalRowClick = (row: any) => {
    if (onRowClick) {
      onRowClick(row);
      return;
    }
    if (row.createdBy !== currentUser) {
      dispatch(
        notify({
          msg: 'You can only edit requests created by you',
          sev: 'warning'
        })
      );
      return;
    }
  };


  return (
    <>
      <MyTable
        columns={tableColumns}
        data={requestsResponse?.data || []}
        loading={isFetching}
        height={height}
        onRowClick={internalRowClick}
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
          <DiagnosticsTest autoOpenTestId={selectedDiagnosticTestId ?? undefined} mode="restricted" allowedTestId/>
        )}
      />

    </>
  );
};

export default RequestedTestTable;