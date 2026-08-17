let products = [];
let prices = {};
let currentCategory = "todos";
let cart = [];


/* =========================================================
   NORMALIZAR TEXTO
========================================================= */

function normalizeText(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* =========================================================
   OBTENER PRECIO
========================================================= */

function getProductPrice(productName) {

  const normalizedName = normalizeText(productName);

  const priceKey = Object.keys(prices).find(
    key => normalizeText(key) === normalizedName
  );

  if (priceKey) {
    return Number(prices[priceKey]) || 0;
  }

  return 0;
}


/* =========================================================
   GUARDAR CARRITO
========================================================= */

function saveCart() {

  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );

}


/* =========================================================
   CARGAR PRODUCTOS Y PRECIOS
========================================================= */

async function loadProducts() {

  try {

    console.log("Cargando products.json...");

    const productsResponse =
      await fetch("products.json");

    if (!productsResponse.ok) {
      throw new Error(
        `No se pudo cargar products.json. Error HTTP: ${productsResponse.status}`
      );
    }

    console.log("products.json cargado correctamente");


    console.log("Cargando prices.json...");

    const pricesResponse =
      await fetch("prices.json");

    if (!pricesResponse.ok) {
      throw new Error(
        `No se pudo cargar prices.json. Error HTTP: ${pricesResponse.status}`
      );
    }

    console.log("prices.json cargado correctamente");


    products =
      await productsResponse.json();

    prices =
      await pricesResponse.json();


    console.log("Productos:", products);
    console.log("Precios:", prices);


    /* Agregar precio a cada producto */

    products.forEach(product => {

      product.price =
        getProductPrice(product.name);

    });


    /* =====================================================
       RECUPERAR CARRITO GUARDADO
    ===================================================== */

    const savedCart =
      JSON.parse(
        localStorage.getItem("cart")
      ) || [];


    /* Actualizar carrito */
    cart = savedCart
      .map(savedItem => {

        const currentProduct =
          products.find(
            product =>
              product.id === savedItem.id
          );

        if (!currentProduct) {
          return null;
        }

        const currentPrice =
          getProductPrice(
            currentProduct.name
          );

        let quantity =
          Number(savedItem.qty) || 1;

        /* Nunca superar stock */
        if (
          quantity >
          currentProduct.stock
        ) {
          quantity =
            currentProduct.stock;
        }

        return {
          ...currentProduct,
          price: currentPrice,
          qty: quantity
        };
      })

      .filter(item =>
        item !== null &&
        item.qty > 0 &&
        item.stock > 0
      );


    saveCart();
    renderProducts(products);
    renderCart();
    updateCartCount();

  } catch (error) {

    console.error(
      "ERROR AL CARGAR:",
      error
    );

    alert(
      "Error al cargar los productos o precios.\n\n" +
      error.message
    );
  }
}

/* =========================================================
   FILTRAR PRODUCTOS
========================================================= */
function filterProducts() {

  const searchElement =
    document.getElementById("search");

  if (!searchElement) {
    return;
  }

  const searchValue =
    normalizeText(
      searchElement.value
    );

  let filtered;

  /* =====================================================
     SI HAY BÚSQUEDA
 
     BUSCA EN TODO EL CATÁLOGO
     IGNORANDO LA CATEGORÍA SELECCIONADA
  ===================================================== */

  if (searchValue !== "") {

    filtered =
      products.filter(product => {

        /* Ocultar sin stock */
        if (product.stock <= 0) {
          return false;
        }

        const name =
          normalizeText(
            product.name
          );

        const category =
          normalizeText(
            product.category
          );

        const description =
          normalizeText(
            product.description
          );

        const color =
          normalizeText(
            product.Color
          );

        return (
          name.includes(searchValue) ||
          category.includes(searchValue) ||
          description.includes(searchValue) ||
          color.includes(searchValue)
        );
      });
  }

  /* =====================================================
     SI NO HAY BÚSQUEDA
   
     APLICA EL BOTÓN DE CATEGORÍA
  ===================================================== */

  else {

    filtered =
      products.filter(product => {

        if (product.stock <= 0) {
          return false;
        }

        const category =
          normalizeText(
            product.category
          );

        return (

          currentCategory === "todos" ||
          category.includes(
            currentCategory
          )
        );
      });
  }

  renderProducts(filtered);
}

/* =========================================================
   RENDER PRODUCTOS
========================================================= */

