import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import MapIcon from "@mui/icons-material/Map";
import "./UnitAreasDialog.scss";

const UnitAreasDialog = ({ open, onClose, areas = [], unitName = "" }) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="xs"
    fullWidth
    PaperProps={{ className: "uad__paper" }}>
    <div className="uad__header">
      <div className="uad__header-title">
        <MapIcon className="uad__header-icon" />
        <span>{unitName ? `Areas - ${unitName}` : "Areas"}</span>
      </div>
      <IconButton className="uad__close" onClick={onClose} size="small">
        <CloseIcon fontSize="small" />
      </IconButton>
    </div>

    <DialogContent className="uad__content">
      {areas.length > 0 ? (
        <ul className="uad__list">
          {areas.map((area) => (
            <li className="uad__item" key={area.id}>
              <span className="uad__item-code">{area.code}</span>
              <span className="uad__item-name">{area.name}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="uad__empty">No areas assigned</p>
      )}
    </DialogContent>
  </Dialog>
);

export default UnitAreasDialog;
