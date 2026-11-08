import { useState, type ChangeEvent } from 'react';

const useStatementTablePaging = (initialSize = 10) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialSize);

  return {
    page,
    rowsPerPage,
    onPageChange: (_: unknown, nextPage: number) => setPage(nextPage),
    onRowsPerPageChange: (event: ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    }
  };
};

export default useStatementTablePaging;
