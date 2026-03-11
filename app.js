document.addEventListener('DOMContentLoaded',async () => {
    try{
        const response = await fetch('data.json');
        if(!response.ok) throw new Error("Failed to fetch product data");
        const products = await response.json()
        console.log("Fetched products",products);
        renderProducts(products);
    } catch(error){
        console.error("Error fetching products",error)
    }
});

//====GLOBAL STATE====
const productCardElements = new Map();//stores product card elements by product name
const cart = new Map();//Use Map for fast lookup by product name 

// DOM element caching
const productlist = document.getElementById('product-list'), 
cartContainer = document.getElementById('cart'),
cartTextNumber = document.getElementById('cart-text-number'),
orderModal = document.getElementById('order-modal'),
orderDetailsDiv = document.getElementById("order-details");

//PRODUCT CARD
function createProductCard(product){
    const card = document.createElement('div')
    card.className = 'product-card';
    card.dataset.productName = product.name;

    card.innerHTML = `<img src="${product.image?.desktop}" alt="${product.name}" class="product-image" loading="lazy">
    <span class="product-category">${product.category}</span>
    <h4 class="product-name">${product.name}</h4>
    <p class="product-price">$${product.price.toFixed(2)}</p>`;

    const button = document.createElement('button')
    button.className = 'add-to-cart-button';
    button.innerHTML = "<img src='/assets/images/icon-add-to-cart.svg' alt='carticon'>Add to Cart";
    button.addEventListener('click',()=> addToCart(product,1));

    card._addToCartButton = button;
    card.appendChild(button);
    productCardElements.set(product.name,card);

    return card;
}

function renderProducts(products){
    if(!productlist) return console.error('No product-list element found');
    products.forEach(product => productlist.appendChild(createProductCard(product)))
}

//CART LOGIC
function addToCart(product,quantity){
    const item = cart.get(product.name)
    if(item){
        item.quantity += quantity;
    } else{
        cart.set(product.name,{product,quantity});
    }
    updateProductCardCounter(product);
    displayCart();
}

function updateCart(product,quantity){
    if(cart.has(product.name)){
        cart.get(product.name).quantity = quantity;
        updateProductCardCounter(product);
        displayCart();
    }
}

function removeFromCart(product){
    if(cart.delete(product.name)){
        resetProductCardToAddToCart(product.name);
        displayCart();
        updateCartTextNumber(getCartItemCount())
    }
}

function getCartItemCount(){
    let total = 0;
    for(const item of cart.values()) total += item.quantity;
    return total;
}

//COUNTER
function updateProductCardCounter(product){
    const productCard = productCardElements.get(product.name);
    if(!productCard) return;

    const existingCounter = productCard.querySelector('.quantity-counter')
    const existingButton = productCard.querySelector('.add-to-cart-button');
    const cartItem = cart.get(product.name);

    if(cartItem){
        let counter = existingCounter;
        let quantitySpan;

        if(!counter){
            counter = document.createElement('div')
            counter.className = 'quantity-counter';
            const minus = document.createElement('button');
            minus.innerHTML = `-`;
            minus.className = 'minus-button'
            const plus = document.createElement('button');
            plus.innerHTML = `+`;
            plus.className = 'plus-button';

            quantitySpan = document.createElement('span');
            quantitySpan.className = 'quantity';
            minus.addEventListener('click',()=> {
                let count = parseInt(quantitySpan.textContent);
                count > 1 ? updateCart(product,count-1):removeFromCart(product)
            })
            plus.addEventListener('click',()=> {
                let count = parseInt(quantitySpan.textContent);
                updateCart(product,count+1);
            });

            counter.append(minus,quantitySpan,plus);

            if(existingButton){
                existingButton.replaceWith(counter)
            } else{
                productCard.appendChild(counter)
            }

        } else{
            quantitySpan = counter.querySelector('.quantity');
        }

        quantitySpan.textContent = cartItem.quantity
    } else if(existingCounter){
        existingCounter.replaceWith(productCard._addToCartButton);
    }
}

function resetProductCardToAddToCart(productName){
    const productCard = productCardElements.get(productName);

    if(!productCard) return;

    const counter = productCard.querySelector('.quantity-counter');
    const button = productCard._addToCartButton;

    if(counter && button) counter.replaceWith(button);
}

