import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import ApartmentIcon from "@mui/icons-material/Apartment";
import "./DepartmentDialog.scss";

const getDepartmentOptionLabel = (department) => {
  if (!department) return "";
  return department.code
    ? `${department.code} - ${department.name}`
    : (department.name ?? "");
};

const DepartmentDialog = ({ open, onClose, departments = [] }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ className: "dd__paper" }}>
      <div className="dd__header">
        <div className="dd__header-title">
          <RemoveRedEyeIcon className="dd__header-icon" />
          <span>Departments</span>
        </div>
        <IconButton className="dd__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="dd__content">
        {departments?.length ? (
          <ul className="dd__list">
            {departments.map((department) => (
              <li key={department.id} className="dd__list-item">
                <ApartmentIcon className="dd__list-icon" />
                <span>{getDepartmentOptionLabel(department)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dd__empty">No departments assigned</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DepartmentDialog;
