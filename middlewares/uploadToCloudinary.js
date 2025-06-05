import cloudinary from '../config/cloudinary.js';

/**
 * Uploads an image file to Cloudinary
 * @param {string} filePath - The local path of the image file to upload
 * @param {string} folder - (Optional) folder name on Cloudinary
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
export async function uploadChatImageToCloudinary(filePath, folder = 'chat-images') {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'image',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary chat image upload failed:', error);
    throw error;
  }
}


/**
 * Uploads a user profile image to Cloudinary.
 * @param {string} filePath - The local path of the profile image file to upload
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
export async function uploadProfileImageToCloudinary(filePath) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'user-profile-images',
      resource_type: 'image',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary profile image upload failed:', error);
    throw error;
  }
}