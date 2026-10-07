import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import ApartmentIcon from "@mui/icons-material/Apartment";
import "./UnitsDialog.scss";

const getUnitOptionLabel = (unit) => {
  if (!unit) return "";
  return unit.code ? `${unit.code} - ${unit.name}` : (unit.name ?? "");
};

const UnitsDialog = ({ open, onClose, units = [] }) => {
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
          <span>Units</span>
        </div>
        <IconButton className="dd__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="dd__content">
        {units?.length ? (
          <ul className="dd__list">
            {units.map((unit) => (
              <li key={unit.id} className="dd__list-item">
                <ApartmentIcon className="dd__list-icon" />
                <span>{getUnitOptionLabel(unit)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dd__empty">No units assigned</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UnitsDialog;
