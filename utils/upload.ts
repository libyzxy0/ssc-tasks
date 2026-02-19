import axios from 'axios';

export const uploadImage = async (uri: string) => {
  try {
    const formData = new FormData();

    formData.append('file', {
      uri,
      name: `image-${Date.now()}.jpg`,
      type: 'image/jpeg',
    } as any);

    const response = await axios.post(
      'https://api.lccgatepass.xyz/api/v1/upload/imagekit',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
        },
      }
    );
    
    if(!response.data) throw new Error("Error, Maybe the server is busy or sleeping 😅");

    return response.data;

  } catch (error: any) {
    console.error(error.response ? error.response.data.error : error.message);
    throw error;
  }
};
