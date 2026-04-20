import React from 'react';
import { Form } from 'rsuite';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';
import PatientSearch from '@/components/PatientSearch';

type Props = {
  filtersCollapsed: boolean;
  setFiltersCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  activeFacilitiesResponse: any[];
  selectedFacility: any;
  setSelectedFacility: React.Dispatch<React.SetStateAction<any>>;
  departmentOptions: any[];
  selectedDepartment: { departmentId: number | string | null };
  setSelectedDepartment: React.Dispatch<
    React.SetStateAction<{ departmentId: number | string | null }>
  >;
  TemplateTypeEnum: any[];
  selectedResourceTypeValue: { value: string | null };
  setSelectedResourceTypeValue: React.Dispatch<React.SetStateAction<{ value: string | null }>>;
  filteredResourcesList: any[];
  selectedResources: { resourceKey: string | null };
  setSelectedResources: React.Dispatch<React.SetStateAction<{ resourceKey: string | null }>>;
  mode: string;
  schedulePatientFilter: any;
  setSchedulePatientFilter: React.Dispatch<React.SetStateAction<any>>;
  AppointmentStatusEnum: any[];
  selectedAppointmentStatus: { status: string | null };
  setSelectedAppointmentStatus: React.Dispatch<React.SetStateAction<{ status: string | null }>>;
  BookingModeEnum: any[];
  selectedBookingMode: { bookingMode: string | string[] | null };
  setSelectedBookingMode: React.Dispatch<
    React.SetStateAction<{ bookingMode: string | string[] | null }>
  >;
};

const ScheduleFiltersPanel = ({
  filtersCollapsed,
  setFiltersCollapsed,
  activeFacilitiesResponse,
  selectedFacility,
  setSelectedFacility,
  departmentOptions,
  selectedDepartment,
  setSelectedDepartment,
  TemplateTypeEnum,
  selectedResourceTypeValue,
  setSelectedResourceTypeValue,
  filteredResourcesList,
  selectedResources,
  setSelectedResources,
  mode,
  schedulePatientFilter,
  setSchedulePatientFilter,
  AppointmentStatusEnum,
  selectedAppointmentStatus,
  setSelectedAppointmentStatus,
  BookingModeEnum,
  selectedBookingMode,
  setSelectedBookingMode
}: Props) => {
  return (
    <div
      className={`appointments-filters-wrap ${filtersCollapsed ? 'collapsed' : ''}`}
      style={{ width: '100%', paddingInline: 8, paddingTop: 8 }}
    >
      <SectionContainer
        title={'Filters'}
        action={
          <button
            type="button"
            className="appointments-filters-collapse-btn"
            onClick={() => setFiltersCollapsed(prev => !prev)}
            aria-label={filtersCollapsed ? 'Expand filters' : 'Collapse filters'}
            title={filtersCollapsed ? 'Expand filters' : 'Collapse filters'}
          >
            {filtersCollapsed ? '▾' : '▴'}
          </button>
        }
        content={
          !filtersCollapsed && (
            <Form fluid layout="inline">
              <div
                className="appointments-filter-row"
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 12,
                  flexWrap: 'wrap',
                  width: '100%'
                }}
              >
                <MyInput
                  disabled
                  height={35}
                  width={'11.5vw'}
                  column
                  fieldLabel="Facility"
                  selectData={activeFacilitiesResponse ?? []}
                  fieldType="select"
                  selectDataLabel="name"
                  selectDataValue="id"
                  fieldName="id"
                  record={selectedFacility}
                  setRecord={setSelectedFacility}
                  searchable={false}
                />

                <MyInput
                  height={35}
                  width={'11.5vw'}
                  column
                  fieldLabel="Department"
                  selectData={departmentOptions ?? []}
                  fieldType="select"
                  selectDataLabel="name"
                  selectDataValue="id"
                  fieldName="departmentId"
                  record={selectedDepartment}
                  setRecord={setSelectedDepartment}
                  searchable
                />

                <MyInput
                  height={35}
                  width={'11.5vw'}
                  column
                  fieldLabel="Resource Type"
                  fieldType="select"
                  fieldName="value"
                  selectData={TemplateTypeEnum ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={selectedResourceTypeValue}
                  setRecord={setSelectedResourceTypeValue}
                  searchable={false}
                />

                <MyInput
                  height={35}
                  width={'11.5vw'}
                  column
                  fieldLabel="Resource"
                  selectData={filteredResourcesList ?? []}
                  fieldType="select"
                  selectDataLabel="resourceName"
                  selectDataValue="key"
                  fieldName="resourceKey"
                  record={selectedResources}
                  setRecord={setSelectedResources}
                  disabled={!selectedResourceTypeValue?.value}
                  searchable
                />

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: 'calc(11.5vw * 2 + 12px)',
                    minWidth: 0,
                    flex: '0 0 auto'
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 4,
                      lineHeight: 1.2,
                      color: mode === 'light' ? 'var(--rs-text-primary)' : 'var(--rs-text-secondary)'
                    }}
                  >
                    Patient
                  </span>
                  <PatientSearch
                    value={schedulePatientFilter}
                    onChange={setSchedulePatientFilter}
                    width="100%"
                    containerMinWidth={0}
                    criteriaWidthPx={108}
                    inputHeightPx={35}
                    showLabel={false}
                    fieldLabel="Patient"
                  />
                </div>

                <MyInput
                  height={35}
                  width={'11.5vw'}
                  column
                  fieldLabel="Status"
                  fieldType="select"
                  fieldName="status"
                  selectData={AppointmentStatusEnum ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={selectedAppointmentStatus}
                  setRecord={setSelectedAppointmentStatus}
                />

                <MyInput
                  height={35}
                  width={'11.5vw'}
                  column
                  fieldLabel="Booking Mode"
                  fieldType="select"
                  fieldName="bookingMode"
                  selectData={BookingModeEnum ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={selectedBookingMode}
                  setRecord={setSelectedBookingMode}
                />
              </div>
            </Form>
          )
        }
      />
    </div>
  );
};

export default ScheduleFiltersPanel;
