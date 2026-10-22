import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox, Form, Modal, Panel } from 'rsuite';
import { MdKeyboardArrowDown } from 'react-icons/md';

import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import SectionContainer from '@/components/SectionsoContainer';

import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';
import { Payor } from '@/types/model-types-new';
import { useGetAllPayorsQuery } from '@/services/setup/payer/PayorService';
import {
  SupportiveDocumentMedicalSheetAvailability,
  SupportiveDocumentRequirementCatalogItem,
  useGetPayorSupportiveDocumentRequirementsQuery,
  useGetSupportiveDocumentMedicalSheetsQuery,
  useGetSupportiveDocumentRequirementCatalogQuery,
  useReplacePayorSupportiveDocumentRequirementsMutation
} from '@/services/setup/payer/SupportiveDocumentRequirementService';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';

import './styles.less';

type SheetGroup = {
  medicalSheetCode: string;
  medicalSheetName: string;
  medicalSheetPath: string;
  supported: boolean;
  unsupportedReason?: string | null;
  displayOrder: number;
  requirements: SupportiveDocumentRequirementCatalogItem[];
};

const normalizeCodes = (
  codes: string[] | undefined | null
): string[] =>
  Array.from(
    new Set(
      (codes ?? [])
        .filter(
          code => typeof code === 'string' && code.trim() !== ''
        )
        .map(code => code.trim().toUpperCase())
    )
  ).sort();

const sameCodeSet = (a: string[], b: string[]) => {
  const left = normalizeCodes(a);
  const right = normalizeCodes(b);

  return (
    left.length === right.length &&
    left.every((code, index) => code === right[index])
  );
};

