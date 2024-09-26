const crypto = require ("crypto");
const {promisify} = require  ("util");
const jwt = require("jsonwebtoken");
const User = require('./../model/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require ("./../utils/appError");
const sendEmail = require ("./../utils/email");



const signToken = id => {
 return jwt.sign({id}, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN});

}


const createSendToken = (user, statusCode, res) => {
  const token = signToken (user._id);
  const cookieOptions =  {
    expires: new Date(Date.now()+ process.env.JWT_COOKIE_EXPIRES_IN *24*60*60*1000),
    secure:true,
    httpOnly: true,
  };

  if(process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token,cookieOptions)

  // Remove the password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data:{ user}
  })
};


exports.signup = catchAsync(async (req, res, next) => {
  
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  createSendToken(newUser, 201,res);
});




exports.login = catchAsync (async (req,res,next) =>{
  const {email, password} = req.body;

  // if ewmail password actually exist
  if (!email || !password) {
   return next (new AppError("Please provide email and password!", 400));
  }

  // check if the user exist and password is correct
  const user = await User.findOne({ email }).select("+password");
  console.log(user);
  
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next ( new AppError("Incorrect email or password", 401));
  }

  
  // if everything is okay send token to client
  createSendToken(user, 200,res);

  next();

}); 


 exports.logout = (req,res) => {
  const token = signToken (req.body.user);
  res.clearCookie(token);
  res.send("Logged out.");
};






exports.protect = catchAsync (async (req, res, next) =>{
// 1) getting token and check of its there
let token;
if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
  token = req.headers.authorization.split(" ") [1];
}

console.log(token);

if(!token) {
  return next ( new AppError("Your are not logged in! please log in to get access.", 401))
}

// 2) verification token

const decoded = await  promisify (jwt.verify)(token, process.env.JWT_SECRET);
console.log(decoded);


//3) check if user still exist 
const currentUser = await User.findById(decoded.id);
if (!currentUser) {
  return next ( new AppError("The user belonging to this token no longer exist"), 401);
}
// 4) check if user changed password after the token was issued  . iat = issued at
if (currentUser.changedPasswordAfter(decoded.iat)) {
  return next (
    new AppError("User recently changed password! Please login again.", 401)
  );
}
// Grant access to protected route
req.user = currentUser;
next();
});




exports.restrictTo =  ( ...roles ) => {
  return (req, res, next) => {
    // role [ "admin", "lead- guide"]. role = "user"

    if (!roles.includes(req.user.role)) {
      return next ( new AppError ("You do not have the authorization to perform the task"));
    }
    next ();
  };
};



exports.forgotPassword = catchAsync (async (req,res,next) => {

  // get user based on POSTed email
  const user = await User.FindOne ({ email:req.body.email});

  if (!user) {
    return   next ( new AppError ("There is not user with this email address.", 400));
  }

  // Generate the random reaset token
const resetToken = user.createPasswordResetToken;
await user.save({validateBeforeSave: false});

  // send it to user's email

const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;

const message = `Forgot your password? Submit PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email! ;`


try{await sendEmail({
  email: user.email,
  subject: "Your Password reset token(Only valid for 10 mint)",
  message:message,
  
  });
  
  res.status(200).json({
    status: "success",
    message:"Token sent to email"
  });

} catch (err){

user.PasswordResetToken = undefined,
user.passwordResetExpires= undefined,
await user.save({validateBeforeSave: false});

return next( new AppError("There was an error sending the email. Try again later"), 500); 

}

});




exports.resetPassword = catchAsync ( async(req,res,next) => {

  //get user based on the token

  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
  
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires:{$gt: Date.now()}
  });
  
  //if token has not expired, and there is user, set the new password

  if (!user) {
    return next ( new AppError("Token is invalid or has expired.",400))
  }

  // update changedPasswordAt property for the user 

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  //log the user in, send jwt
  createSendToken(user, 200,res);
});



exports.updatePassword = catchAsync(async(req,res,next) => {

  // Get user from collection
  const user = await User.findById (req.user.id).select("+password");


  // check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordConfirm, user.password))) {
    return next (new AppError("Your current password is wrong.", 401));
  }

  // if so update password

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save(); // user findby id will not work here

  

  // log user im semd
  createSendToken(user, 200,res);

});