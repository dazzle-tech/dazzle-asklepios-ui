import React, { useState } from 'react';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import '../styles.less';
import MyTable from '@/components/MyTable';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import AddPatientProblem from './AddPatientProblem';
import SectionContainer from '@/components/SectionsoContainer';
import { useGetPatientProblemsQuery, useRemovePatientProblemMutation } from '@/services/patientService';
import { initialListRequest } from '@/types/types';
import { conjureValueBasedOnKeyFromList, formatDateWithoutSeconds } from '@/utils';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

const PatientProblems = ({ patient, encounter, edit,
  toShowData=false
 }) => {

  const dispatch = useAppDispatch();

  const [open, setOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

  const [listRequestPatientProblems, setListRequestPatientProblems] = useState({
    ...initialListRequest,
    pageSize: 15,
    filters: [
      { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
      { fieldName: 'patient_key', operator: 'match', value: patient?.key },
    ],
  });

  const { data: patientProblemsData, isLoading } = useGetPatientProblemsQuery(listRequestPatientProblems);

console.log("Patient Problems Data =>", patientProblemsData?.object);
  const isSelected = row => {
    if (row && selectedProblem && row.key === selectedProblem.key) return 'selected-row';
    return '';
  };

const handlePageChange = (_: unknown, newPage: number) => {
  setListRequestPatientProblems({ ...listRequestPatientProblems, pageNumber: newPage + 1 });
};

const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  setListRequestPatientProblems({
    ...listRequestPatientProblems,
    pageSize: parseInt(event.target.value, 10),
    pageNumber: 1
  });
};


  const handleEdit = row => {
    setSelectedProblem(row);
    setOpen(true);
  };

  // LOVs
  const { data: statusLov } = useGetLovValuesByCodeQuery('ALLERGY_RES_STATUS');
  const { data: typeLov } = useGetLovValuesByCodeQuery('DIAGNOSIS_TYPE');
  const { data: sourceLov } = useGetLovValuesByCodeQuery('RELATION');

  // DELETE MUTATION
  const [removeProblem] = useRemovePatientProblemMutation();

  const handleDelete = (row) => {
    if (!row?.key) return;

    removeProblem({ key: row.key })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: "Deleted successfully", sev: "success" }));

        setListRequestPatientProblems({
          ...listRequestPatientProblems,
          timestamp: new Date().getTime(),
        });
      })
      .catch(() => {
        dispatch(notify({ msg: "Delete failed", sev: "error" }));
      });
  };

  const columns = [
    { key: 'condition', title: 'CONDITION', flexGrow: 4, dataKey: 'condition' },

    {
      key: 'dateOfDiagnosis',
      title: 'DATE OF DIAGNOSIS',
      flexGrow: 4,
      dataKey: 'dateOfDiagnosis',
      render: row =>
        row?.dateOfDiagnosis ? formatDateWithoutSeconds(row.dateOfDiagnosis) : ' ',
    },

    {
      key: 'typeLkey',
      title: 'TYPE',
      flexGrow: 3,
      render: row =>
        conjureValueBasedOnKeyFromList(typeLov?.object ?? [], row.typeLkey, 'lovDisplayVale'),
    },

    {
      key: 'dateOfResolution',
      title: 'DATE OF RESOLUTION',
      flexGrow: 4,
      render: row =>
        row?.dateOfResolution ? formatDateWithoutSeconds(row.dateOfResolution) : ' ',
    },

    {
      key: 'sourceOfInformationLkey',
      title: 'SOURCE OF INFORMATION',
      flexGrow: 4,
      render: row =>
        conjureValueBasedOnKeyFromList(sourceLov?.object ?? [], row.sourceOfInformationLkey, 'lovDisplayVale'),
    },

    {
      key: 'statusLkey',
      title: 'STATUS',
      flexGrow: 3,
      render: row =>
        conjureValueBasedOnKeyFromList(statusLov?.object ?? [], row.statusLkey, 'lovDisplayVale'),
    },

    // ACTIONS COLUMN
   ...(!toShowData ? [{
      key: 'actions',
      title: '',
      flexGrow: 2,
      render: row => (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* EDIT */}
          <MdModeEdit
            size={24}
            fill="var(--primary-gray)"
            style={{ cursor: 'pointer' }}
            onClick={() => handleEdit(row)}
          />

          {/* DELETE */}
          <MdDelete
            size={24}
            fill="var(--primary-pink)"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setRowToDelete(row);
              setOpenDeleteModal(true);
            }}
          />
        </div>
      )
    }] : [])
  ];

  const pageIndex = listRequestPatientProblems.pageNumber - 1;
  const rowsPerPage = listRequestPatientProblems.pageSize;
  const totalCount = patientProblemsData?.extraNumeric ?? 0;
  return (
    <div className="medical-container-div">
      <SectionContainer
        title={
          <>
            Patient's Problems
          { !toShowData&& <MyButton disabled={edit} prefixIcon={() => <PlusIcon />} onClick={() => setOpen(true)}>
              Add
            </MyButton>}
          </>
        }
        content={
          <>
            <MyTable
              height={450}
              data={patientProblemsData?.object ?? []}
              loading={isLoading}
              columns={columns}
              rowClassName={isSelected}
              page={pageIndex}
              rowsPerPage={rowsPerPage}
              totalCount={totalCount}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              
            />






            <AddPatientProblem
              open={open}
              setOpen={() => {
                setSelectedProblem(null);
                setOpen(false);
                setListRequestPatientProblems({ ...listRequestPatientProblems, timestamp: new Date().getTime() });
              }}
              initialData={selectedProblem}
              patient={patient}
            />

            <DeletionConfirmationModal
              open={openDeleteModal}
              setOpen={setOpenDeleteModal}
              itemToDelete="Patient Problem"
              actionType="delete"
              actionButtonFunction={() => {
                if (rowToDelete) {
                  handleDelete(rowToDelete);
                  setOpenDeleteModal(false);
                  setRowToDelete(null);
                }
              }}
            />
          </>
        }
      />
    </div>
  );
};

export default PatientProblems;
