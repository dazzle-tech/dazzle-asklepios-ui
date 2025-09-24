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
  console.log("RoleScreens for roleId:", roleId);
  const dispatch = useAppDispatch();
  const { data: initialPermissions = [], isLoading, refetch } =

    useGetRolePermissionsQuery(roleId);
    console.log("screens:", initialPermissions);
  const [updatePermissions] = useUpdateRolePermissionsMutation();

  const [selected, setSelected] = useState<Permission[]>([]);

  // sync from backend
  useEffect(() => {
    setSelected(initialPermissions);
  }, [initialPermissions]);

  useEffect(() => {
    refetch();
  }, [roleId]);

  // options
  const permissionOptions = [
    { label: "No Access", value: null },
    { label: "View", value: "VIEW" },
    { label: "Edit", value: "EDIT" },
  ];

  // helper لتغيير صلاحية شاشة معينة
  const setScreenPermission = (screenName: string, value: "VIEW" | "EDIT" | null) => {
    setSelected((prev) => {
      const filtered = prev.filter((s) => s.screen !== screenName);
      if (!value) return filtered; // No Access
      return [...filtered, { screen: screenName, permission: value }];
    });
  };

  // helper لتغيير صلاحيات كل الشاشات في module
  const setModulePermissions = (screens: any[], value: "VIEW" | "EDIT" | null) => {
    setSelected((prev) => {
      // امسح صلاحيات الشاشات تبع هذا الموديول
      const filtered = prev.filter(
        (s) => !screens.some((scr) => scr.name === s.screen)
      );

      if (!value) return filtered; // No Access
      // ضيف نفس الصلاحية لكل الشاشات
      const additions = screens.map((scr) => ({
        screen: scr.name,
        permission: value,
      }));
      return [...filtered, ...additions];
    });
  };
  // الجدول الرئيسي للموديولات
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
        // هل كل الشاشات في هذا الموديول نفس القيمة؟
        const screens = rowData.screens || [];
        let current: "VIEW" | "EDIT" | null = null;

        if (screens.length > 0) {
          const perms = screens.map(
            (scr: any) =>
              selected.find((s) => s.screen === scr.name)?.permission ?? null
          );
          const unique = [...new Set(perms)];
          current = unique.length === 1 ? unique[0] : null; // لو كلهم نفس القيمة بنعرضها، غير هيك No Access
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

  // الجدول الفرعي لكل موديول
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
