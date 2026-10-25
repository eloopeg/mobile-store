// Array that stores all products
const STORAGE_KEY = "eloopProducts";

let products = [];
try {
  products = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
} catch (e) {
  products = [];
}

// Used to give each product a unique id (continues after the biggest saved id)
let nextId = products.reduce((max, p) => Math.max(max, p.id), 0) + 1;

// Save the products to localStorage
function saveProducts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    Swal.fire({
      icon: "error",
      title: "Storage is full",
      text: "Could not save the products in the browser. Try smaller images.",
      confirmButtonColor: "#e11d2e",
    });
  }
}

// The id of the product being edited (null means we are adding)
let editingId = null;

// The image of the product being edited (kept if no new file is chosen)
let currentImage = "";

// Get elements from the page
const productName = document.getElementById("productName");
const productPrice = document.getElementById("productPrice");
const productCategory = document.getElementById("productCategory");
const productDesc = document.getElementById("productDesc");
const productFile = document.getElementById("productFile");
const searchInput = document.getElementById("searchInput");
const data = document.getElementById("data");
const addBtn = document.getElementById("addBtn");
const updateBtn = document.getElementById("updateBtn");

// Escape text so it is safe to put inside HTML
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Get the image: the chosen file, or the old image
// Read the file as a (resized) data URL so it can live in localStorage
function fileToDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const maxSize = 600;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };

      img.onerror = () => resolve(reader.result);
      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

async function getImage() {
  if (productFile.files[0]) {
    return await fileToDataURL(productFile.files[0]);
  }
  return currentImage;
}

// ---------- VALIDATION (silent: no alerts, no change in the inputs' look) ----------

// Matches any digit (English 0-9 or Arabic-Indic ٠-٩)
const digitsRegex = /[0-9\u0660-\u0669]/;
const digitsRegexGlobal = /[0-9\u0660-\u0669]/g;

// Returns true if everything is filled and valid, otherwise false (nothing is shown)
function validateForm() {
  const name = productName.value.trim();
  const price = productPrice.value.trim();
  const category = productCategory.value.trim();
  const description = productDesc.value.trim();

  // Every input must be filled (the old image is enough when editing)
  if (name === "" || price === "" || category === "" || description === "") {
    return false;
  }
  if (!productFile.files[0] && !currentImage) {
    return false;
  }

  // No numbers in category / description (the name can contain numbers)
  if (digitsRegex.test(category) || digitsRegex.test(description)) {
    return false;
  }

  // Price must be a number greater than 0
  if (!/^\d+(\.\d+)?$/.test(price) || Number(price) <= 0) {
    return false;
  }

  return true;
}

// Numbers can't be typed in category / description
[productCategory, productDesc].forEach((input) => {
  input.addEventListener("input", () => {
    input.value = input.value.replace(digitsRegexGlobal, "");
  });
});

// CREATE
async function createProduct() {
  if (!validateForm()) return;

  const image = await getImage();

  const product = {
    id: nextId,
    name: productName.value,
    price: productPrice.value,
    category: productCategory.value,
    description: productDesc.value,
    image: image,
  };

  products.push(product);
  nextId++;
  saveProducts();

  resetForm();
  search();

  Swal.fire({
    icon: "success",
    title: "Product Added",
    text: `"${product.name}" was added successfully.`,
    confirmButtonColor: "#e11d2e",
    timer: 2000,
    timerProgressBar: true,
  });
}

