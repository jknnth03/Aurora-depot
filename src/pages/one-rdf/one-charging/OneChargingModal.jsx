import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import "./OneChargingModal.scss";

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
          <p className="ocm__group-label">General Information</p>

          <div className="ocm__row">
            <div className="ocm__field ocm__field--grow">
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

            <div className="ocm__field ocm__field--grow">
              <div className="ocm__input-wrap">
                <label className="ocm__label">Sync ID</label>
                <input
                  type="text"
                  value={selectedRow?.sync_id ?? ""}
                  disabled
                  readOnly
                />
              </div>
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
        </div>

        <div className="ocm__group">
          <p className="ocm__group-label">Company Structure</p>

          <div className="ocm__row">
            <div className="ocm__field ocm__field--grow">
              <div className="ocm__input-wrap">
                <label className="ocm__label">Company</label>
                <input
                  type="text"
                  value={
                    selectedRow?.company_name
                      ? `${selectedRow.company_code} - ${selectedRow.company_name}`
                      : ""
                  }
                  disabled
                  readOnly
                />
              </div>
            </div>

            <div className="ocm__field ocm__field--grow">
              <div className="ocm__input-wrap">
                <label className="ocm__label">Business Unit</label>
                <input
                  type="text"
                  value={
                    selectedRow?.business_unit_name
                      ? `${selectedRow.business_unit_code} - ${selectedRow.business_unit_name}`
                      : ""
                  }
                  disabled
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="ocm__row" style={{ marginTop: 12 }}>
            <div className="ocm__field ocm__field--grow">
              <div className="ocm__input-wrap">
                <label className="ocm__label">Department</label>
                <input
                  type="text"
                  value={
                    selectedRow?.department_name
                      ? `${selectedRow.department_code} - ${selectedRow.department_name}`
                      : ""
                  }
                  disabled
                  readOnly
                />
              </div>
            </div>

            <div className="ocm__field ocm__field--grow">
              <div className="ocm__input-wrap">
                <label className="ocm__label">Department Unit</label>
                <input
                  type="text"
                  value={
                    selectedRow?.department_unit_name
                      ? `${selectedRow.department_unit_code} - ${selectedRow.department_unit_name}`
                      : ""
                  }
                  disabled
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="ocm__field" style={{ marginTop: 12 }}>
            <div className="ocm__input-wrap">
              <label className="ocm__label">Sub Unit</label>
              <input
                type="text"
                value={
                  selectedRow?.sub_unit_name
                    ? `${selectedRow.sub_unit_code} - ${selectedRow.sub_unit_name}`
                    : ""
                }
                disabled
                readOnly
              />
            </div>
          </div>
        </div>

        <div className="ocm__group">
          <p className="ocm__group-label">Location</p>

          <div className="ocm__field">
            <div className="ocm__input-wrap">
              <label className="ocm__label">Location</label>
              <input
                type="text"
                value={
                  selectedRow?.location_name
                    ? `${selectedRow.location_code} - ${selectedRow.location_name}`
                    : ""
                }
                disabled
                readOnly
              />
            </div>
          </div>
        </div>

        <div className="ocm__group">
          <p className="ocm__group-label">Sync Details</p>

          <div className="ocm__row">
            <div className="ocm__field ocm__field--grow">
              <div className="ocm__input-wrap">
                <label className="ocm__label">Date Created</label>
                <input
                  type="text"
                  value={formatDate(selectedRow?.created_at)}
                  disabled
                  readOnly
                />
              </div>
            </div>

            <div className="ocm__field ocm__field--grow">
              <div className="ocm__input-wrap">
                <label className="ocm__label">Last Updated</label>
                <input
                  type="text"
                  value={formatDate(selectedRow?.updated_at)}
                  disabled
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OneChargingModal;
