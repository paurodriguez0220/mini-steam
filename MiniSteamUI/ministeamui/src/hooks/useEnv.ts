export const useEnv = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const API_AUTH_USERNAME = import.meta.env.VITE_API_AUTH_USERNAME;
  const API_AUTH_PASSWORD = import.meta.env.VITE_API_AUTH_PASSWORD;

  if (!API_URL || !API_AUTH_USERNAME || !API_AUTH_PASSWORD) {
    console.warn("⚠️ Missing environment variables", {
      API_URL,
      API_AUTH_USERNAME,
      API_AUTH_PASSWORD,
    });
  }

  return {
    API_URL,
    API_AUTH_USERNAME,
    API_AUTH_PASSWORD,
  };
};
