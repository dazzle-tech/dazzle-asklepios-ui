import React, { useMemo } from 'react';

import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import Section from '@/components/Section';
import UserDateCell from '@/components/UserDateCell';

import {
  useGetLatestEncounterAssessmentQuery
} from '@/services/medicalsheetsEncounter/clinicalVisit/encounterAssessmentService';

type Props = {
  encounter: any;
};

const PatientPreviousAssessments = ({ encounter }: Props) => {

  const encounterId = encounter?.id;

  const {
    data: latestAssessment,
    isFetching
  } = useGetLatestEncounterAssessmentQuery(
    {
      encounterId
    },
    {
      skip: !encounterId
    }
  );

  const tableData = useMemo(() => {
    return latestAssessment ? [latestAssessment] : [];
  }, [latestAssessment]);

  const columns = [
    {
      key: 'assessment',
      title: <Translate>Assessment</Translate>,
      flexGrow: 6
    },

    {
      key: 'created',
      title: <Translate>Created By/At</Translate>,
      flexGrow: 2,

      render: (row: any) => (
        <UserDateCell
          login={row.createdBy}
          date={row.createdDate}
        />
      )
    }
  ];
  return (
    <Section
      isContainOnlyTable
      title={<Translate>Previous Assessments</Translate>}
      content={
        <MyTable
          data={tableData}
          columns={columns}
          loading={isFetching}
        />
      }
    />
  );
};

export default PatientPreviousAssessments;