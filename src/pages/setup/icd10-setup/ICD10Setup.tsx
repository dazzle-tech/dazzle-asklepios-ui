import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { setDivContent, setPageCode } from "@/reducers/divSlice";
import { notify } from "@/utils/uiReducerActions";
import { extractPaginationFromLink } from "@/utils/paginationHelper";

import { Col, Panel, Row } from "rsuite";
import "rsuite/dist/rsuite.min.css";

import MyTable from "@/components/MyTable";

import {
  useGetIcdRootsQuery,
  useLazyGetIcdChildrenQuery,
  useGetIcdNodeDetailsQuery,
  useGetIcdDiagnosesByCategoryQuery,
  useGetIcdChildrenQuery,
  type ICDCategoryDTO,
  type ICDDiagnosisDTO,
  type PagedResult,
} from "@/services/setup/icdTreeService";

import "./styles.less";

type FlatRow = {
  code: string;
  name: string;
  desc?: string | null; // kept as-is (UI local), mapped from categoryDescription
  parentCode: string | null;
  level: number;
};

type LinkMap = {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
};

const toLatinDigits = (input: string) => {
  if (!input) return "";
  const arabicIndicMap: Record<string, string> = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  };
  const easternArabicIndicMap: Record<string, string> = {
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9",
  };

  return input
    .replace(/[٠-٩]/g, (d) => arabicIndicMap[d] ?? d)
    .replace(/[۰-۹]/g, (d) => easternArabicIndicMap[d] ?? d);
};

const buildCategorySortKey = (rawCode: string) => {
  const code = toLatinDigits(rawCode ?? "").trim().toUpperCase();
  const m = code.match(
    /^([A-Z]+)?\s*([0-9]+(?:\.[0-9]+)?)?(?:\s*-\s*([A-Z]+)?\s*([0-9]+(?:\.[0-9]+)?)?)?(.*)$/
  );

  const prefix1 = m?.[1] ?? "";
  const num1Str = m?.[2] ?? "";
  const prefix2 = m?.[3] ?? "";
  const num2Str = m?.[4] ?? "";
  const tail = (m?.[5] ?? "").trim();

  const num1 = num1Str ? Number(num1Str) : Number.NaN;
  const num2 = num2Str ? Number(num2Str) : Number.NaN;
  const isRange = Boolean(num2Str || prefix2);

  return { prefix1, num1, isRange: isRange ? 1 : 0, prefix2, num2, tail };
};

const compareCategoryCode = (aRaw: string, bRaw: string) => {
  const a = buildCategorySortKey(aRaw);
  const b = buildCategorySortKey(bRaw);

  if (a.prefix1 !== b.prefix1) return a.prefix1.localeCompare(b.prefix1);

  const aNan = Number.isNaN(a.num1);
  const bNan = Number.isNaN(b.num1);
  if (aNan !== bNan) return aNan ? 1 : -1;
  if (!aNan && a.num1 !== b.num1) return a.num1 - b.num1;

  if (a.isRange !== b.isRange) return a.isRange - b.isRange;

  if (a.prefix2 !== b.prefix2) return a.prefix2.localeCompare(b.prefix2);

  const a2Nan = Number.isNaN(a.num2);
  const b2Nan = Number.isNaN(b.num2);
  if (a2Nan !== b2Nan) return a2Nan ? 1 : -1;
  if (!a2Nan && a.num2 !== b.num2) return a.num2 - b.num2;

  return a.tail.localeCompare(b.tail);
};

const toRoman = (n: number) => {
  if (!Number.isFinite(n) || n <= 0) return "";
  const map: Array<[number, string]> = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let x = Math.floor(n);
  let out = "";
  for (const [v, s] of map) {
    while (x >= v) {
      out += s;
      x -= v;
    }
  }
  return out;
};

const forceLtr = (s: string) => `\u2066${s}\u2069`;

const getLeftDisplayCode = (code: string) => {
  const latin = toLatinDigits(String(code ?? "")).trim();
  if (!latin) return "";
  if (/^\d+$/.test(latin)) return toRoman(Number(latin));
  return latin;
};

const LatinLike: React.FC<{ value: string; className?: string }> = ({ value, className }) => (
  <span className={`icd-latin-digits ${className ?? ""}`} dir="ltr" lang="en">
    {forceLtr(value)}
  </span>
);

