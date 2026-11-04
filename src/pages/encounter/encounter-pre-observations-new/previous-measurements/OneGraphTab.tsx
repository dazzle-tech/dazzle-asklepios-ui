import React, { useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { useLocation } from 'react-router-dom';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';

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

const OneGraphTab = ({ patient: patientProp }) => {
  const location = useLocation();

  const patient = patientProp ?? location.state?.patient;
  const patientId = Number(patient?.id);

  // ================= DATE HELPERS =================

  const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };

  const endOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  };

  // ================= DATE FILTER =================

  const [dateFilter, setDateFilter] = useState(() => {
    const now = new Date();

    const from = new Date(now);
    from.setMonth(now.getMonth() - 1);

    return {
      fromDate: startOfDay(from),
      toDate: endOfDay(now),
    };
  });

  // ================= ISO DATES =================

  const fromIso = useMemo(
    () => startOfDay(dateFilter.fromDate).toISOString(),
    [dateFilter.fromDate]
  );

  const toIso = useMemo(
    () => endOfDay(dateFilter.toDate).toISOString(),
    [dateFilter.toDate]
  );

  // ================= API =================

  const { data: weightData = [] } =
    useGetWeightListByPatientBetweenDatesQuery(
      {
        patientId,
        from: fromIso,
        to: toIso,
      },
      {
        skip: !patientId,
      }
    );

  const { data: heightData = [] } =
    useGetHeightListByPatientBetweenDatesQuery(
      {
        patientId,
        from: fromIso,
        to: toIso,
      },
      {
        skip: !patientId,
      }
    );

  const { data: tempData = [] } =
    useGetTemperatureListByPatientBetweenDatesQuery(
      {
        patientId,
        from: fromIso,
        to: toIso,
      },
      {
        skip: !patientId,
      }
    );

  const { data: pulseData = [] } =
    useGetPulseRateListByPatientBetweenDatesQuery(
      {
        patientId,
        from: fromIso,
        to: toIso,
      },
      {
        skip: !patientId,
      }
    );

  const { data: respData = [] } =
    useGetRespiratoryRateListByPatientBetweenDatesQuery(
      {
        patientId,
        from: fromIso,
        to: toIso,
      },
      {
        skip: !patientId,
      }
    );

  const { data: oxyData = [] } =
    useGetOxygenSaturationListByPatientBetweenDatesQuery(
      {
        patientId,
        from: fromIso,
        to: toIso,
      },
      {
        skip: !patientId,
      }
    );

  const { data: bpData = [] } =
    useGetBloodPressureListByPatientBetweenDatesQuery(
      {
        patientId,
        from: fromIso,
        to: toIso,
      },
      {
        skip: !patientId,
      }
    );

  // ================= FILTER =================

  const filters = () => (
    <Form
      layout="inline"
      fluid
      className="filter-form-disable-fix"
    >
      <MyInput
        column
        width={180}
        fieldType="date"
        fieldLabel="From"
        fieldName="fromDate"
        disableFutureDates={true}
        record={dateFilter}
        setRecord={setDateFilter}
      />

      <MyInput
        column
        width={180}
        fieldType="date"
        fieldLabel="To"
        fieldName="toDate"
        disableFutureDates={true}
        record={dateFilter}
        setRecord={setDateFilter}
      />
    </Form>
  );

  // ================= LABELS =================

  const format = (d) => new Date(d).toLocaleString();

  // خذ labels من أول dataset فيه بيانات
  const base =
    weightData.length
      ? weightData
      : heightData.length
        ? heightData
        : tempData.length
          ? tempData
          : pulseData.length
            ? pulseData
            : respData.length
              ? respData
              : oxyData.length
                ? oxyData
                : bpData;

  const labels = base.map((x) => format(x.createdAt));

  // ================= RENDER =================

  return (
    <>
      {filters()}

      <Line
        data={{
          labels,
          datasets: [
            {
              label: 'Weight',
              data: weightData.map((x) => x.weight),
              borderColor: '#FF6384',
            },
            {
              label: 'Height',
              data: heightData.map((x) => x.height),
              borderColor: '#36A2EB',
            },
            {
              label: 'Temperature',
              data: tempData.map((x) => x.temperature),
              borderColor: '#FFCE56',
            },
            {
              label: 'Pulse',
              data: pulseData.map((x) => x.pulseRate),
              borderColor: '#4BC0C0',
            },
            {
              label: 'Respiratory',
              data: respData.map((x) => x.respiratoryRate),
              borderColor: '#9966FF',
            },
            {
              label: 'Oxygen',
              data: oxyData.map((x) => x.oxygenSaturation),
              borderColor: '#00A86B',
            },
            {
              label: 'Systolic',
              data: bpData.map((x) => x.systolic),
              borderColor: '#8B0000',
            },
            {
              label: 'Diastolic',
              data: bpData.map((x) => x.diastolic),
              borderColor: '#FFA07A',
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: {
            legend: {
              display: true,
              position: 'top',
            },
          },
        }}
      />
    </>
  );
};

export default OneGraphTab;

