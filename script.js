let products = [];

async function loadProducts() {
  const response = await fetch("products.json");
  products = await response.json();
  renderProducts(products);
}

function renderProducts(items) {
  items.sort((a, b) => {
    if (a.stock === 0 && b.stock > 0) return 1;
    if (a.stock > 0 && b.stock === 0) return -1;
    return 0;
  });
  // Ocultar productos sin stock
  let availableProducts = items.filter(product => product.stock > 0);

  // Subir promociones al inicio
  availableProducts.sort((a, b) => {

    const aPromo = a.category.toLowerCase() === "promo";
    const bPromo = b.category.toLowerCase() === "promo";

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
          <div class="color">Color: ${product.Color}</div>
        </div>
      </div>
    `;
  });
}

document.getElementById("search").addEventListener("input", e => {
  const value = e.target.value.toLowerCase();
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(value) ||
    p.category.toLowerCase().includes(value) ||
    p.Color.toLowerCase().includes(value)
  );
  renderProducts(filtered);
});

loadProducts();