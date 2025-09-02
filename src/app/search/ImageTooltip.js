import { Tooltip } from "@mui/material";
import { tooltipClasses } from "@mui/material/Tooltip";
import { styled } from "@mui/material/styles";
import React from "react";

export const ImageTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#f5f5f9",
    color: "rgba(0, 0, 0, 0.87)",
    // maxWidth: window.innerWidth * 0.3,
    // maxHeight: Math.min(window.innerHeight, window.innerWidth * 0.3 * 1.6),
    maxWidth: 512 * 0.3,
    maxHeight: Math.min(512, 512 * 0.3 * 1.6),
    fontSize: theme.typography.pxToRem(12),
    border: "1px solid #dadde9",
  },
}));
