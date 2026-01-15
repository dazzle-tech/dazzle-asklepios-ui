import React, { useState } from "react";
import PlusIcon from "@rsuite/icons/Plus";
import MyButton from "@/components/MyButton/MyButton";
import "../styles.less";
import MyTable from "@/components/MyTable";
import { MdModeEdit, MdDelete } from "react-icons/md";
import SectionContainer from "@/components/SectionsoContainer";
import {
  useGetPatientSurgicalHistoryQuery,
  useRemovePatientSurgicalHistoryMutation,
} from "@/services/patientService";
import { initialListRequest } from "@/types/types";
import { formatDateWithoutSeconds } from "@/utils";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import AddSurgicalHistory from "./AddSurgicalHistory";

const SurgicalHistory = ({ patient, edit,
  toShowData=false
 }) => {
  const dispatch = useAppDispatch();

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

  const [listRequest, setListRequest] = useState({
    ...initialListRequest,
    pageSize: 20,
    filters: [
      { fieldName: "deleted_at", operator: "isNull", value: undefined },
      { fieldName: "patient_key", operator: "match", value: patient?.key },
    ],
  });

  const { data, isLoading } = useGetPatientSurgicalHistoryQuery(listRequest);

  const { data: anesthLov } = useGetLovValuesByCodeQuery("ANESTH_TYPES");
  const { data: compLov } = useGetLovValuesByCodeQuery("PROC_COMPLIC");
  const { data: advLov } = useGetLovValuesByCodeQuery("MED_ADVERS_EFFECTS");

const [removePatientSurgicalHistory] = useRemovePatientSurgicalHistoryMutation();

const handleDelete = (row) => {
  if (!row?.key) return;

  removePatientSurgicalHistory({
    key: row.key,
    patientKey: patient?.key
  })
    .unwrap()
    .then(() => {
      dispatch(notify({ msg: "Deleted successfully", sev: "success" }));

      // refresh list
      setListRequest({
        ...listRequest,
        timestamp: new Date().getTime(),
      });
    })
    .catch((err) => {
      dispatch(notify({ msg: "Delete failed", sev: "error" }));
    });
};


const mapKeysToLovLabels = (keys?: string, lovList?: any[]) => {
  if (!keys || !lovList?.length) return '-';

  const arr = keys.split(',');

  return lovList
    .filter(lov => arr.includes(lov.key))
    .map(lov => lov.lovDisplayVale)
    .join(', ');
};



 const columns = [
  { key: "surgery", title: "SURGERY", dataKey: "surgery", flexGrow: 3 },

  {
    key: "dateOfSurgery",
    title: "DATE OF SURGERY",
    flexGrow: 3,
    render: (row) =>
      row.dateOfSurgery ? formatDateWithoutSeconds(row.dateOfSurgery) : "",
  },

  { key: "facility", title: "FACILITY", dataKey: "facility", flexGrow: 2 },

  {
    key: "complicationsLkey",
    title: "COMPLICATIONS",
    flexGrow: 3,
    render: (row) =>
      compLov?.object?.find((x) => x.key === row.complicationsLkey)
        ?.lovDisplayVale ?? "",
  },

  {
    key: "anesthesiaTypeLkey",
    title: "TYPE OF ANESTHESIA",
    flexGrow: 3,
    render: (row) =>
      anesthLov?.object?.find((x) => x.key === row.anesthesiaTypeLkey)
        ?.lovDisplayVale ?? "",
  },

  {
    key: "adverseReactionsToAnesthesiaLkey",
    title: "ADVERSE REACTIONS",
    flexGrow: 3,
    render: (row) =>
      mapKeysToLovLabels(
        row.adverseReactionsToAnesthesiaLkey,
        advLov?.object
      ),
  },


  {
    key: "isImplantsOrDevices",
    title: "IMPLANTS OR DEVICES",
    flexGrow: 3,
    render: (row) =>
      row.isImplantsOrDevices ? row.implantsOrDevicesDescription : "No",
  },

  ...(!toShowData
    ? [
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
                onClick={(e) => {
                  e.stopPropagation();
                  setRowToDelete(row);
                  setOpenDeleteModal(true);
                }}
              />
            </div>
          ),
        },
      ]
    : []),
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
            Surgical History
          { !toShowData&&<MyButton
              disabled={edit}
              prefixIcon={() => <PlusIcon />}
              onClick={() => setOpen(true)}
            >
              Add
            </MyButton>}
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

            <AddSurgicalHistory
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
              itemToDelete="Surgical History"
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

export default SurgicalHistory;
