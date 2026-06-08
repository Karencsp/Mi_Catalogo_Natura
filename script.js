let products = [];
let currentCategory = "todos";
let cart = [];

async function loadProducts() {
  const response = await fetch("products.json");
  products = await response.json();
  renderProducts(products);
}
function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function filterProducts() {

  const searchValue = normalizeText(
    document.getElementById("search").value
  );
  let filtered;

  // Si hay texto en el buscador, busca en TODO el catálogo
  if (searchValue !== "") {
      filtered = products.filter(product => {
  

        if (product.stock <= 0) return false;

    const name = normalizeText(product.name);
    const category = normalizeText(product.category);
    const description = normalizeText(product.description);
    
    return (
      name.includes(searchValue) ||
      category.includes(searchValue) ||
      description.includes(searchValue)
    );
   
  });
  } else {

    // Si no hay búsqueda, aplica filtro por categoría

    filtered = products.filter(product => {

      if (product.stock <= 0) return false;

      const category = normalizeText(product.category);

      return (
        currentCategory === "todos" ||
        category.includes(currentCategory)
      );

    });

  }

  renderProducts(filtered);

}
function renderProducts(items) {
  //ESTO SI QUIERO QUE APAREZCA EL ITEN SIN STOCK
  // items.sort((a, b) => {
    //if (a.stock === 0 && b.stock > 0) return 1;
    //if (a.stock > 0 && b.stock === 0) return -1;
    //return 0;
  //});
  // Ocultar productos sin stock
  let availableProducts = items.filter(product => product.stock > 0);

  // Subir promociones al inicio
  availableProducts.sort((a, b) => {

    const aPromo = normalizeText(a.category).includes("promo");
    const bPromo = normalizeText(b.category).includes("promo");

    if (aPromo && !bPromo) return -1;
    if (!aPromo && bPromo) return 1;

    return 0;
  });
  const container = document.getElementById("product-list");
  container.innerHTML = "";

  availableProducts.forEach(product => {
    container.innerHTML += `
      <div class="card">
        <img src="${product.image}" alt="${product.name}">
        <div class="card-content">
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <div class="price">$${product.price.toLocaleString()}
          </div>
          <div class="stock">
            Stock: ${product.stock}
          </div>
           ${
            product.Color
           ? `<div class="color">Color: ${product.Color}</div>`
              : ""
          }
        </div>
        <div class="cart-controls">
          <input
            type="number"
            min="1"
            value="0"
            id="qty-${product.id}"
            class="qty-input"
          >

          <button
            class="add-cart-btn"
            onclick="addToCart(${product.id})"
          >
            Agregar al carrito
          </button>

        </div>
      </div>
    `;
  });
}
function addToCart(productId) {

  const product = products.find(
    p => p.id === productId
  );

  const qty = parseInt(
    document.getElementById(`qty-${productId}`).value
  );

  const existing = cart.find(
    item => item.id === productId
  );

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      ...product,
      qty
    });
  }

  renderCart();
  updateCartCount();
}

document.getElementById("search").addEventListener("input", filterProducts);
  

loadProducts();

// Botón "Todos" activo al iniciar
document
  .querySelector('[data-category="todos"]')
  .classList.add("active");

// Buscador
document
  .getElementById("search")
  .addEventListener("input", filterProducts);

// Botones de categorías
document
  .querySelectorAll(".filter-btn")
  .forEach(button => {

    button.addEventListener("click", () => {

      document
        .querySelectorAll(".filter-btn")
        .forEach(btn => btn.classList.remove("active"));

    button.classList.add("active");

      currentCategory = normalizeText(
        button.dataset.category
      );

      filterProducts();

    });

  });

  function calculateCart() {

  let promoTotal = 0;
  let normalTotal = 0;
  let normalQty = 0;

  cart.forEach(item => {

    const subtotal = item.price * item.qty;

    const isPromo =
      normalizeText(item.category)
      .includes("promo");

    if (isPromo) {

      promoTotal += subtotal;

    } else {

      normalTotal += subtotal;
      normalQty += item.qty;

    }

  });

  let discountPercent = 0;

  if (normalQty === 1) {
    discountPercent = 5;
  } else if (normalQty === 2) {
    discountPercent = 10;
  } else if (normalQty >= 3) {
    discountPercent = 15;
  }

  const discount =
    normalTotal * discountPercent / 100;

  const total =
    normalTotal -
    discount +
    promoTotal;

  return {
    total,
    discount,
    discountPercent
  };
}

function renderCart() {

  const cartContainer =
    document.getElementById("cart-content");

  const totals = calculateCart();

  let html = "";

  cart.forEach(item => {
    const itemTotal =
    item.price * item.qty;

    html += `
      <div class="cart-item">

        <strong>
        ${item.name}
        </strong>

        <br>  
         ${item.qty}
          x
          $${item.price.toLocaleString()}
        <br>
        
        <strong>
        =
        $${itemTotal.toLocaleString()}
        </strong>

      </div>
    `;
  });

  html += `
    <hr>

    <p>
      Descuento:
      ${totals.discountPercent}%
    </p>

    <p>
      Total:
      $${totals.total.toLocaleString()}
    </p>

    <button 
      class="Whatsapp-btn"  
      onclick="sendWhatsAppOrder()">
      Enviar pedido por WhatsApp
    </button>
  `;

  cartContainer.innerHTML = html;
}

function updateCartCount() {

  const totalItems = cart.reduce(
    (total, item) => total + item.qty,
    0
  );

  document.getElementById("cart-count")
    .textContent = totalItems;
}

function sendWhatsAppOrder() {

  const totals = calculateCart();

  let message =
`Hola Karen, te quiero realizar el siguiente pedido:

`;

  cart.forEach(item => {

    message +=
`🛒 ${item.name}
Cantidad: ${item.qty}
Precio: $${item.price.toLocaleString()}

`;

  });

  message +=
`Descuento aplicado: ${totals.discountPercent}%

Total final: $${totals.total.toLocaleString()}
`;

  const url =
`https://wa.me/5491124648528?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
}

//Abrir el carrito
document
  .getElementById("cart-icon")
  .addEventListener("click", () => {

    document
      .getElementById("cart")
      .classList.remove("hidden");

  });

  // Cerrar el carrito 
  document
  .getElementById("close-cart")
  .addEventListener("click", () => {

    document
      .getElementById("cart")
      .classList.add("hidden");

  });