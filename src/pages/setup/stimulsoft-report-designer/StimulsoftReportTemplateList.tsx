import React, { useEffect, useState } from 'react';
import { Form, Panel } from 'rsuite';
import { useDispatch } from 'react-redux';
import PlusIcon from '@rsuite/icons/Plus';
import { MdDelete, MdEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';

import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import Translate from '@/components/Translate';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import {
  hideSystemLoader,
  notify,
  showSystemLoader,
} from '@/utils/uiReducerActions';
import {
  StimulsoftReportTemplate,
  useGetStimulsoftReportTemplatesQuery,
  useLazyGetStimulsoftReportTemplatesByNameQuery,
  useToggleStimulsoftReportTemplateActiveMutation,
} from '@/services/reports/stimulsoftReportService';

import StimulsoftReportTemplateModal from './StimulsoftReportTemplateModal';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { formatEnumString } from '@/utils';
import './styles.less';

const StimulsoftReportTemplateList = () => {
  const dispatch = useDispatch();

  const [filterValue, setFilterValue] = useState({ name: '' });
  const [isFiltered, setIsFiltered] = useState(false);
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 20,
    sort: 'id,desc',
    timestamp: Date.now(),
  });
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 20,
    sort: 'id,desc',
  });
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openTemplateModal, setOpenTemplateModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [editingTemplate, setEditingTemplate] =
    useState<StimulsoftReportTemplate | null>(null);

  const { data, isLoading } =
    useGetStimulsoftReportTemplatesQuery(paginationParams);
  const [triggerFilter, { data: filterResponse, isFetching: fetchingFilter }] =
    useLazyGetStimulsoftReportTemplatesByNameQuery();
  const [toggleActive] = useToggleStimulsoftReportTemplateActiveMutation();
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});
  const facilities = Array.isArray(facilityListResponse)
    ? facilityListResponse
    : (facilityListResponse as any)?.data ??
      (facilityListResponse as any)?.content ??
      [];

  useEffect(() => {
    dispatch(setPageCode('STIMULSOFT_REPORT_DESIGNER'));
    dispatch(setDivContent('Report Templates'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    const delay = setTimeout(() => {
      const input = filterValue?.name?.trim?.() ?? '';
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
        sort: filterPagination.sort,
      });
    }, 100);
    return () => clearTimeout(delay);
  }, [filterValue.name]);

  const rawList = isFiltered ? filterResponse?.data : data?.data;
  const currentList: StimulsoftReportTemplate[] = Array.isArray(rawList)
    ? rawList
    : [];

  const refreshList = async () => {
    const timestamp = Date.now();
    if (isFiltered) {
      await triggerFilter({
        name: filterValue?.name?.trim?.() ?? '',
        page: filterPagination.page,
        size: filterPagination.size,
        sort: filterPagination.sort,
        timestamp,
      }).unwrap();
      return;
    }
    setPaginationParams(prev => ({ ...prev, timestamp }));
  };

  const handleToggleActive = async () => {
    if (!selectedItemId) return;
    try {
      dispatch(showSystemLoader());
      const current = currentList.find(r => r.id === selectedItemId)?.isActive;
      await toggleActive(selectedItemId).unwrap();
      await refreshList();
      dispatch(
        notify({
          msg: current
            ? 'Report template deactivated successfully'
            : 'Report template reactivated successfully',
          sev: 'success',
        })
      );
    } catch {
      dispatch(
        notify({
          msg: 'Failed to update report template status',
          sev: 'error',
        })
      );
    } finally {
      dispatch(hideSystemLoader());
      setOpenConfirmModal(false);
    }
  };

  const columns = [
    { key: 'name', title: 'Template Name', dataKey: 'name', width: 200 },
    { key: 'code', title: 'Code', dataKey: 'code', width: 140 },
    {
      key: 'facility',
      title: 'Facility',
      width: 180,
      render: (row: StimulsoftReportTemplate) => {
        const named = facilities.find(
          (f: any) => Number(f?.id) === Number(row.facilityId)
        )?.name;
        return named || '—';
      },
    },
    {
      key: 'module',
      title: 'Module',
      dataKey: 'module',
      width: 160,
      render: (row: StimulsoftReportTemplate) =>
        row.module ? formatEnumString(row.module) : '—',
    },
    {
      key: 'status',
      title: 'Status',
      dataKey: 'isActive',
      width: 100,
      align: 'center' as const,
      render: (row: StimulsoftReportTemplate) =>
        row.isActive ? 'Active' : 'Inactive',
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 140,
      align: 'center' as const,
      render: (rowData: StimulsoftReportTemplate) => (
        <div className="actions">
          <MdEdit
            className="icon-edit"
            title="Edit Report"
            onClick={() => {
              setEditingTemplate(rowData);
              setOpenTemplateModal(true);
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

  const handlePageChange = (_event, newPage) => {
    const page = Math.max(0, Number(newPage));
    if (isFiltered) {
      setFilterPagination(prev => ({ ...prev, page }));
      triggerFilter({
        name: filterValue?.name?.trim?.() ?? '',
        page,
        size: filterPagination.size,
        sort: filterPagination.sort,
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
        name: filterValue?.name?.trim?.() ?? '',
        page: 0,
        size: newSize,
        sort: filterPagination.sort,
      });
    } else {
      setPaginationParams(prev => ({ ...prev, size: newSize, page: 0 }));
    }
  };

  const handleSortChange = (column: string, type: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortType(type);
    const realColumn =
      columns.find(col => col.key === column)?.dataKey ?? column;
    const sortValue = `${realColumn},${type}`;
    if (isFiltered) {
      setFilterPagination(prev => ({ ...prev, sort: sortValue, page: 0 }));
      triggerFilter({
        name: filterValue?.name?.trim?.() ?? '',
        page: 0,
        size: filterPagination.size,
        sort: sortValue,
      });
    } else {
      setPaginationParams(prev => ({ ...prev, sort: sortValue, page: 0 }));
    }
  };

  const selectedIsActive = currentList.find(r => r.id === selectedItemId)
    ?.isActive;

  return (
    <Panel>
      <MyTable
        data={currentList}
        totalCount={
          isFiltered ? filterResponse?.totalCount || 0 : data?.totalCount || 0
        }
        loading={isLoading || fetchingFilter}
        columns={columns}
        filters={
          <Form fluid>
            <div className="filters">
              <MyInput
                fieldName="name"
                fieldLabel="Report Name"
                record={filterValue}
                setRecord={setFilterValue}
              />
            </div>
          </Form>
        }
        tableButtons={
          <div className="bt-right">
            <MyButton
              prefixIcon={() => <PlusIcon />}
              onClick={() => {
                setEditingTemplate(null);
                setOpenTemplateModal(true);
              }}
            >
              <Translate>Add New</Translate>
            </MyButton>
          </div>
        }
        page={isFiltered ? filterPagination.page : paginationParams.page}
        rowsPerPage={
          isFiltered ? filterPagination.size : paginationParams.size
        }
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
        rowClassName={(row: StimulsoftReportTemplate) =>
          !row.isActive ? 'deactivated-row' : ''
        }
      />

      <StimulsoftReportTemplateModal
        open={openTemplateModal}
        setOpen={open => {
          setOpenTemplateModal(open);
          if (!open) setEditingTemplate(null);
        }}
        initialData={editingTemplate}
        onSaved={refreshList}
      />

      <DeletionConfirmationModal
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        itemToDelete={selectedIsActive ? 'Deactivate' : 'Reactivate'}
        actionButtonFunction={handleToggleActive}
        actionType={selectedIsActive ? 'deactivate' : 'reactivate'}
      />
    </Panel>
  );
};

export default StimulsoftReportTemplateList;
