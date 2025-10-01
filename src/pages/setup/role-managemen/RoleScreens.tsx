import React, { useState, useEffect } from "react";
import { MODULES } from "@/config/modules-config";
import Translate from "@/components/Translate";
import MyNestedTable from "@/components/MyNestedTable";
import { SelectPicker } from "rsuite";
import {
  useGetRolePermissionsQuery,
  useUpdateRolePermissionsMutation,
} from "@/services/userService";
import MyButton from "@/components/MyButton/MyButton";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";

interface Permission {
  screen: string;
  permission: "VIEW" | "EDIT";
}

const RoleScreens = ({ roleId }: { roleId: number }) => {
  const dispatch = useAppDispatch();
  const { data: initialPermissions = [], isLoading, refetch } =
    useGetRolePermissionsQuery(roleId);
  const [updatePermissions] = useUpdateRolePermissionsMutation();

  const [selected, setSelected] = useState<Permission[]>([]);
  console.log("Selected",selected)

  // sync from backend
  useEffect(() => {
    setSelected(initialPermissions);
  }, [initialPermissions]);

  useEffect(() => {
    refetch();
  }, [roleId]);

 
  const permissionOptions = [
    { label: "No Access", value: null },
    { label: "View", value: "VIEW" },
    { label: "Edit", value: "EDIT" },
  ];

  
  const setScreenPermission = (screenName: string, value: "VIEW" | "EDIT" | null) => {
    setSelected((prev) => {
      const filtered = prev.filter((s) => s.screen !== screenName);
      if (!value) return filtered; // No Access
      return [...filtered, { screen: screenName, permission: value }];
    });
  };

  
  const setModulePermissions = (screens: any[], value: "VIEW" | "EDIT" | null) => {
    setSelected((prev) => {
      
      const filtered = prev.filter(
        (s) => !screens.some((scr) => scr.name === s.screen)
      );

      if (!value) return filtered; // No Access
     
      const additions = screens.map((scr) => ({
        screen: scr.name,
        permission: value,
      }));
      return [...filtered, ...additions];
    });
  };

  
  const columns = [
    {
      key: "module",
      title: <Translate>Module</Translate>,
      render: (rowData: any) => <div>{rowData.name}</div>,
    },
    {
      key: "permission",
      title: <Translate>Permission</Translate>,
      render: (rowData: any) => {
       
        const screens = rowData.screens || [];
        let current: "VIEW" | "EDIT" | null = null;

        if (screens.length > 0) {
          const perms = screens.map(
            (scr: any) =>
              selected.find((s) => s.screen === scr.name)?.permission ?? null
          );
          const unique = [...new Set(perms)];
          current = unique.length === 1 ? unique[0] : null;
        }

        return (
          <SelectPicker
            cleanable={false}
            searchable={false}
            data={permissionOptions}
            value={current}
            onChange={(value) => setModulePermissions(screens, value)}
            style={{ width: 150 }}
          />
        );
      },
    },
  ];

  
  const screenColumns = (moduleRow: any) => [
    {
      key: "screen",
      title: <Translate>Screen</Translate>,
      render: (rowData: any) => <div>{rowData.name}</div>,
    },
    {
      key: "permission",
      title: <Translate>Permission</Translate>,
      render: (rowData: any) => {
        const current =
          selected.find((s) => s.screen === rowData.name)?.permission ?? null;

        return (
          <SelectPicker
            cleanable={false}
            searchable={false}
            data={permissionOptions}
            value={current}
            onChange={(value) => setScreenPermission(rowData.name, value)}
            style={{ width: 150 }}
          />
        );
      },
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
      dispatch(
        notify({ sev: "error", msg: "Failed to update permissions" })
      );
    }
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <MyNestedTable
        data={MODULES}
        columns={columns}
        getNestedTable={getNestedTable}
       

      />
      <br />
      <MyButton appearance="primary" onClick={handleSave}>
        Save
      </MyButton>
    </div>
  );
};

export default RoleScreens;
