console.log("🛒 소비자 페이지(반응형) 로딩 완료");

// 장바구니 상태
let cart = [];

// 카카오 주소 API
function execDaumPostcode() {
  new daum.Postcode({
    oncomplete: function (data) {
      document.getElementById("road").value = data.roadAddress || "";
      document.getElementById("jibun").value = data.jibunAddress || "";
      document.getElementById("zipcode").value = data.zonecode || "";
      document.getElementById("detail").focus();
    },
  }).open();
}

// 장바구니 담기
function addToCart() {
  const product = document.getElementById("product").value.trim();
  const quantity = Math.max(1, parseInt(document.getElementById("quantity").value || "1", 10));

  if (!product) {
    alert("상품을 선택해주세요.");
    return;
  }

  const found = cart.find((i) => i.product === product);
  if (found) found.quantity += quantity;
  else cart.push({ product, quantity });

  renderCart();
  document.getElementById("product").value = "";
  document.getElementById("quantity").value = "1";
}

// 장바구니 렌더
function renderCart() {
  const list = document.getElementById("cartList");
  list.innerHTML = "";
  if (cart.length === 0) {
    const li = document.createElement("li");
    li.className = "cart-empty";
    li.textContent = "장바구니가 비어 있습니다. 상품을 담아주세요.";
    list.appendChild(li);
    return;
  }

  cart.forEach((item, idx) => {
    const li = document.createElement("li");
    li.className = "cart-item";

    const name = document.createElement("span");
    name.className = "cart-name";
    name.textContent = item.product;

    const controls = document.createElement("div");
    controls.className = "qty-wrap";

    const dec = document.createElement("button");
    dec.className = "btn";
    dec.textContent = "−";
    dec.onclick = () => {
      item.quantity = Math.max(1, item.quantity - 1);
      renderCart();
    };

    const qty = document.createElement("input");
    qty.type = "number";
    qty.min = "1";
    qty.value = item.quantity;
    qty.className = "qty-input";
    qty.oninput = (e) => {
      const v = Math.max(1, parseInt(e.target.value || "1", 10));
      item.quantity = v;
    };

    const inc = document.createElement("button");
    inc.className = "btn";
    inc.textContent = "+";
    inc.onclick = () => {
      item.quantity += 1;
      renderCart();
    };

    const rm = document.createElement("button");
    rm.className = "btn danger";
    rm.textContent = "삭제";
    rm.onclick = () => {
      cart.splice(idx, 1);
      renderCart();
    };

    controls.append(dec, qty, inc, rm);
    li.append(name, controls);
    list.appendChild(li);
  });
}

// 등록(저장)
function submitAddress() {
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const road = document.getElementById("road").value.trim();
  const jibun = document.getElementById("jibun").value.trim();
  const zipcode = document.getElementById("zipcode").value.trim();
  const detail = document.getElementById("detail").value.trim();

  if (!name || !phone || !road || !zipcode) {
    alert("이름/연락처/도로명/우편번호를 입력해주세요.");
    return;
  }
  if (cart.length === 0) {
    alert("장바구니에 상품을 담아주세요.");
    return;
  }

  const data = {
    name,
    phone,
    road,
    jibun,
    detail,
    zipcode,
    product: cart.map((i) => i.product),
    quantity: cart.map((i) => String(i.quantity)),
  };

  addRowToTable(data);
  saveToLocalStorage();
  updateCount();

  // 초기화(주소는 유지, 이름/연락처/상세만 리셋이 필요하면 여기 조정)
  cart = [];
  renderCart();
  document.getElementById("addressForm").reset();
}

// 테이블 행 추가 (모바일 카드 전환을 위해 data-label 세팅)
function addRowToTable(data) {
  const tbody = document.querySelector("#addressList tbody");
  const row = tbody.insertRow();

  const c0 = row.insertCell(0); c0.innerText = data.name;    c0.setAttribute("data-label","이름");
  const c1 = row.insertCell(1); c1.innerText = data.phone;   c1.setAttribute("data-label","연락처");
  const c2 = row.insertCell(2); c2.innerText = data.road;    c2.setAttribute("data-label","도로명 주소");
  const c3 = row.insertCell(3); c3.innerText = data.jibun;   c3.setAttribute("data-label","지번 주소");
  const c4 = row.insertCell(4); c4.innerText = data.detail;  c4.setAttribute("data-label","상세 주소");
  const c5 = row.insertCell(5); c5.innerText = data.zipcode; c5.setAttribute("data-label","우편번호");

  const productText = data.product.map((p, i) => `${p} (${data.quantity[i]})`).join(", ");
  const c6 = row.insertCell(6); c6.innerText = productText;  c6.setAttribute("data-label","상품 목록");

  const c7 = row.insertCell(7); c7.setAttribute("data-label","삭제");
  const del = document.createElement("button");
  del.className = "btn danger";
  del.innerText = "삭제";
  del.onclick = () => {
    row.remove();
    saveToLocalStorage();
    updateCount();
  };
  c7.appendChild(del);

  const c8 = row.insertCell(8); c8.setAttribute("data-label","복사");
  const copy = document.createElement("button");
  copy.className = "btn";
  copy.innerText = "복사";
  copy.onclick = () => {
    const fullAddress = `${data.road} ${data.detail} (${data.zipcode})`.trim();
    navigator.clipboard.writeText(fullAddress).then(() => alert("주소가 복사되었습니다."));
  };
  c8.appendChild(copy);
}

// 저장
function saveToLocalStorage() {
  const rows = [...document.querySelector("#addressList tbody").rows].map((row) => {
    const productText = row.cells[6].innerText.split(", ").filter(Boolean);
    const products = productText.map((p) => p.replace(/\s*\(.*\)/, ""));
    const quantities = productText.map((p) =>
      p.match(/\((\d+)\)/) ? p.match(/\((\d+)\)/)[1] : "1"
    );
    return {
      name: row.cells[0].innerText,
      phone: row.cells[1].innerText,
      road: row.cells[2].innerText,
      jibun: row.cells[3].innerText,
      detail: row.cells[4].innerText,
      zipcode: row.cells[5].innerText,
      product: products,
      quantity: quantities,
    };
  });
  localStorage.setItem("addressList", JSON.stringify(rows));
}

// 불러오기
function loadSavedAddresses() {
  const saved = localStorage.getItem("addressList");
  if (!saved) return;
  const addresses = JSON.parse(saved);
  addresses.forEach(addRowToTable);
}

// 카운트
function updateCount() {
  const count = document.querySelector("#addressList tbody").rows.length;
  document.getElementById("count").innerText = `등록된 배송지: ${count}건`;
}

// 초기화
window.addEventListener("DOMContentLoaded", () => {
  loadSavedAddresses();
  updateCount();
});
