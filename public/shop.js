 document.addEventListener('DOMContentLoaded', () => {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartCount();

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const selectedCategory = urlParams.get('category') || '';
    const selectedSubcategory = urlParams.get('subcategory') || '';

    // Set filter dropdowns
    document.getElementById('categoryFilter').value = selectedCategory;
    document.getElementById('subcategoryFilter').value = selectedSubcategory;

    // Fetch and display products
    fetch('/api/products')
        .then(response => response.json())
        .then(products => {
            let filteredProducts = products;
            if (selectedCategory) {
                filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
            }
            if (selectedSubcategory) {
                filteredProducts = filteredProducts.filter(p => p.subcategory === selectedSubcategory);
            }
            displayProducts(filteredProducts);

            // Filter event listeners
            document.getElementById('categoryFilter').addEventListener('change', (e) => {
                const category = e.target.value;
                const newUrl = category ? `/shop?category=${category}` : '/shop';
                window.history.pushState({}, '', newUrl);
                filteredProducts = products;
                if (category) {
                    filteredProducts = filteredProducts.filter(p => p.category === category);
                }
                document.getElementById('subcategoryFilter').value = '';
                displayProducts(filteredProducts);
            });

            document.getElementById('subcategoryFilter').addEventListener('change', (e) => {
                const subcategory = e.target.value;
                const category = document.getElementById('categoryFilter').value;
                let newUrl = '/shop';
                if (category) {
                    newUrl += `?category=${category}`;
                    if (subcategory) {
                        newUrl += `&subcategory=${subcategory}`;
                    }
                } else if (subcategory) {
                    newUrl += `?subcategory=${subcategory}`;
                }
                window.history.pushState({}, '', newUrl);
                filteredProducts = products;
                if (category) {
                    filteredProducts = filteredProducts.filter(p => p.category === category);
                }
                if (subcategory) {
                    filteredProducts = filteredProducts.filter(p => p.subcategory === subcategory);
                }
                displayProducts(filteredProducts);
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

    function displayProducts(products) {
        const productContainer = document.getElementById('products');
        productContainer.innerHTML = '';
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
    }

    function updateCartCount() {
        const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
        document.getElementById('cart-count').innerText = cartCount;
    }
});