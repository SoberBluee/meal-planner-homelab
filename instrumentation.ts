export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logAction, getLogDir } = await import("@/lib/logger");

    logAction({
      action: "app.start",
      outcome: "success",
      summary: "Meal Planner server starting",
      nodeEnv: process.env.NODE_ENV,
      logDir: getLogDir(),
      port: process.env.PORT || "3000",
      hostname: process.env.HOSTNAME || "0.0.0.0",
    });
  }
}
