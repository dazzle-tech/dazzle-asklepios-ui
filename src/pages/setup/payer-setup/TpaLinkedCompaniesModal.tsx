import React, { useMemo } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { TpaDefinition, TpaLinkedInsuranceCompany } from '@/types/model-types-new';
import {
  normalizeLinkedInsuranceCompany,
  unwrapList,
  useGetTpaLinkedInsuranceCompaniesQuery
} from '@/services/setup/payer/TpaDefinitionSetupService';

type TpaLinkedCompaniesModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  tpa: TpaDefinition | null;
};

const TpaLinkedCompaniesModal: React.FC<TpaLinkedCompaniesModalProps> = ({
  open,
  setOpen,
  tpa
}) => {
  const { data = [], isFetching } = useGetTpaLinkedInsuranceCompaniesQuery(tpa?.id as number, {
    skip: !open || !tpa?.id
  });

  const companies = useMemo(
    () =>
      unwrapList(data)
        .map(item => normalizeLinkedInsuranceCompany(item))
        .filter((company): company is TpaLinkedInsuranceCompany => company != null),
    [data]
  );

  const columns = [
    {
      key: 'nphiesId',
      title: <Translate>Insurance Company Code</Translate>,
      flexGrow: 2,
      render: (rowData: TpaLinkedInsuranceCompany) => <span>{rowData.nphiesId || '-'}</span>
    },
    {
      key: 'nameEn',
      title: <Translate>Name English</Translate>,
      flexGrow: 3,
      render: (rowData: TpaLinkedInsuranceCompany) => <span>{rowData.nameEn || '-'}</span>
    },
    {
      key: 'nameAr',
      title: <Translate>Name Arabic</Translate>,
      flexGrow: 3,
      render: (rowData: TpaLinkedInsuranceCompany) => <span>{rowData.nameAr || '-'}</span>
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 1,
      render: (rowData: TpaLinkedInsuranceCompany) => (
        <span>{rowData.isActive ? 'Active' : 'Inactive'}</span>
      )
    }
  ];

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={tpa ? `Insurance Companies - ${tpa.name}` : 'Insurance Companies'}
      size="70vw"
      bodyheight="60vh"
      hideCancel
      hideActionBtn
      modalColor="var(--primary-blue)"
      steps={[]}
      content={
        <MyTable
          data={companies}
          columns={columns}
          loading={isFetching}
          height={420}
          dontTranslateData
        />
      }
    />
  );
};

export default TpaLinkedCompaniesModal;
