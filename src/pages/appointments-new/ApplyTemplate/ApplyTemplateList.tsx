import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { Box } from '@mui/material';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useGetAvailabilityGenerationBatchesByTemplateQuery } from '@/services/appointment/availabilityGenerationBatchService/availabilityGenerationBatchService';
import { useGetAppointmentsByBatchIdQuery } from '@/services/appointment/appointmentService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetAllDepartmentsWithoutPaginationQuery } from '@/services/security/departmentService';
import {
  useGetAvailabilityTemplatesActiveByStatusQuery,
  useLazyGetAvailabilityTemplatesByTemplateNameQuery
} from '@/services/appointment/availabilityTemplateService';
import type {
  AppointmentFromTemplate,
  AvailabilityGenerationBatch,
  AvailabilityTemplateResponseVM
} from '@/types/model-types-new';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import type { LinkMap } from '@/utils/paginationHelper';
import { PaginationPerPage } from '@/utils/paginationPerPage';
import { CalendarDays } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Form, Panel } from 'rsuite';
import ApplyTemplate from './ApplyTemplate';

const ApplyTemplateList = () => {
  const dispatch = useAppDispatch();
  const [recordOfSearch, setRecordOfSearch] = useState({ templateName: '' });
  const [selectedTemplate, setSelectedTemplate] = useState<AvailabilityTemplateResponseVM | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [templatePaginationParams, setTemplatePaginationParams] = useState({
    page: 0,
    size: 15
  });
  const [templateSortColumn, setTemplateSortColumn] = useState('templateName');
  const [templateSortType, setTemplateSortType] = useState<'asc' | 'desc'>('asc');
  const [batchPaginationParams, setBatchPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });
  const [batchSortColumn, setBatchSortColumn] = useState('id');
  const [batchSortType, setBatchSortType] = useState<'asc' | 'desc'>('asc');
  const [batchLinks, setBatchLinks] = useState<LinkMap>({});
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [appointmentPaginationParams, setAppointmentPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });
  const [appointmentSortColumn, setAppointmentSortColumn] = useState('id');
  const [appointmentSortType, setAppointmentSortType] = useState<'asc' | 'desc'>('asc');
  const [appointmentLinks, setAppointmentLinks] = useState<LinkMap>({});

  const { data: templatesResponse = [], isFetching } = useGetAvailabilityTemplatesActiveByStatusQuery({
    status: 'PUBLISHED'
  });
  const { data: facilitiesResponse = [] } = useGetAllFacilitiesQuery({});
  const { data: departmentsResponse = [] } = useGetAllDepartmentsWithoutPaginationQuery({});
  const [getTemplatesByName, { data: searchedTemplates = [], isFetching: isSearchingByName }] =
    useLazyGetAvailabilityTemplatesByTemplateNameQuery();
  const { data: generationBatchesResponse, isFetching: isFetchingBatches } =
    useGetAvailabilityGenerationBatchesByTemplateQuery(
      {
        templateId: selectedTemplate?.id ?? 0,
        ...batchPaginationParams
      },
      { skip: !selectedTemplate?.id }
    );
  const { data: appointmentsByBatchResponse, isFetching: isFetchingAppointmentsByBatch } =
    useGetAppointmentsByBatchIdQuery(
      {
        batchId: selectedBatchId ?? 0,
        ...appointmentPaginationParams
      },
      { skip: !selectedBatchId }
    );

  useEffect(() => {
    dispatch(setPageCode('Apply Template'));
    dispatch(setDivContent('Apply Template'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    if (!selectedTemplate?.id) {
      return;
    }
    setBatchPaginationParams({
      page: 0,
      size: 15,
      sort: 'id,asc',
      timestamp: Date.now()
    });
    setBatchSortColumn('id');
    setBatchSortType('asc');
    setBatchLinks({});
    setSelectedBatchId(null);
    setAppointmentPaginationParams({
      page: 0,
      size: 15,
      sort: 'id,asc',
      timestamp: Date.now()
    });
    setAppointmentSortColumn('id');
    setAppointmentSortType('asc');
    setAppointmentLinks({});
  }, [selectedTemplate?.id]);

  useEffect(() => {
    setBatchLinks(generationBatchesResponse?.links ?? {});
  }, [generationBatchesResponse?.links]);

  useEffect(() => {
    setAppointmentLinks(appointmentsByBatchResponse?.links ?? {});
  }, [appointmentsByBatchResponse?.links]);

  useEffect(() => {
    const search = recordOfSearch.templateName?.trim();
    if (!search || search.length < 3) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      getTemplatesByName({ templateName: search });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [getTemplatesByName, recordOfSearch.templateName]);

  const tableData = useMemo(() => {
    const search = recordOfSearch.templateName?.trim();
    return search && search.length >= 3 ? searchedTemplates : templatesResponse;
  }, [recordOfSearch.templateName, searchedTemplates, templatesResponse]);

  const sortedTemplates = useMemo(() => {
    const rows = [...(tableData ?? [])];
    const direction = templateSortType === 'desc' ? -1 : 1;
    const getSortValue = (row: AvailabilityTemplateResponseVM) => {
      switch (templateSortColumn) {
        case 'templateName':
          return String(row?.templateName ?? '').toLowerCase();
        case 'templateType':
          return String(formatEnumString(row?.templateType ?? '')).toLowerCase();
        case 'facilityId':
          return String(facilityNameById.get(row?.facilityId) ?? '').toLowerCase();
        case 'departmentId':
          return String(departmentNameById.get(row?.departmentId) ?? '').toLowerCase();
        case 'status':
          return String(row?.status ?? '').toLowerCase();
        default:
          return String((row as any)?.[templateSortColumn] ?? '').toLowerCase();
      }
    };

    rows.sort((a, b) => {
      const av = getSortValue(a);
      const bv = getSortValue(b);
      if (av === bv) return 0;
      return av > bv ? direction : -direction;
    });

    return rows;
  }, [tableData, templateSortColumn, templateSortType, facilityNameById, departmentNameById]);

  const templateTotalCount = sortedTemplates.length;
  const pagedTemplates = useMemo(() => {
    const start = templatePaginationParams.page * templatePaginationParams.size;
    return sortedTemplates.slice(start, start + templatePaginationParams.size);
  }, [sortedTemplates, templatePaginationParams.page, templatePaginationParams.size]);

  const facilityNameById = useMemo(() => {
    return new Map(
      (facilitiesResponse ?? []).map((facility: any) => [
        facility?.id,
        facility?.name ?? facility?.facilityName ?? facility?.code ?? `Facility #${facility?.id}`
      ])
    );
  }, [facilitiesResponse]);

  const departmentNameById = useMemo(() => {
    return new Map(
      (departmentsResponse ?? []).map((department: any) => [
        department?.id,
        department?.name ??
          department?.departmentName ??
          department?.description ??
          `Department #${department?.id}`
      ])
    );
  }, [departmentsResponse]);

  const templateStatusColorMap = useMemo(
    () =>
      new Map<string, string>([
        ['PUBLISHED', '#45B887'],
        ['DRAFT', '#98A2B4'],
        ['INACTIVE', '#98A2B4']
      ]),
    []
  );

  const executionStatusColorMap = useMemo(
    () =>
      new Map<string, string>([
        ['PENDING', '#F59E0B'],
        ['COMPLETED', '#45B887'],
        ['FAILED', '#DC2626']
      ]),
    []
  );

  const handlingModeColorMap = useMemo(
    () =>
      new Map<string, string>([
        ['INCLUDE_AS_EXCEPTION', '#7C3AED'],
        ['EXCLUDE_HOLIDAYS', '#0EA5E9']
      ]),
    []
  );

  const generationBatches = generationBatchesResponse?.data ?? [];
  const batchTotalCount = generationBatchesResponse?.totalCount ?? 0;
  const appointmentsByBatch = appointmentsByBatchResponse?.data ?? [];
  const appointmentTotalCount = appointmentsByBatchResponse?.totalCount ?? 0;

  useEffect(() => {
    setTemplatePaginationParams(prev => ({ ...prev, page: 0 }));
  }, [recordOfSearch.templateName]);

  const handleTemplateSortChange = (sortColumn: string, sortType: 'asc' | 'desc') => {
    setTemplateSortColumn(sortColumn);
    setTemplateSortType(sortType);
    setTemplatePaginationParams(prev => ({ ...prev, page: 0 }));
  };

  const handleTemplatePageChange = (_event: unknown, newPage: number) => {
    const maxPage = Math.max(0, Math.ceil(templateTotalCount / templatePaginationParams.size) - 1);
    setTemplatePaginationParams(prev => ({ ...prev, page: Math.min(newPage, maxPage) }));
  };

  const handleBatchSortChange = (sortColumn: string, sortType: 'asc' | 'desc') => {
    setBatchSortColumn(sortColumn);
    setBatchSortType(sortType);
    setBatchPaginationParams({
      ...batchPaginationParams,
      sort: `${sortColumn},${sortType}`,
      page: 0,
      timestamp: Date.now()
    });
  };

  const handleBatchPageChange = (event: unknown, newPage: number) => {
    PaginationPerPage.handlePageChange(
      event,
      newPage,
      batchPaginationParams,
      batchLinks,
      setBatchPaginationParams
    );
  };

  const handleAppointmentSortChange = (sortColumn: string, sortType: 'asc' | 'desc') => {
    setAppointmentSortColumn(sortColumn);
    setAppointmentSortType(sortType);
    setAppointmentPaginationParams({
      ...appointmentPaginationParams,
      sort: `${sortColumn},${sortType}`,
      page: 0,
      timestamp: Date.now()
    });
  };

  const handleAppointmentPageChange = (event: unknown, newPage: number) => {
    PaginationPerPage.handlePageChange(
      event,
      newPage,
      appointmentPaginationParams,
      appointmentLinks,
      setAppointmentPaginationParams
    );
  };

  const scopeColorMap = useMemo(
    () =>
      new Map<string, string>([
        ['DEPARTMENT', '#7C3AED'],
        ['SPECIFIC_CHANNEL', '#F97316']
      ]),
    []
  );

  const generateAction = (rowData: AvailabilityTemplateResponseVM) => (
    <div className="container-of-icons">
      <button
        type="button"
        title="Apply Template"
        onClick={e => {
          e.stopPropagation();
          setSelectedTemplate(rowData);
          setPopupOpen(true);
        }}
        className="icons-style"
        style={{ background: 'transparent', border: 'none', padding: 0, display: 'inline-flex' }}
        aria-label="Apply Template"
      >
        <CalendarDays size={24} />
      </button>
    </div>
  );

  const tableColumns = [
    {
      key: 'templateName',
      title: <Translate>Template Name</Translate>,
      flexGrow: 4,
      dataKey: 'templateName'
    },
    {
      key: 'templateType',
      title: <Translate>Template Type</Translate>,
      flexGrow: 3,
      render: (rowData: AvailabilityTemplateResponseVM) => <p>{formatEnumString(rowData?.templateType)}</p>
    },
    {
      key: 'facilityId',
      title: <Translate>Facility</Translate>,
      flexGrow: 3,
      render: (rowData: AvailabilityTemplateResponseVM) => (
        <p>{facilityNameById.get(rowData?.facilityId) ?? '-'}</p>
      )
    },
    {
      key: 'departmentId',
      title: <Translate>Department</Translate>,
      flexGrow: 3,
      render: (rowData: AvailabilityTemplateResponseVM) => (
        <p>{departmentNameById.get(rowData?.departmentId) ?? '-'}</p>
      )
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      flexGrow: 2,
      render: (rowData: AvailabilityTemplateResponseVM) => (
        <MyBadgeStatus
          color={templateStatusColorMap.get(String(rowData?.status ?? '').toUpperCase()) ?? '#98A2B4'}
          contant={formatEnumString(rowData?.status ?? '')}
        />
      )
    },
    {
      key: 'actions',
      title: <Translate></Translate>,
      flexGrow: 2,
      render: (rowData: AvailabilityTemplateResponseVM) => generateAction(rowData)
    }
  ];

  const generationBatchColumns = [
    {
      key: 'applyStartDateTime',
      title: <Translate>Start Date</Translate>,
      flexGrow: 3,
      render: (rowData: AvailabilityGenerationBatch) => (
        <p>{rowData?.applyStartDateTime ? formatDateWithoutSeconds(rowData.applyStartDateTime) : '-'}</p>
      )
    },
    {
      key: 'applyEndDateTime',
      title: <Translate>End Date</Translate>,
      flexGrow: 3,
      render: (rowData: AvailabilityGenerationBatch) => (
        <p>{rowData?.applyEndDateTime ? formatDateWithoutSeconds(rowData.applyEndDateTime) : '-'}</p>
      )
    },
    {
      key: 'executionStatus',
      title: <Translate>Execution Status</Translate>,
      flexGrow: 2,
      render: (rowData: AvailabilityGenerationBatch) => (
        rowData?.executionStatus ? (
          <MyBadgeStatus
            color={
              executionStatusColorMap.get(String(rowData.executionStatus).toUpperCase()) ?? '#98A2B4'
            }
            contant={formatEnumString(rowData.executionStatus)}
          />
        ) : (
          <p>-</p>
        )
      )
    },
    {
      key: 'createdDate',
      title: <Translate>Create Date</Translate>,
      flexGrow: 3,
      render: (rowData: AvailabilityGenerationBatch) => (
        <p>{rowData?.createdDate ? formatDateWithoutSeconds(rowData.createdDate) : '-'}</p>
      )
    },
    {
      key: 'holidayHandlingMode',
      title: <Translate>Handling Mode</Translate>,
      flexGrow: 2,
      render: (rowData: AvailabilityGenerationBatch) => (
        rowData?.holidayHandlingMode ? (
          <MyBadgeStatus
            color={
              handlingModeColorMap.get(String(rowData.holidayHandlingMode).toUpperCase()) ?? '#98A2B4'
            }
            contant={formatEnumString(rowData.holidayHandlingMode)}
          />
        ) : (
          <p>-</p>
        )
      )
    },
    {
      key: 'scope',
      title: <Translate>Scope</Translate>,
      flexGrow: 2,
      render: (rowData: AvailabilityGenerationBatch) => (
        rowData?.scope ? (
          <MyBadgeStatus
            color={scopeColorMap.get(String(rowData.scope).toUpperCase()) ?? '#98A2B4'}
            contant={formatEnumString(rowData.scope)}
          />
        ) : (
          <p>-</p>
        )
      )
    }
  ];

  const appointmentColumns = [
    {
      key: 'startDatetime',
      title: <Translate>Start Datetime</Translate>,
      flexGrow: 3,
      render: (rowData: AppointmentFromTemplate) => (
        <p>{(rowData as any)?.startDatetime ? formatDateWithoutSeconds((rowData as any).startDatetime) : '-'}</p>
      )
    },
    {
      key: 'endDatetime',
      title: <Translate>End Datetime</Translate>,
      flexGrow: 3,
      render: (rowData: AppointmentFromTemplate) => (
        <p>{(rowData as any)?.endDatetime ? formatDateWithoutSeconds((rowData as any).endDatetime) : '-'}</p>
      )
    },
    {
      key: 'capacityIndex',
      title: <Translate>Capacity Index</Translate>,
      flexGrow: 2,
      render: (rowData: AppointmentFromTemplate) => <p>{(rowData as any)?.capacityIndex ?? '-'}</p>
    },
    {
      key: 'deffered',
      title: <Translate>Deffered</Translate>,
      flexGrow: 2,
      render: (rowData: AppointmentFromTemplate) => {
        const rawValue = (rowData as any)?.deffered ?? (rowData as any)?.deferred;
        if (rawValue === true) return <p>True</p>;
        if (rawValue === false) return <p>False</p>;
        return <p>-</p>;
      }
    },
    {
      key: 'defferedAt',
      title: <Translate>Deffered At</Translate>,
      flexGrow: 3,
      render: (rowData: AppointmentFromTemplate) => (
        <p>{(rowData as any)?.defferedAt ? formatDateWithoutSeconds((rowData as any).defferedAt) : '-'}</p>
      )
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      flexGrow: 2,
      render: (rowData: AppointmentFromTemplate) => {
        const statusRaw = String((rowData as any)?.status ?? '');
        const s = statusRaw.toUpperCase();
        const getStatusColor = () => {
          if (s.includes('BOOK')) return '#059669';
          if (s.includes('CONFIRM')) return '#166534';
          if (s.includes('COMPLETE')) return '#6DA7E8';
          if (s.includes('NEW')) return '#4B7BEC';
          if (s.includes('CHECK')) return '#F5B971';
          if (s.includes('NO_SHOW') || s.includes('NO-SHOW')) return '#E8CF5A';
          if (s.includes('IN_SERVICE') || s.includes('IN SERVICE')) return '#7C8BF3';
          if (s.includes('CANCEL')) return '#F87171';
          return '#C8D1E1';
        };

        return statusRaw ? (
          <MyBadgeStatus color={getStatusColor()} contant={formatEnumString(statusRaw)} />
        ) : (
          <p>-</p>
        );
      }
    }
  ];

  return (
    <div>
      <Panel>
        <MyTable
          height={450}
          data={pagedTemplates}
          loading={
            isFetching || ((recordOfSearch.templateName?.trim().length ?? 0) >= 3 && isSearchingByName)
          }
          columns={tableColumns}
          onRowClick={(rowData: AvailabilityTemplateResponseVM) => {
            setSelectedTemplate(rowData);
          }}
          filters={
            <div className="container-of-header-actions-facility">
              <Form layout="inline">
                <MyInput
                  fieldName="templateName"
                  fieldType="text"
                  record={recordOfSearch}
                  setRecord={setRecordOfSearch}
                  showLabel={false}
                  placeholder="Search by Template Name"
                  width={'220px'}
                />
              </Form>
            </div>
          }
          page={templatePaginationParams.page}
          rowsPerPage={templatePaginationParams.size}
          totalCount={templateTotalCount}
          onPageChange={handleTemplatePageChange}
          onRowsPerPageChange={e => {
            const newSize = Number(e.target.value);
            setTemplatePaginationParams({
              page: 0,
              size: newSize
            });
          }}
          sortColumn={templateSortColumn}
          sortType={templateSortType}
          onSortChange={handleTemplateSortChange}
        />

        {popupOpen && (
          <ApplyTemplate
            open={popupOpen}
            setOpen={setPopupOpen}
            selectedTemplate={selectedTemplate}
          />
        )}
      </Panel>

      {selectedTemplate?.id && (
        <Box mt={3}>
          <Panel header={`Generation Batches - ${selectedTemplate.templateName}`}>
            <MyTable
              height={320}
              data={generationBatches}
              loading={isFetchingBatches}
              columns={generationBatchColumns}
              onRowClick={(rowData: AvailabilityGenerationBatch) => {
                const batchId = Number((rowData as any)?.id ?? 0);
                if (!batchId) return;
                setSelectedBatchId(batchId);
                setAppointmentPaginationParams({
                  ...appointmentPaginationParams,
                  page: 0,
                  sort: 'id,asc',
                  timestamp: Date.now()
                });
                setAppointmentSortColumn('id');
                setAppointmentSortType('asc');
                setAppointmentLinks({});
              }}
              page={batchPaginationParams.page}
              rowsPerPage={batchPaginationParams.size}
              totalCount={batchTotalCount}
              onPageChange={handleBatchPageChange}
              onRowsPerPageChange={e => {
                const newSize = Number(e.target.value);
                setBatchPaginationParams({
                  ...batchPaginationParams,
                  size: newSize,
                  page: 0,
                  timestamp: Date.now()
                });
              }}
              sortColumn={batchSortColumn}
              sortType={batchSortType}
              onSortChange={handleBatchSortChange}
            />
          </Panel>
        </Box>
      )}

      {selectedTemplate?.id && selectedBatchId && (
        <Box mt={3}>
          <Panel header={`Appointments - Batch #${selectedBatchId}`}>
            <MyTable
              height={320}
              data={appointmentsByBatch}
              loading={isFetchingAppointmentsByBatch}
              columns={appointmentColumns}
              page={appointmentPaginationParams.page}
              rowsPerPage={appointmentPaginationParams.size}
              totalCount={appointmentTotalCount}
              onPageChange={handleAppointmentPageChange}
              onRowsPerPageChange={e => {
                const newSize = Number(e.target.value);
                setAppointmentPaginationParams({
                  ...appointmentPaginationParams,
                  size: newSize,
                  page: 0,
                  timestamp: Date.now()
                });
              }}
              sortColumn={appointmentSortColumn}
              sortType={appointmentSortType}
              onSortChange={handleAppointmentSortChange}
            />
          </Panel>
        </Box>
      )}
    </div>
  );
};

export default ApplyTemplateList;
