import MyButton from '@/components/MyButton/MyButton';
import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import PlusIcon from '@rsuite/icons/Plus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListCheck } from '@fortawesome/free-solid-svg-icons';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import AddNewModal from './AddNewModal';
import RiskLevelExtraForm from './RiskLevelExtraForm';
import './styles.less';
import { formatDateWithoutSeconds } from '@/utils';
const MorseFallScale = () => {
  const [width, setWidth] = useState<number>(window.innerWidth);
  // open add new modal
  const [open, setOpen] = useState<boolean>(false);
  const [morseFallScale, setMorseFallScale] = useState({});
  // open modal for moderate and high score
  const [openModerateHighModal, setOpenModerateHighModal] = useState<boolean>(false);
  // object for moderate/high modal
  const [object, setObject] = useState({ key: null });

  // Class name of selected row
  const isSelected = rowData => {
    if (rowData && morseFallScale && rowData.key === morseFallScale.key) {
      return 'selected-row';
    } else return '';
  };

  //dummy data
  const data = [
    {
      key: '1',
      score: '40',
      riskLevel: 'Moderate',
      createdAt: '2/8/2025',
      createdBy: 'Rawan',
      nextAssessmentDue: '10/8/2025'
    },
    {
      key: '2',
      score: '20',
      riskLevel: 'Low',
      createdAt: '3/8/2025',
      createdBy: 'Hanan',
      nextAssessmentDue: '12/8/2025'
    },
    {
      key: '3',
      score: '50',
      riskLevel: 'High',
      createdAt: '4/8/2025',
      createdBy: 'Bushra',
      nextAssessmentDue: '13/8/2025'
    },
    {
      key: '4',
      score: '40',
      riskLevel: 'Moderate',
      createdAt: '6/8/2025',
      createdBy: 'Walaa',
      nextAssessmentDue: '17/8/2025'
    }
  ];

  //icons column (Additives)
  const iconsForActions = rowData => (
    <div className="container-of-icons">
      <FontAwesomeIcon
        title="Additives"
        color="var(--primary-gray)"
        className="icons-style"
        icon={faListCheck}
        style={{
          cursor: Number(rowData?.score) > 24 ? 'pointer' : 'not-allowed',
          color: 'var(--primary-gray)'
        }}
        onClick={() => {
          if (Number(rowData?.score) > 24) {
            setOpenModerateHighModal(true);
            setObject({ key: rowData.key });
          }
        }}
      />
    </div>
  );

  //table columns
  const tableColumns = [
    {
      key: 'score',
      title: <Translate>Score</Translate>
    },
    {
      key: 'riskLevel',
      title: <Translate>Risk Level</Translate>
    },
    {
      key: '',
      title: <Translate>Created At\By</Translate>,
      render: (rowData: any) =>
        rowData?.createdAt ? (
          <>
            {rowData?.createdBy}
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(rowData.createdAt)}
            </span>{' '}
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'nextAssessmentDue',
      title: <Translate>Next Assessment Due</Translate>
    },
    {
      key: 'viewPreventionPlan',
      title: <Translate>View Prevention Plan</Translate>,
      render: rowData => iconsForActions(rowData)
    }
  ];

  // handle add new
  const handleNew = () => {
    setOpen(true);
    setObject({ key: null });
  };

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div>
      <div className="container-of-header-actions-morse">
        <Form className="container-of-cancel-actions-morse">
          <MyButton color="var(--deep-blue)" width="90px">
            Cancel
          </MyButton>
          <MyInput
            fieldType="check"
            fieldName=""
            record=""
            setRecord=""
            fieldLabel="Show Cancelled"
            showLabel={false}
          />
        </Form>
        <MyButton
          color="var(--deep-blue)"
          prefixIcon={() => <PlusIcon />}
          onClick={handleNew}
          width="100px"
        >
          Add New
        </MyButton>
      </div>
      <MyTable
        height={450}
        data={data}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setMorseFallScale(rowData);
        }}
      />
      <AddNewModal
        open={open}
        setOpen={setOpen}
        width={width}
        setOpenModerateHighModal={setOpenModerateHighModal}
        morseFallScale={morseFallScale}
        setMorseFallScale={setMorseFallScale}
      />
      <RiskLevelExtraForm
        open={openModerateHighModal}
        setOpen={setOpenModerateHighModal}
        width={width}
        object={object}
        setObject={setObject}
        handleSave=""
      />
    </div>
  );
};
export default MorseFallScale;
