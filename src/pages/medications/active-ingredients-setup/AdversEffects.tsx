import React, { useEffect, useState } from 'react';
import { Text, Panel, Form } from 'rsuite';
import { Plus } from '@rsuite/icons';
import { MdSave } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import {
  useGetActiveIngredientAdverseEffectQuery,
  useSaveActiveIngredientAdverseEffectMutation,
  useRemoveActiveIngredientAdverseEffectMutation
} from '@/services/medicationsSetupService';
import { newApActiveIngredientAdverseEffect } from '@/types/model-types-constructor';
import { ApActiveIngredientAdverseEffect } from '@/types/model-types';
import { initialListRequest } from '@/types/types';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import './styles.less';
const AdversEffects = ({ activeIngredients }) => {
  const dispatch = useAppDispatch();
  const [selectedActiveIngredientAdverseEffect, setSelectedActiveIngredientAdverseEffect] =
    useState<ApActiveIngredientAdverseEffect>({
      ...newApActiveIngredientAdverseEffect
    });
  const [openConfirmDeleteAdversEffectsModal, setOpenConfirmDeleteAdversEffectsModal] =
    useState<boolean>(false);
  const [listRequest, setListRequest] = useState({
    ...initialListRequest,
    pageSize: 100,
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });
  // Fetch advers Effects Lov response
  const { data: AdversEffectsLovQueryResponseData } =
    useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');
  // Fetch adverse list response
  const { data: AdverseListResponseData, isFetching } =
    useGetActiveIngredientAdverseEffectQuery(listRequest);
  // save active ingredient adverse effect
  const [saveActiveIngredientAdverseEffect, saveActiveIngredientAdverseEffectMutation] =
    useSaveActiveIngredientAdverseEffectMutation();
  // remove active ingredient adverse effect
  const [removeActiveIngredientAdverseEffect, removeActiveIngredientAdverseEffectMutation] =
    useRemoveActiveIngredientAdverseEffectMutation();

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && rowData.key === selectedActiveIngredientAdverseEffect.key) {
      return 'selected-row';
    } else return '';
  };

  // Icons column (remove)
  const iconsForActions = () => (
    <div className="container-of-icons">
      <MdDelete
        className="icons-style"
        title="Delete"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => setOpenConfirmDeleteAdversEffectsModal(true)}
      />
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'adversEffects',
      title: <Translate>Advers Effects</Translate>,
      render: rowData =>
        rowData.adverseEffectLvalue
          ? rowData.adverseEffectLvalue.lovDisplayVale
          : rowData.adverseEffectLkey
    },
    {
      key: 'other',
      title: <Translate>Other</Translate>,
      render: rowData => <Text>{rowData.otherDescription}</Text>
    },

    {
      key: 'icons',
      title: <Translate>Actions</Translate>,
      render: () => iconsForActions()
    }
  ];

  // handle save
  const save = () => {
    if (selectedActiveIngredientAdverseEffect.adverseEffectLkey) {
      if (
        selectedActiveIngredientAdverseEffect.adverseEffectLkey == '946334189825500' &&
        !selectedActiveIngredientAdverseEffect.otherDescription
      ) {
        dispatch(notify({ msg: 'Missing Information', sev: 'error' }));
        return;
      }
      saveActiveIngredientAdverseEffect({
        ...selectedActiveIngredientAdverseEffect,
        activeIngredientKey: activeIngredients.key,
        createdBy: 'Administrator'
      })
        .unwrap()
        .then(() => {
          setSelectedActiveIngredientAdverseEffect({
            ...newApActiveIngredientAdverseEffect,
            adverseEffectLkey: null
          });
          dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
        });
    } else {
      dispatch(notify({ msg: 'You Don`t select an Effect', sev: 'error' }));
    }
  };

  // handle remove
  const remove = () => {
    setOpenConfirmDeleteAdversEffectsModal(false);
    if (selectedActiveIngredientAdverseEffect.key) {
      removeActiveIngredientAdverseEffect({
        ...selectedActiveIngredientAdverseEffect
      })
        .unwrap()
        .then(() => {
          dispatch(notify({ msg: 'Deleted successfully', sev: 'success' }));
        });
    }
  };

  // handle new  (clear fields)
  const handleNew = () => {
    setSelectedActiveIngredientAdverseEffect({
      ...newApActiveIngredientAdverseEffect,
      adverseEffectLkey: null
    });
  };

  // Effects
  useEffect(() => {
    if (saveActiveIngredientAdverseEffectMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getTime()
      });

      setSelectedActiveIngredientAdverseEffect({ ...newApActiveIngredientAdverseEffect });
    }
  }, [saveActiveIngredientAdverseEffectMutation]);

  useEffect(() => {
    if (removeActiveIngredientAdverseEffectMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getTime()
      });

      setSelectedActiveIngredientAdverseEffect({ ...newApActiveIngredientAdverseEffect });
    }
  }, [removeActiveIngredientAdverseEffectMutation]);

  useEffect(() => {
    const updatedFilters = [
      {
        fieldName: 'active_ingredient_key',
        operator: 'match',
        value: activeIngredients.key || undefined
      },
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ];
    setListRequest(prevRequest => ({
      ...prevRequest,
      filters: updatedFilters
    }));
  }, [activeIngredients.key]);

  useEffect(() => {
    console.log(selectedActiveIngredientAdverseEffect);
  }, [selectedActiveIngredientAdverseEffect]);

  return (
    <Panel>
      <Form fluid layout="inline">
        <div className="container-of-actions-header-active">
          <div className="container-of-fields-active">
            <MyInput
              column
              width={200}
              showLabel={false}
              fieldType="select"
              placeholder="Select Effect"
              fieldName="adverseEffectLkey"
              selectData={AdversEffectsLovQueryResponseData?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={selectedActiveIngredientAdverseEffect}
              setRecord={setSelectedActiveIngredientAdverseEffect}
              menuMaxHeight={150}
            />
            {selectedActiveIngredientAdverseEffect.adverseEffectLkey == '946334189825500' && (
              <MyInput
                column
                width={200}
                showLabel={false}
                fieldName="otherDescription"
                record={selectedActiveIngredientAdverseEffect}
                setRecord={setSelectedActiveIngredientAdverseEffect}
              />
            )}
          </div>
          <div className="container-of-buttons-active">
            <MyButton
              prefixIcon={() => <MdSave />}
              color="var(--deep-blue)"
              onClick={save}
              title="Save"
            ></MyButton>
            <MyButton
              prefixIcon={() => <Plus />}
              color="var(--deep-blue)"
              onClick={handleNew}
              title="New"
            ></MyButton>
          </div>
        </div>
      </Form>
      <MyTable
        height={450}
        data={AdverseListResponseData?.object ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setSelectedActiveIngredientAdverseEffect(rowData);
        }}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteAdversEffectsModal}
        setOpen={setOpenConfirmDeleteAdversEffectsModal}
        itemToDelete="Adverse Effect"
        actionButtonFunction={remove}
        actionType="Delete"
      />
      <br />
    </Panel>
  );
};

export default AdversEffects;
