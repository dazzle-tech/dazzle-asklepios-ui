import { useAppDispatch } from '@/hooks';
import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import './styles.less';
import {
  faBox,
  faBoxesPacking,
  faBoxesStacked,
  faBroom,
  faCheckDouble
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
  useDeleteUOMRelationMutation,
  useDeleteUOMUnitMutation,
  useGetAllRelationByUOMGroupQuery,
  useGetAllUnitsByGroupIdQuery,
  useUpdateUOMGroupMutation,
  useUpdateUOMRelationMutation,
  useUpdateUOMUnitMutation
} from '@/services/setup/uom-group/uomGroupService';
import { UOMGroupRelation, UOMGroupUnit } from '@/types/model-types-new';
import {
  newUOMGroup,
  newUOMGroupRelation,
  newUOMGroupUnit
} from '@/types/model-types-constructor-new';
import { useEnumOptions } from '@/services/enumsApi';
import { formatEnumString } from '@/utils';
const AddEditUom = ({ open, setOpen, uom, setUom, refetchUomGroups }) => {
  const dispatch = useAppDispatch();
  const [uomUnit, setUomUnit] = useState<UOMGroupUnit>({
    ...newUOMGroupUnit
  });
  const [uomRelation, setUomRelation] = useState<UOMGroupRelation>({
    ...newUOMGroupRelation
  });
  const [uomRelationUpdated, setUomRelationUpdated] = useState({});
  const [openConfirmDeleteUnitModal, setOpenConfirmDeleteUnitModal] = useState<boolean>(false);
  const [openConfirmDeleteRelationModal, setOpenConfirmDeleteRelationModal] =
    useState<boolean>(false);
  const [childStep, setChildStep] = useState<number>(-1);
  const [openAddEditPopup, setOpenAddEditPopup] = useState<boolean>(false);
  const [openAddEditRelationPopup, setOpenAddEditRelationPopup] = useState<boolean>(false);
  // enum for uoms
  const uoms = useEnumOptions('UOM');
  // Fetch units list response
  const { data: UOMGroupUnitListResponse, refetch: uomUnitRefetch } = useGetAllUnitsByGroupIdQuery(
    uom.id,
    { skip: !uom?.id }
  );
  // Fetch relations list response
  const { data: UOMGroupRelationListResponse, refetch: uomRelationRefetch } =
    useGetAllRelationByUOMGroupQuery(uom.id, { skip: !uom?.id });


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
  // create, delete and update functions
  const [createUomGroup] = useCreateUOMGroupMutation();
  const [updateUomGroup] = useUpdateUOMGroupMutation();
  const [createUomGroupUnits] = useCreateUnitMutation();
  const [updateUomGroupUnits] = useUpdateUOMUnitMutation();
  const [createUomGroupRelation] = useCreateRelationMutation();
  const [deleteUomGroupUnit] = useDeleteUOMUnitMutation();
  const [deleteUomRelation] = useDeleteUOMRelationMutation();
  const [updateUomRelation] = useUpdateUOMRelationMutation();
  // handle delete uom unit
  const handleDeleteUomGroupUnit = async () => {
    setOpenConfirmDeleteUnitModal(false);
    try {
      await deleteUomGroupUnit(uomUnit?.id)
        .unwrap()
        .then(() => {
          uomUnitRefetch();
          dispatch(
            notify({
              msg: 'The UOM group unit was successfully deleted',
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

  // handle delete uom relation
  const handleDeleteUomGroupRelation = async () => {
    setOpenConfirmDeleteRelationModal(false);
    try {
      await deleteUomRelation({ groupId: uom?.id, id: uomRelation?.id })
        .unwrap()
        .then(() => {
          uomRelationRefetch();
          dispatch(
            notify({
              msg: 'The UOM group relation was successfully deleted',
              sev: 'success'
            })
          );
        });
    } catch (error) {
      dispatch(
        notify({
          msg: 'Failed to delete this UOM group Relation',
          sev: 'error'
        })
      );
    }
  };

  useEffect(() => {
    console.log("in effect");
    if (openAddEditRelationPopup && uomRelation?.id)
      setUomRelationUpdated({
        id: uomRelation?.id,
        fromUnitId: uomRelation?.fromUnit?.id,
        toUnitId: uomRelation?.toUnit?.id,
        relation: uomRelation?.relation
      });
      
  }, [openAddEditRelationPopup]);

  useEffect(() => {
    console.log("uomRelationUpdated");
     console.log(uomRelationUpdated);
  },[uomRelationUpdated]);
  // icons column for relation table
  const iconsForActions = () => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setOpenAddEditRelationPopup(true);
          setChildStep(1);
          // setUomRelationUpdated({
          //   id: uomRelation?.id,
          //   fromUnitId: uomRelation?.fromUnit?.id,
          //   toUnitId: uomRelation?.toUnit?.id,
          //   relation: uomRelation?.relation
          // });
        }}
      />
      {/* delete  when click on this icon */}
      <MdDelete
        title="Delete"
        size={24}
        className="icons-style"
        fill="var(--primary-pink)"
        onClick={() => {
          setOpenConfirmDeleteRelationModal(true);
        }}
      />
    </div>
  );

  // icons column for units table
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

  // Content of parent modal
  const conjureFormContent = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
              fieldLabel="Group Name"
              fieldName="name"
              record={uom}
              setRecord={setUom}
              width="100%"
            />
            <MyInput
              fieldLabel="Description"
              fieldType="textarea"
              fieldName="description"
              record={uom}
              setRecord={setUom}
              width="100%"
            />
          </Form>
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
                width="120px"
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
                width="125px"
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
            <DeletionConfirmationModal
              open={openConfirmDeleteRelationModal}
              setOpen={setOpenConfirmDeleteRelationModal}
              itemToDelete="relation"
              actionButtonFunction={() => handleDeleteUomGroupRelation()}
              actionType="delete"
            />
          </Form>
        );
    }
  };

  //Table units columns
  const tableUnitsColumns = [
    {
      key: 'uom',
      title: 'Units',
      // flexGrow: 4,
      render: (row: any) => (row?.uom ? formatEnumString(row?.uom) : '')
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
      render: rowData => <span>{rowData?.fromUnit?.uom}</span>
    },
    {
      key: 'uomUnitToKey',
      title: 'Contain',
      render: rowData => <span>{rowData?.toUnit?.uom}</span>
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
      render: () => iconsForActions()
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
              fieldName="fromUnitId"
              fieldLabel="from Unit"
              // record={!uomRelation?.id ? uomRelation : uomRelationUpdated}
              // setRecord={!uomRelation?.id ? setUomRelation : setUomRelationUpdated}
              record={uomRelationUpdated}
              setRecord={setUomRelationUpdated}
              selectDataValue="id"
              selectDataLabel="uom"
              placeholder="Unit"
              selectData={UOMGroupUnitListResponse ?? []}
              menuMaxHeight={200}
              width={350}
              searchable={false}
              disabled={!!uomRelation?.id}
            />
            <MyInput
              fieldType="select"
              fieldName="toUnitId"
              fieldLabel="To Unit"
              // record={!uomRelation?.id ? uomRelation : uomRelationUpdated}
              // setRecord={!uomRelation?.id ? setUomRelation : setUomRelationUpdated}
              record={uomRelationUpdated}
              setRecord={setUomRelationUpdated}
              selectDataValue="id"
              selectDataLabel="uom"
              placeholder="Unit"
              selectData={UOMGroupUnitListResponse ?? []}
              menuMaxHeight={200}
              width={350}
              searchable={false}
              disabled={!!uomRelation?.id}
            />
            <MyInput
              fieldType="number"
              fieldName="relation"
              // record={!uomRelation?.id ? uomRelation : uomRelationUpdated}
              // setRecord={!uomRelation?.id ? setUomRelation : setUomRelationUpdated}
              record={uomRelationUpdated}
              setRecord={setUomRelationUpdated}
              width={350}
            />
          </Form>
        );
    }
  };

  // Handle Save Uom
  const handleSave = () => {
    if (!uom?.id)
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
    else {
      const updatedUom = { id: uom?.id, description: uom?.description, name: uom?.name };
      updateUomGroup(updatedUom)
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
    }
  };

  // Handle Save Uom unit
  const handleSaveUnits = () => {
    if (!uomUnit?.id) {
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
    } else {
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
    if (!uomRelation?.id) {
      createUomGroupRelation({
        groupId: uom?.id,
        UomGroupRelation: uomRelationUpdated
      })
        .unwrap()
        .then(() => {
          uomRelationRefetch();
          setUomRelation({
            ...newUOMGroupRelation
          });
          setUomRelationUpdated({
            // id: undefined,
            // fromUnitId: undefined,
            // toUnitId: undefined,
            // relation: 0
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
    } else {
      const updated = { id: uomRelation?.id, relation: uomRelationUpdated?.relation };
      updateUomRelation({ groupId: uom?.id, uomRelation: updated })
        .unwrap()
        .then(() => {
          uomRelationRefetch();
          setUomRelation({
            ...newUOMGroupRelation
          });
          setUomRelationUpdated({
            // id: undefined,
            // fromUnitId: undefined,
            // toUnitId: undefined,
            // relation: 0
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
    }
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
