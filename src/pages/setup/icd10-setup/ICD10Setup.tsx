import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { setDivContent, setPageCode } from "@/reducers/divSlice";
import MyTable from "@/components/MyTable";
import {
  useGetAllIcd10Query,
  useImportIcd10Mutation,
  useSearchIcd10Query,
} from "@/services/setup/icd10service";
import MyButton from "@/components/MyButton/MyButton";
import { notify } from "@/utils/uiReducerActions";
import { extractPaginationFromLink } from "@/utils/paginationHelper";
import { Col, Form, Row } from "rsuite";
import MyInput from "@/components/MyInput";

const ICD10Setup = () => {
  const dispatch = useDispatch();

  const [keyword, setKeyword] = useState(""); // 🔍 البحث
  const [isSearching, setIsSearching] = useState(false);

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: "id,asc",
    timestamp: Date.now(),
  });

  // 🔹 البيانات العادية
  const { data: icdListResponse, isFetching, refetch } =
    useGetAllIcd10Query(paginationParams);

  // 🔹 نتائج البحث
  const { data: searchResults, isFetching: isSearchingData } =
    useSearchIcd10Query(
      { keyword, ...paginationParams },
      { skip: !isSearching || !keyword } // ⛔ لا يبحث إلا عند وجود keyword
    );

  const [importIcd10, { isLoading: isImporting }] = useImportIcd10Mutation();

  const activeData = isSearching ? searchResults : icdListResponse;
  const totalCount = activeData?.totalCount ?? 0;
  const links = activeData?.links || {};
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;

  useEffect(() => {
    dispatch(setPageCode("ICD10"));
    dispatch(setDivContent("ICD-10 Diagnosis List"));
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleClickUpload = () => fileInputRef.current?.click();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importIcd10(file).unwrap();
      dispatch(
        notify({ msg: "ICD-10 file imported successfully", sev: "success" })
      );
      refetch();
    } catch (error) {
      dispatch(
        notify({ msg: "Error importing ICD-10 file", sev: "error" })
      );
    }
  };

  // 🔍 تنفيذ البحث
  const handleSearch = () => {
    if (!keyword.trim()) {
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
  };

  const columns = [
    { key: "code", title: "Code", render: (rowData) => rowData?.code ?? "" },
    {
      key: "description",
      title: "Description",
      render: (rowData) => rowData?.description ?? "",
    },
    {
      key: "version",
      title: "Version",
      render: (rowData) => rowData?.version ?? "",
    },
    {
      key: "lastUpdated",
      title: "Last Updated",
      render: (rowData) => {
        if (!rowData?.lastUpdated) return "";
        const date = new Date(rowData.lastUpdated);
        return date.toLocaleDateString();
      },
    },
  ];

  return (
    <div>
      <Row className="mb-3" style={{ gap: "10px", alignItems: "center" }}>
        <Col md={3} sm={10}>
          <MyButton appearance="ghost" onClick={handleDownloadTemplate}>
            Download Template
          </MyButton>
        </Col>
        <Col md={3} sm={10}>
          <MyButton onClick={handleClickUpload} loading={isImporting}>
            Upload ICD-10 CSV
          </MyButton>
        </Col>
        <Col md={3} sm={12}>
        <Form >
           <MyInput
            fieldName="search"
            placeholder="Search by code or description"
            fieldType="text"
            record={{ search: keyword }}
            setRecord={(r) => setKeyword(r.search)}
            showLabel={false}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </Form>
         
        </Col>
        <Col md={2} sm={6}>
          <MyButton color="var(--deep-blue)" onClick={handleSearch}>
            Search
          </MyButton>
        </Col>
      </Row>

      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />

      <MyTable
        data={activeData?.data ?? []}
        columns={columns}
        totalCount={totalCount}
        loading={isFetching || isSearchingData}
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
