
import React, { useMemo, useState } from 'react';
import './DialysisPatientRegistration.less';

import { Form, Message } from 'rsuite';

import MyButton from '@/components/MyButton/MyButton';
import MyDateHijriInput from '@/components/MyDateHijriInput/MyDateHijriInput';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';

import { useEnumOptions } from '@/services/enumsApi';
import {
  useGetNephrologyTreatmentPlanByIdQuery,
  useGetNephrologyTreatmentPlansByPatientQuery
} from '@/services/dialysis/nephrologyTreatmentPlanService';

import { useGetAllPractitionersQuery } from '@/services/setup/practitioner/PractitionerService';

import type { NephrologyTreatmentPlan } from '@/types/model-types-new';

type DialysisPatientRegistrationProps = {
  patientId?: number | string | null;
  selectedTreatmentPlanId?: number | null;
  onSelectTreatmentPlan?: (plan: NephrologyTreatmentPlan) => void;
  selectionDisabled?: boolean;
};

const readOnlyRecord = () => undefined;

const DialysisPatientRegistration = ({
  patientId,
  selectedTreatmentPlanId = null,
  onSelectTreatmentPlan,
  selectionDisabled = false
}: DialysisPatientRegistrationProps) => {
  const numericPatientId = Number(patientId);
  const canQuery = numericPatientId > 0;

  const [plansPage, setPlansPage] = useState(0);
  const [plansRowsPerPage, setPlansRowsPerPage] = useState(10);
  const [registrationCollapsed, setRegistrationCollapsed] = useState(false);

  const {
    data: plansPageData,
    isFetching: loadingPlans,
    isError: plansError
  } = useGetNephrologyTreatmentPlansByPatientQuery(
    {
      patientId: numericPatientId,
      page: plansPage,
      size: plansRowsPerPage,
      sort: 'createdDate,desc'
    },
    {
      skip: !canQuery
    }
  );

  const treatmentPlans = useMemo(
    () =>
      (plansPageData?.data ?? []).filter(
        plan => String(plan.patientId) === String(numericPatientId)
      ),
    [numericPatientId, plansPageData]
  );

  const plansTotalCount = plansPageData?.totalCount ?? 0;

  const {
    currentData: selectedPlanResponse,
    isFetching: loadingSelectedPlan,
    isError: selectedPlanError
  } = useGetNephrologyTreatmentPlanByIdQuery(
    Number(selectedTreatmentPlanId),
    {
      skip:
        !canQuery ||
        selectedTreatmentPlanId == null ||
        Number(selectedTreatmentPlanId) <= 0
    }
  );

  const selectedPlan =
    selectedPlanResponse &&
    String(selectedPlanResponse.patientId) === String(numericPatientId) &&
    Number(selectedPlanResponse.id) === Number(selectedTreatmentPlanId)
      ? selectedPlanResponse
      : undefined;

    const dialysisTreatmentTypeOptions = useEnumOptions('DialysisTreatmentType');
    const dialysisScheduleDayOptions = useEnumOptions('DialysisScheduleDay');
    const dialysisAccessTypeOptions = useEnumOptions('DialysisAccessType');
    const dialysisAccessSiteOptions = useEnumOptions('DialysisAccessSite');
    const dialysisRegistrationStatusOptions = useEnumOptions(
        'DialysisRegistrationStatus'
    );
    const durationTypeOptions = useEnumOptions('Unit');

  const {
    data: practitioners,
    isFetching: loadingPractitioners,
    isError: practitionerError
  } = useGetAllPractitionersQuery(
    {
      page: 0,
      size: 9999,
      sort: 'id,asc'
    },
    {
      skip: !selectedPlan?.treatmentType
    }
  );

  const physicians =
    practitioners?.data?.filter(
      practitioner => practitioner.jobRole === 'PHYSICIAN'
    ) ?? [];

  const record = useMemo(
    () => ({
      treatmentType: selectedPlan?.treatmentType ?? '',
      frequency: selectedPlan?.frequency ?? null,
      schedule: selectedPlan?.schedule ?? [],
            dialysisDuration: selectedPlan?.dialysisDuration ?? null,
            durationType: selectedPlan?.durationType ?? '',
            dryWeight: selectedPlan?.dryWeight ?? null,
      targetWeight: selectedPlan?.targetWeight ?? null,
      dialysisAccess: selectedPlan?.dialysisAccess ?? '',
      accessSite: selectedPlan?.accessSite ?? '',
      otherAccessSite: selectedPlan?.otherAccessSite ?? '',
      bloodFlowRate: selectedPlan?.bloodFlowRate ?? null,
      dialysateFlow: selectedPlan?.dialysateFlow ?? null,
      dialysate: selectedPlan?.dialysate ?? '',
      nephrologistId: selectedPlan?.nephrologistId ?? null,
      startDate: selectedPlan?.startDate ?? null,
      status: selectedPlan?.status ?? ''
    }),
    [selectedPlan]
  );

  const enumLabel = (
    options: Array<{
      label: string;
      value: string | number | boolean;
    }>,
    value?: string | null
  ) => {
    if (value == null || value === '') {
      return '-';
    }

    return (
      options.find(option => String(option.value) === String(value))
        ?.label || String(value)
    );
  };

  const displaySchedule = (schedule?: string[] | null) => {
    if (!schedule?.length) {
      return '-';
    }

    return schedule
      .map(day => enumLabel(dialysisScheduleDayOptions, day))
      .join(', ');
  };

  const displayDateValue = (value?: string | null) => {
    if (!value) {
      return '-';
    }

    return String(value).slice(0, 10);
  };

  const planColumns = [
    {
      key: 'select',
      title: <Translate>Select</Translate>,
      minWidth: 90,
      render: (row: NephrologyTreatmentPlan) => {
        const isSelected =
          Number(row.id) === Number(selectedTreatmentPlanId);

        return (
          <MyButton
            size="small"
            onClick={() => onSelectTreatmentPlan?.(row)}
            disabled={selectionDisabled || !onSelectTreatmentPlan}
          >
            {isSelected ? (
              <Translate>Selected</Translate>
            ) : (
              <Translate>Select</Translate>
            )}
          </MyButton>
        );
      }
    },
    {
      key: 'id',
      title: <Translate>Plan ID</Translate>,
      minWidth: 90,
      render: (row: NephrologyTreatmentPlan) => row.id ?? '-'
    },
    {
      key: 'treatmentType',
      title: <Translate>Treatment Type</Translate>,
      minWidth: 140,
      render: (row: NephrologyTreatmentPlan) =>
        enumLabel(dialysisTreatmentTypeOptions, row.treatmentType)
    },
    {
      key: 'frequency',
      title: <Translate>Frequency</Translate>,
      minWidth: 100,
      render: (row: NephrologyTreatmentPlan) =>
        row.frequency == null ? '-' : String(row.frequency)
    },
    {
      key: 'schedule',
      title: <Translate>Schedule</Translate>,
      minWidth: 160,
      render: (row: NephrologyTreatmentPlan) =>
        displaySchedule(row.schedule)
    },
    {
      key: 'startDate',
      title: <Translate>Start Date</Translate>,
      minWidth: 120,
      render: (row: NephrologyTreatmentPlan) =>
        displayDateValue(row.startDate)
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      minWidth: 120,
      render: (row: NephrologyTreatmentPlan) =>
        enumLabel(dialysisRegistrationStatusOptions, row.status)
    }
  ];

  const registrationDetails = (() => {
    if (!canQuery) {
      return (
        <Message type="info" className="dialysis-registration-state">
          <Translate>
            No dialysis registration is available for this patient.
          </Translate>
        </Message>
      );
    }

    if (selectedTreatmentPlanId == null) {
      return (
        <Message type="info" className="dialysis-registration-state">
          <Translate>
            Select a Treatment Plan to view registration details.
          </Translate>
        </Message>
      );
    }

    if ((loadingSelectedPlan || !selectedPlan) && !selectedPlanError) {
      return (
        <Message type="info" className="dialysis-registration-state">
          <Translate>Loading dialysis registration...</Translate>
        </Message>
      );
    }

    if (selectedPlanError || !selectedPlan) {
      return (
        <Message type="error" className="dialysis-registration-state">
          <Translate>Unable to load dialysis registration.</Translate>
        </Message>
      );
    }

    if (!selectedPlan.treatmentType) {
      return (
        <Message type="info" className="dialysis-registration-state">
          <Translate>
            This treatment plan is not a dialysis registration.
          </Translate>
        </Message>
      );
    }

    return (
      <Form fluid>
        <div className="dialysis-session-content">

          {/* Dialysis Schedule */}
          <div className="dialysis-session-group">
            <div className="dialysis-session-group-header">
              <span className="dialysis-session-group-title">
                <Translate>Dialysis Schedule</Translate>
              </span>
              <div className="dialysis-session-group-line" />
            </div>

            <div className="dialysis-session-row">
              <div className="dialysis-session-field">
                <MyInput
                  width="100%"
                  fieldName="treatmentType"
                  fieldLabel="Dialysis Type"
                  fieldType="select"
                  selectData={dialysisTreatmentTypeOptions}
                  selectDataLabel="label"
                  selectDataValue="value"
                  searchable={false}
                  record={record}
                  setRecord={readOnlyRecord}
                  disabled
                />
              </div>

              <div className="dialysis-session-field">
                <MyInput
                  width="100%"
                  fieldName="frequency"
                  fieldLabel="Frequency"
                  fieldType="number"
                  showZero
                  record={record}
                  setRecord={readOnlyRecord}
                  disabled
                />
              </div>

              <div className="dialysis-session-field">
                <MyInput
                  width="100%"
                  fieldName="schedule"
                  fieldLabel="Schedule"
                  fieldType="checkPicker"
                  selectData={dialysisScheduleDayOptions}
                  selectDataLabel="label"
                  selectDataValue="value"
                  searchable={false}
                  record={record}
                  setRecord={readOnlyRecord}
                  disabled
                />
              </div>

              <div className="dialysis-session-field">
                <MyInput
                  width="100%"
                  fieldName="dialysisDuration"
                  fieldLabel="Dialysis Duration"
                  fieldType="number"
                  allowDecimal
                  showZero
                  record={record}
                  setRecord={readOnlyRecord}
                  disabled
                />
              </div>

              <div className="dialysis-session-field">
                <MyInput
                  width="100%"
                  fieldName="durationType"
                  fieldLabel="Duration Type"
                  fieldType="select"
                  selectData={durationTypeOptions}
                  selectDataLabel="label"
                  selectDataValue="value"
                  searchable={false}
                  record={record}
                  setRecord={readOnlyRecord}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Weight & Access */}
          <div className="dialysis-session-group">
            <div className="dialysis-session-group-header">
              <span className="dialysis-session-group-title">
                <Translate>Weight & Access</Translate>
              </span>
              <div className="dialysis-session-group-line" />
            </div>

            <div className="dialysis-session-row">
              <div className="dialysis-session-field dialysis-session-field--addon">
                <MyInput
                  width="100%"
                  fieldName="dryWeight"
                  fieldLabel="Dry Weight"
                  fieldType="number"
                  allowDecimal
                  showZero
                  rightAddon="kg"
                  rightAddonwidth="auto"
                  record={record}
                  setRecord={readOnlyRecord}
                  disabled
                />
              </div>

              <div className="dialysis-session-field dialysis-session-field--addon">
                <MyInput
                  width="100%"
                  fieldName="targetWeight"
                  fieldLabel="Target Weight"
                  fieldType="number"
                  allowDecimal
                  showZero
                  rightAddon="kg"
                  rightAddonwidth="auto"
                  record={record}
                  setRecord={readOnlyRecord}
                  disabled
                />
              </div>

              <div className="dialysis-session-field">
                <MyInput
                  width="100%"
                  fieldName="dialysisAccess"
                  fieldLabel="Dialysis Access"
                  fieldType="select"
                  selectData={dialysisAccessTypeOptions}
                  selectDataLabel="label"
                  selectDataValue="value"
                  searchable={false}
                  record={record}
                  setRecord={readOnlyRecord}
                  disabled
                />
              </div>

              <div className="dialysis-session-field">
                <MyInput
                  width="100%"
                  fieldName="accessSite"
                  fieldLabel="Access Site"
                  fieldType="select"
                  selectData={dialysisAccessSiteOptions}
                  selectDataLabel="label"
                  selectDataValue="value"
                  searchable={false}
                  record={record}
                  setRecord={readOnlyRecord}
                  disabled
                />
              </div>

              {record.accessSite === 'OTHER' && (
                <div className="dialysis-session-field">
                  <MyInput
                    width="100%"
                    fieldName="otherAccessSite"
                    fieldLabel="Other Access Site"
                    fieldType="text"
                    record={record}
                    setRecord={readOnlyRecord}
                    disabled
                  />
                </div>
              )}
            </div>
          </div>

          {/* Dialysis Prescription */}
          <div className="dialysis-session-group">
            <div className="dialysis-session-group-header">
              <span className="dialysis-session-group-title">
                <Translate>Dialysis Prescription</Translate>
              </span>
              <div className="dialysis-session-group-line" />
            </div>

            <div className="dialysis-session-row">
              <div className="dialysis-session-field dialysis-session-field--addon">
                <MyInput
                  width="100%"
                  fieldName="bloodFlowRate"
                  fieldLabel="Blood Flow Rate"
                  fieldType="number"
                  allowDecimal
                  showZero
                  rightAddon="mL/min"
                  rightAddonwidth="auto"
                  record={record}
                  setRecord={readOnlyRecord}
                  disabled
                />
              </div>

              <div className="dialysis-session-field dialysis-session-field--addon">
                <MyInput
                  width="100%"
                  fieldName="dialysateFlow"
                  fieldLabel="Dialysate Flow"
                  fieldType="number"
                  allowDecimal
                  showZero
                  rightAddon="mL/min"
                  rightAddonwidth="auto"
                  record={record}
                  setRecord={readOnlyRecord}
                  disabled
                />
              </div>

              <div className="dialysis-session-field">
                <MyInput
                  width="100%"
                  fieldName="dialysate"
                  fieldLabel="Dialysate"
                  fieldType="text"
                  record={record}
                  setRecord={readOnlyRecord}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Clinical Assignment */}
          <div className="dialysis-session-group">
            <div className="dialysis-session-group-header">
              <span className="dialysis-session-group-title">
                <Translate>Clinical Assignment</Translate>
              </span>
              <div className="dialysis-session-group-line" />
            </div>

            <div className="dialysis-session-row">
              <div className="dialysis-session-field">
                <MyInput
                  width="100%"
                  fieldLabel="Nephrologist"
                  fieldName="nephrologistId"
                  fieldType="select"
                  selectData={physicians}
                  selectDataLabel={['firstName', 'lastName']}
                  selectDataValue="id"
                  searchable
                  loading={loadingPractitioners}
                  record={record}
                  setRecord={readOnlyRecord}
                  disabled
                />

                {practitionerError && (
                  <Message type="error">
                    <Translate>Unable to load doctors.</Translate>
                  </Message>
                )}
              </div>

              <div className="dialysis-session-field">
                <MyDateHijriInput
                  width="100%"
                  fieldLabel="Start Date"
                  fieldName="startDate"
                  record={record}
                  setRecord={readOnlyRecord}
                  disabled
                />
              </div>

              <div className="dialysis-session-field">
                <MyInput
                  width="100%"
                  fieldLabel="Status"
                  fieldName="status"
                  fieldType="select"
                  selectData={dialysisRegistrationStatusOptions}
                  selectDataLabel="label"
                  selectDataValue="value"
                  searchable={false}
                  record={record}
                  setRecord={readOnlyRecord}
                  disabled
                />
              </div>
            </div>
          </div>

        </div>
      </Form>
    );
  })();

  return (
    <div
      className={`dialysis-registration-block${
        registrationCollapsed ? ' is-collapsed' : ''
      }`}
    >
      <button
        type="button"
        className="dialysis-registration-block__header"
        aria-expanded={!registrationCollapsed}
        aria-controls="dialysis-patient-registration-body"
        onClick={() =>
          setRegistrationCollapsed(collapsed => !collapsed)
        }
      >
        <span className="dialysis-session-section-heading">
          <Translate>Dialysis Patient Registration</Translate>

          <span className="dialysis-session-section-description">
            <Translate>
              Long-term dialysis treatment profile
            </Translate>
          </span>
        </span>

        <span
          className="dialysis-registration-block__chevron"
          aria-hidden="true"
        />
      </button>

      <div
        id="dialysis-patient-registration-body"
        className="dialysis-registration-block__body"
        hidden={registrationCollapsed}
      >
        {/* Selected Plan Overview */}
        <div className="dialysis-registration-overview">
          <div className="dialysis-registration-overview__heading">
            <span className="dialysis-registration-eyebrow">
              <Translate>Selected Treatment Plan</Translate>
            </span>

            <strong>
              {selectedPlan?.id != null ? (
                `#${selectedPlan.id}`
              ) : (
                <Translate>No Plan Selected</Translate>
              )}
            </strong>
          </div>

          <div className="dialysis-registration-overview__facts">
            <div>
              <span>
                <Translate>Treatment Type</Translate>
              </span>
              <strong>
                {enumLabel(
                  dialysisTreatmentTypeOptions,
                  selectedPlan?.treatmentType
                )}
              </strong>
            </div>

            <div>
              <span>
                <Translate>Schedule</Translate>
              </span>
              <strong>
                {displaySchedule(selectedPlan?.schedule)}
              </strong>
            </div>

            <div>
              <span>
                <Translate>Status</Translate>
              </span>
              <strong>
                {enumLabel(
                  dialysisRegistrationStatusOptions,
                  selectedPlan?.status
                )}
              </strong>
            </div>
          </div>
        </div>

        {/* Registration Inputs */}
        <div className="dialysis-registration-details">
          <div className="dialysis-registration-section-title">
            <div>
              <strong>
                <Translate>Registration Details</Translate>
              </strong>
              <small>
                <Translate>
                  Dialysis treatment configuration and clinical information
                </Translate>
              </small>
            </div>

            <span className="dialysis-registration-readonly">
              <Translate>Read Only</Translate>
            </span>
          </div>

          {registrationDetails}
        </div>

        {/* Treatment Plans Table - At Bottom */}
        <div className="dialysis-registration-plans dialysis-registration-panel">
          <div className="dialysis-session-group-header">
            <span className="dialysis-session-group-title">
              <Translate>Treatment Plans</Translate>
            </span>
            <div className="dialysis-session-group-line" />
          </div>

          {!canQuery ? (
            <Message
              type="info"
              className="dialysis-registration-state"
            >
              <Translate>
                Open Dialysis Session from a patient encounter.
              </Translate>
            </Message>
          ) : plansError ? (
            <Message
              type="error"
              className="dialysis-registration-state"
            >
              <Translate>
                Unable to load treatment plans.
              </Translate>
            </Message>
          ) : (
            <div className="dialysis-registration-table">
              <MyTable
                data={treatmentPlans}
                columns={planColumns}
                loading={loadingPlans}
                height={260}
                page={plansPage}
                rowsPerPage={plansRowsPerPage}
                totalCount={plansTotalCount}
                onPageChange={(_event, newPage) =>
                  setPlansPage(newPage)
                }
                onRowsPerPageChange={event => {
                  setPlansRowsPerPage(
                    Number(event.target.value)
                  );
                  setPlansPage(0);
                }}
                rowClassName={(row: any) =>
                  Number(row?.id) ===
                  Number(selectedTreatmentPlanId)
                    ? 'dialysis-registration-row--selected'
                    : ''
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DialysisPatientRegistration;
