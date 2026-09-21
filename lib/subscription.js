// Real-time status: database ka status aur period end dono dekhta hai
export function getEffectiveStatus(sub) {
  if (!sub) return "inactive";

  const notExpired =
    sub.current_period_end && new Date(sub.current_period_end) > new Date();

  if (sub.status === "active" && notExpired) return "active";
  // Cancel kiya hai par paid period abhi baaki hai
  if (sub.status === "cancelled" && notExpired) return "cancelled";
  // Period khatam ho gaya to lapsed
  if (sub.status === "active" || sub.status === "cancelled") return "lapsed";

  return sub.status; // inactive / lapsed
}

// Platform features kaun use kar sakta hai
export function hasAccess(status) {
  return status === "active" || status === "cancelled";
}