const mongoose = require ("mongoose");
const slugify = require ("slugify");
const User = require ("./userModel");

const tourSchema = new mongoose.Schema (  
    
    {
    name:{
        type: String,
        required: [ true, "A tour must have a name"],
        unique: true,
        trim: true, /* removes space from the beggining and end*/
    },

    slug: String ,

    duration :{
        type: Number,
        required:[ true, "A tour must have a duration"]
    },

    maxGroupSize: {
        type: Number,
        required:[ true, "A tour must have a group size"]

    },

    difficulty:{
        type: String,
        required: [ true, "A tour must have difficulty"]

    },
    
    rating: {
        type: Number,
        default: 4.5
        
    },
    ratingsAvarage: {
        type: Number,
        default: 4.5
        
    },

    ratingsQuantity: {
        type: Number,
        default: 0
        
    },
    
    price :{
        type: Number,
        required:[ true, "A tour must have a price"]
    },

    priceDiscount: Number,

    summary:{
        type:String,
        trim: true, /* removes space from the beggining and end*/
        required: [ true," A tour must have a summary"]

    },

    description: {
        type:String,
        trim:true,

    },

    imageCover:{
        type: String,
        required: [ true," A tour must have a image cover"]
    },

    images: [ String ],

    createdAt:{
        type: Date,
        default: Date.now(),
        select:false
    },
    updatedAt:{
        type: Date,
        default: Date.now()
    },

    startDates: [ Date ],

    secretTour:{
        type: Boolean,
        default: false
    
    },

    startLocation:{ // GeoJSON
        type: { type: String,
        default:"Point",
        enum: ["Point"]
        },
        coordinates: [Number],
        address: String,
        description: String,

    },

    location:[  // embaded documents
        {
        type:{
            type: String,
            default: "Point",
            enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
     }

    ],

    guides: [  // embaded documents 

        {
            type: mongoose.Schema.ObjectId,
            ref: "User",

        },

    ],






} , 

{
  toJSON: {virtuals:true},
  toObject: { virtuals:true}
},

);




tourSchema.virtual("durationWeeks").get(function(){
    return this.duration/7;
});


// this is virtual populate
tourSchema.virtual("reviews", {
    
    ref:"Review",
    foreignField: "tour",
    localField: "_id"

});

// DOCUMENT MIDDLEWARE
tourSchema.pre("save", function(next){
    this.slug = slugify(this.name,{ lower:true});
    next();
});


tourSchema.pre("save", async function(next) {
    const guidesPromises =  this.guides.map( async id => await User.findById(id));
    this.guides = await Promise.all(guidesPromises);

   next();
});






// tourSchema.post("save", function(doc, next){
//     next();
// });

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function(next){
    this.find({secretTour: { $ne:true}});
    next();
});


tourSchema.pre(/^find/, function(next){

    this.populate({ 
        path:"guides",
        select:"-__v -passwordChangedAt" 
    });
    
    next();
     
});

// AGGREFATION MIDDLEWARE

tourSchema.pre("aggregate", function (next){
    this.pipeline().unshift({$match:{secretTour: {$ne:true}}});
    console.log(this.pipeline());
    next();
})


const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;