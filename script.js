let products = [];
let currentCategory = "todos";

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
        <div class="whatsapp-btn">
          <a
            href="https://wa.me/5491124648528?text=${encodeURIComponent(
              `Hola, me interesa ${product.name} - Precio: $${product.price}`
          )}"
            target="_blank"
       >
            Consultar por WhatsApp
        </a>
      </div>
      </div>
    `;
  });
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