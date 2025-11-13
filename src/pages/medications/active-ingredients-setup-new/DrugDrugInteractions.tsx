import React, { useEffect, useState } from 'react';
import { Text, Form } from 'rsuite';
import { Plus } from '@rsuite/icons';
import { MdSave } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import {
  useGetActiveIngredientQuery,
  useSaveActiveIngredientDrugInteractionMutation,
  useRemoveActiveIngredientDrugInteractionMutation,
  useGetActiveIngredientDrugInteractionByKeyQuery
} from '@/services/medicationsSetupService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { ApActiveIngredientDrugInteraction } from '@/types/model-types';
import { newApActiveIngredientDrugInteraction } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
const DrugDrugInteractions = ({ activeIngredients }) => {
  const dispatch = useAppDispatch();
  const [selectedActiveIngredientDrugInteraction, setSelectedActiveIngredientDrugInteraction] =
    useState<ApActiveIngredientDrugInteraction>({
      ...newApActiveIngredientDrugInteraction
    });
  const [openConfirmDeleteDrugInteractionModal, setOpenConfirmDeleteDrugInteractionModal] =
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
  const [activeIngredientsListRequest] = useState<ListRequest>({
    ...initialListRequest
  });
  // Fetch active ingredients list response
  const { data: activeIngredientListResponseData } = useGetActiveIngredientQuery(
    activeIngredientsListRequest
  );
  // Fetch severity Lov response
  const { data: severityLovQueryResponseData } = useGetLovValuesByCodeQuery('SEVERITY');
  // Fetch drug list response
  const {
    data: drugListResponseData,
    refetch: drugRefetch,
    isFetching
  } = useGetActiveIngredientDrugInteractionByKeyQuery(activeIngredients.key || '');
  // save active ingredient drug interaction
  const [saveActiveIngredientDrugInteraction, saveActiveIngredientDrugInteractionMutation] =
    useSaveActiveIngredientDrugInteractionMutation();
  // remove active ingredient drug interaction
  const [removeActiveIngredientDrugInteraction, removeActiveIngredientDrugInteractionMutation] =
    useRemoveActiveIngredientDrugInteractionMutation();

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && rowData.key === selectedActiveIngredientDrugInteraction.key) {
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
        onClick={() => setOpenConfirmDeleteDrugInteractionModal(true)}
      />
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'activeIngredients',
      title: <Translate>Active Ingredients</Translate>,
      render: rowData => (
        <span>
          {conjureValueBasedOnKeyFromList(
            activeIngredientListResponseData?.object ?? [],
            activeIngredients.key === rowData.activeIngredientKey
              ? rowData.interactedActiveIngredientKey
              : rowData.activeIngredientKey,
            'name'
          )}
        </span>
      )
    },
    {
      key: 'severity',
      title: <Translate>Severity</Translate>,
      render: rowData =>
        rowData.severityLvalue ? rowData.severityLvalue.lovDisplayVale : rowData.severityLkey
    },
    {
      key: 'description',
      title: <Translate>Description</Translate>,
      render: rowData => <Text>{rowData.description}</Text>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      render: () => iconsForActions()
    }
  ];

  // handle save
  const save = () => {
    saveActiveIngredientDrugInteraction({
      ...selectedActiveIngredientDrugInteraction,
      activeIngredientKey: activeIngredients.key,
      createdBy: 'Administrator'
    })
      .unwrap()
      .then(() => {
        dispatch(notify('Added successfully'));
        drugRefetch();
      });
  };

  // handle new
  const handleDrugsNew = () => {
    setSelectedActiveIngredientDrugInteraction({
      ...newApActiveIngredientDrugInteraction
    });
  };

  // handle remove
  const remove = () => {
    setOpenConfirmDeleteDrugInteractionModal(false);
    if (selectedActiveIngredientDrugInteraction.key) {
      removeActiveIngredientDrugInteraction({
        ...selectedActiveIngredientDrugInteraction
      })
        .unwrap()
        .then(() => {
          dispatch(notify('Deleted successfully'));
          drugRefetch();
        });
    }
  };

  // Effects
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
    drugRefetch();
  }, [activeIngredients.key]);

  useEffect(() => {
    if (saveActiveIngredientDrugInteractionMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getTime()
      });

      setSelectedActiveIngredientDrugInteraction({ ...newApActiveIngredientDrugInteraction });
    }
  }, [saveActiveIngredientDrugInteractionMutation]);

  useEffect(() => {
    if (removeActiveIngredientDrugInteractionMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getTime()
      });

      setSelectedActiveIngredientDrugInteraction({ ...newApActiveIngredientDrugInteraction });
    }
  }, [removeActiveIngredientDrugInteractionMutation]);

  return (
    <Form fluid>
      <div className="container-of-actions-header-active">
        <div className="container-of-fields-active">
          <MyInput
            fieldLabel="Active Ingredients"
            fieldName="interactedActiveIngredientKey"
            fieldType="select"
            selectData={activeIngredientListResponseData?.object ?? []}
            selectDataLabel={'name'}
            selectDataValue="key"
            record={selectedActiveIngredientDrugInteraction}
            setRecord={setSelectedActiveIngredientDrugInteraction}
            menuMaxHeight={200}
            width={200}
            required
          />
          <MyInput
            fieldType="select"
            selectData={severityLovQueryResponseData?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            width={200}
            fieldName="severityLkey"
            fieldLabel="Severity"
            record={selectedActiveIngredientDrugInteraction}
            setRecord={setSelectedActiveIngredientDrugInteraction}
            required
          />
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
            onClick={handleDrugsNew}
            title="New"
          ></MyButton>
        </div>
      </div>
      <MyInput
        width="100%"
        fieldName="description"
        fieldType="textarea"
        record={selectedActiveIngredientDrugInteraction}
        setRecord={setSelectedActiveIngredientDrugInteraction}
        required
      />
      <br />
      <MyTable
        noBorder
        height={450}
        data={drugListResponseData?.object ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setSelectedActiveIngredientDrugInteraction(rowData);
        }}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteDrugInteractionModal}
        setOpen={setOpenConfirmDeleteDrugInteractionModal}
        itemToDelete="Drug Interaction"
        actionButtonFunction={remove}
        actionType="Delete"
      />
    </Form>
  );
};

export default DrugDrugInteractions;
