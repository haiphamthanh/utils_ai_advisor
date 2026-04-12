const { Router } = require("express");

function createRoutes({ insightRoutes }) {
  const router = Router();

  router.get("/health", (request, response) => {
    response.json({
      ok: true,
      service: "insight-companion",
      timestamp: new Date().toISOString(),
    });
  });

  router.use("/insight", insightRoutes);

  return router;
}

module.exports = {
  createRoutes,
};
