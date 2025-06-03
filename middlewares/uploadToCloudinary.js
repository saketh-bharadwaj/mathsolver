import cloudinary from '../config/cloudinary.js';

/**
 * Uploads an image file to Cloudinary
 * @param {string} filePath - The local path of the image file to upload
 * @param {string} folder - (Optional) folder name on Cloudinary
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
export async function uploadToCloudinary(filePath, folder = 'chat-images') {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'image',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    throw error;
  }
}
