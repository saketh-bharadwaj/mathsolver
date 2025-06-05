import mongoose from "mongoose";
const ObjectId= mongoose.ObjectId;
const Schema = mongoose.Schema;

const User = new Schema({
    email: {type: String, unique: true, require: true},
    password: {type: String, require: true}
})

const UserInfo = new Schema({
    userId: ObjectId,
    username: {type: String, require: true},
    profileImg: {type:String},  
})

const UserModel= mongoose.model('users',User);
const UserInfoModel = mongoose.model('user-info',UserInfo)


export { UserModel, UserInfoModel};