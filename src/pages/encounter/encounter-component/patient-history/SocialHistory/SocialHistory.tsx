import React, { useState } from "react";
import PlusIcon from "@rsuite/icons/Plus";
import MyButton from "@/components/MyButton/MyButton";
import "../styles.less";
import MyTable from "@/components/MyTable";
import { MdModeEdit, MdDelete } from "react-icons/md";
import SectionContainer from "@/components/SectionsoContainer";

import {
  useGetPatientSocialHistoryQuery,
  useRemovePatientSocialHistoryMutation,
} from "@/services/patientService";

import { initialListRequest } from "@/types/types";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import AddSocialHistory from "./AddSocialHistory";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";

const SocialHistory = ({ patient, edit }) => {
  const dispatch = useAppDispatch();

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

  // LIST REQUEST
  const [listRequest, setListRequest] = useState({
    ...initialListRequest,
    pageSize: 20,
    filters: [
      { fieldName: "deleted_at", operator: "isNull", value: undefined },
      { fieldName: "patient_key", operator: "match", value: patient?.key },
    ],
  });

  const { data, isLoading } = useGetPatientSocialHistoryQuery(listRequest);


  const [removeSocial] = useRemovePatientSocialHistoryMutation();

  // DELETE
  const handleDelete = (row) => {
    removeSocial(row)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: "Deleted successfully", sev: "success" }));
        setListRequest({
          ...listRequest,
          timestamp: new Date().getTime(),
        });
      })
      .catch(() => {
        dispatch(notify({ msg: "Delete failed", sev: "error" }));
      });
  };

    const formatDate = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleDateString("en-GB"); // dd/mm/yyyy
    };

  const columns = [
    { key: "currentSmoker", title: "CURRENT SMOKER", render: r => r.currentSmoker ? "Yes" : "No" },
    { key: "smokeStartDate", title: "START DATE", render: r => formatDate(r.smokeStartDate) },
    { key: "cigaretteAmount", title: "AMOUNT" },
    { key: "cigaretteType", title: "CIGARETTE TYPE" },

    { key: "previousSmoker", title: "PREVIOUS SMOKER", render: r => r.previousSmoker ? "Yes" : "No" },
    { key: "smokeQuitDate", title: "QUIT DATE", render: r => formatDate(r.smokeQuitDate) },

    { key: "alcoholConsumption", title: "ALCOHOL", render: r => r.alcoholConsumption ? "Yes" : "No" },
    { key: "typeOfAlcohol", title: "TYPE OF ALCOHOL" },
    {
        key: "actions",
        title: "",
        flexGrow: 1,
        render: (row) => (
        <div style={{ display: "flex", gap: "12px" }}>
            <MdModeEdit
            size={22}
            fill="var(--primary-gray)"
            style={{ cursor: "pointer" }}
            onClick={() => {
                setSelectedRow(row);
                setOpen(true);
            }}
            />

            <MdDelete
            size={22}
            fill="var(--primary-pink)"
            style={{ cursor: "pointer" }}
            onClick={() => {
                setRowToDelete(row);
                setOpenDeleteModal(true);
            }}
            />
        </div>
        ),
    },
    ];

    const handlePageChange = (_: unknown, newPage: number) => {
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
    };

    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest({
        ...listRequest,
        pageSize: parseInt(event.target.value, 10),
        pageNumber: 1
    });
    };


  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = data?.extraNumeric ?? 0;



  return (
    <div className="medical-container-div">
      <SectionContainer
        title={
          <>
            Social History
            <MyButton
              disabled={edit}
              prefixIcon={() => <PlusIcon />}
              onClick={() => setOpen(true)}
            >
              Add
            </MyButton>
          </>
        }
        content={
          <>
            <MyTable
              height={450}
              data={data?.object || []}
              loading={isLoading}
              columns={columns}
              page={pageIndex}
              rowsPerPage={rowsPerPage}
              totalCount={totalCount}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />

            <AddSocialHistory
              open={open}
              setOpen={() => {
                setSelectedRow(null);
                setOpen(false);

                setListRequest({
                  ...listRequest,
                  timestamp: new Date().getTime(),
                });
              }}
              initialData={selectedRow}
              patient={patient}
            />

            <DeletionConfirmationModal
              open={openDeleteModal}
              setOpen={setOpenDeleteModal}
              itemToDelete="Social History Item"
              actionType="delete"
              actionButtonFunction={() => {
                if (rowToDelete) {
                  handleDelete(rowToDelete);
                  setOpenDeleteModal(false);
                  setRowToDelete(null);
                }
              }}
            />
          </>
        }
      />
    </div>
  );
};

export default SocialHistory;
