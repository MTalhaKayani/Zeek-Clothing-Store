const express = require('express');
const app = express();
const port = 3000;

// Serve static files from the 'public' folder
app.use(express.static('public'));

// Route to serve the homepage
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Sample API endpoint for clothing products
app.get('/api/products', (req, res) => {
    res.json([
        { id: 1, name: 'T-Shirt', price: 19.99, category: 'Casual' },
        { id: 2, name: 'Jeans', price: 49.99, category: 'Denim' },
        { id: 3, name: 'Jacket', price: 89.99, category: 'Outerwear' }
    ]);
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});