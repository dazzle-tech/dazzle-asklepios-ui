import React, { useEffect, useState } from 'react';
import { Row, Col, Text, Form } from 'rsuite';
import { MdDelete } from 'react-icons/md';
import { Plus } from '@rsuite/icons';
import { MdSave } from 'react-icons/md';
import { ApActiveIngredientFoodInteraction } from '@/types/model-types';
import { newApActiveIngredientFoodInteraction } from '@/types/model-types-constructor';
import { initialListRequest } from '@/types/types';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import {
  useGetActiveIngredientFoodInteractionQuery,
  useSaveActiveIngredientFoodInteractionMutation,
  useRemoveActiveIngredientFoodInteractionMutation
} from '@/services/medicationsSetupService';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

const DrugFoodInteractions = ({ activeIngredients }) => {
  const dispatch = useAppDispatch();
  const [selectedActiveIngredientFoodInteraction, setSelectedActiveIngredientFoodInteraction] =
    useState<ApActiveIngredientFoodInteraction>({
      ...newApActiveIngredientFoodInteraction
    });
  const [openConfirmDeleteFoodInteractionModal, setOpenConfirmDeleteFoodInteractionModal] =
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
  // Fetch food list response
  const {
    data: foodListResponseData,
    refetch,
    isFetching
  } = useGetActiveIngredientFoodInteractionQuery(listRequest);
  // Fetch severity Lov response
  const { data: severityLovQueryResponseData } = useGetLovValuesByCodeQuery('SEVERITY');
  // save active ingredient food interaction
  const [saveActiveIngredientFoodInteraction, saveActiveIngredientFoodInteractionMutation] =
    useSaveActiveIngredientFoodInteractionMutation();
  // remove active ingredient food interaction
  const [removeActiveIngredientFoodInteraction, removeActiveIngredientFoodInteractionMutation] =
    useRemoveActiveIngredientFoodInteractionMutation();

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && rowData.key === selectedActiveIngredientFoodInteraction.key) {
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
        onClick={() => setOpenConfirmDeleteFoodInteractionModal(true)}
      />
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'food',
      title: <Translate>Food</Translate>,
      render: rowData => <Text>{rowData.foodDescription}</Text>
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
    saveActiveIngredientFoodInteraction({
      ...selectedActiveIngredientFoodInteraction,
      activeIngredientKey: activeIngredients.key,
      createdBy: 'Administrator'
    })
      .unwrap()
      .then(() => {
        dispatch(notify('Saved successfully'));
        setSelectedActiveIngredientFoodInteraction({
          ...newApActiveIngredientFoodInteraction,
          severityLkey: null
        });
      });
  };

  // handle new
  const handleFoodsNew = () => {
    setSelectedActiveIngredientFoodInteraction({
      ...newApActiveIngredientFoodInteraction
    });
  };

  // handle remove
  const remove = () => {
    setOpenConfirmDeleteFoodInteractionModal(false);
    if (selectedActiveIngredientFoodInteraction.key) {
      removeActiveIngredientFoodInteraction({
        ...selectedActiveIngredientFoodInteraction
      })
        .unwrap()
        .then(() => {
          refetch();
          dispatch(notify('Deleted successfully'));
        });
    }
  };

  // Effects
  useEffect(() => {
    if (saveActiveIngredientFoodInteractionMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getTime()
      });

      setSelectedActiveIngredientFoodInteraction({ ...newApActiveIngredientFoodInteraction });
    }
  }, [saveActiveIngredientFoodInteractionMutation]);

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
    if (removeActiveIngredientFoodInteractionMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getTime()
      });

      setSelectedActiveIngredientFoodInteraction({ ...newApActiveIngredientFoodInteraction });
    }
  }, [removeActiveIngredientFoodInteractionMutation]);

  return (
    <Form fluid>
      <div className="container-of-actions-header-active">
        <div className="container-of-fields-active">
          <MyInput
            fieldType="select"
            selectData={[]}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            width={200}
            fieldName=""
            fieldLabel="Food"
            record={selectedActiveIngredientFoodInteraction}
            setRecord={setSelectedActiveIngredientFoodInteraction}
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
            record={selectedActiveIngredientFoodInteraction}
            setRecord={setSelectedActiveIngredientFoodInteraction}
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
            onClick={handleFoodsNew}
            title="New"
          ></MyButton>
        </div>
      </div>
      <MyInput
        width="100%"
        fieldName="description"
        fieldType="textarea"
        record={selectedActiveIngredientFoodInteraction}
        setRecord={setSelectedActiveIngredientFoodInteraction}
        required
      />
      <br />
      <Row gutter={15}>
        <Col xs={24}>
          <MyTable
            noBorder
            height={450}
            data={foodListResponseData?.object ?? []}
            loading={isFetching}
            columns={tableColumns}
            rowClassName={isSelected}
            onRowClick={rowData => {
              setSelectedActiveIngredientFoodInteraction(rowData);
            }}
            sortColumn={listRequest.sortBy}
            onSortChange={(sortBy, sortType) => {
              if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
            }}
          />
          <DeletionConfirmationModal
            open={openConfirmDeleteFoodInteractionModal}
            setOpen={setOpenConfirmDeleteFoodInteractionModal}
            itemToDelete="Food Interaction"
            actionButtonFunction={remove}
            actionType="Delete"
          />
        </Col>
      </Row>
    </Form>
  );
};

export default DrugFoodInteractions;
