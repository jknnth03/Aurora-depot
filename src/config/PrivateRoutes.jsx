// import { useEffect } from "react";
import Layout from "../components/layout/Layout.jsx";
import { Outlet, Navigate, useLocation } from "react-router";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../app/authSlice.js";

// const ONE_RDF_URL =
//   import.meta.env.VITE_ONE_RDF_URL || "https://pretest-one.rdfmis.com/";

const PrivateRoutes = () => {
  const token = useSelector(selectCurrentToken);
  const location = useLocation();

  // useEffect(() => {
  //   if (!token) {
  //     window.location.href = ONE_RDF_URL;
  //   }
  // }, [token]);

  // if (!token) return null;

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default PrivateRoutes;
