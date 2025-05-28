import React, { useEffect,useState } from "react";
import Check from '@mui/icons-material/Check';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import {
    Box,
    Step,
    StepLabel,
    Stepper,
    Typography,
    stepConnectorClasses,
    StepConnector

} from '@mui/material';
import './styles.less';
import { styled } from '@mui/material/styles';
import Translate from "../Translate";
import { Text } from "rsuite";
type OrientationType = 'horizontal' | 'vertical';

interface MyStepperProps {
  activeStep: number;
  stepsList: any[];
  orientation?: OrientationType;
}

const MyStepper: React.FC<MyStepperProps> = ({
  activeStep,
  stepsList,
  orientation = 'horizontal',
}) => {
    const [width, setWidth] = useState(40);
    const [height, setHeight] = useState(40);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    
useEffect(() => {
  const handleResize = () => {
    const w = window.innerWidth;
    setWindowWidth(w);
      if (w <= 400) {
      setWidth(24);
      setHeight(24);
    }
      if (w <= 500) {
      setWidth(26);
      setHeight(26);
    }
     if (w <= 550) {
      setWidth(28);
      setHeight(28);
    }
    if (w <= 620) {
      setWidth(31);
      setHeight(31);
    }
    if (w <= 700) {
      setWidth(34);
      setHeight(34);
    } else if (w <= 800) {
      setWidth(37);
      setHeight(37);
    } else {
      setWidth(40);
      setHeight(40);
    }
  };

  handleResize(); 
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
    function CustomStepIcon(props) {
        const { active, completed, icon, error, iconsMap } = props;
    
        const stepData = iconsMap[icon]; // icon is 1-based index
        const customIcon = stepData?.customIcon;
    
        const isInactiveAndIncomplete = !active && !completed && !error;
    
        const backgroundColor = error
            ? 'error.main'
            : completed
                ? '#45B887'
                : active
                    ? 'var(--primary-blue)'
                    : '#fff'; // white background for inactive/incomplete
    
        const iconColor = error || completed || active ? '#fff' : '#888'; // gray text for inactive/incomplete
    
        return (
            <Box
             className={active?error?"border-style-error":"border-style-active":"border-style"}
            >
                <Box
                
                    sx={{
                        width:width,
                        height:height,
                        borderRadius: '50%',
                        backgroundColor,
                        color: iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        border: isInactiveAndIncomplete ? '1px solid #ccc' : 'none', // optional subtle outline
                    }}
                >
                    {error ? (
                        <ReportProblemIcon fontSize="small" />
                    ) : completed ? (
                        <Check fontSize="small" />
                    ) : customIcon ? (
                        customIcon
                    ) : (
                        icon
                    )}
                </Box>
            </Box>
        );
    }
    const VerticalConnector = styled(StepConnector)(({ theme }) => ({
        [`& .${stepConnectorClasses.line}`]: {
          borderLeftWidth: 3,
          minHeight: 24,
          marginLeft: 20,
          borderColor: '#D9D9D9',
        },
      }));

    const QontoConnector = styled(StepConnector)(({ theme }) => ({
        [`&.${stepConnectorClasses.alternativeLabel}`]: {
          top: 20,
          left: 'calc(-50% + 25px)',
          right: 'calc(50% + 25px)',
        },
       
        [`& .${stepConnectorClasses.line}`]: {
          borderColor:'#D9D9D9',
          borderTopWidth:3,
          borderRadius: 1,
          height: 10,
          ...theme.applyStyles('dark', {
            borderColor: '#D9D9D9',
          }),
        },
      }));
      
      const connector = orientation === "vertical" ? <VerticalConnector /> : <QontoConnector />
    return (
        <>
            <Stepper activeStep={activeStep} alternativeLabel={orientation === "vertical" ?false:true} orientation={orientation} connector={connector}>
                {stepsList.map((step, index) => {
                    const isErrorStep = step.isError;

                   
                    const iconsMap = stepsList.reduce((acc, s, idx) => {
                        acc[idx + 1] = s; 
                        return acc;
                    }, {});

                    return (
                        <Step key={step.key}>
                            <StepLabel
                                StepIconComponent={(props) => (
                                    <CustomStepIcon {...props} iconsMap={iconsMap} />
                                )}
                                error={isErrorStep}
                                optional={
                                    <Typography variant="caption" color="text.secondary">
                                        {step.description}
                                    </Typography>
                                }
                            >
                                <Text className="text-value">{step.value}</Text>
                                
                            </StepLabel>
                        </Step>
                    );
                })}
            </Stepper>

        </>
    );
}
export default MyStepper;