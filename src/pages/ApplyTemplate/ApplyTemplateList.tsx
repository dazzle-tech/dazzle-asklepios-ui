import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useGetAvailabilityTemplatesByStatusQuery } from '@/services/appointment/availabilityTemplateService';
import { formatEnumString } from '@/utils';
import { CalendarDays } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Form, Panel } from 'rsuite';
import ApplyTemplate from './ApplyTemplate';

type AvailabilityTemplateRow = {
  id: number;
  facilityId: number;
  departmentId: number;
  templateName: string;
  templateType: string;
  status: string;
  durationMinutes?: number | null;
  parallelCapacityValue?: number | null;
};

const ApplyTemplateList = () => {
  const dispatch = useAppDispatch();
  const [recordOfSearch, setRecordOfSearch] = useState({ templateName: '' });
  const [selectedTemplate, setSelectedTemplate] = useState<AvailabilityTemplateRow | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);

  const { data: templatesResponse = [], isFetching } = useGetAvailabilityTemplatesByStatusQuery({
    status: 'PUBLISHED'
  });

  useEffect(() => {
    dispatch(setPageCode('Apply Template'));
    dispatch(setDivContent('Apply Template'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const filteredTemplates = useMemo(() => {
    const search = recordOfSearch.templateName?.trim().toLowerCase();
    if (!search) return templatesResponse;

    return templatesResponse.filter(template =>
      template.templateName?.toLowerCase().includes(search)
    );
  }, [recordOfSearch.templateName, templatesResponse]);

  const generateAction = (rowData: AvailabilityTemplateRow) => (
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
      render: (rowData: AvailabilityTemplateRow) => <p>{formatEnumString(rowData?.templateType)}</p>
    },
    {
      key: 'durationMinutes',
      title: <Translate>Duration</Translate>,
      flexGrow: 2,
      render: (rowData: AvailabilityTemplateRow) => <p>{rowData?.durationMinutes ?? '-'}</p>
    },
    {
      key: 'parallelCapacityValue',
      title: <Translate>Capacity</Translate>,
      flexGrow: 2,
      render: (rowData: AvailabilityTemplateRow) => <p>{rowData?.parallelCapacityValue ?? '-'}</p>
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      flexGrow: 2,
      render: (rowData: AvailabilityTemplateRow) => <p>{formatEnumString(rowData?.status)}</p>
    },
    {
      key: 'actions',
      title: <Translate></Translate>,
      flexGrow: 2,
      render: (rowData: AvailabilityTemplateRow) => generateAction(rowData)
    }
  ];

  return (
    <div>
      <Panel>
        <MyTable
          height={450}
          data={filteredTemplates}
          loading={isFetching}
          columns={tableColumns}
          onRowClick={(rowData: AvailabilityTemplateRow) => {
            setSelectedTemplate(rowData);
            setPopupOpen(true);
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
    </div>
  );
};

export default ApplyTemplateList;
