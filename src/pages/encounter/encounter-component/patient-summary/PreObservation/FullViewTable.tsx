import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import React, { useState } from 'react';
import { faBedPulse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
const FullViewTable = ({ open, setOpen, list }) => {
  const columns = [
    {
      key: 'visitKey',
      title: <Translate>Visit Date</Translate>,
      render: (rowData: any) => {
        return rowData?.encounter?.plannedStartDate || '';
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
      key: 'latestheartrate',
      title: <Translate>Pulse</Translate>,
      render: (rowData: any) => {
        return rowData?.latestheartrate ? `${rowData.latestheartrate} bpm` : '';
      }
    },
    {
      key: 'latestoxygensaturation',
      title: <Translate>SpO2</Translate>,
      render: (rowData: any) => {
        return rowData?.latestoxygensaturation ? `${rowData.latestoxygensaturation}%` : '';
      }
    },
    {
      key: 'latestnotes',
      title: <Translate>Note</Translate>,
      render: (rowData: any) => {
        return rowData?.latestnotes || '';
      }
    },
    {
      key: 'latestheadcircumference',
      title: <Translate>Head circumference</Translate>,
      render: (rowData: any) => {
        return rowData?.latestheadcircumference ? `${rowData.latestheadcircumference} cm` : '';
      }
    },
    {
      key: 'latestpainlevelLkey',
      title: <Translate>Pain Degree</Translate>,
      render: (rowData: any) => {
        return rowData?.latestpainlevelLvalue?.lovDisplayVale || '';
      }
    },
    {
      key: 'latestpaindescription',
      title: <Translate>Pain Description</Translate>,
      render: (rowData: any) => {
        return rowData?.latestpaindescription || '';
      }
    }
  ];

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      size="60vw"
      hideBack
      hideActionBtn
      title="Observation"
      steps={[{ title: 'Observation', icon: <FontAwesomeIcon icon={faBedPulse} /> }]}
      content={
        <>
          <MyTable data={list ?? []} columns={columns} height={300} />
        </>
      }
    />
  );
};
export default FullViewTable;
