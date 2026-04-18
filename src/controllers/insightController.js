class InsightController {
  constructor(insightService) {
    this.insightService = insightService;
  }

  createSession = async (request, response, next) => {
    try {
      const data = await this.insightService.createSession(
        request.body.userId,
        request.body.provider
      );
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

  createRoadmap = async (request, response, next) => {
    try {
      const data = await this.insightService.createRoadmap(request.body);
      response.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  };

  createNote = async (request, response, next) => {
    try {
      const data = await this.insightService.createNote(request.body);
      response.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  };

  resolveNote = async (request, response, next) => {
    try {
      const data = await this.insightService.resolveNote({
        ...request.body,
        noteId: request.params.noteId,
      });
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

  getConfig = async (request, response, next) => {
    try {
      const data = await this.insightService.getConfig();
      response.json({ data });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  InsightController,
};
