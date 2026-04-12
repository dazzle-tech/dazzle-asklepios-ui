import React from 'react';
import { Divider } from 'rsuite';
import '../styles.less';
import MyTable from '@/components/MyTable';
import { useGetWarningsQuery } from '@/services/observationService';
import { initialListRequest } from '@/types/types';
import Translate from '@/components/Translate';
import Section from '@/components/Section';
import { useGetPatientWarningsByPatientIdQuery } from '@/services/encounters/patientWarningsService';
import { PatientWarnings } from '@/types/model-types-new';
import { conjureValueBasedOnKeyFromListOfValues, formatEnumString } from '@/utils';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
const MedicalWarnings = ({ patient }) => {

 const {
     data: warningsListResponse,
     refetch: refetchWarnings,
     isLoading
   } = useGetPatientWarningsByPatientIdQuery(
     {
       patientId: patient?.id,
       showCancelled: false,
     },
     {
       skip: !patient?.id
     }
   );
 const activeWarnings = warningsListResponse?.data?.filter(warning => warning.status === 'ACTIVE') || [];
 const { data: warningTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_WARNING_TYPS');

 // table column
   const tableColumns: any[] = [
     {
       key: 'warningType',
       title: <Translate>Warning Type</Translate>,
       render: (rowData: PatientWarnings) => (
         <p>
           {conjureValueBasedOnKeyFromListOfValues(
             warningTypeLovQueryResponse?.object ?? [],
             rowData.warningType,
             'lovDisplayVale'
           )}
         </p>
       )
     },
     {
       key: 'warning',
       title: <Translate>Warning</Translate>
     },
     {
       key: 'severity',
       title: <Translate>Severity</Translate>,
       render: (rowData: PatientWarnings) => <p>{formatEnumString(rowData.severity)}</p>
     },   
   
   ].filter(Boolean);
  
  return (
    <Section
      isContainOnlyTable
      title={<Translate>Medical Warnings</Translate>}
      content={
        <MyTable
          data={activeWarnings}
          columns={tableColumns}
          height={250}
          loading={isLoading}
          onRowClick={rowData => {}}
        />
      }
      rightLink=""
      setOpen={() => {}}
      openedContent=""
    />
  );
};
export default MedicalWarnings;
