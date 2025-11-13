// index.js (Backend Developer - Lincoln)

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

const knex = require("knex")({
    client: "pg",
    connection: {
        host: process.env.RDS_HOSTNAME || "localhost",
        user: process.env.RDS_USERNAME || "postgres",
        password: process.env.RDS_PASSWORD || "42JS0cKEGfa5SNKOVH4c4MVaksfhBlN0rOA",
        database: process.env.RDS_DB_NAME || "slopesense_db",
        port: process.env.RDS_PORT || 5432,
        // The new part 
        ssl: process.env.DB_SSL ? {rejectUnauthorized: false} : false 
    }
});

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
app.use((req, res, next) => {
    // This is a placeholder for actual session/auth data
    res.locals.user = req.session.user || null;
    next();
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
// GET /: Landing page
app.get('/', (req, res) => {
    // If user is logged in, redirect to dashboard
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    // Renders the public landing page
    res.render('landing', { layout: 'public' });
});

// GET /login: Show login form
app.get('/login', (req, res) => {
    res.render('login', { layout: 'public' });
});

// POST /login: Handle login attempt (Levi)
app.post('/login', async (req, res) => {
    // **Authentication logic goes here**
    // 1. Query DB for user by email
    // 2. Compare password hash
    // 3. If successful: req.session.user = { user_id: 1, username: 'testuser', role: 'User' };
    
    // Placeholder success:
    req.session.user = { user_id: 1, username: 'Lincoln', role: 'User' };
    res.redirect('/dashboard');

    // Placeholder failure:
    // res.render('login', { error: 'Invalid email or password' });
});

// GET /register: Show registration form
app.get('/register', (req, res) => {
    res.render('register', { layout: 'public' });
});

// POST /register: Handle registration attempt (Levi)
app.post('/register', async (req, res) => {
    // **Registration logic goes here**
    // 1. Hash password
    // 2. Insert new user into DB
    // 3. If successful: Redirect to login
    res.redirect('/login');
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

// GET /slopes: Display all slopes (Lincoln/Rylee)
app.get('/slopes', requireLogin, async (req, res) => {
    // **DB query to fetch all slopes goes here**
    const mockSlopes = [
        { slope_id: 1, run_name: 'The Grotto', location: 'Resort X', difficulty: 'Advanced', condition: 'Fresh Powder', created_by: 1 },
        { slope_id: 2, run_name: 'Bunny Hill', location: 'Resort X', difficulty: 'Beginner', condition: 'Groomed', created_by: 2 }
    ];
    res.render('slopes', { pageTitle: 'Slopes', slopes: mockSlopes });
});

// POST /slopes: Create new slope (CRUD - Lincoln)
app.post('/slopes', requireLogin, async (req, res) => {
    // **DB insert logic goes here**
    res.redirect('/slopes');
});

// GET /reports: Display all reports (Lincoln/Rylee)
app.get('/reports', requireLogin, async (req, res) => {
    // **DB query to fetch all reports goes here**
    const mockReports = [
        { report_id: 1, slope_id: 1, slope_name: 'The Grotto', user_id: 1, username: 'RyleeDev', ice: false, obstacle: true, powder: true, closed: false, description: 'Deep drifts after the storm. Watch out for a rock near the upper lift.', created_time: new Date() }
    ];
    res.render('reports', { pageTitle: 'Reports', reports: mockReports });
});

// POST /reports: Create new report (CRUD - Lincoln)
app.post('/reports', requireLogin, async (req, res) => {
    // **DB insert logic goes here**
    res.redirect('/reports');
});

// GET /profile: Display user profile (Lincoln/Rylee)
app.get('/profile', requireLogin, async (req, res) => {
    // **DB queries for user's reports and slopes go here**
    const mockUserSlopes = [{ slope_id: 1, run_name: 'The Grotto', location: 'Resort X' }];
    const mockUserReports = [{ report_id: 1, slope_id: 1, slope_name: 'The Grotto', created_time: new Date() }];

    res.render('profile', { 
        pageTitle: 'Profile', 
        userSlopes: mockUserSlopes, 
        userReports: mockUserReports 
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