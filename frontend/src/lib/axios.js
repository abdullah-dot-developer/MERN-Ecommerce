import axios from "axios";

const axiosInstance = axios.create({
    baseURL: "https://mern-ecommerce-8udp.onrender.com",
    withCredentials: true
})

export default axiosInstance;