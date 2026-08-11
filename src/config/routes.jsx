import { MODULES } from "./modules.jsx";
import PrivateRoutes from "./PrivateRoutes.jsx";
import PublicRoute from "./PublicRoutes.jsx";
import Dashboard from "../pages/dashboard/Dashboard.jsx";
import Login from "../pages/login/Login.jsx";
import Locations from "../pages/locations/Locations.jsx";
import AreaManagement from "../pages/areas/Areas.jsx";
import Users from "../pages/usermanagement/users/Users.jsx";
import Roles from "../pages/usermanagement/roles/Roles.jsx";
import Permissions from "../pages/usermanagement/permissions/Permissions.jsx";
import ScoreGrading from "../pages/score-grading/ScoreGrading.jsx";
import OneCharging from "../pages/one-rdf/one-charging/OneCharging.jsx";
import OneUser from "../pages/one-rdf/one-user/OneUser.jsx";

export const ROUTES = [
  {
    id: "LOGIN",
    path: MODULES.LOGIN.path,
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },

  {
    element: <PrivateRoutes />,
    children: [
      {
        id: "DASHBOARD",
        path: MODULES.DASHBOARD.path,
        element: <Dashboard />,
        handle: { permission: MODULES.DASHBOARD.permissionId },
      },

      {
        id: "USERMANAGEMENT.USERS",
        path: `${MODULES.USERMANAGEMENT.path}/${MODULES.USERMANAGEMENT.children.USERS.path}`,
        element: <Users />,
        handle: {
          permission: MODULES.USERMANAGEMENT.children.USERS.permissionId,
        },
      },
      {
        id: "USERMANAGEMENT.ROLES",
        path: `${MODULES.USERMANAGEMENT.path}/${MODULES.USERMANAGEMENT.children.ROLES.path}`,
        element: <Roles />,
        handle: {
          permission: MODULES.USERMANAGEMENT.children.ROLES.permissionId,
        },
      },
      {
        id: "USERMANAGEMENT.PERMISSIONS",
        path: `${MODULES.USERMANAGEMENT.path}/${MODULES.USERMANAGEMENT.children.PERMISSIONS.path}`,
        element: <Permissions />,
        handle: {
          permission: MODULES.USERMANAGEMENT.children.PERMISSIONS.permissionId,
        },
      },

      {
        id: "MASTERLIST.LOCATIONS",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.LOCATIONS.path}`,
        element: <Locations />,
        handle: {
          permission: MODULES.MASTERLIST.children.LOCATIONS.permissionId,
        },
      },
      {
        id: "MASTERLIST.AREAS",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.AREAS.path}`,
        element: <AreaManagement />,
        handle: {
          permission: MODULES.MASTERLIST.children.AREAS.permissionId,
        },
      },
      {
        id: "MASTERLIST.SCOREGRADING",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.SCOREGRADING.path}`,
        element: <ScoreGrading />,
        handle: {
          permission: MODULES.MASTERLIST.children.SCOREGRADING.permissionId,
        },
      },

      {
        id: "ONERDF.ONECHARGING",
        path: `${MODULES.ONERDF.path}/${MODULES.ONERDF.children.ONECHARGING.path}`,
        element: <OneCharging />,
        handle: {
          permission: MODULES.ONERDF.children.ONECHARGING.permissionId,
        },
      },
      {
        id: "ONERDF.ONEUSER",
        path: `${MODULES.ONERDF.path}/${MODULES.ONERDF.children.ONEUSER.path}`,
        element: <OneUser />,
        handle: {
          permission: MODULES.ONERDF.children.ONEUSER.permissionId,
        },
      },
    ],
  },
];
