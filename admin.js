console.log("📦 관리자 페이지 로딩 완료");

// ====== 상품명 → 코드 매핑 (한글/영문/오타/변형 모두 커버) ======
const productCodeMap = {
  // 한글 라벨 (소비자 드롭다운)
  "퀀_크리스피 너겟": "YEJI - 001",
  "퀀_민츠": "YEJI - 002",
  "퀀_서던 프라이드 바이츠": "YEJI - 003",
  "퀀_스웨덴스타일 볼": "YEJI - 004",
  "퀀_필렛": "YEJI - 005",
  "퀀_피스": "YEJI - 009",
  "퀀_소시지 스타일": "YEJI - 010",

  // 영문 라벨 (네가 준 목록)
  "Quorn Crispy Nuggets": "YEJI - 001",
  "Quorn Mince": "YEJI - 002",
  "Quorn Southern Fried Bites": "YEJI - 003",
  "Quorn Swedish Style Balls": "YEJI - 004",
  "Quorn Fillets": "YEJI - 005",
  "Quorn Flillets": "YEJI - 005", // 오타 방어
  "Quorn Pieces": "YEJI - 009",
  "Quorn Sausage Style": "YEJI - 010",

  // 접두사/언더스코어 제거 등 변형 대비
  "Crispy Nuggets": "YEJI - 001",
  "Mince": "YEJI - 002",
  "Southern Fried Bites": "YEJI - 003",
  "Swedish Style Balls": "YEJI - 004",
  "Fillets": "YEJI - 005",
  "Pieces": "YEJI - 009",
  "Sausage Style": "YEJI - 010",
};

// 이름 정규화: 공백 양끝/중복 제거, 언더스코어→공백, "Quorn " 접두사 제거
function normalizeName(name = "") {
  const n = String(name)
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^Quorn\s+/i, ""); // 영문 접두사 제거
  return n;
}

// ====== DOM ======
const addressListTable = document.querySelector("#addressList tbody");
const countEl = document.getElementById("count");

// ====== 로드 & 렌더 ======
function loadSavedAddresses() {
  addressListTable.innerHTML = "";
  const saved = localStorage.getItem("addressList");
  if (!saved) {
    updateCount();
    return;
  }
  const addresses = JSON.parse(saved);
  addresses.forEach((data, index) => addRowToTable(data, index));
  updateCount();
}

function addRowToTable(data, index) {
  const row = addressListTable.insertRow();

  row.insertCell(0).innerText = data.name || "";
  row.insertCell(1).innerText = data.phone || "";
  row.insertCell(2).innerText = data.road || "";
  row.insertCell(3).innerText = data.jibun || "";
  row.insertCell(4).innerText = data.detail || "";
  row.insertCell(5).innerText = data.zipcode || "";

  // 화면 표시용: 원래 저장된 상품/수량 텍스트로 보여줌
  const text = toDisplayText(data);
  row.insertCell(6).innerText = text;

  // 삭제 버튼
  const deleteCell = row.insertCell(7);
  const deleteBtn = document.createElement("button");
  deleteBtn.innerText = "삭제";
  deleteBtn.classList.add("delete");
  deleteBtn.onclick = () => deleteAddress(index);
  deleteCell.appendChild(deleteBtn);
}

// 저장된 포맷(여러 형태) → 화면표시 텍스트
function toDisplayText(entry) {
  if (Array.isArray(entry.product)) {
    return entry.product
      .map((p, i) => `${p} (${(entry.quantity && entry.quantity[i]) || 1})`)
      .join(", ");
  } else if (entry.product) {
    return `${entry.product} (${entry.quantity || 1})`;
  } else if (entry.cart) {
    return entry.cart.map(c => `${c.product} (${c.quantity})`).join(", ");
  }
  return "";
}

// 저장된 포맷(여러 형태) → [{name, qty}]로 통일
function toItems(entry) {
  if (Array.isArray(entry.product)) {
    return entry.product.map((p, i) => ({
      name: p,
      qty: (entry.quantity && entry.quantity[i]) || 1,
    }));
  } else if (entry.product) {
    return [{ name: entry.product, qty: entry.quantity || 1 }];
  } else if (entry.cart) {
    return entry.cart.map(c => ({ name: c.product, qty: c.quantity }));
  } else if (entry.products) {
    // 혹시 모를 다른 키
    return entry.products.map(c => ({ name: c.name, qty: c.qty || 1 }));
  }
  return [];
}

// ====== 저장/삭제 ======
function saveToLocalStorage(addresses) {
  localStorage.setItem("addressList", JSON.stringify(addresses));
}

function deleteAddress(index) {
  const saved = JSON.parse(localStorage.getItem("addressList") || "[]");
  saved.splice(index, 1);
  saveToLocalStorage(saved);
  loadSavedAddresses();
}

// ====== 카운트 ======
function updateCount() {
  const count = addressListTable.rows.length;
  countEl.innerText = `등록된 배송지: ${count}건`;
}

// ====== 전체 삭제 ======
document.getElementById("clearAll").addEventListener("click", () => {
  if (confirm("모든 배송지를 삭제하시겠습니까?")) {
    localStorage.removeItem("addressList");
    loadSavedAddresses();
  }
});

// ====== 엑셀 내보내기 (상품명 → 코드 치환) ======
document.getElementById("downloadExcel").addEventListener("click", () => {
  const saved = JSON.parse(localStorage.getItem("addressList") || "[]");

  const rows = [
    ["이름","연락처","도로명 주소","지번 주소","상세 주소","우편번호","상품 코드 목록"]
  ];

  saved.forEach(entry => {
    const items = toItems(entry);

    const codeList = items.map(({ name, qty }) => {
      const key1 = normalizeName(name);                 // 정규화 키
      const key2 = `Quorn ${key1}`;                     // 접두사 버전도 시도
      const code =
        productCodeMap[name] ||
        productCodeMap[key1] ||
        productCodeMap[key2] ||
        name; // 매핑 실패 시 원문 유지
      return `${code} (${qty})`;
    }).join(", ");

    rows.push([
      entry.name || "",
      entry.phone || "",
      entry.road || "",
      entry.jibun || "",
      entry.detail || "",
      entry.zipcode || "",
      codeList
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "배송지리스트");
  XLSX.writeFile(wb, `배송지리스트_${new Date().toISOString().slice(0,10)}.xlsx`);
});

// ====== 초기화 ======
window.addEventListener("DOMContentLoaded", loadSavedAddresses);
