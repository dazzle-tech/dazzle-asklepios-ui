import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  Checkbox,
  Form,
  Message,
  Panel,
  Tag,
  Toggle
} from 'rsuite';

import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import {
  ColumnConfig
} from '@/components/MyTable/MyTable';
import Translate from '@/components/Translate';

import {
  useAppDispatch,
  useAppSelector
} from '@/hooks';

import {
  useEnumOptions
} from '@/services/enumsApi';

import {
  useGetFacilityByIdQuery
} from '@/services/security/facilityService';

import {
  useLazyGetServicesByDepartmentQuery
} from '@/services/setup/serviceService';

import {
  useGetInsurancesByPatientQuery
} from '@/services/patients/patientInsurancesService';

import {
  useCreateAdvancePaymentMutation,
  useGetEncounterBillingSummaryQuery,
  useGetWaseelCoverageQuery,
  usePrepareDefaultServicesMutation,
  usePreviewDefaultServicesPricingMutation
} from '@/services/billing/billingTransactionService';

import {
  newCreateAdvancePaymentRequest,
  newEncounterBillingSummary,
  newPatientInsurance
} from '@/types/model-types-constructor-new';

import type {
  BillingCoverageType,
  CreateAdvancePaymentRequest,
  EncounterBillingItemSummary,
  EncounterBillingSummary,
  PatientInsurance,
  PrepareDefaultServicesRequest,
  WaseelBenefitDetail,
  WaseelCoverageDetails
} from '@/types/model-types-new';

import {
  notify
} from '@/utils/uiReducerActions';

import './style.less';

import {
  buildPreviewChargeLines,
  computePreviewBillingTotals,
  filterPayableServiceRows,
  formatBillingItemType,
  getUnpaidSummaryItems,
  getLineDueAmount,
  hasCalculatedSummary,
  isDefaultServicePayable,
  isEncounterFullyPaid,
  resolveBillingItemName,
  resolvePatientOutstandingAmount,
  type PaymentReceiptData
} from './paymentPreviewUtils';
import { formatEnumString } from '@/utils';
import PaymentReceiptModal from './PaymentReceiptModal';

type DefaultServiceRow = {
  id: number;
  serviceId: number;
  serviceType: string;
  serviceName: string;
  selected: boolean;
  isExempted: boolean;
  quantity: number;
  sequence: number;
  setupPrice?: number | null;
  calculatedPrice?: number | null;
  priceSource?: string | null;
  priceListItemCode?: string | null;
  patientShare?: number | null;
  insuranceShare?: number | null;
  previewGrossAmount?: number | null;
  previewDiscountAmount?: number | null;
  previewTaxAmount?: number | null;
  previewNetAmount?: number | null;
};

type BillingFormState = {
  coverageType: BillingCoverageType;
  patientInsuranceId: number | string | null;

  paymentAmount: number;
  paymentMethodId: number | null;
  paymentMethodCode: string;

  authorizationCode: string;
  processorReference: string;
  cardLastFour: string;
  bankReference: string;
  cashRegisterId: number | null;
  notes: string;
  payZeroNow: boolean;
};

export type PatientPaymentInfoHandle = {
  confirm: () => Promise<boolean>;
  clear: () => void;
  validate: () => boolean;
};

type PatientPaymentInfoProps = {
  localPatient?: any;
  localEncounter?: any;
  isReadOnly?: boolean;
  showInternalButtons?: boolean;

  payment?: any;
  setPayment?: (value: any) => void;

  patientInsurance?: PatientInsurance;
  setPatientInsurance?: (
    value:
      PatientInsurance
  ) => void;

  onPaymentSaved?: () =>
    void | Promise<void>;

  onReceiptReady?: (
    receipt: PaymentReceiptData
  ) => void;

  onReceiptClosed?: () => void;

  onPaymentDeferred?: () => void;

  onNothingToPay?: () => void;

  onViewOnlyChange?: (
    viewOnly: boolean
  ) => void;
};

const initialFormState:
BillingFormState = {
  coverageType:
    'SELF_PAY',

  patientInsuranceId:
    null,

  paymentAmount:
    0,

  paymentMethodId:
    null,

  paymentMethodCode:
    '',

  authorizationCode:
    '',

  processorReference:
    '',

  cardLastFour:
    '',

  bankReference:
    '',

  cashRegisterId:
    null,

  notes:
    '',

  payZeroNow:
    false
};

