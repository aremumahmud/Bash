import axiosInstance from './axios';
import StateAPI from './state';

export const useDeleteRepository = () => {
    const deleteRepository = async (id, state) => {
        try {
            const response = await axiosInstance.delete(`/${StateAPI(state)}/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting repository:', error.response?.data || error.message);
            throw error;
        }
    };

    return { deleteRepository };
};
