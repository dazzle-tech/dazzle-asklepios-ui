import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import { useEffect } from 'react';
import { red } from '@mui/material/colors';
const MyTagInput=({tags=[] ,setTags})=>{
 
const handleDelete = (tagToDelete) => {
  setTags((prevTags) => prevTags.filter((tag) => tag !== tagToDelete));
};
 useEffect(()=>{
    console.log(tags)
 },[tags])
 return (
    <Autocomplete
      multiple
      freeSolo
      fullWidth
      options={[]}
      value={tags}
      onChange={(event, newValue) => {
        setTags(newValue);
      }}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            key={index}
            label={option}
            {...getTagProps({ index })}
            onDelete={() => handleDelete(option)}
            sx={{
                margin: '2px',  // Adjust space between tags
                '.MuiChip-deleteIcon': {
                  margin: '0', // Remove margin for the delete icon
                  color: 'rgba(0, 0, 0, 0.26)', // Color for the delete icon
                  fontSize: '22px', // Set font size for the delete icon
                },
              }}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          sx={{
            '.MuiInputBase-root': {
              height: '40px',  // Control height of input field
              display: 'flex',
              
             // Center content vertically
              flexWrap: 'wrap',  // Allow wrapping of tags
            },
            '.MuiAutocomplete-inputRoot': {
              padding: '4px 0',  // Control input padding to make room for tags
            },
            '.MuiChip-root': {
              height: '24px',  // Adjust the height of chips to match the input
          
            },
            '.MuiOutlinedInput-root': {
                paddingRight: '10px', // Adjust padding to avoid overlap with chips
                '&:focus': {
                  borderColor: 'transparent !important', // Disable blue border when focused
                  boxShadow: 'none !important', // Remove any shadow effect on focus
                },
              },
            
           
          }}
        />
      )}
    />
  );
}
export default MyTagInput