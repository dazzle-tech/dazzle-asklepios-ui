import PlusIcon from '@rsuite/icons/Plus';
import React, { useState } from 'react';
import { MdModeEdit } from 'react-icons/md';

import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import AddSurgicalHistory from './AddSurgicalHistory';

import {
  useDeleteSurgicalHistoryMutation,
  useGetSurgicalHistoryQuery
} from '@/services/patients/surgicalHistoryService';

import { conjureValueBasedOnKeyFromList } from '@/utils';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import '../styles.less';

const SurgicalHistory = ({ patient, edit, toShowData = false }) => {
  const { data: anesthesiaLov } = useGetLovValuesByCodeQuery('ANESTH_TYPES');
  const { data: complicationsLov } = useGetLovValuesByCodeQuery('PROC_COMPLIC');

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);

  const patientId = Number(patient?.id);
  const isValidPatientId = Number.isFinite(patientId) && patientId > 0;

  const { data, isFetching } = useGetSurgicalHistoryQuery(
    { patientId, page, size, sort: 'id,desc' },
    { skip: !isValidPatientId }
  );

  const handleEdit = (row: any) => {
    setSelectedRow(row);
    setOpen(true);
  };

  const columns = [
    { key: 'surgery', title: 'SURGERY', flexGrow: 3 },
    {
      key: 'dateOfSurgery',
      title: 'DATE OF SURGERY',
      flexGrow: 3,
      render: (row: any) =>
        row?.dateOfSurgery ? new Date(row.dateOfSurgery).toLocaleDateString() : ''
    },
    { key: 'facility', title: 'FACILITY', flexGrow: 3 },
    {
      key: 'anesthesiaType',
      title: 'ANESTHESIA TYPE',
      flexGrow: 3,
      render: (row: any) => {
        const value = conjureValueBasedOnKeyFromList(
          anesthesiaLov?.object ?? [],
          row?.anesthesiaType,
          'lovDisplayVale'
        );

        return value ?? row?.anesthesiaType ?? '';
      }
    },
    {
      key: 'complications',
      title: 'COMPLICATIONS',
      flexGrow: 3,
      render: (row: any) => {
        const value = conjureValueBasedOnKeyFromList(
          complicationsLov?.object ?? [],
          row?.complications,
          'lovDisplayVale'
        );

        return value ?? row?.complications ?? '';
      }
    },
    {
      key: 'hasImplantsOrDevices',
      title: 'IMPLANTS / DEVICES',
      flexGrow: 3,
      render: row => (row?.hasImplantsOrDevices ? row?.implantsOrDevicesDescription : 'No')
    },
    ...(!toShowData
      ? [
          {
            key: 'actions',
            title: '',
            flexGrow: 1,
            render: row => (
              <div className="flex-gap-12">
                <MdModeEdit
                  size={22}
                  fill="var(--primary-gray)"
                  className="pointer"
                  onClick={() => handleEdit(row)}
                />
              </div>
            )
          }
        ]
      : [])
  ];

  const handlePageChange = (_: unknown, newPage: number) => setPage(newPage);
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSize(parseInt(e.target.value, 10));
    setPage(0);
  };

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div className="medical-main-container" dir={dir}>
      <div className="medical-container-div" dir={dir}>
        <SectionContainer
          title="Surgical History"
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

              <AddSurgicalHistory
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
    </div>
  );
};

export default SurgicalHistory;
