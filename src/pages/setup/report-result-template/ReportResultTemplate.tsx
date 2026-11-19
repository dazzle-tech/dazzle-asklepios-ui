// ReportResultTemplate.tsx
import React, { useState, useEffect } from "react";
import MyTable from "@/components/MyTable";
import { Panel } from "rsuite";
import MyButton from "@/components/MyButton/MyButton";
import PlusIcon from "@rsuite/icons/Plus";
import { MdDelete, MdEdit } from "react-icons/md";
import { FaUndo } from "react-icons/fa";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import ReportResultTemplateModal from "./ReportResultTemplateModal";
import { useDispatch } from "react-redux";
import { AiOutlineEye } from "react-icons/ai";
import { setPageCode, setDivContent } from "@/reducers/divSlice";
import {
  useGetAllReportTemplatesQuery,
  useCreateReportTemplateMutation,
  useUpdateReportTemplateMutation,
  useToggleReportTemplateActiveMutation,
} from "@/services/setup/report-template/reportTemplateService";
import { ReportTemplate } from "@/services/setup/report-template/reportTemplateService";
import {
  hideSystemLoader,
  notify,
  showSystemLoader,
} from "@/utils/uiReducerActions";

const ReportResultTemplate = () => {
  const dispatch = useDispatch();

  // Header filters: draft value typed in the input, applied on Enter.
  // Everything is sent to one endpoint and combined with AND.
  const emptyHeaderFilters = { name: "" };
  type HeaderFilterField = keyof typeof emptyHeaderFilters;
  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  // 'all' sends no isActive param
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("active");
  const activeFilter = statusFilter === "all" ? undefined : statusFilter === "active";

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 20,
    sort: "id,desc",
  });

  const [sortColumn, setSortColumn] = useState("id");
  const [sortType, setSortType] = useState<"asc" | "desc">("desc");

  const { data, isFetching, refetch } = useGetAllReportTemplatesQuery({
    ...paginationParams,
    ...appliedFilters,
    isActive: activeFilter,
  });

  // ✅ split create/update
  const [createTemplate] = useCreateReportTemplateMutation();
  const [updateTemplate] = useUpdateReportTemplateMutation();
  const [toggleActive] = useToggleReportTemplateActiveMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ReportTemplate | null>(null);
  const [viewOnly, setViewOnly] = useState(false);

  const handleToggleActive = async () => {
    if (!selectedItemId) return;

    try {
      dispatch(showSystemLoader());

      const current = (data?.data ?? []).find((r) => r.id === selectedItemId)?.isActive;

      await toggleActive(selectedItemId).unwrap();
      refetch();

      dispatch(
        notify({
          msg: current
            ? "Report Template deactivated successfully"
            : "Report Template reactivated successfully",
          sev: "success",
        })
      );
    } catch (err) {
      dispatch(
        notify({
          msg: "Failed to update Report Template status",
          sev: "error",
        })
      );
    } finally {
      dispatch(hideSystemLoader());
      setOpenConfirmModal(false);
    }
  };

  // Applying one header filter also applies whatever is typed in the others
  const applyHeaderFilter = (field: HeaderFilterField, value: string) => {
    const next = { ...headerFilters, [field]: value };
    setHeaderFilters(next);
    setAppliedFilters(next);
    setPaginationParams((prev) => ({ ...prev, page: 0 }));
  };

  const headerSearch = (field: HeaderFilterField, placeholder?: string) => ({
    searchable: true,
    searchPlaceholder: placeholder,
    searchValue: headerFilters[field],
    onSearchChange: (value: string) => setHeaderFilters((prev) => ({ ...prev, [field]: value })),
    onSearchSubmit: (value?: string) => applyHeaderFilter(field, value ?? headerFilters[field]),
  });

  // Changing the status filter starts again from the first page
  useEffect(() => {
    setPaginationParams((prev) => ({ ...prev, page: 0 }));
  }, [statusFilter]);

  const columns = [
    {
      key: "TestName",
      title: "Template Name",
      dataKey: "name",
      width: 240,
      ...headerSearch("name", "Search name"),
    },
    {
      key: "reportTemplate",
      title: "View",
      width: 80,
      align: "left" as const,
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
      ),
    },
    {
      key: "status",
      title: "Status",
      dataKey: "isActive",
      width: 120,
      align: "center" as const,
      searchable: true,
      searchType: "select" as const,
      searchOptions: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "All", value: "all" },
      ],
      searchValue: statusFilter,
      onSearchChange: (value: string) => setStatusFilter(value as "active" | "inactive" | "all"),
      render: (row: ReportTemplate) => (row.isActive ? "Active" : "Inactive"),
    },
    {
      key: "actions",
      title: "Actions",
      width: 150,
      align: "center" as const,
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
      ),
    },
  ];

  const handlePageChange = (event, newPage) => {
    const page = Math.max(0, Number(newPage));
    setPaginationParams((prev) => ({ ...prev, page }));
  };

  const handleRowsPerPageChange = (e: any) => {
    const newSize = Number(e?.target?.value ?? e);
    setPaginationParams((prev) => ({ ...prev, size: newSize, page: 0 }));
  };

  const handleSortChange = (column: string, type: "asc" | "desc") => {
    setSortColumn(column);
    setSortType(type);

    const realColumn =
      columns.find((col) => col.key === column)?.dataKey ?? column;
    const sortValue = `${realColumn},${type}`;
    setPaginationParams((prev) => ({ ...prev, sort: sortValue, page: 0 }));
  };

  useEffect(() => {
    dispatch(setPageCode("Report_Result_Template"));
    dispatch(setDivContent("Report Result Template"));
  }, [dispatch]);

    // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <Panel dir={dir}>
      <MyTable
        data={data?.data ?? []}
        totalCount={data?.totalCount || 0}
        loading={isFetching}
        columns={columns}
        tableButtons={<div className="bt-right">
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
                </div>}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
        rowClassName={(row: ReportTemplate) =>
          !row.isActive ? "deactivated-row" : ""
        }
      />

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
                templateValue: selectedTemplate.templateValue,
              }
            : undefined
        }
        onSave={async (body) => {
          // ✅ decide create vs update
          if (body.id) {
            await updateTemplate({
              id: body.id,
              name: body.name,
              templateValue: body.templateValue,
              isActive: true,
            }).unwrap();
          } else {
            await createTemplate({
              name: body.name,
              templateValue: body.templateValue,
              isActive: true,
            }).unwrap();
          }
          refetch();
          setModalOpen(false);
        }}
        readOnly={viewOnly}
      />

      <DeletionConfirmationModal
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        itemToDelete={
          selectedItemId &&
          data?.data?.find((r) => r.id === selectedItemId)?.isActive
            ? "Deactivate"
            : "Reactivate"
        }
        actionButtonFunction={handleToggleActive}
        actionType={
          selectedItemId &&
          data?.data?.find((r) => r.id === selectedItemId)?.isActive
            ? "deactivate"
            : "reactivate"
        }
      />
    </Panel>
  );
};

export default ReportResultTemplate;