//DISPLAY CART
function displayCart(){
    if(!cartContainer) return
    console.error('No #cart element found')
    cartContainer.innerHTML = '';
    if(cart.size === 0){
        return cartContainer.innerHTML = '<img src="assets/images/illustration-empty-cart.svg"/><p>Your added items would appear here</p>'

       
    }

     let total = 0;
        let totalItems=0;

        for(const {product,quantity} of cart.values()){
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            const itemTotal = product.price*quantity;

            total += itemTotal;
            totalItems += quantity;
            itemElement.innerHTML = `<div class="cart-item-text">
            <h4 class="cart-item-name">${product.name}</h4>
            <div class="cart-item-qty-price"><span class="cart-item-quantity">${quantity}</span>
            <p class="cart-item-price">@${product.price.toFixed(2)}</p>
            <p class="cart-item-total">$${itemTotal.toFixed(2)}</p>
            </div>
            </div>
            <div class="cart-item-remove-btn-container">
            <button class="cart-item-remove-btn"><img src="assets/images/icon-remove-item.svg"></button>
            </div>
            `;
            itemElement.querySelector('.cart-item-remove-btn').addEventListener("click",()=> removeFromCart(product));
            cartContainer.appendChild(itemElement);
            
        }

        updateCartTextNumber(totalItems);

        const cartTotalElement = document.createElement('div');
        cartTotalElement.id = 'cart-total';
        cartTotalElement.innerHTML = `<p>Order Total</p>
        <span>$${total.toFixed(2)}</span>`;
        cartContainer.appendChild(cartTotalElement);

        const orderNote = document.createElement('div');
        orderNote.className = "order-note"
        orderNote.innerHTML = `<img src="assets/images/icon-carbon-neutral.svg" alt="carbon neutral icon">
        <p>This is a <strong>carbon neutral</strong> delivery</p>`;

        const confirmOrderBtn = document.createElement('button');
        confirmOrderBtn.id = 'confirm-order-btn';
        confirmOrderBtn.textContent = "Confirm Order";
        confirmOrderBtn.addEventListener('click',showOrderModal);

        cartContainer.append(orderNote,confirmOrderBtn);
}


function updateCartTextNumber(totalItems){
    if(cartTextNumber){
        cartTextNumber.textContent = `(${totalItems})`
    }
}

//ORDER MODAL
function showOrderModal(){
    if(!orderModal || !orderDetailsDiv) return console.error("Modal or order details div not found");

    orderDetailsDiv.innerHTML = '';
    document.getElementById("modal-overlay").style.display = "flex";

    let totalItemPrice = 0;

    for(const {product,quantity} of cart.values()){
        const itemTotal = product.price * quantity;
        totalItemPrice += itemTotal;

        const itemDiv = document.createElement("div");
        itemDiv.className = "order-item";
        itemDiv.innerHTML = `<img src="${product.image.thumbnail}" alt="${product.name}">
        <div>
          <h4>${product.name}</h4>
          <div>
            <span>${quantity}x</span>
            <p>${product.price.toFixed(2)}</p>
          </div>
        </div>
        <div class="order-item-total">$${itemTotal.toFixed(2)}</div>`;
        orderDetailsDiv.appendChild(itemDiv);
        
    }

    //Add total summary
    const totalDiv = document.createElement('div');
    totalDiv.className = "order-total";
    totalDiv.innerHTML = `<div class="order-total-text">
    <span>Order Total</span>
    <span>$${totalItemPrice.toFixed(2)}</span>
    </div>`;
    orderDetailsDiv.appendChild(totalDiv);
    orderModal.classList.remove('hidden');
}

//NEW ORDER RESET
document.getElementById("start-new-order-btn")?.addEventListener("click",()=>{
    //remove modal overlay
    document.getElementById("modal-overlay").style.display = "none"

    //reset product cards UI
    cart.forEach(item=> {
        resetProductCardToAddToCart(item.product.name);
    });

    //clear cart data
    cart.clear();

    //Rerender the cart
    displayCart()

    //Hide the modal
    document.getElementById("order-modal").classList.add('hidden');

    //Reset cart text number
    updateCartTextNumber(0);


});



