import React, { useEffect, useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import { Form, Divider } from 'rsuite';
import { useCreateDiagnosticTestRequestMutation } from '@/services/diagnosic-order/diagnosticTestRequestService';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import Translate from '@/components/Translate';
import { useFilterDiagnosticTestRequestsQuery } from
    '@/services/diagnosic-order/diagnosticTestRequestService';
import './styles.less';
import { useEnumOptions } from '@/services/enumsApi';
import { useDeleteDiagnosticTestRequestMutation } from
  '@/services/diagnosic-order/diagnosticTestRequestService';
import MyButton from '@/components/MyButton/MyButton';
import TrashIcon from '@rsuite/icons/Trash';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { MdDelete, MdModeEdit } from "react-icons/md";
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { useGetDepartmentByIdQuery } from '@/services/security/departmentService';

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

    const [record, setRecord] = useState<any>({
        type: null,
        name: '',
        indication: '',
    });
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);

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
        if (!record.type || !record.name) {
            dispatch(
                notify({
                    msg: 'Please fill required fields',
                    sev: 'warning',
                })
            );
            return;
        }

        try {
            await createRequest({
                name: record.name,
                type: record.type,
                indication: record.indication,
                fromDepartmentId,
                fromFacilityId,
            }).unwrap();

            dispatch(
                notify({
                    msg: 'Test request created successfully',
                    sev: 'success',
                })
            );
            setRecord("")
            onSuccess?.();
        } catch (e) {
            dispatch(
                notify({
                    msg: 'Failed to create test request',
                    sev: 'error',
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

    /* ================= TABLE (placeholder) ================= */
const tableColumns = [
    {
        key: 'type',
        title: <Translate>Type</Translate>,
        flexGrow: 1,
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
        flexGrow: 1,
    },
    {
        key: 'indication',
        title: <Translate>Indication</Translate>,
        flexGrow: 2,
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
    { key: 'createdAtBy', title: 'Requested by/at', dataKey: 'createdByAt', width: 150, expandable : true,
        render: (row: any) =>
        row?.createdDate ? (
            <>
            {row?.createdBy}
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(row.createdDate)}
            </span>{' '}
            </>
        ) : (
                  ' '
                )},
];



    /* ====================================================== */
    useEffect(() => {
        console.log('requestsResponse', requestsResponse);
    }, [requestsResponse]);

    useEffect(() => {
        if (requestsResponse?.data?.length) {
            console.log('Current facility:', fromFacilityId);
            console.log(
                'Facilities in response:',
                requestsResponse.data.map(r => r.fromFacilityId)
            );
        }
    }, [requestsResponse, fromFacilityId]);

    console.log('fromFacilityId', fromFacilityId);

    return (
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
                                width= "20vw"
                            />

                            <MyInput
                                fieldName="name"
                                fieldType="text"
                                record={record}
                                setRecord={setRecord}
                                required
                                fieldLabel="Name"
                                placeholder="Enter test name"
                                width= "20vw"
                            />

                            <MyInput
                                fieldName="indication"
                                fieldType="textarea"
                                record={record}
                                setRecord={setRecord}
                                fieldLabel="Indication"
                                placeholder="Enter clinical indication"
                                width="100%"
                            />
                        </div>
                        <div className='request-test-modal-main-button-container'>
                        <MyButton onClick={handleSave}>Save</MyButton>
                        </div>
                    </Form>

                    <Divider />

                    <MyTable
                        columns={tableColumns}
                        data={requestsResponse?.data || []}
                        loading={isFetching}
                        height={250}
                    />

                <DeletionConfirmationModal
                open={deleteModalOpen}
                setOpen={setDeleteModalOpen}
                itemToDelete="test request"
                actionType="delete"
                actionButtonFunction={confirmDelete}
                confirmationQuestion={`Are you sure you want to delete "${selectedRequest?.name}"?`}
                />

                </>
            )}
        />
    );
};

export default RequestTestModal;