function renderProducts(items) {

  const container =
    document.getElementById(
      "product-list"
    );

  if (!container) {
    return;
  }


  /* Ocultar productos sin stock */
  let availableProducts =
    items.filter(
      product =>
        product.stock > 0
    );

  /* =====================================================
     PROMOCIONES SIEMPRE PRIMERO
  ===================================================== */

  availableProducts.sort(
    (a, b) => {

      const aPromo =
        normalizeText(
          a.category
        ).includes("promo");

      const bPromo =
        normalizeText(
          b.category
        ).includes("promo");

      if (
        aPromo &&
        !bPromo
      ) {
        return -1;
      }

      if (
        !aPromo &&
        bPromo
      ) {
        return 1;
      }

      return 0;
    }
  );

  container.innerHTML = "";

  /* =====================================================
     CREAR TARJETAS
  ===================================================== */
  availableProducts.forEach(product => {

    const price =
      getProductPrice(
        product.name
      );

    /* Cantidad actual del carrito */
    const cartItem =
      cart.find(
        item =>
          item.id === product.id
      );

    const currentQty =
      cartItem
        ? cartItem.qty
        : 0;


    container.innerHTML += `

      <div class="card">

        <div class="image-container">

          <img
            src="${product.image}"
            alt="${product.name}"
          >
        </div>

        <div class="card-content">
          <h3>
            ${product.name}
          </h3>

          <p>
            ${product.description}
          </p>

          <div class="price">

            $${price.toLocaleString()}
          </div>

          <div class="stock">
            Stock: ${product.stock}
          </div>

          ${
            product.Color
              ? `
                <div class="color">
                  Color: ${product.Color}
                </div>
              `
              : ""
          }

        </div>

        <div class="cart-controls">
          <!-- CANTIDAD -->

          <div class="card-qty-controls">
            <button
              type="button"
              class="qty-minus"
              onclick="decreaseCardQty(${product.id})"
            >
              −
            </button>

            <input
              type="number"
              min="1"
              max="${product.stock}"
              value="${currentQty}"
              id="qty-${product.id}"
              class="qty-input"
              onchange="validateCardQty(${product.id})"
              oninput="validateCardQty(${product.id})"
            >

            <button
              type="button"
              class="qty-plus"
              onclick="increaseCardQty(${product.id})"
            >
              +
            </button>
          </div>

          <!-- AGREGAR -->

          <button
            type="button"
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

/* =========================================================
   VALIDAR CANTIDAD DE TARJETA
========================================================= */

function validateCardQty(productId) {

  const product =
    products.find(
      p => p.id === productId
    );

  const input =
    document.getElementById(
      `qty-${productId}`
    );

  if (!product || !input) {
    return;
  }

  let qty =
    parseInt(input.value);

  if (
    isNaN(qty) ||
    qty < 0
  ) {
    input.value = 0;
    return;
  }

  if (
    qty >
    product.stock
  ) {
    input.value =
      product.stock;
    return;
  }

  input.value =
    qty;
}


/* =========================================================
   SUMAR CANTIDAD EN TARJETA
========================================================= */

function increaseCardQty(productId) {

  const product =
    products.find(
      p => p.id === productId
    );

  const input =
    document.getElementById(
      `qty-${productId}`
    );

  if (!product || !input) {
    return;
  }

  let qty =
    parseInt(input.value) || 0;

  if (
    qty >=
    product.stock
  ) {
    input.value =
      product.stock;
    return;
  }

  qty++;

  input.value =
    qty;
}

/* =========================================================
   RESTAR CANTIDAD EN TARJETA
========================================================= */

function decreaseCardQty(productId) {

  const input =
    document.getElementById(
      `qty-${productId}`
    );

  if (!input) {
    return;
  }

  let qty =
    parseInt(input.value) || 0;

  if (qty <= 0) {
    input.value = 0;
    return;
  }


  qty--;

  input.value =
    qty;
}


/* =========================================================
   AGREGAR AL CARRITO
========================================================= */

function addToCart(productId) {

  const product =
   products.find(
      p => p.id === productId
    );

  if (!product) {
    return;
  }

  const input =
    document.getElementById(
      `qty-${productId}`
    );

  if (!input) {
    return;
  }

  let qty =
    parseInt(input.value);

  if (
    isNaN(qty) ||
    qty < 0
  ) {
    qty = 0;
  }

  /* Nunca superar stock */
  if (
    qty >
    product.stock
  ) {
    qty =
      product.stock;

    input.value =
      product.stock;
  }


  /* Buscar producto existente */
  const existing =
    cart.find(
      item =>
        item.id === productId
    );


  /* Si existe, reemplazar cantidad */
  if (existing) {
    existing.qty =
      qty;
  }


  /* Si no existe, agregar */

  else {
    cart.push({
      ...product,
      price:
        getProductPrice(
          product.name
        ),

      qty: qty
    });
  }


  saveCart();
  renderCart();
  updateCartCount();
}


/* =========================================================
   CALCULAR CARRITO
========================================================= */

function calculateCart() {

  let promoTotal = 0;
  let normalTotal = 0;
  let normalQty = 0;


  cart.forEach(item => {

    const price =
      getProductPrice(
        item.name
      );

    item.price =
      price;

    const subtotal =
      price * item.qty;

    const isPromo =
      normalizeText(
        item.category
      ).includes("promo");

    if (isPromo) {

      promoTotal +=
        subtotal;
    }

    else {
      normalTotal +=
        subtotal;

      normalQty +=
        item.qty;
    }
  });

  /* =====================================================
     DESCUENTO
  ===================================================== */

  let discountPercent = 0;

  if (normalQty === 1) {
    discountPercent = 5;
  }

  else if (normalQty === 2) {
    discountPercent = 10;
  }

  else if (normalQty >= 3) {
    discountPercent = 15;
  }


  const discount =
    normalTotal *
    discountPercent /
    100;

  const total =
    normalTotal -
    discount +
    promoTotal;

  const subtotal =
    normalTotal +
    promoTotal;

  return {
    subtotal,
    total,
    discount,
    discountPercent
  };
}


/* =========================================================
   MOSTRAR CARRITO
========================================================= */

function renderCart() {

  const cartContainer =
    document.getElementById(
      "cart-content"
    );

  if (!cartContainer) {
    return;
  }


  const totals =
    calculateCart();

  let html = "";


  /* =====================================================
     PRODUCTOS
  ===================================================== */

  cart.forEach(item => {

    const price =
      getProductPrice(
        item.name
      );


    const itemTotal =
      price * item.qty;


    html += `

      <div class="cart-item">

        <img
          src="${item.image}"
          class="cart-thumb"
          alt="${item.name}"
        >

        <div class="cart-item-info">

          <strong>
            ${item.name}
          </strong>

          <br>


          ${item.qty}
          x
          $${price.toLocaleString()}


          <strong>
            =
            $${itemTotal.toLocaleString()}
          </strong>

        </div>

        <div class="qty-controls">
          <button
            onclick="decreaseQty(${item.id})"
          >
            -
          </button>

          <span>
            ${item.qty}
          </span>

          <button
            onclick="increaseQty(${item.id})"
          >
            +
          </button>
        </div>

        <div>
          <button
            class="remove-btn"
            onclick="removeItem(${item.id})"
          >
            🗑
          </button>
        </div>

      </div>
    `;
  });

  /* =====================================================
     TOTALES
  ===================================================== */

  html += `

    <hr>

    <p>
      Subtotal:
      $${totals.subtotal.toLocaleString()}
    </p>

    <p>
      Descuento:
      ${totals.discountPercent}%
    </p>

    
    <strong>
      <p>
        Total a Pagar:
        $${totals.total.toLocaleString()}
      </p>
    </strong>

    <button
      class="Whatsapp-btn"
      onclick="sendWhatsAppOrder()"
    >

      <strong>
        Enviar pedido por WhatsApp
      </strong>

    </button>

    <button
      class="clear-cart-btn"
      onclick="clearCart()"
    >

      Vaciar carrito

    </button>
  `;

  cartContainer.innerHTML =
    html;
}

/* =========================================================
   CONTADOR DEL CARRITO
========================================================= */

function updateCartCount() {

  const totalItems =
    cart.reduce(
      (total, item) =>
        total + item.qty,
      0
    );

  const countElement =
    document.getElementById(
      "cart-count"
    );

  if (countElement) {

    countElement.textContent =
      totalItems;
  }
}


/* =========================================================
   AUMENTAR CANTIDAD DESDE EL CARRITO
========================================================= */

function increaseQty(productId) {

  const item =
    cart.find(
      p => p.id === productId
    );


  if (!item) {
    return;
  }


  if (
    item.qty >=
    item.stock
  ) {
    alert(
      `Solo hay ${item.stock} unidades disponibles`
    );
    return;
  }


  item.qty++;

  const input =
    document.getElementById(
      `qty-${productId}`
    );


  if (input) {

    input.value =
      item.qty;

  }


  saveCart();
  renderCart();
  updateCartCount();
}


/* =========================================================
   DISMINUIR CANTIDAD DESDE EL CARRITO
========================================================= */

function decreaseQty(productId) {

  const item =
    cart.find(
      p => p.id === productId
    );

  if (!item) {
    return;
  }

  item.qty--;

  if (item.qty <= 0) {

    cart =
      cart.filter(
        p => p.id !== productId
      );

  }

  saveCart();
  renderCart();
  updateCartCount();
}


/* =========================================================
   ELIMINAR PRODUCTO
========================================================= */

function removeItem(productId) {

  cart =
    cart.filter(
      item =>
        item.id !== productId
    );

  saveCart();
  renderCart();
  updateCartCount();

  /* Volver la cantidad de la tarjeta a 0 */

  const input =
    document.getElementById(
      `qty-${productId}`
    );

  if (input) {
    input.value = 0;
  }
}


/* =========================================================
   VACIAR CARRITO
========================================================= */

function clearCart() {

  if (
    !confirm(
      "¿Deseas vaciar el carrito?"
    )
  ) {
    return;
  }

  cart = [];

  saveCart();
  renderCart();
  updateCartCount();

  /* Restablecer cantidades */

  document
    .querySelectorAll(
      ".qty-input"
    )
    .forEach(input => {
      input.value = 0;
    });
}

/* =========================================================
   WHATSAPP
========================================================= */

function sendWhatsAppOrder() {

  if (cart.length === 0) {

    alert(
      "El carrito está vacío."
    );
    return;
  }


  const totals =
    calculateCart();

  let message =
`Hola Karen, te quiero realizar el siguiente pedido:

`;

  cart.forEach(item => {

    const price =
      getProductPrice(
        item.name
      );

    const itemTotal =
      price * item.qty;

    message +=
`🛒 ${item.name}
Cantidad: ${item.qty}
Precio unitario: $${price.toLocaleString()}
Subtotal: $${itemTotal.toLocaleString()}

`;

  });

  message +=
`Subtotal: $${totals.subtotal.toLocaleString()}
Descuento aplicado: ${totals.discountPercent}%`;
  
  if (totals.discount > 0) {
    message +=
`\nAhorro: $${totals.discount.toLocaleString()}`;
  }

  message +=
`\nTotal final: $${totals.total.toLocaleString()}`;

  const url =
`https://wa.me/5491124648528?text=${encodeURIComponent(message)}`;

  window.open(
    url,
    "_blank"
  );
}


/* =========================================================
   ABRIR CARRITO
========================================================= */

const cartIcon =
  document.getElementById(
    "cart-icon"
  );


if (cartIcon) {

  cartIcon.addEventListener(
    "click",
    () => {
      document
        .getElementById("cart")
        .classList.remove(
          "hidden"
        );
    }
  );
}


/* =========================================================
   CERRAR CARRITO
========================================================= */

const closeCart =
  document.getElementById(
    "close-cart"
  );


if (closeCart) {

  closeCart.addEventListener(
    "click",
    () => {

      document
        .getElementById("cart")
        .classList.add(
          "hidden"
        );

    }
  );

}


/* =========================================================
   BUSCADOR
========================================================= */

const search =
  document.getElementById(
    "search"
  );


if (search) {

  search.addEventListener(
    "input",
    filterProducts
  );

}


/* =========================================================
   BOTONES DE CATEGORÍAS
========================================================= */

document
  .querySelectorAll(
    ".filter-btn"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            ".filter-btn"
          )
          .forEach(btn => {

            btn.classList.remove(
              "active"
            );

          });


        button.classList.add(
          "active"
        );


        currentCategory =
          normalizeText(
            button.dataset.category
          );


        /* Si cambia categoría,
           limpiar buscador */

        if (search) {

          search.value = "";

        }


        filterProducts();

      }
    );

  });


/* =========================================================
   BOTÓN TODOS ACTIVO AL INICIAR
========================================================= */

const todosButton =
  document.querySelector(
    '[data-category="todos"]'
  );


if (todosButton) {

  todosButton.classList.add(
    "active"
  );

}

/* =========================================================
   INICIAR
========================================================= */

loadProducts();