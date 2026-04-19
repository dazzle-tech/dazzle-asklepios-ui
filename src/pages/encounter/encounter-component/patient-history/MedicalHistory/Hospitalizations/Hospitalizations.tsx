import PlusIcon from '@rsuite/icons/Plus';
import React, { useState } from 'react';
import { MdDelete, MdModeEdit } from 'react-icons/md';

import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import AddHospitalizations from './AddHospitalizations';

import {
  useDeleteHospitalizationMutation,
  useGetHospitalizationsQuery
} from '@/services/patients/hospitalizationsService';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import '../styles.less';
import Translate from '@/components/Translate';

const Hospitalizations = ({ patient, edit, toShowData = false }) => {
  const dispatch = useAppDispatch();

  /*  STATE  */

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);

  /*  API  */

  const patientId = Number(patient?.id);
  const isValidPatientId = Number.isFinite(patientId) && patientId > 0;

  const { data, isFetching } = useGetHospitalizationsQuery(
    {
      patientId,
      page,
      size,
      sort: 'id,desc'
    },
    { skip: !isValidPatientId }
  );

  const [deleteHospitalization] = useDeleteHospitalizationMutation();

  /*  ACTIONS  */

  const handleEdit = (row: any) => {
    setSelectedRow(row);
    setOpen(true);
  };


  /*  TABLE  */

  const columns = [
    {
      key: 'facility',
      title: 'FACILITY',
      flexGrow: 3,
      dataKey: 'facility'
    },
    {
      key: 'reason',
      title: 'REASON',
      flexGrow: 3,
      dataKey: 'reason'
    },
    {
      key: 'admissionType',
      title: 'ADMISSION TYPE',
      flexGrow: 3,
      dataKey: 'admissionType'
    },
    {
      key: 'dateOfAdmission',
      title: 'DATE OF ADMISSION',
      flexGrow: 3,
      render: (row: any) =>
        row?.dateOfAdmission ? new Date(row.dateOfAdmission).toLocaleDateString() : ''
    },
    {
      key: 'lengthOfStayDays',
      title:<span><Translate>LENGTH OF STAY</Translate><Translate>(Days)</Translate></span>,
      flexGrow: 2,
      dataKey: 'lengthOfStayDays'
    },
    {
      key: 'outcomes',
      title: 'OUTCOMES',
      flexGrow: 3,
      dataKey: 'outcomes'
    },
    {
      key: 'medicalInterventionsPerformed',
      title: 'MEDICAL INTERVENTIONS PERFORMED',
      flexGrow: 4,
      dataKey: 'medicalInterventionsPerformed'
    },
    ...(!toShowData
      ? [
          {
            key: 'actions',
            title: '',
            flexGrow: 1,
            render: (row: any) => (
              <div style={{ display: 'flex', gap: 12 }}>
                <MdModeEdit
                  size={22}
                  fill="var(--primary-gray)"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleEdit(row)}
                />
              </div>
            )
          }
        ]
      : [])
  ];

  /*  PAGINATION  */

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  /*  RENDER  */

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div className="medical-container-div" dir={dir}>
      <SectionContainer
        title="Hospitalizations"
        action={
          !toShowData && (
            <MyButton
              disabled={edit}
              prefixIcon={() => <PlusIcon />}
              onClick={() => {
                setSelectedRow(null);
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
              data={data?.data ?? []}
              loading={isFetching}
              columns={columns}
              page={page}
              rowsPerPage={size}
              totalCount={data?.totalCount ?? 0}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />

            <AddHospitalizations
              open={open}
              setOpen={() => {
                setOpen(false);
                setSelectedRow(null);
              }}
              initialData={selectedRow}
              patient={patient}
            />

          </>
        }
      />
    </div>
  );
};

export default Hospitalizations;
