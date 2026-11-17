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
    useGetTaxesByFacilityQuery,
    useLazyGetTaxesByActiveQuery,
    useLazyGetTaxesByApplicableOnQuery,
    useLazyGetTaxesByCalculationTypeQuery,
    useLazyGetTaxesByCitizenCategoryQuery,
    useLazyGetTaxesByClaimShareQuery,
    useLazyGetTaxesByCodeQuery,
    useLazyGetTaxesByDefaultQuery,
    useLazyGetTaxesByNameQuery,
    useLazyGetTaxesByPatientCopaymentQuery,
    useLazyGetTaxesByTaxTypeQuery,
    useLazyGetTaxesByValueQuery,
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

type FilterState = {
    filter: string;
    value: any;
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

const initialFilterState: FilterState = {
    filter: '',
    value: ''
};

const filterFields = [
    { label: 'Code', value: 'code' },
    { label: 'Name', value: 'name' },
    { label: 'Tax Type', value: 'taxType' },
    { label: 'Tax Value', value: 'value' },
    { label: 'Calculation', value: 'calculationType' },
    { label: 'Applicable On', value: 'applicableOn' },
    { label: 'Citizen Category', value: 'citizenCategory' },
    { label: 'Patient Copayment', value: 'applyOnPatientCopayment' },
    { label: 'Claim Share', value: 'applyOnClaimShare' },
    { label: 'Default', value: 'isDefault' },
    { label: 'Active', value: 'active' }
];

const taxedOptions = [
    { label: 'Taxed', value: true },
    { label: 'Not Taxed', value: false }
];

const isEmptyFilterValue = (value: unknown) =>
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '');

