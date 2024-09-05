import { create } from "zustand"
import axios from "../lib/axios"
import toast from "react-hot-toast";


export const useCartStore = create((set, get) => ({
    cart: [],
    coupon: null,
    total: 0,
    subtotal: 0,
    isAppliedCoupon: false,

    getMyCoupon: async () => {
        try {
            const response = await axios.get("/api/coupons");
            set({ coupon: response?.data });
        } catch (error) {
            console.error("Error fetching coupon:", error);
        }
    },

    applyCoupon: async (code) => {
        try {
            const response = await axios.post("/api/coupons/validate", { code });
            set({ coupon: response?.data, isCouponApplied: true });
            get().calculateTotals();
            toast.success("Coupon applied successfully!");
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to apply coupon");
        }
    },

    removeCoupon: () => {
        set({ coupon: null, isCouponApplied: false });
        get().calculateTotals();
        toast.success("Coupon removed");
    },

    getCartItems: async () => {
        try {
            const res = await axios.get("/api/cart");
            set({ cart: res?.data });
            get().calculateTotals();
        } catch (error) {
            set({ cart: [] })
            toast.error(error?.response?.data?.message || "An error occured")
        }
    },
    addToCart: async (product) => {
        try {
            await axios.post("/api/cart", { productId: product._id });
            toast.success("Product added to cart!");

            set((prevState) => {
                // console.log(prevState)
                const existingItem = prevState.cart.find((item) => item._id === product._id);
                const newCart = existingItem
                    ? prevState.cart.map((item) =>
                        item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
                    )
                    : [...prevState.cart, { ...product, quantity: 1 }];
                return { cart: newCart };
            });
            get().calculateTotals();
        } catch (error) {
            toast.error(error.response.data.message || "An error occurred");
        }
    },

    removeFromCart: async (productId) => {
        const res = await axios.delete(`/api/cart`, { data: { productId } });
        set((prevState) => ({ cart: prevState?.cart?.filter((item) => item._id !== productId) }));
        toast.success(res?.data?.message);
        get().calculateTotals();
    },

    updateQuantity: async (productId, quantity) => {
        if (quantity === 0) {
            get().removeFromCart(productId);
            return;
        }

        await axios.put(`/api/cart/${productId}`, { quantity });
        set((prevState) => ({
            cart: prevState.cart.map((item) => item._id === productId ? { ...item, quantity } : item)
        }))
        get().calculateTotals();
    },



    calculateTotals: () => {
        const { cart, coupon } = get();
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let total = subtotal;

        if (coupon) {
            const discount = subtotal * (coupon.discountPercentage / 100);
            total = subtotal - discount;
        }

        set({ subtotal, total });
    },

    clearCart: async () => {
        set({ cart: [], coupon: null, total: 0, subtotal: 0 });
    },

    refreshToken: async () => {
        // Prevent multiple simultaneous refresh attempts
        if (get().checkingAuth) return;

        set({ checkingAuth: true });
        try {
            const response = await axios.post("/api/auth/refresh-token");
            set({ checkingAuth: false });
            toast.success(response?.data?.message)
            return response?.data;
        } catch (error) {
            set({ user: null, checkingAuth: false });
            throw error;
        }
    },


}));

// Axios interceptor for token refresh
let refreshPromise = null;

axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            console.log(originalRequest)
            try {
                // If a refresh is already in progress, wait for it to complete
                if (refreshPromise) {
                    await refreshPromise;
                    return axios(originalRequest);
                }

                // Start a new refresh process
                refreshPromise = useUserStore.getState().refreshToken();
                await refreshPromise;
                refreshPromise = null;

                return axios(originalRequest);
            } catch (refreshError) {
                // If refresh fails, redirect to login or handle as needed
                useUserStore.getState().logout();
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);