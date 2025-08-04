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
// import './styles.less';
import { formatDateWithoutSeconds } from '@/utils';
import RiskLevelExtraForm from '../morse-fall-scale/RiskLevelExtraForm';
const StratifyScale = () => {
  const [width, setWidth] = useState<number>(window.innerWidth);
  // open add new modal
  const [open, setOpen] = useState<boolean>(false);
  const [stratifyScale, setStratifyScale] = useState({});
  // open modal for moderate and high score
  const [openRiskLevelExtraFormModal, setOpenRiskLevelExtraFormModal] = useState<boolean>(false);
  // object for moderate/high modal
  const [object, setObject] = useState({ key: null });

  // Class name of selected row
  const isSelected = rowData => {
    if (rowData && stratifyScale && rowData.key === stratifyScale.key) {
      return 'selected-row';
    } else return '';
  };

  //dummy data
  const data = [
    {
      key: '1',
      score: '3',
      riskLevel: 'High',
      createdAt: '2/9/2025',
      createdBy: 'Batool',
      nextAssessmentDue: '10/9/2025'
    },
    {
      key: '2',
      score: '1',
      riskLevel: 'Low',
      createdAt: '3/9/2025',
      createdBy: 'Hanan',
      nextAssessmentDue: '12/9/2025'
    },
    {
      key: '3',
      score: '0',
      riskLevel: 'Low',
      createdAt: '4/9/2025',
      createdBy: 'Bushra',
      nextAssessmentDue: '13/9/2025'
    },
    {
      key: '4',
      score: '40',
      riskLevel: 'High',
      createdAt: '6/9/2025',
      createdBy: 'Walaa',
      nextAssessmentDue: '17/9/2025'
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
          cursor: Number(rowData?.score) > 1 ? 'pointer' : 'not-allowed',
          color: 'var(--primary-gray)'
        }}
        onClick={() => {
          if (Number(rowData?.score) > 1) {
            setOpenRiskLevelExtraFormModal(true);
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
          setStratifyScale(rowData);
        }}
      />
      <AddNewModal
        open={open}
        setOpen={setOpen}
        width={width}
        setOpenRiskLevelExtraFormModal={setOpenRiskLevelExtraFormModal}
        stratifyScale={stratifyScale}
        setStratifyScale={setStratifyScale}
      />
      <RiskLevelExtraForm
        open={openRiskLevelExtraFormModal}
        setOpen={setOpenRiskLevelExtraFormModal}
        width={width}
        object={object}
        setObject={setObject}
        handleSave=""
      />
    </div>
  );
};
export default StratifyScale;
