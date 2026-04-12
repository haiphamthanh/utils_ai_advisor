function notFoundHandler(request, response) {
  response.status(404).json({
    error: "Route not found.",
  });
}

function errorHandler(error, request, response, next) {
  const statusCode = error.message && error.message.includes("not found") ? 404 : 400;

  response.status(statusCode).json({
    error: error.message || "Unexpected server error.",
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
