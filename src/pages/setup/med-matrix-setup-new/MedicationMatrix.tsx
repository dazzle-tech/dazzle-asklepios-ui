import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import { Col, Form, Row } from 'rsuite';
import React, { useEffect, useState } from 'react';
import { useGetActiveIngredientQuery } from '@/services/medicationsSetupService';
import { initialListRequest, ListRequest } from '@/types/types';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import AddEditMedCat from './AddEditMedCat';
import AddEditClass from './AddEditClass';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import {
  newMedicationCategory,
  newMedicationCategoryClass
} from '@/types/model-types-constructor-new';
import {
  useDeleteMedicationCategoryClassMutation,
  useGetAllMedicationCategoryClassesByCategoryQuery
} from '@/services/setup/medication-categories/MedicationCategoriesClassService';
import {
  useDeleteMedicationCategoryMutation,
  useGetAllMedicationCategoriesQuery
} from '@/services/setup/medication-categories/MedicationCategoriesService';

const MedicationMatrix = () => {
  const dispatch = useAppDispatch();
  const [searchTermForCategory, setSearchTermForCategory] = useState({ value: '' });
   const [searchTermForCategoryClass, setSearchTermForCategoryClass] = useState({ value: '' });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 100,
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
  const [openAddEditPopupCat, setOpenAddEditPopupCat] = useState(false);
  const [openAddEditPopupClass, setOpenAddEditPopupClass] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState({ ...newMedicationCategory });
  const [selectedClass, setSelectedClass] = useState({ ...newMedicationCategoryClass });

  const [edit_new_cat, setEdit_new_cat] = useState(false);
  const [edit_new_class, setEdit_new_class] = useState(false);
  const { data: activeIngredientListResponseData } = useGetActiveIngredientQuery(
    activeIngredientsListRequest
  );
  const {
  data: medClassList,
  refetch: refetchClass,
} = useGetAllMedicationCategoryClassesByCategoryQuery(
  selectedCategories?.id
    ? { id: selectedCategories.id, name: searchTermForCategoryClass?.value }
    : undefined,
  {
    skip: !selectedCategories?.id,
  }
);
  const { data: categoriesList, refetch: refetchCat } = useGetAllMedicationCategoriesQuery(searchTermForCategory?.value || undefined);

  const [removeCat] = useDeleteMedicationCategoryMutation({});
  const [removeClass] = useDeleteMedicationCategoryClassMutation({});
  const [openConfirmDeleteModalCat, setOpenConfirmDeleteModalCat] = useState<boolean>(false);
  const [openConfirmDeleteModalClass, setOpenConfirmDeleteModalClass] = useState<boolean>(false);
  const [stateOfDeleteModal] = useState<string>('delete');

  // Page header setup
  const divContent = 'Medication Matrix SetUp';
  dispatch(setPageCode('Medication Matrix SetUp'));
  dispatch(setDivContent(divContent));

  const handleEdit = type => {
    switch (type) {
      case 'cat':
        setEdit_new_cat(true);
        setOpenAddEditPopupClass(false);
        setOpenAddEditPopupCat(true);
        break;
      case 'class':
        setEdit_new_class(true);
        setOpenAddEditPopupClass(true);
        setOpenAddEditPopupCat(false);
        break;
      case 'ai':
        setOpenAddEditPopupClass(false);
        setOpenAddEditPopupCat(false);
        break;
    }
  };
  const iconsForActions = (rowData: any, type: any) => (
    <div className="container-of-icons">
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => handleEdit(type)}
      />
      <MdDelete
        className="icons-style"
        title="Delete"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => {
          switch (type) {
            case 'cat':
              setOpenConfirmDeleteModalCat(true);
              setOpenConfirmDeleteModalClass(false);
              break;
            case 'class':
              setOpenConfirmDeleteModalCat(false);
              setOpenConfirmDeleteModalClass(true);
              break;
          }
        }}
      />
    </div>
  );
  const isSelected = rowData => {
    if (rowData && selectedCategories && rowData.id === selectedCategories.id) {
      return 'selected-row';
    } else return '';
  };
  const isSelectedClass = rowData => {
    if (rowData && selectedClass && rowData.id === selectedClass.id) {
      return 'selected-row';
    } else return '';
  };

  const categoryColumns: ColumnConfig[] = [
    {
      key: 'name',
      align: 'center',
      title: 'Therapeutic Category Name'
    },
    {
      key: 'icons',
      title: '',
      render: rowData => iconsForActions(rowData, 'cat')
    }
  ];

  const classColumns: ColumnConfig[] = [
    {
      key: 'name',
      align: 'center',
      title: 'Medication Class'
    },
    {
      key: 'icons',
      title: '',
      render: rowData => iconsForActions(rowData, 'class')
    }
  ];

  const activeIngColumns: ColumnConfig[] = [
    {
      key: 'class',
      align: 'center',
      title: 'Active Ingredient',
      render: () => {
        return rowData => (
          <span>
            {conjureValueBasedOnKeyFromList(
              activeIngredientListResponseData?.object ?? [],
              rowData.active_ingredient_key,
              'name'
            )}
          </span>
        );
      }
    }
  ];

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  return (
    <Row>
      <Col md={8}>
        <MyTable
          columns={categoryColumns}
          data={categoriesList ?? []}
          onRowClick={rowData => {
            setSelectedCategories(rowData);
          }}
          rowClassName={isSelected}
          sortColumn={listRequest.sortBy}
          sortType={listRequest.sortType}
          onSortChange={(sortBy, sortType) => {
            if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
          }}
          filters={
            <div className="container-of-header-actions-medication-matrix">
              <Form layout="inline" className="form-medication-matrix">
                <MyInput
                  fieldName="value"
                  fieldType="text"
                  record={searchTermForCategory}
                  setRecord={setSearchTermForCategory}
                  showLabel={false}
                  placeholder="Search by Name"
                  width={'220px'}
                  height={32}
                />
              </Form>
            </div>
          }
          tableButtons={
            <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={() => {
                setOpenAddEditPopupCat(true),
                  setSelectedCategories({ ...newMedicationCategory }),
                  setEdit_new_cat(true);
              }}
              width="109px"
            >
              Add New
            </MyButton>
            </div>
          }
        />
        <AddEditMedCat
          open={openAddEditPopupCat}
          setOpen={setOpenAddEditPopupCat}
          medCategory={selectedCategories}
          setMedCategory={setSelectedCategories}
          edit_new={edit_new_cat}
          refetch={refetchCat}
        />
        <DeletionConfirmationModal
          open={openConfirmDeleteModalCat}
          setOpen={setOpenConfirmDeleteModalCat}
          itemToDelete="Category"
          actionButtonFunction={() => {
            removeCat(selectedCategories?.id)
              .unwrap()
              .then(() => {
                refetchClass();
                refetchCat();
                dispatch(notify('Category Deleted Successfully'));
                setSelectedCategories(newMedicationCategory);
                setOpenConfirmDeleteModalCat(false);
              });
          }}
          actionType={stateOfDeleteModal}
        />
      </Col>
      <Col md={8}>
        <MyTable
          columns={classColumns}
          data={medClassList ?? []}
          onRowClick={rowData => {
            setSelectedClass(rowData);
          }}
          rowClassName={isSelectedClass}
          tableButtons={
            <div className="container-of-add-new-button">
              <MyButton
                disabled={!selectedCategories?.id}
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setOpenAddEditPopupClass(true),
                    setSelectedClass({ ...newMedicationCategoryClass }),
                    setEdit_new_class(true);
                }}
                width="109px"
              >
                Add New
              </MyButton>
            </div>
          }
          filters={
            <div className="container-of-header-actions-medication-matrix">
              <Form layout="inline" className="form-medication-matrix">
                <MyInput
                  fieldName="value"
                  fieldType="text"
                  record={searchTermForCategoryClass}
                  setRecord={setSearchTermForCategoryClass}
                  showLabel={false}
                  placeholder="Search by Name"
                  width={'220px'}
                  height={32}
                />
              </Form>
            </div>
          }
        />
        <AddEditClass
          open={openAddEditPopupClass}
          setOpen={setOpenAddEditPopupClass}
          medClass={selectedClass}
          medicationcategory={selectedCategories}
          setMedClass={setSelectedClass}
          edit_new={edit_new_class}
          refetch={refetchClass}
        />
        <DeletionConfirmationModal
          open={openConfirmDeleteModalClass}
          setOpen={setOpenConfirmDeleteModalClass}
          itemToDelete="Class"
          actionButtonFunction={() => {
            removeClass(selectedClass?.id)
              .unwrap()
              .then(() => {
                refetchClass();
                refetchCat();
                dispatch(notify('Class Deleted Successfully'));
                setSelectedClass(newMedicationCategoryClass);
                setOpenConfirmDeleteModalClass(false);
              });
          }}
          actionType={stateOfDeleteModal}
        />
      </Col>
      <Col md={8}>
        <MyTable
          columns={activeIngColumns}
          data={[]}
          tableButtons={
            <div className="container-of-add-new-button">
              <MyButton
                disabled={!selectedClass?.id}
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => 
                    setSelectedCategories({ ...newMedicationCategory })
                }
                width="109px"
              >
                Add New
              </MyButton>
            </div>
          }
          filters={
            <div className="container-of-header-actions-medication-matrix">
              <Form layout="inline" className="form-medication-matrix">
                <MyInput
                  fieldName="value"
                  fieldType="text"
                  record={searchTermForCategory}
                  setRecord={setSearchTermForCategory}
                  showLabel={false}
                  placeholder="Search by Name"
                  width='220px'
                  height={32}
                />
              </Form>
            </div>
          }
        />
      </Col>
    </Row>
  );
};
export default MedicationMatrix;
