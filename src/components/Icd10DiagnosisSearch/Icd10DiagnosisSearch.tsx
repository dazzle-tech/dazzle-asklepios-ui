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

type Props = {
  diagnosisId?: number | null;
  setDiagnosisId: (id: number | null) => void;

  label?: string;
  disabled?: boolean;
  required?: boolean;
  compact?: boolean;
  pageSize?: number;
};

const Icd10DiagnosisSearch: React.FC<Props> = ({
  diagnosisId = null,
  setDiagnosisId,
  label = "Diagnosis",
  disabled = false,
  required = false,
  compact = false,
  pageSize = 15,
}) => {
  // --- search UI ---
  const [keyword, setKeyword] = useState("");
  const [open, setOpen] = useState(false);

  // --- server paging accumulation (Load more) ---
  const [page, setPage] = useState(0);
  const [links, setLinks] = useState<{ next?: string | null }>({});
  const [accum, setAccum] = useState<Record<string, ICDDiagnosisDTO>>({});
  const [isAppending, setIsAppending] = useState(false);

  // --- selected diagnosis record (code + default description) ---
  const [display, setDisplay] = useState({ code: "", desc: "" });

  const [searchDiagnoses, { isFetching: isSearching }] =
    useLazySearchIcdDiagnosesQuery();
  const [getById, { isFetching: isByIdLoading }] =
    useLazyGetIcdDiagnosisByIdQuery();

  const lastKeywordRef = useRef<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClear = () => {
    setDiagnosisId(null);
    setDisplay({ code: "", desc: "" });

    setKeyword("");
    setOpen(false);

    setPage(0);
    setLinks({});
    setAccum({});
    setIsAppending(false);
  };

  // close list when clicking outside
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
      const nextNext = pr.links?.next ?? null;

      setAccum((prev) => {
        const updated = { ...prev };
        for (let i = 0; i < newItems.length; i++) {
          const item = newItems[i];
          const key = String(item.id ?? item.icdDiagnosisUid);
          updated[key] = item;
        }
        return updated;
      });

      setLinks({ next: nextNext });
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

  // if diagnosisId comes from parent -> fetch by id + show loading until loaded
  useEffect(() => {
    if (!diagnosisId) {
      setDisplay({ code: "", desc: "" });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const dx = await getById({ id: diagnosisId, timestamp: Date.now() }).unwrap();
        if (cancelled) return;

        setDisplay({
          code: dx?.icdCode ?? "",
          // "default description" -> short if available, else full
          desc: dx?.icdShortDescription ?? dx?.icdFullDescription ?? "",
        });
      } catch {
        if (cancelled) return;
        setDisplay({ code: "", desc: "" });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagnosisId]);

  const canLoadMore = Boolean(links?.next);

  return (
    <div className="icd10-search">
      {/* Search input */}
      <Row className="icd10-search__row">
        <Text className="icd10-search__label">
          {label}
          {required ? <span className="icd10-search__required"> *</span> : null}
        </Text>

        <Col md={24}>
          <div className="icd10-search__field" ref={dropdownRef}>
            <InputGroup inside className="icd10-search__inputGroup">
              <Input
                placeholder="Search ICD-10 (min 3 chars) - Press Enter"
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

              {/* X — closes list only */}
              <InputGroup.Button
                className="icd10-search__btn icd10-search__btn--icon"
                onClick={() => setOpen(false)}
                disabled={!open}
                title="Close list"
              >
                <CloseIcon />
              </InputGroup.Button>

              {/* Clear — clears selection + input + list */}
              <InputGroup.Button
                className="icd10-search__btn icd10-search__btn--clear"
                onClick={handleClear}
                disabled={disabled || (!diagnosisId && !display.code && !keyword)}
                title="Clear"
              >
                Clear
              </InputGroup.Button>
            </InputGroup>

            {/* Dropdown results + Load more */}
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
                    Object.entries(accum).map(([key, item]) => (
                      <Dropdown.Item
                        key={key}
                        eventKey={key}
                        className="icd10-search__item"
                        onMouseDown={(e) => {
                          e.preventDefault(); // keep dropdown open until click handled
                        }}
                        onClick={() => {
                          const idVal = (item as any)?.id ?? null;
                          setDiagnosisId(typeof idVal === "number" ? idVal : null);

                          setDisplay({
                            code: item.icdCode ?? "",
                            // "default description" -> short if available, else full
                            desc:
                              item.icdShortDescription ??
                              item.icdFullDescription ??
                              "",
                          });

                          // close dropdown when done
                          setKeyword("");
                          setOpen(false);
                        }}
                      >
                        <span className="icd10-search__code">{item.icdCode}</span>
                        <span className="icd10-search__desc">
                          {item.icdShortDescription ??
                            item.icdFullDescription ??
                            ""}
                        </span>
                      </Dropdown.Item>
                    ))}

                  {canLoadMore ? (
                    <Dropdown.Item
                      className="icd10-search__loadMore"
                      onMouseDown={(e) => {
                        e.preventDefault(); // prevent dropdown close
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

      {/* Selected details */}
      <Row className="icd10-search__selectedRow">
        <Col md={24}>
          {compact ? (
            <div
              className={`icd10-search__summary${display.code ? " icd10-search__summary--selected" : ""}`}
            >
              {isByIdLoading ? (
                "Loading..."
              ) : display.code ? (
                <>
                  <strong>{display.code}</strong>
                  {display.desc ? ` — ${display.desc}` : ""}
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
                  : display.code
                  ? `${display.code}${display.desc ? " - " + display.desc : ""}`
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