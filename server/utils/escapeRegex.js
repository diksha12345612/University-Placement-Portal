// Makes user text safe to use inside a MongoDB regex (so "C++" does not break the search)
const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { escapeRegex };
