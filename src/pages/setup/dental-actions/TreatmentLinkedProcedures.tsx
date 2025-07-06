import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Col, Form, Row } from 'rsuite';
import './styles.less';
import { MdDelete } from 'react-icons/md';
import Translate from '@/components/Translate';
import { initialListRequest } from '@/types/types';
import {
  useGetCdtsQuery,
  useLinkCdtActionMutation,
  useUnlinkCdtActionMutation
} from '@/services/setupService';
import MyTable from '@/components/MyTable';
import { PiToothFill } from 'react-icons/pi';
import { newApCdtDentalAction } from '@/types/model-types-constructor';
import { Check } from '@rsuite/icons';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { ApCdtDentalAction } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
const TreatmentLinkedProcedures = ({ open, setOpen, dentalAction, setDentalAction, width, listRequest, setListRequest }) => {
     const dispatch = useAppDispatch();
  const [cdtDentalAction, setCdtDentalAction] = useState<ApCdtDentalAction>({
    ...newApCdtDentalAction
  });
  const [load, setLoad] = useState<boolean>(false);
  const [openConfirmDeleteLinked, setOpenConfirmDeleteLinked] = useState<boolean>(false);
  const [reccordOfSelectedCdtKey, setReccordOfSelectedCdtKey] = useState({ selectedCdtKey: '' });
  const [cdtMap, setCdtMap] = useState({});
  const [linkCdtAction, linkCdtActionMutation] = useLinkCdtActionMutation();
  const [unlinkCdtAction, unlinkCdtActionMutation] = useUnlinkCdtActionMutation();
  const { data: cdtListResponse } = useGetCdtsQuery({
    ...initialListRequest,
    pageSize: 1000,
    skipDetails: true
  });
  // customise item appears on the selected cdt list
  const modifiedData = (cdtListResponse?.object ?? []).map(item => ({
    ...item,
    combinedLabel: `${item.key} / ${item?.description}`
  }));
  // class name for selected row
  const isSelected = rowData => {
    if (rowData && cdtDentalAction && rowData.key === cdtDentalAction.key) {
      return 'selected-row';
    } else return '';
  };
   // handle delete cdt linked procedure from treatment
   const handleDeleteTreatmentLinkedProcedure = () => {
    setOpenConfirmDeleteLinked(false);
    setLoad(true);
    unlinkCdtAction({
      ...newApCdtDentalAction,
      dentalActionKey: cdtDentalAction.dentalActionKey,
      cdtKey: cdtDentalAction.cdtKey
    }).unwrap().then(() => {
         dispatch(notify({ msg: 'The CDT procedure has been successfully removed from the treatment', sev: 'success' }));
    }).catch(() => {
          dispatch(notify({ msg: 'Failed to remove the CDT procedure from the treatment', sev: 'error' }));
    });
    setLoad(false);
  };
  // Icons column (remove)
  const iconsForActions = () => (
    <div className="container-of-icons">
      <MdDelete
        className="icons-style"
        title="Deactivate"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => {
          setOpenConfirmDeleteLinked(true);
        }}
      />
    </div>
  );
  //Table columns
  const tableColumns = [
    {
      key: 'cdtKey',
      title: <Translate>CDT Key</Translate>,
      flexGrow: 4
    },
    {
      key: 'description',
      title: <Translate>Description</Translate>,
      flexGrow: 4,
      render: rowData => cdtMap[rowData.cdtKey]?.description
    },
    {
      key: 'icons',
      title: <Translate>Remove</Translate>,
      flexGrow: 3,
      render: () => iconsForActions()
    }
  ];
  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid className='container-of-linked-procedures-dental'>
            <Col>
            <Row>
            <MyInput
              width={width < 880 ? "100%" : "50%"}
              showLabel={false}
              fieldType="select"
              fieldName="selectedCdtKey"
              selectData={modifiedData}
              selectDataLabel="combinedLabel"
              selectDataValue="key"
              record={reccordOfSelectedCdtKey}
              setRecord={setReccordOfSelectedCdtKey}
              menuMaxHeight={200}
            />
            </Row>
            <Row>
            <MyButton
              prefixIcon={() => <Check />}
              color="var(--deep-blue)"
              onClick={() => {
                setLoad(true);
                linkCdtAction({
                  ...newApCdtDentalAction,
                  dentalActionKey: dentalAction.key,
                  cdtKey: reccordOfSelectedCdtKey['selectedCdtKey']
                }).unwrap().then(() => {
                    dispatch(notify({ msg: 'The CDT procedure has been successfully linked to the treatment', sev: 'success' }));
                }).catch(() => {
                     dispatch(notify({ msg: 'Procedure CDT already added to treatment', sev: 'error' }));
                });
                setLoad(false);
              }}
             width={width < 880 ? "100%" : "50%"}
            >
              Link CDT Procedure to Treatment
            </MyButton>
            </Row>
            </Col>
            <MyTable
              height={350}
              data={dentalAction['linkedProcedures']}
                loading={load}
              columns={tableColumns}
              rowClassName={isSelected}
              onRowClick={rowData => {
                setCdtDentalAction(rowData);
              }}
            />
            <DeletionConfirmationModal
              open={openConfirmDeleteLinked}
              setOpen={setOpenConfirmDeleteLinked}
              itemToDelete="CDT procedure"
              actionButtonFunction={handleDeleteTreatmentLinkedProcedure}
              actionType="Delete"
            />
          </Form>
        );
    }
  };

 // Effects
  useEffect(() => {
    // fill cdt procedure objects in a map with key as item key
    const map = {};
    for (const cdt of cdtListResponse?.object ?? []) {
      map[cdt.key] = cdt;
    }
    setCdtMap(map);
  }, [cdtListResponse]);

  useEffect(() => {
    if (linkCdtActionMutation.data) {
      // add the new linked procedure to selected action procedure list
      const currentProcedureList = [...dentalAction['linkedProcedures']];
      currentProcedureList.push(linkCdtActionMutation.data);
      const clone = { ...dentalAction };
      clone['linkedProcedures'] = currentProcedureList;
      setDentalAction({ ...clone });
    }
  }, [linkCdtActionMutation.data]);
  // clear and refetch when the pop up is closed
  useEffect(() => {
     if(!open){
        setReccordOfSelectedCdtKey({ selectedCdtKey: '' });
         setListRequest({ ...listRequest, timestamp: new Date().getTime() });
     }
  },[open]);

  useEffect(() => {
    if (unlinkCdtActionMutation.data) {
      // remove the unlinked procedure from selected action procedure list
      const cdtKeyToRemove = unlinkCdtActionMutation.data.cdtKey;
      // Filter out the procedure with the matching cdtKey
      const updatedProcedureList = dentalAction['linkedProcedures'].filter(
        procedure => procedure.cdtKey !== cdtKeyToRemove
      );
      const clone = { ...dentalAction };
      clone['linkedProcedures'] = updatedProcedureList;
      setDentalAction({ ...clone });
    }
  }, [unlinkCdtActionMutation.data]);
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Treatment Linked Procedures"
      position="right"
      content={conjureFormContent}
      actionButtonLabel={dentalAction?.key ? 'Save' : 'Create'}
        actionButtonFunction={() => setOpen(false)}
      steps={[{ title: 'Treatment Linked Procedures', icon: <PiToothFill /> }]}
        size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default TreatmentLinkedProcedures;
