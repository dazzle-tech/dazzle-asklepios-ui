import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Form, Panel} from 'rsuite';
import { MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import {
  useRemoveGenericMedicationMutation,
  useGetGenericMedicationQuery,
  useSaveGenericMedicationMutation
} from '@/services/medicationsSetupService';
import {Carousel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { ApGenericMedication } from '@/types/model-types';
import { newApGenericMedication } from '@/types/model-types-constructor';
import {
  addFilterToListRequest,
  conjureValueBasedOnKeyFromList,
  fromCamelCaseToDBName
} from '@/utils';
import NewEditGenericMedication from './NewEditGenericMedication';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import AddEditBrandMedication from './AddEditBrandMEdication';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
const GenericMedications = () => {
  const dispatch = useAppDispatch();
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);
  const [genericMedication, setGenericMedication] = useState<ApGenericMedication>({
    ...newApGenericMedication
  });
  const [openConfirmDeleteGenericMedicationModal, setOpenConfirmDeleteGenericMedicationModal] = useState<boolean>(false);
    const [stateOfDeleteGenericMedicationModal, setStateOfDeleteGenericMedicationModal] = useState<string>('delete');
  const [openAddEditPopup, setOpenAddEditPopup] = useState<boolean>(false);
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  // Fetch generic Medication list response
  const {data: genericMedicationListResponse, refetch: genericMedicationRefetch, isFetching} = useGetGenericMedicationQuery(listRequest);
  // Remove Generic Medication
  const [removeGenericMedication, removeGenericMedicationMutation] = useRemoveGenericMedicationMutation();
  // Save Generic Medication
  const [saveGenericMedication, saveGenericMedicationMutation] = useSaveGenericMedicationMutation();
   // Fetch medRoutLov  list response
  const { data: medRoutLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
   // Header page setUp
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Brand Medications List</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Brand_Medications'));
  dispatch(setDivContent(divContentHTML));
  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = genericMedicationListResponse?.extraNumeric ?? 0;
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  // Available fields for filtering
  const filterFields = [
    { label: 'Code', value: 'code' },
    { label: 'Brand Name', value: 'genericName' },
    { label: 'Manufacturer', value: 'manufacturerLkey' },
    { label: 'Dosage Form', value: 'dosageFormLkey' },
    { label: 'Usage Instructions', value: 'usageInstructions' },
    { label: 'ROA', value: 'roaList' },
    { label: 'Expires After Opening', value: 'expiresAfterOpening' },
    { label: 'Single Patient Use', value: 'singlePatientUse' },
    { label: 'Status', value: 'deleted_at' }
  ];
  // Effects
  // to handle filter change
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
  // update list after remove 
  useEffect(() => {
    if (removeGenericMedicationMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getTime()
      });

      setGenericMedication({ ...newApGenericMedication });
    }
  }, [removeGenericMedicationMutation]);
  // baaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaack
  useEffect(() => {
    genericMedicationRefetch();
  }, [carouselActiveIndex]);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);
  // update list after new/edit Generic Medication
  useEffect(() => {
      if (saveGenericMedicationMutation.data) {
        setListRequest({ ...listRequest, timestamp: new Date().getTime() });
      }
    }, [saveGenericMedicationMutation.data]);


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

  const handleNew = () => {
    console.log("newnewnew22");
    setGenericMedication({ ...newApGenericMedication });
    setOpenAddEditPopup(true);
  };

 

  const deactivateReactivateMedication = () => {
    setOpenConfirmDeleteGenericMedicationModal(false);
    if (genericMedication.key) {
      removeGenericMedication({
        ...genericMedication
      }).unwrap();
      dispatch(notify('Brand Medication  DeactivateActivate Successfully'));
    }
  };

  const handleSave = async () => {
        try {
      //   setEnableAddActive(true);
      //   setEditing(true);
        const response = await saveGenericMedication({ genericMedication}).unwrap();
          dispatch(notify('Brand Medication Saved Successfully'));
          setGenericMedication(response);
          // setPreKey(response?.key);
        } catch (error) {
          console.error("Error saving Brand Medication:", error);
      }
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
      setListRequest({ ...listRequest, filters: [] });
    }
  };

  const isSelected = rowData => {
    if (rowData && genericMedication && rowData.key === genericMedication.key) {
      return 'selected-row';
    } else return '';
  };

  
  // Filter table
  const filters = () => (
    <Form layout="inline" fluid className="container-of-filter-fields-resources">
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
  // Icons column (Edite, reactive/Deactivate)
  const iconsForActions = (rowData: ApGenericMedication) => (
    <div className="container-of-icons-resources">
      {/* open edit brand when click on this icon */}
      <MdModeEdit
        className="icons-resources"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setOpenAddEditPopup(true)}
      />
      {/* deactivate/activate  when click on one of these icon */}
      {!rowData?.deletedAt ? (
        <MdDelete
          className="icons-resources"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteGenericMedicationModal('deactivate');
            setOpenConfirmDeleteGenericMedicationModal(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-resources"
          title="Activate"
          size={20}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteGenericMedicationModal('reactivate');
            setOpenConfirmDeleteGenericMedicationModal(true);
          }}
        />
      )}
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'code',
      title: <Translate>Code</Translate>,
      flexGrow: 4
    },
    {
      key: 'genericName',
      title: <Translate>Brand Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'manufacturerLkey',
      title: <Translate>Manufacturer</Translate>,
      flexGrow: 4,
      render: rowData =>
        rowData.manufacturerLvalue
          ? rowData.manufacturerLvalue.lovDisplayVale
          : rowData.manufacturerLkey
    },
    {
      key: 'dosageFormLkey',
      title: <Translate>Dosage Form</Translate>,
      flexGrow: 4,
      render: rowData =>
        rowData.dosageFormLvalue ? rowData.dosageFormLvalue.lovDisplayVale : rowData.dosageFormLkey
    },
    {
      key: 'usageInstructions',
      title: <Translate>Usage Instructions</Translate>,
      flexGrow: 4
    },
    {
      key: 'roaList',
      title: <Translate>ROA</Translate>,
      flexGrow: 4,
      render: rowData =>
        rowData.roaList?.map((item, index) => {
          const value = conjureValueBasedOnKeyFromList(
            medRoutLovQueryResponse?.object ?? [],
            item,
            'lovDisplayVale'
          );
          return (
            <span key={index}>
              {value}
              {index < rowData.roaList.length - 1 && ', '}
            </span>
          );
        })
    },
    {
      key: 'expiresAfterOpening',
      title: <Translate>Expires After Opening</Translate>,
      flexGrow: 4,
      render: rowData => (rowData.expiresAfterOpening ? 'Yes' : 'No')
    },
    {
      key: 'singlePatientUse',
      title: <Translate>Single Patient Use</Translate>,
      flexGrow: 4,
      render: rowData => (rowData.singlePatientUse ? 'Yes' : 'No')
    },
    {
      key: 'deleted_at',
      title: <Translate>Status</Translate>,
      flexGrow: 4,
      render: rowData => (rowData.deletedAt === null ? 'Active' : 'InActive')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];

  return (
    <Carousel
      style={{ height: 'auto', backgroundColor: 'var(--rs-body)' }}
      autoplay={false}
      activeIndex={carouselActiveIndex}
    >
      <Panel>

          <div className="container-of-add-new-button-resources">
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
          data={genericMedicationListResponse?.object ?? []}
          loading={isFetching}
          columns={tableColumns}
          rowClassName={isSelected}
          filters={filters()}
          onRowClick={rowData => {
            setGenericMedication(rowData);
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
              <AddEditBrandMedication
         open={openAddEditPopup}
         setOpen={setOpenAddEditPopup}
         genericMedication={genericMedication}
         setGenericMedication={setGenericMedication}
         handleSave={handleSave}
        />
      </Panel>
      
       <DeletionConfirmationModal
              open={openConfirmDeleteGenericMedicationModal}
              setOpen={setOpenConfirmDeleteGenericMedicationModal}
              itemToDelete="Resource"
              actionButtonFunction={deactivateReactivateMedication}
              actionType={stateOfDeleteGenericMedicationModal}
            />
    </Carousel>
  );
};

export default GenericMedications;
