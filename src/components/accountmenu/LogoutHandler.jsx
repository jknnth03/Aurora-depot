import { useDispatch, useSelector } from "react-redux";
import { clearCredentials, selectIsLoggingOut } from "../../app/authSlice.js";
import LogoutTransition from "../accountmenu/Logouttransition.jsx";
import router from "../../config/router.jsx";
import { useLogoutMutation } from "../../features/api/login/loginApi.js";

// const ONE_RDF_URL =
//   import.meta.env.VITE_ONE_RDF_URL || "https://pretest-one.rdfmis.com/";

const LogoutHandler = () => {
  const dispatch = useDispatch();
  const isLoggingOut = useSelector(selectIsLoggingOut);
  const [logout] = useLogoutMutation();

  const handleTransitionComplete = async () => {
    try {
      await logout().unwrap();
    } catch (err) {
      console.error("Logout API call failed:", err);
      // proceed anyway, we still want to clear local session
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // dispatch(clearCredentials());
    // window.location.href = ONE_RDF_URL;

    router.navigate("/login").then(() => {
      dispatch(clearCredentials());
    });
  };

  if (!isLoggingOut) return null;
  return <LogoutTransition onComplete={handleTransitionComplete} />;
};

export default LogoutHandler;
