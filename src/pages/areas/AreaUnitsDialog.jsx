import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import ApartmentIcon from "@mui/icons-material/Apartment";
import "./AreaUnitsDialog.scss";

const getUnitOptionLabel = (unit) => {
  if (!unit) return "";
  return unit.code ? `${unit.code} - ${unit.name}` : (unit.name ?? "");
};

const AreaUnitsDialog = ({ open, onClose, units = [] }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ className: "aud__paper" }}>
      <div className="aud__header">
        <div className="aud__header-title">
          <RemoveRedEyeIcon className="aud__header-icon" />
          <span>Units</span>
        </div>
        <IconButton className="aud__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="aud__content">
        {units?.length ? (
          <ul className="aud__list">
            {units.map((unit) => (
              <li key={unit.id} className="aud__list-item">
                <ApartmentIcon className="aud__list-icon" />
                <span>{getUnitOptionLabel(unit)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="aud__empty">No units assigned</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AreaUnitsDialog;
