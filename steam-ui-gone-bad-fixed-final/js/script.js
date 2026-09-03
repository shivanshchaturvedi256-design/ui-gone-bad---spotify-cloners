let cart = [];

function addToCart(name, price) {
    const buttons = [...document.querySelectorAll(".game button")];
    const button = buttons.find(b => b.dataset.targetName === name);

    if (button && (button.dataset.unlocked || isPurchased(name))) return;

    // Keep the intentionally annoying 4-click interaction.
    let count = Number(button?.dataset.clicks || 0) + 1;
    if (button) button.dataset.clicks = count;
    updateCounter(count);

    if (count < 4) {
        fleeButton(button);
        button.textContent = "NOPE — " + count + "/4";
        status("CLICK " + count + " FAILED. THE BUTTON HAS MOVED.");
        return;
    }

    cart.push({name, price});
    renderCart();
    status("ADDED: " + name + " — exactly on click #4.");
    if (button) {
        button.textContent = "ADDED (FINALLY)";
        button.dataset.unlocked = "true";
    }
    updateCounter(4);

    if (price === 0) {
        document.getElementById("beggarOverlay").style.display = "flex";
    }
}

function renderCart() {
    const box = document.getElementById("cartItems");
    const topBox = document.getElementById("topCartItems");
    const payBtn = document.getElementById("paymentBtn");
    document.getElementById("topCartCount").textContent = cart.length;

    if (!cart.length) {
        box.textContent = "Cart is empty. Like your patience.";
        topBox.textContent = "Cart is empty. Like your patience.";
        payBtn.style.display = "none";
        return;
    }

    const listHtml = cart.map((item, i) =>
        `${i + 1}. ${item.name} — ${item.price === 0 ? "FREE" : "$" + item.price.toFixed(2)}`
    ).join("<br>");
    const total = cart.reduce((sum, x) => sum + x.price, 0);

    box.innerHTML = listHtml + `<hr>TOTAL: $${total.toFixed(2)}`;
    topBox.innerHTML = listHtml + `<hr>TOTAL: $${total.toFixed(2)}`;

    payBtn.style.display = "block";
    payBtn.textContent = "PAY $" + total.toFixed(2) + " NOW";
}

function fakePayment() {
    if (!cart.length) return;
    const total = cart.reduce((sum, x) => sum + x.price, 0);
    document.getElementById("paymentSummary").textContent =
        "Confirming a demo purchase for $" + total.toFixed(2) + ".";
    document.getElementById("demoPaymentId").value = "";
    document.getElementById("paymentOverlay").style.display = "flex";
    setTimeout(() => document.getElementById("demoPaymentId").focus(), 0);
}

function closePaymentModal() {
    document.getElementById("paymentOverlay").style.display = "none";
}

function completePayment() {
    const demoId = document.getElementById("demoPaymentId").value.trim();
    if (!demoId) {
        status("PAYMENT FAILED: ENTER A DEMO PAYMENT ID.");
        return;
    }

    const purchasedNames = getPurchasedGames();
    cart.forEach(item => {
        if (!purchasedNames.includes(item.name)) purchasedNames.push(item.name);
    });
    localStorage.setItem("steamPurchasedGames", JSON.stringify(purchasedNames));
    closePaymentModal();

    // Refresh the whole page; purchased state is restored from localStorage.
    location.reload();
}

function getPurchasedGames() {
    try {
        const saved = JSON.parse(localStorage.getItem("steamPurchasedGames") || "[]");
        return Array.isArray(saved) ? saved : [];
    } catch {
        localStorage.removeItem("steamPurchasedGames");
        return [];
    }
}

function isPurchased(name) {
    return getPurchasedGames().includes(name);
}

function restorePurchasedState() {
    document.querySelectorAll(".game").forEach(card => {
        const name = card.dataset.name;
        if (!isPurchased(name)) return;
        const button = card.querySelector("button");
        const label = card.querySelector(".purchase-status");
        if (label) { label.textContent = "BOUGHT"; label.classList.add("bought"); }
        if (button) {
            button.disabled = true;
            button.textContent = "ADD TO CART";
            button.dataset.unlocked = "true";
        }
    });
}

function toggleTopCart(){
    document.getElementById("topCartDropdown").classList.toggle("open");
}

function clearCart() {
    cart = [];
    renderCart();
    document.querySelectorAll(".game button").forEach(btn => {
        btn.dataset.clicks = "0";
        delete btn.dataset.unlocked;
        btn.textContent = "ADD TO CART";
        btn.classList.remove("cart-flee");
        btn.style.position = "";
        btn.style.left = "";
        btn.style.top = "";
        btn.style.width = "";
        btn.style.transform = "";
    });
    updateCounter(0);
    status("CART DELETED. You may now question your decisions.");
}

