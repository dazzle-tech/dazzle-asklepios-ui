import React, { useEffect, useState, useMemo } from 'react';
import { Text, Form } from 'rsuite';
import { Plus } from '@rsuite/icons';
import { initialListRequest } from '@/types/types';
import { MdDelete } from 'react-icons/md';
import { MdSave } from 'react-icons/md';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import Icd10Search from '@/components/ICD10SearchComponent/IcdSearchable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import './styles.less';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useCreateIndicationMutation, useDeleteIndicationMutation, useGetIndicationsByActiveIngredientIdQuery, useUpdateIndicationMutation } from '@/services/setup/activeIngredients/activeIngredientIndicationService';
import { ActiveIngredientIndication } from '@/types/model-types-new';
import { newActiveIngredientIndication } from '@/types/model-types-constructor-new';
import { useGetIcdListQuery } from '@/services/setupService';
import { conjureValueBasedOnIDFromList, conjureValueBasedOnKeyFromList } from '@/utils';

const Indications = ({ selectedActiveIngredients }) => {

  const dispatch = useAppDispatch();


  const [activeIngredientIndication, setActiveIngredientIndication] =

    useState<ActiveIngredientIndication>({ ...newActiveIngredientIndication });

  const [openConfirmDeleteIndicationModal, setOpenConfirmDeleteIndicationModal] =
    useState<boolean>(false);


  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredList, setFilteredList] = useState<ActiveIngredientIndication[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [link, setLink] = useState({});
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 5,
    sort: "id,asc",
  });
  const [sortColumn, setSortColumn] = useState("id");
  const [sortType, setSortType] = useState<"asc" | "desc">("asc");
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });



  const { data: icdListResponseData } = useGetIcdListQuery({
    ...initialListRequest,
    pageSize: 1000
  });




  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: "id,asc"
  });



  const {
    data: indicationListResponseData,
    refetch,
    isFetching
  } = useGetIndicationsByActiveIngredientIdQuery(selectedActiveIngredients?.id);
  console.log("LIST", indicationListResponseData)
  const totalCount = indicationListResponseData?.length ?? 0;









  // Fetch value unit Lov response
  const { data: valueUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  // remove indication
  const [removeActiveIngredientIndication, removeActiveIngredientIndicationMutation] =
    useDeleteIndicationMutation();
  // save indication
  const [saveActiveIngredientIndication, saveActiveIngredientIndicationMutation] =
    useCreateIndicationMutation();

  // class name for selected row
const isSelected = (rowData) => {
  return rowData?.id === activeIngredientIndication?.id ? 'selected-row' : '';
};



  // Icons column (remove)
  const iconsForActions = (rowData) => (
    <div className="container-of-icons">
      <MdDelete
        className="icons-style"
        title="Delete"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => {
          setActiveIngredientIndication(rowData);
          setOpenConfirmDeleteIndicationModal(true);
        }}
      />
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'icdCode',
      title: <Translate>ICD Code</Translate>,
      render: rowData => <Text>{rowData.icd10CodeId}</Text>
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
          {conjureValueBasedOnKeyFromList(valueUnitLovQueryResponse?.object ?? [], rowData?.unit, 'lovDisplayVale')}

        </Text>
      )
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      render: (rowData) => iconsForActions(rowData)
    }
  ];


