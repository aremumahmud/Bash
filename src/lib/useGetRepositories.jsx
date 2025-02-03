import axiosInstance from "./axios";
import StateAPI from "./state";



export const useGetRepositories = () => {
    const getRepositories = async(state) => {
        try {
            const response = await axiosInstance.get(`/${StateAPI(state)}`);
            return response.data;
        } catch (error) {
            console.error(
                "Error fetching repositories:",
                error.response?.data || error.message
            );
            throw error;
        }
    };

    return { getRepositories };
};