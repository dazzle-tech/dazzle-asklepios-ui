import React, { useEffect, useRef, useState } from "react";
import CloseIcon from "@rsuite/icons/Close";
import { Col, Dropdown, Input, InputGroup, Row, Text } from "rsuite";
import { extractPaginationFromLink } from "@/utils/paginationHelper";
import {
  type ICDDiagnosisDTO,
  type PagedResult,
  useLazySearchIcdDiagnosesQuery,
  useLazyGetIcdDiagnosisByIdQuery,
} from "@/services/setup/icdTreeService";
import "./styles.less";

type SelectedDiagnosis = {
  id: number;
  code: string;
  desc: string;
};

type Props = {
  diagnosisId?: number | null;
  setDiagnosisId?: (id: number | null) => void;
  diagnosisIds?: number[];
  setDiagnosisIds?: (ids: number[]) => void;
  multiple?: boolean;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  compact?: boolean;
  pageSize?: number;
};

const toSelected = (item: ICDDiagnosisDTO | null | undefined, fallbackId?: number | null): SelectedDiagnosis | null => {
  const idVal = (item as any)?.id ?? fallbackId ?? null;
  if (typeof idVal !== "number") {
    return null;
  }
  return {
    id: idVal,
    code: item?.icdCode ?? "",
    desc: item?.icdShortDescription ?? item?.icdFullDescription ?? "",
  };
};

