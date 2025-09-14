import React, { useState } from 'react';
import FullViewTable from './FullViewTable';
import MyTable from '@/components/MyTable';
import { Divider, Text } from 'rsuite';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetObservationSummariesQuery } from '@/services/observationService';
import Translate from '@/components/Translate';
import Section from '@/components/Section';
const PreObservation = ({ patient }) => {
  const [open, setOpen] = useState(false);
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key
      }
    ]
  });
  const { data: getObservationSummaries } = useGetObservationSummariesQuery({
    ...listRequest
  });

  const columns = [
    {
      key: 'visitKey',
      title: <Translate>Visit Date</Translate>,
      render: (rowData: any) => {
        return rowData?.encounter?.plannedStartDate || '';
      }
    },
    {
      key: 'latestheight',
      title: <Translate>Height</Translate>,
      render: (rowData: any) => {
        return rowData?.latestheight ? `${rowData.latestheight}cm` : '';
      }
    },
    {
      key: 'latestweight',
      title: <Translate>Weight</Translate>,
      render: (rowData: any) => {
        return rowData?.latestweight ? `${rowData.latestweight}kg` : '';
      }
    },
    {
      key: 'latestbp',
      title: <Translate>BP</Translate>,
      render: (rowData: any) => {
        const systolic = rowData?.latestbpSystolic;
        const diastolic = rowData?.latestbpDiastolic;

        return systolic && diastolic ? `${systolic}/${diastolic} mmHg` : '';
      }
    },
    {
      key: 'latesttemperature',
      title: <Translate>Temp</Translate>,
      render: (rowData: any) => {
        return rowData?.latesttemperature ? `${rowData.latesttemperature}°C` : '';
      }
    }
  ];

  return (
    <Section
    isContainOnlyTable
      title="Patient Observation"
      content={
        <MyTable data={getObservationSummaries?.object ?? []} columns={columns} height={250} />
      }
      rightLink="Full view"
      setOpen={setOpen}
      openedContent={<FullViewTable open={open} setOpen={setOpen} list={getObservationSummaries?.object}/>}
    />
  );
};
export default PreObservation;
