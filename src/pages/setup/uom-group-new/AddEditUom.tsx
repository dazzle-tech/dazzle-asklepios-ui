import { useAppDispatch } from '@/hooks';
import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import './styles.less';
import {
  faBox,
  faBoxesPacking,
  faBoxesStacked,
  faBroom,
  faCheckDouble,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { notify } from '@/utils/uiReducerActions';
import ChildModal from '@/components/ChildModal';
import MyTable from '@/components/MyTable';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import MyInput from '@/components/MyInput';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyLabel from '@/components/MyLabel';
import {
  useCreateRelationMutation,
  useCreateUnitMutation,
  useCreateUOMGroupMutation,
  useDeleteUOMUnitMutation,
  useGetAllRelationByUOMGroupQuery,
  useGetAllUnitsByGroupIdQuery,
  useUpdateUOMGroupMutation,
  useUpdateUOMUnitMutation
} from '@/services/setup/uom-group/uomGroupService';
import { UOMGroupRelation, UOMGroupUnit } from '@/types/model-types-new';
import { newUOMGroup, newUOMGroupRelation, newUOMGroupUnit } from '@/types/model-types-constructor-new';
import { useEnumOptions } from '@/services/enumsApi';
const AddEditUom = ({ open, setOpen, uom, setUom, refetchUomGroups, width }) => {
  const dispatch = useAppDispatch();
  const [uomUnit, setUomUnit] = useState<UOMGroupUnit>({
    ...newUOMGroupUnit
  });
  const [uomRelation, setUomRelation] = useState<UOMGroupRelation>({
    ...newUOMGroupRelation
  });
 
  const [openConfirmDeleteUnitModal, setOpenConfirmDeleteUnitModal] = useState<boolean>(false);

  
  
  // const { data: UOMGroupListResponse, refetch: uomRefetch } = useGetUomGroupsQuery({ ...initialListRequest });
  const { data: UOMGroupUnitListResponse, refetch: uomUnitRefetch } = useGetAllUnitsByGroupIdQuery(
    uom.id,
    { skip: !uom?.id }
  );
  const { data: UOMGroupRelationListResponse, refetch: uomRelationRefetch } =
    useGetAllRelationByUOMGroupQuery( uom.id,
    { skip: !uom?.id });
    useEffect(() => {
      console.log("UOMGroupRelationListResponse");
         console.log(UOMGroupRelationListResponse);
    },[uom]);
  const [childStep, setChildStep] = useState<number>(-1);
  const uoms = useEnumOptions('UOM');
  // class name for selected row in uom unit table
  const isSelectedUnit = rowData => {
    if (rowData && rowData.id === uomUnit.id) {
      return 'selected-row';
    } else return '';
  };

  // class name for selected row in uom relation table
  const isSelectedRelation = rowData => {
    if (rowData && rowData?.id === uomRelation?.id) {
      return 'selected-row';
    } else return '';
  };
  // Fetch UOM Lov list response
  // const [filteredResourcesList, setFilteredResourcesList] = useState([]);
  const [openAddEditPopup, setOpenAddEditPopup] = useState<boolean>(false);
  const [openAddEditRelationPopup, setOpenAddEditRelationPopup] = useState<boolean>(false);
  const [createUomGroup] = useCreateUOMGroupMutation();
  const [updateUomGroup] = useUpdateUOMGroupMutation();
  const [createUomGroupUnits] = useCreateUnitMutation();
  const [updateUomGroupUnits] = useUpdateUOMUnitMutation();
  const [createUomGroupRelation] = useCreateRelationMutation();
  const [deleteUomGroupUnit] = useDeleteUOMUnitMutation();

  const handleDeleteUomGroupUnit = async () => {
    setOpenConfirmDeleteUnitModal(false);
    try {
      await deleteUomGroupUnit(uomUnit?.id)
        .unwrap()
        .then(() => {
          uomUnitRefetch();
          dispatch(
            notify({
              msg: 'The UOM group unit was successfully deleted' ,
              sev: 'success'
            })
          );
        });
    } catch (error) {
      dispatch(
        notify({
          msg: 'Failed to delete this UOM group unit',
          sev: 'error'
        })
      );
    }
  };
  
  const iconsForActions = () => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setOpenAddEditRelationPopup(true)}
      />
      {/* deactivate/activate  when click on one of these icon */}
        <MdDelete
          title="Delete"
          size={24}
          className="icons-style"
          fill="var(--primary-pink)"
          // onClick={() => {
          //   setStateOfDeleteRelationModal('deactivate');
          //   setOpenConfirmDeleteRelationModal(true);
          // }}
        />
      
    </div>
  );
  const iconsForActionsUnit = () => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setOpenAddEditPopup(true)}
      />
      <MdDelete
        title="Delete"
        className="icons-style"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => {
          setOpenConfirmDeleteUnitModal(true);
        }}
      />
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
            <MyLabel label="Note: Order 1 represents the smallest unit " />
            <div className="container-of-add-new-button">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setUomUnit({ ...newUOMGroupUnit });
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
              data={UOMGroupUnitListResponse ?? []}
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
              actionButtonFunction={() => handleDeleteUomGroupUnit()}
              actionType="delete"
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
                  setUomRelation({ ...newUOMGroupRelation });
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
              data={UOMGroupRelationListResponse ?? []}
              columns={tableRelationColumns}
              rowClassName={isSelectedRelation}
              onRowClick={rowData => {
                setUomRelation(rowData);
              }}
            />
          </Form>
        );
    }
  };

  //Table units columns
  const tableUnitsColumns = [
    {
      key: 'uom',
      title: 'Units'
      // flexGrow: 4,
      // render: rowData => <span>{rowData.unit}</span>
    },
    {
      key: 'uomOrder',
      title: 'Order'
      // render: rowData => <span>{rowData.uomOrder}</span>
    },
    {
      key: 'icons',
      title: '',
      render: () => iconsForActionsUnit()
    }
  ];

  //Table relation columns
  const tableRelationColumns = [
    {
      key: 'uomUnitFromKey',
      title: 'Each',
      flexGrow: 4,
      render: rowData => (
        <span>
          {rowData?.fromUnit?.id}
        </span>
      )
    },
    {
      key: 'uomUnitToKey',
      title: 'Contain',
      render: rowData => (
        <span>
           {rowData?.toUnit?.id}
        </span>
      )
    },
    {
      key: 'relation',
      title: 'Relation',
      flexGrow: 4,
      render: rowData => <span>{rowData.relation}</span>
    },
    {
      key: 'icons',
      title: '',
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
              fieldName="uom"
              record={uomUnit}
              setRecord={setUomUnit}
              selectDataValue="value"
              selectDataLabel="label"
              placeholder="Unit"
              selectData={uoms ?? []}
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
              fieldName="uom_unit_from_id"
              record={uomRelation}
              setRecord={setUomRelation}
              selectDataValue="id"
              selectDataLabel="uom"
              placeholder="Unit"
              selectData={UOMGroupUnitListResponse ?? []}
              menuMaxHeight={200}
              width={350}
              searchable={false}
            />
            <MyInput
              fieldType="select"
              fieldName="uom_unit_to_id"
              record={uomRelation}
              setRecord={setUomRelation}
              selectDataValue="id"
              selectDataLabel="uom"
              placeholder="Unit"
              selectData={UOMGroupUnitListResponse ?? []}
              menuMaxHeight={200}
              width={350}
              searchable={false}
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
    if(!uom?.id)
    createUomGroup(uom)
      .unwrap()
      .then(result => {
        setUom(result);
        refetchUomGroups();
        dispatch(
          notify({
            msg: 'The UOM group Added/Edited successfully ',
            sev: 'success'
          })
        );
      })
      .catch(e => {
        if (e.status === 422) {
        } else {
          dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warning' }));
        }
      });
      else
         updateUomGroup(uom)
      .unwrap()
      .then(result => {
        setUom(result);
        refetchUomGroups();
        dispatch(
          notify({
            msg: 'The UOM group updated successfully ',
            sev: 'success'
          })
        );
      })
      .catch(e => {
        if (e.status === 422) {
        } else {
          dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warning' }));
        }
      });
  };

  // Handle Save Uom unit
  const handleSaveUnits = () => {
    if(!uomUnit?.id){
    createUomGroupUnits({
      groupId: uom?.id,
      UomGroupUnit: uomUnit
    })
      .unwrap()
      .then(() => {
        uomUnitRefetch();
        setUomUnit({
          ...newUOMGroupUnit
        });
        dispatch(
          notify({
            msg: 'The UOM group unit was created successfully ',
            sev: 'success'
          })
        );
      })
      .catch(e => {
        if (e.status === 422) {
        } else {
          dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warning' }));
        }
      });
    }else{
      updateUomGroupUnits(uomUnit)
      .unwrap()
      .then(() => {
        uomUnitRefetch();
        setUomUnit({
          ...newUOMGroupUnit
        });
        dispatch(
          notify({
            msg: 'The UOM group unit was updated successfully',
            sev: 'success'
          })
        );
      })
      .catch(e => {
        if (e.status === 422) {
        } else {
          dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warning' }));
        }
      });
    }
  };

  // Handle Save Uom relation
  const handleSaveRelation = () => {
    console.log("groupId");
    console.log(uom?.id);

    console.log("uomRelation");
    console.log(uomRelation);
    
    createUomGroupRelation({
     groupId: uom?.id,
     UomGroupRelation: uomRelation,
    })
      .unwrap()
      .then(() => {
        uomRelationRefetch();
        setUomRelation({
          ...newUOMGroupRelation
        });
        dispatch(
          notify({
            msg: 'The UOM group Relation was successfully ',
            sev: 'success'
          })
        );
      })
      .catch(e => {
        if (e.status === 422) {
        } else {
          dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warning' }));
        }
      });
  };
  const handleClear = () => {
    setUom({
      ...newUOMGroup
    });
  };

  return (
    <ChildModal
      open={open}
      setOpen={setOpen}
      title={uom?.id ? 'Edit UOM Group' : 'New UOM Group'}
      showChild={childStep == 1 ? openAddEditRelationPopup : openAddEditPopup}
      setShowChild={childStep == 1 ? setOpenAddEditRelationPopup : setOpenAddEditPopup}
      childTitle={childStep == 1 ? 'New/Edit UOM Relation' : 'New/Edit UOM Units'}
      childContent={conjureFormChildContent}
      actionChildButtonFunction={childStep == 1 ? handleSaveRelation : handleSaveUnits}
      mainStep={[
        {
          title: 'UOM Group',
          disabledNext: !uom?.id,
          icon: <FontAwesomeIcon icon={faBox} />,
          footer: (
            <>
              <MyButton prefixIcon={() => <FontAwesomeIcon icon={faBroom} />} onClick={handleClear}>
                Clear
              </MyButton>
              <MyButton
                onClick={handleSave}
                prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
              >
                Save
              </MyButton>{' '}
            </>
          )
        },
        {
          title: 'UOM Units',
          icon: <FontAwesomeIcon icon={faBoxesStacked} />
        },
        { title: 'UOM Conversion', icon: <FontAwesomeIcon icon={faBoxesPacking} /> }
      ]}
      mainContent={conjureFormContent}
      mainSize="sm"
    />
  );
};
export default AddEditUom;
