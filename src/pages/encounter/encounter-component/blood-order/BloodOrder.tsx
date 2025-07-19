import Translate from '@/components/Translate';
import React, { useState, useEffect } from 'react';
import { Form, Panel } from 'rsuite';
import MyTable from '@/components/MyTable';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import MyButton from '@/components/MyButton/MyButton';
import PlusIcon from '@rsuite/icons/Plus';
import CancellationModal from '@/components/CancellationModal';
import './styles.less';
import MyInput from '@/components/MyInput';
import AddEditBloodOrder from './AddEditBloodOrder';
import DetailsModal from './detailsModal';
const BloodOrder = () => {
  const [popupOpen, setPopupOpen] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [bloodOrder, setBloodOreder] = useState({});

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && bloodOrder && rowData.key === bloodOrder.key) {
      return 'selected-row';
    } else return '';
  };

  // dummy data
  const data = [
    {
      key: '1',
      productType: 'type1',
      amount: 20,
      reason: 'reason1',
      requestBy: 'Rawan',
      requestAt: '20225-09-09',
      previousReaction: true,
      status: 'new'
    },
    {
      key: '2',
      productType: 'type2',
      amount: 30,
      reason: 'reason2',
      previousReaction: false,
      requestBy: 'Batool',
      requestAt: '20225-10-10',
      status: 'new'
    },
    {
      key: '3',
      productType: 'type3',
      amount: 40,
      reason: 'reason3',
      requestBy: 'Hanan',
      requestAt: '20225-11-11',
      previousReaction: true,
      status: 'new'
    }
  ];

  // Handle click on Add New Button
  const handleNew = () => {
    setPopupOpen(true);
    setBloodOreder({ });
  };

  //icons column ( Edite, Cancel, Details)
  const iconsForActions = () => (
    <div className="container-of-icons">
      <FontAwesomeIcon
        title="Edit"
        icon={faPen}
        color="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          setPopupOpen(true);
        }}
      />
      <FontAwesomeIcon
        title="Cancel"
        icon={faTrash}
        color="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          setOpenCancellationReasonModel(true);
        }}
      />
      <FontAwesomeIcon
        title="Details"
        icon={faCircleInfo}
        color="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          setOpenDetailsModal(true);
        }}
      />
    </div>
  );

  // table Columns
  const tableColumns = [
    {
      key: '',
      title: <Translate></Translate>,
      render: (rowData: any) => {
        return <MyInput fieldName="" fieldType="check" record={rowData} setRecord="" />;
      }
    },
    {
      key: 'productType',
      title: <Translate>Product Type</Translate>
    },
    {
      key: 'amount',
      title: <Translate>Amount (ml)</Translate>
    },
    {
      key: 'reason',
      title: <Translate>Reason</Translate>
    },
    {
      key: 'RequestByAt',
      title: <Translate>Request By\At</Translate>,
      render: (rowData: any) => {
        return <span>{rowData.requestBy + '/' + rowData.requestAt}</span>;
      }
    },

    {
      key: 'status ',
      title: <Translate>Status</Translate>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 4,
      render: () => iconsForActions()
    }
  ];

  // handle cancel
  const handleCancle = async () => {
    setOpenCancellationReasonModel(false);
  };

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Panel>
      <Form fluid layout="inline">
        <div className="container-of-header-fields-blood">
          <MyInput
            fieldName="patientBloodGroup"
            fieldType="text"
            record=""
            setRecord=""
            showLabel={false}
            placeholder="Patient Blood Group"
            readonly
            width={200}
          />
          <div className="container-of-buttons-blood">
            <MyButton>Submit</MyButton>
            <MyButton prefixIcon={() => <PlusIcon />} onClick={handleNew}>
              Add
            </MyButton>
          </div>
        </div>
      </Form>
      <MyTable
        data={data}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setBloodOreder(rowData);
        }}
      />
      <CancellationModal
        open={openCancellationReasonModel}
        setOpen={setOpenCancellationReasonModel}
        object={bloodOrder}
        setObject={setBloodOreder}
        handleCancle={handleCancle}
        fieldName="cancelledReason"
        fieldLabel={'Cancelled Reason'}
        title={'Cancellation'}
      ></CancellationModal>
      <AddEditBloodOrder
        open={popupOpen}
        setOpen={setPopupOpen}
        width={width}
        bloodorder={bloodOrder}
        setBloodOrder={setBloodOreder}
      />
      <DetailsModal open={openDetailsModal} setOpen={setOpenDetailsModal} width={width} />
    </Panel>
  );
};

export default BloodOrder;
