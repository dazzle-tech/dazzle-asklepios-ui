import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { Box } from '@mui/material';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useGetAvailabilityGenerationBatchesByTemplateQuery } from '@/services/appointment/availabilityGenerationBatchService/availabilityGenerationBatchService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetAllDepartmentsWithoutPaginationQuery } from '@/services/security/departmentService';
import {
  useGetAvailabilityTemplatesByStatusQuery,
  useLazyGetAvailabilityTemplatesByTemplateNameQuery
} from '@/services/appointment/availabilityTemplateService';
import type { AvailabilityGenerationBatch, AvailabilityTemplateResponseVM } from '@/types/model-types-new';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { CalendarDays } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Form, Panel } from 'rsuite';
import ApplyTemplate from './ApplyTemplate';

const ApplyTemplateList = () => {
  const dispatch = useAppDispatch();
  const [recordOfSearch, setRecordOfSearch] = useState({ templateName: '' });
  const [selectedTemplate, setSelectedTemplate] = useState<AvailabilityTemplateResponseVM | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);

  const { data: templatesResponse = [], isFetching } = useGetAvailabilityTemplatesByStatusQuery({
    status: 'PUBLISHED'
  });
  const { data: facilitiesResponse = [] } = useGetAllFacilitiesQuery({});
  const { data: departmentsResponse = [] } = useGetAllDepartmentsWithoutPaginationQuery({});
  const [getTemplatesByName, { data: searchedTemplates = [], isFetching: isSearchingByName }] =
    useLazyGetAvailabilityTemplatesByTemplateNameQuery();
  const { data: generationBatches = [], isFetching: isFetchingBatches } =
    useGetAvailabilityGenerationBatchesByTemplateQuery(
      { templateId: selectedTemplate?.id ?? 0 },
      { skip: !selectedTemplate?.id }
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

  return (
    <div>
      <Panel>
        <MyTable
          height={450}
          data={tableData}
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
            />
          </Panel>
        </Box>
      )}
    </div>
  );
};

export default ApplyTemplateList;
