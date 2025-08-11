const express = require('express');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const ExcelJS = require('exceljs');
const nodemailer = require('nodemailer');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

console.log('Starting server...');

// ---------- Middleware ----------
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// ---------- Session ----------
app.use(session({
  secret: 'zeek-clothing-store-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // true in production behind HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  },
  name: 'zeek-session'
}));

// ---------- CSRF (header-based) ----------
const csrfProtection = (req, res, next) => {
  try {
    if (!req.session.csrfToken) {
      req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    res.locals.csrfToken = req.session.csrfToken;

    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      const token = req.body._csrf || req.headers['x-csrf-token'];
      if (!token || token !== req.session.csrfToken) {
        console.log('CSRF validation failed: provided=' + token + ', expected=' + req.session.csrfToken);
        return res.status(403).json({ message: 'Invalid CSRF token' });
      }
      // rotate after successful state-changing request
      req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    next();
  } catch (error) {
    console.log('CSRF middleware error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ---------- Rate limiter ----------
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// ---------- Mailer ----------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com', // Replace
    pass: 'your-app-password'     // Replace
  }
});

// ---------- Helpers ----------
const serveHtml = (fileName) => (req, res) => {
  const filePath = path.join(__dirname, 'public', fileName);
  if (fs.existsSync(filePath)) return res.sendFile(filePath);
  console.log('File not found: ' + filePath);
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
};

// Auth guards
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@zeek.com';

function requireAuth(req, res, next) {
  if (req.session?.user) return next();
  if (req.accepts('html')) return res.redirect('/login');
  return res.status(401).json({ message: 'Not authenticated' });
}

function requireAdmin(req, res, next) {
  const email = req.session?.user?.email;
  if (email && email === ADMIN_EMAIL) return next();
  if (req.accepts('html')) {
    const forbiddenPath = path.join(__dirname, 'public', 'forbidden.html');
    if (fs.existsSync(forbiddenPath)) return res.status(403).sendFile(forbiddenPath);
  }
  return res.status(403).json({ message: 'Forbidden' });
}

// ---------- Static pages ----------
app.get('/',         serveHtml('index.html'));
app.get('/login',    serveHtml('login.html'));
app.get('/contact',  serveHtml('contact.html'));
app.get('/shop',     serveHtml('shop.html'));
app.get('/about',    serveHtml('about.html'));
app.get('/cart',     serveHtml('cart.html'));
app.get('/delivery', serveHtml('delivery.html'));
app.get('/returns',  serveHtml('returns.html'));
app.get('/terms',    serveHtml('terms.html'));
app.get('/privacy',  serveHtml('privacy.html'));
app.get('/payment',  serveHtml('payment.html'));
app.get('/fabric',   serveHtml('fabric.html'));
app.get('/careers',  serveHtml('careers.html'));

// ---------- Health ----------
app.get('/api/ping', (req, res) => res.status(200).json({ ok: true, message: 'pong' }));

// ---------- Current user ----------
app.get('/api/me', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ authenticated: true, user: req.session.user });
  }
  res.status(401).json({ authenticated: false });
});

// ---------- CSRF token ----------
app.get('/api/csrf-token', (req, res) => {
  try {
    if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    res.json({ csrfToken: req.session.csrfToken });
  } catch (error) {
    console.log('Error generating CSRF token:', error.message);
    res.status(500).json({ message: 'Failed to generate CSRF token' });
  }
});

// ---------- Auth: login ----------
app.post('/api/login', csrfProtection, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 5 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  // Built-in admin (dev)
  if (email === 'admin@zeek.com' && password === 'admin') {
    req.session.user = { email };
    return res.json({ message: 'Login successful' });
  }

  // Excel user store
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile('users.xlsx').catch(() => {});
    const worksheet = workbook.getWorksheet(1) || workbook.addWorksheet('Users');

    let userFound = false;
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && row.getCell(1).value === email && row.getCell(2).value === password) {
        userFound = true;
      }
    });

    if (userFound) {
      req.session.user = { email };
      res.json({ message: 'Login successful' });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.log('Login error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- Auth: signup ----------
app.post('/api/signup', csrfProtection, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 5 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile('users.xlsx').catch(() => {});
    const worksheet = workbook.getWorksheet(1) || workbook.addWorksheet('Users');

    worksheet.columns = [
      { header: 'Email', key: 'email' },
      { header: 'Password', key: 'password' }
    ];

    let userExists = false;
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && row.getCell(1).value === email) {
        userExists = true;
      }
    });

    if (userExists) return res.status(400).json({ message: 'User already exists' });

    worksheet.addRow({ email, password });
    await workbook.xlsx.writeFile('users.xlsx');

    req.session.user = { email };
    res.json({ message: 'Signup successful' });
  } catch (error) {
    console.log('Signup error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- Contact ----------
app.post('/api/contact', csrfProtection, [
  body('name').notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('message').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, message } = req.body;
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: 'muhammadtalhashakir@gmail.com',
    subject: 'Contact Form: ' + name,
    text: 'From: ' + email + '\n\n' + message
  };
  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    console.log('Contact form error:', error.message);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// ---------- Newsletter ----------
app.post('/api/newsletter', csrfProtection, [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email } = req.body;
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile('newsletter.xlsx').catch(() => {});
    const worksheet = workbook.getWorksheet(1) || workbook.addWorksheet('Subscribers');

    worksheet.columns = [{ header: 'Email', key: 'email' }];

    let emailExists = false;
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && row.getCell(1).value === email) emailExists = true;
    });

    if (emailExists) return res.status(400).json({ message: 'Email already subscribed' });

    worksheet.addRow({ email });
    await workbook.xlsx.writeFile('newsletter.xlsx');

    const mailOptions = {
      from: 'your-email@gmail.com',
      to: email,
      subject: 'Welcome to Zeek Clothing Store Newsletter',
      text: 'Thank you for subscribing to our newsletter!'
    };
    await transporter.sendMail(mailOptions);

    res.json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.log('Newsletter error:', error.message);
    res.status(500).json({ message: 'Failed to subscribe' });
  }
});

