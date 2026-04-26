import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import MyLabel from '../MyLabel';
const MyTagInput = ({ tags = [], setTags, labelText = '', width = '100%', fontSize = '22px' }) => {
  const handleDelete = tagToDelete => {
    setTags(prevTags => prevTags.filter(tag => tag !== tagToDelete));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <MyLabel label={labelText} />
      <Autocomplete
        multiple
        freeSolo
        fullWidth
        options={[]}
        value={tags || []}
          onChange={(event, newValue) => {
            const cleaned = newValue
              .map(v => (typeof v === "string" ? v.trim() : v))
              .filter(v => v && v.length > 0);

            setTags(cleaned);
          }}

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
                height: '30px', // Control height of input field
                display: 'flex',
                alignItems: 'center',
                width: { width },
                // Center content vertically
                flexWrap: 'wrap' // Allow wrapping of tags
              },
              '.MuiInputBase-input': {
                paddingTop: '0 !important', 
                paddingBottom: '0 !important',
                height: '100%', 
                display: 'flex',
                alignItems: 'center', 
                 fontSize: '13px',
              },
              '.MuiAutocomplete-inputRoot': {
                padding: '1px 0' // Control input padding to make room for tags
              },
              '.MuiChip-root': {
                height: '24px' // Adjust the height of chips to match the input
              },
              '.MuiOutlinedInput-root': {
                paddingRight: '10px', // Adjust padding to avoid overlap with chips
                '&:focus': {
                  borderColor: 'transparent !important', // Disable blue border when focused
                  boxShadow: 'none !important' // Remove any shadow effect on focus
                }
              }
            }}
          />
        )}
      />
    </div>
  );
};
export default MyTagInput;
