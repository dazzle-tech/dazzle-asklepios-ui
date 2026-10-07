import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import {
  conjureValueBasedOnKeyFromList,
  formatDateWithoutSeconds,
  formatEnumString
} from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import PlusIcon from '@rsuite/icons/Plus';
import React, { useState } from 'react';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import AddPatientProblem from './AddPatientProblem';
import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
import CancellationModal from '@/components/CancellationModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import {
  useGetPatientProblemsQuery,
  useCancelPatientProblemMutation,
  useAddPatientProblemMutation,
  useUpdatePatientProblemMutation
} from '@/services/patients/patientProblemService';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';
import ExpandableText from '@/components/ExpandMore/ExpandableText';
import UserDateCell from '@/components/UserDateCell/UserDateCell';
import { Form, Tooltip, Whisper } from 'rsuite';
const PatientProblems = ({
  patient,
  edit,
  toShowData = false,
  showFreeText = false,
  collapsible = false,
  defaultCollapsed = false
}) => {
  const dispatch = useAppDispatch();

  const { data: diagnosisTypeLov } =
    useGetLovValuesByCodeQuery('DIAGNOSIS_TYPE');

  const { data: sourceLov } =
    useGetLovValuesByCodeQuery('RELATION');

  const [open, setOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<any>(null);

  const [showCancelled, setShowCancelled] = useState(false);
  const [freeTextRecord, setFreeTextRecord] = useState({
    freeText: ''
  });
  const [openCancelModal, setOpenCancelModal] = useState(false);

  const [cancelObject, setCancelObject] = useState<any>({
    id: null,
    status: 'ACTIVE',
    cancellationReason: ''
  });

  const { data: diagnosisStatusLov } =
    useGetLovValuesByCodeQuery('DIAGNOSIS_STATUS');

  const [editingFreeTextId, setEditingFreeTextId] = useState<number | null>(null);

  const [pagination, setPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc'
  });

  const patientId = Number(patient?.id);
  const isValidPatientId =
    Number.isFinite(patientId) && patientId > 0;

  const {
    data: pageData,
    isFetching,
    refetch
  } = useGetPatientProblemsQuery(
    {
      patientId,
      showCancelled,
      page: pagination.page,
      size: pagination.size,
      sort: pagination.sort
    },
    {
      skip: !isValidPatientId
    }
  );

  const [cancelPatientProblem] =
    useCancelPatientProblemMutation();

  const [addPatientProblem, { isLoading: isSavingFreeText }] =
    useAddPatientProblemMutation();


    const [updatePatientProblem, { isLoading: isUpdatingFreeText }] =
  useUpdatePatientProblemMutation();


const handleSaveFreeText = async () => {
  const freeText = freeTextRecord.freeText?.trim();

  if (!freeText) {
    dispatch(
      notify({
        msg: 'Free Text is required.',
        sev: 'warning'
      })
    );
    return;
  }

  if (!isValidPatientId) {
    dispatch(
      notify({
        msg: 'Invalid patient.',
        sev: 'error'
      })
    );
    return;
  }

  try {
    if (editingFreeTextId) {
      await updatePatientProblem({
        id: editingFreeTextId,
        patientId,
        condition: null,
        dateOfDiagnosis: null,
        conditionStatus: null,
        type: null,
        dateOfResolution: null,
        byPatient: null,
        sourceOfInformation: null,
        patientIsFree: true,
        freeText
      }).unwrap();

      dispatch(
        notify({
          msg: 'Free Text updated successfully.',
          sev: 'success'
        })
      );
    } else {
      await addPatientProblem({
        patientId,
        condition: null,
        dateOfDiagnosis: null,
        conditionStatus: null,
        type: null,
        dateOfResolution: null,
        byPatient: null,
        sourceOfInformation: null,
        patientIsFree: true,
        freeText
      }).unwrap();

      dispatch(
        notify({
          msg: 'Free Text saved successfully.',
          sev: 'success'
        })
      );
    }

    setFreeTextRecord({
      freeText: ''
    });

    setEditingFreeTextId(null);

    refetch();
  } catch (error: any) {
    const errorMessage =
      error?.data?.message ||
      error?.data?.detail ||
      error?.error ||
      `Failed to ${editingFreeTextId ? 'update' : 'save'} Free Text.`;

    dispatch(
      notify({
        msg: errorMessage,
        sev: 'error'
      })
    );
  }
};


  const isSelected = (row: any) =>
    selectedProblem && row.id === selectedProblem.id
      ? 'selected-row'
      : '';

const handleEdit = (row: any) => {
  if (row?.patientIsFree === true) {
    setEditingFreeTextId(row.id);

    setFreeTextRecord({
      freeText: row.freeText || ''
    });

    return;
  }

  setSelectedProblem(row);
  setOpen(true);
};

  const openCancelDialog = (row: any) => {
    setCancelObject({
      id: row.id,
      status: row.status || 'ACTIVE',
      cancellationReason: ''
    });

    setOpenCancelModal(true);
  };

  const handleCancel = async () => {
    try {
      await cancelPatientProblem({
        id: cancelObject.id,
        cancellationReason: cancelObject.cancellationReason
      }).unwrap();

      dispatch(
        notify({
          msg: 'Patient Problem cancelled successfully.',
          sev: 'success'
        })
      );

      setOpenCancelModal(false);

      setCancelObject({
        id: null,
        status: 'ACTIVE',
        cancellationReason: ''
      });

      refetch();
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.detail ||
        error?.error ||
        'Failed to cancel Patient Problem.';

      dispatch(
        notify({
          msg: errorMessage,
          sev: 'error'
        })
      );
    }
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPagination(prev => ({
      ...prev,
      size: parseInt(event.target.value, 10),
      page: 0
    }));
  };

  const columns = [
    {
      key: 'freeText',
      title: (
        <div style={{ minWidth: 350, width: '100%' }}>
          <Translate>FREE TEXT</Translate>
        </div>
      ),
      minWidth: 350,
      flexGrow: 3,
      render: (row: any) => {
        if (!row?.patientIsFree) {
          return '-';
        }

        const text = row?.freeText?.trim() || '-';

        return (
          <Whisper
            placement="top"
            trigger="hover"
            speaker={
              <Tooltip
                style={{
                  maxWidth: 500,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {text}
              </Tooltip>
            }
          >
            <div
              style={{
                display: 'block',
                width: '100%',
                minWidth: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere'
              }}
            >
              {text}
            </div>
          </Whisper>
        );
      }
    },
    {
      key: 'condition',
      title: 'CONDITION',
      flexGrow: 4,
      dataKey: 'condition',
      render: (row: any) => (
        <p>{formatEnumString(row?.condition)}</p>
      )
    },
    {
      key: 'dateOfDiagnosis',
      title: 'DATE OF DIAGNOSIS',
      flexGrow: 4,
      render: (row: any) =>
        row?.dateOfDiagnosis
          ? new Date(row.dateOfDiagnosis).toLocaleDateString()
          : ''
    },
    {
      key: 'type',
      title: 'TYPE',
      flexGrow: 3,
      render: (row: any) => {
        const value = conjureValueBasedOnKeyFromList(
          diagnosisTypeLov?.object ?? [],
          row?.type,
          'lovDisplayVale'
        );

        return value ?? row?.type ?? '';
      }
    },
    {
      key: 'dateOfResolution',
      title: 'DATE OF RESOLUTION',
      flexGrow: 4,
      render: (row: any) =>
        row?.dateOfResolution
          ? new Date(row.dateOfResolution).toLocaleDateString()
          : ''
    },
    {
      key: 'sourceOfInformation',
      title: 'SOURCE OF INFORMATION',
      flexGrow: 4,
      render: (row: any) => {
        if (row?.byPatient === true) {
          return 'Patient';
        }

        const value = conjureValueBasedOnKeyFromList(
          sourceLov?.object ?? [],
          row?.sourceOfInformation,
          'lovDisplayVale'
        );

        return value ?? row?.sourceOfInformation ?? '';
      }
    },
    {
      key: 'conditionStatus',
      title: 'CONDITION STATUS',
      flexGrow: 3,
      render: (row: any) => {
        const value = conjureValueBasedOnKeyFromList(
          diagnosisStatusLov?.object ?? [],
          row?.conditionStatus,
          'lovDisplayVale'
        );

        return value ?? row?.conditionStatus ?? '';
      }
    },
    {
      key: 'status',
      title: <Translate>STATUS</Translate>,
      flexGrow: 3,
      render: (row: any) => {
        const status = row?.status ?? 'ACTIVE';

        return (
          <MyBadgeStatus
            contant={formatEnumString(status)}
            color={
              status === 'CANCELLED'
                ? '#dc3545'
                : status === 'ACTIVE'
                  ? '#28a745'
                  : '#6c757d'
            }
          />
        );
      }
    },
    {
      key: 'createdDate',
      title: <Translate>CREATED AT / BY</Translate>,
      expandable: true,
      render: (row: any) => (
        <UserDateCell
          login={row?.createdBy}
          date={row?.createdDate}
        />
      )
    },
    {
      key: 'lastModifiedDate',
      title: <Translate>UPDATED AT / BY</Translate>,
      expandable: true,
      render: (row: any) => (
        <UserDateCell
          login={row?.lastModifiedBy}
          date={row?.lastModifiedDate}
        />
      )
    },
    {
      key: 'cancelledDate',
      title: <Translate>CANCELLED AT / BY</Translate>,
      expandable: true,
      render: (row: any) => {
        if (row?.status !== 'CANCELLED') {
          return <span>-</span>;
        }

        return (
          <UserDateCell
            login={row?.cancelledBy}
            date={row?.cancelledDate}
          />
        );
      }
    },
    {
      key: 'cancellationReason',
      title: <Translate>CANCELLATION REASON</Translate>,
      expandable: true,
      flexGrow: 4,
      render: (row: any) =>
        row?.status === 'CANCELLED' && row?.cancellationReason ? (
          <ExpandableText
            text={row.cancellationReason}
            lines={3}
            maxChars={30}
          />
        ) : (
          '-'
        )
    },
    ...(!toShowData
      ? [
        {
          key: 'actions',
          title: '',
          flexGrow: 2,
          render: (row: any) => (
            <div style={{ display: 'flex', gap: 12 }}>
              {row?.status !== 'CANCELLED' && (
                <>
                  <MdModeEdit
                    className="view-only-action-edit-delete-encounter"
                    size={22}
                    fill="var(--primary-gray)"
                    style={{
                      opacity: edit ? 0.5 : 1,
                      pointerEvents: edit ? 'none' : 'auto',
                      cursor: edit ? 'not-allowed' : 'pointer',
                    }}
                    onClick={() => handleEdit(row)}
                  />

                  <MdDelete
                    className="view-only-action-edit-delete-encounter"
                    size={22}
                    fill="var(--rs-red-500, #f44336)"
                    style={{
                      opacity: edit ? 0.5 : 1,
                      pointerEvents: edit ? 'none' : 'auto',
                      cursor: edit ? 'not-allowed' : 'pointer',
                    }}
                    title="Cancel"
                    onClick={() => openCancelDialog(row)}
                  />
                </>
              )}
            </div>
          )
        }
      ]
      : [])
  ];

const tableData = pageData?.data ?? [];
const totalCount = pageData?.totalCount ?? 0;


  return (
    <div className="medical-container-div">
      <SectionContainer
        collapsible={collapsible}
        defaultCollapsed={defaultCollapsed}
        title={<>Patient&apos;s Problems</>}
        action={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {!toShowData && (
              <MyButton
                disabled={edit}
                prefixIcon={() => <PlusIcon />}
                onClick={() => {
                  setSelectedProblem(null);
                  setOpen(true);
                }}
              >
                Add
              </MyButton>
            )}

            {showFreeText && (
            <MyButton
              disabled={
                edit ||
                isSavingFreeText ||
                isUpdatingFreeText ||
                !freeTextRecord.freeText?.trim()
              }
              onClick={handleSaveFreeText}
            >
              {isSavingFreeText || isUpdatingFreeText
                ? 'Saving...'
                : editingFreeTextId
                  ? 'Update'
                  : 'Save'}
            </MyButton>
            )}
          </div>
        }
              content={
                <>
                  {showFreeText && (
                    <Form
                      fluid
                      formValue={freeTextRecord}
                      onChange={(value: any) => setFreeTextRecord(value)}
                    >
                      <div>
                        <div>
                          <MyInput
                            fieldType="textarea"
                            fieldLabel="Free Text"
                            fieldName="freeText"
                            record={freeTextRecord}
                            setRecord={setFreeTextRecord}
                            disabled={edit || isSavingFreeText}
                            width={"100%"}
                          />
                        </div>


                      </div>
                    </Form>
                  )}

                  <div className="margin-bottom-10 show-cancelled">
                    <MyInput
                      fieldType="check"
                      fieldLabel="Show Cancelled"
                      showLabel={false}
                      fieldName="showCancelled"
                      record={{ showCancelled }}
                      setRecord={(record: any) => {
                        setShowCancelled(record.showCancelled);
                        setPagination(prev => ({
                          ...prev,
                          page: 0
                        }));
                      }}
                    />
                  </div>

                  <MyTable
                    height={450}
                    data={tableData}
                    loading={isFetching}
                    columns={columns}
                    rowClassName={isSelected}
                    page={pagination.page}
                    rowsPerPage={pagination.size}
                    totalCount={totalCount}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                  />

                  <AddPatientProblem
                    open={open}
                    initialData={selectedProblem}
                    patient={patient}
                    onSaved={refetch}
                    setOpen={() => {
                      setOpen(false);
                      setSelectedProblem(null);
                      refetch();
                    }}
                  />

                  <CancellationModal
                    open={openCancelModal}
                    setOpen={() => {
                      setOpenCancelModal(false);
                      setCancelObject({
                        id: null,
                        status: 'ACTIVE',
                        cancellationReason: ''
                      });
                    }}
                    handleCancle={handleCancel}
                    object={cancelObject}
                    setObject={setCancelObject}
                    title="Patient Problem"
                    fieldName="cancellationReason"
                    fieldLabel="Cancellation Reason"
                    statusField="status"
                    statusKey="CANCELLED"
                    withReason
                    required
                    size="33vw"
                  />
                </>
              }
      />
    </div>
  );
};

export default PatientProblems;
