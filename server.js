const express = require('express');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.static('public'));

// Serve pages
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/shop', (req, res) => {
    res.sendFile(__dirname + '/public/shop.html');
});

app.get('/about', (req, res) => {
    res.sendFile(__dirname + '/public/about.html');
});

app.get('/contact', (req, res) => {
    res.sendFile(__dirname + '/public/contact.html');
});

app.get('/cart', (req, res) => {
    res.sendFile(__dirname + '/public/cart.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

// API endpoint for products
app.get('/api/products', (req, res) => {
    res.json([
        { id: 1, name: 'Graphic T-Shirt', price: 19.99, category: 'Men', subcategory: 'Tops', image: 'https://via.placeholder.com/200x200?text=T-Shirt' },
        { id: 2, name: 'Slim Fit Jeans', price: 49.99, category: 'Men', subcategory: 'Bottoms', image: 'https://via.placeholder.com/200x200?text=Jeans' },
        { id: 3, name: 'Leather Jacket', price: 89.99, category: 'Men', subcategory: 'Outerwear', image: 'https://via.placeholder.com/200x200?text=Jacket' },
        { id: 4, name: 'Hoodie', price: 39.99, category: 'Women', subcategory: 'Tops', image: 'https://via.placeholder.com/200x200?text=Hoodie' },
        { id: 5, name: 'Skirt', price: 29.99, category: 'Women', subcategory: 'Bottoms', image: 'https://via.placeholder.com/200x200?text=Skirt' },
        { id: 6, name: 'Scarf', price: 15.99, category: 'Women', subcategory: 'Accessories', image: 'https://via.placeholder.com/200x200?text=Scarf' }
    ]);
});

// Handle contact form submission
app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;
    // In a real app, save to a database or send an email
    console.log('Contact Form:', { name, email, message });
    res.json({ message: 'Thank you for your message! We will get back to you soon.' });
});

// Mock login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin') {
        res.json({ success: true, role: 'admin', message: 'Admin login successful' });
    } else {
        // Mock user check (no database)
        res.json({ success: true, role: 'user', message: 'User login successful' });
    }
});

// Mock signup endpoint
app.post('/api/signup', (req, res) => {
    const { username, email, password } = req.body;
    // In a real app, save to a database
    console.log('Signup:', { username, email, password });
    res.json({ message: 'Signup successful! Use code ZEEK10 for 10% off your next purchase.' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});