import React from "react";
import { useState, useEffect } from 'react';
import { useSaveTeleConsultationProgressNotesMutation
    , useGetTeleConsultationProgressNotesListQuery
 } from "@/services/encounterService";
import DeleteIcon from '@mui/icons-material/Delete';
import Translate from '@/components/Translate';
import AddIcon from '@mui/icons-material/Add';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal/DeletionConfirmationModal';
import { FaCheck } from 'react-icons/fa6';
import { ApTeleConsultationProgressNote } from "@/types/model-types";
import { newApTeleConsultationProgressNote } from "@/types/model-types-constructor";
import { initialListRequest, initialListRequestId } from "@/types/types";
import { filter } from "lodash";
import { Box, IconButton, InputBase } from "@mui/material";
import { Panel } from "rsuite";
import { useSelector } from "react-redux";
import { formatDateWithoutSeconds } from "@/utils";
const ProgressNote = ({ consultaition ,list}) => {
    const sliceauth = useSelector((state: any) => state.auth);
    console.log("user", sliceauth.user);
    console.log("consultaition", consultaition);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
 
  const [saveProgressNotes, saveProgressNotesMutation] = useSaveTeleConsultationProgressNotesMutation();


    console.log("fetchedProgressNotes", list);
   
  const [notesList, setNotesList] = useState<ApTeleConsultationProgressNote[]>(
  list ?? []
);
 
  useEffect(() => {
    if (list) {
      setNotesList(list);
    }
  }, [list]);

  const handleNoteChange = (value: string, index: number) => {
    const updatedNotes = [...notesList];
    updatedNotes[index] = { ...updatedNotes[index], note: value };
    setNotesList(updatedNotes);
  };

  const handleAddNew = () => {
    const newNote: ApTeleConsultationProgressNote = {
      ...newApTeleConsultationProgressNote,
      teleConsultationId: consultaition.id,
      createdDate:  Date.now(),
        createdBy: sliceauth.user?.login || 'Admin',
      

    };
    setNotesList((prev) => [...prev, newNote]);
  };

  const handleSave = async () => {
    try {
      for (const note of notesList) {
        await saveProgressNotes(note).unwrap();
      }
    
    } catch (err) {
      console.error("Failed to save notes", err);
    }
  };

  const columns = [
    {
      key: "note",
      title: <Translate>Progress Note</Translate>,
      render: (row: any, index: number) => (
        <InputBase
          multiline
          fullWidth
          value={row.note}
          onChange={(e) => handleNoteChange(e.target.value, index)}
          sx={{ padding: 1, border: "1px solid #ccc", borderRadius: 1 }}
        />
      ),
    },
   {
  key: "audit",
  title: <Translate>Audit</Translate>,
  render: (row: any) => {
    const createdDate = row.createDate
      ? new Date(row.createDate).toISOString().slice(0, 16).replace("T", " ")
      : "";
    return (
      <Box sx={{ fontSize: "14px", color: "#555" }}>
        {`Created @ ${formatDateWithoutSeconds(row.createdDate)} By ${row.createdBy || "Unknown"}`}
      </Box>
    );
  },
},

    {
      key: "actions",
      title: <Translate>Delete</Translate>,
      align: "center" as const,
      render: (row: any, index: number) => (
        <IconButton
          size="small"
          onClick={() => {
            const updated = [...notesList];
            updated.splice(index, 1);
            setNotesList(updated);
          }}
        >
          <DeleteIcon color="error" />
        </IconButton>
      ),
    },
  ];

  return (
    <Panel
      header={
        <Box display={"flex"} justifyContent={"space-between"} gap={2} my={1}>
          <Translate>Progress Notes</Translate>
          <Box display="flex" gap={2} justifyContent={"flex-end"}>
            <MyButton onClick={handleAddNew}>
              <AddIcon /> Add New
            </MyButton>
            <MyButton
              onClick={handleSave}
              disabled={saveProgressNotesMutation.isLoading}
            >
              <FaCheck /> Save Notes
            </MyButton>
          </Box>
        </Box>
      }
    >
      <MyTable
        data={notesList}
        columns={columns}
        height={400}
        loading={saveProgressNotesMutation.isLoading}
      />

      <DeletionConfirmationModal
        open={confirmDeleteOpen}
        setOpen={setConfirmDeleteOpen}
        itemToDelete="note"
        actionType="delete"
      />
    </Panel>
  );
};

export default ProgressNote;
 