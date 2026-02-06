import axiosInstance from './axiosInstance';

export const uploadAPI = {
    uploadSingle: (file) => {
        const formData = new FormData();
        formData.append('image', file);
        return axiosInstance.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    uploadMultiple: (files) => {
        const formData = new FormData();
        Array.from(files).forEach((file) => {
            formData.append('images', file);
        });
        return axiosInstance.post('/api/upload/multiple', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};
