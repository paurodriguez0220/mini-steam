export const useEnv = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const API_AUTH_USERNAME = import.meta.env.VITE_API_AUTH_USERNAME;
  const API_AUTH_PASSWORD = import.meta.env.VITE_API_AUTH_PASSWORD;

  // Report only which variables are missing - never log the values themselves.
  const missing = [
    !API_URL && "VITE_API_URL",
    !API_AUTH_USERNAME && "VITE_API_AUTH_USERNAME",
    !API_AUTH_PASSWORD && "VITE_API_AUTH_PASSWORD",
  ].filter(Boolean);

  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(", ")}`);
  }

  return {
    API_URL,
    API_AUTH_USERNAME,
    API_AUTH_PASSWORD,
  };
};
