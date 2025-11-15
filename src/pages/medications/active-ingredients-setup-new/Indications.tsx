import React, { useEffect, useState } from 'react';
import { Text, Form } from 'rsuite';
import { Plus } from '@rsuite/icons';
import { initialListRequest } from '@/types/types';
import {
  useGetActiveIngredientIndicationQuery,
  useRemoveActiveIngredientIndicationMutation,
  useSaveActiveIngredientIndicationMutation
} from '@/services/medicationsSetupService';
import { newApActiveIngredientIndication } from '@/types/model-types-constructor';
import { MdDelete } from 'react-icons/md';
import { MdSave } from 'react-icons/md';
import { ApActiveIngredientIndication } from '@/types/model-types';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import Icd10Search from '@/pages/medical-component/Icd10Search';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import './styles.less';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
const Indications = ({ selectedActiveIngredients }) => {
  const dispatch = useAppDispatch();
  const [activeIngredientIndication, setActiveIngredientIndication] =
    useState<ApActiveIngredientIndication>({ ...newApActiveIngredientIndication });
  const [openConfirmDeleteIndicationModal, setOpenConfirmDeleteIndicationModal] =
    useState<boolean>(false);
  const [listRequest, setListRequest] = useState({
    ...initialListRequest,
    pageSize: 100,
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'active_ingredient_key',
        operator: 'match',
        value: undefined
      },
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });
  // Fetch indication list response
  const {
    data: indicationListResponseData,
    refetch,
    isFetching
  } = useGetActiveIngredientIndicationQuery(listRequest);
  // Fetch value unit Lov response
  const { data: valueUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  // remove indication
  const [removeActiveIngredientIndication, removeActiveIngredientIndicationMutation] =
    useRemoveActiveIngredientIndicationMutation();
  // save indication
  const [saveActiveIngredientIndication, saveActiveIngredientIndicationMutation] =
    useSaveActiveIngredientIndicationMutation();

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && rowData.key === activeIngredientIndication.key) {
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
        onClick={() => setOpenConfirmDeleteIndicationModal(true)}
      />
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'indication',
      title: <Translate>Indication</Translate>,
      render: rowData => <Text>{rowData.indication}</Text>
    },
    {
      key: 'icdCode',
      title: <Translate>ICD Code</Translate>,
      render: rowData => <Text>{rowData.icdObject}</Text>
    },
    {
      key: 'offLabel',
      title: <Translate>Off-Label</Translate>,
      render: rowData => <Text>{rowData.isOffLabel ? 'Yes' : 'No'}</Text>
    },
    {
      key: 'dosage',
      title: <Translate>Dosage</Translate>,
      render: rowData => <Text>{rowData.dosage}</Text>
    },
    {
      key: 'unit',
      title: <Translate>Unit</Translate>,
      render: rowData => (
        <Text>
          {rowData.variableLvalue ? rowData.variableLvalue.lovDisplayVale : rowData.variableLkey}
        </Text>
      )
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      render: () => iconsForActions()
    }
  ];

  // handle save
  const save = () => {
    saveActiveIngredientIndication({
      ...activeIngredientIndication,
      activeIngredientKey: selectedActiveIngredients.key,
      createdBy: 'Administrator'
    })
      .unwrap()
      .then(() => {
        dispatch(notify('Added successfully'));
        refetch();
      });
  };

  // handle new
  const handleIndicationsNew = () => {
    setActiveIngredientIndication({ ...newApActiveIngredientIndication });
  };

  // handle remove
  const remove = () => {
    setOpenConfirmDeleteIndicationModal(false);
    if (activeIngredientIndication.key) {
      removeActiveIngredientIndication({
        ...activeIngredientIndication
      })
        .unwrap()
        .then(() => {
          dispatch(notify('Deleted successfully'));
          refetch();
        });
    }
  };

  // Effects
  useEffect(() => {
    if (selectedActiveIngredients) {
      setActiveIngredientIndication(prevState => ({
        ...prevState,
        activeIngredientKey: selectedActiveIngredients.key
      }));
    }
  }, [selectedActiveIngredients]);

  useEffect(() => {
    const updatedFilters = [
      {
        fieldName: 'active_ingredient_key',
        operator: 'match',
        value: selectedActiveIngredients.key || undefined
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
  }, [selectedActiveIngredients.key]);

  useEffect(() => {
    if (saveActiveIngredientIndicationMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getTime()
      });

      setActiveIngredientIndication({ ...newApActiveIngredientIndication });
    }
  }, [saveActiveIngredientIndicationMutation]);

  useEffect(() => {
    if (removeActiveIngredientIndicationMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getTime()
      });

      setActiveIngredientIndication({ ...newApActiveIngredientIndication });
    }
  }, [removeActiveIngredientIndicationMutation]);

  return (
    <Form fluid>
      <div className="container-of-actions-header-active">
        <div className="container-of-fields-active">
          <Icd10Search
            object={activeIngredientIndication}
            setOpject={setActiveIngredientIndication}
            fieldName="icdCodeKey"
          />
          <MyInput
            fieldName="dosage"
            record={activeIngredientIndication}
            fieldType="number"
            height={37}
            width={70}
            setRecord={setActiveIngredientIndication}
          />
          <MyInput
            fieldType="select"
            selectData={valueUnitLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            height={37}
            width={70}
            fieldName="variableLkey"
            fieldLabel="Unit"
            record={activeIngredientIndication}
            setRecord={setActiveIngredientIndication}
          />
          <MyInput
            width={200}
            column
            fieldLabel="Off-Label"
            fieldType="check"
            showLabel={false}
            fieldName="isOffLabel"
            record={activeIngredientIndication}
            setRecord={setActiveIngredientIndication}
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
            onClick={handleIndicationsNew}
            title="New"
          ></MyButton>
        </div>
      </div>
      <MyTable
        noBorder
        height={450}
        data={indicationListResponseData?.object ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setActiveIngredientIndication(rowData);
        }}
        sortColumn={listRequest.sortBy}
        onSortChange={(sortBy, sortType) => {
          if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
        }}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteIndicationModal}
        setOpen={setOpenConfirmDeleteIndicationModal}
        itemToDelete="Indication"
        actionButtonFunction={remove}
        actionType="Delete"
      />
    </Form>
  );
};

export default Indications;
