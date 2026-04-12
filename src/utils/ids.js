const { randomUUID } = require("crypto");

function createId(prefix) {
  return `${prefix}_${randomUUID()}`;
}

module.exports = {
  createId,
};
