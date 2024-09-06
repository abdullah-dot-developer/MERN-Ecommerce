import axios from "axios";

const axiosInstance = axios.create({
    baseURL: "https://mern-ecommerce-ie0r.onrender.com",
    withCredentials: true
})

export default axiosInstance;