// Import required modules and components
import React, { useState, useEffect } from 'react';
import MyTable from '@/components/MyTable';
import { Panel, Form } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import PlusIcon from '@rsuite/icons/Plus';
import { MdDelete, MdEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import ReportResultTemplateModal from './ReportResultTemplateModal';
import { useDispatch } from 'react-redux';
import { AiOutlineEye } from 'react-icons/ai';
import { setPageCode, setDivContent } from '@/reducers/divSlice';
import {
  useGetAllReportTemplatesQuery,
  useSaveReportTemplateMutation,
  useToggleReportTemplateActiveMutation,
  useLazyGetReportTemplatesByNameQuery,
} from '@/services/reportTemplateService';
import { ReportTemplate } from '@/services/reportTemplateService';
import MyInput from '@/components/MyInput';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';

const ReportResultTemplate = () => {

  const dispatch = useDispatch();

  // FILTER & SORT STATES
  const [isFiltered, setIsFiltered] = useState(false);
  const [filterValue, setFilterValue] = useState({ name: "" });


  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 20,
    sort: "id,desc",
  });

  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 20,
    sort: "id,desc",
  });

  const [sortColumn, setSortColumn] = useState("id");
  const [sortType, setSortType] = useState<"asc" | "desc">("desc");

  // Lazy filter request
  const [triggerFilter, { data: filterResponse, isFetching: fetchingFilter }] =
    useLazyGetReportTemplatesByNameQuery();




  const { data, isLoading, refetch } = useGetAllReportTemplatesQuery(paginationParams);
  const [saveTemplate] = useSaveReportTemplateMutation();
  const [toggleActive] = useToggleReportTemplateActiveMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [viewOnly, setViewOnly] = useState(false);

  const handleToggleActive = async () => {
    if (!selectedItemId) return;

    try {
      dispatch(showSystemLoader());
      const current = data?.data?.find(r => r.id === selectedItemId)?.isActive;

      await toggleActive(selectedItemId).unwrap();
      refetch();

      dispatch(
        notify({
          msg: current
            ? "Report Template deactivated successfully"
            : "Report Template reactivated successfully",
          sev: "success"
        })
      );

    } catch (err) {
      console.log("Report Template Toggle Error:", err);
      dispatch(
        notify({
          msg: "Failed to update Report Template status",
          sev: "error"
        })
      );
    } finally {
      dispatch(hideSystemLoader());
      setOpenConfirmModal(false);
    }
  };


  const columns = [
    { key: 'TestName', title: 'Test Name', dataKey: 'name', width: 200 },
    {
      key: 'reportTemplate',
      title: 'View',
      width: 80,
      align: 'left',
      render: (rowData: ReportTemplate) => (
        <AiOutlineEye
          className="icon-view"
          title="View Template"
          onClick={() => {
            setSelectedTemplate(rowData);
            setViewOnly(true);
            setModalOpen(true);
          }}
        />
      )
    },
    {
      key: 'status',
      title: 'Status',
      dataKey: 'isActive',
      width: 100,
      align: 'center',
      render: (row: ReportTemplate) => (row.isActive ? 'Active' : 'Inactive')
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 150,
      align: 'center',
      render: (rowData: ReportTemplate) => (
        <div className="actions">
          <MdEdit
            className="icon-edit"
            title="Edit"
            onClick={() => {
              setSelectedTemplate(rowData);
              setViewOnly(false);
              setModalOpen(true);
            }}
          />
          {rowData.isActive ? (
            <MdDelete
              className="icon-delete"
              title="Deactivate"
              onClick={() => {
                setSelectedItemId(rowData.id!);
                setOpenConfirmModal(true);
              }}
            />
          ) : (
            <FaUndo
              className="icon-undo"
              title="Reactivate"
              onClick={() => {
                setSelectedItemId(rowData.id!);
                setOpenConfirmModal(true);
              }}
            />
          )}
        </div>
      )
    }
  ];



  const filters = (
    <Form fluid>
      <div className="filters">
        <MyInput
          fieldName="name"
          fieldLabel="Report Name"
          record={filterValue}
          setRecord={setFilterValue}
        />


        <div className="bt-right">
          <MyButton
            prefixIcon={() => <PlusIcon />}
            onClick={() => {
              setSelectedTemplate(null);
              setViewOnly(false);
              setModalOpen(true);
            }}
          >
            Add New
          </MyButton>
        </div>
      </div>
    </Form>
  );



  const handleFilter = () => {
    const input = filterValue?.name?.trim?.() ?? "";

    if (!input) {
      setIsFiltered(false);
      setFilterPagination(prev => ({ ...prev, page: 0 })); // RESET PAGE
      return;
    }

    setIsFiltered(true);
    setFilterPagination(prev => ({ ...prev, page: 0 })); // RESET PAGE

    triggerFilter({
      name: input,
      page: 0,
      size: filterPagination.size,
      sort: filterPagination.sort
    });
  };


  const handlePageChange = (event, newPage) => {
    const page = Math.max(0, Number(newPage));

    if (isFiltered) {
      setFilterPagination(prev => ({ ...prev, page }));
      triggerFilter({
        name: filterValue?.name?.trim?.() ?? "",
        page,
        size: filterPagination.size,
        sort: filterPagination.sort
      });
    } else {
      setPaginationParams(prev => ({ ...prev, page }));
    }
  };



  const handleRowsPerPageChange = (e: any) => {
    const newSize = Number(e?.target?.value ?? e);

    if (isFiltered) {
      setFilterPagination(prev => ({ ...prev, size: newSize, page: 0 }));
      triggerFilter({
        name: filterValue?.name?.trim?.() ?? "",
        page: 0,
        size: newSize,
        sort: filterPagination.sort
      });
    } else {
      setPaginationParams(prev => ({ ...prev, size: newSize, page: 0 }));
    }
  };


  const handleSortChange = (column: string, type: "asc" | "desc") => {
    setSortColumn(column);
    setSortType(type);

    // real column name
    const realColumn = columns.find(col => col.key === column)?.dataKey ?? column;
    const sortValue = `${realColumn},${type}`;

    if (isFiltered) {
      setFilterPagination(prev => ({ ...prev, sort: sortValue, page: 0 }));
      triggerFilter({
        name: filterValue?.name?.trim?.() ?? "",
        page: 0,
        size: filterPagination.size,
        sort: sortValue
      });
    } else {
      setPaginationParams(prev => ({ ...prev, sort: sortValue, page: 0 }));
    }
  };


  useEffect(() => {
    dispatch(setPageCode('Report_Result_Template'));
    dispatch(setDivContent('Report Result Template'));
  }, [dispatch]);


  useEffect(() => {
    const input = filterValue?.name?.trim?.() ?? "";

    const delay = setTimeout(() => {
      if (!input) {
        setIsFiltered(false);
        setFilterPagination(prev => ({ ...prev, page: 0 }));
        return;
      }

      setIsFiltered(true);
      setFilterPagination(prev => ({ ...prev, page: 0 }));

      triggerFilter({
        name: input,
        page: 0,
        size: filterPagination.size,
        sort: filterPagination.sort
      });
    }, 100);

    return () => clearTimeout(delay);
  }, [filterValue.name]);

  return (
    <Panel>
      <MyTable
        data={
          isFiltered
            ? filterResponse?.data ?? []
            : data?.data ?? []
        }
        totalCount={
          isFiltered
            ? filterResponse?.totalCount || 0
            : data?.totalCount || 0
        }
        loading={isLoading || fetchingFilter}
        columns={columns}
        filters={filters}
        page={isFiltered ? filterPagination.page : paginationParams.page}
        rowsPerPage={isFiltered ? filterPagination.size : paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
        rowClassName={(row: ReportTemplate) => (!row.isActive ? 'deactivated-row' : '')}
      />
      {/* Modal */}
      <ReportResultTemplateModal
        open={modalOpen}
        setOpen={(open) => {
          setModalOpen(open);
          if (!open) {
            setSelectedTemplate(null);
            setViewOnly(false);
          }
        }}
        initialData={
          selectedTemplate
            ? {
              id: selectedTemplate.id,
              name: selectedTemplate.name,
              templateValue: selectedTemplate.templateValue
            }
            : undefined
        }
        onSave={async (body) => {
          await saveTemplate(body).unwrap();
          refetch();
          setModalOpen(false);
        }}
        readOnly={viewOnly}
      />

      {/* Confirm Modal */}
      <DeletionConfirmationModal
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        itemToDelete={
          selectedItemId && data?.data?.find((r) => r.id === selectedItemId)?.isActive
            ? 'Deactivate'
            : 'Reactivate'
        }
        actionButtonFunction={handleToggleActive}
        actionType={
          selectedItemId && data?.data?.find((r) => r.id === selectedItemId)?.isActive
            ? 'deactivate'
            : 'reactivate'
        }
      />
    </Panel>
  );
};

export default ReportResultTemplate;
