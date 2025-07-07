import MyInput from "@/components/MyInput";
import MyTable from "@/components/MyTable";
import { Col, Form, Row } from "rsuite";
import React, { useEffect, useState } from 'react';
import { useGetActiveIngredientQuery, useGetMedicationCategoriesActiveIngredientQuery, useGetMedicationCategoriesClassQuery, useGetMedicationCategoriesQuery, useRemoveMedicationCategoriesClassMutation, useRemoveMedicationCategoriesMutation } from "@/services/medicationsSetupService";
import { initialListRequest, ListRequest } from "@/types/types";
import Translate from "@/components/Translate";
import { newApMedicationCategories, newApMedicationCategoriesActiveIngredient, newApMedicationCategoriesClass } from "@/types/model-types-constructor";
import { ColumnConfig } from '@/components/MyTable/MyTable';
import MyButton from "@/components/MyButton/MyButton";
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import AddEditMedCat from "./AddEditMedCat";
import AddEditClass from "./AddEditClass";
import AddEditActiveIng from "./AddEditActiveIng";
import { addFilterToListRequest, conjureValueBasedOnKeyFromList, fromCamelCaseToDBName } from "@/utils";
import { MdDelete, MdModeEdit } from "react-icons/md";
import { FaSyringe } from "react-icons/fa6";
import { FaUndo } from "react-icons/fa";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import { notify } from "@/utils/uiReducerActions";
import { useAppDispatch } from "@/hooks";
import { console } from "inspector";

