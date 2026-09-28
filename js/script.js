// Array that stores all products
let products = [];

// Used to give each product a unique id
let nextId = 1;

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

// Get the image: the chosen file, or the old image
function getImage() {
  if (productFile.files[0]) {
    return URL.createObjectURL(productFile.files[0]);
  }
  return currentImage;
}

// CREATE
function createProduct() {
  const product = {
    id: nextId,
    name: productName.value,
    price: productPrice.value,
    category: productCategory.value,
    description: productDesc.value,
    image: getImage(),
  };

  products.push(product);
  nextId++;

  resetForm();
  search();
}

// READ (show a list of products as cards)
function displayProducts(list) {
  data.innerHTML = "";

  for (let i = 0; i < list.length; i++) {
    const p = list[i];

    data.innerHTML += `
      <div class="bg-white rounded-2xl shadow-sm ring-1 ring-zinc-200 overflow-hidden flex flex-col">
        <img src="${p.image}" alt="${p.name}" class="w-full h-44 object-contain bg-zinc-200">
        <div class="p-4 flex flex-col flex-1">
          <span class="self-start text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">${p.category}</span>
          <h2 class="text-lg font-semibold mt-2">${p.name}</h2>
          <p class="text-zinc-600 text-sm mt-1 flex-1">${p.description}</p>
          <p class="text-emerald-600 font-bold text-xl mt-3">$${p.price}</p>
          <div class="flex gap-2 mt-4">
            <button onclick="updateOne(${p.id})"
              class="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg">
              Edit
            </button>
            <button onclick="deleteProduct(${p.id})"
              class="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-lg">
              Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }
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
  addBtn.classList.add("hidden");
  updateBtn.classList.remove("hidden");
}

// UPDATE step 2: save the new data
function updateTwo() {
  for (let i = 0; i < products.length; i++) {
    if (products[i].id === editingId) {
      products[i].name = productName.value;
      products[i].price = productPrice.value;
      products[i].category = productCategory.value;
      products[i].description = productDesc.value;
      products[i].image = getImage();
    }
  }

  resetForm();
  search();
}

// DELETE
function deleteProduct(id) {
  const newProducts = [];

  for (let i = 0; i < products.length; i++) {
    if (products[i].id !== id) {
      newProducts.push(products[i]);
    }
  }

  products = newProducts;
  search();
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

  updateBtn.classList.add("hidden");
  addBtn.classList.remove("hidden");
}
