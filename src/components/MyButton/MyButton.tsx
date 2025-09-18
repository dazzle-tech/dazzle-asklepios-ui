import React from 'react';
import { Button } from 'rsuite';
import './styles.less';
import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
type Appearance = 'primary' | 'default' | 'link' | 'subtle' | 'ghost';
const MyButton = ({
  prefixIcon: Prefix = null,
  postfixIcon: Postfix = null,
  children: children = null,
  onClick = () => {},
  appearance = 'primary' as Appearance,
  size = 'small',
   loading = false,
  ...props
}) => {
 const mode = useSelector((state: any) => state.ui.mode);
  return (
    <Button
      className={`bt ${size} ${mode}`}
      appearance={appearance}
      disabled={props.disabled}
      style={{
        color:
          appearance === 'ghost' || appearance === 'link' || appearance === 'subtle'
            ? props.color ?? 'var(--primary-blue)'
            : 'white',

        width: props.width,
        borderRadius: props.radius,
        backgroundColor:
          appearance === 'ghost' || appearance === 'link' || appearance === 'subtle'
            ? 'transparent'
            : props.backgroundColor ?? 'var(--primary-blue)',
        border:
          appearance === 'ghost' ? `2px solid ${props.color ?? 'var(--primary-blue)'}` : 'none',
      
      }}
      {...props}
      onClick={onClick}
       loading={loading}
    >
      {Prefix && <Prefix c style={{ marginRight: '8px', color: 'inherit' }} />}

      {children && children}

      {Postfix && <Postfix style={{ marginLeft: '8px', color: 'inherit' }} />}
       {/* {Prefix &&
      <Box sx={{color: 'inherit'}}>  
       <Prefix style={{ marginRight: '8px', color: 'red' }} />
        </Box>
       }

      {children && children}

      {Postfix &&
      <Box sx={{color: 'inherit'}}> 
       <Postfix style={{ marginLeft: '8px', color: 'red' }} />
         </Box>
       } */}
    </Button>
  );
};

export default MyButton;



// import React from 'react';
// import { Button } from 'rsuite';
// import './styles.less';
// import { Box } from '@mui/material';
// type Appearance = 'primary' | 'default' | 'link' | 'subtle' | 'ghost';
// const MyButton = ({
//   prefixIcon: Prefix = null,
//   postfixIcon: Postfix = null,
//   children: children = null,
//   onClick = () => {},
//   appearance = 'primary' as Appearance,
//   size = 'small',
//    loading = false,
//   ...props
// }) => {

//   return (
//     <Button
//       className={`bt ${size}`}
//       appearance={appearance}
//       disabled={props.disabled}
//       style={{
//         color:
//           appearance === 'ghost' || appearance === 'link' || appearance === 'subtle'
//             ? props.color ?? 'var(--primary-blue)'
//             : 'white',

//         width: props.width,
//         borderRadius: props.radius,
//         backgroundColor:
//           appearance === 'ghost' || appearance === 'link' || appearance === 'subtle'
//             ? 'transparent'
//             : props.backgroundColor ?? 'var(--primary-blue)',
//         border:
//           appearance === 'ghost' ? 2px solid ${props.color ?? 'var(--primary-blue)'} : 'none',
      
//       }}
//       {...props}
//       onClick={onClick}
//        loading={loading}
//     >
//       {Prefix &&
//       <Box sx={{color: 'inherit'}}>  
//        <Prefix style={{ marginRight: '8px', color: 'red' }} />
//        </Box>
//        }

//       {children && children}

//       {Postfix &&
//       <Box sx={{color: 'inherit'}}> 
//        <Postfix style={{ marginLeft: '8px', color: 'red' }} />
//         </Box>
//        }
//     </Button>
//   );
// };

// export default MyButton