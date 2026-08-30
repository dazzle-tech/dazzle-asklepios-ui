import React, { useState, useEffect, useRef } from 'react';
import { MODULES } from '@/config/modules-config';
import Translate from '@/components/Translate';
import MyNestedTable from '@/components/MyNestedTable';
import MyButton from '@/components/MyButton/MyButton';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import {
  useGetRolePermissionsQuery,
  useUpdateRolePermissionsMutation
} from '@/services/userService';
import { useEnumByName } from '@/services/enumsApi';
import { Form, Toggle } from 'rsuite';
import { CircularProgress } from '@mui/material';
import { InputGroup, Input } from 'rsuite';
import SearchIcon from '@rsuite/icons/Search';
import MyInput from '@/components/MyInput';

interface Permission {
  screen: string;
  permission: string;
}

const RoleScreens = ({ roleId }: { roleId: number }) => {
  console.log("roleId",roleId)
  const dispatch = useAppDispatch();
  const Operations: string[] = useEnumByName('Operation') || [];

  const { data: initialPermissions = [], isLoading ,refetch } = useGetRolePermissionsQuery(roleId);
  const [updatePermissions, { isLoading: isSaving }] = useUpdateRolePermissionsMutation();

  const [selected, setSelected] = useState<Permission[]>([]);
  const [search, setSearch] = useState({ value: "" });

 useEffect(() => {
  setSelected(initialPermissions || []);
}, [initialPermissions,roleId]);

  const filteredModules = React.useMemo(() => {
    if (!search.value.trim()) {
      return MODULES;
    }

    const searchText = search.value.toLowerCase();

    return MODULES.map(module => ({
      ...module,
      screens: (module.screens || []).filter(
        screen =>
          screen.name?.toLowerCase().includes(searchText) ||
          screen.code?.toLowerCase().includes(searchText)
      )
    })).filter(
      module =>
        module.name?.toLowerCase().includes(searchText) ||
        (module.screens?.length ?? 0) > 0
    );
  }, [search]);
  const togglePermission = (screenCode: string, operation: string) => {
    setSelected(prev => {
      const exists = prev.some(p => p.screen === screenCode && p.permission === operation);
      let updated = [...prev];

      if (exists) {
        updated = updated.filter(p => !(p.screen === screenCode && p.permission === operation));
        if (operation === 'VIEW') {
          updated = updated.filter(p => !(p.screen === screenCode && p.permission === 'EDIT'));
        }
      } else {
        updated.push({ screen: screenCode, permission: operation });
        if (operation === 'EDIT') {
          const viewExists = updated.some(p => p.screen === screenCode && p.permission === 'VIEW');
          if (!viewExists) {
            updated.push({ screen: screenCode, permission: 'VIEW' });
          }
        }
      }

      return updated;
    });
  };

  const toggleAllForScreen = (screenCode: string) => {
    setSelected(prev => {
      const allExist = Operations.every(op =>
        prev.some(p => p.screen === screenCode && p.permission === op)
      );

      if (allExist) {
        return prev.filter(p => p.screen !== screenCode);
      } else {
        const toAdd = Operations.filter(
          op => !prev.some(p => p.screen === screenCode && p.permission === op)
        ).map(op => ({ screen: screenCode, permission: op }));

        return [...prev, ...toAdd];
      }
    });
  };

  const toggleAllForModule = (screens: any[]) => {
    setSelected(prev => {
      const allExist = screens.every(scr =>
        Operations.every(op => prev.some(p => p.screen === scr.code && p.permission === op))
      );

      if (allExist) {
        return prev.filter(p => !screens.some(scr => p.screen === scr.code));
      } else {
        const toAdd: Permission[] = [];
        for (const scr of screens) {
          for (const op of Operations) {
            if (!prev.some(p => p.screen === scr.code && p.permission === op)) {
              toAdd.push({ screen: scr.code, permission: op });
            }
          }
        }
        return [...prev, ...toAdd];
      }
    });
  };

  const toggleOperationForModule = (screens: any[], operation: string) => {
    setSelected(prev => {
      const allExist = screens.every(scr =>
        prev.some(p => p.screen === scr.code && p.permission === operation)
      );

      if (allExist) {
        return prev.filter(
          p => !screens.some(scr => p.screen === scr.code && p.permission === operation)
        );
      } else {
        const toAdd = screens
          .filter(scr => !prev.some(p => p.screen === scr.code && p.permission === operation))
          .map(scr => ({ screen: scr.code, permission: operation }));
        return [...prev, ...toAdd];
      }
    });
  };

  const columns = [
    {
      key: 'module',
      title: <Translate>Module</Translate>,
      width: 250,
      render: (rowData: any) => {
        const hasPermissions = (rowData.screens || []).some((screen: any) =>
          selected.some(sel => sel.screen === screen.code)
        );

        return (
          <span
            style={{
              fontWeight: hasPermissions ? 500 : 400,
              color: hasPermissions ? 'var(--primary-blue)' : 'inherit'
            }}
          >
            {rowData.name}
          </span>
        );
      }
    },
    ...Operations.map(op => ({
      key: op,
      title: op,
      align: 'center' as const,
      width: 100,
      render: (rowData: any) => {
        const screens = rowData.screens || [];
        const allActive =
          screens.length > 0 &&
          screens.every((scr: any) =>
            selected.some(p => p.screen === scr.code && p.permission === op)
          );

        return (
          <Toggle
            checked={allActive}
            onChange={() => toggleOperationForModule(screens, op)}
            size="sm"
          />
        );
      }
    })),
    {
      key: 'ALL',
      title: 'ALL',
      align: 'center' as const,
      width: 100,
      render: (rowData: any) => {
        const screens = rowData.screens || [];
        const allActive =
          screens.length > 0 &&
          screens.every((scr: any) =>
            Operations.every(op => selected.some(p => p.screen === scr.code && p.permission === op))
          );

        return (
          <Toggle checked={allActive} onChange={() => toggleAllForModule(screens)} size="sm" />
        );
      }
    }
  ];

  const screenColumns = (moduleRow: any) => [
    {
      key: 'screen',
      title: <Translate>Screen</Translate>,
      width: 250,
      render: (rowData: any) => rowData.name
    },
    ...Operations.map(op => ({
      key: op,
      title: op,
      align: 'center' as const,
      width: 100,
      render: (rowData: any) => {
        const active = selected.some(p => p.screen === rowData.code && p.permission === op);
        return (
          <Toggle checked={active} onChange={() => togglePermission(rowData.code, op)} size="sm" />
        );
      }
    })),
    {
      key: 'ALL',
      title: 'ALL',
      align: 'center' as const,
      width: 100,
      render: (rowData: any) => {
        const allActive = Operations.every(op =>
          selected.some(p => p.screen === rowData.code && p.permission === op)
        );
        return (
          <Toggle checked={allActive} onChange={() => toggleAllForScreen(rowData.code)} size="sm" />
        );
      }
    }
  ];

  const getNestedTable = (rowData: any) => ({
    data: rowData.screens || [],
    columns: screenColumns(rowData)
  });

  const handleSave = async () => {
    try {
      await updatePermissions({ roleId, permissions: selected }).unwrap();
      dispatch(notify({ sev: 'success', msg: 'Permissions updated successfully' }));
      await refetch();
    } catch {
      dispatch(notify({ sev: 'error', msg: 'Failed to update permissions' }));
    }
  };

  return (
    <div>
      {isSaving && (
        <div className="page-loader">
          <CircularProgress />
        </div>
      )}

      <Form   >
        <MyInput
          width={'20vw'}
          rightAddon={<SearchIcon />}
          fieldName="value"
          record={search}
          setRecord={setSearch}
          placeholder="Search module or screen..."
          showLabel={false}

        />
      </Form>
      <MyNestedTable
        data={filteredModules}
        columns={columns}
        getNestedTable={getNestedTable}
        loading={isLoading}
      />

      <br />

      <MyButton appearance="primary" onClick={handleSave} disabled={isSaving}>
        Save
      </MyButton>
    </div>
  );
};

export default RoleScreens;
