// src/utils/slugify.js
export const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
