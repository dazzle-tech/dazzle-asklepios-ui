import React, { useMemo } from 'react';
import { faLungsVirus } from '@fortawesome/free-solid-svg-icons';
import '../styles.less';
import MyTable from '@/components/MyTable';
import MyModal from '@/components/MyModal/MyModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Translate from '@/components/Translate';

const FullViewTable = ({ open, setOpen, data, icdMap }) => {
  const tableColumns = useMemo(
    () => [
      {
        key: 'diagnosisId',
        title: <Translate>Diagnosis Code</Translate>,
        flexGrow: 2,
        render: (row: any) => {
          const id = Number(row?.diagnosisId);
          const icd = id ? icdMap[id] : null;
          return icd?.icdCode ?? '';
        }
      },
      {
        key: 'diagnosisDesc',
        title: <Translate>Description</Translate>,
        flexGrow: 6,
        render: (row: any) => {
          const id = Number(row?.diagnosisId);
          const icd = id ? icdMap[id] : null;
          return icd?.icdShortDescription || icd?.icdFullDescription || '';
        }
      },
      {
        key: 'type',
        title: <Translate>Type</Translate>,
        flexGrow: 2,
        render: (row: any) => row?.type ?? ''
      },
      {
        key: 'suspected',
        title: <Translate>Suspected</Translate>,
        flexGrow: 2,
        render: (row: any) => (row?.suspected ? 'Yes' : 'No')
      },
      {
        key: 'major',
        title: <Translate>Major</Translate>,
        flexGrow: 2,
        render: (row: any) => (row?.major ? 'Yes' : 'No')
      }
    ],
    [icdMap]
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={<Translate>Chronic Diseases</Translate>}
      content={<MyTable data={data ?? []} columns={tableColumns} height={300} />}
      hideCancel={false}
      bodyheight="70vh"
      hideBack={true}
      steps={[
        {
          title: <Translate>Chronic Diseases</Translate>,
          icon: <FontAwesomeIcon icon={faLungsVirus} />
        }
      ]}
      hideActionBtn={true}
    />
  );
};
export default FullViewTable;
