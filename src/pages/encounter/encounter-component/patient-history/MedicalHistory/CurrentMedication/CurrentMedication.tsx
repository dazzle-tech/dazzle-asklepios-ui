import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import { useGetActiveIngredientsQuery } from '@/services/setup/activeIngredients/activeIngredientsService';
import { useGetCurrentMedicationsQuery } from '@/services/patients/currentMedicationService';

import PlusIcon from '@rsuite/icons/Plus';
import React, { useMemo, useState } from 'react';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import AddCurrentMedication from './AddCurrentMedication';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';

const CurrentMedication = ({ patient, edit, toShowData = false }) => {
  const [open, setOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<any>(null);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc'
  });

  const { data: medicationsResponse, isLoading } = useGetCurrentMedicationsQuery(
    { patientId: patient?.id, ...pagination },
    { skip: !patient?.id }
  );

  const { data: activeIngredientsResponse, isLoading: isLoadingIngredients } =
    useGetActiveIngredientsQuery({
      page: 0,
      size: 1000
    });


  const activeIngredientMap = useMemo(() => {
    const map = new Map<string, string>();

    activeIngredientsResponse?.data?.forEach(item => {
      map.set(String(item.id), item.name);
    });

    return map;
  }, [activeIngredientsResponse]);


  const isSelected = (row: any) =>
    selectedMedication && row.id === selectedMedication.id ? 'selected-row' : '';

  const handleEdit = (row: any) => {
    setSelectedMedication(row);
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

  const columns = [
    {
      key: 'medication',
      title: 'MEDICATION NAME',
      flexGrow: 4,
      render: (row: any) => <p>{activeIngredientMap.get(String(row.activeIngredientId)) ?? ''}</p>
    },
    {
      key: 'instructions',
      title: 'INSTRUCTIONS',
      flexGrow: 5,
      render: (row: any) => <p>{row.instructions ?? ''}</p>
    },
    {
      key: 'startDate',
      title: 'START DATE',
      flexGrow: 3,
      render: (row: any) => (row?.startDate ? new Date(row.startDate).toLocaleDateString() : '')
    },
            {
          key: 'createdDate',
          title: <Translate>CREATED AT / BY</Translate>,
          expandable: true,
          render: (row: any) =>
            row?.createdDate ? (
              <>
                {row?.createdBy} <br />
                <span className="date-table-style">{formatDateWithoutSeconds(row.createdDate)}</span>
              </>
            ) : (
              ''
            )
        },
    ...(!toShowData
      ? [
          {
            key: 'actions',
            title: '',
            flexGrow: 2,
            render: (row: any) => (
              <div className="container-of-icons">
                <MdModeEdit
                  className="icons-style"
                  size={22}
                  fill="var(--primary-gray)"
                  onClick={() => handleEdit(row)}
                />

              </div>
            )
          }
        ]
      : [])
  ];

  const tableData = useMemo(() => medicationsResponse?.data ?? [], [medicationsResponse]);
  const totalCount = medicationsResponse?.totalCount ?? 0;

  return (
    <div className="medical-container-div">
      <SectionContainer
        title={<>Current Medication</>}
        action={
          !toShowData && (
            <MyButton
              disabled={edit}
              prefixIcon={() => <PlusIcon />}
              onClick={() => {
                setSelectedMedication(null);
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
              loading={isLoading || isLoadingIngredients}
              columns={columns}
              rowClassName={isSelected}
              page={pagination.page}
              rowsPerPage={pagination.size}
              totalCount={totalCount}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />

            <AddCurrentMedication
              open={open}
              initialData={selectedMedication}
              patient={patient}
              setOpen={() => {
                setOpen(false);
                setSelectedMedication(null);
              }}
            />

          </>
        }
      />
    </div>
  );
};

export default CurrentMedication;
