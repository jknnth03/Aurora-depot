import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SecurityIcon from "@mui/icons-material/Security";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import PlaceIcon from "@mui/icons-material/Place";
import ListAltIcon from "@mui/icons-material/ListAlt";
import MapIcon from "@mui/icons-material/Map";
import GradeIcon from "@mui/icons-material/Grade";
import CloudSyncIcon from "@mui/icons-material/CloudSync";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";

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
    displayName: "Login",
    path: "/login",
    icon: null,
    children: null,
  },

  DASHBOARD: {
    name: "Dashboard",
    permissionId: "DASHBOARD",
    permissionKey: null,
    displayName: "Dashboard",
    path: "/",
    icon: <SpaceDashboardIcon sx={iconStyles.main} />,
    children: null,
  },

  USERMANAGEMENT: {
    name: "User Management",
    permissionId: "USERMANAGEMENT",
    permissionKey: null,
    displayName: "User Management",
    path: "/usermanagement",
    icon: <ManageAccountsIcon sx={iconStyles.main} />,
    children: {
      USERS: {
        name: "Users",
        permissionId: "USERMANAGEMENT.USERS",
        permissionKey: "user.view",
        displayName: "Users",
        path: "users",
        icon: <PersonAddIcon sx={iconStyles.child} />,
      },
      ROLES: {
        name: "Roles",
        permissionId: "USERMANAGEMENT.ROLES",
        permissionKey: "role.view",
        displayName: "Roles",
        path: "roles",
        icon: <SecurityIcon sx={iconStyles.child} />,
      },
      PERMISSIONS: {
        name: "Permissions",
        permissionId: "USERMANAGEMENT.PERMISSIONS",
        // NOTE: backend has no "permissions.*" permission seeded yet (no
        // GET /permissions endpoint confirmed either — see permissionsApi.js).
        // Set to null so this stays visible in the sidebar for now. Swap to
        // the real key (e.g. "permissions.view") once backend adds it.
        permissionKey: null,
        displayName: "Permissions",
        path: "permissions",
        icon: <VpnKeyIcon sx={iconStyles.child} />,
      },
    },
  },

  MASTERLIST: {
    name: "Masterlist",
    permissionId: "MASTERLIST",
    permissionKey: null,
    displayName: "Masterlist",
    path: "/masterlist",
    icon: <ListAltIcon sx={iconStyles.main} />,
    children: {
      LOCATIONS: {
        name: "Locations",
        permissionId: "MASTERLIST.LOCATIONS",
        permissionKey: "location.view",
        displayName: "Locations",
        path: "locations",
        icon: <PlaceIcon sx={iconStyles.child} />,
      },
      AREAS: {
        name: "Areas",
        permissionId: "MASTERLIST.AREAS",
        permissionKey: "area.view",
        displayName: "Areas",
        path: "areas",
        icon: <MapIcon sx={iconStyles.child} />,
      },
      SCOREGRADING: {
        name: "Score Grading",
        permissionId: "MASTERLIST.SCOREGRADING",
        permissionKey: "score_grade.view",
        displayName: "Score Grading",
        path: "score-grading",
        icon: <GradeIcon sx={iconStyles.child} />,
      },
    },
  },

  ONERDF: {
    name: "One RDF",
    permissionId: "ONERDF",
    permissionKey: null,
    displayName: "One RDF",
    path: "/one-rdf",
    icon: <CloudSyncIcon sx={iconStyles.main} />,
    children: {
      ONECHARGING: {
        name: "One Charging",
        permissionId: "ONERDF.ONECHARGING",
        permissionKey: "one_charging.view",
        displayName: "One Charging",
        path: "one-charging",
        icon: <ReceiptLongIcon sx={iconStyles.child} />,
      },
      ONEUSER: {
        name: "One User",
        permissionId: "ONERDF.ONEUSER",
        permissionKey: "one_user.view",
        displayName: "One User",
        path: "one-user",
        icon: <PeopleAltIcon sx={iconStyles.child} />,
      },
    },
  },
};
