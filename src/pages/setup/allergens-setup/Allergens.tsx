import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import { useGetAllergensQuery, useSaveAllergensMutation } from '@/services/setupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { ApAllergens } from '@/types/model-types';
import { newApAllergens } from '@/types/model-types-constructor';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import { MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import MyTable from '@/components/MyTable';
import AddEditAllergens from './AddEditAllergens';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import './styles.less';
import { notify } from '@/utils/uiReducerActions';
const Allergens = () => {
  const dispatch = useAppDispatch();
  const [allergens, setAllergens] = useState<ApAllergens>({ ...newApAllergens });
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [popupOpen, setPopupOpen] = useState(false);
  const [openConfirmDeleteAllergens, setOpenConfirmDeleteAllergens] = useState<boolean>(false);
  const [stateOfDeleteAllergens, setStateOfDeleteAllergens] = useState<string>('delete');
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  // Fetch allergens list response
  const { data: allergensListResponse, isFetching } = useGetAllergensQuery(listRequest);
  // Save Allergens
  const [saveAllergens, saveAllergensMutation] = useSaveAllergensMutation();
  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = allergensListResponse?.extraNumeric ?? 0;
  // Available fields for filtering
  const filterFields = [
    { label: 'Allergens Code', value: 'allergenCode' },
    { label: 'Allergens Name', value: 'allergenName' },
    { label: 'Allergens Type', value: 'allergenTypeLkey' },
    { label: 'Description', value: 'description' }
  ];
  // Header page setUp
  const divContent = (
    "Allergens"
  );
  dispatch(setPageCode('Allergens'));
  dispatch(setDivContent(divContent));

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && allergens && rowData.key === allergens.key) {
      return 'selected-row';
    } else return '';
  };

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

  // Icons column ( Edit, reactive/Deactivate)
  const iconsForActions = (rowData: ApAllergens) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setPopupOpen(true)}
      />
      {rowData?.isValid ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteAllergens('deactivate');
            setOpenConfirmDeleteAllergens(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={20}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteAllergens('reactivate');
            setOpenConfirmDeleteAllergens(true);
          }}
        />
      )}
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'allergenCode',
      title: <Translate>Allergens Code</Translate>,
      flexGrow: 4
    },
    {
      key: 'allergenName',
      title: <Translate>Allergens Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'allergenTypeLkey',
      title: <Translate>Allergens Type</Translate>,
      flexGrow: 4,
      render: rowData =>
        rowData.allergenTypeLvalue
          ? rowData.allergenTypeLvalue.lovDisplayVale
          : rowData.allergenTypeLkey
    },
    {
      key: 'description',
      title: <Translate>Description</Translate>,
      flexGrow: 4
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];
  // handle filter change
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

  // handle click on add new button
  const handleNew = () => {
    setAllergens({ ...newApAllergens });
    setPopupOpen(true);
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

  // handle save allergens
  const handleSave = () => {
    setPopupOpen(false);
    saveAllergens(allergens)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'The Allergens has been saved successfully', sev: 'success' }));
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to save this Allergens', sev: 'error' }));
      });
  };
  // handle deactivate allergens
  const handleDeactivate = () => {
    setOpenConfirmDeleteAllergens(false);
    saveAllergens({ ...allergens, isValid: false })
      .unwrap()
      .then(() => {
        dispatch(
          notify({
            msg: 'The Allergens was successfully Deactivated',
            sev: 'success'
          })
        );
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Faild to Deactivate this Allergens',
            sev: 'error'
          })
        );
      });
  };
  // handle reactivate allergens
  const handleReactivate = () => {
    setOpenConfirmDeleteAllergens(false);
    saveAllergens({ ...allergens, isValid: true })
      .unwrap()
      .then(() => {
        dispatch(
          notify({
            msg: 'The Allergens was successfully Reactivated',
            sev: 'success'
          })
        );
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Faild to Reactivate this Allergens',
            sev: 'error'
          })
        );
      });
  };

  // Effects
  // change the width variable when the size of window is changed
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // update list when allergens is saved
  useEffect(() => {
    if (saveAllergensMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveAllergensMutation.data]);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  // update the list when the filter is changed
  useEffect(() => {
    if (recordOfFilter['filter']) {
      handleFilterChange(recordOfFilter['filter'], recordOfFilter['value']);
    } else {
      setListRequest({
        ...initialListRequest,
        pageSize: listRequest.pageSize,
        pageNumber: 1
      });
    }
  }, [recordOfFilter]);

  return (
    <Panel>
      <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={handleNew}
          width="109px"
        >
          Add New
        </MyButton>
      </div>
      <MyTable
        height={450}
        data={allergensListResponse?.object ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={rowData => {
          setAllergens(rowData);
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
      />
      <AddEditAllergens
        open={popupOpen}
        setOpen={setPopupOpen}
        width={width}
        allergens={allergens}
        setAllergens={setAllergens}
        handleSave={handleSave}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteAllergens}
        setOpen={setOpenConfirmDeleteAllergens}
        itemToDelete="Allergens"
        actionButtonFunction={
          stateOfDeleteAllergens == 'deactivate' ? handleDeactivate : handleReactivate
        }
        actionType={stateOfDeleteAllergens}
      />
    </Panel>
  );
};

export default Allergens;
