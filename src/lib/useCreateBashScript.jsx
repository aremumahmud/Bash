import axiosInstance from './axios';
import StateAPI from './state';

export const useCreateBashScript = () => {
    const createBashScript = async (recordIds, state) => {
        try {
            const response = await axiosInstance.post(`/${StateAPI(state)}/create-bash`, { recordIds }, {
                responseType: 'blob', // For handling file downloads
            });

            // Create a blob and download it
            const blob = new Blob([response.data], { type: 'text/plain' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = state == 'bash'?'deploy_repositories.sh':'backup.sh'; // Name of the downloaded file
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('Bash script downloaded successfully');
        } catch (error) {
            console.error('Error creating Bash script:', error.response?.data || error.message);
            throw error;
        }
    };

    return { createBashScript };
};
