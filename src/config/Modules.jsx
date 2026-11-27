import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SecurityIcon from "@mui/icons-material/Security";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import ListAltIcon from "@mui/icons-material/ListAlt";
import MapIcon from "@mui/icons-material/Map";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import GradeIcon from "@mui/icons-material/Grade";
import ChecklistIcon from "@mui/icons-material/Checklist";
import CloudSyncIcon from "@mui/icons-material/CloudSync";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import AssessmentIcon from "@mui/icons-material/Assessment";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import DescriptionIcon from "@mui/icons-material/Description";

export const iconStyles = {
  main: { fontSize: "22px" },
  mainMedium: { fontSize: "24px" },
  mainLarge: { fontSize: "26px" },
  mainExtraLarge: { fontSize: "28px" },
  child: { fontSize: "18px" },
  button: { fontSize: "18px" },
  sync: { fontSize: "20px" },
};

export const imageStyles = {
  noData: { width: "120px", height: "120px" },
};

export const MODULES = {
  LOGIN: {
    name: "Login",
    permissionId: "LOGIN",
    permissionKey: null,
    path: "/login",
    icon: null,
    children: null,
  },

  DASHBOARD: {
    name: "Dashboard",
    permissionId: "DASHBOARD",
    permissionKey: null,
    path: "/",
    icon: <SpaceDashboardIcon sx={iconStyles.main} />,
    children: null,
  },

  USERMANAGEMENT: {
    name: "User Management",
    permissionId: "USERMANAGEMENT",
    permissionKey: null,
    path: "/usermanagement",
    icon: <ManageAccountsIcon sx={iconStyles.main} />,
    children: {
      USERS: {
        name: "Users",
        permissionId: "USERMANAGEMENT.USERS",
        permissionKey: "user",
        path: "users",
        icon: <PersonAddIcon sx={iconStyles.child} />,
      },
      ONEUSER: {
        name: "One User",
        permissionId: "USERMANAGEMENT.ONEUSER",
        permissionKey: "one-user",
        path: "one-user",
        icon: <PeopleAltIcon sx={iconStyles.child} />,
      },
      ROLES: {
        name: "Roles",
        permissionId: "USERMANAGEMENT.ROLES",
        permissionKey: "role",
        path: "roles",
        icon: <SecurityIcon sx={iconStyles.child} />,
      },
      PERMISSIONS: {
        name: "Permissions",
        permissionId: "USERMANAGEMENT.PERMISSIONS",
        // was null (null = visible to everyone); now requires the permission key
        permissionKey: "permissions",
        path: "permissions",
        icon: <VpnKeyIcon sx={iconStyles.child} />,
      },
    },
  },

  MASTERLIST: {
    name: "Masterlist",
    permissionId: "MASTERLIST",
    permissionKey: null,
    path: "/masterlist",
    icon: <ListAltIcon sx={iconStyles.main} />,
    children: {
      UNITS: {
        name: "Units",
        permissionId: "MASTERLIST.UNITS",
        permissionKey: "unit",
        path: "units",
        icon: <AccountTreeIcon sx={iconStyles.child} />,
      },
      AREAS: {
        name: "Areas",
        permissionId: "MASTERLIST.AREAS",
        permissionKey: "area",
        path: "areas",
        icon: <MapIcon sx={iconStyles.child} />,
      },
      AREACHECKLISTS: {
        name: "Area Checklists",
        permissionId: "MASTERLIST.AREACHECKLISTS",
        permissionKey: "area-checklist",
        path: "area-checklists",
        icon: <FactCheckIcon sx={iconStyles.child} />,
      },
      SCOREGRADING: {
        name: "Score Grading",
        permissionId: "MASTERLIST.SCOREGRADING",
        permissionKey: "score-grading",
        path: "score-grading",
        icon: <GradeIcon sx={iconStyles.child} />,
      },
      CHECKLISTTYPE: {
        name: "Checklist Type",
        permissionId: "MASTERLIST.CHECKLISTTYPE",
        permissionKey: "checklist-type",
        path: "checklist-type",
        icon: <ChecklistIcon sx={iconStyles.child} />,
      },
      QACHECKLIST: {
        name: "Checklist",
        permissionId: "MASTERLIST.QACHECKLIST",
        permissionKey: "checklist",
        path: "qa-checklist",
        icon: <FactCheckIcon sx={iconStyles.child} />,
      },
      GRACEPERIODSETTING: {
        name: "Grace Period Setting",
        permissionId: "MASTERLIST.GRACEPERIODSETTING",
        permissionKey: "late-grace-day-setting",
        path: "grace-period-setting",
        icon: <EventBusyIcon sx={iconStyles.child} />,
      },
      GUIDELINES: {
        name: "Guidelines",
        permissionId: "MASTERLIST.GUIDELINES",
        permissionKey: "guideline",
        path: "guidelines",
        icon: <DescriptionIcon sx={iconStyles.child} />,
      },
    },
  },

  ONERDF: {
    name: "One RDF",
    permissionId: "ONERDF",
    permissionKey: null,
    path: "/one-rdf",
    icon: <CloudSyncIcon sx={iconStyles.main} />,
    children: {
      ONECHARGING: {
        name: "One Charging",
        permissionId: "ONERDF.ONECHARGING",
        permissionKey: "one-charging",
        path: "one-charging",
        icon: <ReceiptLongIcon sx={iconStyles.child} />,
      },
    },
  },

  QADASHBOARD: {
    name: "QA Dashboard",
    permissionId: "QADASHBOARD",
    permissionKey: "my-checklist",
    path: "/qa-dashboard",
    icon: <AssessmentIcon sx={iconStyles.main} />,
    children: null,
  },
};
