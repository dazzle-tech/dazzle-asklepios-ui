import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import MyLabel from '../MyLabel';

const MyTagInput = ({
  tags = [],
  setTags,
  onRemoveTag,
  onClearAll,
  labelText = '',
  width = '100%',
  fontSize = '22px'
}) => {
  const inputValueRef = React.useRef('');

  const cleanTags = React.useMemo(() => {
    if (!Array.isArray(tags)) return [];
    return tags
      .filter(t => t !== null && t !== undefined && String(t).trim() !== '')
      .map(t => String(t).trim());
  }, [tags]);

  const handleChange = (event: any, newValue: any[], reason: string) => {
    if (reason === 'clear') return;
    const cleaned = newValue
      .map(v => (typeof v === 'string' ? v.trim() : String(v ?? '').trim()))
      .filter(v => v.length > 0);
    if (reason !== 'removeOption' && cleaned.length < cleanTags.length) return;
    setTags(cleaned);
  };

  const handleDelete = (tagToDelete: string) => {
    if (onRemoveTag) {
      onRemoveTag(tagToDelete);
    } else {
      setTags((prevTags: any[]) => {
        const arr = Array.isArray(prevTags) ? prevTags : [];
        return arr.filter(tag => String(tag).trim() !== String(tagToDelete).trim());
      });
    }
  };

  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    } else {
      setTags([]);
    }
  };

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}
      onKeyDownCapture={(e) => {
        if (e.key === 'Enter' && !inputValueRef.current.trim()) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <MyLabel label={labelText} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
        <Autocomplete
          multiple
          freeSolo
          fullWidth
          disableClearable
          options={[]}
          value={cleanTags}
          onInputChange={(_, newVal) => { inputValueRef.current = newVal; }}
          onChange={handleChange}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <Chip
                  key={key}
                  label={option}
                  {...tagProps}
                  onDelete={() => handleDelete(option)}
                  sx={{
                    margin: '2px',
                    '.MuiChip-deleteIcon': {
                      margin: '0',
                      color: 'rgba(0, 0, 0, 0.26)',
                      fontSize: { fontSize }
                    }
                  }}
                />
              );
            })
          }
          renderInput={params => (
            <TextField
              {...params}
              sx={{
                '.MuiInputBase-root': {
                  minHeight: '30px',
                  height: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  width: { width },
                  flexWrap: 'wrap'
                },
                '.MuiInputBase-input': {
                  paddingTop: '4px !important',
                  paddingBottom: '4px !important',
                  height: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '13px'
                },
                '.MuiAutocomplete-inputRoot': {
                  padding: '4px 6px'
                },
                '.MuiChip-root': {
                  height: '24px'
                },
                '.MuiOutlinedInput-root': {
                  paddingRight: '10px',
                  '&:focus': {
                    borderColor: 'transparent !important',
                    boxShadow: 'none !important'
                  }
                }
              }}
            />
          )}
        />

        {cleanTags.length > 0 && (
          <button
            onClick={handleClearAll}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              marginTop: '3px',
              display: 'flex',
              alignItems: 'center',
              color: 'rgba(0,0,0,0.4)',
              fontSize: '18px',
              flexShrink: 0
            }}
            title="Clear all"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default MyTagInput;
