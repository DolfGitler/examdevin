const header = document.querySelector(".site-header");
const heroPanels = document.querySelectorAll(".hero-panel");
const heroDots = document.querySelectorAll(".hero-dots span");
const CART_KEY = "grindCart";
const PRODUCTS = {
  "grind-pusa-2026": {
    title: "GRIND pusa 2026",
    price: 79.9,
    image: "../assets/transparent-bg/pusa 1.png",
    description: "Soe ja vastupidav pusa, mis sobib nii rulaparki kui igapäevaseks kandmiseks. Pehme sisemus ja tugev kangas hoiavad mugavust kogu päeva.",
    productCode: "GRD-PUSA-2601",
    styleCode: "GP26-BLK-A",
    sizes: ["XS", "S", "M", "L", "XL"]
  },
  "butterco-mustad-teksad-2026": {
    title: "BUTTER'CO teksad 2026",
    price: 89.9,
    image: "../assets/transparent-bg/teksad1.png",
    description: "Laiema lõikega mustad teksad, mis annavad sõitmiseks ruumi ja hoiavad tänavastiili puhtana. Tugev denim sobib aktiivseks kasutuseks.",
    productCode: "BTR-DNM-2602",
    styleCode: "BC26-BLK-DNM",
    sizes: ["28", "30", "32", "34", "36"]
  },
  "grind-pusa-tagant-2026": {
    title: "GRIND pusa 2026",
    price: 84.9,
    image: "../assets/transparent-bg/pusa 2.png",
    description: "Suure seljagraafikaga pusa neile, kelle stiil peab olema nähtav ka pärast trikki. Pehme kapuuts ja tugevad soonikud teevad sellest igapäevase lemmiku.",
    productCode: "GRD-PUSA-2603",
    styleCode: "GP26-BLK-B",
    sizes: ["XS", "S", "M", "L", "XL"]
  },
  "grind-sark-2026": {
    title: "GRIND särk 2026",
    price: 34.9,
    image: "../assets/transparent-bg/tsark1.png",
    description: "Must graafiline särk, mis on loodud kergeks kandmiseks ja kihiliseks tänavastiiliks. Pehme puuvillane tunne sobib nii suveks kui hoodie alla.",
    productCode: "GRD-TEE-2604",
    styleCode: "GT26-BLK-A",
    sizes: ["XS", "S", "M", "L", "XL"]
  },
  "starshoe-tossud-2026": {
    title: "STARSHOE tossud 2026",
    price: 129.9,
    image: "../assets/transparent-bg/tossud1.png",
    description: "STARSHOE tossud on loodud igapäevaseks sõiduks ja tänavastiiliks. Tugev tald, pehme sisemus ja vastupidav pealis hoiavad jalga mugavalt ka pikematel päevadel.",
    productCode: "STR-SHOE-2605",
    styleCode: "SS26-BLK-WHT",
    sizes: ["EU 7.5", "EU 8", "EU 9", "EU 9.5", "EU 11", "EU 12.5"]
  },
  "butterco-sinised-teksad-2026": {
    title: "BUTTER'CO teksad 2026",
    price: 94.9,
    image: "../assets/transparent-bg/teksad 2.png",
    description: "Sinised BUTTER'CO teksad ühendavad klassikalise denimi ja skate-lõike. Graafilised detailid lisavad iseloomu ilma mugavust ära võtmata.",
    productCode: "BTR-DNM-2606",
    styleCode: "BC26-BLU-DNM",
    sizes: ["28", "30", "32", "34", "36"]
  },
  "grind-sark-klassik-2026": {
    title: "GRIND särk Klassik 2026",
    price: 32.9,
    image: "../assets/transparent-bg/tsark1.png",
    description: "Klassikalise lõikega GRIND särk, mis töötab iga komplektiga. Sobib sõitmiseks, linnas käimiseks ja igapäevaseks kandmiseks.",
    productCode: "GRD-TEE-2607",
    styleCode: "GT26-BLK-K",
    sizes: ["XS", "S", "M", "L", "XL"]
  },
  "starshoe-tossud-pro-2026": {
    title: "STARSHOE tossud Pro 2026",
    price: 139.9,
    image: "../assets/transparent-bg/tossud1.png",
    description: "Pro-versioon on tugevdatud küljeosa ja stabiilsema tallaga. Hea valik sõitjale, kes tahab tossult rohkem tuge ja pikemat eluiga.",
    productCode: "STR-SHOE-2608",
    styleCode: "SS26-PRO-BW",
    sizes: ["EU 7.5", "EU 8", "EU 9", "EU 9.5", "EU 11", "EU 12.5"]
  },
  "butterco-teksad-light-2026": {
    title: "BUTTER'CO teksad Light 2026",
    price: 99.9,
    image: "../assets/transparent-bg/teksad 2.png",
    description: "Heledama pesuga teksad, mis sobivad hästi mustade tossude ja graafiliste särkidega. Mugav lõige annab liikumiseks vabadust.",
    productCode: "BTR-DNM-2609",
    styleCode: "BC26-BLU-LT",
    sizes: ["28", "30", "32", "34", "36"]
  },
  "butterco-rula-valge-2022": {
    title: "BUTTER'CO rula Valge 2022",
    price: 119.9,
    image: "../assets/transparent-bg/rulkatoode1.png",
    description: "Valge graafikaga complete-rula alustavale ja edasijõudnud sõitjale. Stabiilne laud sobib linnas kruiisimiseks ja esimesteks trikkideks.",
    productCode: "BTR-SKB-2201",
    styleCode: "BC22-WHT-CMP",
    sizes: ["7.75 tolli", "8.0 tolli", "8.25 tolli"]
  },
  "butterco-rula-graffiti-2026": {
    title: "BUTTER'CO rula Graffiti 2026",
    price: 129.9,
    image: "../assets/transparent-bg/rula2.png",
    description: "Graffiti-stiilis rula on kiire, kerge ja valmis tänavasõiduks. Hea valik sõitjale, kes tahab silmapaistvat disaini.",
    productCode: "BTR-SKB-2602",
    styleCode: "BC26-GRF-CMP",
    sizes: ["7.75 tolli", "8.0 tolli", "8.25 tolli"]
  },
  "butterco-rula-must-2026": {
    title: "BUTTER'CO rula Must 2026",
    price: 134.9,
    image: "../assets/transparent-bg/rula4.png",
    description: "Must BUTTER'CO complete-rula tugeva graafika ja kindla tunnetusega. Sobib parki, tänavale ja igapäevaseks sõiduks.",
    productCode: "BTR-SKB-2603",
    styleCode: "BC26-BLK-CMP",
    sizes: ["7.75 tolli", "8.0 tolli", "8.25 tolli"]
  },
  "butterco-rula-classic-2022": {
    title: "BUTTER'CO rula Classic 2022",
    price: 109.9,
    image: "../assets/transparent-bg/rulkatoode1.png",
    description: "Klassikaline complete-rula neile, kes tahavad lihtsat ja töökindlat lauda. Puhas disain ja hea kontroll igapäevaseks sõiduks.",
    productCode: "BTR-SKB-2204",
    styleCode: "BC22-CLS-CMP",
    sizes: ["7.75 tolli", "8.0 tolli", "8.25 tolli"]
  },
  "butterco-rula-street-2026": {
    title: "BUTTER'CO rula Street 2026",
    price: 139.9,
    image: "../assets/transparent-bg/rula2.png",
    description: "Street-seeria laud on tehtud kiireteks liinideks ja tehnilisteks trikkideks. Vastupidav komplekt annab kindla tunnetuse jala all.",
    productCode: "BTR-SKB-2605",
    styleCode: "BC26-ST-CMP",
    sizes: ["7.75 tolli", "8.0 tolli", "8.25 tolli"]
  },
  "butterco-rula-night-2026": {
    title: "BUTTER'CO rula Night 2026",
    price: 144.9,
    image: "../assets/transparent-bg/rula4.png",
    description: "Tume ja terav rula neile, kes eelistavad minimalistlikku välimust. Laud on valmis nii pargiks kui tänavaks.",
    productCode: "BTR-SKB-2606",
    styleCode: "BC26-NGT-CMP",
    sizes: ["7.75 tolli", "8.0 tolli", "8.25 tolli"]
  },
  "butterco-rula-mini-2022": {
    title: "BUTTER'CO rula Mini 2022",
    price: 99.9,
    image: "../assets/transparent-bg/rulkatoode1.png",
    description: "Väiksem ja kergem complete-rula nooremale sõitjale või neile, kes tahavad lihtsamat kontrolli.",
    productCode: "BTR-SKB-2207",
    styleCode: "BC22-MINI",
    sizes: ["7.5 tolli", "7.75 tolli", "8.0 tolli"]
  },
  "butterco-rula-rail-2026": {
    title: "BUTTER'CO rula Rail 2026",
    price: 149.9,
    image: "../assets/transparent-bg/rula2.png",
    description: "Rail-seeria on tehtud sõitjale, kes tahab proovida rohkem grind'e ja slide'e. Tugev komplekt peab paremini vastu.",
    productCode: "BTR-SKB-2608",
    styleCode: "BC26-RAIL",
    sizes: ["7.75 tolli", "8.0 tolli", "8.25 tolli"]
  },
  "butterco-rula-logo-2026": {
    title: "BUTTER'CO rula Logo 2026",
    price: 134.9,
    image: "../assets/transparent-bg/rula4.png",
    description: "Logo-graafikaga rula ühendab lihtsa välimuse ja tugeva sõidutunde. Sobib hästi igapäevaseks kasutuseks.",
    productCode: "BTR-SKB-2609",
    styleCode: "BC26-LOGO",
    sizes: ["7.75 tolli", "8.0 tolli", "8.25 tolli"]
  }
};

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

