import axiosInstance from "./axios";
import StateAPI from "./state";

export const useCreateRepository = () => {
    const createRepository = async(data, state) => {
        try {
            const response = await axiosInstance.post(`/${StateAPI(state)}/`, data);
            return response.data;
        } catch (error) {
            console.error(
                "Error creating repository:",
                error.response?.data || error.message
            );
            throw error;
        }
    };

    return { createRepository };
};