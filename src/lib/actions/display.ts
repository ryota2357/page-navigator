import { findService } from "../services/catalog";

// An action id either stands on its own (`scrollDown`) or carries a
// service prefix (`google.openResult`). In the latter case we strip the
// `service.` prefix from the visible name and render the service as a
// small badge — same idea as the design mock's `.badge.site`.
export type ActionDisplay = {
  name: string;
  badge: { id: string; label: string } | null;
};

export function actionDisplay(id: string): ActionDisplay {
  const dot = id.indexOf(".");
  if (dot < 0) return { name: id, badge: null };
  const serviceId = id.slice(0, dot);
  const rest = id.slice(dot + 1);
  const svc = findService(serviceId);
  return {
    name: rest,
    badge: { id: serviceId, label: svc?.label ?? serviceId },
  };
}