const MedicationMatrix = () => {
    const dispatch = useAppDispatch();
    const [record, setRecord] = useState({ value: '' });
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
    const [activeIngredientsListRequest, setActiveIngredientsListRequest] = useState<ListRequest>({
        ...initialListRequest
    });
    const [openAddEditPopupCat, setOpenAddEditPopupCat] = useState(false);
    const [openAddEditPopupClass, setOpenAddEditPopupClass] = useState(false);
    const [openAddEditPopup, setOpenAddEditPopup] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState({ ...newApMedicationCategories });
    const [selectedClass, setSelectedClass] = useState({ ...newApMedicationCategoriesClass });
    const [selectedAI, setSelectedAI] = useState({ ...newApMedicationCategoriesActiveIngredient });
    const [listClassRequest, setListClassRequest] = useState({
        ...initialListRequest,
        pageSize: 100,
        filters: [
            {
                fieldName: 'therapeutic_category_key',
                operator: 'match',
                value: selectedCategories?.key || undefined
            },
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ]
    });
    const [listAIRequest, setListAIRequest] = useState({
        ...initialListRequest,
        pageSize: 100,
        filters: [
            {
                fieldName: 'medication_class_key',
                operator: 'match',
                value: selectedClass?.key || undefined
            },
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ]
    });
    const [classList, setClassList] = useState([]);
    const [edit_new_cat, setEdit_new_cat] = useState(false);
    const [edit_new_class, setEdit_new_class] = useState(false);
    const [edit_new_ai, setEdit_new_ai] = useState(false);
    const { data: activeIngredientListResponseData } = useGetActiveIngredientQuery(activeIngredientsListRequest);
    const { data: medClassList, refetch: refetchClass } = useGetMedicationCategoriesClassQuery(listClassRequest);
    const { data: categoriesList, refetch: refetchCat } = useGetMedicationCategoriesQuery(listRequest);
    const { data: classAIList, refetch: refetchClassAI } = useGetMedicationCategoriesActiveIngredientQuery(listAIRequest);
    const [removeCat] = useRemoveMedicationCategoriesMutation();
    const [removeClass] = useRemoveMedicationCategoriesClassMutation();
    const [openConfirmDeleteModalCat, setOpenConfirmDeleteModalCat] = useState<boolean>(false);
    const [openConfirmDeleteModalClass, setOpenConfirmDeleteModalClass] = useState<boolean>(false);
    const [stateOfDeleteModal, setStateOfDeleteModal] = useState<string>('delete');

    const handleEdit = (type) => {
        
        switch (type) {
            case "cat":
                setEdit_new_cat(true);
                setOpenAddEditPopupClass(false);
                setOpenAddEditPopupCat(true);
                setOpenAddEditPopup(false);
                break;
            case "class":
                setEdit_new_class(true);
                setOpenAddEditPopupClass(true);
                setOpenAddEditPopupCat(false);
                setOpenAddEditPopup(false);
                break;
            case "ai":
                setEdit_new_ai(true);
                setOpenAddEditPopupClass(false);
                setOpenAddEditPopupCat(false);
                setOpenAddEditPopup(true);
                break;
        }
    };
    const iconsForActions = (rowData: any, type: any) => (
        <div >
            <MdModeEdit
                title="Edit"
                size={24}
                fill="var(--primary-gray)"
                onClick={() => handleEdit(type)}
            />
            {rowData?.isValid ? (
                <MdDelete
                    title="Deactivate"
                    size={24}
                    fill="var(--primary-pink)"
                    onClick={() => {
                        switch (type) {
                            case "cat":
                                setOpenConfirmDeleteModalCat(true);
                                setOpenConfirmDeleteModalClass(false);
                                
                console.log(type)
                console.log("IAM HERE BUSHRA Cat")
                                break;
                            case "class":
                                setOpenConfirmDeleteModalCat(false);
                                setOpenConfirmDeleteModalClass(true);
                                break;
                                
                console.log(type)
                console.log("IAM HERE BUSHRA Class")
                        }
                    }}
                />
            ) : (
                <FaUndo
                    title="Activate"
                    size={24}
                    fill="var(--primary-gray)"
                    onClick={() => {
                        switch (type) {
                            case "cat":
                                setOpenConfirmDeleteModalCat(true);
                                setOpenConfirmDeleteModalClass(false);
                                
                console.log(type)
                console.log("IAM HERE BUSHRA 2 cat")
                                break;
                            case "class":
                                setOpenConfirmDeleteModalCat(false);
                                setOpenConfirmDeleteModalClass(true);
                                
                console.log(type)
                console.log("IAM HERE BUSHRA 2 class")
                                break;
                        }
                    }}
                />
            )}
        </div>
    );
    const isSelected = rowData => {
        if (rowData && selectedCategories && rowData.key === selectedCategories.key) {
            return 'selected-row';
        } else return '';
    };
    const isSelectedClass = rowData => {
        if (rowData && selectedClass && rowData.key === selectedClass.key) {
            return 'selected-row';
        } else return '';
    };

  
      const handleFilterChange = (fieldName, value) => {
        if (value) {
          setListRequest(
            addFilterToListRequest(
              fromCamelCaseToDBName(fieldName),
              'containsIgnoreCase',
              value,
              listRequest
            )
          );
        } else {
          setListRequest({
                  ...initialListRequest,
                  filters: [
                    {
                        fieldName: 'deleted_at',
                        operator: 'isNull',
                        value: undefined
                    }
                  ]
                });
        }
      };
    const categoryColumns: ColumnConfig[] = [
        {
            key: "category",
            align: 'center',
            title: <Translate>Therapeutic Category Name</Translate>,
            render: (rowData: any) => {
                return rowData.medCategoriesName
            },
        },
        {
            key: 'icons',
            title: <Translate></Translate>,
            render: rowData => iconsForActions(rowData, "cat")
        }
    ]

    const classColumns: ColumnConfig[] = [
        {
            key: "class",
            align: 'center',
            title: <Translate>Medication Class</Translate>,
            render: (rowData: any) => {
                return rowData.className
            },
        },
        {
            key: 'icons',
            title: <Translate></Translate>,
            render: rowData => iconsForActions(rowData, "class")
        }]

    const activeIngColumns: ColumnConfig[] = [
        {
            key: "class",
            align: 'center',
            title: <Translate>Active Ingredient</Translate>,
            render: (rowData: any) => {
                return rowData => (
                    <span>
                        {conjureValueBasedOnKeyFromList(
                            activeIngredientListResponseData?.object ?? [],
                            rowData.active_ingredient_key,
                            'name',
                        )}
                    </span>
                )

            },
        }]


    useEffect(() => {
        const updatedFilters = [
            {
                fieldName: 'therapeutic_category_key',
                operator: 'match',
                value: selectedCategories?.key || undefined
            },
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ];

        setListClassRequest(prevRequest => ({
            ...prevRequest,
            filters: updatedFilters
        }));
    }, [selectedCategories.key]);

    useEffect(() => {
        const updatedFilters = [
            {
                fieldName: 'medication_class_key',
                operator: 'match',
                value: selectedClass?.key || undefined
            },
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ];

        setListAIRequest(prevRequest => ({
            ...prevRequest,
            filters: updatedFilters
        }));
    }, [selectedClass.key]);

   useEffect(() => {
          if (record['filter']) {
              handleFilterChange('name', record['value']);
          } else {
              // reset the listRequest if filter is cleared
              setListRequest({
                  ...initialListRequest,
                  filters: [
                      {
                          fieldName: 'deleted_at',
                          operator: 'isNull',
                          value: undefined
                      }
                  ],
                  pageSize: listRequest.pageSize,
                  pageNumber: 1
              });
          }
      }, [record]);

    return (
        <>
            <Row>
                <Col md={8}>
                    <div >
                        <Form >
                            <MyInput
                                fieldName="value"
                                fieldType="text"
                                record={record}
                                setRecord={setRecord}
                                showLabel={false}
                                placeholder="Search by Name"
                                width={'220px'}
                                height={32}
                            />
                        </Form>
                        <MyButton
                            prefixIcon={() => <AddOutlineIcon />}
                            color="var(--deep-blue)"
                            onClick={() => {
                                setOpenAddEditPopupCat(true), setSelectedCategories({ ...newApMedicationCategories }), setEdit_new_cat(true);
                            }}
                            width="109px"
                        >
                            Add New
                        </MyButton>
                       
                    </div>
                    <MyTable
                        columns={categoryColumns}
                        data={categoriesList?.object ?? []}
                        onRowClick={rowData => {
                            setSelectedCategories(rowData)
                        }}
                        rowClassName={isSelected}
                        sortColumn={listRequest.sortBy}
                        sortType={listRequest.sortType}
                        onSortChange={(sortBy, sortType) => {
                          if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
                        }}
                    />
                    <AddEditMedCat
                        open={openAddEditPopupCat}
                        setOpen={setOpenAddEditPopupCat}
                        medCategory={selectedCategories}
                        setMedCategory={setSelectedCategories}
                        edit_new={edit_new_cat}
                        setEdit_new={setEdit_new_cat}
                        refetch={refetchCat}
                    />
                    <DeletionConfirmationModal
                        open={openConfirmDeleteModalCat}
                        setOpen={setOpenConfirmDeleteModalCat}
                        itemToDelete="Category"
                        actionButtonFunction={() => {
                            removeCat(selectedCategories)
                                .unwrap()
                                .then(() => {
                                    refetchClass();
                                    refetchCat();
                                    refetchClassAI();
                                    dispatch(notify('Category Deleted Successfully'));
                                    setSelectedCategories(newApMedicationCategories);
                                    setOpenConfirmDeleteModalCat(false);
                                }
                                )

                        }}
                        actionType={stateOfDeleteModal}
                    />
                </Col>
                <Col md={8}>
                    <div>
                    <MyButton
                            disabled={!selectedCategories?.key} 
                            prefixIcon={() => <AddOutlineIcon />}
                            color="var(--deep-blue)"
                            onClick={() => {
                                setOpenAddEditPopupClass(true), setSelectedClass({ ...newApMedicationCategoriesClass }), setEdit_new_class(true);
                            }}
                            width="109px"
                        >
                            Add New
                        </MyButton>

                    </div>
                    <MyTable
                        columns={classColumns}
                        data={medClassList?.object ?? []}
                        onRowClick={rowData => {
                            setSelectedClass(rowData)
                        }}
                        rowClassName={isSelectedClass}
                    />
                    <AddEditClass
                        open={openAddEditPopupClass}
                        setOpen={setOpenAddEditPopupClass}
                        medClass={selectedClass}
                        setMedClass={setSelectedClass}
                        edit_new={edit_new_class}
                        setEdit_new={setEdit_new_class}
                        refetch={refetchClass}
                        medCat={selectedCategories}
                    />
                    <DeletionConfirmationModal
                        open={openConfirmDeleteModalClass}
                        setOpen={setOpenConfirmDeleteModalClass}
                        itemToDelete="Class"
                        actionButtonFunction={() => {
                            removeCat(selectedClass)
                                .unwrap()
                                .then(() => {
                                    refetchClass();
                                    refetchCat();
                                    refetchClassAI();
                                    dispatch(notify('Class Deleted Successfully'));
                                    setSelectedClass(newApMedicationCategoriesClass);
                                    setOpenConfirmDeleteModalClass(false);
                                }
                                )

                        }}
                        actionType={stateOfDeleteModal}
                    />
                </Col>
                <Col md={8}>
                    <div className="container-of-add-new-button">
                        <MyButton
                          disabled={!selectedClass?.key} 
                            prefixIcon={() => <AddOutlineIcon />}
                            color="var(--deep-blue)"
                            onClick={() => {
                                setOpenAddEditPopup(true), setSelectedCategories({ ...newApMedicationCategories }), setEdit_new_ai(true);
                            }}
                            width="109px"
                        >
                            Add New
                        </MyButton>
                    </div>
                    <MyTable
                        columns={activeIngColumns}
                        data={classAIList?.object ?? []} />
                    <AddEditActiveIng
                        open={openAddEditPopup}
                        setOpen={setOpenAddEditPopup}
                        medCatAI={selectedClass}
                        setMedCatAI={setSelectedClass}
                        edit_new={edit_new_ai}
                        setEdit_new={setEdit_new_ai}
                        refetch={refetchClassAI}
                        medCat={selectedCategories}
                        medClass={selectedClass}
                    />
                </Col>
            </Row>
        </>)

}
export default MedicationMatrix;