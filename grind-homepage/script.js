const header = document.querySelector(".site-header");
const heroPanels = document.querySelectorAll(".hero-panel");
const heroDots = document.querySelectorAll(".hero-dots span");
const CART_KEY = "grindCart";

function updateHeaderVisibility() {
  if (!header) return;

  const hideAfter = window.innerHeight / 2;
  header.classList.toggle("header-hidden", window.scrollY > hideAfter);
}

window.addEventListener("scroll", updateHeaderVisibility, { passive: true });
window.addEventListener("resize", updateHeaderVisibility);
updateHeaderVisibility();

function setActiveHeroDot(index) {
  heroDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === index);
  });
}

heroPanels.forEach((panel, index) => {
  panel.addEventListener("mouseenter", () => setActiveHeroDot(index));
});

setActiveHeroDot(0);

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function formatPrice(value) {
  return `€${Number(value).toFixed(2)}`;
}

function getSelectedSize() {
  const selected = document.querySelector(".size-list button.active");
  return selected ? selected.textContent.trim() : "EU 9,5";
}

function setupDetailCartButton() {
  const productDetail = document.querySelector(".product-detail");
  const cartButton = document.querySelector(".cart-button");

  if (!productDetail || !cartButton) return;

  document.querySelectorAll(".size-list button:not(:disabled)").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".size-list button").forEach((sizeButton) => {
        sizeButton.classList.remove("active");
      });
      button.classList.add("active");
    });
  });

  cartButton.addEventListener("click", () => {
    const size = getSelectedSize();
    const product = {
      id: `${productDetail.dataset.productId}-${size}`,
      title: productDetail.dataset.productTitle,
      price: Number(productDetail.dataset.productPrice),
      image: productDetail.dataset.productImage,
      description: productDetail.dataset.productDescription,
      size,
      quantity: 1
    };

    const cart = getCart();
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push(product);
    }

    saveCart(cart);
    cartButton.textContent = "Lisatud ostukorvi";

    window.setTimeout(() => {
      cartButton.textContent = "Lisa ostukorvi";
    }, 1400);
  });
}

function renderCart() {
  const cartList = document.querySelector("[data-cart-list]");
  if (!cartList) return;

  const shippingTotal = document.querySelector("[data-shipping-total]");
  const taxTotal = document.querySelector("[data-tax-total]");
  const orderTotal = document.querySelector("[data-order-total]");
  const cart = getCart();

  if (!cart.length) {
    cartList.innerHTML = '<p class="empty-cart">Ostukorv on tühi.</p>';
    if (shippingTotal) shippingTotal.textContent = formatPrice(0);
    if (taxTotal) taxTotal.textContent = formatPrice(0);
    if (orderTotal) orderTotal.textContent = formatPrice(0);
    return;
  }

  cartList.innerHTML = cart
    .map((item, index) => `
      <article class="cart-item">
        <img src="${item.image}" alt="${item.title}">
        <div class="cart-copy">
          ${index === 0 ? `<h1>${item.title}</h1>` : `<h2>${item.title}</h2>`}
          <p>${item.description}</p>
          <span>${item.size}</span>
        </div>
        <div class="cart-price">
          <strong>${formatPrice(item.price)}</strong>
          <label>Kogus: <input type="number" min="1" value="${item.quantity}" data-cart-quantity="${item.id}"></label>
          <button class="remove-item" type="button" aria-label="Eemalda toode" data-cart-remove="${item.id}">
            <img src="../assets/icons8-bin.svg" alt="">
          </button>
        </div>
      </article>
    `)
    .join("");

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 0 ? 29.9 : 0;
  const tax = subtotal * 0.22;
  const total = subtotal + shipping + tax;

  if (shippingTotal) shippingTotal.textContent = formatPrice(shipping);
  if (taxTotal) taxTotal.textContent = formatPrice(tax);
  if (orderTotal) orderTotal.textContent = formatPrice(total);
}

function setupCartPage() {
  const cartList = document.querySelector("[data-cart-list]");
  if (!cartList) return;

  cartList.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-cart-remove]");
    if (!removeButton) return;

    const cart = getCart().filter((item) => item.id !== removeButton.dataset.cartRemove);
    saveCart(cart);
    renderCart();
  });

  cartList.addEventListener("change", (event) => {
    const quantityInput = event.target.closest("[data-cart-quantity]");
    if (!quantityInput) return;

    const cart = getCart();
    const item = cart.find((cartItem) => cartItem.id === quantityInput.dataset.cartQuantity);
    if (!item) return;

    item.quantity = Math.max(1, Number(quantityInput.value) || 1);
    saveCart(cart);
    renderCart();
  });

  renderCart();
}

setupDetailCartButton();
setupCartPage();
