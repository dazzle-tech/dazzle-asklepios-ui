import React, { useMemo, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

// BODY
import {
  useGetWeightListByPatientBetweenDatesQuery,
  useGetHeightListByPatientBetweenDatesQuery,
} from '@/services/medicalsheetsEncounter/observations/bodyMeasurementsService';

// VITAL
import {
  useGetTemperatureListByPatientBetweenDatesQuery,
  useGetPulseRateListByPatientBetweenDatesQuery,
  useGetRespiratoryRateListByPatientBetweenDatesQuery,
  useGetOxygenSaturationListByPatientBetweenDatesQuery,
  useGetBloodPressureListByPatientBetweenDatesQuery,
} from '@/services/medicalsheetsEncounter/observations/vitalSignsService';
import { useLocation } from 'react-router-dom';

const AllGraphsTab = (props: any) => {
  const location = useLocation();



    const patient = props.patient || location.state?.patient;

  const patientId = Number(patient?.id);

  console.log('🔥 FINAL patient:', patient);
  console.log('🔥 FINAL patientId:', patientId);
  

  const { fromIso, toIso } = useMemo(() => {
    const now = new Date();
    const from = new Date(now);
    from.setMonth(now.getMonth() - 1);

    from.setHours(0, 0, 0, 0);
    now.setHours(23, 59, 59, 999);

    return {
      fromIso: from.toISOString(),
      toIso: now.toISOString()
    };
  }, []);

  // ================= API =================
  const weightQuery = useGetWeightListByPatientBetweenDatesQuery(
    { patientId, from: fromIso, to: toIso },
    { skip: !patientId }
  );

  const heightQuery = useGetHeightListByPatientBetweenDatesQuery(
    { patientId, from: fromIso, to: toIso },
    { skip: !patientId }
  );

  const tempQuery = useGetTemperatureListByPatientBetweenDatesQuery(
    { patientId, from: fromIso, to: toIso },
    { skip: !patientId }
  );

  const pulseQuery = useGetPulseRateListByPatientBetweenDatesQuery(
    { patientId, from: fromIso, to: toIso },
    { skip: !patientId }
  );

  const respQuery = useGetRespiratoryRateListByPatientBetweenDatesQuery(
    { patientId, from: fromIso, to: toIso },
    { skip: !patientId }
  );

  const oxyQuery = useGetOxygenSaturationListByPatientBetweenDatesQuery(
    { patientId, from: fromIso, to: toIso },
    { skip: !patientId }
  );

  const bpQuery = useGetBloodPressureListByPatientBetweenDatesQuery(
    { patientId, from: fromIso, to: toIso },
    { skip: !patientId }
  );

  // ================= DEBUG LOGS =================
  useEffect(() => {
    console.log('================ DEBUG ALL GRAPHS =================');

    console.log('patientId:', patientId);
    console.log('fromIso:', fromIso);
    console.log('toIso:', toIso);

    console.log('WEIGHT:', weightQuery);
    console.log('HEIGHT:', heightQuery);
    console.log('TEMP:', tempQuery);
    console.log('PULSE:', pulseQuery);
    console.log('RESP:', respQuery);
    console.log('OXY:', oxyQuery);
    console.log('BP:', bpQuery);

    console.log('===================================================');
  }, [
    patientId,
    fromIso,
    toIso,
    weightQuery,
    heightQuery,
    tempQuery,
    pulseQuery,
    respQuery,
    oxyQuery,
    bpQuery
  ]);

  const weightData = weightQuery.data || [];
  const heightData = heightQuery.data || [];
  const tempData = tempQuery.data || [];
  const pulseData = pulseQuery.data || [];
  const respData = respQuery.data || [];
  const oxyData = oxyQuery.data || [];
  const bpData = bpQuery.data || [];

  const format = d => new Date(d).toLocaleString();

  const renderChart = (title, arr, key, label) => {
    console.log(`📊 ${title} DATA:`, arr);

    if (!arr.length) {
      return <div className="graph-card"><h4>{title}</h4>No Data</div>;
    }

    return (
      <div className="graph-card">
        <h4>{title}</h4>
        <Line
          data={{
            labels: arr.map(x => format(x.createdAt)),
            datasets: [
              {
                label,
                data: arr.map(x => x[key]),
                tension: 0.3
              }
            ]
          }}
        />
      </div>
    );
  };

  return (
    <div className="graphs-grid">
      {renderChart('Weight', weightData, 'weight', 'Weight')}
      {renderChart('Height', heightData, 'height', 'Height')}

      {renderChart('Temperature', tempData, 'temperature', 'Temperature')}
      {renderChart('Pulse', pulseData, 'pulseRate', 'Pulse')}
      {renderChart('Respiratory', respData, 'respiratoryRate', 'Resp')}
      {renderChart('Oxygen', oxyData, 'oxygenSaturation', 'Oxygen')}

      <div className="graph-card">
        <h4>Blood Pressure</h4>
        {console.log('📊 BP DATA:', bpData)}
        {bpData.length ? (
          <Line
            data={{
              labels: bpData.map(x => format(x.createdAt)),
              datasets: [
                {
                  label: 'Systolic',
                  data: bpData.map(x => x.systolic),
                  borderColor: 'red'
                },
                {
                  label: 'Diastolic',
                  data: bpData.map(x => x.diastolic),
                  borderColor: 'orange'
                }
              ]
            }}
          />
        ) : (
          <div>No Data</div>
        )}
      </div>
    </div>
  );
};

export default AllGraphsTab;