function checkout() {
    if (!cart.length) {
        status("CHECKOUT FAILED: there is nothing to buy. Incredible.");
        return;
    }
    status("CHECKOUT CLICKED. Redirecting... actually no. Cart is still here.");
}

function status(message) {
    document.getElementById("status").textContent = "SYSTEM STATUS: " + message;
}

function applyFilters() {
    const query = document.getElementById("search").value.toLowerCase().trim();
    const freeOnly = document.querySelectorAll(".filter input")[0]?.checked;
    const popularOnly = document.querySelectorAll(".filter input")[1]?.checked;
    const popularGames = new Set([
        "Half-Life 3", "Portal 2", "Counter Strike 2", "Terraria", "Left 4 Dead 2"
    ]);

    document.querySelectorAll(".game").forEach(card => {
        const name = card.dataset.name;
        const price = Number(card.dataset.price);
        const matchesSearch = name.toLowerCase().includes(query);
        const matchesFree = !freeOnly || price === 0;
        const matchesPopular = !popularOnly || popularGames.has(name);
        card.style.display = matchesSearch && matchesFree && matchesPopular ? "" : "none";
    });

    if (freeOnly || popularOnly) {
        const active = [freeOnly && "Free-ish", popularOnly && "Popular-ish"].filter(Boolean).join(" + ");
        status("FILTER ACTIVE: " + active + (query ? " | SEARCH: " + query : ""));
    } else {
        status(query ? "SEARCHING FOR: " + query : "FILTERS RESET.");
    }
}

function searchGames() {
    applyFilters();
}

function filterGames() {
    applyFilters();
}

function surpriseMe() {
    const cards = [...document.querySelectorAll(".game")];
    if (!cards.length) {
        status("SURPRISE FAILED: NO GAMES MATCH THE CURRENT FILTER.");
        return;
    }
    const card = cards[Math.floor(Math.random() * cards.length)];
    card.scrollIntoView({behavior:"smooth", block:"center"});
    card.style.transform = "rotate(8deg) scale(1.05)";
    setTimeout(() => card.style.transform = "", 700);
    status("SURPRISE: " + card.dataset.name);
}

restorePurchasedState();
renderCart();

let lastMove = 0;

function annoy(){
    status("COMMUNITY IS CURRENTLY BEING RENOVATED. PLEASE TRY STORE.");
    document.querySelector(".announcement").textContent =
        "COMMUNITY → STORE → COMMUNITY → STORE. Please choose carefully.";
}

document.querySelectorAll(".game button").forEach(btn=>{
    btn.addEventListener("mouseenter",()=>{
        if(Date.now()-lastMove < 1200) return;
        lastMove = Date.now();
        const r = btn.getBoundingClientRect();
        // Small, annoying relocation instead of making the button impossible.
        btn.style.transform = "translateX(10px)";
        setTimeout(()=>btn.style.transform="",550);
    });
});

document.querySelectorAll(".filter").forEach((label,i)=>{
    label.addEventListener("mouseenter",()=>{
        if(i===3) label.style.marginLeft = (Math.random()*35)+"px";
    });
});

window.addEventListener("scroll",()=>{
    const cart=document.querySelector(".cart-panel");
    if(window.scrollY>250){
        cart.style.right = "calc(7px + " + (Math.sin(window.scrollY/70)*18) + "px)";
    }
});

/* ===== 4-CLICK FLEEING BUTTONS ===== */
function fleeButton(button){
    const rect = button.getBoundingClientRect();
    button.classList.add("cart-flee");
    const maxX = Math.max(10, window.innerWidth - rect.width - 15);
    const maxY = Math.max(80, window.innerHeight - rect.height - 15);
    button.style.left = Math.floor(10 + Math.random()*maxX) + "px";
    button.style.top = Math.floor(70 + Math.random()*(maxY-70)) + "px";
    button.style.width = Math.max(120, rect.width) + "px";
    button.style.transform = "rotate(" + (Math.random()*18-9) + "deg)";
}

function updateCounter(n){
    document.getElementById("clickCounter").textContent =
        "ADD TO CART CLICKS: " + Math.min(n,4) + " / 4";
}

function beggarContinue(){
    document.getElementById("beggarOverlay").style.display = "none";
    status("FINE. YOU KEPT THE FREE GAME. THE BEGGAR HAS BEEN TOLERATED.");
}