const Icd10DiagnosisSearch: React.FC<Props> = ({
  diagnosisId = null,
  setDiagnosisId,
  diagnosisIds,
  setDiagnosisIds,
  multiple = false,
  label = "Diagnosis",
  disabled = false,
  required = false,
  compact = false,
  pageSize = 15,
}) => {
  const selectedIds = multiple
    ? (diagnosisIds ?? []).filter((id): id is number => typeof id === "number")
    : diagnosisId
      ? [diagnosisId]
      : [];
  const selectedKey = selectedIds.join(",");

  const [keyword, setKeyword] = useState("");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [links, setLinks] = useState<{ next?: string | null }>({});
  const [accum, setAccum] = useState<Record<string, ICDDiagnosisDTO>>({});
  const [isAppending, setIsAppending] = useState(false);
  const [selectedMap, setSelectedMap] = useState<Record<number, SelectedDiagnosis>>({});

  const [searchDiagnoses, { isFetching: isSearching }] = useLazySearchIcdDiagnosesQuery();
  const [getById, { isFetching: isByIdLoading }] = useLazyGetIcdDiagnosisByIdQuery();

  const lastKeywordRef = useRef<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedMapRef = useRef(selectedMap);
  selectedMapRef.current = selectedMap;

  const applySelection = (nextIds: number[], extra?: SelectedDiagnosis) => {
    const unique = Array.from(new Set(nextIds));
    if (extra) {
      setSelectedMap(prev => ({ ...prev, [extra.id]: extra }));
    }
    if (multiple) {
      setDiagnosisIds?.(unique);
      return;
    }
    setDiagnosisId?.(unique[0] ?? null);
  };

  const handleClear = () => {
    applySelection([]);
    setSelectedMap({});
    setKeyword("");
    setOpen(false);
    setPage(0);
    setLinks({});
    setAccum({});
    setIsAppending(false);
  };

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!open) return;
      const el = dropdownRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  const loadFirstPage = async (kw: string) => {
    const trimmed = (kw || "").trim();
    lastKeywordRef.current = trimmed;

    setPage(0);
    setLinks({});
    setAccum({});
    setIsAppending(false);

    if (trimmed.length < 3) {
      setOpen(false);
      return;
    }

    try {
      const resp = await searchDiagnoses({
        keyword: trimmed,
        page: 0,
        size: pageSize,
        sort: "icdCode,asc",
        timestamp: Date.now(),
      }).unwrap();

      const pr = resp as unknown as PagedResult<ICDDiagnosisDTO>;
      const data = pr.data ?? [];
      const obj: Record<string, ICDDiagnosisDTO> = {};
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const key = String(item.id ?? item.icdDiagnosisUid);
        obj[key] = item;
      }
      setAccum(obj);
      setLinks({ next: pr.links?.next ?? null });
      setOpen(true);
    } catch {
      setOpen(false);
    }
  };

  const handleLoadMore = async () => {
    const nextLink = links?.next;
    if (!nextLink) return;
    const { page: nextPage, size } = extractPaginationFromLink(nextLink);
    setIsAppending(true);
    try {
      const resp = await searchDiagnoses({
        keyword: lastKeywordRef.current,
        page: nextPage,
        size: size || pageSize,
        sort: "icdCode,asc",
        timestamp: Date.now(),
      }).unwrap();
      const pr = resp as unknown as PagedResult<ICDDiagnosisDTO>;
      const newItems = pr.data ?? [];
      setAccum(prev => {
        const updated = { ...prev };
        for (let i = 0; i < newItems.length; i++) {
          const item = newItems[i];
          const key = String(item.id ?? item.icdDiagnosisUid);
          updated[key] = item;
        }
        return updated;
      });
      setLinks({ next: pr.links?.next ?? null });
      setPage(nextPage);
    } finally {
      setIsAppending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      loadFirstPage(keyword);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  useEffect(() => {
    const missing = selectedIds.filter(id => !selectedMapRef.current[id]);
    if (!missing.length) {
      return;
    }
    let cancelled = false;
    (async () => {
      const next: Record<number, SelectedDiagnosis> = {};
      for (const id of missing) {
        try {
          const dx = await getById({ id, timestamp: Date.now() }).unwrap();
          const selected = toSelected(dx, id);
          if (selected) {
            next[id] = selected;
          }
        } catch {
          next[id] = { id, code: String(id), desc: "" };
        }
      }
      if (!cancelled) {
        setSelectedMap(prev => ({ ...prev, ...next }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getById, selectedKey]);

  const selectItem = (item: ICDDiagnosisDTO) => {
    const selected = toSelected(item);
    if (!selected) {
      return;
    }
    if (multiple) {
      const exists = selectedIds.includes(selected.id);
      applySelection(
        exists ? selectedIds.filter(id => id !== selected.id) : [...selectedIds, selected.id],
        selected
      );
      return;
    }
    applySelection([selected.id], selected);
    setKeyword("");
    setOpen(false);
  };

  const canLoadMore = Boolean(links?.next);
  const selectedItems = selectedIds
    .map(id => selectedMap[id])
    .filter((item): item is SelectedDiagnosis => Boolean(item));

  return (
    <div className="icd10-search">
      <Row className="icd10-search__row">
        <Text className="icd10-search__label">
          {label}
          {required ? <span className="icd10-search__required"> *</span> : null}
        </Text>

        <Col md={24}>
          <div className="icd10-search__field" ref={dropdownRef}>
            <InputGroup inside className="icd10-search__inputGroup">
              <Input
                placeholder={
                  multiple
                    ? "Search and add ICD-10 codes (min 3 chars) - Press Enter"
                    : "Search ICD-10 (min 3 chars) - Press Enter"
                }
                value={keyword}
                onChange={(v) => {
                  setKeyword(v);
                  if (!v) setOpen(false);
                }}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                onFocus={() => {
                  if (Object.keys(accum).length > 0) setOpen(true);
                }}
                className="icd10-search__input"
              />
              <InputGroup.Button
                className="icd10-search__btn icd10-search__btn--icon"
                onClick={() => setOpen(false)}
                disabled={!open}
                title="Close list"
              >
                <CloseIcon />
              </InputGroup.Button>
              <InputGroup.Button
                className="icd10-search__btn icd10-search__btn--clear"
                onClick={handleClear}
                disabled={disabled || (!selectedIds.length && !keyword)}
                title="Clear"
              >
                Clear
              </InputGroup.Button>
            </InputGroup>

            {open && keyword.trim().length >= 3 && (
              <div className="icd10-search__dropdown">
                <Dropdown.Menu className="icd10-search__menu">
                  {isSearching && Object.keys(accum).length === 0 ? (
                    <Dropdown.Item disabled>Loading...</Dropdown.Item>
                  ) : null}
                  {!isSearching && Object.keys(accum).length === 0 ? (
                    <Dropdown.Item disabled>No results</Dropdown.Item>
                  ) : null}
                  {Object.keys(accum).length > 0 &&
                    Object.entries(accum).map(([key, item]) => {
                      const idVal = (item as any)?.id;
                      const isPicked = typeof idVal === "number" && selectedIds.includes(idVal);
                      return (
                        <Dropdown.Item
                          key={key}
                          eventKey={key}
                          className={`icd10-search__item${isPicked ? " icd10-search__item--selected" : ""}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                          }}
                          onClick={() => selectItem(item)}
                        >
                          <span className="icd10-search__code">{item.icdCode}</span>
                          <span className="icd10-search__desc">
                            {item.icdShortDescription ?? item.icdFullDescription ?? ""}
                          </span>
                          {isPicked ? <span className="icd10-search__picked">Added</span> : null}
                        </Dropdown.Item>
                      );
                    })}
                  {canLoadMore ? (
                    <Dropdown.Item
                      className="icd10-search__loadMore"
                      onMouseDown={(e) => {
                        e.preventDefault();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isAppending) return;
                        handleLoadMore();
                      }}
                    >
                      {isAppending ? "Loading..." : "Load more..."}
                    </Dropdown.Item>
                  ) : null}
                </Dropdown.Menu>
              </div>
            )}
          </div>
        </Col>
      </Row>

      <Row className="icd10-search__selectedRow">
        <Col md={24}>
          {multiple ? (
            <div className={`icd10-search__chips${selectedItems.length ? " icd10-search__chips--selected" : ""}`}>
              {isByIdLoading && !selectedItems.length ? (
                "Loading..."
              ) : selectedItems.length ? (
                selectedItems.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className="icd10-search__chip"
                    disabled={disabled}
                    onClick={() => applySelection(selectedIds.filter(id => id !== item.id))}
                    title="Remove"
                  >
                    <strong>{item.code}</strong>
                    {item.desc ? <span> — {item.desc}</span> : null}
                    <CloseIcon />
                  </button>
                ))
              ) : (
                "No diagnoses selected"
              )}
            </div>
          ) : compact ? (
            <div
              className={`icd10-search__summary${selectedItems[0]?.code ? " icd10-search__summary--selected" : ""}`}
            >
              {isByIdLoading ? (
                "Loading..."
              ) : selectedItems[0]?.code ? (
                <>
                  <strong>{selectedItems[0].code}</strong>
                  {selectedItems[0].desc ? ` — ${selectedItems[0].desc}` : ""}
                </>
              ) : (
                "No diagnosis selected"
              )}
            </div>
          ) : (
            <Input
              as="textarea"
              rows={4}
              disabled
              value={
                isByIdLoading
                  ? "Loading..."
                  : selectedItems[0]?.code
                    ? `${selectedItems[0].code}${selectedItems[0].desc ? " - " + selectedItems[0].desc : ""}`
                    : ""
              }
              className="icd10-search__selected"
            />
          )}
        </Col>
      </Row>
    </div>
  );
};

export default Icd10DiagnosisSearch;
