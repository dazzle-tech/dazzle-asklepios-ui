import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { Carousel, Form, Panel } from 'rsuite';
import {
  useSaveActiveIngredientMutation,
  useGetActiveIngredientQuery
} from '@/services/medicationsSetupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { ApActiveIngredient } from '@/types/model-types';
import { newApActiveIngredient } from '@/types/model-types-constructor';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import NewActiveIngredients from './NewActiveIngredients';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyInput from '@/components/MyInput';
const ActiveIngredientsSetup = () => {
  const dispatch = useAppDispatch();
  const [activeIngredient, setActiveIngredient] = useState<ApActiveIngredient>({
    ...newApActiveIngredient
  });
  const [openConfirmDeleteActiveIngredient, setOpenConfirmDeleteActiveIngredient] =
    useState<boolean>(false);
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);
  const [stateOfDeleteActiveIngredient, setStateOfDeleteActiveIngredient] =
    useState<string>('delete');
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  // Fetch active ingredients list Response
  const {
    data: activeIngredientListResponse,
    refetch: activeIngredientRefetch,
    isFetching
  } = useGetActiveIngredientQuery(listRequest);
  const [saveActiveIngredient, saveActiveIngredientMutation] = useSaveActiveIngredientMutation();

  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = activeIngredientListResponse?.extraNumeric ?? 0;

  // Header page setUp
  const divContent = (
      "Active Ingredients"
  );
  dispatch(setPageCode('Active_Ingredients'));
  dispatch(setDivContent(divContent));

  // Available fields for filtering
  const filterFields = [
    { label: 'Code', value: 'code' },
    { label: 'Active Ingredients Name', value: 'name' },
    { label: 'Medical Category', value: 'medicalCategoryLkey' },
    { label: 'Drug Class', value: 'drugClassLkey' },
    { label: 'Drug Type', value: 'drugTypeLkey' },
    { label: 'ATC Code', value: 'atcCode' }
  ];

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && activeIngredient && rowData.key === activeIngredient.key) {
      return 'selected-row';
    } else return '';
  };

  // Icons column (Edit,Does Schedule, reactive/Deactivate)
  const iconsForActions = (rowData: ApActiveIngredient) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setCarouselActiveIndex(1)}
      />
      {rowData?.isValid ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteActiveIngredient('deactivate');
            setOpenConfirmDeleteActiveIngredient(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteActiveIngredient('reactivate');
            setOpenConfirmDeleteActiveIngredient(true);
          }}
        />
      )}
    </div>
  );

  // Filter table
  const filters = () => (
    <Form layout="inline" fluid>
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={updatedRecord => {
          setRecordOfFilter({
            ...recordOfFilter,
            filter: updatedRecord.filter,
            value: ''
          });
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
      />
      <MyInput
        fieldName="value"
        fieldType="text"
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
        placeholder="Search"
      />
    </Form>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'code',
      title: <Translate>Code</Translate>
    },
    {
      key: 'name',
      title: <Translate>Active Ingredients Name</Translate>
    },
    {
      key: 'medicalCategoryLkey',
      title: <Translate>Medical Category</Translate>,
      render: rowData =>
        rowData.medicalCategoryLvalue
          ? rowData.medicalCategoryLvalue.lovDisplayVale
          : rowData.medicalCategoryLkey
    },
    {
      key: 'drugClassLkey',
      title: <Translate>Drug Class</Translate>,
      render: rowData =>
        rowData.drugClassLvalue ? rowData.drugClassLvalue.lovDisplayVale : rowData.drugClassLkey
    },
    {
      key: 'drugTypeLkey',
      title: <Translate>Drug Type</Translate>,
      render: rowData =>
        rowData.drugTypeLvalue ? rowData.drugTypeLvalue.lovDisplayVale : rowData.drugTypeLkey
    },
    {
      key: 'atcCode',
      title: <Translate>ATC Code</Translate>
    },
    {
      key: '',
      title: <Translate>Status</Translate>,
      render: rowData => (rowData.isValid ? 'Active' : 'InActive')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      render: rowData => iconsForActions(rowData)
    }
  ];

  // handle new
  const handleNew = () => {
    setActiveIngredient({ ...newApActiveIngredient });
    setCarouselActiveIndex(1);
  };

  // update list when filter is changed
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
      setListRequest({ ...listRequest, filters: [] });
    }
  };

  // Handle page change in navigation
  const handlePageChange = (_: unknown, newPage: number) => {
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };

  // Handle change rows per page in navigation
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
  };

  // handle deactivate
  const handleDeactivate = () => {
    setOpenConfirmDeleteActiveIngredient(false);
    saveActiveIngredient({ ...activeIngredient, isValid: false })
      .unwrap()
      .then(() => {
        activeIngredientRefetch();
        dispatch(
          notify({
            msg: 'The Active Ingredient was successfully Deactivated',
            sev: 'success'
          })
        );
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Faild to Deactivate this Active Ingredient',
            sev: 'error'
          })
        );
      });
  };

  // handle reactivate
  const handleReactivate = () => {
    setOpenConfirmDeleteActiveIngredient(false);
    saveActiveIngredient({ ...activeIngredient, isValid: true })
      .unwrap()
      .then(() => {
        activeIngredientRefetch();
        dispatch(
          notify({
            msg: 'The Active Ingredient was successfully Reactivated',
            sev: 'success'
          })
        );
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Faild to Reactivate this Active Ingredient',
            sev: 'error'
          })
        );
      });
  };

  // Effects
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  useEffect(() => {
    if (saveActiveIngredientMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveActiveIngredientMutation.data]);

  // update list when filter is changed
  useEffect(() => {
    if (recordOfFilter['filter']) {
      handleFilterChange(recordOfFilter['filter'], recordOfFilter['value']);
    } else {
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
  }, [recordOfFilter]);

  useEffect(() => {
    activeIngredientRefetch();
  }, [carouselActiveIndex]);

  return (
    <Carousel
      style={{ height: 'auto', backgroundColor: 'var(--rs-body)' }}
      autoplay={false}
      activeIndex={carouselActiveIndex}
    >
      <Panel>

        <MyTable
          height={450}
          data={activeIngredientListResponse?.object ?? []}
          loading={isFetching}
          columns={tableColumns}
          rowClassName={isSelected}
          filters={filters()}
          onRowClick={rowData => {
            setActiveIngredient(rowData);
          }}
          sortColumn={listRequest.sortBy}
          sortType={listRequest.sortType}
          onSortChange={(sortBy, sortType) => {
            if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
          }}
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          tableButtons={<div className="container-of-add-new-button">
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={handleNew}
            width="109px"
          >
            Add New
          </MyButton>
        </div>}
        />
        
        <DeletionConfirmationModal
          open={openConfirmDeleteActiveIngredient}
          setOpen={setOpenConfirmDeleteActiveIngredient}
          itemToDelete="Active Ingredient"
          actionButtonFunction={
            stateOfDeleteActiveIngredient == 'deactivate' ? handleDeactivate : handleReactivate
          }
          actionType={stateOfDeleteActiveIngredient}
        />
      </Panel>
      <NewActiveIngredients
        selectedactiveIngredient={activeIngredient}
        goBack={() => {
          setCarouselActiveIndex(0);
        }}
      />
    </Carousel>
  );
};

export default ActiveIngredientsSetup;
