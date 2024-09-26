const fs = require("fs");
const mongoose = require ("mongoose");
const dotenv = require("dotenv");
const Tour = require ("./../../model/tourmodel");

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

mongoose
.connect ( DB) .then( ()=> {
  console.log("✅ DB connection successful!");
});

// READ JSON FILE

const tours =  JSON.parse (fs.readFileSync(`${__dirname}/tours-sample.json`, "utf8"));

// IMR=PORT DATA INTO DATABASE

const importData = async () => {
    try {
            await Tour.create(tours);
            console.log ("Data loaded successfully");
    } catch  (err) {
        console.log (err);
    }
};

// DELETE PREVIOUS  UNWANTED DATA FROM COLLECTION/ Database


const deleteData = async () => {
    try {
            await Tour.deleteMany();
            console.log ("Data deleted successfully");
    } catch  (err) {
        console.log (err);
    }
};

// UPLOAD OR DELETE FROM DATABASE USING   node dev-dada/dada/import-dev-dada.js --import or --delete 

if (process.argv[2] === "--import") {
    importData();
} else if (process.argv[2] === "--delete") {
    deleteData();
}


console.log (process.argv);
