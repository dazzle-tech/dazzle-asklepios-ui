import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useGetUsersQuery } from "@/services/setupService";
import { initialListRequest, ListRequest } from "@/types/types";
import React, { useState, useEffect } from "react";
import { Col, Form, Input, Panel, Row, Text } from "rsuite";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { IoPersonRemove } from "react-icons/io5";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";
import clsx from "clsx";
import SectionContainer from "@/components/SectionsoContainer";

type StaffAssignmentProps = {
  parentKey: string;
  label?: string;
  getQuery: any;
  saveMutation: any;
  deleteMutation: any;
  newStaffObj: any;
  filterFieldName: string;
  disabled?: boolean;
  width?: any;
};

const StaffAssignment: React.FC<StaffAssignmentProps> = ({
  parentKey,
  label = "Staff Members",
  getQuery,
  saveMutation,
  deleteMutation,
  newStaffObj,
  filterFieldName,
  width = "100%",
  disabled = false,
}) => {
  const dispatch = useAppDispatch();
  const [activeRowKey, setActiveRowKey] = useState(null);
  const [staff, setStaff] = useState({ ...newStaffObj, [filterFieldName]: parentKey });
  const [selectedUserList, setSelectedUserList] = useState<any>({ key: [] });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { data: userList } = useGetUsersQuery({ ...initialListRequest });

  const toSnakeCase = (str: string) =>
    str.replace(/([A-Z])/g, '_$1').toLowerCase();

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [{
      fieldName: toSnakeCase(filterFieldName),
      operator: "match",
      value: parentKey
    }]
  });

  const { data: staffList, refetch } = getQuery(listRequest, { skip: !parentKey });
  const [saveStaff] = saveMutation();
  const [deleteStaff] = deleteMutation();

  useEffect(() => {
    setListRequest(prev => ({
      ...prev,
      filters: [{
        fieldName: toSnakeCase(filterFieldName),
        operator: "match",
        value: parentKey
      }]
    }));
  }, [filterFieldName, parentKey]);

  const isSelected = (rowData) => (rowData?.key === staff?.key ? "selected-row" : "");

  const handleSave = async () => {
    const selectedKeys = selectedUserList?.key;
    if (!Array.isArray(selectedKeys) || selectedKeys.length === 0) return;

    try {
      const promises = selectedKeys.map((key) => {
        const user = userList?.object?.find((item) => item.key === key);
        if (user) {
          return saveStaff({
            ...newStaffObj,
            [filterFieldName]: parentKey,
            userKey: user.key,
          });
        }
        return null;
      });

      await Promise.all(promises.filter(Boolean));
      refetch();
      dispatch(notify({ msg: "Saved successfully", sev: "success" }));
      setSelectedUserList({ key: [] }); // ✅ تفريغ بطريقة صحيحة
    } catch (error) {
      dispatch(notify({ msg: "Failed to save staff", sev: "error" }));
    }
  };

  const columns = [
    {
      key: "name",
      title: <Translate>Name</Translate>,
      render: (rowData) => rowData.user?.username,
    },
    {
      key: "responsibility",
      title: <Translate>Responsibility</Translate>,
      render: (rowData) =>
        activeRowKey === rowData.key ? (
          <Input
            style={{ width }}
            onChange={(value) => setStaff({ ...staff, responsibility: value })}
            onPressEnter={async () => {
              try {
                await saveStaff({ ...staff }).unwrap();
                dispatch(notify({ msg: "Saved successfully", sev: "success" }));
                refetch();
                setActiveRowKey(null);
              } catch (error) {
                dispatch(notify({ msg: "Save failed", sev: "error" }));
              }
            }}
          />
        ) : (
          <>
            <FontAwesomeIcon
              icon={faPenToSquare}
              onClick={() => setActiveRowKey(rowData.key)}
              style={{ marginRight: "8px", cursor: "pointer" }}
            />
            {rowData.responsibility}
          </>
        ),
    },
    {
      key: "delete",
      title: <Translate>Delete</Translate>,
      render: (rowData) => (
        <IoPersonRemove
          size={22}
          onClick={() => {
            setConfirmDeleteOpen(true);
            setStaff(rowData);
          }}
        />
      ),
    },
  ];

  const availableUsers = userList?.object?.filter(
    (user) => !staffList?.object?.some((staff) => staff.user?.key === user.key)
  ) ?? [];

  const content = () => {
     return (
    // <Panel
    //   header={label}
    //   collapsible
    //   defaultExpanded
    //   className={clsx("panel-border", {
    //     "disabled-panel": disabled,
    //   })}
    // >
    <div className={clsx("panel-border", {
        "disabled-panel": disabled,
      })}>
      <Row className="rows-gap">
        <Col md={10}>
          <Form fluid>
            <MyInput
              width="100%"
              menuMaxHeight={200}
              placeholder="Staff"
              showLabel={false}
              selectData={availableUsers}
              fieldType="multyPicker"
              selectDataLabel="username"
              selectDataValue="key"
              fieldName="key"
              record={selectedUserList}
              setRecord={setSelectedUserList}
              disabled={!parentKey || disabled}
            />
          </Form>
        </Col>
        <Col md={2}>
          <MyButton onClick={handleSave} disabled={!parentKey || disabled}>
            Save
          </MyButton>
        </Col>
      </Row>
      <Row>
        <Col md={24}>
          <MyTable
            data={staffList?.object || []}
            columns={columns}
            onRowClick={(rowData) => setStaff(rowData)}
            rowClassName={isSelected}
            height={280}
          />
        </Col>
      </Row>

      <DeletionConfirmationModal
        open={confirmDeleteOpen}
        setOpen={setConfirmDeleteOpen}
        itemToDelete="Staff"
        actionButtonFunction={async () => {
          try {
            await deleteStaff(staff.key).unwrap();
            dispatch(notify({ msg: "Deleted successfully", sev: "success" }));
            refetch();
            setConfirmDeleteOpen(false);
          } catch (error) {
            dispatch(notify({ msg: "Delete failed", sev: "error" }));
          }
        }}
        actionType="delete"
      />
      </div>
    // </Panel>
  );
  };

  return (
    // <Panel
    //   header={label}
    //   collapsible
    //   defaultExpanded
    //   className={clsx("panel-border", {
    //     "disabled-panel": disabled,
    //   })}
    // >
    // <div>
    //   <Row className="rows-gap">
    //     <Col md={10}>
    //       <Form fluid>
    //         <MyInput
    //           width="100%"
    //           menuMaxHeight={200}
    //           placeholder="Staff"
    //           showLabel={false}
    //           selectData={availableUsers}
    //           fieldType="multyPicker"
    //           selectDataLabel="username"
    //           selectDataValue="key"
    //           fieldName="key"
    //           record={selectedUserList}
    //           setRecord={setSelectedUserList}
    //           disabled={!parentKey || disabled}
    //         />
    //       </Form>
    //     </Col>
    //     <Col md={2}>
    //       <MyButton onClick={handleSave} disabled={!parentKey || disabled}>
    //         Save
    //       </MyButton>
    //     </Col>
    //   </Row>
    //   <Row>
    //     <Col md={24}>
    //       <MyTable
    //         data={staffList?.object || []}
    //         columns={columns}
    //         onRowClick={(rowData) => setStaff(rowData)}
    //         rowClassName={isSelected}
    //         height={300}
    //       />
    //     </Col>
    //   </Row>

    //   <DeletionConfirmationModal
    //     open={confirmDeleteOpen}
    //     setOpen={setConfirmDeleteOpen}
    //     itemToDelete="Staff"
    //     actionButtonFunction={async () => {
    //       try {
    //         await deleteStaff(staff.key).unwrap();
    //         dispatch(notify({ msg: "Deleted successfully", sev: "success" }));
    //         refetch();
    //         setConfirmDeleteOpen(false);
    //       } catch (error) {
    //         dispatch(notify({ msg: "Delete failed", sev: "error" }));
    //       }
    //     }}
    //     actionType="delete"
    //   />
    //   </div>
    // </Panel>
     <SectionContainer
          title={<Text>{label}</Text>}
          content={content()}
        />
  );
};

export default StaffAssignment;
