import React, {
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    Form,
    Panel
} from 'rsuite';

import {
    MdDelete,
    MdModeEdit,
    MdStar,
    MdStarBorder,
    MdToggleOff,
    MdToggleOn
} from 'react-icons/md';

import AddOutlineIcon from '@rsuite/icons/AddOutline';

import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

import {
    useAppDispatch
} from '@/hooks';

import {
    setDivContent,
    setPageCode
} from '@/reducers/divSlice';

import {
    notify
} from '@/utils/uiReducerActions';

import {
    conjureValueBasedOnIDFromList,
    formatEnumString
} from '@/utils';

import {
    useEnumOptions
} from '@/services/enumsApi';

import {
    useGetAllFacilitiesQuery
} from '@/services/security/facilityService';

import {
    useChangeTaxActivationStatusMutation,
    useDeleteTaxMutation,
    useGetTaxesByCalculationTypeQuery,
    useGetTaxesByCodeQuery,
    useGetTaxesByFacilityQuery,
    useGetTaxesByNameQuery,
    useGetTaxesByTaxTypeQuery,
    useSetDefaultTaxMutation
} from '@/services/billing/taxService';

import type {
    Tax,
    TaxCalculationType,
    TaxType
} from '@/types/model-types-new';

import {
    newTax
} from '@/types/model-types-constructor-new';

import AddEditTax from './AddEditTax';

import './styles.less';

type FilterCriteria =
    | ''
    | 'code'
    | 'name'
    | 'taxType'
    | 'calculationType';

type TaxFilter = {
    criteria:
    FilterCriteria;

    textValue:
    string;

    taxType:
    TaxType | '';

    calculationType:
    TaxCalculationType | '';
};

type ApiFieldError = {
    field?: string;
    message?: string;
};

type ApiErrorData = {
    message?: string;
    title?: string;
    detail?: string;
    type?: string;

    traceId?: string;
    requestId?: string;
    correlationId?: string;

    fieldErrors?:
    ApiFieldError[];
};

const filterCriteriaOptions = [
    {
        label:
            'Code',

        value:
            'code'
    },
    {
        label:
            'Name',

        value:
            'name'
    },
    {
        label:
            'Tax Type',

        value:
            'taxType'
    },
    {
        label:
            'Calculation Type',

        value:
            'calculationType'
    }
];

const initialTaxFilter:
    TaxFilter = {
    criteria:
        '',

    textValue:
        '',

    taxType:
        '',

    calculationType:
        ''
};

const taxFieldLabels:
    Record<string, string> = {
    id:
        'Tax ID',

    facilityId:
        'Facility',

    code:
        'Tax Code',

    name:
        'Tax Name',

    taxType:
        'Tax Type',

    percentage:
        'Percentage',

    fixedAmount:
        'Fixed Amount',

    currency:
        'Currency',

    calculationType:
        'Calculation Type',

    applicableOn:
        'Applicable On',

    validFrom:
        'Valid From',

    validTo:
        'Valid To',

    isDefault:
        'Default',

    active:
        'Active',

    description:
        'Description'
};

const taxErrorKeyMessages:
    Record<string, string> = {
    'payload.required':
        'Tax payload is required.',

    'id.exists':
        'A new tax cannot already have an ID.',

    'id.required':
        'Tax ID is required.',

    'id.mismatch':
        'The tax ID does not match the requested record.',

    'facility.required':
        'Facility is required.',

    'facility.notfound':
        'The selected facility was not found.',

    'facility.invalid':
        'The selected facility is invalid.',

    'code.required':
        'Tax code is required.',

    'code.exists':
        'Tax code already exists for this facility.',

    'name.en.required':
        'Tax name is required.',

    'type.required':
        'Tax type is required.',

    'calculation.type.required':
        'Calculation type is required.',

    'applicable.on.required':
        'Applicable On is required.',

    'valid.from.required':
        'Valid From date is required.',

    'valid.period.invalid':
        'Valid To date cannot be before Valid From date.',

    'percentage.required':
        'Percentage is required for percentage tax.',

    'percentage.invalid':
        'Tax percentage must be between 0 and 100.',

    'fixed.amount.required':
        'Fixed amount is required for fixed amount tax.',

    'fixed.amount.invalid':
        'Fixed tax amount cannot be negative.',

    'currency.required':
        'Currency is required for fixed amount tax.',

    'currency.invalid':
        'The selected currency is invalid.',

    'default.inactive':
        'Inactive tax cannot be set as default. Activate it first.',

    'default.invalid.period':
        'Expired or future tax cannot be set as default.',

    'default.notfound':
        'No active default tax exists for this facility.',

    'active.delete':
        'Active tax cannot be deleted. Deactivate it first.',

    'tax.in.use':
        'This tax is already used and cannot be deleted.',

    'db.constraint':
        'Database constraint violation while saving tax.',

    notfound:
        'Tax record was not found.'
};

