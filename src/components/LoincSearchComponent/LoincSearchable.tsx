import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Input, InputGroup, Loader } from 'rsuite';
import SearchIcon from '@rsuite/icons/Search';
import TrashIcon from '@rsuite/icons/Trash';
import CloseIcon from '@rsuite/icons/Close';
import CheckIcon from '@rsuite/icons/Check';
import { useSelector } from 'react-redux';
import {
  type LoincCode,
  useLazyGetLoincByCodeQuery,
  useLazyGetLoincByDescriptionQuery,
  useLazyGetLoincByIdQuery
} from '@/services/setup/loincCodeService';
import Translate from '../Translate';
import './styles.less';

type Props = {
  object: any;
  setOpject: (next: any | ((prev: any) => any)) => void;
  fieldName: string;
  label?: string;
  disabled?: boolean;
  required?: boolean;
};

type LoincOption = {
  id: number;
  code: string;
  description: string;
};

const PAGE_SIZE = 30;
const SORT = 'code,asc';
const SEARCH_DELAY = 350;
const MIN_SEARCH_LENGTH = 3;

const toOption = (item: LoincCode): LoincOption | null => {
  if (item?.id == null) return null;

  return {
    id: item.id,
    code: item.code ?? '',
    description: item.description ?? ''
  };
};

const mergeOptions = (
  previous: LoincOption[],
  incoming: LoincOption[]
): LoincOption[] => {
  const map = new Map<number, LoincOption>();

  [...previous, ...incoming].forEach(item => {
    map.set(item.id, item);
  });

  return Array.from(map.values());
};

