import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import fs from 'fs/promises';
import { uploadProfileImageToCloudinary } from "../middlewares/uploadToCloudinary.js";
import { UserModel, UserInfoModel } from "../models/usermodel.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // Temporary local storage

router.post('/editprofile', upload.single('image'), async (req, res) => {
  try {
    const { userId, email, username } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    // Optional: Email format validation
    // if (email && !/\S+@\S+\.\S+/.test(email)) {
    //   return res.status(400).json({ error: 'Invalid email format' });
    // }

    // Step 1: Try updating UserModel (email)
    try {
      if (email) {
        await UserModel.findByIdAndUpdate(userId, { email });
      }
    } catch (emailError) {
      console.error("Error updating email in UserModel:", emailError);
      return res.status(500).json({ error: "Failed to update email." });
    }

    // Step 2: Prepare updateData for UserInfoModel
    const updateData = {};
    if (username) updateData.username = username;

    // Step 3: If image is uploaded, upload to Cloudinary
    if (req.file) {
      try {
        const filePath = req.file.path;
        const imageUrl = await uploadProfileImageToCloudinary(filePath);
        updateData.profileImg = imageUrl;
        await fs.unlink(filePath); // Clean temp file
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        return res.status(500).json({ error: "Image upload failed" });
      }
    }

    // Step 4: Update UserInfoModel
    let updatedProfile;
    try {
      updatedProfile = await UserInfoModel.findOneAndUpdate(
        { userId },
        updateData,
        { new: true }
      );
    } catch (profileError) {
      console.error("Failed to update user profile info:", profileError);
      return res.status(500).json({ error: "Profile info update failed" });
    }

    // Step 5: Get updated email from UserModel
    let updatedUser;
    try {
      updatedUser = await UserModel.findById(userId);
    } catch (fetchUserError) {
      console.error("Failed to fetch updated user:", fetchUserError);
      return res.status(500).json({ error: "Could not retrieve updated user" });
    }

    if (!updatedUser || !updatedProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ✅ Success
    res.status(200).json({
      message: 'Profile updated',
      user: {
        email: updatedUser.email,
        username: updatedProfile.username,
        profileImg: updatedProfile.profileImg,
        userId: updatedUser._id,
      },
    });

  } catch (error) {
    console.error('Unexpected error during profile update:', error);
    res.status(500).json({ error: 'Unexpected server error' });
  }
});

export default router;
