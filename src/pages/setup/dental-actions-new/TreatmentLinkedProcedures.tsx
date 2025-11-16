import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Col, Form, Row } from 'rsuite';
import './styles.less';
import { MdDelete } from 'react-icons/md';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { PiToothFill } from 'react-icons/pi';

import {
  useGetByDentalActionQuery,
  useCreateMutation,
  useDeleteMutation,
} from '@/services/setup/dental-action/CdtDentalActionService';

import { useGetAllCdtQuery } from '@/services/setup/cdtCodeService';  // ← NEW
import { useGetCdtByCodeQuery } from '@/services/setup/cdtCodeService';
import { extractPaginationFromLink } from '@/utils/paginationHelper';

const TreatmentLinkedProcedures = ({
  open,
  setOpen,
  dentalAction,
  width,
}) => {
  const dispatch = useAppDispatch();

  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedCdt, setSelectedCdt] = useState({ selectedCdtCode: '' });

  // -----------------------------------------
  // 1) LOAD LINKED PROCEDURES
  // -----------------------------------------
  const { data: linkedProcedures = [], refetch } =
    useGetByDentalActionQuery(dentalAction?.id, { skip: !dentalAction?.id });
console.log("den",linkedProcedures)
  const [createLink] = useCreateMutation();
  const [deleteLink] = useDeleteMutation();

  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  // -----------------------------------------
  // 2) SEARCH + DUAL PAGINATION SYSTEM
  // -----------------------------------------
  const [searchCode, setSearchCode] = useState("");
  const [allPage, setAllPage] = useState(0);
  const [searchPage, setSearchPage] = useState(0);
  const [allCdts, setAllCdts] = useState([]);

  // ----------- A) Query for Full List (first load) -----------
  const { data: allPageResponse } = useGetAllCdtQuery({
    page: allPage,
    size: 5,
  });

  // ----------- B) Query for Search Results ------------------
  const { data: searchPageResponse } = useGetCdtByCodeQuery(
    searchCode
      ? { code: searchCode, page: searchPage, size: 50 }
      : undefined,
    { skip: !searchCode }
  );

  // ----------- C) Reset Pages When Search Changes ----------
  useEffect(() => {
    setAllCdts([]);
    setAllPage(0);
    setSearchPage(0);
  }, [searchCode]);

  // ----------- D) Merge Results Into allCdts ---------------
  useEffect(() => {
    const response = searchCode ? searchPageResponse : allPageResponse;
    if (!response?.data) return;

    const mapped = response.data.map((item) => ({
      ...item,
      combinedLabel: `${item.code} / ${item.description}`,
    }));

    const isFirstPage = searchCode ? searchPage === 0 : allPage === 0;

    setAllCdts((prev) => (isFirstPage ? mapped : [...prev, ...mapped]));
  }, [allPageResponse, searchPageResponse]);

  // ----------- E) Has More? ----------------
  const activeResponse = searchCode ? searchPageResponse : allPageResponse;
  const hasMore = Boolean(activeResponse?.links?.next);

  // -----------------------------------------
  // 3) ADD LINK
  // -----------------------------------------
  const handleAdd = async () => {
    if (!selectedCdt.selectedCdtCode) {
      dispatch(notify({ msg: 'Please select a CDT', sev: 'error' }));
      return;
    }

    try {
      await createLink({
        dentalActionId: dentalAction.id,
        cdtCode: selectedCdt.selectedCdtCode,
      }).unwrap();

      dispatch(notify({ msg: 'Linked successfully', sev: 'success' }));
      refetch();
      setSelectedCdt({ selectedCdtCode: '' });
    } catch {
      dispatch(notify({ msg: 'CDT already linked', sev: 'error' }));
    }
  };

  // -----------------------------------------
  // 4) DELETE LINK
  // -----------------------------------------
  const handleDelete = async () => {
    try {
      await deleteLink(selectedRow.id).unwrap();
      dispatch(notify({ msg: 'Removed successfully', sev: 'success' }));
      refetch();
      setSelectedRow(null);
    } catch {
      dispatch(notify({ msg: 'Delete failed', sev: 'error' }));
    }
    setOpenDeleteModal(false);
  };

  // -----------------------------------------
  // 5) TABLE COLUMNS
  // -----------------------------------------
  const tableColumns = [
    {
      key: 'cdtCode',
      title: <Translate>CDT Code</Translate>,
      flexGrow: 3,
       render: (row) => {
        return row?.cdtCode.code ?? '';
      },
    },
    {
      key: 'description',
      title: <Translate>Description</Translate>,
      flexGrow: 4,
      render: (row) => {
        return row?.cdtCode.description ?? '';
      },
    },
    {
      key: 'icons',
      title: <Translate>Remove</Translate>,
      flexGrow: 1,
      render: () => (
        <MdDelete
          className="icons-style"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => setOpenDeleteModal(true)}
        />
      ),
    },
  ];

  // -----------------------------------------
  // 6) SELECTED ROW STYLE
  // -----------------------------------------
  const isSelected = (row) =>
    selectedRow && row.id === selectedRow.id ? 'selected-row' : '';

  // -----------------------------------------
  // 7) UI
  // -----------------------------------------
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Treatment Linked Procedures"
      position="right"
      size={width > 600 ? '36vw' : '70vw'}
      steps={[{ title: 'Treatment Linked Procedures', icon: <PiToothFill /> }]}
      actionButtonLabel="Close"
      actionButtonFunction={() => setOpen(false)}
      content={() => (
        <Form fluid className="container-of-linked-procedures-dental">
          <Col>

            {/* CDT SELECT WITH SEARCH + PAGINATION */}
            <Row>
              <MyInput
                fieldType="selectPagination"
                fieldName="selectedCdtCode"
                showLabel={false}
                selectData={allCdts}
                selectDataLabel="combinedLabel"
                selectDataValue="code"
                record={selectedCdt}
                setRecord={setSelectedCdt}
                searchable
                width={width < 880 ? '100%' : 520}
                hasMore={hasMore}
                searchKeyWard={searchCode}
                setSearchKeyWard={setSearchCode}
                onFetchMore={() => {
                  if (!hasMore) return;

                  const nextLink = activeResponse.links.next;
                  const { page } = extractPaginationFromLink(nextLink);

                  if (searchCode) {
                    setSearchPage(page);
                  } else {
                    setAllPage(page);
                  }
                }}
              />
            </Row>

            {/* ADD BUTTON */}
            <Row>
              <MyButton
                width={width < 880 ? '100%' : '50%'}
                color="var(--deep-blue)"
                onClick={handleAdd}
              >
                Link CDT Procedure to Treatment
              </MyButton>
            </Row>
          </Col>

          {/* TABLE */}
          <MyTable
            height={350}
            data={linkedProcedures}
            columns={tableColumns}
            rowClassName={isSelected}
            onRowClick={setSelectedRow}
          />

          {/* DELETE CONFIRM */}
          <DeletionConfirmationModal
            open={openDeleteModal}
            setOpen={setOpenDeleteModal}
            itemToDelete="Linked CDT"
            actionButtonFunction={handleDelete}
            actionType="Delete"
          />
        </Form>
      )}
    />
  );
};

export default TreatmentLinkedProcedures;