const toBoolean = (value: unknown) =>
    value === true || value === 'true';

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

        // Filter being edited in the filter bar, and the one the table currently shows
        const [recordOfFilter, setRecordOfFilter] =
            useState<FilterState>(initialFilterState);
        const [activeFilter, setActiveFilter] =
            useState<FilterState>(initialFilterState);
        const [isFiltered, setIsFiltered] = useState(false);
        const [filteredData, setFilteredData] = useState<Tax[]>([]);
        const [filteredTotal, setFilteredTotal] = useState<number>(0);
        const [isFilterLoading, setIsFilterLoading] = useState(false);

        // Filtered pagination (independent state)
        const [filterPagination, setFilterPagination] = useState({
            page: 0,
            size: 15,
            sort: 'id,desc'
        });

        const [fetchByCode] = useLazyGetTaxesByCodeQuery();
        const [fetchByName] = useLazyGetTaxesByNameQuery();
        const [fetchByTaxType] = useLazyGetTaxesByTaxTypeQuery();
        const [fetchByValue] = useLazyGetTaxesByValueQuery();
        const [fetchByCalculationType] = useLazyGetTaxesByCalculationTypeQuery();
        const [fetchByApplicableOn] = useLazyGetTaxesByApplicableOnQuery();
        const [fetchByCitizenCategory] = useLazyGetTaxesByCitizenCategoryQuery();
        const [fetchByPatientCopayment] = useLazyGetTaxesByPatientCopaymentQuery();
        const [fetchByClaimShare] = useLazyGetTaxesByClaimShareQuery();
        const [fetchByDefault] = useLazyGetTaxesByDefaultQuery();
        const [fetchByActive] = useLazyGetTaxesByActiveQuery();

        // Main list: all taxes of the facility
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
            () =>
                isFiltered
                    ? { data: filteredData, totalCount: filteredTotal }
                    : {
                        data: allTaxesQuery.data?.data ?? [],
                        totalCount: allTaxesQuery.data?.totalCount ?? 0
                    },
            [isFiltered, filteredData, filteredTotal, allTaxesQuery.data]
        );

        const isFetching = isFiltered
            ? isFilterLoading
            : allTaxesQuery.isFetching;

        // ===== Filtering =====
        const runFilterQuery = async (
            fieldName: string,
            value: any,
            page: number,
            size: number,
            sort: string
        ) => {
            const params = { facilityId: facilityId as number, page, size, sort };

            if (fieldName === 'code') {
                return await fetchByCode({ ...params, value: String(value).trim() }).unwrap();
            } else if (fieldName === 'name') {
                return await fetchByName({ ...params, value: String(value).trim() }).unwrap();
            } else if (fieldName === 'taxType') {
                return await fetchByTaxType({ ...params, taxType: value }).unwrap();
            } else if (fieldName === 'value') {
                return await fetchByValue({ ...params, value: Number(value) }).unwrap();
            } else if (fieldName === 'calculationType') {
                return await fetchByCalculationType({ ...params, calculationType: value }).unwrap();
            } else if (fieldName === 'applicableOn') {
                return await fetchByApplicableOn({ ...params, value }).unwrap();
            } else if (fieldName === 'citizenCategory') {
                return await fetchByCitizenCategory({ ...params, value }).unwrap();
            } else if (fieldName === 'applyOnPatientCopayment') {
                return await fetchByPatientCopayment({ ...params, value: toBoolean(value) }).unwrap();
            } else if (fieldName === 'applyOnClaimShare') {
                return await fetchByClaimShare({ ...params, value: toBoolean(value) }).unwrap();
            } else if (fieldName === 'isDefault') {
                return await fetchByDefault({ ...params, value: toBoolean(value) }).unwrap();
            } else if (fieldName === 'active') {
                return await fetchByActive({ ...params, value: toBoolean(value) }).unwrap();
            }

            return undefined;
        };

        // Reset to main list
        const resetToUnfiltered = () => {
            setIsFiltered(false);
            setActiveFilter(initialFilterState);
            setFilteredData([]);
            setFilteredTotal(0);
            setFilterPagination(previous => ({ ...previous, page: 0 }));
            setPaginationParams(previous => ({ ...previous, page: 0, timestamp: Date.now() }));
        };

        // Apply/Clear filters
        const handleFilterChange = async (
            fieldName: string,
            value: any,
            page = 0,
            size = filterPagination.size,
            sort = filterPagination.sort
        ) => {
            if (!facilityId) {
                return;
            }

            if (!fieldName || isEmptyFilterValue(value)) {
                resetToUnfiltered();
                return;
            }

            setIsFilterLoading(true);
            try {
                const resp = await runFilterQuery(fieldName, value, page, size, sort);
                setFilteredData(resp?.data ?? []);
                setFilteredTotal(resp?.totalCount ?? 0);
                setActiveFilter({ filter: fieldName, value });
                setIsFiltered(true);
                setFilterPagination(previous => ({ ...previous, page, size, sort }));
            } catch (error: any) {
                dispatch(
                    notify({
                        msg: extractTaxErrorMessage(error, 'Failed to load taxes'),
                        sev: 'error'
                    })
                );
            } finally {
                setIsFilterLoading(false);
            }
        };

        // Reload whatever the table shows after add/edit/delete/default/activation changes
        const refetchActiveQuery =
            async () => {
                if (isFiltered) {
                    await handleFilterChange(
                        activeFilter.filter,
                        activeFilter.value,
                        filterPagination.page
                    );
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
            setRecordOfFilter(initialFilterState);
            setActiveFilter(initialFilterState);
            setIsFiltered(false);
            setFilteredData([]);
            setFilteredTotal(0);

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

        const handleSearch = () => {
            handleFilterChange(
                recordOfFilter.filter,
                recordOfFilter.value
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
            if (isFiltered) {
                handleFilterChange(
                    activeFilter.filter,
                    activeFilter.value,
                    newPage
                );
                return;
            }

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

            if (isFiltered) {
                handleFilterChange(
                    activeFilter.filter,
                    activeFilter.value,
                    0,
                    newSize
                );
                return;
            }

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

            if (isFiltered) {
                handleFilterChange(
                    activeFilter.filter,
                    activeFilter.value,
                    0,
                    filterPagination.size,
                    `${column},${type}`
                );
                return;
            }

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
                    'citizenCategory',

                title:
                    <Translate>
                        Citizen Category
                    </Translate>,

                flexGrow:
                    2,

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

                title:
                    <Translate>
                        Patient Copayment
                    </Translate>,

                width:
                    140,

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

                title:
                    <Translate>
                        Claim Share
                    </Translate>,

                width:
                    120,

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

        const renderFilterValueInput = () => {
            const selectInput = (
                options: { label: string; value: any }[]
            ) => (
                <MyInput
                    width={220}
                    fieldName="value"
                    fieldLabel=""
                    fieldType="select"
                    selectData={options}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={recordOfFilter}
                    setRecord={setRecordOfFilter}
                    searchable={false}
                />
            );

            switch (recordOfFilter.filter) {
                case 'taxType':
                    return selectInput(taxTypeOptions ?? []);
                case 'calculationType':
                    return selectInput(calculationTypeOptions ?? []);
                case 'applicableOn':
                    return selectInput(applicableOnOptions);
                case 'citizenCategory':
                    return selectInput(citizenCategoryOptions);
                case 'applyOnPatientCopayment':
                case 'applyOnClaimShare':
                    return selectInput(taxedOptions);
                case 'isDefault':
                    return selectInput([
                        { label: 'Default', value: true },
                        { label: 'No', value: false }
                    ]);
                case 'active':
                    return selectInput([
                        { label: 'Active', value: true },
                        { label: 'Inactive', value: false }
                    ]);
                case 'value':
                    return (
                        <MyInput
                            fieldName="value"
                            fieldType="number"
                            record={recordOfFilter}
                            setRecord={setRecordOfFilter}
                            showLabel={false}
                            placeholder="Enter Value"
                            width={220}
                        />
                    );
                default:
                    return (
                        <MyInput
                            fieldName="value"
                            fieldType="text"
                            record={recordOfFilter}
                            setRecord={setRecordOfFilter}
                            showLabel={false}
                            placeholder="Enter Value"
                            width={220}
                            enterClick={handleSearch}
                        />
                    );
            }
        };

        const filters = () => (
            <Form fluid className="form-of-filters-set-up">
                <MyInput
                    selectDataValue="value"
                    selectDataLabel="label"
                    selectData={filterFields}
                    fieldName="filter"
                    fieldType="select"
                    record={recordOfFilter}
                    setRecord={(updated: FilterState) =>
                        setRecordOfFilter({
                            filter: updated.filter,
                            value: ''
                        })
                    }
                    showLabel={false}
                    placeholder="Select Filter"
                    searchable={false}
                    width="170px"
                />

                {renderFilterValueInput()}

                <MyButton
                    color="var(--deep-blue)"
                    onClick={handleSearch}
                    width="80px"
                >
                    Search
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
                        isFiltered
                            ? filterPagination.page
                            : paginationParams.page
                    }
                    rowsPerPage={
                        isFiltered
                            ? filterPagination.size
                            : paginationParams.size
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