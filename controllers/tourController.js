const path = require ("path");
const Tour = require ("../model/tourmodel");
const APIfeatures = require ("./../utils/apiFeatures");
const catchAsync = require ("./../utils/catchAsync");
const AppError = require ("./../utils/appError");
const factory= require("./../controllers/handlerFactory");

exports.aliasTopTours = (req, res,next) => {
        req.query.limit='5';
        req.query.sort = '-ratingsAvarage,price';
        req.query.fields = 'name,price,ratingsAvarage,summary,difficulty';
        next();
}

exports.getAllTours = catchAsync ( async (req, res,next) => {
    
        const features = new APIfeatures (Tour.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

        const tours = await features.query;

        res.status(200).json({
            status: 'success',
            data: {
                tours,
            },
        });
    
});

exports.getTourStats = catchAsync ( async (req,res,next) => {

        const stats =  await Tour.aggregate([
            { 
                $match:{ratingsAvarage: { $gte:4.5}}
            },

            {
                $group:{
                    _id:null,
                    numTours:{ $sum: 1},
                    numRatings: { $sum: "$ratingsQuantity" },
                    avgRating: { $avg: "$ratingsAvarage" },
                    avgPrice:  { $avg: "$price"},
                    minPrice:  { $min: "$price"},
                    maxPrice:  { $max: "$price"}
                }
            },
            {
                $sort: { avgPrice: 1 }
            },

            {
                $match: { _id: { $ne:"Easy"}},

            }

        ]);

        res.status(201).json({
            status: "success",
            data: {
                stats
            }
        });

});


exports.getMonthlyPlan = catchAsync ( async (req, res )  => {

    
    const year = req.params.year*1;
    const plan = await Tour.aggregate([
        {
            $unwind: "$startDates"  //  unwind , takes an array and dstructure it and then get every single eliment of the array
        },

        {
            $match:{  // match is basically to select document in db  basicaly for query
                startDates:{
                    $gte: new Date (`${year}-01-01`),
                    $lte: new Date (`${year}-12-31`),
                }
            }
        },

        {
            $group: {
                _id: { $month: "$startDates"},
                numTourStarts: { $sum: 1},
                tours: {$push: "$name"}
                }
        },

        {
            $addFields: { month: "$_id"}
        },

        {
            $project: {_id:0}
        },

        {
            $sort:{ numTourStarts:-1}
        },

        {
            $limit:12
        }

    ]);

    res.status(200).json({
        status: 'success',
        data: {
            plan,
        },
    });

});



// Do not update password in this way

exports.createTour = factory.createOne(Tour);
exports.getTour = factory.getOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);



// const tours = JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/tours-sample.json`)
// );

// exports.checkID = (req, res, next, val) => {
//     const id = req.params.id * 1;
//     const tour = tours.find((el) => el.id === id);
//     if (!tour) {
//         return res.status(404).json({
//             status: "Fail",
//             message: "Invalid ID",
//         });
//     }
//     next();
// };

// exports.checkBody = (req, res, next) => {
//     if (!req.body.name || !req.body.price) {
//         return res.status(400).json({
//             status: "Fail",
//             message: "Missing name of price",
//         });
//     }

//     next();
// };

// exports.createTour = (req, res) => {
//     const newId = tours[tours.length - 1].id + 1;
//     newTour = Object.assign({ id: newId }, req.body);

//     tours.push(newTour);

//     fs.writeFile(
//         `${__dirname}/dev-data/data/tours-sample.json`,
//         JSON.stringify(tours),
//         (err) => {
//             res.status(201).json({
//                 status: "success",
//                 data: {
//                     tour: newTour,
//                 },
//             });
//         }
//     );
// };