const normalizeValidationMessage = (
    message?: string
) => {
    const normalized =
        String(
            message ??
            ''
        ).toLowerCase();

    if (
        normalized.includes(
            'must not be null'
        )
    ) {
        return 'is required';
    }

    if (
        normalized.includes(
            'must not be blank'
        )
    ) {
        return 'must not be blank';
    }

    if (
        normalized.includes(
            'size must be between'
        )
    ) {
        return 'length is out of range';
    }

    if (
        normalized.includes(
            'must be greater than or equal'
        )
    ) {
        return 'value is too small';
    }

    if (
        normalized.includes(
            'must be greater'
        )
    ) {
        return 'value is too small';
    }

    if (
        normalized.includes(
            'must be less than or equal'
        )
    ) {
        return 'value is too large';
    }

    if (
        normalized.includes(
            'must be less'
        )
    ) {
        return 'value is too large';
    }

    return (
        message ||
        'invalid value'
    );
};

const extractTaxErrorMessage = (
    error:
        any,
    fallbackMessage:
        string
) => {
    const data:
        ApiErrorData =
        error?.data ??
        {};

    const traceId =
        data.traceId ||
        data.requestId ||
        data.correlationId;

    const traceSuffix =
        traceId
            ? `\nTrace ID: ${traceId}`
            : '';

    const isValidationError =
        data.message ===
        'error.validation' ||
        data.title ===
        'Method argument not valid' ||
        (
            typeof data.type ===
            'string' &&
            data.type.includes(
                'constraint-violation'
            )
        );

    if (
        isValidationError &&
        Array.isArray(
            data.fieldErrors
        ) &&
        data.fieldErrors.length >
        0
    ) {
        const lines =
            data.fieldErrors.map(
                fieldError => {
                    const fieldName =
                        fieldError.field ||
                        'Field';

                    const label =
                        taxFieldLabels[
                        fieldName
                        ] ??
                        formatEnumString(
                            fieldName
                        );

                    return `• ${label}: ${normalizeValidationMessage(
                        fieldError.message
                    )}`;
                }
            );

        return (
            `Please fix the following fields:\n${lines.join(
                '\n'
            )}${traceSuffix}`
        );
    }

    const rawMessage =
        data.message ||
        '';

    const errorKey =
        rawMessage.startsWith(
            'error.'
        )
            ? rawMessage.substring(
                6
            )
            : rawMessage;

    const mappedMessage =
        errorKey
            ? taxErrorKeyMessages[
            errorKey
            ]
            : undefined;

    /*
     * JHipster BadRequestAlertException sometimes returns:
     *
     * title = "Bad Request"
     * detail = null
     * message = "error.default.inactive"
     *
     * The mapped backend key must therefore be checked before title.
     */
    const usefulDetail =
        data.detail &&
            data.detail !==
            'null'
            ? data.detail
            : undefined;

    const usefulTitle =
        data.title &&
            ![
                'Bad Request',
                'Internal Server Error',
                'Method argument not valid'
            ].includes(
                data.title
            )
            ? data.title
            : undefined;

    const humanMessage =
        mappedMessage ||
        usefulDetail ||
        usefulTitle ||
        fallbackMessage;

    return (
        humanMessage +
        traceSuffix
    );
};

