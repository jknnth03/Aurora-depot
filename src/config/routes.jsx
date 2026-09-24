import { MODULES } from "./Modules.jsx";
import PrivateRoutes from "./PrivateRoutes.jsx";
import PublicRoute from "./PublicRoutes.jsx";
import Dashboard from "../pages/dashboard/Dashboard.jsx";
import Login from "../pages/login/Login.jsx";
import Departments from "../pages/departments/Departments.jsx";
import AreaManagement from "../pages/areas/Areas.jsx";
import AreaChecklists from "../pages/area-checklists/AreaChecklists.jsx";
import Users from "../pages/usermanagement/users/Users.jsx";
import Roles from "../pages/usermanagement/roles/Roles.jsx";
import Permissions from "../pages/usermanagement/permissions/Permissions.jsx";
import ScoreGrading from "../pages/score-grading/ScoreGrading.jsx";
import ChecklistType from "../pages/checklist-type/ChecklistType.jsx";
import OneCharging from "../pages/one-rdf/one-charging/OneCharging.jsx";
import OneUser from "../pages/one-rdf/one-user/OneUser.jsx";
import QAChecklist from "../pages/qa-checklist/QAChecklist.jsx";
import QADashboard from "../pages/qa-dashboard/QADashboard.jsx";
import GracePeriodSetting from "../pages/grade-period/GracePeriodSetting.jsx";
import Guidelines from "../pages/guidelines/Guidelines.jsx";

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
        id: "MASTERLIST.DEPARTMENTS",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.DEPARTMENTS.path}`,
        element: <Departments />,
        handle: {
          permission: MODULES.MASTERLIST.children.DEPARTMENTS.permissionId,
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
        id: "MASTERLIST.AREACHECKLISTS",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.AREACHECKLISTS.path}`,
        element: <AreaChecklists />,
        handle: {
          permission: MODULES.MASTERLIST.children.AREACHECKLISTS.permissionId,
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
        id: "MASTERLIST.CHECKLISTTYPE",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.CHECKLISTTYPE.path}`,
        element: <ChecklistType />,
        handle: {
          permission: MODULES.MASTERLIST.children.CHECKLISTTYPE.permissionId,
        },
      },
      {
        id: "MASTERLIST.QACHECKLIST",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.QACHECKLIST.path}`,
        element: <QAChecklist />,
        handle: {
          permission: MODULES.MASTERLIST.children.QACHECKLIST.permissionId,
        },
      },
      {
        id: "MASTERLIST.GRACEPERIODSETTING",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.GRACEPERIODSETTING.path}`,
        element: <GracePeriodSetting />,
        handle: {
          permission:
            MODULES.MASTERLIST.children.GRACEPERIODSETTING.permissionId,
        },
      },
      {
        id: "MASTERLIST.GUIDELINES",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.GUIDELINES.path}`,
        element: <Guidelines />,
        handle: {
          permission: MODULES.MASTERLIST.children.GUIDELINES.permissionId,
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

      {
        id: "QADASHBOARD",
        path: MODULES.QADASHBOARD.path,
        element: <QADashboard />,
        handle: { permission: MODULES.QADASHBOARD.permissionId },
      },
    ],
  },
];
