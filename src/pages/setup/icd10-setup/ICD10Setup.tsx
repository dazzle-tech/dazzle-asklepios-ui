import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import ReactDOMServer from "react-dom/server";
import { setDivContent, setPageCode } from "@/reducers/divSlice";
import MyTable from "@/components/MyTable";
import { useGetAllIcd10Query } from "@/services/setup/icd10service";

const ICD10Setup = () => {
  const dispatch = useDispatch();

  // Pagination state
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: "id,asc",
    timestamp: Date.now(),
  });

  // Fetch data
  const { data: icdListResponse, isFetching } =
    useGetAllIcd10Query(paginationParams);

  const totalCount = icdListResponse?.totalCount ?? 0;
  const links = icdListResponse?.links || {};
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;

  // Page header setup
  useEffect(() => {
    const divContent = (
      <div className="page-title">
        <h5>ICD-10 Diagnosis List</h5>
      </div>
    );
    const html = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode("ICD10"));
    dispatch(setDivContent(html));
    return () => {
      dispatch(setPageCode(""));
      dispatch(setDivContent(""));
    };
  }, [dispatch]);

  // Pagination handler
  const handlePageChange = (_: unknown, newPage: number) => {
    let targetLink: string | null | undefined = null;

    if (newPage > paginationParams.page && links.next) targetLink = links.next;
    else if (newPage < paginationParams.page && links.prev)
      targetLink = links.prev;
    else if (newPage === 0 && links.first) targetLink = links.first;
    else if (newPage > paginationParams.page + 1 && links.last)
      targetLink = links.last;

    if (targetLink) {
      const match = targetLink.match(/[?&]page=(\d+)&size=(\d+)/);
      if (match) {
        const page = parseInt(match[1], 10);
        const size = parseInt(match[2], 10);
        setPaginationParams({
          ...paginationParams,
          page,
          size,
          timestamp: Date.now(),
        });
      }
    }
  };

  // Table columns
  const columns = [
    { key: "icdCode", title: "Code", render: (rowData) => rowData?.icdCode ?? "N/A" },
    { key: "description", title: "Short Description", render: (rowData) => rowData?.description ?? "N/A" },
    { key: "fulldescription", title: "Full Description", render: (rowData) => rowData?.fulldescription ?? "N/A" },
  ];

  return (
    <MyTable
      data={icdListResponse?.data ?? []}
      columns={columns}
      totalCount={totalCount}
      loading={isFetching}
      page={pageIndex}
      rowsPerPage={rowsPerPage}
      onPageChange={handlePageChange}
      onRowsPerPageChange={(e) => {
        setPaginationParams({
          ...paginationParams,
          size: Number(e.target.value),
          page: 0,
          timestamp: Date.now(),
        });
      }}
    />
  );
};

export default ICD10Setup;
