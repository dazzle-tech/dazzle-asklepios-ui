import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { TpaDefinition, TpaLinkedInsuranceCompany } from '@/types/model-types-new';
import { useGetTpaLinkedInsuranceCompaniesQuery } from '@/services/setup/payer/TpaDefinitionSetupService';

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

  const columns = [
    {
      key: 'nphiesId',
      title: <Translate>Insurance Company Code</Translate>,
      flexGrow: 2
    },
    {
      key: 'nameEn',
      title: <Translate>Name English</Translate>,
      flexGrow: 3
    },
    {
      key: 'nameAr',
      title: <Translate>Name Arabic</Translate>,
      flexGrow: 3
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
          data={data}
          columns={columns}
          loading={isFetching}
          height={420}
        />
      }
    />
  );
};

export default TpaLinkedCompaniesModal;
