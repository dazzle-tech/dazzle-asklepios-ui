import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState
} from 'react';

import {
  Checkbox,
  Form,
  Message,
  Panel,
  Tag
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
  usePrepareDefaultServicesMutation
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
  PrepareDefaultServicesRequest
} from '@/types/model-types-new';

import {
  notify
} from '@/utils/uiReducerActions';

import './style.less';

type DefaultServiceRow = {
  id: number;
  serviceId: number;
  serviceType: string;
  serviceName: string;
  selected: boolean;
  isExempted: boolean;
  quantity: number;
  sequence: number;
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
    ''
};

const makeRequestId =
  (prefix: string) =>
    `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

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
        onPaymentSaved
      },
      ref
    ) => {
      const dispatch =
        useAppDispatch();

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
            encounterId
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

      const [
        prepareDefaultServices,
        {
          isLoading:
            preparingServices
        }
      ] =
        usePrepareDefaultServicesMutation();

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

      const isLocked =
        Boolean(
          isReadOnly ||
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
                index + 1
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
          summary.patientOutstandingAmount >
            0 &&
          formState.paymentAmount ===
            0
        ) {
          setFormState(
            previous => ({
              ...previous,

              paymentAmount:
                summary.patientOutstandingAmount
            })
          );
        }
      }, [
        summary.patientOutstandingAmount,
        formState.paymentAmount
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
            selectedRows.length ===
            0
          ) {
            reject(
              'services',
              'Select at least one service'
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
            formState.paymentAmount >
              0 &&
            !formState.paymentMethodCode
          ) {
            reject(
              'paymentMethodCode',
              'Payment method is required'
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
              selectedRows.map(
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
            formState.paymentAmount <=
            0
          ) {
            return null;
          }

          const request:
          CreateAdvancePaymentRequest = {
            ...newCreateAdvancePaymentRequest,

            patientId,

            encounterId,

            paymentCategory:
              'ADVANCE',

            payerType:
              'PATIENT',

            payerId:
              null,

            amount:
              formState.paymentAmount,

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
            isReadOnly ||
            !validate()
          ) {
            return false;
          }

          try {
            const {
              ids,
              message:
                preparedMessage
            } =
              await prepareServices();

            const paymentResult =
              await receivePayment(
                ids
              );

            await refetchSummary();

            if (
              paymentResult
            ) {
              setLockAfterConfirm(
                true
              );
            }

            dispatch(
              notify({
                msg:
                  paymentResult
                    ? `Payment ${paymentResult.paymentNumber} received and reserved successfully.`
                    : preparedMessage,

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
              '-',

            currency:
              activeCurrency,

            grossAmount:
              formatMoney(
                summary.grossAmount,
                activeCurrency
              ),

            discountAmount:
              formatMoney(
                summary.discountAmount,
                activeCurrency
              ),

            exemptionAmount:
              formatMoney(
                summary.exemptionAmount,
                activeCurrency
              ),

            taxAmount:
              formatMoney(
                summary.taxAmount,
                activeCurrency
              ),

            netAmount:
              formatMoney(
                summary.netAmount,
                activeCurrency
              ),

            patientResponsibilityAmount:
              formatMoney(
                summary.patientResponsibilityAmount,
                activeCurrency
              ),

            insuranceResponsibilityAmount:
              formatMoney(
                summary.insuranceResponsibilityAmount,
                activeCurrency
              ),

            patientOutstandingAmount:
              formatMoney(
                summary.patientOutstandingAmount,
                activeCurrency
              ),

            walletAvailableBalance:
              formatMoney(
                summary.wallet
                  ?.availableBalance ??
                  0,
                activeCurrency
              ),

            walletReservedBalance:
              formatMoney(
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
              '-'
          }),
          [
            summary,
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
                  areServicesLocked
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
            150
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
              row.itemName ??
              row.itemCode ??
              row.billingItemType ??
              '-'
        },

        {
          key:
            'unitPrice',

          title:
            <Translate>
              Unit Price
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

        {
          key:
            'netAmount',

          title:
            <Translate>
              Net Amount
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
              Outstanding
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

      return (
        <div
          className="patient-billing-info"
          dir={dir}
        >
          <div className="payment-info__summary-strip">
            <div className="payment-info__summary-item">
              <span className="payment-info__summary-label">
                Charge Number
              </span>
              <span className="payment-info__summary-value">
                {summary.chargeNumber ??
                  '-'}
              </span>
            </div>

            <div className="payment-info__summary-item">
              <span className="payment-info__summary-label">
                Currency
              </span>
              <span className="payment-info__summary-value">
                {activeCurrency}
              </span>
            </div>

            <div className="payment-info__summary-item">
              <span className="payment-info__summary-label">
                Net Amount
              </span>
              <span className="payment-info__summary-value">
                {formatMoney(
                  summary.netAmount,
                  activeCurrency
                )}
              </span>
            </div>

            <div className="payment-info__summary-item">
              <span className="payment-info__summary-label">
                Patient Outstanding
              </span>
              <span className="payment-info__summary-value payment-info__summary-value--highlight">
                {formatMoney(
                  summary.patientOutstandingAmount,
                  activeCurrency
                )}
              </span>
            </div>

            <div className="payment-info__summary-item">
              <span className="payment-info__summary-label">
                Wallet Available
              </span>
              <span className="payment-info__summary-value payment-info__summary-value--success">
                {formatMoney(
                  summary.wallet
                    ?.availableBalance ??
                    0,
                  activeCurrency
                )}
              </span>
            </div>
          </div>

          <div className="payment-info__workflow">
            <span
              className={`payment-info__workflow-step ${
                servicesArePrepared
                  ? 'payment-info__workflow-step--done'
                  : 'payment-info__workflow-step--active'
              }`}
            >
              1. Coverage
            </span>
            <span
              className={`payment-info__workflow-step ${
                servicesArePrepared
                  ? 'payment-info__workflow-step--done'
                  : ''
              }`}
            >
              2. Prepare Services
            </span>
            <span
              className={`payment-info__workflow-step ${
                lockAfterConfirm
                  ? 'payment-info__workflow-step--done'
                  : servicesArePrepared
                    ? 'payment-info__workflow-step--active'
                    : ''
              }`}
            >
              3. Receive Payment
            </span>
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

          <Form
            fluid
            layout="inline"
            className="fields-container"
          >
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

            {isInsurance ? (
              <>
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
              </>
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
                300
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
              <Translate>
                Billing Summary
              </Translate>
            }
          >
          <div className="payment-info__amount-grid">
            {lastPaymentResult ? (
              <>
                <MyInput
                  column
                  disabled
                  fieldLabel="Payment Number"
                  fieldName="paymentNumber"
                  record={
                    summaryDisplayRecord
                  }
                  setRecord={() =>
                    undefined
                  }
                />

                <MyInput
                  column
                  disabled
                  fieldLabel="Transaction Number"
                  fieldName="paymentTransactionNumber"
                  record={
                    summaryDisplayRecord
                  }
                  setRecord={() =>
                    undefined
                  }
                />
              </>
            ) : null}

            <MyInput
              column
              disabled
              fieldLabel="Gross Amount"
              fieldName="grossAmount"
              record={
                summaryDisplayRecord
              }
              setRecord={() =>
                undefined
              }
            />

            <MyInput
              column
              disabled
              fieldLabel="Discount"
              fieldName="discountAmount"
              record={
                summaryDisplayRecord
              }
              setRecord={() =>
                undefined
              }
            />

            <MyInput
              column
              disabled
              fieldLabel="Exemption"
              fieldName="exemptionAmount"
              record={
                summaryDisplayRecord
              }
              setRecord={() =>
                undefined
              }
            />

            <MyInput
              column
              disabled
              fieldLabel="Tax"
              fieldName="taxAmount"
              record={
                summaryDisplayRecord
              }
              setRecord={() =>
                undefined
              }
            />

            <MyInput
              column
              disabled
              fieldLabel="Net Amount"
              fieldName="netAmount"
              record={
                summaryDisplayRecord
              }
              setRecord={() =>
                undefined
              }
            />

            <MyInput
              column
              disabled
              fieldLabel="Patient Responsibility"
              fieldName="patientResponsibilityAmount"
              record={
                summaryDisplayRecord
              }
              setRecord={() =>
                undefined
              }
            />

            <MyInput
              column
              disabled
              fieldLabel="Insurance Responsibility"
              fieldName="insuranceResponsibilityAmount"
              record={
                summaryDisplayRecord
              }
              setRecord={() =>
                undefined
              }
            />

            <MyInput
              column
              disabled
              fieldLabel="Patient Outstanding"
              fieldName="patientOutstandingAmount"
              record={
                summaryDisplayRecord
              }
              setRecord={() =>
                undefined
              }
            />

            <MyInput
              column
              disabled
              fieldLabel="Wallet Available"
              fieldName="walletAvailableBalance"
              record={
                summaryDisplayRecord
              }
              setRecord={() =>
                undefined
              }
            />

            <MyInput
              column
              disabled
              fieldLabel="Wallet Reserved"
              fieldName="walletReservedBalance"
              record={
                summaryDisplayRecord
              }
              setRecord={() =>
                undefined
              }
            />
          </div>
          </Panel>

          <Panel
            bordered
            className="payment-info__panel"
            header={
              <Translate>
                Receive Payment
              </Translate>
            }
          >
            <MyInput
              vr={
                validationResult
              }
              column
              fieldLabel="Payment Amount"
              fieldType="number"
              fieldName="paymentAmount"
              record={
                formState
              }
              setRecord={setFormState}
              disabled={
                isLocked
              }
            />

            <MyInput
              vr={
                validationResult
              }
              column
              required={
                formState.paymentAmount >
                0
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
              setRecord={setFormState}
              disabled={
                isLocked
              }
              searchable={
                false
              }
              isEnum
            />

            <div className="payment-info__field-note">
              Receipt, payment, and transaction numbers are generated automatically by the backend after payment is received.
            </div>

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
                    isLocked
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
                    isLocked
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
                    isLocked
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
                  isLocked
                }
              />
            ) : null}

            <MyInput
              column
              fieldLabel="Notes"
              fieldName="notes"
              record={
                formState
              }
              setRecord={setFormState}
              disabled={
                isLocked
              }
            />
          </Panel>

          <Panel
            bordered
            className="payment-info__panel"
            header={
              <Translate>
                Charge Lines
              </Translate>
            }
          >
          <div className="payment-info__table-wrapper">
            <MyTable
              data={
                summary.items ??
                []
              }
              columns={
                billedItemColumns
              }
              loading={
                loadingSummary
              }
              height={
                320
              }
              page={
                0
              }
              rowsPerPage={
                Math.max(
                  summary.items?.length ??
                    0,
                  5
                )
              }
              totalCount={
                summary.items?.length ??
                0
              }
              onPageChange={() =>
                undefined
              }
              onRowsPerPageChange={() =>
                undefined
              }
              tableButtons={
                showInternalButtons ? (
                  <div className="payment-info__table-actions">
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

                          await refetchSummary();

                          setLockAfterConfirm(
                            true
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
                        formState.paymentAmount <=
                          0
                      }
                    >
                      Receive & Reserve
                    </MyButton>
                  </div>
                ) : null
              }
            />
          </div>
          </Panel>
          </Form>
        </div>
      );
    }
  );

PatientPaymentInfo.displayName =
  'PatientPaymentInfo';

export default PatientPaymentInfo;