const LoincSearchable: React.FC<Props> = ({
  object,
  setOpject,
  fieldName,
  label = 'LOINC',
  disabled = false,
  required = false
}) => {
  const modeTheme = useSelector((state: any) => state.ui.mode);

  const [value, setValue] = useState('');
  const [items, setItems] = useState<LoincOption[]>([]);
  const [picked, setPicked] = useState<LoincOption | null>(null);
  const [openList, setOpenList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSelected, setLoadingSelected] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const [triggerByCode] = useLazyGetLoincByCodeQuery();
  const [triggerByDescription] = useLazyGetLoincByDescriptionQuery();
  const [triggerById] = useLazyGetLoincByIdQuery();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const loadingRef = useRef(false);
  const pageRef = useRef(0);
  const searchedTermRef = useRef('');
  const disabledRef = useRef(disabled);

  disabledRef.current = disabled;

  const keyword = value.trim();
  const selectedId = object?.[fieldName] ?? null;
  const parentCode = object?.loincCode;
  const parentDescription = object?.loincDescription;

  const selectedItem =
    selectedId == null
      ? null
      : picked && String(picked.id) === String(selectedId)
        ? picked
        : items.find(item => String(item.id) === String(selectedId)) ?? null;

  const cancelScheduledSearch = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const invalidateSearch = useCallback(() => {
    cancelScheduledSearch();
    requestIdRef.current += 1;
    loadingRef.current = false;
    setLoading(false);
    setLoadError(false);
  }, [cancelScheduledSearch]);

  const closeList = useCallback(() => {
    invalidateSearch();
    setOpenList(false);
  }, [invalidateSearch]);

  const runSearch = useCallback(
    async (searchTerm: string, reset = true) => {
      const term = searchTerm.trim();

      if (disabledRef.current || !term) return;
      if (!reset && loadingRef.current) return;
      if (!reset && searchedTermRef.current !== term) return;

      cancelScheduledSearch();

      const requestId = ++requestIdRef.current;
      const nextPage = reset ? 0 : pageRef.current + 1;

      loadingRef.current = true;
      setLoading(true);
      setLoadError(false);
      setOpenList(true);

      if (reset) {
        searchedTermRef.current = term;
        pageRef.current = 0;
        setItems([]);
        setHasMore(false);
      }

      try {
        const timestamp = Date.now();

        const [codeResponse, descriptionResponse] = await Promise.all([
          triggerByCode({
            code: term,
            page: nextPage,
            size: PAGE_SIZE,
            sort: SORT,
            timestamp
          }).unwrap(),
          triggerByDescription({
            description: term,
            page: nextPage,
            size: PAGE_SIZE,
            sort: SORT,
            timestamp
          }).unwrap()
        ]);

        if (
          requestId !== requestIdRef.current ||
          disabledRef.current
        ) {
          return;
        }

        const incoming = [
          ...(codeResponse?.data ?? []),
          ...(descriptionResponse?.data ?? [])
        ]
          .map(toOption)
          .filter((item): item is LoincOption => item !== null);

        setItems(previous =>
          mergeOptions(reset ? [] : previous, incoming)
        );

        pageRef.current = nextPage;

        // Each endpoint has its own total; their results may overlap.
        const fetchedThrough = (nextPage + 1) * PAGE_SIZE;

        setHasMore(
          fetchedThrough < (codeResponse?.totalCount ?? 0) ||
            fetchedThrough < (descriptionResponse?.totalCount ?? 0)
        );
      } catch {
        if (requestId !== requestIdRef.current) return;

        setLoadError(true);

        if (reset) {
          setItems([]);
          setHasMore(false);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [cancelScheduledSearch, triggerByCode, triggerByDescription]
  );

  const handleChange = (nextValue: string) => {
    if (disabled) return;

    invalidateSearch();

    const text = String(nextValue);
    const term = text.trim();

    setValue(text);
    setItems([]);
    setHasMore(false);
    setOpenList(false);

    pageRef.current = 0;
    searchedTermRef.current = '';

    if (term.length < MIN_SEARCH_LENGTH) return;

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void runSearch(term, true);
    }, SEARCH_DELAY);
  };

  const searchImmediately = () => {
    cancelScheduledSearch();
    void runSearch(value, true);
  };

  const selectAndClose = (item: LoincOption) => {
    if (disabled) return;

    invalidateSearch();
    setPicked(item);

    setOpject((previous: any) => ({
      ...previous,
      [fieldName]: item.id,
      loincCode: item.code,
      loincDescription: item.description
    }));

    setValue('');
    setItems([]);
    setHasMore(false);
    setOpenList(false);

    pageRef.current = 0;
    searchedTermRef.current = '';
  };

  const clearAll = () => {
    if (disabled) return;

    invalidateSearch();
    setPicked(null);
    setValue('');
    setItems([]);
    setHasMore(false);
    setOpenList(false);

    pageRef.current = 0;
    searchedTermRef.current = '';

    setOpject((previous: any) => ({
      ...previous,
      [fieldName]: null,
      loincCode: null,
      loincDescription: null
    }));

    inputRef.current?.focus();
  };

  useEffect(() => {
    if (!disabled) return;

    invalidateSearch();
    setOpenList(false);
  }, [disabled, invalidateSearch]);

  useEffect(() => {
    let cancelled = false;

    if (selectedId == null) {
      setPicked(null);
      setLoadingSelected(false);
      return;
    }

    if (parentCode) {
      setPicked({
        id: Number(selectedId),
        code: String(parentCode),
        description: String(parentDescription ?? '')
      });
      setLoadingSelected(false);
      return;
    }

    setPicked(previous =>
      previous && String(previous.id) === String(selectedId)
        ? previous
        : null
    );
    setLoadingSelected(true);

    const loadSelected = async () => {
      try {
        const response = await triggerById({
          id: Number(selectedId),
          timestamp: Date.now()
        }).unwrap();

        if (cancelled) return;

        setPicked(toOption(response));
      } catch {
        if (!cancelled) {
          setPicked(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingSelected(false);
        }
      }
    };

    void loadSelected();

    return () => {
      cancelled = true;
    };
  }, [selectedId, parentCode, parentDescription, triggerById]);

  useEffect(() => {
    const handleOutsideClick = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        closeList();
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [closeList]);

  useEffect(() => {
    return () => {
      cancelScheduledSearch();
      requestIdRef.current += 1;
    };
  }, [cancelScheduledSearch]);

  const highlight = (text: string) => {
    if (!keyword) return text;

    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

    return parts.map((part, index) =>
      part.toLowerCase() === keyword.toLowerCase() ? (
        <mark key={index}>{part}</mark>
      ) : (
        <React.Fragment key={index}>{part}</React.Fragment>
      )
    );
  };

  return (
    <div className={modeTheme === 'dark' ? 'dark' : undefined}>
      <div
        ref={rootRef}
        className={`loinc-root ${disabled ? 'is-disabled' : ''}`}
        onKeyDown={event => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            closeList();
            inputRef.current?.focus();
          }
        }}
      >
        <div className="loinc-heading">
          <span className="loinc-label">
            <Translate>{label}</Translate>
            {required && <span className="loinc-required"> *</span>}
          </span>

          <span className="loinc-caption">
            <Translate>Code / Description</Translate>
          </span>
        </div>

        <div className="search-wrap">
          <InputGroup className="search-group">
            <Input
              inputRef={inputRef}
              className="search-input"
              placeholder="Search by code or description"
              aria-label={label}
              value={value}
              disabled={disabled}
              onChange={handleChange}
              onPressEnter={event => {
                event.preventDefault();

                if (!event.nativeEvent.isComposing) {
                  searchImmediately();
                }
              }}
            />

            {selectedId != null && (
              <InputGroup.Button
                type="button"
                className="clear-icon-btn"
                onClick={clearAll}
                disabled={disabled}
                aria-label="Clear LOINC selection"
                title="Clear selection"
              >
                <TrashIcon />
              </InputGroup.Button>
            )}

            <InputGroup.Button
              type="button"
              className={`search-btn ${keyword ? 'active' : ''}`}
              onClick={searchImmediately}
              disabled={disabled || !keyword}
              aria-label="Search LOINC"
              title="Search"
            >
              {loading ? <Loader size="xs" /> : <SearchIcon />}
            </InputGroup.Button>
          </InputGroup>

          {openList && !disabled && (
            <div className="dropdown-list" aria-busy={loading}>
              <div className="results-header">
                <span>
                  <Translate>Search results</Translate>
                </span>

                <Button
                  appearance="subtle"
                  size="xs"
                  className="close-results-btn"
                  onClick={closeList}
                  aria-label="Close results"
                >
                  <CloseIcon />
                </Button>
              </div>

              <div className="results-body">
                {items.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className={`dropdown-item ${
                      String(item.id) === String(selectedId)
                        ? 'is-selected'
                        : ''
                    }`}
                    onClick={() => selectAndClose(item)}
                  >
                    <span className="item-row">
                      <strong className="code">
                        {highlight(item.code)}
                      </strong>

                      <span className="desc">
                        {highlight(item.description)}
                      </span>

                      {String(item.id) === String(selectedId) && (
                        <CheckIcon className="item-check" />
                      )}
                    </span>
                  </button>
                ))}

                {!loading && !loadError && items.length === 0 && (
                  <div className="empty">
                    <SearchIcon className="empty-icon" />
                    <span>
                      <Translate>No results found</Translate>
                    </span>
                    <small>
                      <Translate>Try another code or description</Translate>
                    </small>
                  </div>
                )}

                {loading && (
                  <div className="loading" role="status">
                    <Loader size="sm" />
                    <span>
                      <Translate>Loading results…</Translate>
                    </span>
                  </div>
                )}

                {loadError && (
                  <div className="error" role="alert">
                    <CloseIcon className="error-icon" />
                    <span>
                      <Translate>
                        Failed to fetch results. Please try again.
                      </Translate>
                    </span>
                  </div>
                )}
              </div>

              {hasMore && !loading && (
                <div className="load-more">
                  <Button
                    appearance="subtle"
                    className="load-more-btn"
                    onClick={() =>
                      void runSearch(searchedTermRef.current, false)
                    }
                  >
                    <Translate>Load more</Translate>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`summary ${selectedItem ? 'selected' : ''}`}>
          {selectedItem ? (
            <div className="summary-row">
              <span className="summary-check-wrap">
                <CheckIcon className="summary-check" />
              </span>

              <div className="summary-content">
                <div className="summary-heading">
                  <span className="summary-caption">
                    <Translate>Selected LOINC</Translate>
                  </span>

                  <strong className="code-blue">
                    {selectedItem.code}
                  </strong>
                </div>

                <div className="summary-desc">
                  {selectedItem.description}
                </div>
              </div>
            </div>
          ) : selectedId != null && loadingSelected ? (
            <span className="summary-loading">
              <Loader size="xs" content={<Translate>Loading...</Translate>} />
            </span>
          ) : (
            <span className="summary-empty">
              <Translate>No LOINC selected</Translate>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoincSearchable;