import { create } from "zustand";
import { toast } from "react-hot-toast"
import axios from "../lib/axios";



export const useUserStore = create((set, get) => ({
    user: null,
    loading: false,
    checkingAuth: false,

    signup: async ({ name, email, password, confirmPassword }) => {
        set({ loading: true });
        if (password !== confirmPassword) {
            set({ loading: false })
            return toast.error("Password don't match!")
        }

        try {
            const res = await axios.post("/api/auth/signup", { name, email, password });
            // console.log(res)
            set({ user: res?.data, loading: false })
            toast.success(res?.data?.message);

        } catch (error) {
            set({ loading: false });
            toast.error(error?.response?.data?.message || "An error occurred");
        }
    },
    login: async ({ email, password }) => {
        // console.log(email, password)
        set({ loading: true });

        try {
            const res = await axios.post("/api/auth/login", { email, password });
            // console.log(res)
            set({ user: res?.data, loading: false })
            toast.success(res?.data?.message);
        } catch (error) {
            set({ loading: false });
            toast.error(error?.response?.data?.message || "An error occurred");
        }
    },

    logout: async () => {
        set({ loading: true });
        try {
            const res = await axios.post("/api/auth/logout");
            set({ user: null })
            toast.success(res?.data?.message)
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred during logout");
        }
    },

    checkAuth: async () => {
        set({ checkingAuth: true })
        try {
            const res = await axios.get("/api/auth/profile");
            set({ checkingAuth: false, user: res?.data })
        } catch (error) {
            console.log(error.message);
            set({ checkingAuth: false, user: null });
        }
    }
})) 