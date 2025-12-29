import React, { useState, useEffect } from 'react';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import '../styles.less';
import MyTable from '@/components/MyTable';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import AddHospitalizations from './AddHospitalizations';
import SectionContainer from '@/components/SectionsoContainer';
import { useGetPatientHospitalizationQuery, useRemovePatientHospitalizationMutation } from '@/services/patientService';
import { initialListRequest } from '@/types/types';
import { formatDateWithoutSeconds, conjureValueBasedOnKeyFromList } from '@/utils';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

const Hospitalizations = ({ patient, encounter, edit ,
  toShowData=false
}) => {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  // DELETE modal states
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);


  const [listRequestHospitalizations, setListRequestHospitalizations] = useState({
    ...initialListRequest,
    pageSize: 20,
    filters: [
      { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
      { fieldName: 'patient_key', operator: 'match', value: patient?.key }
    ]
  });

  // Update filters when patient key becomes available
  useEffect(() => {
    if (patient?.key) {
      setListRequestHospitalizations(prev => ({
        ...prev,
        filters: [
          { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
          { fieldName: 'patient_key', operator: 'match', value: patient.key }
        ]
      }));
    }
  }, [patient?.key]);

  const { data: hospitalizationsData, isLoading } = useGetPatientHospitalizationQuery(listRequestHospitalizations);

  const { data: admissionTypeLov } = useGetLovValuesByCodeQuery('ADMISSION_TYPE');

  const [removeHospitalization] = useRemovePatientHospitalizationMutation();

  // CONFIRMED DELETE ACTION
  const confirmDelete = () => {
    if (!rowToDelete?.key) return;

    removeHospitalization({
      key: rowToDelete.key,
      patientKey: patient?.key
    })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: "Deleted successfully", sev: "success" }));
        setListRequestHospitalizations(prev => ({
          ...prev,
          timestamp: new Date().getTime(),
          filters: [
            { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
            { fieldName: 'patient_key', operator: 'match', value: patient?.key }
          ]
        }));
      })
      .catch(() => {
        dispatch(notify({ msg: "Delete failed", sev: "error" }));
      })
      .finally(() => {
        setOpenDeleteModal(false);
        setRowToDelete(null);
      });
  };


  const handleEdit = (row) => {
    setSelectedRow(row);
    setOpen(true);
  };

  const columns = [
    { key: 'facility', title: 'FACILITY', flexGrow: 3, dataKey: 'facility' },
    { key: 'reason', title: 'REASON', flexGrow: 3, dataKey: 'reason' },

    {
      key: 'admissionTypeLkey',
      title: 'ADMISSION TYPE',
      flexGrow: 3,
      render: row =>
        conjureValueBasedOnKeyFromList(
          admissionTypeLov?.object ?? [],
          row.admissionTypeLkey,
          'lovDisplayVale'
        )
    },

    {
      key: 'dateOfAdmission',
      title: 'DATE OF ADMISSION',
      flexGrow: 3,
      render: row =>
        row?.dateOfAdmission ? formatDateWithoutSeconds(row.dateOfAdmission) : ''
    },

    { key: 'lengthOfStay', title: 'LENGTH OF STAY', flexGrow: 2, dataKey: 'lengthOfStay' },

    { key: 'outcomes', title: 'OUTCOMES', flexGrow: 3, dataKey: 'outcomes' },

    {
      key: 'medicalInterventionsPerformed',
      title: 'MEDICAL INTERVENTIONS PERFORMED',
      flexGrow: 3,
      dataKey: 'medicalInterventionsPerformed'
    },

  ...(!toShowData ? [{
      key: 'actions',
      title: '',
      flexGrow: 2,
      render: (row) => (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>

          <MdModeEdit
            size={24}
            fill="var(--primary-gray)"
            style={{ cursor: 'pointer' }}
            onClick={() => handleEdit(row)}
          />

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
      ),
    }] : [])
  ];




  const isSelected = row => {
    if (row && selectedProblem && row.key === selectedProblem.key) return 'selected-row';
    return '';
  };


    const handlePageChange = (_: unknown, newPage: number) => {
    setListRequestHospitalizations({ ...listRequestHospitalizations, pageNumber: newPage + 1 });
    };

    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequestHospitalizations({
        ...listRequestHospitalizations,
        pageSize: parseInt(event.target.value, 10),
        pageNumber: 1
    });
    };


  const pageIndex = listRequestHospitalizations.pageNumber - 1;
  const rowsPerPage = listRequestHospitalizations.pageSize;
  const totalCount = hospitalizationsData?.extraNumeric ?? 0;


  return (
    <div className="medical-container-div">
      <SectionContainer
        title={
          <>
            Hospitalizations
          </>
        }
        button={<>
        {!toShowData&&  <MyButton disabled={edit} prefixIcon={() => <PlusIcon />} onClick={() => setOpen(true)}>
              Add
        </MyButton>}
        </>}
        content={
          <>
            <MyTable
              height={450}
              data={hospitalizationsData?.object || []}
              loading={isLoading}
              columns={columns}
              page={pageIndex}
              rowsPerPage={rowsPerPage}
              totalCount={totalCount}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowClassName={isSelected}
            />

            <AddHospitalizations
              open={open}
              setOpen={() => {
                setSelectedRow(null);
                setOpen(false);
                setListRequestHospitalizations({
                  ...listRequestHospitalizations,
                  timestamp: new Date().getTime(),
                  filters: [
                    { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
                    { fieldName: 'patient_key', operator: 'match', value: patient?.key }
                  ]
                });
              }}
              initialData={selectedRow}
              patient={patient}
            />

            <DeletionConfirmationModal
              open={openDeleteModal}
              setOpen={setOpenDeleteModal}
              itemToDelete="Hospitalization"
              actionType="delete"
              actionButtonFunction={confirmDelete}
            />
          </>
        }
      />
    </div>
  );
};

export default Hospitalizations;
