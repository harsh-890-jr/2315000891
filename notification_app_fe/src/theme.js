import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary:   { main: "#1A56DB", light: "#E8F0FE", dark: "#1240AA" },
    secondary: { main: "#0E9F6E" },
    error:     { main: "#E02424" },
    warning:   { main: "#E3A008" },
    background: { default: "#F4F6FA", paper: "#FFFFFF" },
    text: { primary: "#111827", secondary: "#6B7280" },
    // Custom notification type colors
    placement: { main: "#7C3AED", light: "#F5F3FF", contrastText: "#fff" },
    result:    { main: "#1A56DB", light: "#EBF5FB", contrastText: "#fff" },
    event:     { main: "#0E9F6E", light: "#ECFDF5", contrastText: "#fff" },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h4: { fontWeight: 700, letterSpacing: "-0.5px" },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    body2: { fontSize: "0.875rem" },
    caption: { fontSize: "0.75rem" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #E5E7EB" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: "0.72rem", borderRadius: 6 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, fontSize: "0.9rem" },
      },
    },
  },
});

export default theme;
