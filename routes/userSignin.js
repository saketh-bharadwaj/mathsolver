import express from "express";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { UserModel,UserInfoModel } from "../models/usermodel.js";

const router = express.Router();

router.post('/signin',async function(req, res){
    const email=req.body.email;
    const password=req.body.password;
    let userInfoResponse = {};
    const response = await UserModel.findOne({
        email: email
    })
    if (response) {
    userInfoResponse = await UserInfoModel.findOne({
        userId: response._id
    });

    console.log(userInfoResponse);
}
    if(!response){
        res.status(403).json({
            success: false,
            message: "User does not exist"
        })
        return;
    }
    const passwordMatch=await bcrypt.compare(password,response.password);
    if(passwordMatch){
        const token=jwt.sign({
            id: response._id.toString()
        },process.env.JWT_SECRET);
        res.json({
            success: true,
            token: token,
            userId: response._id,
            username: userInfoResponse.username,
            profileImg: userInfoResponse.profileImg
        })
    }
    else {
        res.status(403).json({
            success: false,
            message: "Invalid Credentials"
        })
    }
})

export default router;