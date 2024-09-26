const crypto = require ("crypto");
const mongoose = require("mongoose");
const validator = require ("validator");
const bcrypt = require("bcrypt");
const { stringify } = require("querystring");

// name email photo password password confirm

const userSchema = new mongoose.Schema ( {

    name: { 
        type:String,
        required:[true, "please provide your name"],

    },

    email:{
        type: String,
        required: [ true, "please provide your email"],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, " Please provide valid email"]
    },

    photo:{
        type: String,
    },
    role: {
        type: String,
        enum:["user","guide", "lead-guide", "admin"],
        default:"user"
    }

,    
    password: {
        type: String,
        required: [true, "please provide password"],
        minlegth: 8,
        select:false
    },

    passwordConfirm: {
        type: String,
        required: [true, "please provide confirm password"],
        validate: {
            // This only works on CREATE & SAVE!!! not on update password
            validator:function (el){
                return el === this.password;
            }
        }
    },

    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },

});

userSchema.pre("save", async function(next){
    // only run this function if password was modified
    if(!this.isModified("password")) return next();

    // hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    // delete passwordConfirmed field
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre ("save", function(next){
    if (!this.isModified("password") || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000; // database can load slower always make sure token creates later password works before that time.
    next();

});

userSchema.pre(/^find/, function(next){
// this points to the current query
    this.find({active: {$ne:false}});
    next();

});



//instance methods use kortesi
userSchema.methods.correctPassword =  async function (candidatePassword, userPassword) {
    return await  bcrypt.compare(candidatePassword, userPassword);
};


userSchema.methods.changedPasswordAfter = function ( JWTTimestamp){
    if (this.passwordChangedAt) {

        const changedTimeStamp = this.passwordChangedAt.getTime()/1000;

        console.log(this.changedTimeStamp, JWTTimestamp)

        return JWTTimestamp<changedTimeStamp;

    }
    
    return false;
};



userSchema.methods.createPasswordResetToken = function (){

    const resetToken = crypto.randomBytes(32).toString("hex");

    this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

        console.log ({resetToken}, this.passwordResetToken);

    this.passwordResetExpires = Date.now()*10*60*1000;

    return  resetToken;
};





const User = mongoose.model('User', userSchema);

module.exports = User;