import React, { useState, useEffect } from "react";
import { MODULES } from "@/config/modules-config";
import Translate from "@/components/Translate";
import MyNestedTable from "@/components/MyNestedTable";
import MyButton from "@/components/MyButton/MyButton";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";
import {
  useGetRolePermissionsQuery,
  useUpdateRolePermissionsMutation,
} from "@/services/userService";
import { useEnumByName } from "@/services/enumsApi";
import { Toggle } from "rsuite";

interface Permission {
  screen: string;
  permission: string;
}

const RoleScreens = ({ roleId }: { roleId: number }) => {
  const dispatch = useAppDispatch();
  const Operations: string[] = useEnumByName("Operation") || [];

  const { data: initialPermissions = [], isLoading, refetch } =
    useGetRolePermissionsQuery(roleId);
  const [updatePermissions] = useUpdateRolePermissionsMutation();

  const [selected, setSelected] = useState<Permission[]>([]);

  useEffect(() => {
    if (initialPermissions?.length) {
      setSelected(initialPermissions);
    }
  }, [initialPermissions]);

  useEffect(() => {
    refetch();
  }, [roleId]);

  /** ✅ تفعيل / إلغاء عملية واحدة */
  const togglePermission = (screenCode: string, operation: string) => {
  setSelected((prev) => {
    const exists = prev.some(
      (p) => p.screen === screenCode && p.permission === operation
    );

    let updated = [...prev];

    if (exists) {
      // 🔴 لو كانت العملية موجودة → احذفها
      updated = updated.filter(
        (p) => !(p.screen === screenCode && p.permission === operation)
      );

      // ❗ لو كانت العملية VIEW وانطفت، لازم نطفي معها EDIT أو أي عمليات تعتمد عليها
      if (operation === "VIEW") {
        updated = updated.filter(
          (p) => !(p.screen === screenCode && p.permission === "EDIT")
        );
      }

    } else {
      // ✅ أضف العملية
      updated.push({ screen: screenCode, permission: operation });

      // ⚡ لو فعّل EDIT لازم نفعل VIEW تلقائيًا
      if (operation === "EDIT") {
        const viewExists = updated.some(
          (p) => p.screen === screenCode && p.permission === "VIEW"
        );
        if (!viewExists) {
          updated.push({ screen: screenCode, permission: "VIEW" });
        }
      }
    }

    return updated;
  });
};


  /** ✅ تفعيل / إلغاء ALL لشاشة واحدة */
  const toggleAllForScreen = (screenCode: string) => {
    setSelected((prev) => {
      const allExist = Operations.every((op) =>
        prev.some((p) => p.screen === screenCode && p.permission === op)
      );

      if (allExist) {
        // إزالة الكل
        return prev.filter((p) => p.screen !== screenCode);
      } else {
        // إضافة الكل
        const toAdd = Operations.filter(
          (op) =>
            !prev.some(
              (p) => p.screen === screenCode && p.permission === op
            )
        ).map((op) => ({ screen: screenCode, permission: op }));

        return [...prev, ...toAdd];
      }
    });
  };

  /** ✅ تفعيل / إلغاء ALL لموديول كامل */
  const toggleAllForModule = (screens: any[]) => {
    setSelected((prev) => {
      const allExist = screens.every((scr) =>
        Operations.every((op) =>
          prev.some((p) => p.screen === scr.code && p.permission === op)
        )
      );

      if (allExist) {
        // إزالة الكل لكل العمليات في كل الشاشات
        return prev.filter(
          (p) =>
            !screens.some((scr) => p.screen === scr.code)
        );
      } else {
        // إضافة كل العمليات لكل الشاشات غير المضافة
        const toAdd: Permission[] = [];
        for (const scr of screens) {
          for (const op of Operations) {
            const exists = prev.some(
              (p) => p.screen === scr.code && p.permission === op
            );
            if (!exists) {
              toAdd.push({ screen: scr.code, permission: op });
            }
          }
        }
        return [...prev, ...toAdd];
      }
    });
  };

  /** ✅ تفعيل / إلغاء عملية واحدة لموديول */
  const toggleOperationForModule = (screens: any[], operation: string) => {
    setSelected((prev) => {
      const allExist = screens.every((scr) =>
        prev.some(
          (p) => p.screen === scr.code && p.permission === operation
        )
      );

      if (allExist) {
        // إزالة العملية من كل الشاشات
        return prev.filter(
          (p) =>
            !screens.some(
              (scr) => p.screen === scr.code && p.permission === operation
            )
        );
      } else {
        // إضافة العملية لكل الشاشات اللي مش فيها
        const toAdd = screens
          .filter(
            (scr) =>
              !prev.some(
                (p) => p.screen === scr.code && p.permission === operation
              )
          )
          .map((scr) => ({ screen: scr.code, permission: operation }));
        return [...prev, ...toAdd];
      }
    });
  };

  /** 🧱 أعمدة الموديول */
  const columns = [
    {
      key: "module",
      title: <Translate>Module</Translate>,
      render: (rowData: any) => {
  const hasPermissions = (rowData.screens || []).some((screen: any) =>
    selected.some((sel) => sel.screen === screen.code)
  );

  return (
    <div className="flex items-center gap-2">
      {/* 🔵 المؤشر في بداية السطر */}
      {hasPermissions && (
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "#1976d2", // 🔵 أزرق أنيق
            marginRight: 4,
          }}
        ></div>
      )}
      <span style={{ fontWeight: hasPermissions ? 500 : 400 }}>
        {rowData.name}
      </span>
    </div>
  );
},

      width: 250,
    },
    ...Operations.map((op) => ({
      key: op,
      title: op,
      align: "center" as const,
      render: (rowData: any) => {
        const screens = rowData.screens || [];
        const allActive =
          screens.length > 0 &&
          screens.every((scr: any) =>
            selected.some(
              (p) => p.screen === scr.code && p.permission === op
            )
          );

        return (
          <Toggle
            checked={allActive}
            onChange={() => toggleOperationForModule(screens, op)}
            size="sm"
          />
        );
      },
      width: 100,
    })),
    {
      key: "ALL",
      title: "ALL",
      align: "center" as const,
      render: (rowData: any) => {
        const screens = rowData.screens || [];
        const allActive =
          screens.length > 0 &&
          screens.every((scr: any) =>
            Operations.every((op) =>
              selected.some(
                (p) => p.screen === scr.code && p.permission === op
              )
            )
          );

        return (
          <Toggle
            checked={allActive}
            onChange={() => toggleAllForModule(screens)}
            size="sm"
          />
        );
      },
      width: 100,
    },
  ];

  /** 🧱 أعمدة الشاشات */
  const screenColumns = (moduleRow: any) => [
    {
      key: "screen",
      title: <Translate>Screen</Translate>,
      render: (rowData: any) => <div>{rowData.name}</div>,
      width: 250,
    },
    ...Operations.map((op) => ({
      key: op,
      title: op,
      align: "center" as const,
      render: (rowData: any) => {
        const active = selected.some(
          (p) => p.screen === rowData.code && p.permission === op
        );
        return (
          <Toggle
            checked={active}
            onChange={() => togglePermission(rowData.code, op)}
            size="sm"
          />
        );
      },
      width: 100,
    })),
    {
      key: "ALL",
      title: "ALL",
      align: "center" as const,
      render: (rowData: any) => {
        const allActive = Operations.every((op) =>
          selected.some(
            (p) => p.screen === rowData.code && p.permission === op
          )
        );
        return (
          <Toggle
            checked={allActive}
            onChange={() => toggleAllForScreen(rowData.code)}
            size="sm"
          />
        );
      },
      width: 100,
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
