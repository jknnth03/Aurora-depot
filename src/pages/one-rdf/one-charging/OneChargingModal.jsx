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
import "./OneChargingModal.scss";

const formatAmount = (val) =>
  val != null
    ? `₱${Number(val).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "-";

const formatDate = (val) => {
  if (!val) return "-";
  const date = new Date(val);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const OneChargingModal = ({ open, onClose, selectedRow = null }) => {
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
      PaperProps={{ className: "ocm__paper" }}>
      <div className="ocm__header">
        <div className="ocm__header-title">
          <RemoveRedEyeIcon className="ocm__header-icon" />
          <span>View One Charging</span>
        </div>
        <IconButton className="ocm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="ocm__content">
        <div className="ocm__group">
          <p className="ocm__group-label">One Charging Details</p>

          <div className="ocm__field">
            <div className="ocm__input-wrap">
              <label className="ocm__label">Code</label>
              <input
                type="text"
                value={selectedRow?.code ?? ""}
                disabled
                readOnly
              />
            </div>
          </div>

          <div className="ocm__field" style={{ marginTop: 12 }}>
            <div className="ocm__input-wrap">
              <label className="ocm__label">Name</label>
              <input
                type="text"
                value={selectedRow?.name ?? ""}
                disabled
                readOnly
              />
            </div>
          </div>

          <div className="ocm__row" style={{ marginTop: 12 }}>
            <div className="ocm__field ocm__field--grow">
              <div className="ocm__input-wrap">
                <label className="ocm__label">Amount</label>
                <input
                  type="text"
                  value={formatAmount(selectedRow?.amount)}
                  disabled
                  readOnly
                />
              </div>
            </div>

            <div className="ocm__field ocm__field--grow">
              <div className="ocm__input-wrap ocm__input-wrap--chip">
                <label className="ocm__label">Status</label>
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

          <div className="ocm__field" style={{ marginTop: 12 }}>
            <div className="ocm__input-wrap">
              <label className="ocm__label">Date Synced</label>
              <input
                type="text"
                value={formatDate(selectedRow?.synced_at)}
                disabled
                readOnly
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OneChargingModal;
