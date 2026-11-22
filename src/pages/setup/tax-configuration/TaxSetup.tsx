import React, {
    useEffect,
    useMemo,
    useState
} from 'react';

import {
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
    useGetTaxesByFacilityQuery,
    useSetDefaultTaxMutation
} from '@/services/billing/taxService';

import type {
    Tax
} from '@/types/model-types-new';

import {
    newTax
} from '@/types/model-types-constructor-new';

import AddEditTax from './AddEditTax';

import './styles.less';

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

// Header filters: draft values typed in the inputs, applied on Enter / select change.
// Everything is sent to one endpoint and combined with AND.
const emptyHeaderFilters = {
    code: '',
    name: '',
    taxType: '',
    value: '',
    calculationType: '',
    applicableOn: '',
    citizenCategory: '',
    applyOnPatientCopayment: '',
    applyOnClaimShare: '',
    isDefault: ''
};
type HeaderFilterField = keyof typeof emptyHeaderFilters;

const taxedOptions = [
    { label: 'Taxed', value: 'true' },
    { label: 'Not Taxed', value: 'false' }
];

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

    citizenCategory:
        'Citizen Category',

    applyOnPatientCopayment:
        'Patient Copayment',

    applyOnClaimShare:
        'Claim Share',

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

        // Same choices as the Applicable On field in AddEditTax
        const billingCategoryOptions =
            useEnumOptions('BillingItemTypes', { exclude: ['PATHOLOGY'] });
        const applicableOnOptions = useMemo(
            () => [
                { value: 'INVOICE', label: 'Invoice' },
                { value: 'CHARGE_LINE', label: 'Charge Line' },
                ...billingCategoryOptions
            ],
            [billingCategoryOptions]
        );

        const citizenCategoryOptions = [
            { value: 'ALL', label: 'All' },
            { value: 'CITIZEN', label: 'Citizens' },
            { value: 'NON_CITIZEN', label: 'Non-Citizens' }
        ];

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

        const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
        const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
        // 'all' sends no active param
        const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
        const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';

        // Taxes of the facility with the applied header filters
        const allTaxesQuery =
            useGetTaxesByFacilityQuery(
                {
                    facilityId:
                        facilityId as number,

                    filters: {
                        ...appliedFilters,
                        active: activeFilter
                    },

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
                        !facilityId
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

        const activeResponse = useMemo(
            () => ({
                data: allTaxesQuery.data?.data ?? [],
                totalCount: allTaxesQuery.data?.totalCount ?? 0
            }),
            [allTaxesQuery.data]
        );

        const isFetching = allTaxesQuery.isFetching;

        // ===== Header filters =====
        // Applying one header filter also applies whatever is typed in the others
        const applyHeaderFilter = (field: HeaderFilterField, value: string) => {
            const next = { ...headerFilters, [field]: value };
            setHeaderFilters(next);
            setAppliedFilters(next);
            setPaginationParams(previous => ({ ...previous, page: 0 }));
        };

        const headerSearch = (field: HeaderFilterField, placeholder?: string) => ({
            searchable: true,
            searchPlaceholder: placeholder,
            searchValue: headerFilters[field],
            onSearchChange: (value: string) => setHeaderFilters(previous => ({ ...previous, [field]: value })),
            onSearchSubmit: (value?: string) => applyHeaderFilter(field, value ?? headerFilters[field])
        });

        const headerSelect = (field: HeaderFilterField, options: { label: string; value: string }[]) => ({
            ...headerSearch(field),
            searchType: 'select' as const,
            searchOptions: [{ label: 'All', value: '' }, ...options]
        });

        // Changing the status filter starts again from the first page
        useEffect(() => {
            setPaginationParams(previous => ({ ...previous, page: 0 }));
        }, [statusFilter]);

        // Reload the table after add/edit/delete/default/activation changes
        const refetchActiveQuery =
            async () => {
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

        // Another facility starts again from the first page
        useEffect(() => {
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

                    citizenCategory:
                        'ALL',

                    applyOnPatientCopayment:
                        true,

                    applyOnClaimShare:
                        true,

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

                ...headerSearch('code'),

                title:
                    <Translate>
                        Code
                    </Translate>,

                width:
                    130

                sortable:
                    true
            },
            {
                key:
                    'name',

                ...headerSearch('name'),

                title:
                    <Translate>
                        Name
                    </Translate>,

                width:
                    180

                sortable:
                    true
            },
            {
                key:
                    'taxType',

                ...headerSelect('taxType', taxTypeOptions ?? []),

                title:
                    <Translate>
                        Tax Type
                    </Translate>,

                width:
                    150

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

                ...headerSearch('value', 'Value'),

                title:
                    <Translate>
                        Tax Value
                    </Translate>,

                width:
                    120

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

                ...headerSelect('calculationType', calculationTypeOptions ?? []),

                title:
                    <Translate>
                        Calculation
                    </Translate>,

                width:
                    150

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

                ...headerSelect('applicableOn', applicableOnOptions),

                title:
                    <Translate>
                        Applicable On
                    </Translate>,

                width:
                    160

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
                    'citizenCategory',

                ...headerSelect('citizenCategory', citizenCategoryOptions),

                title:
                    <Translate>
                        Citizen Category
                    </Translate>,

                width:
                    160

                render: (
                    row:
                        Tax
                ) =>
                    row.citizenCategory ===
                    'CITIZEN'
                        ? 'Citizens'
                        : row.citizenCategory ===
                          'NON_CITIZEN'
                            ? 'Non-Citizens'
                            : 'All'
            },
            {
                key:
                    'applyOnPatientCopayment',

                ...headerSelect('applyOnPatientCopayment', taxedOptions),

                title:
                    <Translate>
                        Patient Copayment
                    </Translate>,

                width:
                    150

                align:
                    'center' as const,

                render: (
                    row:
                        Tax
                ) => (
                    <MyBadgeStatus
                        contant={
                            row.applyOnPatientCopayment !==
                            false
                                ? 'Taxed'
                                : 'Not Taxed'
                        }
                        color={
                            row.applyOnPatientCopayment !==
                            false
                                ? '#415be7'
                                : '#b1acac'
                        }
                    />
                )
            },
            {
                key:
                    'applyOnClaimShare',

                ...headerSelect('applyOnClaimShare', taxedOptions),

                title:
                    <Translate>
                        Claim Share
                    </Translate>,

                width:
                    140

                align:
                    'center' as const,

                render: (
                    row:
                        Tax
                ) => (
                    <MyBadgeStatus
                        contant={
                            row.applyOnClaimShare !==
                            false
                                ? 'Taxed'
                                : 'Not Taxed'
                        }
                        color={
                            row.applyOnClaimShare !==
                            false
                                ? '#415be7'
                                : '#b1acac'
                        }
                    />
                )
            },
            {
                key:
                    'isDefault',

                ...headerSelect('isDefault', [
                    { label: 'Default', value: 'true' },
                    { label: 'No', value: 'false' }
                ]),

                title:
                    <Translate>
                        Default
                    </Translate>,

                width:
                    110

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

                searchable: true,
                searchType: 'select' as const,
                searchOptions: [
                    { label: 'Active', value: 'active' },
                    { label: 'Inactive', value: 'inactive' },
                    { label: 'All', value: 'all' }
                ],
                searchValue: statusFilter,
                onSearchChange: (value: string) => setStatusFilter(value as 'active' | 'inactive' | 'all'),

                title:
                    <Translate>
                        Active
                    </Translate>,

                width:
                    120

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