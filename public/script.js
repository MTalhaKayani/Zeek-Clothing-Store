document.addEventListener('DOMContentLoaded', () => {
    // Initialize cart
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartCount();

    // Fetch and display products
    fetch('/api/products')
        .then(response => response.json())
        .then(products => {
            const productContainer = document.getElementById('products');
            products.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'col-md-3 product-card';
                productCard.innerHTML = `
                    <img src="${product.image}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p>Price: $${product.price.toFixed(2)}</p>
                    <p>Category: ${product.category} - ${product.subcategory}</p>
                    <button class="btn btn-primary add-to-cart" data-id="${product.id}">Add to Cart</button>
                `;
                productContainer.appendChild(productCard);
            });

            // Add to cart event listeners
            document.querySelectorAll('.add-to-cart').forEach(button => {
                button.addEventListener('click', () => {
                    const productId = button.getAttribute('data-id');
                    const product = products.find(p => p.id == productId);
                    const cartItem = cart.find(item => item.id == productId);
                    if (cartItem) {
                        cartItem.quantity += 1;
                    } else {
                        cart.push({ ...product, quantity: 1 });
                    }
                    localStorage.setItem('cart', JSON.stringify(cart));
                    updateCartCount();
                    alert(`${product.name} added to cart!`);
                });
            });
        })
        .catch(error => {
            console.error('Error fetching products:', error);
            document.getElementById('products').innerText = 'Failed to load products';
        });

    // Update cart count in navbar
    function updateCartCount() {
        const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
        document.getElementById('cart-count').innerText = cartCount;
    }
});