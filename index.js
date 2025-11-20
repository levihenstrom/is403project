// index.js (Backend Developer - Lincoln) test

// 1. Module Imports
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const methodOverride = require('method-override');
// const { Pool } = require('pg'); // For Database Engineer - Alex

// 2. Initial Setup
const app = express();
const port = process.env.PORT || 3414;

// 3. Database Connection (Placeholder - Alex/Lincoln)
/* const pool = new Pool({
    user: 'your_user',
    host: 'localhost',
    database: 'slopesense_db',
    password: 'your_password',
    port: 5432,
});
*/

// in index.js
const knexConfig = require("./knexfile");
const environment = process.env.NODE_ENV || "development";
const knex = require("knex")(knexConfig[environment]);

// 4. Middleware Configuration
app.use(express.urlencoded({ extended: true })); // Handle form submissions
app.use(express.json()); // Handle JSON data
app.use(express.static('public')); // Serve static files (CSS, images)
app.use(methodOverride('_method')); // Allow PUT/DELETE in forms

// Session/Authentication Setup (Authentication Specialist - Levi)
app.use(session({
    secret: 'a_very_secret_key_for_slopesense', // CHANGE THIS IN PRODUCTION
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// EJS View Engine Setup
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(expressLayouts);
app.set('layout', 'public'); // Sets 'public.ejs' as the default layout

// Middleware to expose user to all EJS views
// Middleware to expose user to all EJS views + gate routes
app.use((req, res, next) => {
    // Make user available in all views
    res.locals.user = req.session.user || null;

    // Skip auth for public routes
    if (req.path === '/'|| req.path === '/login' || req.path === '/register' || req.path === '/logout') {
        return next();
    }

    // If logged in, continue
    if (req.session.isLoggedIn) {
        return next();
    }

    // Not logged in → show login (ONE response, then stop)
    return res.render("login", { layout: 'public', error_message: "Please log in to access this page" });
});


// Simple Auth Check Middleware
const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        // Redirect unauthenticated users
        return res.redirect('/login');
    }
    next();
};

// 5. Routes

// Public Routes (Handles landing, login, register)
// GET /: Landing page / dashboard
app.get('/', (req, res) => {
    if (req.session.user) {
        // Logged in → dashboard
        return res.render('dashboard', { layout: 'public' });
    }
    // Not logged in → landing page
    return res.render('landing', { layout: 'public' });
});


// GET /login: Show login form
app.get('/login', (req, res) => {
    res.render('login', { layout: 'public' });
});

// POST /login: Handle login attempt (Levi)
app.post('/login', async (req, res) => {
    // **Authentication logic goes here**
    let sName = req.body.username;
    let sPassword = req.body.password;

    knex.select(
        'user_id',
        'username',
        'password',
        'email',
        'first_name',
        'last_name',
        'birthday',
        'fav_resort',
        'date_created'
      )
    .from('users')
    .where("username", sName)
    .andWhere("password", sPassword)
    .then(users => {
      // Check if a user was found with matching username AND password
      if (users.length > 0) {
        req.session.isLoggedIn = true;
        req.session.user = {
            user_id: users[0].user_id,
            username: users[0].username,
            email: users[0].email,
            first_name: users[0].first_name,
            last_name: users[0].last_name,
            birthday: users[0].birthday,
            fav_resort: users[0].fav_resort,
            date_created: users[0].date_created
          };

        res.redirect("/");
      } else {
        // No matching user found
        res.render("login", { error: "Invalid login" });
      }
    })
    .catch(err => {
      console.error("Login error:", err);
      res.render("login", { error: "Invalid login" });
    });
    // 1. Query DB for user by email
    // 2. Compare password hash
    // 3. If successful: req.session.user = { user_id: 1, username: 'testuser', role: 'User' };
    // // Fav_resort will be id and needs the name queried out.
    // res.redirect('/dashboard');
    // Placeholder failure:
    // res.render('login', { error: 'Invalid email or password' });
});

// GET /register: Show registration form
app.get('/register', (req, res) => {
    res.render('register', {
        layout: 'public',
        resorts: [ { resort_name : "Snowbird"}, {resort_name : "Brighton"}, {resort_name : "Sundance"}, {resort_name : "Alta"}]
   
    });
});

// POST /register: Handle registration attempt (Levi)
app.post('/register', async (req, res) => {
    const { username, email, password, role, first_name, last_name } = req.body;
  
    try {
      // 1. Validate required fields
      if (!username || !email || !password || !first_name || !last_name) {
        return res.render('register', { 
          layout: 'public', 
          error: 'All fields are required.' 
        });
      }
  
      // 2. Check if username or email already exists
      const existingUser = await knex('users')
        .where('username', username)
        .orWhere('email', email)
        .first();
  
      if (existingUser) {
        return res.render('register', { 
          layout: 'public', 
          error: 'That username or email is already taken.' 
        });
      }
  
      // 3. Insert the user
      await knex('users').insert({
        username: username,
        email: email,
        password: password,   // (for class — plaintext is fine)
        first_name: first_name,
        last_name: last_name,
        date_created: knex.fn.now()
      });
  
      // 4. Redirect to login
      return res.redirect('/login');
  
    } catch (err) {
      console.error('Registration error:', err);
      return res.render('register', {
        layout: 'public',
        error: 'Something went wrong. Please try again.'
      });
    }
  });

// GET /logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/dashboard'); // Fallback
        }
        res.clearCookie('connect.sid'); // Clear session cookie
        res.redirect('/');
    });
});