const [updateActiveIngredientIndication] = useUpdateIndicationMutation();


  // handle save
    const save = () => {
      const icdId =
        activeIngredientIndication.icdCodeId ??
        activeIngredientIndication.icd10CodeId;

      if (!icdId) {
        dispatch(notify({ msg: "Invalid ICD Code", sev: "error" }));
        return;
      }

      const payload: any = {
        ...activeIngredientIndication,
        activeIngredientId: selectedActiveIngredients.id,
        icd10CodeId: icdId,
      };
      if (activeIngredientIndication.id) {
        updateActiveIngredientIndication(payload)
          .unwrap()
          .then(() => {
            dispatch(notify({ msg: "Updated successfully", sev: "success" }));
            refetch();
            setActiveIngredientIndication({ ...newActiveIngredientIndication });
          })
          .catch(() => {
            dispatch(notify({ msg: "Update failed", sev: "error" }));
          });
      } else {
        saveActiveIngredientIndication(payload)
          .unwrap()
          .then(() => {
            dispatch(notify({ msg: "Added successfully", sev: "success" }));
            refetch();
            setActiveIngredientIndication({ ...newActiveIngredientIndication });
          })
          .catch(() => {
            dispatch(notify({ msg: "Failed to save", sev: "error" }));
          });
      }
      };

  // handle new
  const handleIndicationsNew = () => {
    setActiveIngredientIndication({ ...newActiveIngredientIndication });
  };

  // handle remove
  const remove = () => {
    setOpenConfirmDeleteIndicationModal(false);

    if (!activeIngredientIndication.id) {
      dispatch(notify({ msg: "Invalid indication", sev: "error" }));
      return;
    }

    removeActiveIngredientIndication(activeIngredientIndication.id)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: "Deleted successfully", sev: "success" }));
        refetch();
        setActiveIngredientIndication({ ...newActiveIngredientIndication });
      })
      .catch((err) => {
        console.log("Delete Error:", err);
        dispatch(notify({ msg: "Failed to delete", sev: "error" }));
      });
  };





  const handleFilterChange = async (field: string, value: string, page = 0, size?: number) => {
    try {
      if (!field || !value) {
        setIsFiltered(false);
        setFilteredList([]);
        return;
      }

      const currentSize = size ?? filterPagination.size;
      let response;
      const params = {
        page,
        size: currentSize,
        sort: filterPagination.sort,
      };

      // if (field === "type") {
      //   response = await getDentalActionsByTypeQuery({
      //     type: value?.toUpperCase(),
      //     ...params,
      //   }).unwrap();
      // } else if (field === "description") {
      //   response = await getDentalActionsByDescriptionQuery({
      //     description: value,
      //     ...params,
      //   }).unwrap();
      // }

      setFilteredList(response.data ?? []);
      setFilteredTotal(response.totalCount ?? 0);
      setLink(response.links);
      setIsFiltered(true);
      setFilterPagination({ ...filterPagination, page, size: currentSize });
    } catch (error) {
      console.error("Error filtering dental actions:", error);
      dispatch(notify({ msg: "Failed to filter Dental Actions", sev: "error" }));
      setIsFiltered(false);
    }
  };


  const handleSortChange = (sortColumn: string, sortType: "asc" | "desc") => {
    setSortColumn(sortColumn);
    setSortType(sortType);

    const sortValue = `${sortColumn},${sortType}`;

    if (isFiltered) {
      setFilterPagination({ ...filterPagination, sort: sortValue, page: 0 });
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, filterPagination.size);
    } else {
      setPaginationParams({
        ...paginationParams,
        sort: sortValue,
        page: 0,
      });
    }
  };


  const handlePageChange = (event, newPage) => {
    setPaginationParams(prev => ({
      ...prev,
      page: newPage
    }));
  };







  // Effects
  useEffect(() => {
    if (selectedActiveIngredients) {
      setActiveIngredientIndication(prevState => ({
        ...prevState,
        activeIngredientId: selectedActiveIngredients.id
      }));
    }
  }, [selectedActiveIngredients]);


  console.log("Indication Table Data: ", indicationListResponseData);



  const pageIndex = paginationParams.page ?? 0;
  const rowsPerPage = paginationParams.size ?? 5;

  const paginatedData = useMemo(() => {
    if (!indicationListResponseData) return [];

    const start = pageIndex * rowsPerPage;
    const end = start + rowsPerPage;

    return indicationListResponseData.slice(start, end);
  }, [indicationListResponseData, pageIndex, rowsPerPage]);


  return (
    <Form fluid>
      <div className="container-of-actions-header-active">
        <div className="container-of-fields-active">

          <Icd10Search
            object={activeIngredientIndication}
            setOpject={setActiveIngredientIndication}
            fieldName="icdCodeId"
            label="Indications (ICD-10)"
            mode="singleICD10"
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
            fieldName="unit"
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
        height={450}
        data={paginatedData}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(rowData) => setActiveIngredientIndication(rowData)}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={(e) => {
          const newSize = Number(e.target.value);
          setPaginationParams(prev => ({
            ...prev,
            size: newSize,
            page: 0
          }));
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
