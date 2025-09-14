import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useGetEncounterByIdQuery } from '@/services/encounterService';
import { useGetProceduresQuery } from '@/services/procedureService';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState } from 'react';
import { Divider, Text } from 'rsuite';
import FullViewTable from './FullViewTable';
import { formatDateWithoutSeconds } from '@/utils';
import Section from '@/components/Section';
const Procedures = ({ patient }) => {
  const [open, setOpen] = useState(false);

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient.key
      }
    ]
  });
  const {
    data: procedures,
    refetch: proRefetch,
    isLoading: procedureLoding
  } = useGetProceduresQuery(listRequest);
  const columns = [
    {
      key: 'procedureId',
      dataKey: 'procedureId',
      title: <Translate>PROCEDURE ID</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.procedureId;
      }
    },
    {
      key: 'procedureName',
      dataKey: 'procedureName',
      title: <Translate>Procedure Name</Translate>,
      flexGrow: 1
    }
  ];
  return (
    <Section
      title="Procedures"
      content={<MyTable data={procedures?.object || []} columns={columns} height={250} />}
      rightLink="Full view"
      setOpen={setOpen}
      openedContent={
        <FullViewTable open={open} setOpen={setOpen} procedures={procedures?.object} />
      }
    />
  );
};
export default Procedures;