const SupportiveDocumentSetup = () => {
  const dispatch = useAppDispatch();

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const [selectedPayor, setSelectedPayor] =
    useState<Payor | null>(null);

  const [pendingPayor, setPendingPayor] =
    useState<Payor | null>(null);

  const [confirmSwitchOpen, setConfirmSwitchOpen] =
    useState(false);

  const [expandedSheets, setExpandedSheets] = useState<string[]>(
    []
  );

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'name,asc'
  });

  const [searchDraft, setSearchDraft] = useState({
    name: '',
    code: ''
  });

  const [appliedSearch, setAppliedSearch] = useState<{
    name?: string;
    code?: string;
  }>({});

  const [requirementSearch, setRequirementSearch] = useState({
    value: ''
  });

  const [selectedCodes, setSelectedCodes] = useState<string[]>(
    []
  );

  const [baselineCodes, setBaselineCodes] = useState<string[]>(
    []
  );

  const [configured, setConfigured] =
    useState<boolean | null>(null);

  const [editorPayorId, setEditorPayorId] =
    useState<number | null>(null);

  const [saveSnapshotPayorId, setSaveSnapshotPayorId] =
    useState<number | null>(null);

  const dirtyRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const selectedPayorIdRef = useRef<number | null>(null);

  const selectedPayorId = selectedPayor?.id ?? null;
  selectedPayorIdRef.current = selectedPayorId;

  const {
    data: payorListResponse,
    isFetching: isPayorFetching
  } = useGetAllPayorsQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort,
    ...(appliedSearch.name
      ? { name: appliedSearch.name }
      : {}),
    ...(appliedSearch.code
      ? { code: appliedSearch.code }
      : {})
  });

  const {
    data: catalog,
    isLoading: isCatalogLoading,
    isError: isCatalogError,
    refetch: refetchCatalog
  } = useGetSupportiveDocumentRequirementCatalogQuery();

  const {
    data: medicalSheets,
    isLoading: isMedicalSheetsLoading,
    isError: isMedicalSheetsError,
    refetch: refetchMedicalSheets
  } = useGetSupportiveDocumentMedicalSheetsQuery();

  const {
    currentData: configData,
    isLoading: isConfigLoading,
    isFetching: isConfigFetching,
    isError: isConfigError,
    refetch: refetchConfig
  } = useGetPayorSupportiveDocumentRequirementsQuery(
    selectedPayorId as number,
    {
      skip: selectedPayorId == null
    }
  );

  const [replaceConfig, { isLoading: isSaving }] =
    useReplacePayorSupportiveDocumentRequirementsMutation();

  const isDirty = !sameCodeSet(selectedCodes, baselineCodes);
  dirtyRef.current = isDirty;

  useEffect(() => {
    dispatch(setPageCode('SUPPORTIVE_DOCUMENT_SETUP'));
    dispatch(setDivContent('Supportive Document Setup'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    setExpandedSheets([]);
  }, [selectedPayorId]);

  useEffect(() => {
    if (selectedPayorId == null) {
      setSelectedCodes([]);
      setBaselineCodes([]);
      setConfigured(null);
      setEditorPayorId(null);
      return;
    }

    if (
      !configData ||
      Number(configData.payorId) !== Number(selectedPayorId)
    ) {
      return;
    }

    if (
      dirtyRef.current &&
      editorPayorId === selectedPayorId
    ) {
      return;
    }

    const codes = normalizeCodes(configData.requirementCodes);

    setSelectedCodes(codes);
    setBaselineCodes(codes);
    setConfigured(Boolean(configData.configured));
    setEditorPayorId(Number(selectedPayorId));
  }, [configData, selectedPayorId, editorPayorId]);

  const catalogCodes = useMemo(
    () =>
      new Set(
        (catalog ?? []).map(item =>
          String(item.code).trim().toUpperCase()
        )
      ),
    [catalog]
  );

  const unknownSelectedCodes = useMemo(
    () =>
      selectedCodes.filter(code => !catalogCodes.has(code)),
    [selectedCodes, catalogCodes]
  );

  const selectedRequirementCount = useMemo(
    () =>
      selectedCodes.filter(code => catalogCodes.has(code))
        .length,
    [selectedCodes, catalogCodes]
  );

  const sheetGroups: SheetGroup[] = useMemo(() => {
    const availabilityList: SupportiveDocumentMedicalSheetAvailability[] =
      [...(medicalSheets ?? [])].sort(
        (a, b) =>
          (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
      );

    const bySheet = new Map<string, SheetGroup>();

    for (const sheet of availabilityList) {
      const key = String(sheet.medicalSheetCode || '')
        .trim()
        .toUpperCase();

      if (!key) {
        continue;
      }

      bySheet.set(key, {
        medicalSheetCode: key,
        medicalSheetName: sheet.medicalSheetName || key,
        medicalSheetPath: sheet.medicalSheetPath || '',
        supported: Boolean(sheet.supported),
        unsupportedReason: sheet.unsupportedReason ?? null,
        displayOrder: sheet.displayOrder ?? 0,
        requirements: []
      });
    }

    const ensureGroup = (
      sheetCode: string,
      sheetName: string,
      sheetPath: string
    ): SheetGroup => {
      const key = (sheetCode || 'UNKNOWN')
        .trim()
        .toUpperCase();

      const existing = bySheet.get(key);

      if (existing) {
        return existing;
      }

      const created: SheetGroup = {
        medicalSheetCode: key,
        medicalSheetName: sheetName || key,
        medicalSheetPath: sheetPath || '',
        supported: true,
        unsupportedReason: null,
        displayOrder: bySheet.size + 1,
        requirements: []
      };

      bySheet.set(key, created);
      return created;
    };

    const addRequirement = (
      group: SheetGroup,
      item: SupportiveDocumentRequirementCatalogItem
    ) => {
      if (!group.supported) {
        return;
      }

      const code = String(item.code).trim().toUpperCase();

      if (
        !group.requirements.some(
          requirement =>
            String(requirement.code).trim().toUpperCase() ===
            code
        )
      ) {
        group.requirements.push(item);
      }
    };

    const items = [...(catalog ?? [])].sort(
      (a, b) =>
        (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
    );

    for (const item of items) {
      const primary = ensureGroup(
        item.medicalSheetCode || 'UNKNOWN',
        item.medicalSheetName ||
          item.medicalSheetCode ||
          'UNKNOWN',
        item.medicalSheetPath || ''
      );

      addRequirement(primary, item);

      for (const extra of item.additionalMedicalSheets ?? []) {
        if (!extra?.medicalSheetCode) {
          continue;
        }

        const extraGroup = ensureGroup(
          extra.medicalSheetCode,
          extra.medicalSheetName || extra.medicalSheetCode,
          extra.medicalSheetPath || ''
        );

        addRequirement(extraGroup, item);
      }
    }

    return Array.from(bySheet.values()).sort((a, b) => {
      const aAvailable =
        a.supported && a.requirements.length > 0;

      const bAvailable =
        b.supported && b.requirements.length > 0;

      if (aAvailable !== bAvailable) {
        return aAvailable ? -1 : 1;
      }

      if (aAvailable && bAvailable) {
        const countDifference =
          b.requirements.length - a.requirements.length;

        if (countDifference !== 0) {
          return countDifference;
        }
      }

      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    });
    
  }, [catalog, medicalSheets]);

  const selectedRequirements = useMemo(() => {
    const selectedSet = new Set(selectedCodes);
    const uniqueRequirements = new Map<
      string,
      SupportiveDocumentRequirementCatalogItem
    >();

    for (const requirement of catalog ?? []) {
      const code = String(requirement.code).trim().toUpperCase();

      if (selectedSet.has(code) && !uniqueRequirements.has(code)) {
        uniqueRequirements.set(code, requirement);
      }
    }

    return Array.from(uniqueRequirements.values()).sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
    );
  }, [catalog, selectedCodes]);

  const requirementFilter = requirementSearch.value
    .trim()
    .toLowerCase();

  const visibleGroups = useMemo(() => {
    if (!requirementFilter) {
      return sheetGroups;
    }

    return sheetGroups
      .filter(group => {
        const sheetName =
          group.medicalSheetName.toLowerCase();

        if (!group.supported) {
          const reason = String(
            group.unsupportedReason ?? ''
          ).toLowerCase();

          return (
            sheetName.includes(requirementFilter) ||
            reason.includes(requirementFilter)
          );
        }

        return (
          sheetName.includes(requirementFilter) ||
          group.requirements.some(req =>
            String(req.label ?? '')
              .toLowerCase()
              .includes(requirementFilter)
          )
        );
      })
      .map(group => {
        if (
          !group.supported ||
          group.medicalSheetName
            .toLowerCase()
            .includes(requirementFilter)
        ) {
          return group;
        }

        return {
          ...group,
          requirements: group.requirements.filter(req =>
            String(req.label ?? '')
              .toLowerCase()
              .includes(requirementFilter)
          )
        };
      });
  }, [sheetGroups, requirementFilter]);

  const canEdit =
    selectedPayorId != null &&
    !isCatalogLoading &&
    !isCatalogError &&
    !isMedicalSheetsLoading &&
    !isMedicalSheetsError &&
    !isConfigLoading &&
    !isConfigError &&
    editorPayorId === selectedPayorId &&
    configured !== null &&
    !isSaving;

  const toggleSheetExpanded = (sheetCode: string) => {
    setExpandedSheets(prev =>
      prev.includes(sheetCode)
        ? prev.filter(code => code !== sheetCode)
        : [...prev, sheetCode]
    );
  };

  const switchPayor = (payor: Payor) => {
    setSelectedCodes([]);
    setBaselineCodes([]);
    setConfigured(null);
    setEditorPayorId(null);
    setSelectedPayor(payor);
  };

  const requestPayorSwitch = (payor: Payor) => {
    if (
      !payor?.id ||
      selectedPayor?.id === payor.id ||
      saveInFlightRef.current
    ) {
      return;
    }

    if (isDirty) {
      setPendingPayor(payor);
      setConfirmSwitchOpen(true);
      return;
    }

    switchPayor(payor);
  };

  const closeSwitchConfirmation = () => {
    setConfirmSwitchOpen(false);
    setPendingPayor(null);
  };

  const confirmDiscardAndSwitch = () => {
    if (!pendingPayor || saveInFlightRef.current) {
      return;
    }

    switchPayor(pendingPayor);
    closeSwitchConfirmation();
  };

  const toggleRequirement = (
    code: string,
    checked: boolean
  ) => {
    if (!canEdit) {
      return;
    }

    const normalized = code.trim().toUpperCase();

    setSelectedCodes(prev => {
      const next = new Set(prev);

      if (checked) {
        next.add(normalized);
      } else {
        next.delete(normalized);
      }

      return normalizeCodes(Array.from(next));
    });
  };

  const toggleSheetGroup = (
    group: SheetGroup,
    checked: boolean
  ) => {
    if (
      !canEdit ||
      !group.supported ||
      group.requirements.length === 0
    ) {
      return;
    }

    setSelectedCodes(prev => {
      const next = new Set(prev);

      for (const requirement of group.requirements) {
        const code = String(requirement.code)
          .trim()
          .toUpperCase();

        if (checked) {
          next.add(code);
        } else {
          next.delete(code);
        }
      }

      return normalizeCodes(Array.from(next));
    });
  };

  const parentState = (group: SheetGroup) => {
    const codes = group.requirements.map(req =>
      String(req.code).trim().toUpperCase()
    );

    const selectedCount = codes.filter(code =>
      selectedCodes.includes(code)
    ).length;

    const checked =
      codes.length > 0 && selectedCount === codes.length;

    return {
      checked,
      indeterminate: selectedCount > 0 && !checked,
      selectedCount
    };
  };

  const handleReset = () => {
    if (saveInFlightRef.current) {
      return;
    }

    setSelectedCodes([...baselineCodes]);
  };

  const handleSave = async () => {
    if (
      !selectedPayorId ||
      !canEdit ||
      saveInFlightRef.current
    ) {
      return;
    }

    if (unknownSelectedCodes.length > 0) {
      dispatch(
        notify({
          msg: 'Cannot save while unsupported requirement codes are present.',
          sev: 'error'
        })
      );
      return;
    }

    const snapshotPayorId = selectedPayorId;
    const snapshotCodes = normalizeCodes(selectedCodes);

    saveInFlightRef.current = true;
    setSaveSnapshotPayorId(snapshotPayorId);

    try {
      const saved = await replaceConfig({
        payorId: snapshotPayorId,
        body: {
          requirementCodes: snapshotCodes
        }
      }).unwrap();

      if (Number(selectedPayorIdRef.current) !== Number(snapshotPayorId)) {
        dispatch(
          notify({
            msg: 'Configuration saved for the previous Payor. Current selection was left unchanged.',
            sev: 'info'
          })
        );
        return;
      }

      const savedCodes = normalizeCodes(
        saved.requirementCodes
      );

      setBaselineCodes(savedCodes);
      setSelectedCodes(prev =>
        sameCodeSet(prev, snapshotCodes) ? savedCodes : prev
      );
      setConfigured(Boolean(saved.configured));
      setEditorPayorId(Number(saved.payorId));

      dispatch(
        notify({
          msg: 'Supportive document requirements saved',
          sev: 'success'
        })
      );
    } catch (error) {
      dispatch(
        notify({
          msg:
            extractApiErrorMessage(error, {
              'requirementCode.unsupported':
                'One or more requirement codes are not supported.',
              'requirementCode.unknown':
                'One or more requirement codes are unknown.',
              'requirementCode.invalid':
                'One or more requirement codes are invalid.',
              'requirementCodes.required':
                'Requirement codes are required.',
              notfound: 'Selected Payor was not found.'
            }) ||
            'Failed to save supportive document requirements',
          sev: 'error'
        })
      );
    } finally {
      saveInFlightRef.current = false;
      setSaveSnapshotPayorId(null);
    }
  };

  const applyPayorSearch = () => {
    setAppliedSearch({
      ...(searchDraft.name.trim()
        ? { name: searchDraft.name.trim() }
        : {}),
      ...(searchDraft.code.trim()
        ? { code: searchDraft.code.trim() }
        : {})
    });

    setPaginationParams(prev => ({
      ...prev,
      page: 0
    }));
  };

  const payorColumns = [
    {
      key: 'name',
      title: <Translate>Payor</Translate>,
      flexGrow: 3,
      render: (row: Payor) => (
        <div className="payor-cell">
          <div className="payor-cell-name">{row.name}</div>
          <div className="selected-payor-code">
            {row.code}
          </div>
        </div>
      )
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 1,
      render: (row: Payor) =>
        row.isActive ? (
          <MyBadgeStatus
            contant="Active"
            color="#2e7d32"
          />
        ) : (
          <MyBadgeStatus
            contant="Inactive"
            color="#757575"
          />
        )
    }
  ];

  const renderRequirementsPanel = () => {
    if (!selectedPayor) {
      return (
        <div className="empty-state">
          <Translate>
            Select a Payor to configure its documentation
            requirements.
          </Translate>
        </div>
      );
    }

    if (isCatalogError || isMedicalSheetsError) {
      return (
        <div className="status-banner error">
          <div>
            <Translate>
              Unable to load Medical Sheets and requirements.
            </Translate>
          </div>

          <MyButton
            appearance="ghost"
            onClick={() => {
              refetchCatalog();
              refetchMedicalSheets();
            }}
            style={{ marginTop: 8 }}
          >
            <Translate>Retry</Translate>
          </MyButton>
        </div>
      );
    }

    if (isConfigError) {
      return (
        <div className="status-banner error">
          <div>
            <Translate>
              Unable to load configuration for this Payor.
            </Translate>
          </div>

          <MyButton
            appearance="ghost"
            onClick={() => refetchConfig()}
            style={{ marginTop: 8 }}
          >
            <Translate>Retry</Translate>
          </MyButton>
        </div>
      );
    }

    if (
      isCatalogLoading ||
      isMedicalSheetsLoading ||
      isConfigLoading ||
      (isConfigFetching &&
        editorPayorId !== selectedPayorId) ||
      configured === null ||
      editorPayorId !== selectedPayorId
    ) {
      return (
        <div className="empty-state">
          <Translate>
            Loading Payor configuration...
          </Translate>
        </div>
      );
    }

    return (
      <div className="requirements-editor">
        <div className="requirements-scroll">
          <div className="selected-payor-header">
            <span className="selected-payor-name">
              {selectedPayor.name}
            </span>

            <span className="selected-payor-code">
              {selectedPayor.code}
            </span>

            {selectedPayor.isActive ? (
              <MyBadgeStatus
                contant="Active"
                color="#2e7d32"
              />
            ) : (
              <MyBadgeStatus
                contant="Inactive"
                color="#757575"
              />
            )}

            {configured ? (
              <MyBadgeStatus
                contant="Configured"
                color="#2264e5"
              />
            ) : (
              <MyBadgeStatus
                contant="Unconfigured"
                color="#ed6c02"
              />
            )}
          </div>

          <div className="purpose-text">
            <Translate>
              Select the clinical documentation required to
              complete visits covered by this Payor.
            </Translate>
          </div>

          {!configured && (
            <div className="status-banner warning">
              <Translate>
                Default requirements currently apply. Saving
                replaces them with your selections, including
                an empty selection.
              </Translate>
            </div>
          )}

          {configured && baselineCodes.length === 0 && (
            <div className="status-banner">
              <Translate>
                No additional documentation requirements are
                currently saved for this Payor.
              </Translate>
            </div>
          )}

          {configured && baselineCodes.length > 0 && (
            <div className="status-banner">
              <Translate>
                This Payor uses its saved requirements.
                Save to apply your changes.
              </Translate>
            </div>
          )}

          {unknownSelectedCodes.length > 0 && (
            <div className="status-banner error">
              <div>
                <Translate>
                  Some saved requirements are unavailable in
                  the current catalog. Saving is disabled
                  until the incompatibility is resolved.
                </Translate>
              </div>

              <div className="unknown-codes">
                {unknownSelectedCodes.map(code => (
                  <code key={code}>{code}</code>
                ))}
              </div>
            </div>
          )}



          <div className="req-search">
            <Form fluid>
              <MyInput
                width="100%"
                fieldLabel="Search requirements"
                fieldName="value"
                record={requirementSearch}
                setRecord={setRequirementSearch}
                placeholder="Search medical sheets or requirements"
              />
            </Form>

            {requirementFilter && (
              <div className="filter-hint">
                <Translate>
                  Open a Medical Sheet to view matches.
                  Its checkbox selects all requirements,
                  including those hidden by search.
                </Translate>
              </div>
            )}
          </div>

          <div className="requirements-groups">
            {visibleGroups.length === 0 ? (
              <div className="empty-state">
                <Translate>
                  No requirements match the current search.
                </Translate>
              </div>
            ) : (
              visibleGroups.map(group => {
                const fullGroup =
                  sheetGroups.find(
                    item =>
                      item.medicalSheetCode ===
                      group.medicalSheetCode
                  ) ?? group;

                const isUnsupported =
                  !fullGroup.supported ||
                  fullGroup.requirements.length === 0;

                const {
                  checked,
                  indeterminate,
                  selectedCount
                } = parentState(fullGroup);

                const expanded = expandedSheets.includes(
                  group.medicalSheetCode
                );

                const contentId = `requirements-${group.medicalSheetCode}`;

                return (
                  <div
                    key={group.medicalSheetCode}
                    className={[
                      'sheet-group',
                      expanded ? 'sheet-group-open' : '',
                      isUnsupported
                        ? 'sheet-group-unsupported'
                        : ''
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <div className="sheet-group-header">
                      <div className="sheet-group-select">
                        <Checkbox
                          checked={
                            !isUnsupported && checked
                          }
                          indeterminate={
                            !isUnsupported && indeterminate
                          }
                          disabled={
                            !canEdit || isUnsupported
                          }
                          aria-label={`Select all requirements for ${group.medicalSheetName}`}
                          onChange={(_, nextChecked) =>
                            toggleSheetGroup(
                              fullGroup,
                              nextChecked
                            )
                          }
                        />
                      </div>

                      <button
                        type="button"
                        className="sheet-group-toggle"
                        aria-expanded={expanded}
                        aria-controls={
                          expanded ? contentId : undefined
                        }
                        onClick={() =>
                          toggleSheetExpanded(
                            group.medicalSheetCode
                          )
                        }
                      >
                        <span className="sheet-group-title">
                          <Translate>
                            {group.medicalSheetName}
                          </Translate>
                        </span>

                        <span className="sheet-group-meta">
                          {isUnsupported ? (
                            <span className="sheet-unavailable">
                              <Translate>
                                Unavailable
                              </Translate>
                            </span>
                          ) : (
                            <span className="sheet-group-count">
                              {selectedCount} /{' '}
                              {fullGroup.requirements.length}
                            </span>
                          )}

                          <MdKeyboardArrowDown
                            size={24}
                            className="sheet-group-arrow"
                            aria-hidden="true"
                          />
                        </span>
                      </button>
                    </div>

                    {expanded && (
                      <div
                        id={contentId}
                        className="sheet-children"
                      >
                        {isUnsupported ? (
                          <div className="unsupported-reason">
                            <Translate>
                              {fullGroup.unsupportedReason ||
                                'Not available for supportive-document requirements.'}
                            </Translate>
                          </div>
                        ) : (
                          group.requirements.map(req => {
                            const code = String(req.code)
                              .trim()
                              .toUpperCase();

                            const selected =
                              selectedCodes.includes(code);

                            return (
                              <div
                                key={code}
                                className={
                                  selected
                                    ? 'requirement-item requirement-item-selected'
                                    : 'requirement-item'
                                }
                              >
                                <Checkbox
                                  checked={selected}
                                  disabled={!canEdit}
                                  onChange={(
                                    _,
                                    nextChecked
                                  ) =>
                                    toggleRequirement(
                                      code,
                                      nextChecked
                                    )
                                  }
                                >
                                  <Translate>
                                    {req.label}
                                  </Translate>
                                </Checkbox>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="actions-row">
          <div
            className="selection-summary"
            aria-live="polite"
          >
            {selectedRequirementCount}{' '}
            <Translate>requirements selected</Translate>

            {isDirty && (
              <>
                {' · '}
                <Translate>Unsaved changes</Translate>
              </>
            )}
          </div>

          <div className="action-buttons">
            <MyButton
              appearance="ghost"
              disabled={!isDirty || isSaving}
              onClick={handleReset}
            >
              <Translate>Reset Changes</Translate>
            </MyButton>

            <MyButton
              disabled={
                !canEdit ||
                (!isDirty && configured === true) ||
                isSaving ||
                unknownSelectedCodes.length > 0
              }
              loading={
                isSaving &&
                saveSnapshotPayorId === selectedPayorId
              }
              onClick={handleSave}
            >
              <Translate>Save</Translate>
            </MyButton>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Panel
      dir={dir}
      className="supportive-document-setup"
    >
      {selectedPayor &&
        editorPayorId === selectedPayorId &&
        configured !== null &&
        !isCatalogLoading &&
        !isCatalogError &&
        !isMedicalSheetsLoading &&
        !isMedicalSheetsError &&
        !isConfigLoading &&
        !isConfigError && (
          <div className="required-summary">
            <div className="required-summary-header">
              <div className="required-summary-heading">
                <span className="required-summary-title">
                  <Translate>Required Documentation</Translate>

                  <span className="required-summary-count">
                    {selectedRequirements.length}
                  </span>
                </span>

                <span className="required-summary-description">
                  <Translate>Selected requirements for</Translate>
                  {' '}
                  <strong>{selectedPayor.name}</strong>
                </span>
              </div>

              {isDirty && (
                <span className="required-summary-unsaved">
                  <span
                    className="required-summary-status-dot"
                    aria-hidden="true"
                  />
                  <Translate>Unsaved Changes</Translate>
                </span>
              )}
            </div>

            {selectedRequirements.length > 0 ? (
              <ul className="required-summary-items">
                {selectedRequirements.map(requirement => (
                  <li
                    key={String(requirement.code).trim().toUpperCase()}
                    className="required-summary-item"
                  >
                    <span
                      className="required-summary-check"
                      aria-hidden="true"
                    >
                      ✓
                    </span>

                    <span className="required-summary-label">
                      <Translate>{requirement.label}</Translate>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="required-summary-empty">
                <Translate>No requirements selected.</Translate>
              </div>
            )}
          </div>
        )}

      <div className="setup-layout">
        <div className="payor-panel">
          <SectionContainer
            title="Payors"
            content={
              <div className="payor-content">
                <Form fluid className="payor-search">
                  <div className="payor-search-fields">
                    <div className="payor-search-field">
                      <MyInput
                        width="100%"
                        fieldLabel="Name"
                        fieldName="name"
                        record={searchDraft}
                        setRecord={setSearchDraft}
                        placeholder="Payor name"
                      />
                    </div>

                    <div className="payor-search-field">
                      <MyInput
                        width="100%"
                        fieldLabel="Code"
                        fieldName="code"
                        record={searchDraft}
                        setRecord={setSearchDraft}
                        placeholder="Code"
                      />
                    </div>
                  </div>

                  <div className="payor-search-actions">
                    <MyButton onClick={applyPayorSearch}>
                      <Translate>Search</Translate>
                    </MyButton>
                  </div>
                </Form>

                <div className="payor-table">
                  <MyTable
                    data={payorListResponse?.data ?? []}
                    columns={payorColumns}
                    loading={isPayorFetching}
                    totalCount={payorListResponse?.totalCount ?? 0}
                    page={paginationParams.page}
                    rowsPerPage={paginationParams.size}
                    onPageChange={(
                      _event: any,
                      newPage: number
                    ) =>
                      setPaginationParams(prev => ({
                        ...prev,
                        page: newPage
                      }))
                    }
                    onRowsPerPageChange={(
                      e: React.ChangeEvent<HTMLInputElement>
                    ) =>
                      setPaginationParams(prev => ({
                        ...prev,
                        size: Number(e.target.value),
                        page: 0
                      }))
                    }
                    rowClassName={(rowData: Payor) =>
                      selectedPayor?.id === rowData.id
                        ? 'payor-row selected-row'
                        : 'payor-row'
                    }
                    onRowClick={(rowData: Payor) =>
                      requestPayorSwitch(rowData)
                    }
                    height={340}
                  />
                </div>
              </div>
            }
          />
        </div>

        <div className="requirements-panel">
          <SectionContainer
            title="Supportive Document Requirements"
            content={renderRequirementsPanel()}
          />
        </div>
      </div>

      <Modal
        open={confirmSwitchOpen}
        onClose={closeSwitchConfirmation}
      >
        <Modal.Header>
          <Modal.Title>
            <Translate>Unsaved Changes</Translate>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Translate>
            You have unsaved changes for this Payor.
            Discard them and switch?
          </Translate>
        </Modal.Body>

        <Modal.Footer>
          <MyButton
            appearance="ghost"
            onClick={closeSwitchConfirmation}
          >
            <Translate>Stay</Translate>
          </MyButton>

          <MyButton
            disabled={isSaving}
            onClick={confirmDiscardAndSwitch}
          >
            <Translate>Discard and Switch</Translate>
          </MyButton>
        </Modal.Footer>
      </Modal>
    </Panel>
  );
};

export default SupportiveDocumentSetup;