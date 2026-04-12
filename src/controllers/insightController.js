class InsightController {
  constructor(insightService) {
    this.insightService = insightService;
  }

  createSession = async (request, response, next) => {
    try {
      const data = await this.insightService.createSession(request.body.userId);
      response.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  };

  askQuestion = async (request, response, next) => {
    try {
      const data = await this.insightService.askQuestion(request.body);
      response.json({ data });
    } catch (error) {
      next(error);
    }
  };

  submitReflection = async (request, response, next) => {
    try {
      const data = await this.insightService.submitReflection(request.body);
      response.json({ data });
    } catch (error) {
      next(error);
    }
  };

  getDashboard = async (request, response, next) => {
    try {
      const data = await this.insightService.getDashboard(request.params.userId);
      response.json({ data });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  InsightController,
};
