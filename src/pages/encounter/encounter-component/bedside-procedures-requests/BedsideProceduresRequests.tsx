import Translate from '@/components/Translate';
import React, { useState, useEffect } from 'react';
import { Checkbox, Panel } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import PlusIcon from '@rsuite/icons/Plus';
import CancellationModal from '@/components/CancellationModal';
import AddEditBedsideProcedureRequest from './AddEditBedsideProcedureRequest';
const BedsideProceduresRequests = () => {
  const [popupOpen, setPopupOpen] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);
  const [bedsideProceduresRequest, setBedsideProceduresRequest] = useState({});

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && bedsideProceduresRequest && rowData.key === bedsideProceduresRequest.key) {
      return 'selected-row';
    } else return '';
  };

  // dummy data
  const data = [
    {
      key: '1',
      procedureName: 'name1',
      requestedBy: 'Rawan',
      requestedAt: '2025-02-02',
      executionDateTime: '555678934567',
      executedBy: 'Bushra',
      status: 'Requested'
    },
    {
      key: '2',
      procedureName: 'name2',
      requestedBy: 'Walaa',
      requestedAt: '2025-03-03',
      executionDateTime: '555678937776',
      executedBy: 'Batool',
      status: 'Completed'
    },
    {
      key: '3',
      procedureName: 'name3',
      requestedBy: 'Hanan',
      requestedAt: '2025-03-03',
      executionDateTime: '555678937777',
      executedBy: 'Rawan',
      status: 'New'
    }
  ];

  // Handle click on Add New Button
  const handleNew = () => {
    setPopupOpen(true);
    setBedsideProceduresRequest({});
  };

  //icons column (Complete)
  const iconsForActions = () => (
    <div className="container-of-icons">
      <FontAwesomeIcon
        icon={faCircleCheck}
        title="Complete"
        style={{ color: 'var(--primary-gray)' }}
        className="icons-style"
      />
    </div>
  );
  // table Columns
  const tableColumns = [
    {
      key: 'procedureName',
      title: <Translate>Procedure Name</Translate>
    },
    {
      key: 'requestedByAt',
      title: <Translate>Requested By\At</Translate>,
      render: (rowData: any) => {
        return <span>{rowData.requestedBy + '/' + rowData.requestedAt}</span>;
      }
    },
    {
      key: 'executionDateTime',
      title: <Translate>Execution Date Time</Translate>
    },
    {
      key: 'executedBy',
      title: <Translate>Executed By</Translate>
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>
    },
    {
      key: 'icons',
      title: <Translate>Complete</Translate>,
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
      <div className="container-of-header-action-mdt">
        <div>
          <MyButton
            prefixIcon={() => <CloseOutlineIcon />}
            onClick={() => setOpenCancellationReasonModel(true)}
            disabled={bedsideProceduresRequest?.key == null ? true : false}
          >
            Cancel
          </MyButton>

          <Checkbox>Show Cancelled</Checkbox>
        </div>
        <MyButton prefixIcon={() => <PlusIcon />} onClick={handleNew}>
          Add New
        </MyButton>
      </div>
      <MyTable
        data={data}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setBedsideProceduresRequest(rowData);
        }}
      />

      <CancellationModal
        open={openCancellationReasonModel}
        setOpen={setOpenCancellationReasonModel}
        object={bedsideProceduresRequest}
        setObject={setBedsideProceduresRequest}
        handleCancle={handleCancle}
        fieldName="cancelledReason"
        fieldLabel={'Cancelled Reason'}
        title={'Cancellation'}
      ></CancellationModal>
      <AddEditBedsideProcedureRequest
        open={popupOpen}
        setOpen={setPopupOpen}
        width={width}
        bedsideProceduresRequest={bedsideProceduresRequest}
        setBedsideProceduresRequest={setBedsideProceduresRequest}
      />
    </Panel>
  );
};

export default BedsideProceduresRequests;