// READ (show a list of products as cards)
function displayProducts(list) {
  let cards = "";

  for (let i = 0; i < list.length; i++) {
    const p = list[i];

    const name = escapeHTML(p.name);
    const category = p.category
      ? `<span class="product-category"><i class="bi bi-tag-fill"></i>${escapeHTML(p.category)}</span>`
      : `<span></span>`;
    const description = p.description
      ? `<p class="product-desc mb-0">${escapeHTML(p.description)}</p>`
      : `<p class="product-desc mb-0 fst-italic">No description</p>`;
    const image = p.image
      ? `<img src="${p.image}" alt="${name}" class="card-img-top bg-light" style="object-fit: contain;">`
      : `<div class="d-grid place-items-center bg-light text-muted" style="height:200px;place-items:center;"><i class="bi bi-image display-4"></i></div>`;

    cards += `
      <div class="col">
        <div class="card h-100">
          ${image}
          <div class="card-body d-flex flex-column gap-2">
            <div class="d-flex justify-content-between align-items-center gap-2">
              ${category}
              <span class="product-price">$${escapeHTML(p.price)}</span>
            </div>
            <h5 class="card-title fw-bold mb-0">${name}</h5>
            ${description}
          </div>
          <div class="card-footer bg-white border-0 d-flex gap-2 pb-3">
            <button onclick="updateOne(${p.id})" class="btn-edit">
              <i class="bi bi-pencil-square"></i> Edit
            </button>
            <button onclick="deleteProduct(${p.id})" class="btn-delete">
              <i class="bi bi-trash3"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }

  data.innerHTML = cards;
}

// SEARCH by name (also used to show the products)
function search() {
  const text = searchInput.value.toLowerCase();
  const result = [];

  for (let i = 0; i < products.length; i++) {
    if (products[i].name.toLowerCase().includes(text)) {
      result.push(products[i]);
    }
  }

  displayProducts(result);
}

// UPDATE step 1: fill the form with the product's data
function updateOne(id) {
  for (let i = 0; i < products.length; i++) {
    if (products[i].id === id) {
      productName.value = products[i].name;
      productPrice.value = products[i].price;
      productCategory.value = products[i].category;
      productDesc.value = products[i].description;
      productFile.value = "";
      currentImage = products[i].image;
    }
  }

  editingId = id;
  document.getElementById("statMode").textContent = "Editing a product";

  // Scroll up to the form so the user sees the data
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// UPDATE step 2: save the new data
async function updateTwo() {
  // Nothing selected for editing: do nothing
  if (editingId === null) return;

  if (!validateForm()) return;

  const image = await getImage();

  for (let i = 0; i < products.length; i++) {
    if (products[i].id === editingId) {
      products[i].name = productName.value;
      products[i].price = productPrice.value;
      products[i].category = productCategory.value;
      products[i].description = productDesc.value;
      products[i].image = image;
    }
  }

  saveProducts();
  resetForm();
  search();

  Swal.fire({
    icon: "success",
    title: "Product Updated",
    text: "The changes were saved successfully.",
    confirmButtonColor: "#0b1f3a",
    timer: 2000,
    timerProgressBar: true,
  });
}

// DELETE
function deleteProduct(id) {
  // Ask for confirmation first
  Swal.fire({
    icon: "warning",
    title: "Delete this product?",
    text: "This action cannot be undone.",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#e11d2e",
    cancelButtonColor: "#0b1f3a",
  }).then((result) => {
    if (!result.isConfirmed) return;

    const newProducts = [];

    for (let i = 0; i < products.length; i++) {
      if (products[i].id !== id) {
        newProducts.push(products[i]);
      }
    }

    products = newProducts;
    saveProducts();

    // If the deleted product was being edited, reset the form
    if (editingId === id) {
      resetForm();
    }

    search();

    Swal.fire({
      icon: "success",
      title: "Deleted",
      text: "The product was deleted successfully.",
      confirmButtonColor: "#0b1f3a",
      timer: 1800,
      timerProgressBar: true,
    });
  });
}

// Clear the form and go back to "Add Product" mode
function resetForm() {
  productName.value = "";
  productPrice.value = "";
  productCategory.value = "";
  productDesc.value = "";
  productFile.value = "";
  currentImage = "";
  editingId = null;

  document.getElementById("statMode").textContent = "Adding new product";
}

// Show the saved products when the page loads
search();