const TaxSetup:
    React.FC = () => {
        const dispatch =
            useAppDispatch();

        const tenant =
            JSON.parse(
                localStorage.getItem(
                    'tenant'
                ) || 'null'
            );

        const selectedFacility =
            tenant?.selectedFacility ||
            null;

        const facilityId:
            number | undefined =
            selectedFacility?.id;

        const taxTypeOptions =
            useEnumOptions(
                'TaxType'
            );

        const calculationTypeOptions =
            useEnumOptions(
                'TaxCalculationType'
            );

        const [
            selectedTax,
            setSelectedTax
        ] =
            useState<Tax>({
                ...newTax
            });

        const [
            modalOpen,
            setModalOpen
        ] =
            useState(
                false
            );

        const [
            deleteConfirmationOpen,
            setDeleteConfirmationOpen
        ] =
            useState(
                false
            );

        const [
            width,
            setWidth
        ] =
            useState(
                typeof window !==
                    'undefined'
                    ? window.innerWidth
                    : 1200
            );

        const [
            paginationParams,
            setPaginationParams
        ] =
            useState({
                page:
                    0,

                size:
                    15,

                sort:
                    'id,desc',

                timestamp:
                    Date.now()
            });

        const [
            sortColumn,
            setSortColumn
        ] =
            useState<string>(
                'id'
            );

        const [
            sortType,
            setSortType
        ] =
            useState<
                'asc' | 'desc'
            >(
                'desc'
            );

        const [
            taxFilter,
            setTaxFilter
        ] =
            useState<TaxFilter>({
                ...initialTaxFilter
            });

        const [
            appliedTaxFilter,
            setAppliedTaxFilter
        ] =
            useState<TaxFilter>({
                ...initialTaxFilter
            });

        const hasCodeFilter =
            appliedTaxFilter.criteria ===
            'code' &&
            Boolean(
                appliedTaxFilter.textValue
                    .trim()
            );

        const hasNameFilter =
            appliedTaxFilter.criteria ===
            'name' &&
            Boolean(
                appliedTaxFilter.textValue
                    .trim()
            );

        const hasTaxTypeFilter =
            appliedTaxFilter.criteria ===
            'taxType' &&
            Boolean(
                appliedTaxFilter.taxType
            );

        const hasCalculationTypeFilter =
            appliedTaxFilter.criteria ===
            'calculationType' &&
            Boolean(
                appliedTaxFilter
                    .calculationType
            );

        const hasAnyFilter =
            hasCodeFilter ||
            hasNameFilter ||
            hasTaxTypeFilter ||
            hasCalculationTypeFilter;

        const allTaxesQuery =
            useGetTaxesByFacilityQuery(
                {
                    facilityId:
                        facilityId as number,

                    page:
                        paginationParams.page,

                    size:
                        paginationParams.size,

                    sort:
                        paginationParams.sort,

                    timestamp:
                        paginationParams.timestamp
                },
                {
                    skip:
                        !facilityId ||
                        hasAnyFilter
                }
            );

        const taxesByCodeQuery =
            useGetTaxesByCodeQuery(
                {
                    facilityId:
                        facilityId as number,

                    value:
                        appliedTaxFilter
                            .textValue,

                    page:
                        paginationParams.page,

                    size:
                        paginationParams.size,

                    sort:
                        paginationParams.sort,

                    timestamp:
                        paginationParams.timestamp
                },
                {
                    skip:
                        !facilityId ||
                        !hasCodeFilter
                }
            );

        const taxesByNameQuery =
            useGetTaxesByNameQuery(
                {
                    facilityId:
                        facilityId as number,

                    value:
                        appliedTaxFilter
                            .textValue,

                    page:
                        paginationParams.page,

                    size:
                        paginationParams.size,

                    sort:
                        paginationParams.sort,

                    timestamp:
                        paginationParams.timestamp
                },
                {
                    skip:
                        !facilityId ||
                        !hasNameFilter
                }
            );

        const taxesByTaxTypeQuery =
            useGetTaxesByTaxTypeQuery(
                {
                    facilityId:
                        facilityId as number,

                    taxType:
                        appliedTaxFilter
                            .taxType as
                        TaxType,

                    page:
                        paginationParams.page,

                    size:
                        paginationParams.size,

                    sort:
                        paginationParams.sort,

                    timestamp:
                        paginationParams.timestamp
                },
                {
                    skip:
                        !facilityId ||
                        !hasTaxTypeFilter
                }
            );

        const taxesByCalculationTypeQuery =
            useGetTaxesByCalculationTypeQuery(
                {
                    facilityId:
                        facilityId as number,

                    calculationType:
                        appliedTaxFilter
                            .calculationType as
                        TaxCalculationType,

                    page:
                        paginationParams.page,

                    size:
                        paginationParams.size,

                    sort:
                        paginationParams.sort,

                    timestamp:
                        paginationParams.timestamp
                },
                {
                    skip:
                        !facilityId ||
                        !hasCalculationTypeFilter
                }
            );

        const {
            data:
            facilityListResponse
        } =
            useGetAllFacilitiesQuery({});

        const [
            deleteTax,
            {
                isLoading:
                isDeleting
            }
        ] =
            useDeleteTaxMutation();

        const [
            changeActivationStatus,
            {
                isLoading:
                isChangingActivation
            }
        ] =
            useChangeTaxActivationStatusMutation();

        const [
            setDefaultTax,
            {
                isLoading:
                isSettingDefault
            }
        ] =
            useSetDefaultTaxMutation();

        const activeResponse =
            useMemo(() => {
                if (
                    hasCodeFilter
                ) {
                    return {
                        data:
                            taxesByCodeQuery
                                .data?.data ??
                            [],

                        totalCount:
                            taxesByCodeQuery
                                .data
                                ?.totalCount ??
                            0
                    };
                }

                if (
                    hasNameFilter
                ) {
                    return {
                        data:
                            taxesByNameQuery
                                .data?.data ??
                            [],

                        totalCount:
                            taxesByNameQuery
                                .data
                                ?.totalCount ??
                            0
                    };
                }

                if (
                    hasTaxTypeFilter
                ) {
                    return {
                        data:
                            taxesByTaxTypeQuery
                                .data?.data ??
                            [],

                        totalCount:
                            taxesByTaxTypeQuery
                                .data
                                ?.totalCount ??
                            0
                    };
                }

                if (
                    hasCalculationTypeFilter
                ) {
                    return {
                        data:
                            taxesByCalculationTypeQuery
                                .data?.data ??
                            [],

                        totalCount:
                            taxesByCalculationTypeQuery
                                .data
                                ?.totalCount ??
                            0
                    };
                }

                return {
                    data:
                        allTaxesQuery
                            .data?.data ??
                        [],

                    totalCount:
                        allTaxesQuery
                            .data?.totalCount ??
                        0
                };
            }, [
                hasCodeFilter,
                hasNameFilter,
                hasTaxTypeFilter,
                hasCalculationTypeFilter,
                taxesByCodeQuery.data,
                taxesByNameQuery.data,
                taxesByTaxTypeQuery.data,
                taxesByCalculationTypeQuery.data,
                allTaxesQuery.data
            ]);

        const isFetching =
            allTaxesQuery
                .isFetching ||
            taxesByCodeQuery
                .isFetching ||
            taxesByNameQuery
                .isFetching ||
            taxesByTaxTypeQuery
                .isFetching ||
            taxesByCalculationTypeQuery
                .isFetching;

        const refetchActiveQuery =
            async () => {
                if (
                    hasCodeFilter
                ) {
                    await taxesByCodeQuery
                        .refetch();

                    return;
                }

                if (
                    hasNameFilter
                ) {
                    await taxesByNameQuery
                        .refetch();

                    return;
                }

                if (
                    hasTaxTypeFilter
                ) {
                    await taxesByTaxTypeQuery
                        .refetch();

                    return;
                }

                if (
                    hasCalculationTypeFilter
                ) {
                    await taxesByCalculationTypeQuery
                        .refetch();

                    return;
                }

                await allTaxesQuery
                    .refetch();
            };

        useEffect(() => {
            dispatch(
                setPageCode(
                    'TaxSetup'
                )
            );

            dispatch(
                setDivContent(
                    'Tax Setup'
                )
            );

            return () => {
                dispatch(
                    setPageCode('')
                );

                dispatch(
                    setDivContent('')
                );
            };
        }, [
            dispatch
        ]);

        useEffect(() => {
            const resizeHandler =
                () => {
                    setWidth(
                        window.innerWidth
                    );
                };

            window.addEventListener(
                'resize',
                resizeHandler
            );

            return () => {
                window.removeEventListener(
                    'resize',
                    resizeHandler
                );
            };
        }, []);

        useEffect(() => {
            setTaxFilter({
                ...initialTaxFilter
            });

            setAppliedTaxFilter({
                ...initialTaxFilter
            });

            setPaginationParams(
                previous => ({
                    ...previous,

                    page:
                        0,

                    timestamp:
                        Date.now()
                })
            );
        }, [
            facilityId
        ]);

        const handleResetFilter =
            () => {
                setTaxFilter({
                    ...initialTaxFilter
                });

                setAppliedTaxFilter({
                    ...initialTaxFilter
                });

                setPaginationParams(
                    previous => ({
                        ...previous,

                        page:
                            0,

                        timestamp:
                            Date.now()
                    })
                );
            };

        const handleSearch =
            () => {
                const {
                    criteria,
                    textValue,
                    taxType,
                    calculationType
                } =
                    taxFilter;

                const valid =
                    (
                        (
                            criteria ===
                            'code' ||
                            criteria ===
                            'name'
                        ) &&
                        Boolean(
                            textValue.trim()
                        )
                    ) ||
                    (
                        criteria ===
                        'taxType' &&
                        Boolean(
                            taxType
                        )
                    ) ||
                    (
                        criteria ===
                        'calculationType' &&
                        Boolean(
                            calculationType
                        )
                    );

                if (!valid) {
                    handleResetFilter();

                    return;
                }

                setAppliedTaxFilter({
                    criteria,

                    textValue:
                        textValue.trim(),

                    taxType,

                    calculationType
                });

                setPaginationParams(
                    previous => ({
                        ...previous,

                        page:
                            0,

                        timestamp:
                            Date.now()
                    })
                );
            };

        const handleNew =
            () => {
                setSelectedTax({
                    ...newTax,

                    facilityId,

                    taxType:
                        'PERCENTAGE',

                    calculationType:
                        'EXCLUSIVE',

                    applicableOn:
                        'INVOICE',

                    validFrom:
                        new Date()
                            .toISOString()
                            .slice(
                                0,
                                10
                            ),

                    isDefault:
                        false,

                    active:
                        true
                });

                setModalOpen(
                    true
                );
            };

        const handleEdit = (
            row:
                Tax
        ) => {
            setSelectedTax({
                ...row
            });

            setModalOpen(
                true
            );
        };

        const handleDeleteRequest = (
            row:
                Tax
        ) => {
            setSelectedTax({
                ...row
            });

            setDeleteConfirmationOpen(
                true
            );
        };

        const handleDelete =
            async () => {
                if (
                    !selectedTax.id
                ) {
                    return;
                }

                try {
                    await deleteTax({
                        id:
                            selectedTax.id
                    }).unwrap();

                    dispatch(
                        notify({
                            msg:
                                'Tax deleted successfully',

                            sev:
                                'success'
                        })
                    );

                    setDeleteConfirmationOpen(
                        false
                    );

                    setSelectedTax({
                        ...newTax
                    });

                    await refetchActiveQuery();
                } catch (
                error:
                    any
                ) {
                    dispatch(
                        notify({
                            msg:
                                extractTaxErrorMessage(
                                    error,
                                    'Failed to delete tax'
                                ),

                            sev:
                                'error'
                        })
                    );
                }
            };

        const handleActivationChange =
            async (
                row:
                    Tax
            ) => {
                if (
                    !row.id
                ) {
                    return;
                }

                try {
                    await changeActivationStatus({
                        id:
                            row.id,

                        active:
                            !Boolean(
                                row.active
                            )
                    }).unwrap();

                    dispatch(
                        notify({
                            msg:
                                row.active
                                    ? 'Tax deactivated successfully'
                                    : 'Tax activated successfully',

                            sev:
                                'success'
                        })
                    );

                    await refetchActiveQuery();
                } catch (
                error:
                    any
                ) {
                    dispatch(
                        notify({
                            msg:
                                extractTaxErrorMessage(
                                    error,
                                    'Failed to update tax activation status'
                                ),

                            sev:
                                'error'
                        })
                    );
                }
            };

        const handleSetDefault =
            async (
                row:
                    Tax
            ) => {
                if (
                    !row.id ||
                    row.isDefault
                ) {
                    return;
                }

                try {
                    await setDefaultTax({
                        id:
                            row.id
                    }).unwrap();

                    dispatch(
                        notify({
                            msg:
                                'Default tax updated successfully',

                            sev:
                                'success'
                        })
                    );

                    await refetchActiveQuery();
                } catch (
                error:
                    any
                ) {
                    dispatch(
                        notify({
                            msg:
                                extractTaxErrorMessage(
                                    error,
                                    'Failed to set default tax'
                                ),

                            sev:
                                'error'
                        })
                    );
                }
            };

        const handleSaveSuccess =
            async () => {
                setModalOpen(
                    false
                );

                setPaginationParams(
                    previous => ({
                        ...previous,

                        page:
                            0,

                        timestamp:
                            Date.now()
                    })
                );

                await refetchActiveQuery();
            };

        const handlePageChange = (
            _event:
                unknown,
            newPage:
                number
        ) => {
            setPaginationParams(
                previous => ({
                    ...previous,

                    page:
                        newPage,

                    timestamp:
                        Date.now()
                })
            );
        };

        const handleRowsPerPageChange = (
            event:
                React.ChangeEvent<HTMLInputElement>
        ) => {
            const newSize =
                Number(
                    event.target.value
                );

            setPaginationParams(
                previous => ({
                    ...previous,

                    page:
                        0,

                    size:
                        newSize,

                    timestamp:
                        Date.now()
                })
            );
        };

        const handleSortChange = (
            column:
                string,
            type:
                'asc' | 'desc'
        ) => {
            setSortColumn(
                column
            );

            setSortType(
                type
            );

            setPaginationParams(
                previous => ({
                    ...previous,

                    sort:
                        `${column},${type}`,

                    page:
                        0,

                    timestamp:
                        Date.now()
                })
            );
        };

        const tableColumns = [
            {
                key:
                    'facilityId',

                title:
                    <Translate>
                        Facility
                    </Translate>,

                flexGrow:
                    2,

                render: (
                    row:
                        Tax
                ) =>
                    conjureValueBasedOnIDFromList(
                        facilityListResponse ??
                        [],
                        row.facilityId,
                        'name'
                    )
            },
            {
                key:
                    'code',

                title:
                    <Translate>
                        Code
                    </Translate>,

                flexGrow:
                    2,

                sortable:
                    true
            },
            {
                key:
                    'name',

                title:
                    <Translate>
                        Name
                    </Translate>,

                flexGrow:
                    3,

                sortable:
                    true
            },
            {
                key:
                    'taxType',

                title:
                    <Translate>
                        Tax Type
                    </Translate>,

                flexGrow:
                    2,

                sortable:
                    true,

                render: (
                    row:
                        Tax
                ) =>
                    row.taxType
                        ? formatEnumString(
                            row.taxType
                        )
                        : '-'
            },
            {
                key:
                    'value',

                title:
                    <Translate>
                        Tax Value
                    </Translate>,

                flexGrow:
                    2,

                render: (
                    row:
                        Tax
                ) => {
                    if (
                        row.taxType ===
                        'PERCENTAGE'
                    ) {
                        return `${row.percentage ?? 0}%`;
                    }

                    return `${row.fixedAmount ?? 0} ${row.currency ?? ''}`.trim();
                }
            },
            {
                key:
                    'calculationType',

                title:
                    <Translate>
                        Calculation
                    </Translate>,

                flexGrow:
                    2,

                sortable:
                    true,

                render: (
                    row:
                        Tax
                ) =>
                    row.calculationType
                        ? formatEnumString(
                            row.calculationType
                        )
                        : '-'
            },
            {
                key:
                    'applicableOn',

                title:
                    <Translate>
                        Applicable On
                    </Translate>,

                flexGrow:
                    2,

                render: (
                    row:
                        Tax
                ) =>
                    row.applicableOn
                        ? formatEnumString(
                            row.applicableOn
                        )
                        : '-'
            },
            {
                key:
                    'isDefault',

                title:
                    <Translate>
                        Default
                    </Translate>,

                width:
                    95,

                align:
                    'center' as const,

                render: (
                    row:
                        Tax
                ) => (
                    <MyBadgeStatus
                        contant={
                            row.isDefault
                                ? 'Default'
                                : 'No'
                        }
                        color={
                            row.isDefault
                                ? '#415be7'
                                : '#b1acac'
                        }
                    />
                )
            },
            {
                key:
                    'active',

                title:
                    <Translate>
                        Active
                    </Translate>,

                width:
                    95,

                align:
                    'center' as const,

                render: (
                    row:
                        Tax
                ) => (
                    <MyBadgeStatus
                        contant={
                            row.active
                                ? 'Active'
                                : 'Inactive'
                        }
                        color={
                            row.active
                                ? '#415be7'
                                : '#b1acac'
                        }
                    />
                )
            },
            {
                key:
                    'actions',

                title:
                    <Translate>
                        Actions
                    </Translate>,

                width:
                    185,

                align:
                    'center' as const,

                render: (
                    row:
                        Tax
                ) => (
                    <div className="container-of-icons">
                        <MdModeEdit
                            className="icons-style"
                            title="Edit"
                            size={23}
                            fill="var(--primary-gray)"
                            onClick={() =>
                                handleEdit(
                                    row
                                )
                            }
                        />

                        {row.isDefault ? (
                            <MdStar
                                className="icons-style"
                                title="Default Tax"
                                size={24}
                                fill="var(--deep-blue)"
                            />
                        ) : (
                            <MdStarBorder
                                className="icons-style"
                                title={
                                    row.active
                                        ? 'Set as Default'
                                        : 'Inactive tax cannot be default'
                                }
                                size={24}
                                fill={
                                    row.active
                                        ? 'var(--primary-gray)'
                                        : '#b1acac'
                                }
                                onClick={() =>
                                    handleSetDefault(
                                        row
                                    )
                                }
                            />
                        )}

                        {row.active ? (
                            <MdToggleOn
                                className="icons-style"
                                title="Deactivate"
                                size={28}
                                fill="var(--deep-blue)"
                                onClick={() =>
                                    handleActivationChange(
                                        row
                                    )
                                }
                            />
                        ) : (
                            <MdToggleOff
                                className="icons-style"
                                title="Activate"
                                size={28}
                                fill="var(--primary-gray)"
                                onClick={() =>
                                    handleActivationChange(
                                        row
                                    )
                                }
                            />
                        )}

                        <MdDelete
                            className="icons-style"
                            title="Delete"
                            size={23}
                            fill="var(--primary-pink)"
                            onClick={() =>
                                handleDeleteRequest(
                                    row
                                )
                            }
                        />
                    </div>
                )
            }
        ];

        const filters =
            () => (
                <Form
                    fluid
                    className="form-of-filters-set-up"
                >
                    <MyInput
                        width="190px"
                        fieldName="criteria"
                        fieldType="select"
                        selectData={
                            filterCriteriaOptions
                        }
                        selectDataLabel="label"
                        selectDataValue="value"
                        record={
                            taxFilter
                        }
                        setRecord={(
                            updated:
                                any
                        ) => {
                            const next =
                                typeof updated ===
                                    'function'
                                    ? updated(
                                        taxFilter
                                    )
                                    : updated;

                            const nextCriteria =
                                (
                                    next?.criteria ??
                                    ''
                                ) as
                                FilterCriteria;

                            if (
                                !nextCriteria
                            ) {
                                handleResetFilter();

                                return;
                            }

                            setTaxFilter({
                                ...initialTaxFilter,

                                criteria:
                                    nextCriteria
                            });
                        }}
                        showLabel={false}
                        placeholder="Select Criteria"
                        searchable={false}
                    />

                    {(
                        taxFilter.criteria ===
                        'code' ||
                        taxFilter.criteria ===
                        'name'
                    ) && (
                            <MyInput
                                width="240px"
                                fieldName="textValue"
                                record={
                                    taxFilter
                                }
                                setRecord={
                                    setTaxFilter
                                }
                                showLabel={false}
                                placeholder={
                                    taxFilter.criteria ===
                                        'code'
                                        ? 'Enter Tax Code'
                                        : 'Enter Tax Name'
                                }
                            />
                        )}

                    {taxFilter.criteria ===
                        'taxType' && (
                            <MyInput
                                width="220px"
                                fieldName="taxType"
                                fieldType="select"
                                selectData={
                                    taxTypeOptions
                                }
                                selectDataLabel="label"
                                selectDataValue="value"
                                record={
                                    taxFilter
                                }
                                setRecord={
                                    setTaxFilter
                                }
                                showLabel={false}
                                placeholder="Select Tax Type"
                                searchable={false}
                            />
                        )}

                    {taxFilter.criteria ===
                        'calculationType' && (
                            <MyInput
                                width="240px"
                                fieldName="calculationType"
                                fieldType="select"
                                selectData={
                                    calculationTypeOptions
                                }
                                selectDataLabel="label"
                                selectDataValue="value"
                                record={
                                    taxFilter
                                }
                                setRecord={
                                    setTaxFilter
                                }
                                showLabel={false}
                                placeholder="Select Calculation Type"
                                searchable={false}
                            />
                        )}

                    <MyButton
                        color="var(--deep-blue)"
                        onClick={
                            handleSearch
                        }
                        width="80px"
                    >
                        Search
                    </MyButton>

                    <MyButton
                        color="var(--primary-gray)"
                        onClick={
                            handleResetFilter
                        }
                        width="80px"
                    >
                        Clear
                    </MyButton>
                </Form>
            );

        const selectedRowClass = (
            row:
                Tax
        ) =>
            row?.id ===
                selectedTax?.id
                ? 'selected-row'
                : '';

        const direction =
            localStorage.getItem(
                'direction'
            ) ||
            'LTR';

        const dir =
            direction ===
                'RTL'
                ? 'rtl'
                : 'ltr';

        return (
            <Panel dir={dir}>
                <MyTable
                    data={
                        activeResponse.data
                    }
                    totalCount={
                        activeResponse.totalCount
                    }
                    loading={
                        isFetching ||
                        isDeleting ||
                        isChangingActivation ||
                        isSettingDefault
                    }
                    columns={
                        tableColumns
                    }
                    rowClassName={
                        selectedRowClass
                    }
                    onRowClick={row =>
                        setSelectedTax(
                            row
                        )
                    }
                    filters={
                        filters()
                    }
                    page={
                        paginationParams.page
                    }
                    rowsPerPage={
                        paginationParams.size
                    }
                    onPageChange={
                        handlePageChange
                    }
                    onRowsPerPageChange={
                        handleRowsPerPageChange
                    }
                    sortColumn={
                        sortColumn
                    }
                    sortType={
                        sortType
                    }
                    onSortChange={
                        handleSortChange
                    }
                    tableButtons={
                        <div className="container-of-add-new-button">
                            <MyButton
                                prefixIcon={() => (
                                    <AddOutlineIcon />
                                )}
                                color="var(--deep-blue)"
                                onClick={
                                    handleNew
                                }
                                width="125px"
                                disabled={
                                    !facilityId
                                }
                            >
                                Add New
                            </MyButton>
                        </div>
                    }
                />

                <AddEditTax
                    open={
                        modalOpen
                    }
                    setOpen={
                        setModalOpen
                    }
                    width={
                        width
                    }
                    tax={
                        selectedTax
                    }
                    setTax={
                        setSelectedTax
                    }
                    onSaveSuccess={
                        handleSaveSuccess
                    }
                />

                <DeletionConfirmationModal
                    open={
                        deleteConfirmationOpen
                    }
                    setOpen={
                        setDeleteConfirmationOpen
                    }
                    itemToDelete="Tax"
                    actionButtonFunction={
                        handleDelete
                    }
                    actionType="delete"
                />
            </Panel>
        );
    };

export default TaxSetup;