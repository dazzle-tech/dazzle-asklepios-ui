import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import React from 'react';
import { faBedPulse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useGetBodyMeasurementsBetweenDatesByPatientIdQuery } from '@/services/medicalsheetsEncounter/observations/bodyMeasurementsService';
import "./styles.less";
const FullViewTable = ({ open, setOpen, vitalSignsList, patient, formatDateTime, vitalLoading, vitalFetching }) => {
  const {
    data: bodyPage,
    isLoading: bodyLoading,
    isFetching: bodyFetching,
  } = useGetBodyMeasurementsBetweenDatesByPatientIdQuery(
    patient?.id
      ? {
        patientId: patient?.id,
      }
      : (undefined as any),
    { skip: !patient?.id }
  );

  const bodyColumns = [
    {
      key: 'createdAt',
      title: 'CREATED AT',
      render: (row: any) => {
        const v = row?.createdAt ?? row?.createdDate;
        return v ? formatDateTime(new Date(v)) : '';
      },
    },
    {
      key: 'weight',
      title: 'WEIGHT(kg)',
    },
    {
      key: 'height',
      title: 'HEIGHT(cm)',
    },
  ];

  const vitalColumns = [
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
    },
    {
      key: 'oxygenSaturation',
      title: 'OXYGEN SATURATION(%)',
    },
  ];

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      size="70vw"
      hideBack
      hideActionBtn
      title="Observation"
      steps={[{ title: 'Observation', icon: <FontAwesomeIcon icon={faBedPulse} /> }]}
      content={
          <div className="pm-grid margin-top-20">
            <div className="pm-col">
              <h4 className="font-size-14">Body Measurements</h4>
              <MyTable
                height={280}
                data={bodyPage ?? []}
                columns={bodyColumns}
                loading={bodyLoading || bodyFetching}

              />
            </div>

            <div className="pm-col">
              <h4 className="font-size-14">Vital Signs</h4>
              <MyTable
                height={280}
                data={vitalSignsList}
                columns={vitalColumns}
                loading={vitalLoading || vitalFetching}
              />
            </div>
          </div>
      }
    />
  );
};
export default FullViewTable;
