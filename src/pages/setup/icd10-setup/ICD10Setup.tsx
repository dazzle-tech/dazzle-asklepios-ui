
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import ReactDOMServer from "react-dom/server";
import { setDivContent, setPageCode } from "@/reducers/divSlice";
import MyTable from "@/components/MyTable";
import { useGetAllIcd10Query, useImportIcd10Mutation } from "@/services/setup/icd10service";
import { Button, CircularProgress } from "@mui/material";
import MyButton from "@/components/MyButton/MyButton";
import { notify } from "@/utils/uiReducerActions";
import { extractPaginationFromLink } from "@/utils/paginationHelper";
import { Col, Row } from "rsuite";

const ICD10Setup = () => {
  const dispatch = useDispatch();

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: "id,asc",
    timestamp: Date.now(),
  });

  const { data: icdListResponse, isFetching, refetch } =
    useGetAllIcd10Query(paginationParams);
  const [importIcd10, { isLoading: isImporting }] = useImportIcd10Mutation();

  const totalCount = icdListResponse?.totalCount ?? 0;
  const links = icdListResponse?.links || {};
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;

  useEffect(() => {
    const divContent = (
      <div className="page-title flex justify-between items-center">
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

  const handlePageChange = (_: unknown, newPage: number) => {
    let targetLink: string | null | undefined = null;

    if (newPage > paginationParams.page && links.next) targetLink = links.next;
    else if (newPage < paginationParams.page && links.prev)
      targetLink = links.prev;
    else if (newPage === 0 && links.first) targetLink = links.first;
    else if (newPage > paginationParams.page + 1 && links.last)
      targetLink = links.last;

    if (targetLink) {
      const { page, size } = extractPaginationFromLink(targetLink);
      setPaginationParams({
        ...paginationParams,
        page,
        size,
        timestamp: Date.now(),
      });
    }
  };



  const handleDownloadTemplate = () => {
    const csvContent = "code,description,version,is_active";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ICD10_Template.csv";
    link.click();
  };


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importIcd10(file).unwrap();
      dispatch(notify({ msg: "ICD-10 file imported successfully", sev: "success" }));

      refetch();
    } catch (error) {
      dispatch(notify({ msg: "Error importing ICD-10 file", sev: "error" }));

    }
  };

  const columns = [
    { key: "code", title: "Code", render: (rowData) => rowData?.code ?? "" },
    { key: "description", title: "Description", render: (rowData) => rowData?.description ?? "" },
    { key: "version", title: "Version", render: (rowData) => rowData?.version ?? "" },
    {
      key: "lastUpdated",
      title: "Last Updated",
      render: (rowData) => {
        if (!rowData?.lastUpdated) return "";
        const date = new Date(rowData.lastUpdated);
        return date.toLocaleDateString(); // يعطيك مثلاً: 27/10/2025
      },
    }


  ];
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };
  return (
    <div>
    <Row>
      <Col md={3} sm={10}>
        <MyButton appearance="ghost" onClick={handleDownloadTemplate}>
          Download Template
        </MyButton></Col> 
      <Col md={3} sm={10}>
        <MyButton onClick={handleClickUpload} loading={isImporting}>
          Upload ICD-10 CSV
        </MyButton>

      </Col>
       
    </Row>
     <div className="">
      

      

        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />

      </div>

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
    </div>
  );
};

export default ICD10Setup;
