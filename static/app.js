// app.js - shared logic for auth, cart and API helpers

const MOCK_MENU = [
  { item_id: 1, name: 'Margherita Pizza', description: 'Classic cheese', category: 'Main Course', price: 299, availability: true },
  { item_id: 2, name: 'Chicken Biryani', description: 'Fragrant biryani', category: 'Main Course', price: 250, availability: true },
  { item_id: 3, name: 'Spring Rolls', description: 'Crispy starter', category: 'Starter', price: 120, availability: true },
  { item_id: 4, name: 'Chocolate Cake', description: 'Rich dessert', category: 'Dessert', price: 150, availability: true },
  { item_id: 5, name: 'Cold Coffee', description: '', category: 'Drink', price: 80, availability: true }
];

// ------------------ CART HELPERS ------------------
function getCart() {
  try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
}
function saveCart(c) { localStorage.setItem('cart', JSON.stringify(c)); }
function addToCart(item, qty = 1) {
  const cart = getCart();
  const found = cart.find(i => i.item_id === item.item_id);
  if (found) { found.quantity += qty; }
  else { cart.push({ ...item, quantity: qty }); }
  saveCart(cart);
  updateCartCount();
}
function removeFromCart(item_id) {
  const cart = getCart().filter(i => i.item_id !== item_id);
  saveCart(cart);
}
function updateQuantity(item_id, qty) {
  const cart = getCart().map(i => i.item_id === item_id ? { ...i, quantity: qty } : i);
  saveCart(cart);
}
function clearCart() {
  localStorage.removeItem('cart');
  updateCartCount();
}
function updateCartCount() {
  const el = document.getElementById('cart-count');
  if (el) el.textContent = getCart().reduce((s, i) => s + i.quantity, 0);
}

// ------------------ API HELPERS ------------------
async function apiRegister(payload) {
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Register failed');
    return await res.json();
  } catch (e) {
    console.warn('Using mock register:', e.message);
    return { token: 'mock-' + Date.now() };
  }
}

async function apiLogin(payload) {
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Login failed');
    return await res.json();
  } catch (e) {
    return { token: 'mock-' + Date.now() };
  }
}

async function apiGetMenu() {
  try {
    const res = await fetch('/api/menu');
    if (!res.ok) throw new Error('no menu');
    return await res.json();
  } catch (e) {
    return MOCK_MENU;
  }
}

async function apiPlaceOrder(payload) {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Order failed');
    return await res.json();
  } catch (e) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push({ ...payload, created: new Date().toISOString() });
    localStorage.setItem('orders', JSON.stringify(orders));
    return { ok: true };
  }
}

// ------------------ AUTH HANDLERS ------------------
function logout() {
  localStorage.removeItem('token');
  updateAuthLinks();
  window.location = 'index.html';
}

function updateAuthLinks() {
  const token = localStorage.getItem('token');
  const loginLink = document.getElementById('login-link');
  const registerLink = document.getElementById('register-link');
  const logoutBtn = document.getElementById('logout-btn');
  if (token) {
    if (loginLink) loginLink.classList.add('hidden');
    if (registerLink) registerLink.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
  } else {
    if (loginLink) loginLink.classList.remove('hidden');
    if (registerLink) registerLink.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
  }
}

// ------------------ REGISTER FORM SUBMIT ------------------
async function handleRegisterSubmit(event) {
  event.preventDefault(); // prevent page reload

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!name || !email || !password) {
    alert("Please fill all fields!");
    return;
  }

  try {
    const data = await apiRegister({ name, email, password });
    if (data.token) {
      localStorage.setItem("token", data.token);
      alert("Registration successful!");
      window.location.href = "login.html";
    } else {
      alert("Registration failed. Try again.");
    }
  } catch (err) {
    console.error("Error:", err);
    alert("Something went wrong. Please try again.");
  }
}

// ------------------ GLOBAL EXPORTS ------------------
window.getCart = getCart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.clearCart = clearCart;
window.apiRegister = apiRegister;
window.apiLogin = apiLogin;
window.apiGetMenu = apiGetMenu;
window.apiPlaceOrder = apiPlaceOrder;
window.updateCartCount = updateCartCount;
window.updateAuthLinks = updateAuthLinks;
window.logout = logout;
window.handleRegisterSubmit = handleRegisterSubmit;
