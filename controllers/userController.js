const path = require ("path");
const User = require ("../model/userModel");
const AppError = require ("./../utils/appError");
const catchAsync = require ("./../utils/catchAsync");
const factory= require("./../controllers/handlerFactory");

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};

    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj [el] = obj[el];
    })
    return newObj;
};

exports.getAllUsers = catchAsync (async (req,res, next) => {
const users = await User.find();

    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users,
        },
    });
});

exports.getMe = (req,res,next) => {
    req.params.id = req.user.id;
    next();
};



exports.updateMe = catchAsync ( async (req,res,next) => {
    // create error if user POSTs passwaord data
    if ( req.body.password || req.body.passwordConfirm) {
        return next ( new AppError(" This route is not for password update. Please user / updateMypassword",400));
    }


    // filtered un wanted filed that user should not update
    const filteredBody = filterObj(req.body, "name", "email"); // we can add or allow more fields like profile photo, description etc as we wish

    // Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody , { new: true, runValidators:true});

    await user.save();


    res.status(200).json({
        status:"success",
        data:{
            user: updatedUser
        }
    });

});


exports.deleteMe = catchAsync( async( req,res,next) => {

    await User.findByIdAndUpdate(req.user.id, {active:false});

    res.status(204).json({
        status: "success",
        data: null,
    })
});




exports.createUser = (req,res) => {

    const newId = users[users.length - 1].id + 1;
    newUser = Object.assign({ id: newId }, req.body);

    users.push(newUser);

    fs.writeFile(
        `${__dirname}/dev-data/data/users-sample.json`,
        JSON.stringify(users),
        (err) => {
            res.status(201).json({
                status: "success",
                data: {
                    user: newUser,
                },
            });
        }
    );

};



// exports.updateUser = (req,res) => {
    //     res.status(200).json({
        //         status: "success",
        //         data: {
            //             users,
            //         },
            //     });
            // };
            
            
            
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);