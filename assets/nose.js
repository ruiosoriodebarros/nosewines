/* No Sé! — comportamento partilhado por todas as páginas (cesto, grelha, reveal) */
"use strict";

var eur = function (v) { return v.toFixed(2).replace(".", ",") + " €"; };
var CART_KEY = "nose-cart-v1";
var byId = function (id) { return PRODUCTS.find(function (p) { return p.id === id; }); };

/* ---- Cesto: persiste entre páginas ----
   Guardamos apenas {id, qty}. Guardar o produto inteiro meteria a imagem
   dentro do localStorage e estouraria a quota (~5MB) em poucos artigos. */
function loadCart() {
  try {
    var raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    var arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(function (l) { return l && byId(l.id) && l.qty > 0; })
      .map(function (l) { return { id: l.id, qty: Math.min(99, Math.floor(l.qty)) }; });
  } catch (e) { return []; }
}
function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* modo privado */ }
}

var cart = loadCart();

function addToCart(id) {
  var line = cart.find(function (l) { return l.id === id; });
  if (line) { line.qty++; } else { cart.push({ id: id, qty: 1 }); }
  saveCart();
  renderCart();
}
function chQty(id, d) {
  var line = cart.find(function (l) { return l.id === id; });
  if (!line) return;
  line.qty += d;
  if (line.qty <= 0) cart = cart.filter(function (l) { return l.id !== id; });
  saveCart();
  renderCart();
}
function cartTotal() {
  return cart.reduce(function (s, l) { return s + byId(l.id).price * l.qty; }, 0);
}

function renderCart() {
  var count = document.getElementById("cart-count");
  if (count) count.textContent = cart.reduce(function (s, l) { return s + l.qty; }, 0);

  var box = document.getElementById("drawer-items");
  var foot = document.getElementById("drawer-foot");
  if (!box || !foot) return;

  if (!cart.length) {
    box.innerHTML = '<p class="drawer-empty">Ainda não sabes o que queres?<br>Nós também não. Faz parte.</p>';
    foot.style.display = "none";
    return;
  }
  box.innerHTML = "";
  cart.forEach(function (l) {
    var p = byId(l.id);
    var el = document.createElement("div");
    el.className = "d-item";
    el.innerHTML =
      '<img src="' + p.img + '" alt="">' +
      '<div>' +
        '<p class="d-name">' + p.name + '</p>' +
        '<p class="d-var">' + p.variant + '</p>' +
        '<div class="d-qty">' +
          '<button aria-label="Menos" onclick="chQty(\'' + p.id + '\',-1)">−</button>' +
          '<span>' + l.qty + '</span>' +
          '<button aria-label="Mais" onclick="chQty(\'' + p.id + '\',1)">+</button>' +
        '</div>' +
      '</div>' +
      '<span class="d-price">' + eur(p.price * l.qty) + '</span>';
    box.appendChild(el);
  });
  document.getElementById("cart-total").textContent = eur(cartTotal());
  foot.style.display = "block";
}

function toggleCart(open) {
  var isOpen = document.body.classList.contains("cart-open");
  document.body.classList.toggle("cart-open", open === undefined ? !isOpen : open);
}

function checkout() {
  if (!cart.length) return;
  var lines = cart.map(function (l) {
    var p = byId(l.id);
    return l.qty + "× " + p.name + " (" + p.variant + ") - " + eur(p.price * l.qty);
  }).join("%0D%0A");
  location.href = "mailto:ola@nose.pt?subject=Encomenda No Sé!&body=Olá!%0D%0A%0D%0AQuero encomendar:%0D%0A" +
    lines + "%0D%0A%0D%0ATotal: " + eur(cartTotal()) + "%0D%0A%0D%0ANome:%0D%0AMorada:%0D%0ATelefone:";
}

/* Cesto sincronizado entre separadores abertos */
window.addEventListener("storage", function (e) {
  if (e.key === CART_KEY) { cart = loadCart(); renderCart(); }
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") toggleCart(false);
});

/* ---- Grelha da loja (só existe em loja.html) ---- */
var grid = document.getElementById("grid");
if (grid) {
  var renderGrid = function (cat) {
    cat = cat || "todos";
    grid.innerHTML = "";
    PRODUCTS.filter(function (p) { return cat === "todos" || p.cat === cat; }).forEach(function (p) {
      var card = document.createElement("article");
      card.className = "card reveal on";
      card.innerHTML =
        '<div class="card-img">' +
          '<img src="' + p.img + '" alt="' + p.name + ' ' + p.variant + '" loading="lazy">' +
          (p.hover ? '<img class="hover" src="' + p.hover + '" alt="" loading="lazy" aria-hidden="true">' : '') +
        '</div>' +
        '<div class="card-body">' +
          '<p class="card-name">' + p.name + '</p>' +
          '<p class="card-var">' + p.variant + '</p>' +
          '<div class="card-foot">' +
            '<span class="price">' + eur(p.price) + '</span>' +
            '<button class="add" data-id="' + p.id + '">Adicionar</button>' +
          '</div>' +
        '</div>';
      grid.appendChild(card);
    });
  };
  renderGrid();

  document.querySelectorAll(".filter").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".filter").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      renderGrid(b.dataset.cat);
    });
  });

  grid.addEventListener("click", function (e) {
    var btn = e.target.closest(".add");
    if (!btn) return;
    addToCart(btn.dataset.id);
    btn.textContent = "No cesto ✓";
    btn.classList.add("added");
    setTimeout(function () {
      btn.textContent = "Adicionar";
      btn.classList.remove("added");
    }, 1200);
  });
}

/* ---- Newsletter (só existe em vinho.html) ---- */
var news = document.getElementById("news-form");
if (news) {
  news.addEventListener("submit", function (e) {
    e.preventDefault();
    news.style.display = "none";
    document.getElementById("news-ok").style.display = "block";
  });
}

/* ---- Cabeçalho sobre o hero: transparente e claro, até sair da imagem ---- */
var hero = document.querySelector(".hero");
var cabecalho = document.querySelector("header");
if (hero && cabecalho) {
  // A altura do cabeçalho muda quando as fontes carregam, por isso medimo-la
  // em vez de a fixar: o hero usa-a para subir para debaixo dele.
  var medeHeader = function () {
    document.documentElement.style.setProperty("--header-h", cabecalho.offsetHeight + "px");
  };
  var sincronizaHeader = function () {
    var limite = hero.offsetHeight - cabecalho.offsetHeight;
    document.body.classList.toggle("hero-top", window.scrollY < limite);
  };
  medeHeader();
  sincronizaHeader();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { medeHeader(); sincronizaHeader(); });
  }
  window.addEventListener("scroll", sincronizaHeader, { passive: true });
  window.addEventListener("resize", function () { medeHeader(); sincronizaHeader(); });
}

/* ---- Reveal on scroll ---- */
var io = new IntersectionObserver(function (es) {
  es.forEach(function (x) {
    if (x.isIntersecting) { x.target.classList.add("on"); io.unobserve(x.target); }
  });
}, { threshold: .12 });
document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

renderCart();
