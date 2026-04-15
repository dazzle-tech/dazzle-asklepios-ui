import React, { useEffect, useState } from 'react';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import Section from '@/components/Section';
import { useGetPatientPreferredHealthProfessionalsQuery } from '@/services/patients/PatientPreferredHealthProfessional';
import { useGetPractitionersBulkMutation } from '@/services/setup/practitioner/PractitionerService';
import PrimaryCareProviderTableFullView from './PrimaryCareProviderTableFullView';
import MyModal from '@/components/MyModal/MyModal';

const PrimaryCareProviderTable = ({ patient }: any) => {
  const [practitionersMap, setPractitionersMap] = useState<Record<number, any>>({});
  const [open, setOpen] = useState(false); // 🔥 مهم

  const {
    data: preferredHPResponse,
    isFetching
  } = useGetPatientPreferredHealthProfessionalsQuery(
    {
      page: 0,
      size: 10,
      sort: 'id,asc',
      patientId: patient?.id
    },
    { skip: !patient?.id }
  );

  const [getPractitionersBulk] = useGetPractitionersBulkMutation();

  useEffect(() => {
    const load = async () => {
      const rows = preferredHPResponse?.data ?? [];

      if (!rows.length) {
        setPractitionersMap({});
        return;
      }

      const ids = Array.from(
        new Set(
          rows
            .map((r: any) => r.practitionerId)
            .filter((id: any) => id !== null && id !== undefined)
        )
      );

      try {
        const practitioners = await getPractitionersBulk(ids).unwrap();
        const map = Object.fromEntries(
          practitioners.map((p: any) => [p.id, p])
        );
        setPractitionersMap(map);
      } catch (e) {
        console.error('Bulk practitioner load failed', e);
      }
    };

    load();
  }, [preferredHPResponse]);

  const columns = [
    {
      key: 'name',
      title: <Translate>PRIMARY_CARE_PROVIDER</Translate>,
      flexGrow: 3,
      render: (row: any) => {
        const p = practitionersMap[row.practitionerId];
        if (!p) return '-';
        return `${p.firstName} ${p.lastName ?? ''}`.trim();
      }
    },
    {
      key: 'phone',
      title: <Translate>PHONE_NUMBER</Translate>,
      flexGrow: 2,
      render: (row: any) =>
        practitionersMap[row.practitionerId]?.phoneNumber ?? '-'
    },
    {
      key: 'email',
      title: <Translate>EMAIL</Translate>,
      flexGrow: 3,
      render: (row: any) =>
        practitionersMap[row.practitionerId]?.email ?? '-'
    },
  ];

  return (
    <>
      <Section
        isContainOnlyTable
        title={<Translate>PRIMARY_CARE_PROVIDER</Translate>}
        content={
          <MyTable
            data={patient?.id ? preferredHPResponse?.data ?? [] : []}
            loading={isFetching}
            columns={columns}
          />
        }
        rightLink="Full view"
        setOpen={setOpen}
        openedContent={<></>}
      />

      <MyModal
        open={open}
        setOpen={setOpen}
        title={<Translate>PRIMARY_CARE_PROVIDER</Translate>}
        position="right"
        content={() => (
          <PrimaryCareProviderTableFullView patient={patient} />
        )}
      />
    </>
  );
};

export default PrimaryCareProviderTable;