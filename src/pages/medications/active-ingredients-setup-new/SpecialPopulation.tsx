import React, { useEffect, useState } from 'react';
import { Text, Form } from 'rsuite';
import { MdDelete } from 'react-icons/md';
import { Plus } from '@rsuite/icons';
import { MdSave } from 'react-icons/md';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { newApActiveIngredientSpecialPopulation } from '@/types/model-types-constructor';
import { ApActiveIngredientSpecialPopulation } from '@/types/model-types';
import { initialListRequest, ListRequest } from '@/types/types';
import {
  useGetActiveIngredientSpecialPopulationQuery,
  useRemoveActiveIngredientSpecialPopulationMutation,
  useSaveActiveIngredientSpecialPopulationMutation
} from '@/services/medicationsSetupService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import './styles.less';
const SpecialPopulation = ({ activeIngredients }) => {
  const dispatch = useAppDispatch();
  const [openConfirmDeleteSpecialPopulationnModal, setOpenConfirmDeleteSpecialPopulationModal] =
    useState<boolean>(false);
  const [selectedActiveIngredientSpecialPopulation, setSelectedActiveIngredientSpecialPopulation] =
    useState<ApActiveIngredientSpecialPopulation>({
      ...newApActiveIngredientSpecialPopulation
    });
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  // Fetch special population Lov response
  const { data: specialPopulationLovQueryResponseData } = useGetLovValuesByCodeQuery(
    'SPECIAL_POPULATION_GROUPS'
  );
  // Fetch special population list response
  const {
    data: specialPopulationListResponseData,
    refetch,
    isFetching
  } = useGetActiveIngredientSpecialPopulationQuery(listRequest);
  // remove active ingredient special population
  const [removeActiveIngredientSpecialPopulation, removeActiveIngredientSpecialPopulationMutation] =
    useRemoveActiveIngredientSpecialPopulationMutation();
  // save active ingredient special population
  const [saveActiveIngredientSpecialPopulation, saveActiveIngredientSpecialPopulationMutation] =
    useSaveActiveIngredientSpecialPopulationMutation();

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && rowData.key === selectedActiveIngredientSpecialPopulation.key) {
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
        onClick={() => setOpenConfirmDeleteSpecialPopulationModal(true)}
      />
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'specialPopulation',
      title: <Translate>Special Population</Translate>,
      render: rowData => (
        <Text>
          {rowData.additionalPopulationLvalue
            ? rowData.additionalPopulationLvalue.lovDisplayVale
            : rowData.additionalPopulationLkey}
        </Text>
      )
    },
    {
      key: 'considerations',
      title: <Translate>Considerations</Translate>,
      render: rowData => <Text>{rowData.considerations}</Text>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      render: () => iconsForActions()
    }
  ];

  // handle new
  const handleNew = () => {
    setSelectedActiveIngredientSpecialPopulation({
      ...newApActiveIngredientSpecialPopulation,
      additionalPopulationLkey: null
    });
  };

  // handle remove
  const remove = () => {
    setOpenConfirmDeleteSpecialPopulationModal(false);
    if (selectedActiveIngredientSpecialPopulation.key) {
      removeActiveIngredientSpecialPopulation({
        ...selectedActiveIngredientSpecialPopulation
      })
        .unwrap()
        .then(() => {
          dispatch(notify({ msg: 'Deleted successfully', sev: 'success' }));
          setSelectedActiveIngredientSpecialPopulation({
            ...newApActiveIngredientSpecialPopulation,
            additionalPopulationLkey: null
          });
          refetch();
        });
    }
  };

  // handle save
  const save = () => {
    saveActiveIngredientSpecialPopulation({
      ...selectedActiveIngredientSpecialPopulation,
      activeIngredientKey: activeIngredients.key,
      createdBy: 'Administrator'
    })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
        setSelectedActiveIngredientSpecialPopulation({
          ...newApActiveIngredientSpecialPopulation,
          additionalPopulationLkey: null
        });
        refetch();
      });
  };
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

  // Effects
  useEffect(() => {
    if (saveActiveIngredientSpecialPopulationMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getTime()
      });
    }
  }, [saveActiveIngredientSpecialPopulationMutation]);

  useEffect(() => {
    if (removeActiveIngredientSpecialPopulationMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getTime()
      });
    }
  }, [removeActiveIngredientSpecialPopulationMutation]);

  return (
    <Form fluid>
      <div className="container-of-actions-header-active">
        <div className="container-of-fields-active">
          <MyInput
            fieldType="select"
            selectData={specialPopulationLovQueryResponseData?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            width={200}
            fieldName="additionalPopulationLkey"
            fieldLabel="Additional Population"
            record={selectedActiveIngredientSpecialPopulation}
            setRecord={setSelectedActiveIngredientSpecialPopulation}
            menuMaxHeight={200}
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
            onClick={handleNew}
            title="New"
          ></MyButton>
        </div>
      </div>
      <MyInput
        width="100%"
        fieldName="considerations"
        fieldType="textarea"
        record={selectedActiveIngredientSpecialPopulation}
        setRecord={setSelectedActiveIngredientSpecialPopulation}
        required
      />
      <MyTable
        height={450}
        data={specialPopulationListResponseData?.object ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setSelectedActiveIngredientSpecialPopulation(rowData);
        }}
        sortColumn={listRequest.sortBy}
        onSortChange={(sortBy, sortType) => {
          if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
        }}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteSpecialPopulationnModal}
        setOpen={setOpenConfirmDeleteSpecialPopulationModal}
        itemToDelete="Special Population"
        actionButtonFunction={remove}
        actionType="Delete"
      />
    </Form>
  );
};

export default SpecialPopulation;
