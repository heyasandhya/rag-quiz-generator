import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 180000
});

export function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || "Something went wrong. Please try again.";
}
export default api;
