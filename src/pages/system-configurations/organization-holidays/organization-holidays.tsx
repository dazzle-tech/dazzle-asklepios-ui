
import React, { useEffect, useState } from 'react';
import { Panel, Whisper, Tooltip } from 'rsuite';
import './styles.less';

import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';

import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';

import { useEnumOptions } from '@/services/enumsApi';

import AddEditHoliday from './AddEditOrganizationHoliday';
import {
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

// Header filters: draft values typed in the inputs, applied on Enter / select change.
// Everything is sent to the search endpoint and combined with AND.
const emptyHeaderFilters = {
  name: '',
  holidayType: '',
  startDate: '',
  endDate: '',
  recurring: '',
  allFacilities: '',
  facilityId: ''
};
type HeaderFilterField = keyof typeof emptyHeaderFilters;

const yesNoOptions = [
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' }
];

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
  const [organization, setOrganization] = useState<OrganizationDefinitionType>({ ...newOrganizationDefinition });

  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  // 'all' sends no isActive param
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';

  // ───────────── API ─────────────
  // Empty filters are left out, so with none set this returns every holiday
  const searchParams = Object.fromEntries(
    Object.entries({ ...appliedFilters, isActive: activeFilter }).filter(
      ([, v]) => v !== '' && v !== null && v !== undefined
    )
  );
  const { data, isFetching, refetch } = useSearchOrganizationHolidaysQuery(searchParams);
  const { data: organizations } = useGetAllOrganizationDefinitionsQuery({});
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});

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

  // Applying one header filter also applies whatever is typed in the others
  const applyHeaderFilter = (field: HeaderFilterField, value: string) => {
    const next = { ...headerFilters, [field]: value };
    setHeaderFilters(next);
    setAppliedFilters(next);
  };

  const headerSearch = (field: HeaderFilterField, placeholder?: string) => ({
    searchable: true,
    searchPlaceholder: placeholder,
    searchValue: headerFilters[field],
    onSearchChange: (value: string) => setHeaderFilters(prev => ({ ...prev, [field]: value })),
    onSearchSubmit: (value?: string) => applyHeaderFilter(field, value ?? headerFilters[field])
  });

  const headerSelect = (field: HeaderFilterField, options: { label: string; value: string }[]) => ({
    ...headerSearch(field),
    searchType: 'select' as const,
    searchOptions: [{ label: 'All', value: '' }, ...options]
  });

  const facilityOptions = ((facilityListResponse as any[]) ?? []).map((f: any) => ({ label: f.name, value: String(f.id) }));

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
    { key: 'name', title: 'Name', width: 180, ...headerSearch('name') },
    {
      key: 'holidayType', title: 'Type', width: 150, ...headerSelect('holidayType', holidayTypeEnum ?? []),
      render: (rowData: OrganizationHolidayResponseVM) => (
        <span>{formatEnumString(rowData.holidayType)}</span>
      ),
    },
    // From this date on / up to this date (same as the old search)
    { key: 'startDate', title: 'Start Date', width: 160, ...headerSearch('startDate'), searchType: 'date' as const },
    { key: 'endDate', title: 'End Date', width: 160, ...headerSearch('endDate'), searchType: 'date' as const },
    {
      key: 'recurring',
      title: 'Recurring',
      width: 110,
      ...headerSelect('recurring', yesNoOptions),
      render: (row: OrganizationHolidayResponseVM) => (row.recurring ? 'Yes' : 'No')
    },
    {
      key: 'appliesTo',
      title: 'Applies To',
      width: 140,
      ...headerSelect('allFacilities', [
        { label: 'All Facilities', value: 'true' },
        { label: 'Selected', value: 'false' }
      ]),
      render: (row: OrganizationHolidayResponseVM) => (row.allFacilities ? 'All Facilities' : 'Selected')
    },
    {
      key: 'facilities',
      title: 'Facilities',
      width: 200,
      ...headerSelect('facilityId', facilityOptions),
      render: (row: OrganizationHolidayResponseVM) => <span>{getFacilitiesLabel(row)}</span>
    },
    {
      key: 'status',
      title: 'Status',
      width: 120,
      searchable: true,
      searchType: 'select' as const,
      searchOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'All', value: 'all' }
      ],
      searchValue: statusFilter,
      onSearchChange: (value: string) => setStatusFilter(value as 'active' | 'inactive' | 'all'),
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

      // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <Panel dir={dir}>
      <MyTable
        height={500}
        rowClassName={isSelected}
        data={data ?? []}
        loading={isFetching}
        columns={columns}
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