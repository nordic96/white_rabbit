export const API_URL = (() => {
  const url = process.env.API_URL;
  if (!url) {
    throw new Error('API_URL not provided');
  }
  return url;
})();
