import { RouterProvider } from "react-router";
import router from "./router.jsx";
import { Provider } from "react-redux";
import { SnackbarProvider, closeSnackbar } from "notistack";
import { store } from "../app/store.js";
import SnackbarRegistrar from "../components/snackbar/SnackbarRegistrar.jsx";
import LogoutHandler from "../components/accountmenu/LogoutHandler.jsx";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

const Providers = () => {
  return (
    <Provider store={store}>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        action={(snackbarId) => (
          <IconButton
            size="small"
            onClick={() => closeSnackbar(snackbarId)}
            sx={{ color: "#fff" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}>
        <SnackbarRegistrar />
        <RouterProvider router={router} />
        <LogoutHandler />
      </SnackbarProvider>
    </Provider>
  );
};

export default Providers;
