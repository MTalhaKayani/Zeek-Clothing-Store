 fetch('/api/products')
    .then(response => response.json())
    .then(products => {
        const productContainer = document.getElementById('products');
        products.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.className = 'product';
            productDiv.innerHTML = `<h3>${product.name}</h3><p>Price: $${product.price}</p><p>Category: ${product.category}</p>`;
            productContainer.appendChild(productDiv);
        });
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('products').innerText = 'Failed to load products';
    });