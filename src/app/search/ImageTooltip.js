import { Tooltip } from "@mui/material";
import { tooltipClasses } from "@mui/material/Tooltip";
import { styled } from "@mui/material/styles";
import React from "react";

export const dynamic = "force-dynamic";

function useDeviceSize() {
  const [width, setWidth] = React.useState(0);
  const [height, setHeight] = React.useState(0);

  const handleWindowResize = () => {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
  };

  React.useEffect(() => {
    // component is mounted and window is available
    handleWindowResize();
    window.addEventListener("resize", handleWindowResize);
    // unsubscribe from the event on component unmount
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  return [width, height];
}

export function ImageTooltip(props) {
  const [windowWidth, windowHeight] = useDeviceSize();
  const maxWidth = windowWidth * 0.6;
  const maxHeight = windowHeight * 0.8;
  const aspectRatio = 1.4;
  const StyledImageTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: "#f5f5f9",
      color: "rgba(0, 0, 0, 0.87)",
      minWidth: Math.min(maxWidth, maxHeight / aspectRatio),
      minHeight: Math.min(maxHeight, maxWidth * aspectRatio),
      fontSize: theme.typography.pxToRem(12),
      border: "1px solid #dadde9",
    },
  }));
  return (
    <StyledImageTooltip
      {...props}
      PopperProps={{
        modifiers: [
          {
            name: "preventOverflow",
            options: {
              altAxis: true, // allow the tooltip to flip to the opposite side
              boundary: "viewport", // Constrains the tooltip to the viewport
            },
          },
        ],
      }}
    />
  );
}
