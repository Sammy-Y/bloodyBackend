import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = mongoose.Schema({
  userName: {
    // 用戶名稱
    type: String,
    require: true,
    minLength: 2,
    maxLength: 10,
  },
  googleId: {
    type: String,
  },
  userId: {
    // 用戶代號(帳號)
    type: String,
    require: true,
    minLength: 6,
    maxLength: 50,
  },
  userPw: {
    // 用戶密碼(bcrypt)
    type: String,
    require: true,
    maxLength: 200,
  },
  confirmed: {
    // 信箱驗證
    type: Boolean,
    default: false,
  },
  lineToken: {
    // line notify token
    type: String,
    default: "",
  },
  date: {
    // 註冊日期
    type: Date,
    default: Date.now(),
  },
}, 
// 取消 __v 欄位
{ 
  versionKey: false 
});

// mongoose schema middleware
userSchema.pre("save", async function (next) {
  // user is new or password is been changed
  if (this.isModified("userPw") || this.isNew) {
    // encrypt the password by bcrypt function
    const hash = await bcrypt.hash(this.userPw, 10);
    this.userPw = hash;
    return next();
  } else return next();
});

// when login compare entered password and user's password
userSchema.methods.comparePassword = function (Enterpassword, cb) {
  bcrypt.compare(Enterpassword, this.userPw, (err, result) => {
    if (err) return cb(err, result);
    else return cb(null, result);
  });
};

export default mongoose.model("User", userSchema);
