import React, { useState } from 'react';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import '../styles.less';
import MyTable from '@/components/MyTable';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import AddFamilyHistory from './AddFamilyHistory';
import SectionContainer from '@/components/SectionsoContainer';
import { useGetPatientFamilyHistoryQuery } from '@/services/patientService';
import { initialListRequest } from '@/types/types';
import { formatDateWithoutSeconds, conjureValueBasedOnKeyFromList } from '@/utils';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useRemovePatientFamilyHistoryMutation } from "@/services/patientService";
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

const FamilyHistory = ({ patient, encounter, edit,
  toShowData=false
 }) => {
  const dispatch = useAppDispatch();

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);



  const [listRequestFamilyHistory, setListRequestFamilyHistory] = useState({
    ...initialListRequest,
    pageSize: 15,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key
      },
    ]
  });

    const { data: familyHistoryData, isLoading } = useGetPatientFamilyHistoryQuery(listRequestFamilyHistory);


  const { data: relationLov } = useGetLovValuesByCodeQuery('RELATION');

  const [removeFamilyHistory] = useRemovePatientFamilyHistoryMutation();

const handleDelete = (row) => {
  if (!row?.key) return;

  removeFamilyHistory({ key: row.key })
    .unwrap()
    .then(() => {
      dispatch(notify({ msg: "Deleted successfully", sev: "success" }));
      setListRequestFamilyHistory({
        ...listRequestFamilyHistory,
        timestamp: new Date().getTime(),
      });
    })
    .catch(() => {
      dispatch(notify({ msg: "Delete failed", sev: "error" }));
    });
};




  const handleEdit = (row) => {
    setSelectedRow(row);
    setOpen(true);
  };

  const columns = [
    { key: 'condition', title: 'CONDITION', flexGrow: 4, dataKey: 'condition' },

    {
      key: 'relationLkey',
      title: 'RELATION',
      flexGrow: 3,
      render: row =>
        conjureValueBasedOnKeyFromList(
          relationLov?.object ?? [],
          row.relationLkey,
          'lovDisplayVale'
        )
    },

    {
      key: 'inheritedDiseases',
      title: 'INHERITED DISEASES',
      flexGrow: 3,
      render: row => (row.inheritedDiseases ? 'Yes' : 'No')
    },
   ...(!toShowData ? [{
    key: 'actions',
    title: '',
    flexGrow: 1,
    render: (row) => (
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
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

  const isSelected = row => {
    if (row && selectedProblem && row.key === selectedProblem.key) return 'selected-row';
    return '';
  };


    const handlePageChange = (_: unknown, newPage: number) => {
    setListRequestFamilyHistory({ ...listRequestFamilyHistory, pageNumber: newPage + 1 });
    };

    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequestFamilyHistory({
        ...listRequestFamilyHistory,
        pageSize: parseInt(event.target.value, 10),
        pageNumber: 1
    });
    };


  const pageIndexFamilyHistory = listRequestFamilyHistory.pageNumber - 1;
  const rowsPerPageFamilyHistory = listRequestFamilyHistory.pageSize;
  const totalCountFamilyHistory = familyHistoryData?.extraNumeric ?? 0;


  return (
    <div className="medical-container-div">
      <SectionContainer
        title={
          <>
            Family History
         {! toShowData&& <MyButton disabled={edit} prefixIcon={() => <PlusIcon />} onClick={() => setOpen(true)}>
              Add
            </MyButton>
        }
          </>
        }
        content={
          <>
            <MyTable
              height={450}
              data={familyHistoryData?.object ?? []}
              loading={isLoading}
              columns={columns}
              rowClassName={isSelected}
              page={pageIndexFamilyHistory}
              rowsPerPage={rowsPerPageFamilyHistory}
              totalCount={totalCountFamilyHistory}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />

            <AddFamilyHistory
              open={open}
              setOpen={() => {
                setSelectedRow(null);
                setOpen(false);
                setListRequestFamilyHistory({
                  ...listRequestFamilyHistory,
                  timestamp: new Date().getTime(),
                });
              }}
              initialData={selectedRow}
              patient={patient}
            />

                <DeletionConfirmationModal
                open={openDeleteModal}
                setOpen={setOpenDeleteModal}
                itemToDelete="Family History"
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

export default FamilyHistory;