// Private/Authenticated Routes (Require requireLogin middleware)

// GET /dashboard: Private home page
app.get('/dashboard', requireLogin, (req, res) => {
    // The view will render based on res.locals.user
    res.render('dashboard', { pageTitle: 'Dashboard' });
});

// GET /slopes: Display all slopes
app.get('/slopes', requireLogin, async (req, res) => {
    // **DB query to fetch all slopes goes here**
    const mockSlopesAR = [
        { run_id: 1, run_name: 'The Grotto', area: 'Mineral Basin', resort: 'Snowbird', difficulty: 'Advanced', is_open: true, is_terrain_park: true, back_country_access: true, bootpack_req: true, base_area: "base_area1", zone_name: "zone name 1", city: "Salt Lake City", state: "Utah", website: "snowbird.com", total_acres: 543, canyon_name: "Little_Cottonwood", ski_patrol_phone: "801-556-5543", has_night_skiing: true },
        { run_id: 2, run_name: 'Bunny Hill', area: 'Gad Valley', resort: 'Snowbird', difficulty: 'Beginner', is_open: true, is_terrain_park: true, back_country_access: true, bootpack_req: true, base_area: "base_area1", zone_name: "zone name 1", city: "Salt Lake City", state: "Utah", website: "snowbird.com", total_acres: 543, canyon_name: "Little_Cottonwood", ski_patrol_phone: "801-556-5543", has_night_skiing: true }
    ];
    res.render('slopes', { pageTitle: 'Slopes', slopes: mockSlopesAR });
});

app.post('/editReport/<%= slope.slope_id %>', requireLogin, async (req, res) => {
    // **DB insert logic goes here**
    res.redirect('/profile');
});

app.post('/deleteReport/<%= slope.slope_id %>', requireLogin, async (req, res) => {
    // **DB insert logic goes here**
    res.redirect('/profile');
});

// GET /reports: Display all reports
app.get('/reports', requireLogin, async (req, res) => {
    // **DB query to fetch all reports goes here**
    const mockReports = [{
        report_id: 1,
        slope_id: 1,
        slope_name: 'The Grotto',
        user_id: 1,
        username: 'testPerson',
        area_name: 'area',
        resort_name: 'resort',
        obstacle: true,
        description: 'Deep drifts after the storm. Watch out for a rock near the upper lift.',
        groomed: false,
        icy: true,
        powder: false,
        moguls: false,
        granular: true,
        thin_cover: true,
        packed: false,
        wet: false,
        created_time: new Date()
    }]; // Need to query for slope name and username
    res.render('reports', {
        pageTitle: 'Reports',
        reports: mockReports,
        resorts: [{resort_name: "Snowbird"}, {resort_name: "Sundance"}],
        areas: [{area_name: "Area1", resort_name: "Snowbird"},{area_name: "Area2", resort_name: "Snowbird"},{area_name: "Areaz", resort_name: "Sundance"}],
        runs: [{run_name: "Chickadee", area_name: "Area1", resort_name: "Snowbird"}, {run_name: "Baby Thunder", area_name: "Areaz", resort_name: "Sundance"}]
    });
});

// POST /reports: Create new report (CRUD - Lincoln)
app.post('/reports/<%= user_id %>', requireLogin, async (req, res) => {
    // **DB insert logic goes here**
    res.redirect('/reports');
});

// POST /reports: Update profile
app.post('/profile', requireLogin, async (req, res) => {
    // **DB insert logic goes here**
    res.redirect('/profile');
});

// GET /profile: Display user profile (Lincoln/Rylee)
app.get('/profile', requireLogin, async (req, res) => {
    // **DB queries for user's reports and slopes go here**
    const mockUserReports = [{ report_id: 1, slope_id: 1, slope_name: 'The Grotto', created_time: new Date() }];

    res.render('profile', { 
        pageTitle: 'Profile', 
        reports: mockUserReports,
        resorts: [ { resort_name : "Snowbird"}, {resort_name : "Brighton"}, {resort_name : "Sundance"}, {resort_name : "Alta"}]
    });
});

// Error Handling (404)
app.use((req, res, next) => {
    res.status(404).send("Sorry, can't find that!");
});

// 6. Start Server
app.listen(port, () => {
    console.log(`SlopeSense server listening at port:${port}`);
});