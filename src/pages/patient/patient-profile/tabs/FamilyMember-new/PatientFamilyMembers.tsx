// PatientFamilyMembers.tsx
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import React, { useMemo, useState } from 'react';
import 'react-tabs/style/react-tabs.css';
import { faTrash, faUserPen } from '@fortawesome/free-solid-svg-icons';
import '../styles.less';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PlusRound } from '@rsuite/icons';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import AddFamilyMember from './AddFamilyMember';

// ✅ new services
import {
  useGetPatientRelationsByPatientQuery,
  useDeletePatientRelationMutation,
} from '@/services/patients/PatientRelationService';
import { formatEnumString } from '@/utils';

const PatientFamilyMembers = ({ localPatient }) => {
    console.log('Rendering PatientFamilyMembers with localPatient:', localPatient);
  const dispatch = useAppDispatch();

  const [relationModalOpen, setRelationModalOpen] = useState(false);
  const [deleteRelativeModalOpen, setDeleteRelativeModalOpen] = useState(false);
  const [selectedPatientRelation, setSelectedPatientRelation] = useState<any>(null);

  // server-side pagination
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: 'id,desc',
    timestamp: Date.now(),
  });

  const { data, isFetching, refetch } = useGetPatientRelationsByPatientQuery(
    { patientId: localPatient?.id, ...paginationParams },
    { skip: !localPatient?.id }
  );

  const relations = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;

  const [deleteRelation] = useDeletePatientRelationMutation();

  const columns = useMemo(
    () => [
      {
        key: 'relationType',
        title: <Translate>Relation Type</Translate>,
        flexGrow: 4,
        render: (row: any) =>formatEnumString(row?.relationType), // enum name
      },
      {
        key: 'relativePatientName',
        title: <Translate>Relative Patient Name</Translate>,
        flexGrow: 4,
        render: (row: any) =>
          row?.relativePatient?.firstName ??
      
          '',
      },
      {
        key: 'categoryType',
        title: <Translate>Relation Category</Translate>,
        flexGrow: 4,
        render: (row: any) => formatEnumString(row?.categoryType),
      },
    ],
    []
  );

  const isSelectedRelation = (rowData: any) =>
    selectedPatientRelation?.id === rowData?.id ? 'selected-row' : '';

  const handleDeleteRelation = async () => {
    if (!selectedPatientRelation?.id) return;

    try {
      await deleteRelation(selectedPatientRelation.id).unwrap();
      dispatch(notify({ msg: 'Relation deleted successfully', sev: 'success' }));
      setSelectedPatientRelation(null);
      setDeleteRelativeModalOpen(false);
      refetch();
    } catch (e) {
      dispatch(notify({ msg: 'Failed to delete relation', sev: 'error' }));
    }
  };

  const handleNewRelative = () => {
    setSelectedPatientRelation(null);
    setRelationModalOpen(true);
  };

  const handleEditRelative = () => {
    if (!selectedPatientRelation?.id) return;
    setRelationModalOpen(true);
  };

  return (
    <div className="tab-main-container">
      <div className="tab-content-btns">
        <MyButton
          onClick={handleNewRelative}
          disabled={!localPatient?.id}
          prefixIcon={() => <PlusRound />}
        >
          New Relative
        </MyButton>

        <MyButton
          disabled={!selectedPatientRelation?.id}
          onClick={handleEditRelative}
          prefixIcon={() => <FontAwesomeIcon icon={faUserPen} />}
        >
          Edit
        </MyButton>

        <MyButton
          disabled={!selectedPatientRelation?.id}
          onClick={() => setDeleteRelativeModalOpen(true)}
          prefixIcon={() => <FontAwesomeIcon icon={faTrash} />}
        >
          Delete
        </MyButton>
      </div>

      <AddFamilyMember
        open={relationModalOpen}
        setOpen={setRelationModalOpen}
        localPatient={localPatient}
        selectedPatientRelation={selectedPatientRelation}
        setSelectedPatientRelation={setSelectedPatientRelation}
        refetch={refetch}
      />

      <MyTable
        height={450}
        data={relations}
        loading={isFetching}
        columns={columns}
        rowClassName={isSelectedRelation}
        onRowClick={(rowData) => setSelectedPatientRelation(rowData)}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        totalCount={totalCount}
        onPageChange={(_, newPage: number) =>
          setPaginationParams((p) => ({ ...p, page: newPage }))
        }
        onRowsPerPageChange={(e) => {
          const newSize = Number(e.target.value);
          setPaginationParams((p) => ({ ...p, size: newSize, page: 0 }));
        }}
        sortColumn={paginationParams.sort.split(',')[0]}
        sortType={paginationParams.sort.split(',')[1] as any}
        onSortChange={(sortColumn, sortType) => {
          if (!sortColumn) return;
          setPaginationParams((p) => ({
            ...p,
            sort: `${sortColumn},${sortType}`,
            page: 0,
          }));
        }}
      />

      <DeletionConfirmationModal
        open={deleteRelativeModalOpen}
        setOpen={setDeleteRelativeModalOpen}
        itemToDelete="Relation"
        actionButtonFunction={handleDeleteRelation}
        actionType="Delete"
      />
    </div>
  );
};

export default PatientFamilyMembers;