const makeRequestId =
  (prefix: string) =>
    `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

const resolvePaymentCategory =
  (
    paymentMethodCode: string
  ): string => {
    switch (
      paymentMethodCode
    ) {
      case 'CASH':
        return 'CASH';
      case 'CREDIT_DEBIT_CARD':
        return 'CARD';
      case 'CHEQUE':
        return 'CHEQUE';
      case 'BANK_TRANSFER':
        return 'BANK_TRANSFER';
      case 'DEDUCT_FROM_FREE_BALANCE':
        return 'WALLET';
      case 'INSURANCE_COVERAGE':
        return 'INSURANCE';
      default:
        return 'OTHER';
    }
  };

const formatMoney =
  (
    amount: number | null | undefined,
    currency?: string | null
  ) => {
    const value =
      Number.isFinite(
        Number(amount)
      )
        ? Number(amount)
        : 0;

    const formatted =
      value.toLocaleString(
        undefined,
        {
          minimumFractionDigits:
            2,
          maximumFractionDigits:
            2
        }
      );

    return currency
      ? `${formatted} ${currency}`
      : formatted;
  };

const computeDiscountFactor = (
  row: EncounterBillingItemSummary
) => {
  const quantity = Number(row.quantity ?? 0);
  const unitPrice = Number(row.unitPrice ?? 0);
  const baseAmount = quantity * unitPrice;

  if (baseAmount <= 0) {
    return 1;
  }

  const grossAmount = Number(row.grossAmount ?? 0);
  const discountAmount = Number(row.discountAmount ?? 0);
  const afterDiscount = grossAmount - discountAmount;

  return Number(
    (afterDiscount / baseAmount).toFixed(4)
  );
};

const toNumber =
  (
    value: unknown,
    defaultValue = 0
  ) => {
    const parsed =
      Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : defaultValue;
  };

const extractResponseList =
  (response: any): any[] => {
    if (
      Array.isArray(response)
    ) {
      return response;
    }

    if (
      Array.isArray(
        response?.data
      )
    ) {
      return response.data;
    }

    if (
      Array.isArray(
        response?.data?.data
      )
    ) {
      return response.data.data;
    }

    if (
      Array.isArray(
        response?.object
      )
    ) {
      return response.object;
    }

    return [];
  };

const normalizeError =
  (error: any) => {
    const data =
      error?.data ??
      error ??
      {};

    const traceId =
      data?.traceId ??
      data?.requestId ??
      data?.correlationId;

    const message =
      data?.detail ??
      data?.message ??
      data?.title ??
      error?.error ??
      'Unexpected billing error';

    return traceId
      ? `${message}\nTrace ID: ${traceId}`
      : message;
  };

type MetricVariant =
  | 'default'
  | 'highlight'
  | 'success'
  | 'muted';

const SummaryMetric = ({
  label,
  value,
  variant = 'default',
  mono = false
}: {
  label: string;
  value: string;
  variant?: MetricVariant;
  mono?: boolean;
}) => (
  <div
    className={`payment-info__summary-card${
      variant === 'highlight'
        ? ' payment-info__summary-card--accent'
        : ''
    }`}
  >
    <span className="payment-info__summary-label">
      {label}
    </span>
    <span
      className={[
        'payment-info__summary-value',
        variant !== 'default'
          ? `payment-info__summary-value--${variant}`
          : '',
        mono
          ? 'payment-info__summary-value--mono'
          : ''
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {value}
    </span>
  </div>
);

const BillingMetric = ({
  label,
  value,
  variant = 'default'
}: {
  label: string;
  value: string;
  variant?: MetricVariant;
}) => (
  <div className="payment-info__metric-row">
    <span className="payment-info__metric-label">
      {label}
    </span>
    <span
      className={[
        'payment-info__metric-value',
        variant !== 'default'
          ? `payment-info__metric-value--${variant}`
          : ''
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {value}
    </span>
  </div>
);

type StepperState =
  | 'pending'
  | 'active'
  | 'done';

const WorkflowStep = ({
  index,
  label,
  state
}: {
  index: number;
  label: string;
  state: StepperState;
}) => (
  <div
    className={`payment-info__stepper-step payment-info__stepper-step--${state}`}
  >
    <span className="payment-info__stepper-index">
      {state === 'done' ? '✓' : index}
    </span>
    <span className="payment-info__stepper-label">
      {label}
    </span>
  </div>
);

const PatientPaymentInfo =
  forwardRef<
    PatientPaymentInfoHandle,
    PatientPaymentInfoProps
  >(
    (
      {
        localPatient,
        localEncounter,
        isReadOnly = false,
        showInternalButtons = true,
        payment,
        setPayment,
        patientInsurance,
        setPatientInsurance,
        onPaymentSaved,
        onReceiptReady,
        onReceiptClosed,
        onPaymentDeferred,
        onNothingToPay,
        onViewOnlyChange
      },
      ref
    ) => {
      const dispatch =
        useAppDispatch();

      const fullyPaidNotifiedRef =
        useRef(false);

      const authSlice =
        useAppSelector(
          state =>
            state.auth
        );

      const patientId =
        toNumber(
          localPatient?.id ??
            localPatient?.key
        );

      const encounterId =
        toNumber(
          localEncounter?.id
        );

      const facilityId =
        toNumber(
          localEncounter?.facilityId ??
            localEncounter?.facility?.id ??
            authSlice?.tenant
              ?.selectedFacility?.id
        );

      const departmentId =
        toNumber(
          localEncounter?.departmentId ??
            localEncounter?.department?.id ??
            localEncounter?.clinicDepartmentId
        );

      const {
        data:
          facilityResponse
      } =
        useGetFacilityByIdQuery(
          facilityId,
          {
            skip:
              !facilityId
          }
        );

      const facilityCurrency =
        facilityResponse?.defaultCurrency ??
        facilityResponse?.data
          ?.defaultCurrency ??
        'SAR';

      const [
        formState,
        setFormState
      ] =
        useState<BillingFormState>(
          initialFormState
        );

      const [
        defaultServiceRows,
        setDefaultServiceRows
      ] =
        useState<
          DefaultServiceRow[]
        >([]);

      const [
        preparedPspIds,
        setPreparedPspIds
      ] =
        useState<number[]>([]);

      const [
        validationResult,
        setValidationResult
      ] =
        useState<any>({});

      const [
        insuranceSearchKeyword,
        setInsuranceSearchKeyword
      ] =
        useState('');

      const [
        insurancePage,
        setInsurancePage
      ] =
        useState(0);

      const [
        page,
        setPage
      ] =
        useState(0);

      const [
        rowsPerPage,
        setRowsPerPage
      ] =
        useState(5);

      const [
        lockAfterConfirm,
        setLockAfterConfirm
      ] =
        useState(false);

      const [
        lastPaymentResult,
        setLastPaymentResult
      ] =
        useState<any>(null);

      const [
        prepareResultMessage,
        setPrepareResultMessage
      ] =
        useState<string | null>(
          null
        );

      const [
        receiptPreview,
        setReceiptPreview
      ] =
        useState<PaymentReceiptData | null>(
          null
        );

      const [
        receiptModalOpen,
        setReceiptModalOpen
      ] =
        useState(false);

      const [
        summaryRefreshKey,
        setSummaryRefreshKey
      ] =
        useState(0);

      const {
        data:
          summaryResponse,
        isFetching:
          loadingSummary,
        refetch:
          refetchSummary
      } =
        useGetEncounterBillingSummaryQuery(
          {
            encounterId,
            refreshKey:
              summaryRefreshKey
          },
          {
            skip:
              !encounterId
          }
        );

      const summary:
      EncounterBillingSummary =
        summaryResponse ??
        {
          ...newEncounterBillingSummary,
          patientId,
          encounterId
        };

      const encounterFullyPaid =
        isEncounterFullyPaid(
          summary
        );

      const unpaidSummaryItemsEarly =
        getUnpaidSummaryItems(
          summary
        );

      const {
        data: waseelCoverage,
        isFetching:
          loadingWaseelCoverage,
        isError:
          waseelCoverageError
      } =
        useGetWaseelCoverageQuery(
          {
            patientId,
            patientInsuranceId:
              formState.patientInsuranceId
          },
          {
            skip:
              !patientId ||
              formState.coverageType !==
                'INSURANCE' ||
              !formState.patientInsuranceId
          }
        );

      const [
        prepareDefaultServices,
        {
          isLoading:
            preparingServices
        }
      ] =
        usePrepareDefaultServicesMutation();

      const [
        previewDefaultServicesPricing
      ] =
        usePreviewDefaultServicesPricingMutation();

      const pricingPreviewTimerRef =
        useRef<
          ReturnType<
            typeof setTimeout
          > | null
        >(null);

      const [
        createAdvancePayment,
        {
          isLoading:
            creatingPayment
        }
      ] =
        useCreateAdvancePaymentMutation();

      const [
        triggerGetServices,
        servicesResponse
      ] =
        useLazyGetServicesByDepartmentQuery();

      const insuranceResponse =
        useGetInsurancesByPatientQuery(
          {
            patientId,
            page:
              0,
            size:
              200,
            sort:
              'id,desc'
          },
          {
            skip:
              !patientId
          }
        );

      const paymentMethods =
        useEnumOptions(
          'PaymentMethods',
          {
            exclude: [
              'INSURANCE_COVERAGE'
            ]
          }
        ) ?? [];

      const isInsurance =
        formState.coverageType ===
        'INSURANCE';

      const showCardFields =
        formState.paymentMethodCode ===
        'CREDIT_DEBIT_CARD';

      const showBankReference =
        formState.paymentMethodCode ===
          'BANK_TRANSFER' ||
        formState.paymentMethodCode ===
          'CHEQUE';

      const isBusy =
        preparingServices ||
        creatingPayment;

      const servicesArePrepared =
        preparedPspIds.length >
          0 ||
        (summary.items ?? [])
          .length >
          0;

      const isViewOnlyMode =
        Boolean(
          isReadOnly ||
            encounterFullyPaid
        );

      const isLocked =
        Boolean(
          isViewOnlyMode ||
            lockAfterConfirm ||
            isBusy
        );

      const areServicesLocked =
        Boolean(
          isLocked ||
            servicesArePrepared
        );

      const billedSourceIds =
        useMemo(
          () =>
            new Set(
              (summary.items ?? [])
                .map(
                  item =>
                    item.sourceId
                )
                .filter(
                  (
                    id
                  ): id is number =>
                    id != null
                )
            ),
          [
            summary.items
          ]
        );

      const activeCurrency =
        summary.currency ??
        facilityCurrency;

      const patientInsurances:
      PatientInsurance[] =
        useMemo(
          () =>
            extractResponseList(
              insuranceResponse.data
            ),
          [
            insuranceResponse.data
          ]
        );

      const filteredInsurances =
        useMemo(() => {
          const keyword =
            insuranceSearchKeyword
              .trim()
              .toLowerCase();

          if (
            !keyword
          ) {
            return patientInsurances;
          }

          return patientInsurances.filter(
            (insurance: any) => {
              const text = [
                insurance?.payerName,
                insurance?.payerNphiesId,
                insurance?.memberCardId,
                insurance?.policyNumber,
                insurance?.policyClassName,
                insurance?.groupNumber
              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

              return text.includes(
                keyword
              );
            }
          );
        }, [
          patientInsurances,
          insuranceSearchKeyword
        ]);

      const insurancePageSize =
        20;

      const insuranceSelectData =
        useMemo(
          () =>
            filteredInsurances
              .slice(
                0,
                (insurancePage + 1) *
                  insurancePageSize
              )
              .map(
                (
                  insurance: any
                ) => {
                  /*
                   * MyInput compares the selected value with selectDataValue
                   * using the value type. The API may return id as a string,
                   * while the form stores it as a number. Normalize both sides
                   * so a selected option does not disappear after re-render.
                   */
                  const insuranceId =
                    insurance?.id ??
                    insurance?.key ??
                    insurance?.patientInsuranceId;

                  return {
                    ...insurance,
                    id: insuranceId,

                    label:
                      [
                        insurance?.payerName ||
                          insurance?.payerNphiesId ||
                          'Insurance',

                        insurance?.policyClassName,

                        insurance?.memberCardId
                      ]
                        .filter(Boolean)
                        .join(' • ')
                  };
                }
              ),
          [
            filteredInsurances,
            insurancePage
          ]
        );

      const hasMoreInsurances =
        insuranceSelectData.length <
        filteredInsurances.length;

      /*
       * Keep MyInput usage simple, exactly like the working
       * AddPrefferdHealthProfessionalModal example.
       *
       * MyInput only updates formState. Related derived values are
       * synchronized separately here and never inside setRecord.
       */
      useEffect(() => {
        const selected =
          patientInsurances.find(
            (insurance: any) =>
              String(
                insurance?.id ??
                  insurance?.key ??
                  insurance?.patientInsuranceId
              ) ===
              String(
                formState.patientInsuranceId ??
                  ''
              )
          ) ?? null;

        if (setPatientInsurance) {
          setPatientInsurance(
            selected
              ? selected
              : newPatientInsurance
          );
        }
      }, [
        formState.patientInsuranceId,
        patientInsurances,
        setPatientInsurance
      ]);

      useEffect(() => {
        const selected =
          paymentMethods.find(
            (option: any) =>
              String(option?.value) ===
              String(
                formState.paymentMethodCode ??
                  ''
              )
          );

        const nextPaymentMethodId =
          selected?.id ??
          selected?.key ??
          selected?.valueId ??
          selected?.paymentMethodId ??
          null;

        setFormState(previous => {
          if (
            previous.paymentMethodId ===
            nextPaymentMethodId
          ) {
            return previous;
          }

          return {
            ...previous,
            paymentMethodId:
              nextPaymentMethodId
          };
        });
      }, [
        formState.paymentMethodCode,
        paymentMethods
      ]);

      useEffect(() => {
        setInsurancePage(
          0
        );
      }, [
        insuranceSearchKeyword
      ]);

      useEffect(() => {
        if (
          !departmentId
        ) {
          setDefaultServiceRows(
            []
          );
          return;
        }

        triggerGetServices(
          {
            sourceId:
              departmentId,
            page:
              0,
            size:
              200,
            sort:
              'id,asc'
          },
          true
        );
      }, [
        departmentId,
        triggerGetServices
      ]);

      useEffect(() => {
        const list =
          extractResponseList(
            servicesResponse.data
          );

        const mapped:
        DefaultServiceRow[] =
          list.map(
            (
              service: any,
              index: number
            ) => ({
              id:
                toNumber(
                  service?.id ??
                    service?.serviceId
                ),

              serviceId:
                toNumber(
                  service?.id ??
                    service?.serviceId
                ),

              serviceType:
                String(
                  service?.serviceType ??
                    service?.type ??
                    service?.category ??
                    'SERVICE'
                ),

              serviceName:
                String(
                  service?.name ??
                    service?.serviceName ??
                    ''
                ),

              selected:
                service?.selected == null
                  ? true
                  : Boolean(
                      service.selected
                    ),

              isExempted:
                Boolean(
                  service?.isExempted
                ),

              quantity:
                1,

              sequence:
                index + 1,

              setupPrice:
                toNumber(
                  service?.price
                ) ?? null,

              calculatedPrice:
                null,

              priceSource:
                null,

              priceListItemCode:
                null,

              patientShare:
                null,

              insuranceShare:
                null
            })
          );

        setDefaultServiceRows(
          previous => {
            const oldMap =
              new Map(
                previous.map(
                  row => [
                    row.serviceId,
                    row
                  ]
                )
              );

            return mapped.map(
              row => {
                const old =
                  oldMap.get(
                    row.serviceId
                  );

                return old
                  ? {
                      ...row,
                      selected:
                        old.selected,
                      isExempted:
                        old.isExempted,
                      quantity:
                        old.quantity,
                      sequence:
                        old.sequence
                    }
                  : row;
              }
            );
          }
        );
      }, [
        servicesResponse.data
      ]);

      useEffect(() => {
        const summaryPspIds =
          (summary.items ?? [])
            .map(
              item =>
                item.patientServiceProductId
            )
            .filter(
              (
                id
              ): id is number =>
                id != null
            );

        if (
          summaryPspIds.length >
          0
        ) {
          setPreparedPspIds(
            summaryPspIds
          );
        }
      }, [
        summary.items
      ]);

      useEffect(() => {
        if (
          !summary?.items?.length
        ) {
          return;
        }

        const billedBySourceId =
          new Map(
            summary.items
              .filter(
                item =>
                  item.sourceId !=
                  null
              )
              .map(
                item => [
                  item.sourceId as number,
                  item
                ]
              )
          );

        setDefaultServiceRows(
          previous =>
            previous.map(
              row => {
                const billed =
                  billedBySourceId.get(
                    row.serviceId
                  );

                if (
                  !billed
                ) {
                  return row;
                }

                return {
                  ...row,
                  setupPrice:
                    billed.setupUnitPrice ??
                    row.setupPrice,
                  calculatedPrice:
                    billed.netAmount ??
                    null,
                  priceSource:
                    billed.priceSource ??
                    null,
                  priceListItemCode:
                    billed.priceListItemCode ??
                    null,
                  patientShare:
                    billed.patientResponsibilityAmount ??
                    null,
                  insuranceShare:
                    billed.insuranceResponsibilityAmount ??
                    null
                };
              }
            )
        );
      }, [
        summary.items
      ]);

      useEffect(() => {
        if (
          !(summary.items ?? []).length
        ) {
          return;
        }

        setDefaultServiceRows(
          previous =>
            previous.map(
              row => {
                if (
                  !isDefaultServicePayable(
                    row.serviceId,
                    summary
                  )
                ) {
                  return {
                    ...row,
                    selected: false
                  };
                }

                return row;
              }
            )
        );
      }, [
        summary.items
      ]);

      const updateForm =
        (
          partial:
            Partial<BillingFormState>
        ) => {
          setFormState(
            previous => ({
              ...previous,
              ...partial
            })
          );
        };

      const selectedRows =
        useMemo(
          () =>
            defaultServiceRows
              .filter(
                row =>
                  row.selected
              )
              .sort(
                (
                  first,
                  second
                ) =>
                  first.sequence -
                  second.sequence
              ),
          [
            defaultServiceRows
          ]
        );

      const payableSelectedRows =
        useMemo(
          () =>
            filterPayableServiceRows(
              selectedRows,
              summary
            ),
          [
            selectedRows,
            summary
          ]
        );

      useEffect(() => {
        if (
          pricingPreviewTimerRef.current
        ) {
          clearTimeout(
            pricingPreviewTimerRef.current
          );
        }

        if (
          !encounterId ||
          !patientId ||
          !facilityId ||
          hasCalculatedSummary(
            summary
          )
        ) {
          return;
        }

        if (
          isInsurance &&
          !formState.patientInsuranceId
        ) {
          setDefaultServiceRows(
            previous =>
              previous.map(
                row => ({
                  ...row,
                  calculatedPrice:
                    null,
                  priceSource:
                    null,
                  priceListItemCode:
                    null,
                  previewGrossAmount:
                    null,
                  previewDiscountAmount:
                    null,
                  previewTaxAmount:
                    null,
                  previewNetAmount:
                    null
                })
              )
          );
          return;
        }

        const rowsToPrice =
          payableSelectedRows.length >
          0
            ? payableSelectedRows
            : selectedRows;

        if (
          rowsToPrice.length ===
          0
        ) {
          return;
        }

        pricingPreviewTimerRef.current =
          setTimeout(() => {
            void (async () => {
              try {
                const result =
                  await previewDefaultServicesPricing(
                    {
                      encounterId,
                      body: {
                        patientId,
                        facilityId,
                        currency:
                          (summary.currency ??
                            facilityCurrency) as PrepareDefaultServicesRequest['currency'],
                        coverageType:
                          formState.coverageType,
                        patientInsuranceId:
                          isInsurance
                            ? toNumber(
                                formState.patientInsuranceId
                              )
                            : null,
                        items:
                          rowsToPrice.map(
                            (
                              row,
                              index
                            ) => ({
                              serviceId:
                                row.serviceId,
                              quantity:
                                row.quantity,
                              sequence:
                                index +
                                1,
                              isExempted:
                                row.isExempted
                            })
                          )
                      }
                    }
                  ).unwrap();

                const pricedByServiceId =
                  new Map(
                    result.items.map(
                      item => [
                        item.serviceId,
                        item
                      ]
                    )
                  );

                setDefaultServiceRows(
                  previous =>
                    previous.map(
                      row => {
                        const priced =
                          pricedByServiceId.get(
                            row.serviceId
                          );

                        if (
                          !priced
                        ) {
                          return {
                            ...row,
                            calculatedPrice:
                              null,
                            priceSource:
                              null,
                            priceListItemCode:
                              null,
                            previewGrossAmount:
                              null,
                            previewDiscountAmount:
                              null,
                            previewTaxAmount:
                              null,
                            previewNetAmount:
                              null
                          };
                        }

                        return {
                          ...row,
                          setupPrice:
                            priced.setupUnitPrice ??
                            row.setupPrice,
                          calculatedPrice:
                            priced.unitPrice,
                          priceSource:
                            priced.priceSource,
                          priceListItemCode:
                            priced.priceListItemCode,
                          previewGrossAmount:
                            priced.grossAmount,
                          previewDiscountAmount:
                            priced.discountAmount,
                          previewTaxAmount:
                            priced.taxAmount,
                          previewNetAmount:
                            priced.netAmount
                        };
                      }
                    )
                );
              } catch {
                // Keep setup prices when price-list preview is unavailable.
              }
            })();
          }, 400);

        return () => {
          if (
            pricingPreviewTimerRef.current
          ) {
            clearTimeout(
              pricingPreviewTimerRef.current
            );
          }
        };
      }, [
        encounterId,
        patientId,
        facilityId,
        summary,
        facilityCurrency,
        formState.coverageType,
        formState.patientInsuranceId,
        isInsurance,
        payableSelectedRows,
        selectedRows,
        previewDefaultServicesPricing
      ]);

      const unpaidSummaryItems =
        unpaidSummaryItemsEarly;

      const previewTotals =
        useMemo(
          () =>
            computePreviewBillingTotals(
              summary,
              payableSelectedRows.length >
                0
                ? payableSelectedRows
                : selectedRows,
              isInsurance
            ),
          [
            summary,
            payableSelectedRows,
            selectedRows,
            isInsurance
          ]
        );

      const displayChargeLines =
        useMemo(
          () =>
            buildPreviewChargeLines(
              summary,
              payableSelectedRows.length >
                0
                ? payableSelectedRows
                : selectedRows,
              activeCurrency,
              isInsurance
            ),
          [
            summary,
            payableSelectedRows,
            selectedRows,
            activeCurrency,
            isInsurance
          ]
        );

      const resolvedOutstanding =
        resolvePatientOutstandingAmount(
          summary
        );

      const hasPayableBalance =
        resolvedOutstanding > 0 ||
        previewTotals.patientOutstandingAmount >
          0;

      const paymentMethodSelected =
        Boolean(
          formState.paymentMethodCode
        );

      const paymentFieldsDisabled =
        isLocked ||
        !hasPayableBalance ||
        formState.payZeroNow;

      useEffect(() => {
        fullyPaidNotifiedRef.current =
          false;
      }, [
        encounterId
      ]);

      useEffect(() => {
        if (
          onViewOnlyChange
        ) {
          onViewOnlyChange(
            isViewOnlyMode
          );
        }
      }, [
        isViewOnlyMode,
        onViewOnlyChange
      ]);

      useEffect(() => {
        if (
          loadingSummary ||
          !encounterId ||
          fullyPaidNotifiedRef.current ||
          !encounterFullyPaid
        ) {
          return;
        }

        fullyPaidNotifiedRef.current =
          true;

        dispatch(
          notify({
            msg:
              'This encounter is already paid. Payment details are shown in read-only mode.',
            sev: 'info'
          })
        );
      }, [
        loadingSummary,
        encounterId,
        encounterFullyPaid,
        dispatch
      ]);

      useEffect(() => {
        const outstanding =
          previewTotals.patientOutstandingAmount;

        if (
          !paymentMethodSelected ||
          outstanding <= 0 ||
          lockAfterConfirm ||
          formState.payZeroNow
        ) {
          return;
        }

        setFormState(
          previous => {
            if (
              previous.paymentAmount >
              0
            ) {
              return previous;
            }

            return {
              ...previous,
              paymentAmount:
                outstanding
            };
          }
        );
      }, [
        paymentMethodSelected,
        previewTotals.patientOutstandingAmount,
        lockAfterConfirm,
        formState.payZeroNow
      ]);

      const buildReceiptData =
        (
          paymentResult: any | null,
          billingSummary: EncounterBillingSummary
        ): PaymentReceiptData => {
          const facilityName =
            facilityResponse?.name ??
            facilityResponse?.data?.name ??
            'Healthcare Facility';

          const patientName =
            [
              localPatient?.firstName,
              localPatient?.lastName
            ]
              .filter(Boolean)
              .join(' ') ||
            localPatient?.fullName ||
            localPatient?.name ||
            '-';

          const patientMrn =
            localPatient?.mrn ??
            localPatient?.medicalRecordNumber ??
            localPatient?.patientMrn ??
            '-';

          const encounterNumber =
            localEncounter?.encounterNumber ??
            String(
              localEncounter?.id ?? '-'
            );

          const paymentMethodLabel =
            paymentMethods.find(
              (option: any) =>
                String(option?.value) ===
                String(
                  formState.paymentMethodCode
                )
            )?.label ??
            formState.paymentMethodCode ??
            '-';

          const receiptItems =
            (billingSummary.items ?? [])
              .length > 0
              ? billingSummary.items ?? []
              : displayChargeLines;

          return {
            receiptNumber:
              paymentResult?.paymentNumber ??
              billingSummary.chargeNumber ??
              '-',

            transactionNumber:
              paymentResult?.paymentTransactionNumber ??
              '-',

            paymentDate:
              new Date().toLocaleString(),

            patientName,

            patientMrn,

            encounterNumber,

            facilityName,

            coverageType:
              formState.coverageType ===
              'INSURANCE'
                ? 'Insurance'
                : 'Self Pay',

            currency: activeCurrency,

            paymentAmount:
              paymentResult?.paymentAmount ??
              formState.paymentAmount,

            paymentMethod:
              paymentMethodLabel,

            chargeNumber:
              billingSummary.chargeNumber ??
              '-',

            items: receiptItems.map(
              item => ({
                name: resolveBillingItemName(
                  item,
                  defaultServiceRows
                ),

                type: formatBillingItemType(
                  item.billingItemType
                ),

                quantity: toNumber(
                  item.quantity,
                  1
                ),

                unitPrice: toNumber(
                  item.unitPrice
                ),

                netAmount: toNumber(
                  item.netAmount
                ),

                patientShare: toNumber(
                  item.patientResponsibilityAmount
                )
              })
            ),

            totals:
              computePreviewBillingTotals(
                billingSummary,
                selectedRows,
                isInsurance
              ),

            notes:
              formState.notes.trim() ||
              undefined
          };
        };

      const openReceipt =
        (
          receipt: PaymentReceiptData
        ) => {
          if (
            onReceiptReady
          ) {
            onReceiptReady(
              receipt
            );
            return;
          }

          setReceiptPreview(
            receipt
          );
          setReceiptModalOpen(
            true
          );
        };

      const handleReceiptClose =
        () => {
          setReceiptModalOpen(
            false
          );

          if (
            onReceiptClosed
          ) {
            onReceiptClosed();
          }
        };

      const selectedAll =
        defaultServiceRows.length >
          0 &&
        defaultServiceRows.every(
          row =>
            row.selected
        );

      const selectedSome =
        defaultServiceRows.some(
          row =>
            row.selected
        );

      const validate =
        () => {
          const details:
          Record<string, any[]> =
            {};

          const reject =
            (
              field: string,
              message: string
            ) => {
              details[field] = [
                {
                  validationType:
                    'REJECT',

                  message
                }
              ];
            };

          if (
            !patientId
          ) {
            reject(
              'patientId',
              'Patient is required'
            );
          }

          if (
            !encounterId
          ) {
            reject(
              'encounterId',
              'Encounter is required'
            );
          }

          if (
            !facilityId
          ) {
            reject(
              'facilityId',
              'Facility is required'
            );
          }

          if (
            resolvedOutstanding <=
              0 &&
            previewTotals.patientOutstandingAmount <=
              0
          ) {
            reject(
              'services',
              'All services are already paid for this encounter'
            );
          }

          if (
            !formState.payZeroNow
          ) {
            if (
              !formState.paymentMethodCode
            ) {
              reject(
                'paymentMethodCode',
                'Payment method is required'
              );
            }

            if (
              formState.paymentAmount <=
              0
            ) {
              reject(
                'paymentAmount',
                'Enter a payment amount greater than zero'
              );
            }

            if (
              formState.paymentAmount >
              previewTotals.patientOutstandingAmount
            ) {
              reject(
                'paymentAmount',
                'Payment amount cannot exceed the outstanding balance'
              );
            }
          }

          if (
            !formState.payZeroNow &&
            formState.paymentAmount < 0
          ) {
            reject(
              'paymentAmount',
              'Payment amount cannot be negative'
            );
          }

          if (
            isInsurance &&
            !formState.patientInsuranceId
          ) {
            reject(
              'patientInsuranceId',
              'Patient insurance is required'
            );
          }

          if (
            showCardFields &&
            formState.cardLastFour &&
            !/^[0-9]{4}$/.test(
              formState.cardLastFour
            )
          ) {
            reject(
              'cardLastFour',
              'Enter exactly four digits'
            );
          }

          setValidationResult({
            details
          });

          if (
            Object.keys(details)
              .length > 0
          ) {
            dispatch(
              notify({
                msg:
                  'Please review the billing fields.',

                sev:
                  'warning'
              })
            );

            return false;
          }

          return true;
        };

      const prepareServices =
        async () => {
          const unpaidExistingIds =
            unpaidSummaryItems
              .map(
                item =>
                  item.patientServiceProductId
              )
              .filter(
                (
                  id
                ): id is number =>
                  id != null
              );

          if (
            payableSelectedRows.length ===
            0
          ) {
            if (
              unpaidExistingIds.length >
              0
            ) {
              return {
                ids:
                  unpaidExistingIds,
                message:
                  'Using existing unpaid charge lines.'
              };
            }

            if (
              resolvePatientOutstandingAmount(
                summary
              ) >
              0
            ) {
              throw new Error(
                'Unable to match unpaid services. Please refresh and try again.'
              );
            }

            throw new Error(
              'All services are already paid for this encounter.'
            );
          }

          const body:
          PrepareDefaultServicesRequest = {
            patientId,

            facilityId,

            currency:
              summary.currency ??
              facilityCurrency,

            coverageType:
              formState.coverageType,

            patientInsuranceId:
              isInsurance
                ? formState.patientInsuranceId
                : null,

            items:
              payableSelectedRows.map(
                (
                  row,
                  index
                ) => ({
                  serviceId:
                    row.serviceId,

                  quantity:
                    row.quantity,

                  sequence:
                    index + 1,

                  isExempted:
                    row.isExempted
                })
              ),

            requestId:
              makeRequestId(
                'PREPARE-DEFAULT-SERVICES'
              )
          };

          const result =
            await prepareDefaultServices(
              {
                encounterId,
                body
              }
            ).unwrap();

          const successful =
            result.items
              .filter(
                item =>
                  item.billingResult
                    ?.processed
              )
              .sort(
                (
                  first,
                  second
                ) =>
                  first.sequence -
                  second.sequence
              );

          if (
            successful.length !==
            result.items.length
          ) {
            const failed =
              result.items.filter(
                item =>
                  !item.billingResult
                    ?.processed
              );

            const message =
              failed
                .map(
                  item =>
                    `Service ${item.serviceId}: ${
                      item.billingResult
                        ?.message ??
                      'Not processed'
                    }`
                )
                .join('\n');

            throw new Error(
              message ||
                'Some services were not processed'
            );
          }

          const ids =
            successful.map(
              item =>
                item.patientServiceProductId
            );

          setPreparedPspIds(
            ids
          );

          setPrepareResultMessage(
            result.message ??
              'Default services prepared and priced successfully.'
          );

          await refetchSummary();

          return {
            ids,
            message:
              result.message ??
              'Default services prepared and priced successfully.'
          };
        };

      const receivePayment =
        async (
          pspIds: number[]
        ) => {
          if (
            formState.payZeroNow ||
            formState.paymentAmount <=
            0
          ) {
            return null;
          }

          const outstanding = Math.max(
            resolvePatientOutstandingAmount(
              summary
            ),
            previewTotals.patientOutstandingAmount
          );

          if (
            outstanding <= 0 ||
            pspIds.length === 0
          ) {
            return null;
          }

          const paymentAmount =
            Math.min(
              formState.paymentAmount,
              outstanding
            );

          const request:
          CreateAdvancePaymentRequest = {
            ...newCreateAdvancePaymentRequest,

            patientId,

            encounterId,

            paymentCategory:
              resolvePaymentCategory(
                formState.paymentMethodCode
              ),

            payerType:
              'PATIENT',

            payerId:
              null,

            amount:
              paymentAmount,

            currency:
              summary.currency ??
              facilityCurrency,

            paymentStatus:
              'COMPLETED',

            transactionType:
              'PAYMENT',

            paymentMethodId:
              toNumber(
                paymentMethods.find(
                  (option: any) =>
                    String(option?.value) ===
                    String(formState.paymentMethodCode)
                )?.id ??
                paymentMethods.find(
                  (option: any) =>
                    String(option?.value) ===
                    String(formState.paymentMethodCode)
                )?.key ??
                paymentMethods.find(
                  (option: any) =>
                    String(option?.value) ===
                    String(formState.paymentMethodCode)
                )?.valueId ??
                0
              ),

            paymentMethodCode:
              formState.paymentMethodCode,

            transactionStatus:
              'SUCCESS',

            /*
             * Receipt/payment numbers are generated by the backend.
             * External references are supplied only by an integrated
             * payment processor, not typed manually on this screen.
             */
            receiptNumber:
              null,

            externalReference:
              null,

            authorizationCode:
              formState.authorizationCode
                .trim() ||
              null,

            processorReference:
              formState.processorReference
                .trim() ||
              null,

            cardLastFour:
              formState.cardLastFour
                .trim() ||
              null,

            bankReference:
              formState.bankReference
                .trim() ||
              null,

            cashRegisterId:
              formState.cashRegisterId,

            notes:
              formState.notes
                .trim() ||
              null,

            patientServiceProductIds:
              pspIds,

            requestId:
              makeRequestId(
                'ADVANCE-PAYMENT'
              )
          };

          const result =
            await createAdvancePayment(
              request
            ).unwrap();

          setLastPaymentResult(
            result
          );

          return result;
        };

      const handleConfirm =
        async () => {
          if (
            isViewOnlyMode
          ) {
            return false;
          }

          if (
            isReadOnly ||
            !validate()
          ) {
            return false;
          }

          if (
            !hasPayableBalance
          ) {
            dispatch(
              notify({
                msg:
                  'All services for this encounter are already paid.',
                sev: 'info'
              })
            );

            return false;
          }

          try {
            const {
              ids,
              message:
                preparedMessage
            } =
              await prepareServices();

            const refreshed =
              await refetchSummary();

            const billingSummary: EncounterBillingSummary =
              refreshed?.data ??
              summary;

            const payableIds =
              getUnpaidSummaryItems(
                billingSummary
              )
                .map(
                  item =>
                    item.patientServiceProductId
                )
                .filter(
                  (
                    id
                  ): id is number =>
                    id != null
                );

            const paymentTargetIds =
              payableIds.length >
              0
                ? payableIds
                : ids;

            if (
              paymentTargetIds.length ===
              0
            ) {
              dispatch(
                notify({
                  msg:
                    'No unpaid services were found for this payment.',
                  sev: 'warning'
                })
              );

              return false;
            }

            const refreshedOutstanding =
              resolvePatientOutstandingAmount(
                billingSummary
              );

            if (
              refreshedOutstanding <= 0
            ) {
              dispatch(
                notify({
                  msg:
                    'All services for this encounter are already paid.',
                  sev: 'info'
                })
              );

              return false;
            }

            const payZeroNow =
              formState.payZeroNow;

            if (payZeroNow) {
              setSummaryRefreshKey(
                previous =>
                  previous + 1
              );

              const remainingAmount =
                Math.max(
                  refreshedOutstanding,
                  previewTotals.patientOutstandingAmount
                );

              dispatch(
                notify({
                  msg:
                    preparedMessage ??
                    `Services prepared. ${formatMoney(
                      remainingAmount,
                      activeCurrency
                    )} remains to be collected from the patient.`,
                  sev: 'success'
                })
              );

              if (
                onPaymentSaved
              ) {
                await onPaymentSaved();
              }

              if (
                onPaymentDeferred
              ) {
                onPaymentDeferred();
              } else if (
                onNothingToPay
              ) {
                onNothingToPay();
              } else if (
                onReceiptClosed
              ) {
                onReceiptClosed();
              }

              return true;
            }

            const paymentResult =
              await receivePayment(
                paymentTargetIds
              );

            setSummaryRefreshKey(
              previous =>
                previous + 1
            );

            const postPaymentRefresh =
              await refetchSummary();

            const finalBillingSummary: EncounterBillingSummary =
              postPaymentRefresh?.data ??
              billingSummary;

            if (
              paymentResult
            ) {
              setLockAfterConfirm(
                true
              );
            } else {
              dispatch(
                notify({
                  msg:
                    'No payment was collected. The selected services may already be fully paid.',
                  sev: 'warning'
                })
              );

              return false;
            }

            const receipt =
              buildReceiptData(
                paymentResult,
                finalBillingSummary
              );

            openReceipt(
              receipt
            );

            dispatch(
              notify({
                msg:
                  `Payment ${paymentResult.paymentNumber} received and reserved successfully.`,

                sev:
                  'success'
              })
            );

            if (
              onPaymentSaved
            ) {
              await onPaymentSaved();
            }

            return true;
          } catch (
            error: any
          ) {
            dispatch(
              notify({
                msg:
                  normalizeError(
                    error
                  ),

                sev:
                  'warning'
              })
            );

            return false;
          }
        };

      const handleClear =
        () => {
          setFormState(
            initialFormState
          );

          setPreparedPspIds(
            []
          );

          setValidationResult(
            {}
          );

          setLockAfterConfirm(
            false
          );

          setLastPaymentResult(
            null
          );

          setPrepareResultMessage(
            null
          );

          setReceiptPreview(
            null
          );

          setReceiptModalOpen(
            false
          );

          fullyPaidNotifiedRef.current =
            false;

          setDefaultServiceRows(
            previous =>
              previous.map(
                (
                  row,
                  index
                ) => ({
                  ...row,

                  selected:
                    true,

                  isExempted:
                    false,

                  quantity:
                    1,

                  sequence:
                    index + 1
                })
              )
          );

          if (
            setPatientInsurance
          ) {
            setPatientInsurance(
              newPatientInsurance
            );
          }
        };

      useImperativeHandle(
        ref,
        () => ({
          confirm:
            handleConfirm,

          clear:
            handleClear,

          validate
        })
      );

      const summaryDisplayRecord =
        useMemo(
          () => ({
            chargeNumber:
              summary.chargeNumber ??
              (previewTotals.isPreview
                ? 'Pending'
                : '-'),

            currency:
              activeCurrency,

            grossAmount:
              formatMoney(
                previewTotals.grossAmount,
                activeCurrency
              ),

            discountAmount:
              formatMoney(
                previewTotals.discountAmount,
                activeCurrency
              ),

            exemptionAmount:
              formatMoney(
                previewTotals.exemptionAmount,
                activeCurrency
              ),

            taxAmount:
              formatMoney(
                previewTotals.taxAmount,
                activeCurrency
              ),

            netAmount:
              formatMoney(
                previewTotals.netAmount,
                activeCurrency
              ),

            patientResponsibilityAmount:
              formatMoney(
                previewTotals.patientResponsibilityAmount,
                activeCurrency
              ),

            insuranceResponsibilityAmount:
              formatMoney(
                previewTotals.insuranceResponsibilityAmount,
                activeCurrency
              ),

            patientOutstandingAmount:
              formatMoney(
                previewTotals.patientOutstandingAmount,
                activeCurrency
              ),

            walletAvailableBalance:
              formatMoney(
                lastPaymentResult?.walletAvailableBalance ??
                  summary.wallet
                    ?.availableBalance ??
                  0,
                activeCurrency
              ),

            walletReservedBalance:
              formatMoney(
                lastPaymentResult?.walletReservedBalance ??
                  summary.wallet
                    ?.reservedBalance ??
                  0,
                activeCurrency
              ),

            paymentNumber:
              lastPaymentResult?.paymentNumber ??
              '-',

            paymentTransactionNumber:
              lastPaymentResult?.paymentTransactionNumber ??
              '-',

            isPreview:
              previewTotals.isPreview
          }),
          [
            summary,
            previewTotals,
            activeCurrency,
            lastPaymentResult
          ]
        );

      const paginatedDefaultServices =
        useMemo(() => {
          const start =
            page *
            rowsPerPage;

          return defaultServiceRows.slice(
            start,
            start +
              rowsPerPage
          );
        }, [
          defaultServiceRows,
          page,
          rowsPerPage
        ]);

      const toggleAllSelected =
        (
          checked: boolean
        ) => {
          setDefaultServiceRows(
            previous =>
              previous.map(
                row => ({
                  ...row,
                  selected:
                    checked
                })
              )
          );
        };

      const updateServiceRow =
        (
          serviceId: number,
          partial:
            Partial<DefaultServiceRow>
        ) => {
          setDefaultServiceRows(
            previous =>
              previous.map(
                row =>
                  row.serviceId ===
                  serviceId
                    ? {
                        ...row,
                        ...partial
                      }
                    : row
              )
          );
        };

      const defaultServiceColumns:
      ColumnConfig[] = [
        {
          key:
            'selected',

          title: (
            <Checkbox
              checked={
                selectedAll
              }
              indeterminate={
                !selectedAll &&
                selectedSome
              }
              onChange={(
                _,
                checked
              ) =>
                toggleAllSelected(
                  checked
                )
              }
              disabled={
                areServicesLocked
              }
            />
          ),

          dataKey:
            'selected',

          width:
            70,

          render:
            (
              row:
                DefaultServiceRow
            ) => (
              <Checkbox
                checked={
                  row.selected
                }
                onChange={(
                  _,
                  checked
                ) =>
                  updateServiceRow(
                    row.serviceId,
                    {
                      selected:
                        checked
                    }
                  )
                }
                disabled={
                  areServicesLocked ||
                  !isDefaultServicePayable(
                    row.serviceId,
                    summary
                  )
                }
              />
            )
        },

        {
          key:
            'sequence',

          title:
            <Translate>
              Order
            </Translate>,

          dataKey:
            'sequence',

          width:
            80
        },

        {
          key:
            'serviceType',

          title:
            <Translate>
              Service Type
            </Translate>,

          dataKey:
            'serviceType',

          width:
            150,

          render:
            (
              row:
                DefaultServiceRow
            ) =>
              formatEnumString(
                row.serviceType
              ) || '-'
        },

        {
          key:
            'serviceName',

          title:
            <Translate>
              Service Name
            </Translate>,

          dataKey:
            'serviceName',

          width:
            240
        },

        {
          key:
            'quantity',

          title:
            <Translate>
              Quantity
            </Translate>,

          dataKey:
            'quantity',

          width:
            110
        },

        {
          key:
            'setupPrice',

          title:
            <Translate>
              Setup Price
            </Translate>,

          dataKey:
            'setupPrice',

          width:
            120,

          render:
            (
              row:
                DefaultServiceRow
            ) =>
              formatMoney(
                row.setupPrice,
                activeCurrency
              )
        },

        {
          key:
            'calculatedPrice',

          title:
            <Translate>
              Calculated Price
            </Translate>,

          dataKey:
            'calculatedPrice',

          width:
            130,

          render:
            (
              row:
                DefaultServiceRow
            ) =>
              row.calculatedPrice ==
              null
                ? '-'
                : formatMoney(
                    row.calculatedPrice,
                    activeCurrency
                  )
        },

        ...(formState.coverageType ===
        'INSURANCE'
          ? [
              {
                key:
                  'priceListItemCode',

                title:
                  <Translate>
                    Waseel Code
                  </Translate>,

                dataKey:
                  'priceListItemCode',

                width:
                  130,

                render:
                  (
                    row:
                      DefaultServiceRow
                  ) =>
                    row.priceListItemCode ??
                    '-'
              },
              {
                key:
                  'patientShare',

                title:
                  <Translate>
                    Patient Co-pay
                  </Translate>,

                dataKey:
                  'patientShare',

                width:
                  120,

                render:
                  (
                    row:
                      DefaultServiceRow
                  ) =>
                    row.patientShare ==
                    null
                      ? '-'
                      : formatMoney(
                          row.patientShare,
                          activeCurrency
                        )
              },
              {
                key:
                  'insuranceShare',

                title:
                  <Translate>
                    Payer Share
                  </Translate>,

                dataKey:
                  'insuranceShare',

                width:
                  120,

                render:
                  (
                    row:
                      DefaultServiceRow
                  ) =>
                    row.insuranceShare ==
                    null
                      ? '-'
                      : formatMoney(
                          row.insuranceShare,
                          activeCurrency
                        )
              }
            ]
          : []),

        {
          key:
            'isExempted',

          title:
            <Translate>
              Exempted
            </Translate>,

          dataKey:
            'isExempted',

          width:
            120,

          render:
            (
              row:
                DefaultServiceRow
            ) => (
              <Checkbox
                checked={
                  row.isExempted
                }
                onChange={(
                  _,
                  checked
                ) =>
                  updateServiceRow(
                    row.serviceId,
                    {
                      isExempted:
                        checked
                    }
                  )
                }
                disabled={
                  areServicesLocked ||
                  !row.selected
                }
              />
            )
        },

        {
          key:
            'prepared',

          title:
            <Translate>
              Status
            </Translate>,

          dataKey:
            'prepared',

          width:
            120,

          render:
            (
              row:
                DefaultServiceRow
            ) => {
              const isPrepared =
                billedSourceIds.has(
                  row.serviceId
                );
              const billedItem =
                (summary.items ?? []).find(
                  item =>
                    item.sourceId ===
                    row.serviceId
                );
              const lineDue =
                billedItem
                  ? getLineDueAmount(
                      billedItem
                    )
                  : 0;
              const isPaid =
                isPrepared &&
                lineDue <= 0;

              if (isPaid) {
                return (
                  <Tag
                    size="sm"
                    color="blue"
                  >
                    Paid
                  </Tag>
                );
              }

              if (
                isPrepared &&
                lineDue > 0
              ) {
                return (
                  <Tag
                    size="sm"
                    color="orange"
                  >
                    Due
                  </Tag>
                );
              }

              return isPrepared ? (
                <Tag
                  size="sm"
                  color="green"
                >
                  Prepared
                </Tag>
              ) : (
                <Tag
                  size="sm"
                >
                  Pending
                </Tag>
              );
            }
        }
      ];

      const billedItemColumns:
      ColumnConfig[] = [
        {
          key:
            'itemName',

          title:
            <Translate>
              Item
            </Translate>,

          dataKey:
            'itemName',

          width:
            240,

          render:
            (
              row:
                EncounterBillingItemSummary
            ) =>
              resolveBillingItemName(
                row,
                defaultServiceRows
              )
        },

        {
          key:
            'billingItemType',

          title:
            <Translate>
              Service Type
            </Translate>,

          dataKey:
            'billingItemType',

          width:
            140,

          render:
            (
              row:
                EncounterBillingItemSummary
            ) =>
              formatBillingItemType(
                row.billingItemType
              )
        },

        {
          key:
            'setupUnitPrice',

          title:
            <Translate>
              Setup Price
            </Translate>,

          dataKey:
            'setupUnitPrice',

          width:
            110,

          render:
            (
              row:
                EncounterBillingItemSummary
            ) =>
              formatMoney(
                row.setupUnitPrice,
                row.currency ??
                  activeCurrency
              )
        },

        {
          key:
            'unitPrice',

          title:
            <Translate>
              Resolved Price
            </Translate>,

          dataKey:
            'unitPrice',

          width:
            110,

          render:
            (
              row:
                EncounterBillingItemSummary
            ) =>
              formatMoney(
                row.unitPrice,
                row.currency ??
                  activeCurrency
              )
        },

        ...(isInsurance
          ? [
              {
                key: 'priceListItemCode',
                title: (
                  <Translate>
                    Waseel Code
                  </Translate>
                ),
                dataKey: 'priceListItemCode',
                width: 120,
                render: (
                  row: EncounterBillingItemSummary
                ) =>
                  row.priceListItemCode ??
                  row.itemCode ??
                  '-'
              },
              {
                key: 'discountFactor',
                title: (
                  <Translate>
                    Factor
                  </Translate>
                ),
                dataKey: 'discountFactor',
                width: 90,
                render: (
                  row: EncounterBillingItemSummary
                ) =>
                  computeDiscountFactor(row)
              },
              {
                key: 'taxAmount',
                title: (
                  <Translate>
                    Tax
                  </Translate>
                ),
                dataKey: 'taxAmount',
                width: 100,
                render: (
                  row: EncounterBillingItemSummary
                ) =>
                  formatMoney(
                    row.taxAmount,
                    row.currency ?? activeCurrency
                  )
              }
            ]
          : []),

        {
          key:
            'netAmount',

          title:
            <Translate>
              Calculated (Net)
            </Translate>,

          dataKey:
            'netAmount',

          width:
            120,

          render:
            (
              row:
                EncounterBillingItemSummary
            ) =>
              formatMoney(
                row.netAmount,
                row.currency ??
                  activeCurrency
              )
        },

        {
          key:
            'patientResponsibilityAmount',

          title:
            <Translate>
              Patient Share
            </Translate>,

          dataKey:
            'patientResponsibilityAmount',

          width:
            130,

          render:
            (
              row:
                EncounterBillingItemSummary
            ) =>
              formatMoney(
                row.patientResponsibilityAmount,
                row.currency ??
                  activeCurrency
              )
        },

        {
          key:
            'insuranceResponsibilityAmount',

          title:
            <Translate>
              Insurance Share
            </Translate>,

          dataKey:
            'insuranceResponsibilityAmount',

          width:
            140,

          render:
            (
              row:
                EncounterBillingItemSummary
            ) =>
              formatMoney(
                row.insuranceResponsibilityAmount,
                row.currency ??
                  activeCurrency
              )
        },

        {
          key:
            'reservedAmount',

          title:
            <Translate>
              Reserved
            </Translate>,

          dataKey:
            'reservedAmount',

          width:
            110,

          render:
            (
              row:
                EncounterBillingItemSummary
            ) =>
              formatMoney(
                row.reservedAmount,
                row.currency ??
                  activeCurrency
              )
        },

        {
          key:
            'outstandingAmount',

          title:
            <Translate>
              Balance Due
            </Translate>,

          dataKey:
            'outstandingAmount',

          width:
            120,

          render:
            (
              row:
                EncounterBillingItemSummary
            ) =>
              formatMoney(
                row.outstandingAmount,
                row.currency ??
                  activeCurrency
              )
        },

        {
          key:
            'status',

          title:
            <Translate>
              Status
            </Translate>,

          dataKey:
            'status',

          width:
            130,

          render:
            (
              row:
                EncounterBillingItemSummary
            ) => (
              <MyBadgeStatus
                color={
                  row.status ===
                    'CLOSED' ||
                  row.status ===
                    'FULLY_ALLOCATED'
                    ? '#2e7d32'
                    : row.status ===
                        'CANCELLED' ||
                      row.status ===
                        'REVERSED'
                    ? '#d32f2f'
                    : '#1976d2'
                }
                contant={
                  row.status
                }
              />
            )
        }
      ];

      const direction =
        localStorage.getItem(
          'direction'
        ) ??
        'LTR';

      const dir =
        direction === 'RTL'
          ? 'rtl'
          : 'ltr';

      const internalActionButtons =
        showInternalButtons ? (
          <div className="payment-info__actions-bar">
            <MyButton
              appearance="subtle"
              onClick={
                handleClear
              }
              disabled={
                isLocked
              }
            >
              Clear
            </MyButton>

            <MyButton
              appearance="ghost"
              loading={
                preparingServices
              }
              onClick={async () => {
                if (
                  isReadOnly ||
                  !validate()
                ) {
                  return;
                }

                try {
                  const {
                    message:
                      preparedMessage
                  } =
                    await prepareServices();

                  dispatch(
                    notify({
                      msg:
                        preparedMessage,

                      sev:
                        'success'
                    })
                  );
                } catch (
                  error: any
                ) {
                  dispatch(
                    notify({
                      msg:
                        normalizeError(
                          error
                        ),

                      sev:
                        'warning'
                    })
                  );
                }
              }}
              disabled={
                isLocked ||
                areServicesLocked ||
                selectedRows.length ===
                  0
              }
            >
              Prepare Services
            </MyButton>

            <MyButton
              appearance="primary"
              loading={
                creatingPayment
              }
              onClick={async () => {
                if (
                  isReadOnly
                ) {
                  return;
                }

                if (
                  formState.payZeroNow
                ) {
                  if (
                    !validate()
                  ) {
                    return;
                  }

                  try {
                    await prepareServices();

                    await refetchSummary();

                    dispatch(
                      notify({
                        msg:
                          `Services prepared. ${formatMoney(
                            previewTotals.patientOutstandingAmount,
                            activeCurrency
                          )} remains to be collected from the patient.`,
                        sev: 'success'
                      })
                    );
                  } catch (
                    error: any
                  ) {
                    dispatch(
                      notify({
                        msg:
                          normalizeError(
                            error
                          ),

                        sev:
                          'warning'
                      })
                    );
                  }

                  return;
                }

                if (
                  formState.paymentAmount <=
                  0
                ) {
                  dispatch(
                    notify({
                      msg:
                        'Enter a payment amount greater than zero.',

                      sev:
                        'warning'
                    })
                  );
                  return;
                }

                if (
                  !formState.paymentMethodCode
                ) {
                  dispatch(
                    notify({
                      msg:
                        'Select a payment method.',

                      sev:
                        'warning'
                    })
                  );
                  return;
                }

                try {
                  const prepared =
                    preparedPspIds.length >
                    0
                      ? {
                          ids:
                            preparedPspIds,
                          message:
                            prepareResultMessage ??
                            'Default services already prepared.'
                        }
                      : await prepareServices();

                  const result =
                    await receivePayment(
                      prepared.ids
                    );

                  const refreshed =
                    await refetchSummary();

                  const billingSummary: EncounterBillingSummary =
                    refreshed?.data ??
                    summary;

                  setLockAfterConfirm(
                    true
                  );

                  const receipt =
                    buildReceiptData(
                      result,
                      billingSummary
                    );

                  openReceipt(
                    receipt
                  );

                  dispatch(
                    notify({
                      msg:
                        `Payment ${result?.paymentNumber ?? ''} received and reserved successfully.`,

                      sev:
                        'success'
                    })
                  );

                  if (
                    onPaymentSaved
                  ) {
                    await onPaymentSaved();
                  }
                } catch (
                  error: any
                ) {
                  dispatch(
                    notify({
                      msg:
                        normalizeError(
                          error
                        ),

                      sev:
                        'warning'
                    })
                  );
                }
              }}
              disabled={
                isLocked ||
                formState.payZeroNow ||
                formState.paymentAmount <=
                  0
              }
            >
              Receive & Reserve
            </MyButton>
          </div>
        ) : null;

      return (
        <Form
          fluid
          className="patient-billing-info"
          dir={dir}
        >
          <div className="payment-info__header">
            <div className="payment-info__summary-strip">
              <SummaryMetric
                label="Charge Number"
                value={
                  summary.chargeNumber ??
                  '-'
                }
                mono
              />
              <SummaryMetric
                label="Currency"
                value={activeCurrency}
              />
              <SummaryMetric
                label="Net Amount"
                value={formatMoney(
                  previewTotals.netAmount,
                  activeCurrency
                )}
              />
              <SummaryMetric
                label="Amount Due"
                value={formatMoney(
                  previewTotals.patientOutstandingAmount,
                  activeCurrency
                )}
                variant="highlight"
              />
              <SummaryMetric
                label="Wallet Available"
                value={formatMoney(
                  summary.wallet
                    ?.availableBalance ??
                    0,
                  activeCurrency
                )}
                variant="success"
              />
            </div>

            <div className="payment-info__stepper">
              <WorkflowStep
                index={1}
                label="Coverage"
                state={
                  servicesArePrepared
                    ? 'done'
                    : 'active'
                }
              />
              <div
                className={`payment-info__stepper-connector${
                  servicesArePrepared
                    ? ' payment-info__stepper-connector--done'
                    : ''
                }`}
              />
              <WorkflowStep
                index={2}
                label="Prepare Services"
                state={
                  servicesArePrepared
                    ? 'done'
                    : 'pending'
                }
              />
              <div
                className={`payment-info__stepper-connector${
                  lockAfterConfirm
                    ? ' payment-info__stepper-connector--done'
                    : servicesArePrepared
                      ? ' payment-info__stepper-connector--active'
                      : ''
                }`}
              />
              <WorkflowStep
                index={3}
                label="Receive Payment"
                state={
                  lockAfterConfirm
                    ? 'done'
                    : servicesArePrepared
                      ? 'active'
                      : 'pending'
                }
              />
            </div>

            {prepareResultMessage ? (
              <Message
                showIcon
                type="success"
                className="payment-info__message"
              >
                {prepareResultMessage}
              </Message>
            ) : null}
          </div>

          <div className="payment-info__layout">
            <div className="payment-info__main-column">
          <Panel
            bordered
            className="payment-info__panel"
            header={
              <div className="payment-info__panel-header">
                <Translate>
                  Coverage
                </Translate>
              </div>
            }
          >
            <div className="payment-info__field-grid payment-info__field-grid--single">
            <MyInput
              vr={
                validationResult
              }
              column
              required
              fieldLabel="Coverage Type"
              fieldType="select"
              fieldName="coverageType"
              selectData={[
                {
                  label:
                    'Self Pay',
                  value:
                    'SELF_PAY'
                },
                {
                  label:
                    'Insurance',
                  value:
                    'INSURANCE'
                }
              ]}
              selectDataLabel="label"
              selectDataValue="value"
              record={
                formState
              }
              setRecord={(updatedForm: BillingFormState) => {
                const nextCoverage =
                  updatedForm.coverageType;

                setFormState({
                  ...updatedForm,
                  patientInsuranceId:
                    nextCoverage === 'INSURANCE'
                      ? updatedForm.patientInsuranceId
                      : null
                });
              }}
              disabled={
                isLocked
              }
              searchable={
                false
              }
            />
            </div>

            {isInsurance ? (
              <div className="payment-info__field-grid payment-info__field-grid--compact">
                <MyInput
                  vr={
                    validationResult
                  }
                  column
                  required
                  fieldLabel="Patient Insurance"
                  fieldType="selectPagination"
                  fieldName="patientInsuranceId"
                  selectData={
                    insuranceSelectData
                  }
                  selectDataLabel="label"
                  selectDataValue="id"
                  record={
                    formState
                  }
                  setRecord={setFormState}
                  disabled={
                    isLocked
                  }
                  searchable
                  loading={
                    insuranceResponse.isFetching
                  }
                  hasMore={
                    hasMoreInsurances
                  }
                  onFetchMore={() =>
                    setInsurancePage(
                      previous =>
                        previous + 1
                    )
                  }
                  searchKeyWard={
                    insuranceSearchKeyword
                  }
                  setSearchKeyWard={
                    setInsuranceSearchKeyword
                  }
                />

                <MyInput
                  column
                  disabled
                  fieldLabel="Payer NPHIES ID"
                  fieldName="payerNphiesId"
                  record={
                    patientInsurance ??
                    {}
                  }
                  setRecord={() =>
                    undefined
                  }
                />

                <MyInput
                  column
                  disabled
                  fieldLabel="Member Card ID"
                  fieldName="memberCardId"
                  record={
                    patientInsurance ??
                    {}
                  }
                  setRecord={() =>
                    undefined
                  }
                />

                <MyInput
                  column
                  disabled
                  fieldLabel="Policy Number"
                  fieldName="policyNumber"
                  record={
                    patientInsurance ??
                    {}
                  }
                  setRecord={() =>
                    undefined
                  }
                />

                <MyInput
                  column
                  disabled
                  fieldLabel="Policy Class"
                  fieldName="policyClassName"
                  record={
                    patientInsurance ??
                    {}
                  }
                  setRecord={() =>
                    undefined
                  }
                />

                <MyInput
                  column
                  disabled
                  fieldLabel="Expiration Date"
                  fieldType="date"
                  fieldName="expirationDate"
                  record={
                    patientInsurance ??
                    {}
                  }
                  setRecord={() =>
                    undefined
                  }
                />
              </div>
            ) : null}

            {isInsurance ? (
              <Panel
                bordered
                className="payment-info__panel payment-info__panel--nested"
                header={
                  <div className="payment-info__panel-header">
                    <Translate>
                      Waseel Coverage Details
                    </Translate>
                  </div>
                }
              >
                {!formState.patientInsuranceId ? (
                  <Message showIcon type="info">
                    Select a patient insurance to load Waseel coverage.
                  </Message>
                ) : loadingWaseelCoverage ? (
                  <Message showIcon type="info">
                    Loading Waseel eligibility benefits...
                  </Message>
                ) : waseelCoverageError ? (
                  <Message showIcon type="warning">
                    No successful Waseel eligibility found. Please run eligibility check from the patient profile first.
                  </Message>
                ) : waseelCoverage ? (
                  <>
                    <div className="payment-info__waseel-metrics">
                      <div className="payment-info__metric-card">
                        <span className="payment-info__metric-label">
                          Copayment %
                        </span>
                        <strong>
                          {waseelCoverage.copaymentPercent ?? 0}%
                        </strong>
                      </div>
                      <div className="payment-info__metric-card">
                        <span className="payment-info__metric-label">
                          Copayment Cap
                        </span>
                        <strong>
                          {formatMoney(
                            waseelCoverage.copaymentCap,
                            activeCurrency
                          )}
                        </strong>
                      </div>
                      <div className="payment-info__metric-card">
                        <span className="payment-info__metric-label">
                          Network
                        </span>
                        <strong>
                          {waseelCoverage.network ?? '-'}
                        </strong>
                      </div>
                      <div className="payment-info__metric-card">
                        <span className="payment-info__metric-label">
                          Coverage Status
                        </span>
                        <strong>
                          {waseelCoverage.inforce ??
                            waseelCoverage.coverageStatus ??
                            '-'}
                        </strong>
                      </div>
                    </div>

                    <div className="payment-info__table-wrapper payment-info__table-wrapper--compact">
                      <MyTable
                        data={
                          waseelCoverage.benefits ??
                          []
                        }
                        columns={[
                          {
                            key: 'categoryKey',
                            title: 'Category',
                            dataKey: 'categoryKey',
                            width: 180,
                            render: (
                              row: WaseelBenefitDetail
                            ) =>
                              row.categoryKey ?? '-'
                          },
                          {
                            key: 'itemCode',
                            title: 'Item Code',
                            dataKey: 'itemCode',
                            width: 120,
                            render: (
                              row: WaseelBenefitDetail
                            ) =>
                              row.itemCode ?? '-'
                          },
                          {
                            key: 'itemName',
                            title: 'Item',
                            dataKey: 'itemName',
                            width: 160,
                            render: (
                              row: WaseelBenefitDetail
                            ) =>
                              row.itemName ?? '-'
                          },
                          {
                            key: 'typeDisplay',
                            title: 'Benefit Type',
                            dataKey: 'typeDisplay',
                            width: 220,
                            render: (
                              row: WaseelBenefitDetail
                            ) =>
                              row.typeDisplay ??
                              row.typeCode ??
                              '-'
                          },
                          {
                            key: 'value',
                            title: 'Value',
                            dataKey: 'value',
                            width: 100,
                            render: (
                              row: WaseelBenefitDetail
                            ) => {
                              if (
                                row.value == null
                              ) {
                                return '-';
                              }

                              return row.unit
                                ? `${row.value} ${row.unit}`
                                : row.value;
                            }
                          }
                        ]}
                        loading={
                          loadingWaseelCoverage
                        }
                        height={220}
                        page={0}
                        rowsPerPage={
                          waseelCoverage
                            .benefits
                            ?.length ?? 0
                        }
                        totalCount={
                          waseelCoverage
                            .benefits
                            ?.length ?? 0
                        }
                        onPageChange={() =>
                          undefined
                        }
                        onRowsPerPageChange={() =>
                          undefined
                        }
                      />
                    </div>
                  </>
                ) : null}
              </Panel>
            ) : null}
          </Panel>

          <Panel
            bordered
            className="payment-info__panel"
            header={
              <div className="payment-info__panel-header">
                <Translate>
                  Default Services
                </Translate>
                <div className="payment-info__panel-status">
                  {servicesArePrepared ? (
                    <Tag
                      size="sm"
                      color="green"
                    >
                      Prepared
                    </Tag>
                  ) : (
                    <Tag size="sm">
                      Select services to prepare
                    </Tag>
                  )}
                </div>
              </div>
            }
          >
          <div className="payment-info__table-wrapper">
            <MyTable
              data={
                paginatedDefaultServices
              }
              columns={
                defaultServiceColumns
              }
              loading={
                servicesResponse.isFetching
              }
              height={
                260
              }
              page={
                page
              }
              rowsPerPage={
                rowsPerPage
              }
              totalCount={
                defaultServiceRows.length
              }
              onPageChange={(
                _,
                newPage
              ) =>
                setPage(
                  newPage
                )
              }
              onRowsPerPageChange={
                event => {
                  setRowsPerPage(
                    parseInt(
                      event.target.value,
                      10
                    )
                  );

                  setPage(
                    0
                  );
                }
              }
            />
          </div>
          </Panel>

          <Panel
            bordered
            className="payment-info__panel"
            header={
              <div className="payment-info__panel-header">
                <Translate>
                  Charge Lines
                </Translate>
                {previewTotals.isPreview &&
                displayChargeLines.length > 0 ? (
                  <Tag size="sm" color="orange">
                    Estimated
                  </Tag>
                ) : null}
              </div>
            }
          >
          <div className="payment-info__table-wrapper">
            <MyTable
              data={
                displayChargeLines
              }
              columns={
                billedItemColumns
              }
              loading={
                loadingSummary &&
                displayChargeLines.length ===
                  0
              }
              height={
                280
              }
              page={
                0
              }
              rowsPerPage={
                Math.max(
                  displayChargeLines.length,
                  5
                )
              }
              totalCount={
                displayChargeLines.length
              }
              onPageChange={() =>
                undefined
              }
              onRowsPerPageChange={() =>
                undefined
              }
            />
          </div>
          </Panel>
            </div>

            <aside className="payment-info__side-column">
          <Panel
            bordered
            className="payment-info__panel"
            header={
              <div className="payment-info__panel-header">
                <Translate>
                  Billing Summary
                </Translate>
                {summaryDisplayRecord.isPreview ? (
                  <Tag size="sm" color="orange">
                    Estimated
                  </Tag>
                ) : null}
              </div>
            }
          >
          {lastPaymentResult ? (
            <div className="payment-info__payment-success">
              <div className="payment-info__payment-success-title">
                Last Payment
              </div>
              <div className="payment-info__metric-list payment-info__metric-list--compact">
                <BillingMetric
                  label="Payment Number"
                  value={
                    summaryDisplayRecord.paymentNumber
                  }
                />
                <BillingMetric
                  label="Transaction Number"
                  value={
                    summaryDisplayRecord.paymentTransactionNumber
                  }
                />
              </div>
            </div>
          ) : null}

          <div className="payment-info__subsection">
            <h4 className="payment-info__subsection-title">
              Charge Totals
            </h4>
            <div className="payment-info__metric-list">
              <BillingMetric
                label="Gross Amount"
                value={
                  summaryDisplayRecord.grossAmount
                }
              />
              <BillingMetric
                label="Discount"
                value={
                  summaryDisplayRecord.discountAmount
                }
                variant="muted"
              />
              <BillingMetric
                label="Exemption"
                value={
                  summaryDisplayRecord.exemptionAmount
                }
                variant="muted"
              />
              <BillingMetric
                label="Tax"
                value={
                  summaryDisplayRecord.taxAmount
                }
              />
              <BillingMetric
                label="Net Amount"
                value={
                  summaryDisplayRecord.netAmount
                }
                variant="highlight"
              />
            </div>
          </div>

          <div className="payment-info__subsection">
            <h4 className="payment-info__subsection-title">
              Share Breakdown
            </h4>
            <div className="payment-info__metric-list">
              <BillingMetric
                label="Patient Share"
                value={
                  summaryDisplayRecord.patientResponsibilityAmount
                }
              />
              <BillingMetric
                label="Insurance Share"
                value={
                  summaryDisplayRecord.insuranceResponsibilityAmount
                }
              />
              <BillingMetric
                label="Amount Due"
                value={
                  summaryDisplayRecord.patientOutstandingAmount
                }
                variant="highlight"
              />
            </div>
          </div>

          <div className="payment-info__subsection">
            <h4 className="payment-info__subsection-title">
              Wallet
            </h4>
            <div className="payment-info__metric-list">
              <BillingMetric
                label="Available Balance"
                value={
                  summaryDisplayRecord.walletAvailableBalance
                }
                variant="success"
              />
              <BillingMetric
                label="Reserved Balance"
                value={
                  summaryDisplayRecord.walletReservedBalance
                }
              />
            </div>
          </div>
          </Panel>

          <Panel
            bordered
            className="payment-info__panel payment-info__panel--payment"
            header={
              <Translate>
                Receive Payment
              </Translate>
            }
          >
            {encounterFullyPaid ? (
              <Message
                showIcon
                type="info"
                className="payment-info__message"
              >
                This encounter is already paid. Payment details are shown in read-only mode.
              </Message>
            ) : null}

            <div className="payment-info__field-grid payment-info__field-grid--single">
            <MyInput
              vr={
                validationResult
              }
              column
              required={
                !formState.payZeroNow
              }
              fieldLabel="Payment Method"
              fieldType="select"
              fieldName="paymentMethodCode"
              selectData={
                paymentMethods
              }
              selectDataLabel="label"
              selectDataValue="value"
              record={
                formState
              }
              setRecord={(updatedForm: BillingFormState) => {
                setFormState({
                  ...updatedForm,
                  paymentAmount:
                    updatedForm.paymentMethodCode &&
                    previewTotals.patientOutstandingAmount >
                      0
                      ? previewTotals.patientOutstandingAmount
                      : 0
                });
              }}
              disabled={
                paymentFieldsDisabled
              }
              searchable={
                false
              }
              isEnum
            />

            <MyInput
              vr={
                validationResult
              }
              column
              required={
                !formState.payZeroNow
              }
              fieldLabel="Payment Amount"
              fieldType="number"
              fieldName="paymentAmount"
              record={
                formState
              }
              setRecord={setFormState}
              disabled={
                paymentFieldsDisabled ||
                !paymentMethodSelected
              }
            />
            </div>

            {!paymentMethodSelected &&
            hasPayableBalance &&
            !formState.payZeroNow ? (
              <div className="payment-info__field-note">
                Select a payment method first to enter the amount.
              </div>
            ) : null}

            <div className="payment-info__field-note">
              Receipt, payment, and transaction numbers are generated automatically by the backend after payment is received.
            </div>

            {showCardFields || showBankReference ? (
              <div className="payment-info__field-grid payment-info__field-grid--compact">
            {showCardFields ? (
              <>
                <MyInput
                  column
                  fieldLabel="Authorization Code"
                  fieldName="authorizationCode"
                  record={
                    formState
                  }
                  setRecord={setFormState}
                  disabled={
                    paymentFieldsDisabled
                  }
                />

                <MyInput
                  column
                  fieldLabel="Processor Reference"
                  fieldName="processorReference"
                  record={
                    formState
                  }
                  setRecord={setFormState}
                  disabled={
                    paymentFieldsDisabled
                  }
                />

                <MyInput
                  column
                  fieldLabel="Card Last Four"
                  fieldName="cardLastFour"
                  record={
                    formState
                  }
                  setRecord={setFormState}
                  disabled={
                    paymentFieldsDisabled
                  }
                />
              </>
            ) : null}

            {showBankReference ? (
              <MyInput
                column
                fieldLabel="Bank Reference"
                fieldName="bankReference"
                record={
                  formState
                }
                setRecord={setFormState}
                disabled={
                  paymentFieldsDisabled
                }
              />
            ) : null}
              </div>
            ) : null}

            <div className="payment-info__field-grid payment-info__field-grid--single">
            <MyInput
              column
              fieldLabel="Notes"
              fieldName="notes"
              fieldType="textarea"
              height={96}
              record={
                formState
              }
              setRecord={setFormState}
              disabled={
                paymentFieldsDisabled
              }
            />
            </div>

            {hasPayableBalance ? (
              <div className="payment-info__skip-toggle">
                <Toggle
                  checked={
                    formState.payZeroNow
                  }
                  disabled={
                    isLocked
                  }
                  onChange={checked => {
                    setFormState(
                      previous => ({
                        ...previous,
                        payZeroNow:
                          checked,
                        ...(checked
                          ? {
                              paymentAmount: 0,
                              paymentMethodCode:
                                '',
                              authorizationCode:
                                '',
                              processorReference:
                                '',
                              cardLastFour:
                                '',
                              bankReference:
                                '',
                              notes: ''
                            }
                          : {})
                      })
                    );
                  }}
                />
                <span className="payment-info__skip-toggle-label">
                  <Translate>
                    Collect zero now — amount stays on remaining balance
                  </Translate>
                </span>
              </div>
            ) : null}
          </Panel>

          {internalActionButtons}
            </aside>
          </div>

          {!onReceiptReady ? (
            <PaymentReceiptModal
              open={receiptModalOpen}
              onClose={handleReceiptClose}
              receipt={receiptPreview}
              autoPrint
            />
          ) : null}
        </Form>
      );
    }
  );

PatientPaymentInfo.displayName =
  'PatientPaymentInfo';

export default PatientPaymentInfo;
