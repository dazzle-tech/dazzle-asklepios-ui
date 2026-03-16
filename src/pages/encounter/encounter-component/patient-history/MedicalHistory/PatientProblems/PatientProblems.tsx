import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import {
  useDeletePatientProblemMutation,
  useGetPatientProblemsQuery
} from '@/services/patients/patientProblemService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { conjureValueBasedOnKeyFromList, formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import PlusIcon from '@rsuite/icons/Plus';
import React, { useMemo, useState } from 'react';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import AddPatientProblem from './AddPatientProblem';

const PatientProblems = ({ patient, edit, toShowData = false }) => {
  const dispatch = useAppDispatch();

  const { data: diagnosisTypeLov } = useGetLovValuesByCodeQuery('DIAGNOSIS_TYPE');

  const { data: sourceLov } = useGetLovValuesByCodeQuery('RELATION');

  const [open, setOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<any>(null);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<any>(null);

  const [pagination, setPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc'
  });

  /* QUERY */

  const patientId = Number(patient?.id);
  const isValidPatientId = Number.isFinite(patientId) && patientId > 0;

  const {
    data: pageData,
    isFetching,
    refetch
  } = useGetPatientProblemsQuery(
    {
      patientId,
      page: pagination.page,
      size: pagination.size,
      sort: pagination.sort
    },
    {
      skip: !isValidPatientId
    }
  );

  console.log('PatientProblems pageData:', pageData);
  /* DELETE */
  console.log('Patient Obj ==>', patient);
  const [deletePatientProblem] = useDeletePatientProblemMutation();

  const handleDelete = async () => {
    if (!rowToDelete?.id) return;

    try {
      await deletePatientProblem({ id: rowToDelete.id }).unwrap();
      dispatch(notify({ msg: 'Patient problem deleted successfully', sev: 'success' }));
      setOpenDeleteModal(false);
      setRowToDelete(null);
    } catch (err: any) {
      const data = err?.data;
      const traceId = data?.traceId || data?.requestId;
      dispatch(
        notify({
          msg: `Failed to delete patient problem${traceId ? `\nTrace ID: ${traceId}` : ''}`,
          sev: 'error'
        })
      );
    }
  };

  /* HELPERS */

  const isSelected = (row: any) =>
    selectedProblem && row.id === selectedProblem.id ? 'selected-row' : '';

  const handleEdit = (row: any) => {
    setSelectedProblem(row);
    setOpen(true);
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPagination(prev => ({
      ...prev,
      size: parseInt(event.target.value, 10),
      page: 0
    }));
  };

  /* TABLE */

  const columns = [
    {
      key: 'condition',
      title: 'CONDITION',
      flexGrow: 4,
      dataKey: 'condition',
      render: row => <p>{formatEnumString(row?.condition)}</p>
    },
    {
      key: 'dateOfDiagnosis',
      title: 'DATE OF DIAGNOSIS',
      flexGrow: 4,
      render: (row: any) =>
        row?.dateOfDiagnosis ? new Date(row.dateOfDiagnosis).toLocaleDateString() : ''
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
        row?.dateOfResolution ? new Date(row.dateOfResolution).toLocaleDateString() : ''
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
      key: 'status',
      title: 'STATUS',
      flexGrow: 3,
      render: (row: any) => <p>{formatEnumString(row?.status)}</p>
    },
    ...(!toShowData
      ? [
          {
            key: 'actions',
            title: '',
            flexGrow: 2,
            render: (row: any) => (
              <div style={{ display: 'flex', gap: 12 }}>
                <MdModeEdit
                  size={22}
                  fill="var(--primary-gray)"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleEdit(row)}
                />
                <MdDelete
                  size={22}
                  fill="var(--primary-pink)"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setRowToDelete(row);
                    setOpenDeleteModal(true);
                  }}
                />
              </div>
            )
          }
        ]
      : [])
  ];

  const tableData = useMemo(() => pageData?.data ?? [], [pageData?.data]);
  const totalCount = pageData?.totalCount ?? 0;

  /* RENDER */

  return (
    <div className="medical-container-div">
      <SectionContainer
        title={<>Patient&apos;s Problems</>}
        action={
          !toShowData && (
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
          )
        }
        content={
          <>
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
              setOpen={() => {
                setOpen(false);
                setSelectedProblem(null);
              }}
            />

            <DeletionConfirmationModal
              open={openDeleteModal}
              setOpen={setOpenDeleteModal}
              itemToDelete="Patient Problem"
              actionType="delete"
              actionButtonFunction={handleDelete}
            />
          </>
        }
      />
    </div>
  );
};

export default PatientProblems;