import React, { useState } from 'react';
import FullViewTable from './FullViewTable';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import Section from '@/components/Section';
import { useGetVitalSignsBetweenDatesByPatientIdQuery } from '@/services/medicalsheetsEncounter/observations/vitalSignsService';
import { formatDate } from '@/utils';
const PreObservation = ({ patient }) => {
  const [open, setOpen] = useState(false);
  const patientId = Number(patient?.id);
  const {
    data: vitalPage,
    isLoading: vitalLoading,
    isFetching: vitalFetching,
  } = useGetVitalSignsBetweenDatesByPatientIdQuery(
    patientId
      ? {
        patientId,
      }
      : (undefined as any),
    { skip: !patientId }
  );
  console.log("vitalPage: ", vitalPage);

  const formatDateTime = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const columns = [
    {
      key: 'createdAt',
      title: 'CREATED AT',
      render: (row: any) => {
        const v = row?.createdAt ?? row?.createdDate;
        return v ? formatDateTime(new Date(v)) : '';
      },
    },

    {
      key: 'bloodPressure',
      title: <Translate>BP(mmHg)</Translate>,
      render: (rowData: any) => {
        const systolic = rowData?.bloodPressureSystolic;
        const diastolic = rowData?.bloodPressureDiastolic;

        return systolic && diastolic ? `${systolic}/${diastolic}` : '';
      }
    },
    {
      key: 'temperature',
      title: <Translate>Temp(°C)</Translate>,
      render: (rowData: any) => {
        return rowData?.temperature ? `${rowData.temperature}` : '';
      }
    },
    {
      key: 'pulseRate',
      title: <Translate>Heart Rate(bpm)</Translate>,
    }
  ];

  return (
    <Section
      isContainOnlyTable
      title="Patient Observation"
      content={
        <MyTable data={vitalPage ?? []} columns={columns} height={250} />
      }
      rightLink="Full view"
      setOpen={setOpen}
      openedContent={<FullViewTable open={open} setOpen={setOpen} vitalSignsList={vitalPage || []} formatDateTime={formatDateTime} patient={patient} vitalLoading={vitalLoading} vitalFetching={vitalFetching} />}
    />
  );
};
export default PreObservation;
