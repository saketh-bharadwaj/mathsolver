import express from 'express';
import bcrypt from 'bcrypt';
import { UserInfoModel, UserModel} from '../models/usermodel.js'

const router = express.Router();



router.post('/signup',  async function(req, res){
    const { username,  email, password } = req.body;
    
    let errorThrown = false;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await UserModel.create({
            email: email,
            password: hashedPassword
        });
       
      
       
        await UserInfoModel.create({
            username: username,
            userId: newUser._id,
        });

       

       

    } catch(err) {
        
        res.json({
            success: false,
            message: "user Already exists",
            error: err
        });
        errorThrown = true;
    }

    if (!errorThrown) {
        res.json({
            success: true,
            message: "Signup successful"
        });
    }
});

export default router;