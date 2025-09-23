import React, { useState, useEffect } from "react";
import { MODULES } from "@/config/modules-config";
import Translate from "@/components/Translate";
import MyNestedTable from "@/components/MyNestedTable";
import { Checkbox } from "rsuite";
import {
  useGetRolePermissionsQuery,
  useUpdateRolePermissionsMutation,
} from "@/services/userService";
import MyButton from "@/components/MyButton/MyButton";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";

interface Permission {
  screen: string; // Friendly Name, ex: "Patient Registration"
  permission: "VIEW" | "EDIT";
}

const RoleScreens = ({ roleId }: { roleId: number }) => {
  const dispatch = useAppDispatch();
  const { data: initialPermissions = [], isLoading } =
    useGetRolePermissionsQuery(roleId);
  const [updatePermissions] = useUpdateRolePermissionsMutation();

  const [selected, setSelected] = useState<Permission[]>([]);

  // sync from backend
  useEffect(() => {
    if (initialPermissions.length) {
      setSelected(initialPermissions);
    }
  }, [initialPermissions]);

  // toggle permission لشاشة واحدة
  const togglePermission = (screen: string, permission: "VIEW" | "EDIT") => {
    setSelected((prev) => {
      const exists = prev.find(
        (item) => item.screen === screen && item.permission === permission
      );
      return exists
        ? prev.filter(
            (item) => !(item.screen === screen && item.permission === permission)
          )
        : [...prev, { screen, permission }];
    });
  };

  // select all لشاشات الموديول
  const selectAll = (screens: any[], permission: "VIEW" | "EDIT") => {
    setSelected((prev) => {
      const filtered = prev.filter(
        (item) =>
          !screens.some(
            (scr) => scr.name === item.screen && item.permission === permission
          )
      );
      const additions = screens.map((scr) => ({
        screen: scr.name,
        permission,
      }));
      return [...filtered, ...additions];
    });
  };

  // deselect all لشاشات الموديول
  const deselectAll = (screens: any[], permission: "VIEW" | "EDIT") => {
    setSelected((prev) =>
      prev.filter(
        (item) =>
          !screens.some(
            (scr) => scr.name === item.screen && item.permission === permission
          )
      )
    );
  };

  // الجدول الرئيسي للموديولات
  const columns = [
    {
      key: "module",
      title: <Translate>Module</Translate>,
      render: (rowData: any) => <div>{rowData.name}</div>,
    },
    {
      key: "view",
      title: <Translate>View</Translate>,
      render: (rowData: any) => {
        const allChecked = rowData.screens?.every((scr: any) =>
          selected.some(
            (s) => s.screen === scr.name && s.permission === "VIEW"
          )
        );
        return (
          <Checkbox
            checked={allChecked}
            onChange={(checked) =>
              checked
                ? selectAll(rowData.screens, "VIEW")
                : deselectAll(rowData.screens, "VIEW")
            }
          />
        );
      },
    },
    {
      key: "edit",
      title: <Translate>Edit</Translate>,
      render: (rowData: any) => {
        const allChecked = rowData.screens?.every((scr: any) =>
          selected.some(
            (s) => s.screen === scr.name && s.permission === "EDIT"
          )
        );
        return (
          <Checkbox
            checked={allChecked}
            onChange={(checked) =>
              checked
                ? selectAll(rowData.screens, "EDIT")
                : deselectAll(rowData.screens, "EDIT")
            }
          />
        );
      },
    },
  ];

  // الجدول الفرعي لكل موديول
  const screenColumns = (moduleRow: any) => [
    {
      key: "screen",
      title: <Translate>Screen</Translate>,
      render: (rowData: any) => <div>{rowData.name}</div>,
    },
    {
      key: "view",
      title: <Translate>View</Translate>,
      render: (rowData: any) => (
        <Checkbox
          checked={selected.some(
            (s) => s.screen === rowData.name && s.permission === "VIEW"
          )}
          onChange={() => togglePermission(rowData.name, "VIEW")}
        />
      ),
    },
    {
      key: "edit",
      title: <Translate>Edit</Translate>,
      render: (rowData: any) => (
        <Checkbox
          checked={selected.some(
            (s) => s.screen === rowData.name && s.permission === "EDIT"
          )}
          onChange={() => togglePermission(rowData.name, "EDIT")}
        />
      ),
    },
  ];

  const getNestedTable = (rowData: any) => ({
    data: rowData.screens || [],
    columns: screenColumns(rowData),
  });

  const handleSave = async () => {
    try {
      await updatePermissions({ roleId, permissions: selected }).unwrap();
      dispatch(
        notify({ sev: "success", msg: "Permissions updated successfully" })
      );
    } catch (err) {
      dispatch(notify({ sev: "error", msg: "Failed to update permissions" }));
    }
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <MyNestedTable
        data={MODULES}
        columns={columns}
        getNestedTable={getNestedTable}
        height={500}
      />
      <br />
      <MyButton appearance="primary" onClick={handleSave}>
        Save
      </MyButton>
    </div>
  );
};

export default RoleScreens;
