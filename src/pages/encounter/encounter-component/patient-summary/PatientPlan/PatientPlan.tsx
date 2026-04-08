import MyTable from '@/components/MyTable';
import Section from '@/components/Section';
import Translate from '@/components/Translate';
import React, { useEffect, useState } from 'react';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { useGetEncounterPlansByPatientQuery } from '@/services/medicalsheetsEncounter/clinicalVisit/encounterPlanService';

const PatientPlan = ({ patient, title = null }) => {
  const dispatch = useAppDispatch();

  const [sortColumn, setSortColumn] = useState('createdDate');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: 'createdDate,desc',
    timestamp: Date.now()
  });

  const patientId = patient?.id;

  const {
    data: patientPlan,
    isLoading,
    isFetching
  } = useGetEncounterPlansByPatientQuery(
    {
      patientId,
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort,
      timestamp: paginationParams.timestamp
    },
    {
      skip: !patientId
    }
  );

  useEffect(() => {
    if (!patientId) {
      dispatch(
        notify({
          msg: 'Patient not found',
          sev: 'warning'
        })
      );
    }
  }, [patientId, dispatch]);

  const totalCount = patientPlan?.totalCount ?? 0;
  const tableColumns = [
   
    {
      key: 'planInstructions',
      dataKey: 'instructions',
      title: <Translate>Instructions</Translate>,
      flexGrow: 2,
      render :(row)=> row.planInstructions
    }
  ];

  const handlePageChange = (_event: any, newPage: number) => {
    setPaginationParams(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleSortChange = (newSortColumn: string, newSortType: 'asc' | 'desc') => {
    setSortColumn(newSortColumn);
    setSortType(newSortType);

    setPaginationParams(prev => ({
      ...prev,
      sort: `${newSortColumn},${newSortType}`,
      page: 0,
      timestamp: Date.now()
    }));
  };

  return (
    <Section
      isContainOnlyTable
      title={title ? title : <Translate>Patient Plan</Translate>}
      content={
        <MyTable
          columns={tableColumns}
          totalCount={totalCount}
          loading={isLoading || isFetching}
          data={ patientPlan?.data ?? []}
          page={paginationParams.page}
          rowsPerPage={paginationParams.size}
          onPageChange={handlePageChange}
          onRowsPerPageChange={(e: any) => {
            const newSize = Number(e.target.value);
            setPaginationParams(prev => ({
              ...prev,
              size: newSize,
              page: 0,
              timestamp: Date.now()
            }));
          }}
          sortColumn={sortColumn}
          sortType={sortType}
          onSortChange={handleSortChange}
        />
      }
    />
  );
};

export default PatientPlan;