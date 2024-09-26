const dotenv = require("dotenv");
const path = require("path");
const mongoose = require ("mongoose");

// Synchronous unhandeled rejection
// process.on("uncaughtException", err =>{
//   console.log("UNCAUGHT EXCEPTION! 🍗 Shutting down....")
//   console.log (err.name, err.message); 
//   process.exit(1)

  
// });

dotenv.config({ path: "./config.env" });

const app = require("./app");



const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

//TO CONNECT LOCAL DATABASE

// mongoose.connect(process.env.DATABASE_LOCAL);

// TO CONNECT  INTERNET DATABASE

mongoose
.connect ( DB) .then( ()=> {
  // console.log(con.connections);
  console.log("✅ DB connection successful!");
});


const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`✅ App is running okay at ${port}...`);
});


// USING EVENT LISTNER WE CAN manage (unhandled rejection) asynchronous promise rejection

process.on("unhandeledRejection", err => {

  console.log(err.name, err.message);

  server.close(()=>{
    console.log("Unhandeled Rejection! Shutting down 🌷🌼")
    process.exit (1);
  })

}); // Use technology to restart app as soon as it crashes like docker




