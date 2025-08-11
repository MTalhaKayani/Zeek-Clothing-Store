// 1) Safe guards for missing elements
document.addEventListener('DOMContentLoaded', () => {
  const categorySelect = document.getElementById('category');
  const subcategorySelect = document.getElementById('subcategory');
  const productsDiv = document.getElementById('products');
  if (!productsDiv) return; // page doesn't have a products grid

  function loadProducts() {
    const category = categorySelect?.value || '';
    const subcategory = subcategorySelect?.value || '';
    let url = '/api/products';
    if (category || subcategory) {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (subcategory) params.append('subcategory', subcategory);
      url += `?${params.toString()}`;
    }

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load products');
        return r.json();
      })
      .then(products => {
        productsDiv.innerHTML = '';
        if (!products.length) {
          productsDiv.innerHTML = '<p>No products found.</p>';
          return;
        }
        products.forEach(product => {
          const productDiv = document.createElement('div');
          productDiv.className = 'col-md-4 mb-4';
          productDiv.innerHTML = `
            <div class="card">
              <img src="${product.image}" class="card-img-top" alt="${product.name}">
              <div class="card-body">
                <h5 class="card-title">${product.name}</h5>
                <p class="card-text">₨ ${Number(product.price || 0).toLocaleString()}</p>
                <button class="btn btn-primary add-to-cart"
                        data-id="${product.id}"
                        data-name="${product.name}"
                        data-price="${product.price}">
                  Add to Cart
                </button>
              </div>
            </div>`;
          productsDiv.appendChild(productDiv);
        });
      })
      .catch(err => {
        console.error(err);
        productsDiv.innerHTML = '<p style="color:#c00">Could not load products. Please try again.</p>';
      });
  }

  categorySelect?.addEventListener('change', loadProducts);
  subcategorySelect?.addEventListener('change', loadProducts);
  loadProducts();

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart');
    if (!btn) return;
    const id = btn.dataset.id;
    const name = btn.dataset.name;
    const price = parseFloat(btn.dataset.price);
    console.log('Added to cart:', { id, name, price });
  });
});