const ICD10BrowserExpand = () => {
  const dispatch = useDispatch();
  const icdCoding = "ICD10";

  // LEFT (flat tree rows)
  const [rows, setRows] = useState<FlatRow[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState<Set<string>>(new Set());

  const [searchText] = useState("");
  const [appliedSearch] = useState("");

  // RIGHT selected
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string>("");

  // RIGHT: Diagnoses pagination (server-side)
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: "icdCode,asc",
    timestamp: Date.now(),
  });

  // RIGHT: Children table pagination (server-side)
  const [childPagination, setChildPagination] = useState({
    page: 0,
    size: 15,
    sort: "categoryCode,asc",
    timestamp: Date.now(),
  });

  // LEFT: Roots pagination (server-side) + Load more
  const [rootPaging, setRootPaging] = useState({
    page: 0,
    size: 100,
    sort: "categoryCode,asc",
    timestamp: Date.now(),
  });
  const [rootAccum, setRootAccum] = useState<ICDCategoryDTO[]>([]);
  const [rootLinks, setRootLinks] = useState<LinkMap>({});
  const rootAppendingRef = useRef(false);

  // LEFT: per-parent children paging for "Load more" under expanded parent
  const [childPageByParent, setChildPageByParent] = useState<Record<string, number>>({});
  const [childLinksByParent, setChildLinksByParent] = useState<Record<string, LinkMap>>({});
  const [loadingMoreByParent, setLoadingMoreByParent] = useState<Record<string, boolean>>({});

  //leaf fallback row 
  const [leafRow, setLeafRow] = useState<ICDCategoryDTO | null>(null);

  // API
  const { data: rootsPaged, isFetching: rootsLoading } = useGetIcdRootsQuery({
    icdCoding,
    page: rootPaging.page,
    size: rootPaging.size,
    sort: rootPaging.sort,
    timestamp: rootPaging.timestamp,
  });

  const [fetchChildrenPaged] = useLazyGetIcdChildrenQuery();

  const { data: nodeDetails, isFetching: nodeLoading } = useGetIcdNodeDetailsQuery(
    {
      icdCoding,
      categoryCode: selectedCategoryCode,
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort,
      timestamp: paginationParams.timestamp,
    },
    { skip: !selectedCategoryCode }
  );

  const hasChildren = (nodeDetails?.children?.length ?? 0) > 0;

  const { data: dxPaged, isFetching: dxLoading } = useGetIcdDiagnosesByCategoryQuery(
    {
      icdCoding,
      categoryCode: selectedCategoryCode,
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort,
      timestamp: paginationParams.timestamp,
    },
    { skip: !selectedCategoryCode || hasChildren }
  );

  // RIGHT children (server-side pageable table)
  const { data: childrenPagedResp, isFetching: childrenLoading } = useGetIcdChildrenQuery(
    {
      icdCoding,
      parentCategoryCode: selectedCategoryCode,
      page: childPagination.page,
      size: childPagination.size,
      sort: childPagination.sort,
      timestamp: childPagination.timestamp,
    },
    { skip: !selectedCategoryCode || !hasChildren }
  );

  useEffect(() => {
    dispatch(setPageCode("ICD10"));
    dispatch(setDivContent("ICD-10 Browser"));
    return () => {
      dispatch(setPageCode(""));
      dispatch(setDivContent(""));
    };
  }, [dispatch]);

  // ROOTS: accumulate pages into left rows (Load more)
  useEffect(() => {
    if (!rootsPaged) return;

    const pageData = (rootsPaged as unknown as PagedResult<ICDCategoryDTO>).data ?? [];
    const links = (rootsPaged as unknown as PagedResult<ICDCategoryDTO>).links ?? {};
    setRootLinks(links);

    setRootAccum((prev) => {
      if (rootPaging.page === 0 && !rootAppendingRef.current) return pageData;

      const existing = new Set(prev.map((x) => x.categoryCode));
      const unique = pageData.filter((x) => !existing.has(x.categoryCode));
      return [...prev, ...unique];
    });

    rootAppendingRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootsPaged]);

  //  Build left rows from accumulated roots (keep your sort logic)
  useEffect(() => {
    if (!rootAccum) return;

    const rootRows: FlatRow[] = rootAccum
      .map((r) => ({
        code: r.categoryCode,
        name: r.categoryName ?? "",
        desc: r.categoryDescription,
        parentCode: null,
        level: 0,
      }))
      .sort((a, b) => compareCategoryCode(a.code, b.code));

    setRows((prev) => {
      const nonRoot = prev.filter((x) => x.parentCode !== null);
      return [...rootRows, ...nonRoot];
    });

    if (!selectedCategoryCode && rootRows.length) {
      setSelectedCategoryCode(rootRows[0].code);

      // fallback header/row from left
      setLeafRow({
        categoryCode: rootRows[0].code,
        categoryName: rootRows[0].name ?? "",
        categoryDescription: rootRows[0].desc ?? null,
        parentCategoryCode: null,
        icdCoding,
      } as ICDCategoryDTO);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootAccum]);

  // filter (kept)
  const filteredRows = useMemo(() => {
    if (!appliedSearch) return rows;
    const q = appliedSearch.toLowerCase();
    return rows.filter((r) => `${r.code} ${r.name}`.toLowerCase().includes(q));
  }, [rows, appliedSearch]);

  const insertChildrenAfter = (parentCode: string, children: ICDCategoryDTO[], mode: "first" | "append") => {
    const sorted = [...(children ?? [])].sort((a, b) => compareCategoryCode(a.categoryCode ?? "", b.categoryCode ?? ""));

    setRows((prev) => {
      const parentIdx = prev.findIndex((r) => r.code === parentCode);
      if (parentIdx === -1) return prev;

      const parentLevel = prev[parentIdx].level;

      const childRows: FlatRow[] = sorted.map((c) => ({
        code: c.categoryCode,
        name: c.categoryName ?? "",
        desc: c.categoryDescription,
        parentCode,
        level: parentLevel + 1,
      }));

      const existing = new Set(prev.map((x) => x.code));
      const unique = childRows.filter((x) => !existing.has(x.code));
      if (!unique.length) return prev;

      const next = [...prev];

      if (mode === "first") {
        next.splice(parentIdx + 1, 0, ...unique);
        return next;
      }

      const insertAt = (() => {
        const pIdx = next.findIndex((r) => r.code === parentCode);
        if (pIdx === -1) return parentIdx + 1;
        const pLevel = next[pIdx].level;
        let i = pIdx + 1;
        while (i < next.length && next[i].level > pLevel) i++;
        return i;
      })();

      next.splice(insertAt, 0, ...unique);
      return next;
    });
  };

  const collapseBranch = (parentCode: string) => {
    const descendants = new Set<string>();
    const collect = (code: string) => {
      for (const r of rows) {
        if (r.parentCode === code) {
          descendants.add(r.code);
          collect(r.code);
        }
      }
    };
    collect(parentCode);

    setRows((prev) => prev.filter((r) => !descendants.has(r.code)));

    setExpanded((prev) => {
      const next = new Set(prev);
      next.delete(parentCode);
      descendants.forEach((c) => next.delete(c));
      return next;
    });

    setLoaded((prev) => {
      const next = new Set(prev);
      next.delete(parentCode);
      descendants.forEach((c) => next.delete(c));
      return next;
    });

    setChildPageByParent((prev) => {
      const next = { ...prev };
      delete next[parentCode];
      descendants.forEach((c) => delete next[c]);
      return next;
    });
    setChildLinksByParent((prev) => {
      const next = { ...prev };
      delete next[parentCode];
      descendants.forEach((c) => delete next[c]);
      return next;
    });
    setLoadingMoreByParent((prev) => {
      const next = { ...prev };
      delete next[parentCode];
      descendants.forEach((c) => delete next[c]);
      return next;
    });
  };

  const toggleExpand = async (row: FlatRow) => {
    setSelectedCategoryCode(row.code);

    //  update fallback leaf/header from left list always
    setLeafRow({
      categoryCode: row.code,
      categoryName: row.name ?? "",
      categoryDescription: row.desc ?? null,
      parentCategoryCode: row.parentCode ?? null,
      icdCoding,
    } as ICDCategoryDTO);

    setPaginationParams((p) => ({ ...p, page: 0, timestamp: Date.now() }));
    setChildPagination((p) => ({ ...p, page: 0, timestamp: Date.now() }));

    const isOpen = expanded.has(row.code);

    if (isOpen) {
      collapseBranch(row.code);
      return;
    }

    setExpanded((prev) => {
      const next = new Set(prev);
      next.add(row.code);
      return next;
    });

    if (loaded.has(row.code)) return;

    try {
      const resp = await fetchChildrenPaged({
        icdCoding,
        parentCategoryCode: row.code,
        page: 0,
        size: 100,
        sort: "categoryCode,asc",
        timestamp: Date.now(),
      }).unwrap();

      const data = (resp as unknown as PagedResult<ICDCategoryDTO>).data ?? [];
      const links = (resp as unknown as PagedResult<ICDCategoryDTO>).links ?? {};

      if (!data || data.length === 0) {
        setExpanded((prev) => {
          const next = new Set(prev);
          next.delete(row.code);
          return next;
        });
        return;
      }

      insertChildrenAfter(row.code, data, "first");
      setChildPageByParent((prev) => ({ ...prev, [row.code]: 0 }));
      setChildLinksByParent((prev) => ({ ...prev, [row.code]: links }));

      setLoaded((prev) => {
        const next = new Set(prev);
        next.add(row.code);
        return next;
      });
    } catch (e) {
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(row.code);
        return next;
      });
      dispatch(notify({ msg: "Failed to load children", sev: "error" }));
    }
  };

  //  LEFT: Load more roots button
  const canLoadMoreRoots = Boolean(rootLinks?.next);

  const handleLoadMoreRoots = () => {
    if (!rootLinks?.next) return;
    const { page } = extractPaginationFromLink(rootLinks.next);
    rootAppendingRef.current = true;
    setRootPaging((p) => ({ ...p, page, timestamp: Date.now() }));
  };

  // LEFT: Load more children under a parent (uses Link header)
  const canLoadMoreChildren = (parentCode: string) => Boolean(childLinksByParent[parentCode]?.next);

  const handleLoadMoreChildren = async (parentCode: string) => {
    const nextLink = childLinksByParent[parentCode]?.next;
    if (!nextLink) return;

    const { page, size } = extractPaginationFromLink(nextLink);

    setLoadingMoreByParent((prev) => ({ ...prev, [parentCode]: true }));
    try {
      const resp = await fetchChildrenPaged({
        icdCoding,
        parentCategoryCode: parentCode,
        page,
        size: size || 100,
        sort: "categoryCode,asc",
        timestamp: Date.now(),
      }).unwrap();

      const data = (resp as unknown as PagedResult<ICDCategoryDTO>).data ?? [];
      const links = (resp as unknown as PagedResult<ICDCategoryDTO>).links ?? {};

      insertChildrenAfter(parentCode, data, "append");
      setChildPageByParent((prev) => ({ ...prev, [parentCode]: page }));
      setChildLinksByParent((prev) => ({ ...prev, [parentCode]: links }));
    } catch (e) {
      dispatch(notify({ msg: "Failed to load more children", sev: "error" }));
    } finally {
      setLoadingMoreByParent((prev) => ({ ...prev, [parentCode]: false }));
    }
  };

  // RIGHT: Diagnoses pagination
  const totalCount = dxPaged?.totalCount ?? 0;
  const links = dxPaged?.links || {};
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;
  const dxData = dxPaged?.data ?? [];

  const handleDxPageChange = (_: unknown, newPage: number) => {
    const currentPage = paginationParams.page;
    const linksMap = links || {};
    let targetLink: string | null | undefined = null;

    if (newPage > currentPage && linksMap.next) targetLink = linksMap.next;
    else if (newPage < currentPage && linksMap.prev) targetLink = linksMap.prev;
    else if (newPage === 0 && linksMap.first) targetLink = linksMap.first;
    else if (newPage > currentPage + 1 && linksMap.last) targetLink = linksMap.last;

    if (!targetLink) {
      setPaginationParams((p) => ({ ...p, page: newPage, timestamp: Date.now() }));
      return;
    }

    const { page, size } = extractPaginationFromLink(targetLink);
    setPaginationParams((p) => ({ ...p, page, size, timestamp: Date.now() }));
  };

  const handleDxRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value, 10);
    setPaginationParams((p) => ({ ...p, size: newSize, page: 0, timestamp: Date.now() }));
  };

  // RIGHT: Children table pagination (paged)
  const rightChildTotal = childrenPagedResp?.totalCount ?? 0;
  const rightChildLinks = childrenPagedResp?.links || {};
  const rightChildPage = childPagination.page;
  const rightChildSize = childPagination.size;

  const handleChildPageChange = (_: unknown, newPage: number) => {
    const currentPage = childPagination.page;
    let targetLink: string | null | undefined = null;

    if (newPage > currentPage && rightChildLinks.next) targetLink = rightChildLinks.next;
    else if (newPage < currentPage && rightChildLinks.prev) targetLink = rightChildLinks.prev;
    else if (newPage === 0 && rightChildLinks.first) targetLink = rightChildLinks.first;
    else if (newPage > currentPage + 1 && rightChildLinks.last) targetLink = rightChildLinks.last;

    if (!targetLink) {
      setChildPagination((p) => ({ ...p, page: newPage, timestamp: Date.now() }));
      return;
    }

    const { page, size } = extractPaginationFromLink(targetLink);
    setChildPagination((p) => ({ ...p, page, size, timestamp: Date.now() }));
  };

  const handleChildRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value, 10);
    setChildPagination((p) => ({ ...p, size: newSize, page: 0, timestamp: Date.now() }));
  };

  const dxColumns = useMemo(
    () => [
      {
        key: "icdCode",
        title: "Code",
        render: (r: ICDDiagnosisDTO) => <LatinLike value={toLatinDigits(r?.icdCode ?? "")} />,
      },
      {
        key: "icdShortDescription",
        title: "Short Description",
        render: (r: ICDDiagnosisDTO) => r?.icdShortDescription ?? "",
      },
      {
        key: "icdFullDescription",
        title: "Full Description",
        render: (r: ICDDiagnosisDTO) => r?.icdFullDescription ?? "",
      },
    ],
    []
  );

  //  RIGHT table: show code + FULL category name next to it in Code column
  const childColumns = useMemo(
    () => [
      {
        key: "categoryCode",
        title: "Code",
        render: (r: ICDCategoryDTO) => {
          const code = toLatinDigits(r?.categoryCode ?? "");
          const name = r?.categoryName ?? "";
          return (
            <span
              className="icd-link"
              onClick={(e) => {
                e.stopPropagation();
                if (!r?.categoryCode) return;

                setSelectedCategoryCode(r.categoryCode);
                setPaginationParams((p) => ({ ...p, page: 0, timestamp: Date.now() }));
                setChildPagination((p) => ({ ...p, page: 0, timestamp: Date.now() }));

                //  keep leaf row visible + fallback for header
                setLeafRow(r);
              }}
              title={r?.categoryDescription ?? ""}
            >
              <LatinLike value={code} /> <span className="icd-inline-name">{name}</span>
            </span>
          );
        },
      },
      { key: "categoryName", title: "Short Description", render: (r: ICDCategoryDTO) => r?.categoryName ?? "" },
      { key: "categoryDescription", title: "Full Description", render: (r: ICDCategoryDTO) => r?.categoryDescription ?? "" },
    ],
    []
  );

  //  fallback header name/desc (من nodeDetails أو leafRow أو left rows)
  const leftSelected = rows.find((x) => x.code === selectedCategoryCode);
  const headerName = nodeDetails?.selected?.categoryName ?? leafRow?.categoryName ?? leftSelected?.name ?? "";
  const headerDesc = nodeDetails?.selected?.categoryDescription ?? leafRow?.categoryDescription ?? leftSelected?.desc ?? null;

  //  important: leaf + no diagnoses => show Category row (مش diagnoses)
  const showCategoryAsRow = !hasChildren && totalCount === 0;

  const rightTitle = hasChildren ? "Subcategories" : showCategoryAsRow ? "Category" : "Diagnoses";

  return (
    <div className="icd-root">
      <Row className="icd-row">
        {/* LEFT */}
        <Col md={8} className="icd-col">
          <Panel bordered className="icd-panel">
            <div className="icd-left-header">
              <div className="icd-left-title">ICD-10 List</div>
              {rootsLoading ? <div className="icd-muted">Loading...</div> : null}
            </div>

            <div className="icd-left-list">
              {filteredRows.map((r) => {
                const isSelected = r.code === selectedCategoryCode;
                const isOpen = expanded.has(r.code);
                const pad = 10 + r.level * 16;
                const showLoadMoreUnderRow = isOpen && canLoadMoreChildren(r.code);
                const isLoadingMore = Boolean(loadingMoreByParent[r.code]);

                return (
                  <React.Fragment key={r.code}>
                    <div
                      className={`icd-row-item ${isSelected ? "icd-row-item--selected" : ""}`}
                      style={{ paddingLeft: pad }}
                      onClick={() => toggleExpand(r)}
                      title={r.desc ?? ""}
                    >
                      <span className="icd-caret">{isOpen ? "▾" : "▸"}</span>

                      <span className="icd-code icd-code--roman">
                        <LatinLike value={getLeftDisplayCode(String(r.code))} />
                      </span>

                      <span className="icd-name">{r.name}</span>
                    </div>

                    {showLoadMoreUnderRow ? (
                      <div
                        className="icd-muted icd-pad"
                        style={{ paddingLeft: pad + 24, cursor: isLoadingMore ? "default" : "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isLoadingMore) return;
                          handleLoadMoreChildren(r.code);
                        }}
                      >
                        {isLoadingMore ? "Loading..." : "Load more..."}
                      </div>
                    ) : null}
                  </React.Fragment>
                );
              })}

              {!filteredRows.length && !rootsLoading ? <div className="icd-muted icd-pad">No items.</div> : null}

              {canLoadMoreRoots ? (
                <div
                  className="icd-muted icd-pad"
                  style={{ cursor: rootsLoading ? "default" : "pointer" }}
                  onClick={() => {
                    if (rootsLoading) return;
                    handleLoadMoreRoots();
                  }}
                >
                  {rootsLoading ? "Loading..." : "Load more..."}
                </div>
              ) : null}
            </div>
          </Panel>
        </Col>

        {/* RIGHT */}
        <Col md={16} className="icd-col">
          <Panel bordered className="icd-panel">
            {!selectedCategoryCode ? (
              <div className="icd-muted icd-pad">Select a node.</div>
            ) : (
              <>
                <div className="icd-right-header">
                  <div className="icd-right-title">
                    {headerName} <span className="icd-right-code">({toLatinDigits(selectedCategoryCode)})</span>
                  </div>

                  {headerDesc ? <div className="icd-right-desc">{headerDesc}</div> : null}
                </div>

                <div className="icd-right-body">
                  {nodeLoading || dxLoading || childrenLoading ? <div className="icd-muted">Loading...</div> : null}

                  <div className="icd-section-title">{rightTitle}</div>

                  {hasChildren ? (
                    <MyTable
                      data={childrenPagedResp?.data ?? []}
                      columns={childColumns}
                      totalCount={rightChildTotal}
                      loading={nodeLoading || childrenLoading}
                      page={rightChildPage}
                      rowsPerPage={rightChildSize}
                      onPageChange={handleChildPageChange}
                      onRowsPerPageChange={handleChildRowsPerPageChange}
                    />
                  ) : showCategoryAsRow ? (
                    <MyTable
                      data={[
                        leafRow ??
                          nodeDetails?.selected ?? {
                            categoryCode: selectedCategoryCode,
                            icdCoding,
                            categoryName: headerName,
                            categoryDescription: headerDesc,
                            parentCategoryCode: null,
                          },
                      ]}
                      columns={childColumns}
                      totalCount={1}
                      loading={nodeLoading}
                      page={0}
                      rowsPerPage={25}
                      onPageChange={() => {}}
                      onRowsPerPageChange={() => {}}
                    />
                  ) : (
                    <MyTable
                      data={dxData}
                      columns={dxColumns}
                      totalCount={totalCount}
                      loading={nodeLoading || dxLoading}
                      page={pageIndex}
                      rowsPerPage={rowsPerPage}
                      onPageChange={handleDxPageChange}
                      onRowsPerPageChange={handleDxRowsPerPageChange}
                    />
                  )}
                </div>
              </>
            )}
          </Panel>
        </Col>
      </Row>
    </div>
  );
};

export default ICD10BrowserExpand;
