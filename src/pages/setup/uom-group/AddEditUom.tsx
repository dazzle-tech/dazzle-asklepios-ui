import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import './styles.less';
import UomGroupDef from './UomGroupDef';
import { faBox, faBoxesPacking, faBoxesStacked, faBroom, faCalendarCheck, faCheckDouble, faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';
import { newApUomGroups, newApUomGroupsRelation, newApUomGroupsUnits } from '@/types/model-types-constructor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import UOMGroup from './UOMGroup';
import { useGetLovValuesByCodeQuery, useGetUomGroupsQuery, useGetUomGroupsRelationQuery, useGetUomGroupsUnitsQuery, useRemoveUomGroupRelationMutation, useRemoveUomGroupUnitsMutation, useSaveUomGroupMutation, useSaveUomGroupRelationMutation, useSaveUomGroupUnitsMutation } from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';
import ChildModal from '@/components/ChildModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { ApUomGroupsRelation, ApUomGroupsUnits } from '@/types/model-types';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { initialListRequest, ListRequest } from '@/types/types';
import MyInput from '@/components/MyInput';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import AddEditRelation from './AddEditRelation';
import UomGroup from '../product-setup/UOMGroup';
import MyLabel from '@/components/MyLabel';
const AddEditUom = ({
  open,
  setOpen,
  uom,
  setUom,
  width

}) => {

  const dispatch = useAppDispatch();
  const [uomUnit, setUomUnit] = useState<ApUomGroupsUnits>({
    ...newApUomGroupsUnits
  });
  const [uomRelation, setUomRelation] = useState<ApUomGroupsRelation>({
    ...newApUomGroupsRelation
  });
  const [unitListRequest, setUnitListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
      ,
      {
        fieldName: 'uom_group_key',
        operator: 'match',
        value: uom?.key

      }
    ]
  });
  const [openConfirmDeleteUnitModal, setOpenConfirmDeleteUnitModal] =
    useState<boolean>(false);
  const [stateOfDeleteUnitModal, setStateOfDeleteUnitModal] = useState<string>('delete');

  const [openConfirmDeleteRelationModal, setOpenConfirmDeleteRelationModal] =
    useState<boolean>(false);
  const [stateOfDeleteRelationModal, setStateOfDeleteRelationModal] = useState<string>('delete');
  const [relationListRequest, setRelationListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
      ,
      {
        fieldName: 'uom_group_key',
        operator: 'match',
        value: uom?.key

      }
    ]
  });
  const { data: UOMGroupListResponse, refetch: uomRefetch } = useGetUomGroupsQuery({ ...initialListRequest });
  const { data: UOMGroupUnitListResponse, refetch: uomUnitRefetch } = useGetUomGroupsUnitsQuery(unitListRequest);
  const { data: UOMGroupRelationListResponse, refetch: uomRelationRefetch } = useGetUomGroupsRelationQuery(relationListRequest);
  const [childStep, setChildStep] = useState<number>(-1);
  // class name for selected row in uom unit table
  const isSelectedUnit = rowData => {
    if (rowData && rowData.key === uomUnit.key) {
      return 'selected-row';
    } else return '';
  };

  // class name for selected row in uom relation table
  const isSelectedRelation = rowData => {
    if (rowData && rowData.key === uomRelation.key) {
      return 'selected-row';
    } else return '';
  };
  // Fetch UOM Lov list response
  const { data: UOMLovResponseData } = useGetLovValuesByCodeQuery('UOM');
  const [filteredResourcesList, setFilteredResourcesList] = useState([]);
  const [openAddEditPopup, setOpenAddEditPopup] = useState<boolean>(false);
  const [openAddEditRelationPopup, setOpenAddEditRelationPopup] = useState<boolean>(false);
  const [saveUomGroup, saveUomGroupMutation] = useSaveUomGroupMutation();
  const [saveUomGroupUnits, saveUomGroupUnitsMutation] = useSaveUomGroupUnitsMutation();
  const [saveUomGroupRelation, saveUomGroupRelationMutation] = useSaveUomGroupRelationMutation();
  const [removeUomGroupUnits, removeUomGroupUnitsMutation] = useRemoveUomGroupUnitsMutation();
  const [removeUomGroupRelation, removeUomGroupRelationMutation] = useRemoveUomGroupRelationMutation();
  const handleDeactivateUomGroup = async data => {
    setOpenConfirmDeleteUnitModal(false);
    try {
      await removeUomGroupUnits({
        ...uomUnit
      })
        .unwrap()
        .then(() => {
          uomUnitRefetch();
          dispatch(
            notify({
              msg: 'The UOM group unit was successfully ' + stateOfDeleteUnitModal,
              sev: 'success'
            })
          );
        });
    } catch (error) {
      dispatch(
        notify({
          msg: 'Failed to ' + stateOfDeleteUnitModal + ' this UOM group unit',
          sev: 'error'
        })
      );
    }
  };
  //handle Active uom group unit
  const handleReactiveUom = () => {
    setOpenConfirmDeleteUnitModal(false);
    const updatedUom = { ...uomUnit, deletedAt: null };
    saveUomGroupUnits(updatedUom)
      .unwrap()
      .then(() => {
        // display success message
        dispatch(notify({ msg: 'The Unit has been activated successfully', sev: 'success' }));
      })
      .catch(() => {
        // display error message
        dispatch(notify({ msg: 'Failed to activated this Unit', sev: 'error' }));
      });
  };
  const iconsForActions = (rowData) => (
    <div className="container-of-icons">
         <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setOpenAddEditRelationPopup(true)}
      />
      {/* deactivate/activate  when click on one of these icon */}
      {!rowData?.deletedAt ? (
        <MdDelete
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
           onClick={() => {
            setStateOfDeleteRelationModal('deactivate');
            setOpenConfirmDeleteRelationModal(true);
          }}
        />
      ) : (
        <FaUndo
          title="Activate"
          size={20}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteRelationModal('reactivate');
            setOpenConfirmDeleteRelationModal(true);
          }} 
        />
      )}
    </div>
  );
    const iconsForActionsUnit = (rowData) => (
    <div className="container-of-icons">
         <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setOpenAddEditPopup(true)}
      />
      {!rowData?.deletedAt ? (
        <MdDelete
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
           onClick={() => {
            setStateOfDeleteUnitModal('deactivate');
            setOpenConfirmDeleteUnitModal(true);
          }}
        />
      ) : (
        <FaUndo
          title="Activate"
          size={20}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteUnitModal('reactivate');
            setOpenConfirmDeleteUnitModal(true);
          }} 
        />
      )}
    </div>
  );
  const conjureFormContent = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <>
            <Form fluid layout="inline">
              <MyInput
                column
                fieldLabel="Group Name"
                fieldName="name"
                record={uom}
                setRecord={setUom}
              />
            </Form>
            <Form fluid layout="inline">
              <MyInput
                column
                fieldLabel="Code"
                fieldName="code"
                record={uom}
                setRecord={setUom}
              />
            </Form>
            <Form fluid layout="inline">
              <MyInput
                column
                fieldLabel="Description"
                fieldType="textarea"
                fieldName="description"
                record={uom}
                setRecord={setUom}
              />
            </Form>
          </>
        );
      case 1:
        return (
          <Form>
            <MyLabel label="Note: Order 1 represents the smallest unit "/>
            <div className="container-of-add-new-button">
              
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setUomUnit({...newApUomGroupsUnits})
                  setOpenAddEditPopup(true);
                  setChildStep(0);
                }}
                width="109px"
              >
                Add Units
              </MyButton>
            </div>
            <MyTable
              height={450}
              data={UOMGroupUnitListResponse?.object}
              columns={tableUnitsColumns}
              rowClassName={isSelectedUnit}
              onRowClick={rowData => {
                setUomUnit(rowData);
                setChildStep(0);
              }}
            />
            <DeletionConfirmationModal
              open={openConfirmDeleteUnitModal}
              setOpen={setOpenConfirmDeleteUnitModal}
              itemToDelete="unit"
              actionButtonFunction={
                stateOfDeleteUnitModal == 'deactivate'
                  ? () => handleDeactivateUomGroup(uomUnit)
                  : handleReactiveUom
              }
              actionType={stateOfDeleteUnitModal}
            />
          </Form>
        );
      case 2:
        return (
          <Form>
            <div className="container-of-add-new-button">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setUomRelation({...newApUomGroupsRelation})
                  setOpenAddEditRelationPopup(true);
                  setChildStep(1);
                }}
                width="109px"
              >
                Add Relation
              </MyButton>
            </div>
            <MyTable
              height={450}
              data={UOMGroupRelationListResponse?.object}
              columns={tableRelationColumns}
              rowClassName={isSelectedRelation}
              onRowClick={rowData => {
                setUomRelation(rowData);
              }}
            />
          </Form>
        );
    };
  };

  //Table units columns
  const tableUnitsColumns = [
    {
      key: 'units',
      title: <Translate>Units</Translate>,
      flexGrow: 4,
      render: rowData => (
        <span>
          {rowData.units}
        </span>
      )
    },
    {
      key: 'uomOrder',
      title: <Translate>Order</Translate>,
      flexGrow: 4,
      render: rowData => (
        <span>
          {rowData.uomOrder}
        </span>
      )
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActionsUnit(rowData)
    }
  ];

  //Table relation columns
  const tableRelationColumns = [
    {
      key: 'uomUnitFromKey',
      title: <Translate>Each</Translate>,
      flexGrow: 4,
      render: rowData => (
        <span>
          {conjureValueBasedOnKeyFromList(
            UOMGroupUnitListResponse?.object ?? [],
            rowData.uomUnitFromKey,
            'units'
          )}
        </span>
      )
    },
    {
      key: 'uomUnitToKey',
      title: <Translate>Contain</Translate>,
      flexGrow: 4,
      render: rowData => (
        <span>
          {conjureValueBasedOnKeyFromList(
            UOMGroupUnitListResponse?.object ?? [],
            rowData.uomUnitToKey,
            'units'
          )}
        </span>
      )
    },
    {
      key: 'relation',
      title: <Translate>Relation</Translate>,
      flexGrow: 4,
      render: rowData => (
        <span>
          {rowData.relation}
        </span>
      )
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];


  // child modal content
  const conjureFormChildContent = () => {
    switch (childStep) {
      case 0:
        return (
          <Form>
            <MyInput
              fieldType="select"
              fieldName="uomLkey"
              record={uomUnit}
              setRecord={setUomUnit}
              selectDataValue="key"
              selectDataLabel="lovDisplayVale"
              placeholder="Unit"
              selectData={UOMLovResponseData?.object ?? []}
              menuMaxHeight={200}
              width={350}
            />
            <MyInput
              fieldType="number"
              fieldName="uomOrder"
              record={uomUnit}
              setRecord={setUomUnit}
              width={350}
            />
          </Form>
        );
      case 1:
         return (
                  <Form>
                    <MyInput
                      fieldType="select"
                      fieldName="uomUnitFromKey"
                      record={uomRelation}
                      setRecord={setUomRelation}
                      selectDataValue="key"
                      selectDataLabel="units"
                      placeholder="Unit"
                      selectData={UOMGroupUnitListResponse?.object ?? []}
                      menuMaxHeight={200}
                      width={350}
                    />
                    <MyInput
                      fieldType="select"
                      fieldName="uomUnitToKey"
                      record={uomRelation}
                      setRecord={setUomRelation}
                      selectDataValue="key"
                      selectDataLabel="units"
                      placeholder="Unit"
                      selectData={UOMGroupUnitListResponse?.object ?? []}
                      menuMaxHeight={200}
                      width={350}
                    />
                    <MyInput
                      fieldType="number"
                      fieldName="relation"
                      record={uomRelation}
                      setRecord={setUomRelation}
                      width={350}
                    />
                  </Form>
                );  
    }
  };

  // Handle Save Uom Def
  const handleSave = () => {
   saveUomGroup({
      ...uom,
    }).unwrap().then((result) => {
      console.log(result)
      setUom(result);
      uomRefetch();
      dispatch(
        notify({
          msg: 'The UOM group Added/Edited successfully ',
          sev: 'success'
        })
      );
    }).catch((e) => {

      if (e.status === 422) {
        console.log("Validation error: Unprocessable Entity", e);

      } else {
        console.log("An unexpected error occurred", e);
        dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warn' }));
      }
    });;

  };

  // Handle Save Uom unit
  const handleSaveUnits = () => {
    const response = saveUomGroupUnits({
      ...uomUnit,
      uomGroupKey: uom?.key
    }).unwrap().then(() => {
      uomUnitRefetch();
      setUomUnit({
        ...newApUomGroupsUnits,
        uomLkey:null
      });
      dispatch(
        notify({
          msg: 'The UOM group unit was successfully ',
          sev: 'success'
        })
      );
    }).catch((e) => {

      if (e.status === 422) {
        console.log("Validation error: Unprocessable Entity", e);

      } else {
        console.log("An unexpected error occurred", e);
        dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warn' }));
      }
    });;

  };

  // Handle Save Uom relation
  const handleSaveRelation = () => {
    const response = saveUomGroupRelation({
      ...uomRelation,
      uomGroupKey: uom?.key
    }).unwrap().then(() => {
      uomRelationRefetch();
      setUomRelation({
        ...newApUomGroupsRelation
      });
      dispatch(
        notify({
          msg: 'The UOM group Relation was successfully ',
          sev: 'success'
        })
      );
    }).catch((e) => {

      if (e.status === 422) {
        console.log("Validation error: Unprocessable Entity", e);

      } else {
        console.log("An unexpected error occurred", e);
        dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warn' }));
      }
    });;

  };
  const handleClear = () => {
    setUom({
      ...newApUomGroups
    })
  };


  useEffect(() => {

    const updatedFilters = [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
      ,
      {
        fieldName: 'uom_group_key',
        operator: 'match',
        value: uom?.key

      }
    ];

    setRelationListRequest((prevRequest) => ({
      ...prevRequest,
      filters: updatedFilters,

    }));
  }, [
    uomRelation,
     uom?.key
  ]);

    useEffect(() => {

    const updatedFilters = [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
      ,
      {
        fieldName: 'uom_group_key',
        operator: 'match',
        value: uom?.key

      }
    ];

    setUnitListRequest((prevRequest) => ({
      ...prevRequest,
      filters: updatedFilters,

    }));
  }, [uomUnit ,  uom?.key]);

  return (
    <ChildModal
      open={open}
      setOpen={setOpen}
      title={uom?.key ? 'Edit UOM Group' : 'New UOM Group'}
      showChild={ childStep == 1 ?  openAddEditRelationPopup : openAddEditPopup}
      setShowChild={childStep == 1 ? setOpenAddEditRelationPopup :setOpenAddEditPopup}
      childTitle={childStep == 1 ? "New/Edit UOM Relation" : "New/Edit UOM Units"}
      childContent={conjureFormChildContent}
      actionChildButtonFunction={
        childStep == 1 ? handleSaveRelation : handleSaveUnits
      }
      mainStep={[{
        title: 'UOM Group',
        disabledNext: !uom?.key,
        icon: <FontAwesomeIcon icon={faBox} />,
        footer: <><MyButton prefixIcon={() => <FontAwesomeIcon icon={faBroom} />} onClick={handleClear}  >Clear</MyButton>
          <MyButton
            onClick={handleSave}
            prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}>Save</MyButton> </>
      }
        , {
        title: 'UOM Units', icon: <FontAwesomeIcon icon={faBoxesStacked} />
      }
        , { title: 'UOM Conversion', icon: <FontAwesomeIcon icon={faBoxesPacking} /> }]}
      mainContent={conjureFormContent}
      mainSize="sm"
    />
  );
};
export default AddEditUom;
