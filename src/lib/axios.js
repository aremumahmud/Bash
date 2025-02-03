import axios from "axios";

const axiosInstance = axios.create({
    baseURL: "/api", // Replace with your API base URI
    headers: {
        "Content-Type": "application/json",
    },
});

export default axiosInstance;