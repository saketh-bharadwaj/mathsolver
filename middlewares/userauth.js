import jwt from 'jsonwebtoken'
import { UserInfoModel } from '../models/usermodel.js';

import dotenv from 'dotenv';
dotenv.config();

let jwtSecret=process.env.JWT_SECRET;

let userAuth= async (req, res, next) =>{
    
    const token = req.headers.token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Bad Auth - Authorization token missing",
        });
    }

    try {
        const response = jwt.verify(token, jwtSecret);
        
        req.userId = response.id;
        
        const user = await UserInfoModel.findOne({
            userId: response.id
        })
        req.user_name = user.name;
        
        next();
    } catch (err) {
        res.status(403).json({
            success: false,
            message: "Bad Auth - Invalid token or authentication failed",
        });
    }
}




export default userAuth;