import React from 'react';
import Check from '@mui/icons-material/Check';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import {
  Box,
  Step,
  StepLabel,
  Stepper,
  Typography,
  StepConnector,
  stepConnectorClasses,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Translate from "../Translate";
import { Text } from "rsuite";
import { useSelector } from "react-redux";
import './styles.less';

type OrientationType = 'horizontal' | 'vertical';

interface MyStepperProps {
  activeStep: number;
  stepsList: any[];
  orientation?: OrientationType;
  modalColor?: string;
}

const MyStepper: React.FC<MyStepperProps> = ({
  activeStep,
  stepsList,
  orientation = 'horizontal',
  modalColor = 'var(--primary-blue)',
}) => {
  const direction = useSelector(state => state.ui.direction);
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


    const backgroundColor = error
      ? 'error.main'
      : completed
      ? '#45B887'
      : active
      ? modalColor
      : '#fff';

    const iconColor = error || completed || active ? '#fff' : '#888';
    // const QontoConnector = styled(StepConnector)(({ theme }) => ({
    //     [`&.${stepConnectorClasses.alternativeLabel}`]: {
    //       top: 20,
    //       left: 'calc(-50% + 25px)',
    //       right: 'calc(50% + 25px)',
    //     },
       
    //     [`& .${stepConnectorClasses.line}`]: {
    //       borderColor:'#D9D9D9',
    //       borderTopWidth:3,
    //       borderRadius: 1,
    //       height: 10,
    //       ...theme.applyStyles('dark', {
    //         borderColor: '#D9D9D9',
    //       }),
    //     },
    //   }));
      const QontoConnector = styled(StepConnector)(({ theme }) => {
  const isRTL = direction === 'RTL';

  return {
    [`&.${stepConnectorClasses.alternativeLabel}`]: {
      top: 20,
      left: isRTL ? 'calc(50% + 25px)' : 'calc(-50% + 25px)',
      right: isRTL ? 'calc(-50% + 25px)' : 'calc(50% + 25px)',
    },

    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#D9D9D9',
      borderTopWidth: 3,
      borderRadius: 1,
      height: 10,

      ...theme.applyStyles('dark', {
        borderColor: '#D9D9D9',
      }),
    },
  };
});

      const connector = orientation === "vertical" ? <VerticalConnector /> : <QontoConnector />
    return (
        <>
            <Stepper style={{direction: direction === 'RTL' ? 'rtl' : 'ltr'}} activeStep={activeStep} alternativeLabel={orientation === "vertical" ?false:true} orientation={orientation} connector={connector}>
                {stepsList.map((step, index) => {
                    const isErrorStep = step.isError;

  /* =========================
     Connectors
  ========================= */
  const VerticalConnector = styled(StepConnector)(() => ({
    [`& .${stepConnectorClasses.line}`]: {
      borderLeftWidth: 3,
      minHeight: 24,
      marginLeft: 20,
      borderColor: '#D9D9D9',
    },
  }));

                    return (
                        <Step key={step.key}>
                            <StepLabel
                              StepIconComponent={(props) => (
                                  <CustomStepIcon {...props} iconsMap={iconsMap} modalColor={modalColor} />
                              )}
                                error={isErrorStep}
                                optional={
                                    <Typography variant="caption" color="text.secondary">
                                        {step.description}
                                    </Typography>
                                }
                            >
                                <Text className="text-value"><Translate>{step.value}</Translate></Text>
                                
                            </StepLabel>
                        </Step>
                    );
                })}
            </Stepper>

  const connector =
    orientation === 'vertical' ? <VerticalConnector /> : <HorizontalConnector />;

  /* =========================
     Icons Map
  ========================= */
  const iconsMap = stepsList.reduce((acc, step, index) => {
    acc[index + 1] = step;
    return acc;
  }, {} as Record<number, any>);

  /* =========================
     Render
  ========================= */
  return (
    <Stepper
      activeStep={activeStep}
      orientation={orientation}
      alternativeLabel={orientation === 'horizontal'}
      connector={connector}
      sx={{
        px: { xs: 1, sm: 2 },
        overflowX: 'auto',
      }}
    >
      {stepsList.map((step, index) => (
        <Step key={step.key}>
          <StepLabel
            error={step.isError}
            StepIconComponent={(props) => (
              <CustomStepIcon
                {...props}
                iconsMap={iconsMap}
                modalColor={modalColor}
              />
            )}
            optional={
              step.description && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: { xs: '10px', sm: '12px' },
                    textAlign: 'center',
                  }}
                >
                  {step.description}
                </Typography>
              )
            }
            sx={{
              '.MuiStepLabel-label': {
                fontSize: { xs: '11px', sm: '13px', md: '14px' },
                textAlign: 'center',
                whiteSpace: 'normal',
                lineHeight: 1.3,
              },
            }}
          >
            <Text className="text-value">{step.value}</Text>
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
};

export default MyStepper;
