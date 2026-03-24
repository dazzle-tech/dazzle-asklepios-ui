import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useGetLovAllValuesQuery } from '@/services/setupService';
import { initialListRequestAllValues } from '@/types/types';
import { formatEnumString } from '@/utils';
import React from 'react';

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  ranges: any[];
};

const NormalRangeModal = ({ open, setOpen, ranges }: Props) => {

  // list of value new function
  const { data: allLovValues } =
    useGetLovAllValuesQuery({ ...initialListRequestAllValues }); 

  const resolveLovKeysDisplay = (lovKeys?: string[]) => {
    if (!Array.isArray(lovKeys) || !lovKeys.length) return ' ';
    if (!allLovValues?.object) return ' ';

    return lovKeys
      .map(key =>
        allLovValues.object.find(
          v => String(v.key) === String(key)
        )?.lovDisplayVale
      )
      .filter(Boolean)
      .join(', ') || ' ';
  };



  const columns = [
    {
      key: 'gender',
      title: <Translate>GENDER</Translate>,
      flexGrow: 1,
      render: (r: any) => formatEnumString(r.gender) ?? ' '
    },
    {
      key: 'ageFrom',
      title: <Translate>AGE FROM</Translate>,
      flexGrow: 1,
      render: (r: any) =>
        `${r.ageFrom ?? ' '} ${r.ageFromUnit ?? ''}`
    },
    {
      key: 'ageTo',
      title: <Translate>AGE TO</Translate>,
      flexGrow: 1,
      render: (r: any) =>
        `${r.ageTo ?? ' '} ${r.ageToUnit ?? ''}`
    },
    {
      key: 'range',
      title: <Translate>RANGE</Translate>,
      flexGrow: 1,
      render: (r: any) => {
        if (r.rangeFrom != null || r.rangeTo != null) {
          return `${r.rangeFrom ?? ' '} - ${r.rangeTo ?? ' '}`;
        }
        if (Array.isArray(r.lovKeys) && r.lovKeys.length) {
          return resolveLovKeysDisplay(r.lovKeys);
        }
        return ' ';
      }
    },
    {
      key: 'critical',
      title: <Translate>CRITICAL VALUE</Translate>,
      flexGrow: 1,
      render: (r: any) => {
        if (r.criticalValue != null) return r.criticalValue;
        if (r.criticalValueLessThan != null)
          return `< ${r.criticalValueLessThan}`;
        if (r.criticalValueMoreThan != null)
          return `> ${r.criticalValueMoreThan}`;
        return ' ';
      }
    }
  ];

  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
  <div dir={dir}>
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Normal Ranges"
      position='center'
      size="40vw"
      bodyheight='auto'
      content={
      <div dir={dir}>
        <MyTable
          columns={columns}
          data={ranges ?? []}
          height={400}
        />
      </div>}
    />
  </div>
  );
};

export default NormalRangeModal;
