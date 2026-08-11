import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import Chip from "@mui/material/Chip";
import {
  getChipBg,
  getChipTextColor,
  getChipName,
  CHIP_SX,
} from "../../../components/accountmenu/ChipColorPickerUtils";
import "./OneUserModal.scss";

const OneUserModal = ({ open, onClose, selectedRow = null }) => {
  const isInactive = selectedRow?.status === "inactive";
  const chipId = isInactive ? "chip-inactive" : "chip-active";

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "oum__paper" }}>
      <div className="oum__header">
        <div className="oum__header-title">
          <RemoveRedEyeIcon className="oum__header-icon" />
          <span>View One User</span>
        </div>
        <IconButton className="oum__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="oum__content">
        <div className="oum__group">
          <p className="oum__group-label">User Details</p>

          <div className="oum__field">
            <div className="oum__input-wrap">
              <label className="oum__label">Employee ID</label>
              <input
                type="text"
                value={selectedRow?.employee_id ?? ""}
                disabled
                readOnly
              />
            </div>
          </div>

          <div className="oum__field" style={{ marginTop: 12 }}>
            <div className="oum__input-wrap">
              <label className="oum__label">Name</label>
              <input
                type="text"
                value={selectedRow?.name ?? ""}
                disabled
                readOnly
              />
            </div>
          </div>

          <div className="oum__field" style={{ marginTop: 12 }}>
            <div className="oum__input-wrap">
              <label className="oum__label">Email</label>
              <input
                type="text"
                value={selectedRow?.email ?? ""}
                disabled
                readOnly
              />
            </div>
          </div>

          <div className="oum__row" style={{ marginTop: 12 }}>
            <div className="oum__field oum__field--grow">
              <div className="oum__input-wrap">
                <label className="oum__label">Role</label>
                <input
                  type="text"
                  value={selectedRow?.role ?? "-"}
                  disabled
                  readOnly
                />
              </div>
            </div>

            <div className="oum__field oum__field--grow">
              <div className="oum__input-wrap oum__input-wrap--chip">
                <label className="oum__label">Status</label>
                <Chip
                  label={getChipName(chipId)}
                  sx={{
                    ...CHIP_SX,
                    backgroundColor: getChipBg(chipId),
                    color: getChipTextColor(chipId),
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OneUserModal;
