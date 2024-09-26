const Review = require("./../model/reviewModel");
const catchAsync = require ("./../utils/catchAsync");
const factory= require("./../controllers/handlerFactory");


exports.getAllReviews = catchAsync ( async(req,res,next) => {
    let filter ={};
    if (req.params.tourId) filter = { tour: req.params.tourId};
      
    const reviews = await Review.find(filter);

    res.status(200).json({
        status:"success",
        result: reviews.length,
        data:{
            reviews
        }
    });

 
});

exports.setTourUsersIds = (req,res,next) => {
    // allows nested routes
    if(!req.body.tour) req.body.tour = req.body.tourId;
    if(!req.body.user) req.body.user = req.user.id;
    next();
};
exports.createReview = factory.createOne(Review);


exports.getReview = factory.getOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);