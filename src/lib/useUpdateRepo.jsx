import axiosInstance from './axios';
import StateAPI from './state';

export const useUpdateRepository = () => {
    const updateRepository = async (id, updatedData,state) => {
        try {
            const response = await axiosInstance.put(`/${StateAPI(state)}/${id}`, updatedData);
            return response.data;
        } catch (error) {
            console.error('Error updating repository:', error.response?.data || error.message);
            throw error;
        }
    };

    return { updateRepository };
};
