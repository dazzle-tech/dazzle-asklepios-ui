import React, { useState } from 'react';
import FullViewTable from './FullViewTable';
import MyTable from '@/components/MyTable';
import { Divider, Text } from 'rsuite';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetObservationSummariesQuery } from '@/services/observationService';
import Translate from '@/components/Translate';
import Section from '@/components/Section';
import { useGetBodyMeasurementsBetweenDatesByPatientIdQuery } from '@/services/medicalsheetsEncounter/observations/bodyMeasurementsService';
import { useGetVitalSignsBetweenDatesByPatientIdQuery } from '@/services/medicalsheetsEncounter/observations/vitalSignsService';
const PreObservation = ({ patient }) => {
  const [open, setOpen] = useState(false);
  const patientId = Number(patient?.id);
   const [bodyTableReq, setBodyTableReq] = useState({
      page: 0,
      size: 5,
      sort: 'createdDate,desc',
    });
    const [vitalTableReq, setVitalTableReq] = useState({
        page: 0,
        size: 5,
        sort: 'createdDate,desc',
      });
  const {
      data: bodyPage,
      isLoading: bodyLoading,
      isFetching: bodyFetching,
    } = useGetBodyMeasurementsBetweenDatesByPatientIdQuery(
     patientId
        ? {
             patientId,
            // from: undefined,
            // to: undefined,
            page: bodyTableReq.page,
            size: bodyTableReq.size,
            sort: bodyTableReq.sort,
          }
        : (undefined as any),
      { skip: !patientId }
    );
    console.log("bodyPage: ", bodyPage);
     const {
        data: vitalPage,
        isLoading: vitalLoading,
        isFetching: vitalFetching,
      } = useGetVitalSignsBetweenDatesByPatientIdQuery(
        patientId
          ? {
              patientId,
              // from: '',
              // to: '',
              page: vitalTableReq.page,
              size: vitalTableReq.size,
              sort: vitalTableReq.sort,
            }
          : (undefined as any),
        { skip: !patientId }
      );
      console.log("vitalPage: ", vitalPage);

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
