import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import ViewDiagnosticTestModal from '@/pages/rad-module/requested-tests/ViewDiagnosticTestModal';
import { useCreateDiagnosticTestRequestMutation, useDeleteDiagnosticTestRequestMutation, useFilterDiagnosticTestRequestsQuery, useUpdateDiagnosticTestRequestMutation } from '@/services/diagnosic-order/diagnosticTestRequestService';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetDepartmentByIdQuery } from '@/services/security/departmentService';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useState } from 'react';
import { MdDelete } from "react-icons/md";
import { Divider, Form } from 'rsuite';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';
import './styles.less';

const RequestTestModal = ({
    open,
    setOpen,
    fromDepartmentId,
    fromFacilityId,
    onSuccess,
}: {
    open: boolean;
    setOpen: (v: boolean) => void;
    fromDepartmentId: number | string;
    fromFacilityId: number | string;
    onSuccess?: () => void;
}) => {
    const dispatch = useAppDispatch();

    const auth = useAppSelector(state => state.auth);
    const currentUser = auth?.user?.login;

    const [record, setRecord] = useState<any>({
        type: null,
        name: '',
        indication: '',
    });
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | string | null>(null);

    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedDiagnosticTestId, setSelectedDiagnosticTestId] = useState<string | null>(null);

    const [updateRequest, { isLoading: isUpdating }] =
        useUpdateDiagnosticTestRequestMutation();

    const [deleteRequest, { isLoading: isDeleting }] =
        useDeleteDiagnosticTestRequestMutation();

    const [createRequest, { isLoading }] =
        useCreateDiagnosticTestRequestMutation();

    const TypeResponse = useEnumOptions("TestType");

    const {
        data: requestsResponse,
        isFetching,
        refetch,
    } = useFilterDiagnosticTestRequestsQuery(
        open
            ? {
                fromFacilityId,
                page: 0,
                size: 10,
                sort: 'createdDate,desc',
            }
            : undefined
    );

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
                    sev: 'success',
                })
            );

            setDeleteModalOpen(false);
            setSelectedRequest(null);
            refetch();
        } catch (e: any) {
            let message = 'Failed to delete request';

            if (e?.data?.message) {
                message = e.data.message;

                if (message.startsWith('error.')) {
                    message = message.replace('error.', '');
                }
            } else if (e?.status === 403) {
                message = 'Only the creator can delete this request';
            }

            dispatch(
                notify({
                    msg: message,
                    sev: 'warning',
                })
            );
        }


    };

    const handleSave = async () => {
      if (!record?.type || !record?.name || !record?.indication?.trim()) {
        dispatch(
          notify({
            msg: 'Please fill required fields',
            sev: 'warning'
          })
        );
        return;
      }

      try {
        if (editMode && editingId) {
          const updated = await updateRequest({
            id: editingId,
            body: {
              id: editingId,
              name: record.name,
              type: record.type,
              indication: record.indication ?? ''
            }
          }).unwrap();

          dispatch(
            notify({
              msg: 'Test request updated successfully',
              sev: 'success'
            })
          );

          setRecord({
            type: updated?.type ?? record.type,
            name: updated?.name ?? record.name,
            indication:
              updated?.indication !== null && updated?.indication !== undefined
                ? updated.indication
                : record.indication ?? ''
          });

          setEditMode(false);
          setEditingId(null);
        } else {
          await createRequest({
            name: record.name,
            type: record.type,
            indication: record.indication ?? '',
            fromDepartmentId,
            fromFacilityId
          }).unwrap();

          dispatch(
            notify({
              msg: 'Test request created successfully',
              sev: 'success'
            })
          );

          setRecord({
            type: null,
            name: '',
            indication: ''
          });
        }

        await refetch();

        onSuccess?.();
      } catch (e: any) {
        dispatch(
          notify({
            msg: e?.data?.message?.startsWith('error.')
              ? e.data.message.replace('error.', '')
              : 'Operation failed',
            sev: 'error'
          })
        );
      }
    };

    useEffect(() => {
        if (!open) {
            setRecord({
                type: null,
                name: '',
                indication: '',
            });
        }
    }, [open]);

    const DepartmentCell = ({ departmentId }: { departmentId?: string }) => {
        const { data: department, isFetching } =
            useGetDepartmentByIdQuery(departmentId!, {
                skip: !departmentId,
            });

        if (isFetching) return <span>Loading...</span>;
        return <span>{department?.name ?? '—'}</span>;
    };

    const handleOpenDiagnosticTest = (row: any) => {
        if (!row?.diagnosticTestId) {
            dispatch(
                notify({
                    msg: 'Diagnostic test not linked yet',
                    sev: 'warning'
                })
            );
            return;
        }

        setSelectedDiagnosticTestId(String(row.diagnosticTestId));
        setViewModalOpen(true);
    };

        const UserDateCell = ({
        login,
        date
        }: {
        login?: string;
        date?: string;
        }) => {
        const { data: fullName } = useGetUserFullNameByLoginQuery(login, {
            skip: !login
        });

        if (!date && !login) return null;

        return (
            <>
            {fullName || login || ''}
            <br />
            <span className="date-table-style">
                {date ? formatDateWithoutSeconds(date) : ''}
            </span>
            </>
        );
        };

    const tableColumns: ColumnConfig[] = [
        {
            key: 'type',
            title: <Translate>Type</Translate>,
            render: (row: any) => (
                <>
                    {formatEnumString(
                        row.type ??
                        '—'
                    )}
                </>
            )
        },

        {
            key: 'name',
            title: <Translate>Name</Translate>,
            render: (row: any) => (
                <span
                    style={{
                        color: '#1675e0',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontWeight: 500
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDiagnosticTest(row);
                    }}
                >
                    {row.name}
                </span>
            )
        },
        {
            key: 'indication',
            title: <Translate>Request Reason</Translate>,
        },
        {
            key: 'status',
            title: <Translate>Status</Translate>,
            render: (row: any) => (
                <>
                    {formatEnumString(
                        row.status ??
                        '—'
                    )}
                </>
            )
        },
        {
            key: 'fromDepartmentId',
            title: <Translate>From Department</Translate>,
            width: 180,
            render: (row: any) => (
                <DepartmentCell departmentId={row.fromDepartmentId} />
            ),
        },

        {
            key: 'actions',
            title: <Translate>Actions</Translate>,
            width: 120,
            align: 'center',
            render: row => (
                <MdDelete
                    title="Delete"
                    size={24}
                    fill="var(--primary-pink)"
                    className="icons-style"
                    onClick={() => openDeleteModal(row)}
                />
            ),
        },
        {
        key: 'createdAtBy',
        title: 'Requested by/at',
        dataKey: 'createdByAt',
        width: 150,
        expandable: true,
        render: (row: any) =>
            row?.createdDate ? (
            <UserDateCell
                login={row?.createdBy}
                date={row?.createdDate}
            />
            ) : (
            ' '
            )
        },
    ];



    /* ====================================================== */
    useEffect(() => {
    }, [requestsResponse]);

    useEffect(() => {
        if (requestsResponse?.data?.length) {
        }
    }, [requestsResponse, fromFacilityId]);


    const handleRowClick = (row: any) => {
        if (row.createdBy !== currentUser) {
            dispatch(
                notify({
                    msg: 'You can only edit requests created by you',
                    sev: 'warning',
                })
            );
            return;
        }

        if (row.status !== 'REQUESTED') {
            dispatch(
                notify({
                    msg: 'Only Requested requests can be edited',
                    sev: 'warning',
                })
            );
            return;
        }


        setEditMode(true);
        setEditingId(row.id);

        const selectedType =
            TypeResponse?.find(t => t.value === row.type)?.value ?? null;

        setRecord({
            type: selectedType,
            name: row.name,
            indication: row.indication ?? '',
        });
    };


    const handleClear = () => {
        setRecord({
            type: null,
            name: '',
            indication: '',
        });

        setEditMode(false);
        setEditingId(null);
    };


    useEffect(() => {
        if (!viewModalOpen) {
            setSelectedDiagnosticTestId(null);
        }
    }, [viewModalOpen]);

  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

    return (
    <div dir={dir}>
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Request Diagnostic Test"
            pagesCount={1}
            actionButtonLabel="Save"
            actionButtonFunction={handleSave}
            hideActionBtn
            isDisabledActionBtn={isLoading}
            content={() => (
                <>
                <div dir={dir}>
                    <Form fluid>
                        <div className='request-test-modal-main-inputs-container'>
                            <MyInput
                                required
                                fieldName="type"
                                fieldType="select"
                                selectData={TypeResponse ?? []}
                                selectDataLabel="label"
                                selectDataValue="value"
                                fieldLabel="Type"
                                record={record}
                                setRecord={setRecord}
                                width="20vw"
                            />

                            <MyInput
                                fieldName="name"
                                fieldType="text"
                                record={record}
                                setRecord={setRecord}
                                required
                                fieldLabel="Name"
                                placeholder="Enter test name"
                                width="20vw"
                            />

                            <MyInput
                                fieldName="indication"
                                fieldType="textarea"
                                record={record}
                                setRecord={setRecord}
                                fieldLabel="Request Reason"
                                placeholder="Enter clinical indication"
                                width="100%"
                                required
                            />
                        </div>
                        <div className='request-test-modal-main-button-container'>
                            <MyButton
                                appearance="ghost"
                                onClick={handleClear}
                            >
                                Clear
                            </MyButton>

                            <MyButton
                                onClick={handleSave}
                            >
                                {editMode ? 'Update' : 'Save'}
                            </MyButton>
                        </div>
                    </Form>

                    <Divider />

                    <MyTable
                        columns={tableColumns}
                        data={requestsResponse?.data || []}
                        loading={isFetching}
                        height={250}
                        onRowClick={handleRowClick}
                    />
                    
                    <DeletionConfirmationModal
                        open={deleteModalOpen}
                        setOpen={setDeleteModalOpen}
                        itemToDelete="test request"
                        actionType="delete"
                        actionButtonFunction={confirmDelete}
                        confirmationQuestion={`Are you sure you want to delete "${selectedRequest?.name}"?`}
                    />

                    <ViewDiagnosticTestModal
                        open={viewModalOpen}
                        setOpen={setViewModalOpen}
                        diagnosticTestId={selectedDiagnosticTestId}
                    />
                </div>
                </>
            )}
        />
    </div>
    );
};

export default RequestTestModal;
