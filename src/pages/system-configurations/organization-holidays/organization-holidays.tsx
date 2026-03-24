
import React, { useEffect, useState } from 'react';
import { Panel, Form, Whisper, Tooltip } from 'rsuite';
import './styles.less';

import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';

import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';

import { useEnumOptions } from '@/services/enumsApi';

import AddEditHoliday from './AddEditOrganizationHoliday';
import {
  useGetAllOrganizationHolidaysQuery,
  useSearchOrganizationHolidaysQuery,
  useToggleOrganizationHolidayMutation
} from '@/services/system-configurations/organizationHolidaysService';
import { OrganizationHolidayResponseVM } from '@/types/model-types-new';
import { MdModeEdit, MdDelete } from "react-icons/md";
import { FaUndo } from "react-icons/fa";
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useGetAllOrganizationDefinitionsQuery } from '@/services/system-configurations/organizationDefinitionService';
import { OrganizationDefinition as OrganizationDefinitionType } from '@/types/model-types-new';
import { newOrganizationDefinition, newOrganizationHolidayResponseVM } from '@/types/model-types-constructor-new';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { conjureValueBasedOnIDFromList, formatEnumString } from '@/utils';

const OrganizationHolidays = () => {
  const dispatch = useAppDispatch();
  const [popupOpen, setPopupOpen] = useState(false);
  const [
    openConfirmِActivationHolidayModal,
    setOpenConfirmActivationHolidayModal,
  ] = useState<boolean>(false);
  const [stateOfActivationModal, setStateOfActivationModal] =
    useState<string>("deactivate");
  const [selectedHoliday, setSelectedHoliday] = useState<OrganizationHolidayResponseVM>({...newOrganizationHolidayResponseVM});
  const [isFiltered, setIsFiltered] = useState(false);
  const [organization, setOrganization] = useState<OrganizationDefinitionType>({ ...newOrganizationDefinition });

  const [filtersState, setFiltersState] = useState({
    name: '',
    holidayType: '',
    startDate: '',
    endDate: '',
    recurring: undefined,
    allFacilities: undefined,
    facilityId: undefined
  });

  const [searchParams, setSearchParams] = useState<any>(null);

  // ───────────── API ─────────────
  const { data, isFetching, refetch } = useGetAllOrganizationHolidaysQuery();
  const { data: organizations } = useGetAllOrganizationDefinitionsQuery({});
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});

  const { data: filteredData } =
    useSearchOrganizationHolidaysQuery(searchParams, {
      skip: !searchParams
    });

  const [toggleActive] = useToggleOrganizationHolidayMutation();

  const holidayTypeEnum = useEnumOptions('HolidayType');

  const isSelected = rowData => {
    if (rowData && selectedHoliday && rowData.id === selectedHoliday.id) {
      return 'selected-row';
    } else return '';
  };

  // Effects
  useEffect(() => {
    dispatch(setPageCode('OrganizationHolidays'));
    dispatch(setDivContent('Organization Holidays'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, []);

  useEffect(() => {
    if (organizations && organizations.length > 0) {
      setOrganization(organizations[0]);
    } else {
      setOrganization({ ...newOrganizationDefinition });
    }
  }, [organizations]);

  const cleanParams = (obj: any) => {
    return Object.fromEntries(
      Object.entries(obj).filter(
        ([_, v]) => v !== '' && v !== null && v !== undefined
      )
    );
  };

  const handleSearch = () => {
    const cleaned = cleanParams(filtersState);
    setSearchParams(cleaned);
    setIsFiltered(true);
  };

  const handleReset = () => {
    setFiltersState({
      name: '',
      holidayType: '',
      startDate: '',
      endDate: '',
      recurring: undefined,
      allFacilities: undefined,
      facilityId: undefined
    });
    setSearchParams(null);
    setIsFiltered(false);
  };

  const handleToggle = async (id: number) => {
    try {
      await toggleActive(id).unwrap();
      refetch();
      dispatch(
        notify({
          msg:
            stateOfActivationModal === 'deactivate'
              ? 'The Holiday was successfully Deactivated'
              : 'The Holiday was successfully Reactivated',
          sev: 'success'
        })
      );
      setOpenConfirmActivationHolidayModal(false);
    } catch {
      dispatch(
        notify({
          msg:
            stateOfActivationModal === 'deactivate'
              ? 'Failed to deactivate this Holiday'
              : 'Failed to reactivate this Holiday',
          sev: 'warning'
        })
      );
    }
  };

  const handleNew = () => {
    setSelectedHoliday({ ...newOrganizationHolidayResponseVM });
    setPopupOpen(true);
  };

  const iconsForActions = (rowData: OrganizationHolidayResponseVM) => (
    <div className="container-of-icons">
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          setSelectedHoliday(rowData);
          setPopupOpen(true);
        }}
      />
      {rowData?.isActive ? (
        <MdDelete
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          className="icons-style"
          onClick={() => {
            setSelectedHoliday(rowData);
            setStateOfActivationModal("deactivate");
            setOpenConfirmActivationHolidayModal(true);
          }}
        />
      ) : (
        <FaUndo
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          className="icons-style"
          onClick={() => {
            setSelectedHoliday(rowData);
            setStateOfActivationModal("reactivate");
            setOpenConfirmActivationHolidayModal(true);
          }}
        />
      )}
    </div>
  );

  const parseFacilityIds = (value?: string | null): number[] => {
    if (!value) return [];
    return value
      .split(',')
      .map(v => Number(v.trim()))
      .filter(v => Number.isFinite(v));
  };

  const getFacilitiesLabel = (row: OrganizationHolidayResponseVM) => {
    if (row?.allFacilities) return 'All Facilities';
    const ids = parseFacilityIds(row?.facilityIds ?? '');
    const names = ids.map(id =>
      conjureValueBasedOnIDFromList(facilityListResponse as any[], id, 'name') ?? String(id)
    );
    return names.length ? names.join(', ') : '-';
  };

  // ───────────── TABLE COLUMNS ─────────────
  const columns = [
    { key: 'name', title: 'Name' },
    {
      key: 'holidayType', title: 'Type', render: (rowData: OrganizationHolidayResponseVM) => (
        <span>{formatEnumString(rowData.holidayType)}</span>
      ),
    },
    { key: 'startDate', title: 'Start Date' },
    { key: 'endDate', title: 'End Date' },
    {
      key: 'recurring',
      title: 'Recurring',
      render: (row: OrganizationHolidayResponseVM) => (row.recurring ? 'Yes' : 'No')
    },
    {
      key: 'appliesTo',
      title: 'Applies To',
      render: (row: OrganizationHolidayResponseVM) => (row.allFacilities ? 'All Facilities' : 'Selected')
    },
    {
      key: 'facilities',
      title: 'Facilities',
      width: 200,
      render: (row: OrganizationHolidayResponseVM) => <span>{getFacilitiesLabel(row)}</span>
    },
    {
      key: 'status',
      title: 'Status',
      render: (row: OrganizationHolidayResponseVM) => (row.isActive ? 'Active' : 'Inactive')
    },
    {
      key: 'reason',
      title: 'Reason',
      render: (row: OrganizationHolidayResponseVM) =>
        <Whisper placement="top" speaker={<Tooltip>{row?.reason}</Tooltip>}>
          <span>{row.reason?.length > 20 ? row.reason.substring(0, 20) + '...' : row.reason}</span>
        </Whisper>
    },
    {
      key: 'icons',
      title: '',
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];

  // ───────────── FILTER UI ─────────────
  const filters = () => (
    <Form layout="inline" fluid className='container-of-filters-organization-holidays'>
      <MyInput
        fieldName="name"
        fieldType="text"
        placeholder="Name"
        record={filtersState}
        setRecord={setFiltersState}
        column
      />

      <MyInput
        fieldName="holidayType"
        fieldType="select"
        selectData={holidayTypeEnum}
        selectDataLabel="label"
        selectDataValue="value"
        record={filtersState}
        setRecord={setFiltersState}
        column
      />

      <MyInput
        fieldName="startDate"
        fieldType="date"
        record={filtersState}
        setRecord={setFiltersState}
        column
      />

      <MyInput
        fieldName="endDate"
        fieldType="date"
        record={filtersState}
        setRecord={setFiltersState}
        column
      />

      <MyInput
        fieldName="recurring"
        fieldType="select"
        selectData={[
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]}
        selectDataLabel="label"
        selectDataValue="value"
        record={filtersState}
        setRecord={setFiltersState}
        column
      />

      <MyInput
        fieldName="allFacilities"
        fieldType="select"
        selectData={[
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]}
        selectDataLabel="label"
        selectDataValue="value"
        record={filtersState}
        setRecord={setFiltersState}
        column
      />

      <MyInput
        fieldName="facilityId"
        fieldType="select"
        fieldLabel="Facility"
        selectData={facilityListResponse}
        selectDataLabel="name"
        selectDataValue="id"
        record={filtersState}
        setRecord={setFiltersState}
        disabled={filtersState.allFacilities}
        column
      />

      <MyButton onClick={handleSearch}>Search</MyButton>
      <MyButton onClick={handleReset} color="red">
        Reset
      </MyButton>
    </Form>
  );

  return (
    <Panel>
      <MyTable
        height={500}
        rowClassName={isSelected}
        data={isFiltered ? filteredData ?? [] : data ?? []}
        loading={isFetching}
        columns={columns}
        filters={filters()}
        onRowClick={row => setSelectedHoliday(row)}
        tableButtons={
          <MyButton prefixIcon={() => <AddOutlineIcon />} onClick={handleNew}>
            Add New
          </MyButton>
        }
      />

      <AddEditHoliday
        open={popupOpen}
        setOpen={setPopupOpen}
        holiday={selectedHoliday}
        refetch={refetch}
        organization={organization}
      />

      <DeletionConfirmationModal
        open={openConfirmِActivationHolidayModal}
        setOpen={setOpenConfirmActivationHolidayModal}
        itemToDelete="Holiday"
        actionButtonFunction={() =>
          handleToggle(selectedHoliday?.id)
        }
        actionType={stateOfActivationModal}
      />
    </Panel>
  );
};

export default OrganizationHolidays;