document.addEventListener('DOMContentLoaded', () => {
    const cartCount = document.getElementById('cart-count');
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            const button = e.target;
            const id = button.dataset.id;
            const name = button.dataset.name;
            const price = parseFloat(button.dataset.price);
            const existingItem = cart.find(item => item.id === id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ id, name, price, quantity: 1 });
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
            alert(`${name} added to cart!`);
        }
    });
});