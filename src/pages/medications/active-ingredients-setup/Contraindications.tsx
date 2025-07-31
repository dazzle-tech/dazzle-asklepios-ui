import React, { useEffect, useState } from 'react';
import { Text, Panel } from 'rsuite';
import { Plus } from '@rsuite/icons';
import { MdSave } from 'react-icons/md';
import { initialListRequest } from '@/types/types';
import { newApActiveIngredientContraindication } from '@/types/model-types-constructor';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { MdDelete } from 'react-icons/md';
import {
  useGetActiveIngredientContraindicationQuery,
  useRemoveActiveIngredientContraindicationMutation,
  useSaveActiveIngredientContraindicationMutation
} from '@/services/medicationsSetupService';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import Icd10Search from '@/pages/medical-component/Icd10Search';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import './styles.less';
const Contraindications = ({ activeIngredients }) => {
  const dispatch = useAppDispatch();
  const [selectedActiveIngredientContraindication, setSelectedActiveIngredientContraindication] =
    useState({
      ...newApActiveIngredientContraindication
    });
  const [openConfirmDeleteContraindicationModal, setOpenConfirmDeleteContraindicationModal] =
    useState<boolean>(false);
  const [listRequest, setListRequest] = useState({
    ...initialListRequest,
    pageSize: 100,
    timestamp: new Date().getMilliseconds(),
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
  // Fetch contraindications list response
  const { data: ContraindicationsListResponseData, isFetching } =
    useGetActiveIngredientContraindicationQuery(listRequest);
  // save contraindication
  const [saveActiveIngredientContraindication, saveActiveIngredientContraindicationMutation] =
    useSaveActiveIngredientContraindicationMutation();
  // remove contraindication
  const [removeActiveIngredientContraindication, removeActiveIngredientContraindicationMutation] =
    useRemoveActiveIngredientContraindicationMutation();

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && rowData.key === selectedActiveIngredientContraindication.key) {
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
        onClick={() => setOpenConfirmDeleteContraindicationModal(true)}
      />
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'contraindications',
      title: <Translate>Contraindications</Translate>,
      render: rowData => <Text>{rowData.contraindication}</Text>
    },
    {
      key: 'icdCode',
      title: <Translate>ICD Code</Translate>,
      render: rowData => <Text>{rowData.icdObject}</Text>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      render: () => iconsForActions()
    }
  ];

  // handle remove
  const remove = () => {
    setOpenConfirmDeleteContraindicationModal(false);
    if (selectedActiveIngredientContraindication.key) {
      removeActiveIngredientContraindication({
        ...selectedActiveIngredientContraindication,
        deletedBy: 'Administrator'
      })
        .unwrap()
        .then(() => {
          dispatch(notify('Deleted successfully'));
        });
    }
  };

  // handle new
  const handleContraindicationsNew = () => {
    setSelectedActiveIngredientContraindication({
      ...newApActiveIngredientContraindication
    });
  };

  // handle save
  const save = () => {
    saveActiveIngredientContraindication({
      ...selectedActiveIngredientContraindication,
      activeIngredientKey: activeIngredients.key,
      createdBy: 'Administrator'
    })
      .unwrap()
      .then(() => {
        dispatch(notify('Saved successfully'));
      });
    console.log(selectedActiveIngredientContraindication.icdCodeKey);
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
  }, [activeIngredients.key]);

  useEffect(() => {
    if (saveActiveIngredientContraindicationMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getTime()
      });

      setSelectedActiveIngredientContraindication({ ...newApActiveIngredientContraindication });
    }
  }, [saveActiveIngredientContraindicationMutation]);

  useEffect(() => {
    if (removeActiveIngredientContraindicationMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getTime()
      });
      setSelectedActiveIngredientContraindication({ ...newApActiveIngredientContraindication });
    }
  }, [removeActiveIngredientContraindicationMutation]);

  return (
    <Panel>
      <div className="container-of-actions-header-active">
        <div className="container-of-fields-active">
          <Icd10Search
            object={selectedActiveIngredientContraindication}
            setOpject={setSelectedActiveIngredientContraindication}
            fieldName="icdCodeKey"
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
            onClick={handleContraindicationsNew}
            title="New"
          ></MyButton>
        </div>
      </div>
      <MyTable
        noBorder
        height={450}
        data={ContraindicationsListResponseData?.object ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setSelectedActiveIngredientContraindication(rowData);
        }}
        sortColumn={listRequest.sortBy}
        onSortChange={(sortBy, sortType) => {
          if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
        }}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteContraindicationModal}
        setOpen={setOpenConfirmDeleteContraindicationModal}
        itemToDelete="Contraindication"
        actionButtonFunction={remove}
        actionType="Delete"
      />
    </Panel>
  );
};

export default Contraindications;