function setupShopSlideshow() {
  const slider = document.querySelector("[data-shop-slideshow]");
  const track = document.querySelector(".mission-slider-track");
  if (!slider || !track) return;

  let currentIndex = 0;
  const originalSlides = Array.from(track.children);
  const slideCount = originalSlides.length;
  if (slideCount <= 1) return;

  track.appendChild(originalSlides[0].cloneNode(true));

  function slideTo(index, animate = true) {
    track.style.transition = animate ? "transform 700ms ease" : "none";
    track.style.transform = `translateX(-${index * slider.clientWidth}px)`;
  }

  window.setInterval(() => {
    currentIndex += 1;
    slideTo(currentIndex);
  }, 7000);

  track.addEventListener("transitionend", () => {
    if (currentIndex === slideCount) {
      currentIndex = 0;
      slideTo(currentIndex, false);
    }
  });
}

function setupEventsSlider() {
  const sliderTrack = document.querySelector("[data-events-slider]");
  const previousButton = document.querySelector(".round-arrow-left");
  const nextButton = document.querySelector(".round-arrow-right");

  if (!sliderTrack || !previousButton || !nextButton) return;

  const originalSlides = Array.from(sliderTrack.children);
  const eventSlides = [...originalSlides, ...originalSlides.map((slide) => slide.cloneNode(true))];

  function getEventTitle(slide) {
    return slide.querySelector("h2")?.textContent.trim() || "";
  }

  function hasMatchingNeighbors(slides) {
    return slides.some((slide, index) => {
      const nextSlide = slides[(index + 1) % slides.length];
      return getEventTitle(slide) === getEventTitle(nextSlide);
    });
  }

  function shuffleEvents(slides) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const shuffled = [...slides].sort(() => Math.random() - 0.5);
      if (!hasMatchingNeighbors(shuffled)) return shuffled;
    }

    return [
      slides[0],
      slides[1],
      slides[2],
      slides[0].cloneNode(true),
      slides[1].cloneNode(true),
      slides[2].cloneNode(true)
    ];
  }

  const randomizedSlides = shuffleEvents(eventSlides);
  const visibleSlides = 3;
  const beforeClones = randomizedSlides.slice(-visibleSlides).map((slide) => slide.cloneNode(true));
  const afterClones = randomizedSlides.slice(0, visibleSlides).map((slide) => slide.cloneNode(true));

  sliderTrack.replaceChildren(...beforeClones, ...randomizedSlides, ...afterClones);

  let currentIndex = visibleSlides;
  let isMoving = false;

  function getStepSize() {
    const slideWidth = sliderTrack.children[0].getBoundingClientRect().width;
    const gap = Number.parseFloat(window.getComputedStyle(sliderTrack).columnGap) || 0;
    return slideWidth + gap;
  }

  function updateSlider(animate = true) {
    sliderTrack.style.transition = animate ? "transform 450ms ease" : "none";
    sliderTrack.style.transform = `translateX(-${currentIndex * getStepSize()}px)`;
  }

  previousButton.addEventListener("click", () => {
    if (isMoving) return;
    isMoving = true;
    currentIndex -= 1;
    updateSlider();
  });

  nextButton.addEventListener("click", () => {
    if (isMoving) return;
    isMoving = true;
    currentIndex += 1;
    updateSlider();
  });

  sliderTrack.addEventListener("transitionend", () => {
    if (currentIndex < visibleSlides) {
      currentIndex += randomizedSlides.length;
      updateSlider(false);
    }

    if (currentIndex >= randomizedSlides.length + visibleSlides) {
      currentIndex -= randomizedSlides.length;
      updateSlider(false);
    }

    isMoving = false;
  });

  window.addEventListener("resize", updateSlider);
  updateSlider(false);
}

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

function getProductFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || "starshoe-tossud-2026";
  return { id, product: PRODUCTS[id] || PRODUCTS["starshoe-tossud-2026"] };
}

function renderProductDetail() {
  const productDetail = document.querySelector(".product-detail");
  if (!productDetail) return;

  const { id, product } = getProductFromUrl();
  const detailImage = document.querySelector(".detail-image");
  const title = document.querySelector("#detail-title");
  const price = document.querySelector(".detail-price");
  const sizeList = document.querySelector(".size-list");
  const productCode = document.querySelector("[data-product-code]");
  const styleCode = document.querySelector("[data-style-code]");
  const description = document.querySelector("[data-product-description]");

  productDetail.dataset.productId = id;
  productDetail.dataset.productTitle = product.title;
  productDetail.dataset.productPrice = product.price;
  productDetail.dataset.productImage = product.image;
  productDetail.dataset.productDescription = product.description;

  document.title = `Grind | ${product.title}`;
  if (detailImage) {
    detailImage.src = product.image;
    detailImage.alt = product.title;
  }
  if (title) title.textContent = product.title;
  if (price) price.textContent = formatPrice(product.price);
  if (productCode) productCode.textContent = product.productCode;
  if (styleCode) styleCode.textContent = product.styleCode;
  if (description) description.textContent = product.description;
  if (sizeList) {
    sizeList.innerHTML = product.sizes
      .map((size, index) => `<button class="${index === 0 ? "active" : ""}" type="button">${size}</button>`)
      .join("");
  }
}

function getSelectedSize() {
  const selected = document.querySelector(".size-list button.active");
  return selected ? selected.textContent.trim() : "EU 9,5";
}

function setupDetailCartButton() {
  renderProductDetail();

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
setupShopSlideshow();
setupEventsSlider();
