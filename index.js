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
    res.locals.user = req.session.user || null;
    next();
  });
app.use(async (req, res, next) => {
    try {
      const resorts = await knex('resorts').select('resort_id', 'resort_name');
      res.locals.resorts = resorts;   // now `resorts` exists in ALL views
    } catch (err) {
      console.error('Error loading resorts list:', err);
      res.locals.resorts = [];
    }
    next();
});
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
    // If already logged in, go home
    if (req.session.isLoggedIn) {
      return res.redirect('/');
    }
  
    res.render('login', { 
      layout: 'public',
      error: null
    });
  });
  
  // POST /login: Handle login attempt (Levi)
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      // Get full user row so session has everything (birthday, fav_resort, etc.)
      const user = await knex('users')
        .where({ username, password })
        .first();
  
      if (!user) {
        return res.render('login', { 
          layout: 'public', 
          error: 'Invalid login' 
        });
      }
  
      req.session.isLoggedIn = true;
      req.session.user = user;
  
      return res.redirect('/');
    } catch (err) {
      console.error('Login error:', err);
      return res.render('login', { 
        layout: 'public', 
        error: 'Something went wrong. Please try again.' 
      });
    }
  });
  
// GET /register: Show registration form
app.get('/register', (req, res) => {
    res.render('register', { 
      layout: 'public',
      error: null
    });
  });
  
  // POST /register: Handle registration attempt (Levi)
  app.post('/register', async (req, res) => {
    const { 
      username, 
      email, 
      password, 
      first_name, 
      last_name, 
      birthday, 
      fav_resort 
    } = req.body;
  
    try {
      const favResortId = parseInt(fav_resort, 10);
  
      // 1. Validate required fields
      if (
        !username || 
        !email || 
        !password || 
        !first_name || 
        !last_name || 
        !birthday || 
        Number.isNaN(favResortId)
      ) {
        return res.render('register', { 
          layout: 'public', 
          error: 'All fields are required.'
          // resorts come from res.locals.resorts automatically
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
        first_name,
        last_name,
        username,
        email,
        password,          // plaintext is fine for class
        birthday,
        fav_resort: favResortId,
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
// GET /profile: View and edit user profile
app.get('/profile', requireLogin, (req, res) => {
    // Example placeholder – replace later with real query if you want
    const mockUserReports = [
      { report_id: 1, slope_id: 1, slope_name: 'The Grotto', created_time: new Date() }
    ];
  
    res.render('profile', {
      pageTitle: 'Profile',
      reports: mockUserReports,
      layout: 'public'
      // user and resorts come from res.locals.user / res.locals.resorts
    });
  });
  app.post('/profile', requireLogin, async (req, res) => {
    try {
      const userId = req.session.user.user_id;
  
      const { 
        username, 
        email, 
        password,
        first_name, 
        last_name, 
        birthday, 
        fav_resort 
      } = req.body;
  
      const favResortId = parseInt(fav_resort, 10);
  
      const mockUserReports = [
        { report_id: 1, slope_id: 1, slope_name: 'The Grotto', created_time: new Date() }
      ];
  
      // Basic validation
      if (
        !username || 
        !email || 
        !password || 
        !first_name || 
        !last_name || 
        !birthday || 
        Number.isNaN(favResortId)
      ) {
        return res.render('profile', {
          pageTitle: 'Profile',
          layout: 'public',
          reports: mockUserReports,
          error: 'All fields are required.'
        });
      }
  
      // 🔎 Uniqueness check (ignore current user)
      const existingUser = await knex('users')
        .where(function () {
          this.where('username', username).orWhere('email', email);
        })
        .andWhere('user_id', '!=', userId)
        .first();
  
      if (existingUser) {
        return res.render('profile', {
          pageTitle: 'Profile',
          layout: 'public',
          reports: mockUserReports,
          error: 'That username or email is already in use by another account.'
        });
      }
  
      // ✅ Update
      await knex('users')
        .where({ user_id: userId })
        .update({
          username,
          email,
          password,
          first_name,
          last_name,
          birthday,
          fav_resort: favResortId
        });
  
      const updatedUser = await knex('users')
        .where({ user_id: userId })
        .first();
  
      req.session.user = updatedUser;
  
      return res.redirect('/profile');
  
    } catch (err) {
      console.error("Profile update error:", err);
  
      const mockUserReports = [
        { report_id: 1, slope_id: 1, slope_name: 'The Grotto', created_time: new Date() }
      ];
  
      return res.render("profile", {
        pageTitle: 'Profile',
        layout: 'public',
        reports: mockUserReports,
        error: "Error updating profile."
      });
    }
  });
  
  
  

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
  

// Error Handling (404)
app.use((req, res, next) => {
    res.status(404).send("Sorry, can't find that!");
});

// 6. Start Server
app.listen(port, () => {
    console.log(`SlopeSense server listening at port:${port}`);
}); 