/* ===== RANDOM POPUPS, STARTING GENTLY ===== */
const popupMessages = [
    ["STEAM SECURITY", "We noticed absolutely nothing suspicious."],
    ["FRIEND REQUEST", "Someone you don't know wants to be your friend."],
    ["UPDATE REQUIRED", "Update is 0% complete. Please wait forever."],
    ["IMPORTANT NOTICE", "This notice is not important."],
    ["COOKIE SETTINGS", "We have 47 cookies. You cannot have them."],
    ["SPECIAL OFFER", "Buy this thing you didn't ask for."],
    ["SYSTEM MESSAGE", "Have you tried clicking somewhere else?"],
    ["CONNECTION", "Connection is probably connected."],
    ["ADVERTISEMENT", "ADVERTISEMENT: You are still here."],
    ["STEAM WORKSHOP", "Workshop has stopped working successfully."]
];

let popupCount = 0;
function spawnPopup(){
    if(popupCount >= 22) return;
    popupCount++;

    const p = document.createElement("div");
    p.className = "bad-popup";
    const msg = popupMessages[Math.floor(Math.random()*popupMessages.length)];
    p.innerHTML = "<strong>"+msg[0]+"</strong>"+msg[1]+
        '<br><br><button onclick="this.parentElement.remove()">OK</button>';
    p.style.left = Math.floor(Math.random()*Math.max(1,window.innerWidth-230))+"px";
    p.style.top = Math.floor(90+Math.random()*Math.max(1,window.innerHeight-180))+"px";
    document.getElementById("popupLayer").appendChild(p);

    // Slowly increases the annoyance.
    setTimeout(spawnPopup, Math.max(1200, 7000 - popupCount*260));
}
setTimeout(spawnPopup, 5000);

/* ===== FAKE "YOU'VE BEEN HACKED" EVENT ===== */
let hackTriggered = false;
function triggerHack(){
    if(hackTriggered) return;
    hackTriggered = true;
    document.getElementById("hackOverlay").style.display = "flex";

    setTimeout(()=>{
        document.getElementById("hackOverlay").style.display = "none";
        document.getElementById("blankOverlay").style.display = "block";

        setTimeout(()=>{
            document.getElementById("blankOverlay").style.display = "none";
            status("SYSTEM RESTORED. NOTHING WAS STOLEN. PROBABLY.");
            hackTriggered = false;
        },2000);
    },2400);
}
setTimeout(triggerHack, 26000);

/* ===== ROTATE THE WHOLE PAGE ANTICLOCKWISE EVERY 10 SECONDS ===== */
let rotationDeg = 0;

document.documentElement.style.transformOrigin = "center center";

function rotatePage(){
    rotationDeg -= 90; // anticlockwise
    document.documentElement.style.transform = "rotate(" + rotationDeg + "deg)";
    status("SCHEDULED ROTATION. ANTICLOCKWISE. NO, YOU CAN'T STOP IT.");
}

setInterval(rotatePage, 20000);

/* ===== REVERSE GAME NAME SPELLING EVERY 3 SECONDS ===== */
let namesReversed = false;
function toggleGameNames(){
    namesReversed = !namesReversed;
    document.querySelectorAll(".game h4").forEach(h4=>{
        if(!h4.dataset.original) h4.dataset.original = h4.textContent;
        h4.textContent = namesReversed
            ? h4.dataset.original.split("").reverse().join("")
            : h4.dataset.original;
    });
}
setInterval(toggleGameNames, 3000);

/* ===== GAME BOXES ROTATE 90° (RANDOM CW/ACW) EVERY 3 SECONDS ===== */
function rotateGameBoxes(){
    document.querySelectorAll(".game").forEach(card=>{
        const current = Number(card.dataset.rotation || 0);
        const direction = Math.random() < 0.5 ? -1 : 1; // -1 = ACW, 1 = CW
        const next = current + direction * 90;
        card.dataset.rotation = next;
        card.style.transition = "transform .4s ease";
        card.style.transform = "rotate(" + next + "deg)";
    });
}
setInterval(rotateGameBoxes, 3000);

/* ===== FULL SCREEN WHITEOUT — EVERY 15 SECONDS, FOR 1 SECOND ===== */
function whiteout(){
    const overlay = document.getElementById("whiteoutOverlay");
    overlay.style.display = "block";
    setTimeout(()=>{ overlay.style.display = "none"; }, 1000);
}
setInterval(whiteout, 12000);

/* ===== EXTRA LITTLE ANNOYANCES ===== */
document.querySelectorAll(".game").forEach((card)=>{
    card.addEventListener("mouseenter",()=>{
        if(Math.random()<0.35){
            card.style.marginLeft = (Math.random()*24-12)+"px";
            setTimeout(()=>card.style.marginLeft="",800);
        }
    });
});

// Make the first button positions settle normally until clicked.
document.querySelectorAll(".game button").forEach(b=>{
    b.dataset.clicks="0";
});
