require('dotenv').config();

const express = require('express');
//Needed for the session variable
const session = require("express-session");

let path = require('path');
let bodyParser = require('body-parser');

let app = express();

app.set('view engine', 'ejs');
 
// process.env.PORT is when you deploy and 3000 is for test
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

/* session middleware
REQUIRED
OPTIONAL (with defaults)
resave - Default: true
    true = save session on every request
    false = only save if modified (receommended)
saveUninitialized - Default: true'
    true = create session for every request
    false = only create when data is stored (recommended)

*/

app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: true,
}));
// middle ware, calling functions to help 
app.use(express.urlencoded({extended: true}));

//GLOBAL authendiation middleware - runs on EVERY request
app.use((req, res, next) => {
    // skip authentication for login routes
    if (req.path === '/' || req.path === '/login' || req.path ==='/logout') { 
        //continue with the request path
        return next();
    }
    //check if user is logged in for all other routes
    if (req.session.isLoggedIn) {
       next(); //user is logged in, continue
    } else {
        res.render("login", {error_message: "Please log in to access this page."});
    }
});

app.get("/", (req, res) => {
    /// check if fuser is logged in
    if (req.session.isLoggedIn) {
        res.render("/index");
    } else {
        res.render("login", {error_message:""});
    }
});


app.post("/login", (req, res) => {
    let sName = req.body.username;
    let sPassword = req.body.password;

    if ((sName == 'LEVI') && (sPassword == 'admin')) {
        //set session variable
        req.session.isLoggedIn = true;
        res.session.username = sName;
        res.redirect("/");
    } else {
        res.render("login", {error_message: "Invalid username or password."});
    }
});

app.get("/logout", (req, res) => {
    //destroy the session
    req.session.destroy(err => {
        if (err) {
            console.log(err);
        } 
            res.redirect("/");
        });
    });

app.get("/t",(req, res) => {
    res.render("test");
});

app.get(/.*/, (req, res) => {  // RegExp form
    res.render("index");
  });

app.listen(port, () => {
    console.log(`The server listening on port: ${port}`,`http://localhost:${port}`)
});