import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { useGetPatientAttachmentsListQuery } from '@/services/attachmentService';
import { useGetEncounterByIdQuery } from '@/services/encounterService';
import { useGetPatientByIdQuery, useLazyGetPatientByIdQuery } from '@/services/patientService';
import { useGetProceduresQuery } from '@/services/procedureService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { newApProcedure } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { formatDateWithoutSeconds, fromCamelCaseToDBName } from '@/utils';
import { faBarcode, faFileWaveform } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { FaBedPulse, FaFileArrowDown, FaPrint } from 'react-icons/fa6';
import { MdAttachFile } from 'react-icons/md';
import { Checkbox, Form, HStack, Tooltip, Whisper } from 'rsuite';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';

import Perform from '../encounter/encounter-component/procedure/Perform';
const handleDownload = attachment => {
  const byteCharacters = atob(attachment.fileContent);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: attachment.contentType });

  // Create a temporary  element and trigger the download
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = attachment.fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
};
const ProcedureModule = () => {
  const dispatch = useAppDispatch();
  const [showCanceled, setShowCanceled] = useState(true);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [procedure, setProcedure] = useState<any>({
    ...newApProcedure
  });
  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(),
    toDate: null
  });
  const [record, setRecord] = useState({ filter: '', value: '' });
  const { data: patient } = useGetPatientByIdQuery(procedure?.patientKey, {
    skip: !procedure?.patientKey
  });
  const { data: encounter } = useGetEncounterByIdQuery(procedure?.encounterKey, {
    skip: !procedure?.encounterKey
  });
  const [openPerformModal, setOpenPerformModal] = useState(false);
  const { data: CategoryLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');
  const isSelected = rowData => {
    if (rowData && procedure && rowData.key === procedure.key) {
      return 'selected-row';
    } else return '';
  };

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'current_department',
        operator: 'match',
        value: 'false'
      },

      {
        fieldName: 'status_lkey',
        operator: showCanceled ? 'notMatch' : 'match',
        value: '3621690096636149'
      }
    ]
  });
  const {
    data: procedures,
    refetch: proRefetch,
    isLoading: procedureLoding
  } = useGetProceduresQuery(listRequest);
  const [attachmentsListRequest, setAttachmentsListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },

      {
        fieldName: 'attachment_type',
        operator: 'match',
        value: 'PROCEDURE'
      }
    ]
  });

  const {
    data: fetchPatintAttachmentsResponce,
    refetch: attachmentRefetch,
    isLoading: loadAttachment
  } = useGetPatientAttachmentsListQuery(attachmentsListRequest);
  const [trigger] = useLazyGetPatientByIdQuery();

  const filterFields = [
    { label: 'PROCEDURE ID', value: 'procedureId' },
    { label: 'Procedure Name', value: 'procedureName' },
    { label: 'INDICATIONS', value: 'indications' }
  ];
  useEffect(() => {
    if (!attachmentsModalOpen) {
      const updatedFilters = [
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        },

        {
          fieldName: 'attachment_type',
          operator: 'match',
          value: 'PROCEDURE'
        }
      ];
      setAttachmentsListRequest(prevRequest => ({
        ...prevRequest,
        filters: updatedFilters
      }));
    }
    attachmentRefetch();
  }, [attachmentsModalOpen]);

  const [patients, setPatients] = useState({});
  // Fetch patients for each procedure

  useEffect(() => {
    const fetchPatients = async () => {
      for (const procedure of procedures?.object) {
        const key = procedure.patientKey;
        if (!patients[key]) {
          const result = await trigger(key).unwrap();
          setPatients(prev => ({ ...prev, [key]: result }));
        }
      }
    };

    fetchPatients();
  }, [procedures]);
  // Update the listRequest filters when record changes
  const addOrUpdateFilter = (filters, newFilter) => {
    const index = filters.findIndex(f => f.fieldName === newFilter.fieldName);
    if (index > -1) {
      filters[index] = newFilter;
    } else {
      filters.push(newFilter);
    }
    return filters;
  };
  // Update the listRequest filters when showCanceled changes
  useEffect(() => {
    setListRequest(prev => {
      let updatedFilters = [...prev.filters];

      updatedFilters = addOrUpdateFilter(updatedFilters, {
        fieldName: 'current_department',
        operator: 'match',
        value: 'false'
      });

      updatedFilters = addOrUpdateFilter(updatedFilters, {
        fieldName: 'status_lkey',
        operator: showCanceled ? 'notMatch' : 'match',
        value: '3621690096636149'
      });

      return {
        ...prev,
        filters: updatedFilters
      };
    });
  }, [showCanceled]);

  useEffect(() => {
    if (record['filter']) {
      handleFilterChange(record['filter'], record['value']);
    } else {
      setListRequest(prev => ({
        ...prev,
        filters: addOrUpdateFilter([...prev.filters], {
          fieldName: 'current_department',
          operator: 'match',
          value: 'false'
        })
      }));

      setListRequest(prev => ({
        ...prev,
        filters: addOrUpdateFilter([...prev.filters], {
          fieldName: 'status_lkey',
          operator: showCanceled ? 'notMatch' : 'match',
          value: '3621690096636149'
        })
      }));
    }
  }, [record]);

  useEffect(() => {
    let updatedFilters = [...listRequest.filters];

    if (dateFilter.fromDate && dateFilter.toDate) {
      dateFilter.fromDate.setHours(0, 0, 0, 0);
      dateFilter.toDate.setHours(23, 59, 59, 999);

      updatedFilters = addOrUpdateFilter(updatedFilters, {
        fieldName: 'scheduled_date_time',
        operator: 'between',
        value: dateFilter.fromDate.getTime() + '-' + dateFilter.toDate.getTime()
      });
    } else if (dateFilter.fromDate) {
      dateFilter.fromDate.setHours(0, 0, 0, 0);

      updatedFilters = addOrUpdateFilter(updatedFilters, {
        fieldName: 'scheduled_date_time',
        operator: 'gte',
        value: dateFilter.fromDate.getTime()
      });
    } else if (dateFilter.toDate) {
      dateFilter.toDate.setHours(23, 59, 59, 999);

      updatedFilters = addOrUpdateFilter(updatedFilters, {
        fieldName: 'scheduled_date_time',
        operator: 'lte',
        value: dateFilter.toDate.getTime()
      });
    }

    setListRequest(prev => ({
      ...prev,
      filters: updatedFilters
    }));
  }, [dateFilter]);

  const handleFilterChange = (fieldName, value) => {
    if (value) {
      const newFilter = {
        fieldName: fromCamelCaseToDBName(fieldName),
        operator: 'containsIgnoreCase',
        value
      };

      setListRequest(prev => ({
        ...prev,
        filters: addOrUpdateFilter([...prev.filters], newFilter)
      }));
    }
  };

  const OpenPerformModel = () => {
    setOpenPerformModal(true);
  };

  const tableColumns = [
    {
      key: 'patientKey',
      title: <Translate>Patient</Translate>,
      render: (rowData: any) => {
        return (
          <Whisper
            placement="top"
            speaker={<Tooltip>{patients[rowData.patientKey]?.patientMrn}</Tooltip>}
          >
            {patients[rowData.patientKey]?.fullName}
          </Whisper>
        );
      }
    },
    {
      key: 'procedureId',
      dataKey: 'procedureId',
      title: <Translate>PROCEDURE ID</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.procedureId;
      }
    },
    {
      key: 'Procedure Name',
      dataKey: 'procedureName',
      title: <Translate>Procedure Name</Translate>,
      flexGrow: 1
    },
    {
      key: 'scheduledDateTime',
      dataKey: 'scheduledDateTime',
      title: <Translate>SCHEDULED DATE TIME</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.scheduledDateTime
          ? formatDateWithoutSeconds(rowData.scheduledDateTime)
          : ' ';
      }
    },
    {
      key: 'categoryKey',
      dataKey: 'categoryKey',
      title: <Translate>CATEGORY</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        const category = CategoryLovQueryResponse?.object?.find(item => {
          return item.key === rowData.categoryKey;
        });

        return category?.lovDisplayVale || ' ';
      }
    },
    {
      key: 'priorityLkey',
      dataKey: 'priorityLkey',
      title: <Translate>PRIORITY</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.priorityLkey ? rowData.priorityLvalue?.lovDisplayVale : rowData.priorityLkey;
      }
    },
    {
      key: 'procedureLevelLkey',
      dataKey: 'procedureLevelLkey',
      title: <Translate>LEVEL</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.procedureLevelLkey
          ? rowData.procedureLevelLvalue?.lovDisplayVale
          : rowData.procedureLevelLkey;
      }
    },
    {
      key: 'indications',
      dataKey: 'indications',
      title: <Translate>INDICATIONS</Translate>,
      flexGrow: 1
    },
    {
      key: 'statusLkey',
      dataKey: 'statusLkey',
      title: <Translate>STATUS</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.statusLvalue?.lovDisplayVale ?? null;
      }
    },
    {
      key: '',
      dataKey: '',
      title: <Translate>ATTACHED FILE</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        const matchingAttachments = fetchPatintAttachmentsResponce?.object?.filter(
          item => item.referenceObjectKey === rowData.key
        );
        const lastAttachment = matchingAttachments?.[matchingAttachments.length - 1];

        return (
          <HStack spacing={2}>
            {lastAttachment && (
              <FaFileArrowDown
                size={20}
                fill="var(--primary-gray)"
                onClick={() => handleDownload(lastAttachment)}
                style={{ cursor: 'pointer' }}
              />
            )}

            <MdAttachFile
              size={20}
              fill="var(--primary-gray)"
              onClick={() => setAttachmentsModalOpen(true)}
              style={{ cursor: 'pointer' }}
            />
          </HStack>
        );
      }
    },
    {
      key: 'perform',

      title: <Translate>PERFORM</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        const isDisabled = rowData.currentDepartment;

        return (
          <FaBedPulse
            size={22}
            fill={isDisabled ? '#ccc' : 'var(--primary-gray)'}
            style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
            onClick={!isDisabled ? OpenPerformModel : undefined}
          />
        );
      }
    },
    {
      key: 'print',
      title: <Translate>Print</Translate>,
      render: (rowData: any) => {
        const isDisabled = rowData.currentDepartment;

        return <FaPrint size={22} fill="var(--primary-gray)" style={{ cursor: 'pointer' }} />;
      }
    },
    {
      key: 'action',
      title: <Translate>Action</Translate>,
      render: (rowData: any) => {
        return (
          <HStack spacing={10}>
            <Whisper placement="top" trigger="hover" speaker={<Tooltip>Wristband</Tooltip>}>
              <FontAwesomeIcon icon={faBarcode} style={{ color: 'var(--primary-gray)' }} />
            </Whisper>
            <Whisper placement="top" trigger="hover" speaker={<Tooltip>Report</Tooltip>}>
              <FontAwesomeIcon icon={faFileWaveform} style={{ color: 'var(--primary-gray)' }} />
            </Whisper>
          </HStack>
        );
      }
    },
    {
      key: 'facilityKey',
      dataKey: 'facilityKey',
      title: <Translate>FACILITY</Translate>,
      flexGrow: 1,
      expandable: true,
      render: (rowData: any) => {
        return rowData.facilityKey ? rowData.facility?.facilityName : '';
      }
    },
    {
      key: 'departmentTypeLkey',
      dataKey: 'departmentTypeLkey',
      title: <Translate>DEPARTMENT</Translate>,
      flexGrow: 1,
      expandable: true,
      render: (rowData: any) => {
        return rowData.departmentKey
          ? rowData.department?.departmentTypeLvalue?.lovDisplayVale
          : '';
      }
    },

    {
      key: 'bodyPartLkey',
      dataKey: 'bodyPartLkey',
      title: <Translate>BODY PART</Translate>,
      flexGrow: 1,
      expandable: true,
      render: (rowData: any) => {
        return rowData.bodyPartLkey ? rowData.bodyPartLvalue.lovDisplayVale : rowData.bodyPartLkey;
      }
    },
    {
      key: 'sideLkey',
      dataKey: 'sideLkey',
      title: <Translate>SIDE</Translate>,
      flexGrow: 1,
      expandable: true,
      render: (rowData: any) => {
        return rowData.sideLkey ? rowData.sideLvalue.lovDisplayVale : rowData.sideLkey;
      }
    },
    {
      key: 'notes',
      dataKey: 'notes',
      title: <Translate>NOTE</Translate>,
      flexGrow: 1,
      expandable: true
    },
    ,
    {
      key: '',
      title: <Translate>CREATED AT/BY</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.createdBy}</span>
            <br />
            <span className="date-table-style">
              {rowData.createdAt ? formatDateWithoutSeconds(rowData.createdAt) : ''}
            </span>
          </>
        );
      }
    },
    {
      key: '',
      title: <Translate>UPDATED AT/BY</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.updatedBy}</span>
            <br />
            <span className="date-table-style">
              {rowData.createdAt ? formatDateWithoutSeconds(rowData.updatedAt) : ''}
            </span>
          </>
        );
      }
    },
    {
      key: '',
      title: <Translate>CANCELLED AT/BY</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.deletedBy}</span>
            <br />
            <span className="date-table-style">
              {rowData.deletedAt ? formatDateWithoutSeconds(rowData.deletedAt) : ''}
            </span>
          </>
        );
      }
    },
    {
      key: 'cancellationReason',
      dataKey: 'cancellationReason',
      title: <Translate>CANCELLITON REASON</Translate>,
      flexGrow: 1,
      expandable: true
    }
  ];
  const pageIndex = listRequest.pageNumber - 1;

  // how many rows per page:
  const rowsPerPage = listRequest.pageSize;

  // total number of items in the backend:
  const totalCount = procedures?.extraNumeric ?? 0;

  // handler when the user clicks a new page number:
  const handlePageChange = (_: unknown, newPage: number) => {
    // MUI gives you a zero-based page, so add 1 for your API

    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };

  // handler when the user chooses a different rows-per-page:
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1 // reset to first page
    });
  };

  const filters = () => (
    <>
      <Form layout="inline" fluid>
        <MyInput
          fieldType="date"
          fieldLabel="From Date"
          fieldName="fromDate"
          record={dateFilter}
          setRecord={setDateFilter}
          showLabel={false}
        />
        <MyInput
          fieldType="date"
          fieldLabel="To Date"
          fieldName="toDate"
          record={dateFilter}
          setRecord={setDateFilter}
          showLabel={false}
        />
        <MyInput
          selectDataValue="value"
          selectDataLabel="label"
          selectData={filterFields}
          fieldName="filter"
          fieldType="select"
          record={record}
          setRecord={updatedRecord => {
            setRecord({
              ...record,
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
          record={record}
          setRecord={setRecord}
          showLabel={false}
          placeholder="Search"
        />
        <Checkbox
          checked={!showCanceled}
          onChange={() => {
            setShowCanceled(!showCanceled);
          }}
        >
          Show Cancelled
        </Checkbox>
      </Form>
      <AdvancedSearchFilters searchFilter={true} />
    </>
  );
  return (
    <>
      <MyTable
        filters={filters()}
        columns={tableColumns}
        data={procedures?.object ?? []}
        onRowClick={rowData => {
          setProcedure(rowData);
        }}
        loading={procedureLoding}
        rowClassName={isSelected}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortChange={(sortBy, sortType) => {
          setListRequest({ ...listRequest, sortBy, sortType });
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      <MyModal
        open={openPerformModal}
        setOpen={setOpenPerformModal}
        title="Perform Details"
        hideActionBtn
        size="full"
        content={
          <Perform
            proRefetch={proRefetch}
            encounter={encounter}
            patient={patient}
            procedure={procedure}
            setProcedure={setProcedure}
            edit={false}
          />
        }
      ></MyModal>
    </>
  );
};
export default ProcedureModule;
