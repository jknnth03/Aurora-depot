import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router";
import { setCredentials } from "../../app/authSlice";

const ONE_RDF_URL =
  import.meta.env.VITE_ONE_RDF_URL || "https://pretest-one.rdfmis.com/";

const Redirect = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { search } = useLocation();
  const rawData = new URLSearchParams(search).get("data");

  useEffect(() => {
    try {
      const data = JSON.parse(decodeURIComponent(rawData));
      const result = data?.result;
      if (!result?.token) throw new Error("Missing token");

      dispatch(
        setCredentials({
          user: result,
          token: result.token,
        }),
      );
      navigate("/", { replace: true });
    } catch (e) {
      window.location.href = ONE_RDF_URL;
    }
  }, [rawData]);

  return null;
};

export default Redirect;
