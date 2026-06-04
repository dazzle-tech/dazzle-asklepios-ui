import React, { useEffect, useMemo, useState } from 'react';
import { Form, Input, Panel, SelectPicker } from 'rsuite';
import { MdModeEdit } from 'react-icons/md';
import { FaCog } from 'react-icons/fa';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';
import {
  SystemConfigKey,
  SystemConfigMap,
  useGetSystemConfigQuery,
  useUpdateSystemConfigValueMutation,
  useUploadFaviconMutation,
  useUploadSystemLogoMutation,
  useUploadLoginBackgroundMutation,
  useUploadSidebarLogoMutation
} from '@/services/systemConfigService';
import './styles.less';

type ConfigRow = {
  key: SystemConfigKey;
  label: string;
  type: 'text' | 'color' | 'font' | 'image';
  value?: string;
};

const fontOptions = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Tahoma', value: 'Tahoma' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Impact', value: 'Impact' },
  { label: 'Comic Sans MS', value: 'Comic Sans MS' }
];

const SystemConfiguration = () => {
  const dispatch = useAppDispatch();

  const { data, isFetching, refetch } = useGetSystemConfigQuery();
  const [updateSystemConfigValue] = useUpdateSystemConfigValueMutation();
  const [uploadFavicon] = useUploadFaviconMutation();
  const [uploadSystemLogo] = useUploadSystemLogoMutation();
  const [uploadLoginBackground] = useUploadLoginBackgroundMutation();
    const [uploadSidebarLogo] = useUploadSidebarLogoMutation();
  const [searchTerm, setSearchTerm] = useState({ value: '' });
  const [selectedRow, setSelectedRow] = useState<ConfigRow | null>(null);
  const [open, setOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<{ value: string }>({ value: '' });
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [width, setWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    dispatch(setPageCode('System_Configuration'));
    dispatch(setDivContent('System Configuration'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);

    return () => window.removeEventListener('resize', onResize);
  }, []);

  const allRows: ConfigRow[] = useMemo(() => {
    const config: SystemConfigMap = data ?? {};

    return [
      {
        key: SystemConfigKey.SYSTEM_TITLE,
        label: 'System Title',
        type: 'text',
        value: config.SYSTEM_TITLE
      },
      {
        key: SystemConfigKey.PRIMARY_COLOR,
        label: 'Primary Color',
        type: 'color',
        value: config.PRIMARY_COLOR
      },
      {
        key: SystemConfigKey.FONT_FAMILY,
        label: 'Font Family',
        type: 'font',
        value: config.FONT_FAMILY
      },
      {
        key: SystemConfigKey.FAVICON,
        label: 'Favicon',
        type: 'image',
        value: config.FAVICON
      },
      {
        key: SystemConfigKey.SYSTEM_LOGO,
        label: 'System Logo',
        type: 'image',
        value: config.SYSTEM_LOGO
      },
      {
        key: SystemConfigKey.LOGIN_BACKGROUND,
        label: 'Login Background',
        type: 'image',
        value: config.LOGIN_BACKGROUND
      },
      {
        key: SystemConfigKey.SIDEBAR_LOGO,
        label: 'Sidebar Logo',
        type: 'image',
        value: config.SIDEBAR_LOGO
      }
    ];
  }, [data]);

  const tableData = useMemo(() => {
    const value = searchTerm.value?.toLowerCase();

    if (!value) {
      return allRows;
    }

    return allRows.filter(
      row =>
        row.label.toLowerCase().includes(value) ||
        row.key.toLowerCase().includes(value) ||
        String(row.value ?? '').toLowerCase().includes(value)
    );
  }, [allRows, searchTerm.value]);

  const openEditModal = (row: ConfigRow) => {
    setSelectedRow(row);
    setEditRecord({ value: row.value || '' });
    setSelectedFile(null);
    setSelectedFileName('');
    setOpen(true);
  };

  const renderValue = (row: ConfigRow) => {
    if (row.type === 'color') {
      return (
        <div className="system-config-color-preview">
          <span
            className="system-config-color-box"
            style={{ backgroundColor: row.value || '#1976d2' }}
          />
          <span>{row.value || '-'}</span>
        </div>
      );
    }

    if (row.key === SystemConfigKey.FAVICON) {
      return row.value ? (
        <div className="system-config-image-preview">
          <img src={row.value} alt="Favicon" className="system-config-favicon-img" />
          <span>Configured</span>
        </div>
      ) : (
        '-'
      );
    }

    if (row.key === SystemConfigKey.SYSTEM_LOGO) {
      return row.value ? (
        <div className="system-config-image-preview">
          <img src={row.value} alt="System Logo" className="system-config-logo-img" />
          <span>Configured</span>
        </div>
      ) : (
        '-'
      );
    }
    if (row.key === SystemConfigKey.LOGIN_BACKGROUND) {
      return row.value ? (
        <div className="system-config-image-preview">
          <img
            src={row.value}
            alt="Login Background"
            className="system-config-logo-img"
          />
          <span>Configured</span>
        </div>
      ) : (
        '-'
      );
    }
      if (row.key === SystemConfigKey.SIDEBAR_LOGO) {
      return row.value ? (
        <div className="system-config-image-preview">
          <img
            src={row.value}
            alt="Sidebar Logo"
            className="system-config-logo-img"
          />
          <span>Configured</span>
        </div>
      ) : (
        '-'
      );
    }

    return row.value || '-';
  };

  const iconsForActions = (row: ConfigRow) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => openEditModal(row)}
      />
    </div>
  );

  const tableColumns = [
    {
      key: 'label',
      title: 'Setting',
      flexGrow: 3
    },
    {
      key: 'key',
      title: 'Key',
      flexGrow: 3
    },
    {
      key: 'value',
      title: 'Current Value',
      flexGrow: 6,
      render: (row: ConfigRow) => renderValue(row)
    },
    {
      key: 'icons',
      title: '',
      flexGrow: 2,
      render: (row: ConfigRow) => iconsForActions(row)
    }
  ];

  const filters = () => (
    <div className="container-of-header-actions-medication-matrix">
      <Form layout="inline" className="form-medication-matrix">
        <MyInput
          fieldName="value"
          fieldType="text"
          record={searchTerm}
          setRecord={setSearchTerm}
          showLabel={false}
          placeholder="Search by Setting"
          width="220px"
          height={32}
        />
      </Form>
    </div>
  );

 const handleSave = async () => {
  if (!selectedRow) return;

  try {
    if (selectedRow.key === SystemConfigKey.FAVICON) {
      if (!selectedFile) {
        dispatch(notify({ msg: 'Please select favicon file', sev: 'warning' }));
        return;
      }

      await uploadFavicon(selectedFile).unwrap();
    } else if (selectedRow.key === SystemConfigKey.SYSTEM_LOGO) {
      if (!selectedFile) {
        dispatch(notify({ msg: 'Please select logo file', sev: 'warning' }));
        return;
      }

      await uploadSystemLogo(selectedFile).unwrap();
    } else if (selectedRow.key === SystemConfigKey.LOGIN_BACKGROUND) {
      if (!selectedFile) {
        dispatch(notify({ msg: 'Please select login background file', sev: 'warning' }));
        return;
      }


      await uploadLoginBackground(selectedFile).unwrap();
    }
    else if (selectedRow.key === SystemConfigKey.SIDEBAR_LOGO) {
      if (!selectedFile) {
        dispatch(notify({ msg: 'Please select sidebar logo file', sev: 'warning' }));
        return;
      }
      await uploadSidebarLogo(selectedFile).unwrap();
    } 
    
    else {
      await updateSystemConfigValue({
        key: selectedRow.key,
        value: editRecord.value
      }).unwrap();
    }

    dispatch(
      notify({
        msg: 'System configuration updated successfully',
        sev: 'success'
      })
    );

    await refetch();
    setOpen(false);
    window.location.reload();
  } catch (error: any) {
    if (
      error?.status === 413 ||
      error?.data?.detail?.includes('FileTooLargeException') ||
      error?.data?.detail?.includes('maximum size')
    ) {
      dispatch(
        notify({
          msg: 'Selected image is too large. Please choose a smaller image.',
          sev: 'error'
        })
      );

      return;
    }

    dispatch({
      msg: 'Failed to update system configuration',
      sev: 'error'
    });
  }
};

  const modalContent = () => {
    if (!selectedRow) return null;

    if (selectedRow.type === 'font') {
      return (
        <Form fluid>
          <div className="system-config-modal-field">
            <label>Font Family</label>
            <SelectPicker
              block
              searchable={false}
              cleanable={false}
              data={fontOptions}
              value={editRecord.value || 'Inter'}
              onChange={value => setEditRecord({ value: value || 'Inter' })}
            />
          </div>
        </Form>
      );
    }

    if (selectedRow.type === 'color') {
      return (
        <Form fluid>
          <div className="system-config-modal-field">
            <label>Primary Color</label>
            <div className="system-config-color-edit">
              <input
                type="color"
                value={editRecord.value || '#1976d2'}
                onChange={e => setEditRecord({ value: e.target.value })}
              />
              <Input
                value={editRecord.value}
                onChange={value => setEditRecord({ value })}
              />
            </div>
          </div>
        </Form>
      );
    }

    if (selectedRow.type === 'image') {
      return (
        <Form fluid>
         <div className="system-config-modal-field">
  <label>{selectedRow.label}</label>

  {selectedRow.value && (
    <div className="system-config-current-image">
      <img
        src={selectedRow.value}
        alt={selectedRow.label}
        className={
          selectedRow.key === SystemConfigKey.FAVICON
            ? 'system-config-favicon-img'
            : 'system-config-logo-img'
        }
      />
      <span>Current Image</span>
    </div>
  )}

  <input
    id="system-config-file-upload"
    type="file"
    accept="image/*"
    style={{ display: 'none' }}
    onChange={e => {
      const file = e.target.files?.[0];

      if (file) {
        setSelectedFile(file);
        setSelectedFileName(file.name);
      }
    }}
  />

  <label htmlFor="system-config-file-upload">
    <MyButton as="span">
      📷 Choose Image
    </MyButton>
  </label>

  {selectedFileName && (
    <div className="system-config-selected-file">
      ✅ {selectedFileName}
    </div>
  )}
</div>
        </Form>
      );
    }

    return (
      <Form fluid>
        <MyInput
          width="100%"
          fieldLabel={selectedRow.label}
          fieldName="value"
          record={editRecord}
          setRecord={setEditRecord}
        />
      </Form>
    );
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <Panel dir={dir}>
      <MyTable
        height={450}
        data={tableData}
        loading={isFetching}
        columns={tableColumns}
        filters={filters()}
        totalCount={tableData.length}
      />

      <MyModal
        open={open}
        setOpen={setOpen}
        title={selectedRow ? `Edit ${selectedRow.label}` : 'Edit Configuration'}
        position="right"
        content={() => <div dir={dir}>{modalContent()}</div>}
        actionButtonLabel="Save"
        actionButtonFunction={handleSave}
        steps={[{ title: 'Configuration Info', icon: <FaCog /> }]}
        size={width > 600 ? '36vw' : '70vw'}
      />
    </Panel>
  );
};

export default SystemConfiguration;