// ---------- Products (sample) ----------
app.get('/api/products', (req, res) => {
  const { category, subcategory } = req.query;
  const products = [
    { id: 1, name: 'Men\'s Kurta',   price: 50, category: 'Men',   subcategory: 'Tops',       image: 'https://via.placeholder.com/150?text=Men+Kurta' },
    { id: 2, name: 'Women\'s Scarf', price: 20, category: 'Women', subcategory: 'Accessories', image: 'https://via.placeholder.com/150?text=Women+Scarf' },
    { id: 3, name: 'Men\'s Shalwar', price: 30, category: 'Men',   subcategory: 'Bottoms',    image: 'https://via.placeholder.com/150?text=Men+Shalwar' },
    { id: 4, name: 'Women\'s Kurti', price: 45, category: 'Women', subcategory: 'Tops',       image: 'https://via.placeholder.com/150?text=Women+Kurti' },
    { id: 5, name: 'New Arrival Kurta', price: 60, category: 'New Arrivals', subcategory: '', image: 'https://via.placeholder.com/150?text=New+Kurta' }
  ];
  let result = products;
  if (category)   result = result.filter(p => p.category === category);
  if (subcategory) result = result.filter(p => p.subcategory === subcategory);
  res.json(result);
});

// ---------- Secure Dashboard (outside /public) ----------
const DASHBOARD_DIR = path.join(__dirname, 'dashboard');
console.log('[DASHBOARD] dir:', DASHBOARD_DIR);

function serveDashboard(file) {
  return (req, res) => res.sendFile(path.join(DASHBOARD_DIR, file));
}

// Overview (dashboard.html located at C:\Users\User\Zeek-Clothing-Store\dashboard\dashboard.html)
app.get('/dashboard', requireAuth, serveDashboard('dashboard.html'));

// Serve any dashboard HTML file securely: /dashboard/<name>.html
app.get('/dashboard/:file', requireAuth, (req, res) => {
  const raw = req.params.file || '';
  // Only allow simple filenames ending with .html to prevent traversal
  if (!/^[A-Za-z0-9._-]+\.html$/.test(raw)) {
    return res.status(400).send('Bad request');
  }
  const full = path.join(DASHBOARD_DIR, raw);
  // Ensure the resolved path is still inside the dashboard directory
  if (!full.startsWith(DASHBOARD_DIR)) return res.status(400).send('Bad request');
  if (!fs.existsSync(full)) return res.status(404).send('Not found');
  return res.sendFile(full);
});

// Legacy admin path (admin only) -> redirect to /dashboard
app.get('/seller-tallat&zarina', requireAdmin, (req, res) => {
  return res.redirect('/dashboard');
});

// ---------- Logout ----------
app.post('/api/logout', csrfProtection, (req, res) => {
  if (!req.session) {
    res.clearCookie('zeek-session');
    return res.json({ message: 'Logged out' });
  }
  req.session.destroy(err => {
    if (err) {
      console.log('Logout error:', err.message);
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.clearCookie('zeek-session');
    res.json({ message: 'Logged out' });
  });
});

// ---------- 404 ----------
app.use((req, res) => {
  console.log('404: Cannot GET ' + req.originalUrl);
  const filePath = path.join(__dirname, 'public', '404.html');
  if (fs.existsSync(filePath)) return res.status(404).sendFile(filePath);
  res.status(404).send('404 - Page Not Found');
});

// ---------- Error handler ----------
app.use((err, req, res, next) => {
  console.log('Server error:', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
