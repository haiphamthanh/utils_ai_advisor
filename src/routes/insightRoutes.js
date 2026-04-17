const { Router } = require("express");

function createInsightRoutes(insightController) {
  const router = Router();

  router.post("/session", insightController.createSession);
  router.post("/ask", insightController.askQuestion);
  router.post("/reflect", insightController.submitReflection);
  router.get("/config", insightController.getConfig);
  router.get("/dashboard/:userId", insightController.getDashboard);

  return router;
}

module.exports = {
  createInsightRoutes,
};
