const artboard = document.querySelector("#artboard");
const layersList = document.querySelector("#layersList");
const addTextBtn = document.querySelector("#addText");
const addShapeBtn = document.querySelector("#addShape");
const addImageInput = document.querySelector("#addImage");
const colorPicker = document.querySelector("#colorPicker");
const fontSizeRange = document.querySelector("#fontSize");
const opacityRange = document.querySelector("#opacityRange");
const duplicateBtn = document.querySelector("#duplicateLayer");
const deleteBtn = document.querySelector("#deleteLayer");
const productName = document.querySelector("#productName");
const productSize = document.querySelector("#productSize");
const clearAllBtn = document.querySelector("#clearAll");
const downloadBtn = document.querySelector("#downloadLayout");
const mobileNotice = document.querySelector("#mobileNotice");
const continueMobileBtn = document.querySelector("#continueMobile");
const editorSection = document.querySelector(".editor-section");

const MAX_W = 560;
const MAX_H = 480;

let layers = [];
let selectedId = null;
let actionState = null;

const defaultProduct = { label: "Cartão de visita", w: 90, h: 50 };
setArtboardSize(defaultProduct.w, defaultProduct.h);

function setArtboardSize(mmW, mmH) {
  const scale = Math.min(MAX_W / mmW, MAX_H / mmH);
  const pxW = Math.round(mmW * scale);
  const pxH = Math.round(mmH * scale);
  artboard.style.width = `${pxW}px`;
  artboard.style.height = `${pxH}px`;
  artboard.style.setProperty("--bleed", `${Math.round(3 * scale)}px`);
  artboard.style.setProperty("--safe", `${Math.round(6 * scale)}px`);
}

function addLayer(type, el, name) {
  const id = `layer-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  el.dataset.layerId = id;
  el.classList.add("layer");
  artboard.appendChild(el);

  const layer = {
    id,
    type,
    name,
    el,
    visible: true,
  };

  layers.push(layer);
  updateZIndexes();
  selectLayer(id);
  renderLayers();
}

function selectLayer(id) {
  selectedId = id;
  layers.forEach((layer) => {
    layer.el.classList.toggle("selected", layer.id === id);
    toggleHandles(layer.el, layer.id === id);
  });

  const selected = layers.find((layer) => layer.id === id);
  syncProperties(selected);
  renderLayers();
}

function syncProperties(layer) {
  if (!layer) return;
  const style = getComputedStyle(layer.el);
  const color = layer.type === "shape" ? style.backgroundColor : style.color;
  colorPicker.value = rgbToHex(color);
  opacityRange.value = Math.round(parseFloat(style.opacity || 1) * 100);
  if (layer.type === "text") {
    fontSizeRange.value = parseInt(style.fontSize, 10) || 24;
  }
}

function renderLayers() {
  layersList.innerHTML = "";
  layers
    .slice()
    .reverse()
    .forEach((layer) => {
      const li = document.createElement("li");
      li.dataset.id = layer.id;
      if (layer.id === selectedId) {
        li.style.background = "rgba(240, 93, 94, 0.15)";
      }

      const name = document.createElement("span");
      name.textContent = layer.name;
      name.style.cursor = "pointer";
      name.addEventListener("click", () => selectLayer(layer.id));

      const actions = document.createElement("div");
      actions.className = "layer-actions";

      const up = actionButton("^", "up", layer.id);
      const down = actionButton("v", "down", layer.id);
      const eye = actionButton(layer.visible ? "Ver" : "Off", "toggle", layer.id);

      actions.append(up, down, eye);
      li.append(name, actions);
      layersList.appendChild(li);
    });
}

function actionButton(label, action, id) {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    if (action === "up") moveLayer(id, 1);
    if (action === "down") moveLayer(id, -1);
    if (action === "toggle") toggleVisibility(id);
  });
  return btn;
}

function moveLayer(id, delta) {
  const index = layers.findIndex((layer) => layer.id === id);
  if (index < 0) return;
  const newIndex = index + delta;
  if (newIndex < 0 || newIndex >= layers.length) return;
  const [moved] = layers.splice(index, 1);
  layers.splice(newIndex, 0, moved);
  updateZIndexes();
  renderLayers();
}

function toggleVisibility(id) {
  const layer = layers.find((item) => item.id === id);
  if (!layer) return;
  layer.visible = !layer.visible;
  layer.el.style.display = layer.visible ? "block" : "none";
  renderLayers();
}

function updateZIndexes() {
  layers.forEach((layer, index) => {
    layer.el.style.zIndex = String(index + 1);
  });
}

function toggleHandles(el, show) {
  const handles = el.querySelectorAll(".resize-handle");
  handles.forEach((handle) => handle.remove());
  if (!show) return;
  ["nw", "ne", "sw", "se"].forEach((pos) => {
    const handle = document.createElement("div");
    handle.className = `resize-handle handle-${pos}`;
    handle.dataset.handle = pos;
    el.appendChild(handle);
  });
}

function addTextLayer() {
  const el = document.createElement("div");
  el.className = "text-layer";
  el.contentEditable = "false";
  el.textContent = "Digite seu texto";
  el.style.left = "40px";
  el.style.top = "40px";
  el.style.fontSize = `${fontSizeRange.value}px`;
  el.style.color = colorPicker.value;
  addLayer("text", el, "Texto");
}

function addShapeLayer() {
  const el = document.createElement("div");
  el.className = "shape-layer";
  el.style.left = "60px";
  el.style.top = "70px";
  el.style.width = "140px";
  el.style.height = "90px";
  el.style.background = colorPicker.value;
  addLayer("shape", el, "Forma");
}

function addImageLayer(file) {
  const url = URL.createObjectURL(file);
  const wrapper = document.createElement("div");
  wrapper.className = "image-layer";
  wrapper.style.left = "80px";
  wrapper.style.top = "60px";
  wrapper.style.width = "160px";
  wrapper.style.height = "120px";

  const img = document.createElement("img");
  img.src = url;
  wrapper.appendChild(img);
  addLayer("image", wrapper, "Imagem");
}

function duplicateLayer() {
  const layer = layers.find((item) => item.id === selectedId);
  if (!layer) return;
  const clone = layer.el.cloneNode(true);
  clone.classList.remove("selected");
  clone.querySelectorAll(".resize-handle").forEach((handle) => handle.remove());
  clone.style.left = `${parseInt(layer.el.style.left || 0, 10) + 16}px`;
  clone.style.top = `${parseInt(layer.el.style.top || 0, 10) + 16}px`;
  addLayer(layer.type, clone, `${layer.name} (copia)`);
}

function deleteLayer() {
  const index = layers.findIndex((item) => item.id === selectedId);
  if (index < 0) return;
  layers[index].el.remove();
  layers.splice(index, 1);
  selectedId = null;
  updateZIndexes();
  renderLayers();
}

function clearAll() {
  layers.forEach((layer) => layer.el.remove());
  layers = [];
  selectedId = null;
  renderLayers();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function startDrag(event, layer) {
  const rect = artboard.getBoundingClientRect();
  const layerRect = layer.el.getBoundingClientRect();
  actionState = {
    type: "drag",
    id: layer.id,
    offsetX: event.clientX - layerRect.left,
    offsetY: event.clientY - layerRect.top,
    bounds: rect,
  };
}

function startResize(event, layer, handle) {
  actionState = {
    type: "resize",
    id: layer.id,
    handle,
    startX: event.clientX,
    startY: event.clientY,
    startW: layer.el.offsetWidth,
    startH: layer.el.offsetHeight,
    startLeft: parseInt(layer.el.style.left || 0, 10),
    startTop: parseInt(layer.el.style.top || 0, 10),
  };
}

function onPointerMove(event) {
  if (!actionState) return;
  const layer = layers.find((item) => item.id === actionState.id);
  if (!layer) return;

  if (actionState.type === "drag") {
    const bounds = actionState.bounds;
    const newLeft = event.clientX - bounds.left - actionState.offsetX;
    const newTop = event.clientY - bounds.top - actionState.offsetY;
    const maxLeft = bounds.width - layer.el.offsetWidth;
    const maxTop = bounds.height - layer.el.offsetHeight;
    layer.el.style.left = `${clamp(newLeft, 0, maxLeft)}px`;
    layer.el.style.top = `${clamp(newTop, 0, maxTop)}px`;
  }

  if (actionState.type === "resize") {
    const deltaX = event.clientX - actionState.startX;
    const deltaY = event.clientY - actionState.startY;
    let newW = actionState.startW;
    let newH = actionState.startH;
    let newLeft = actionState.startLeft;
    let newTop = actionState.startTop;

    if (actionState.handle.includes("e")) newW = actionState.startW + deltaX;
    if (actionState.handle.includes("s")) newH = actionState.startH + deltaY;
    if (actionState.handle.includes("w")) {
      newW = actionState.startW - deltaX;
      newLeft = actionState.startLeft + deltaX;
    }
    if (actionState.handle.includes("n")) {
      newH = actionState.startH - deltaY;
      newTop = actionState.startTop + deltaY;
    }

    newW = clamp(newW, 40, artboard.clientWidth);
    newH = clamp(newH, 20, artboard.clientHeight);
    layer.el.style.width = `${newW}px`;
    layer.el.style.height = `${newH}px`;
    layer.el.style.left = `${clamp(newLeft, 0, artboard.clientWidth - newW)}px`;
    layer.el.style.top = `${clamp(newTop, 0, artboard.clientHeight - newH)}px`;
  }
}

function endAction() {
  actionState = null;
}

function rgbToHex(rgb) {
  if (!rgb) return "#000000";
  const result = rgb.match(/\d+/g);
  if (!result) return "#000000";
  const [r, g, b] = result.map((num) => parseInt(num, 10));
  return `#${[r, g, b]
    .map((val) => val.toString(16).padStart(2, "0"))
    .join("")}`;
}

addTextBtn.addEventListener("click", addTextLayer);
addShapeBtn.addEventListener("click", addShapeLayer);
addImageInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) addImageLayer(file);
  event.target.value = "";
});

duplicateBtn.addEventListener("click", duplicateLayer);
deleteBtn.addEventListener("click", deleteLayer);
clearAllBtn.addEventListener("click", clearAll);
downloadBtn.addEventListener("click", downloadLayout);

colorPicker.addEventListener("input", () => {
  const layer = layers.find((item) => item.id === selectedId);
  if (!layer) return;
  if (layer.type === "shape") layer.el.style.background = colorPicker.value;
  if (layer.type === "text") layer.el.style.color = colorPicker.value;
});

fontSizeRange.addEventListener("input", () => {
  const layer = layers.find((item) => item.id === selectedId);
  if (!layer || layer.type !== "text") return;
  layer.el.style.fontSize = `${fontSizeRange.value}px`;
});

opacityRange.addEventListener("input", () => {
  const layer = layers.find((item) => item.id === selectedId);
  if (!layer) return;
  layer.el.style.opacity = String(parseInt(opacityRange.value, 10) / 100);
});

artboard.addEventListener("pointerdown", (event) => {
  const handle = event.target.closest(".resize-handle");
  const layerEl = event.target.closest(".layer");
  if (!layerEl) {
    selectLayer(null);
    return;
  }

  const layer = layers.find((item) => item.id === layerEl.dataset.layerId);
  if (!layer) return;
  selectLayer(layer.id);

  if (layerEl.isContentEditable) return;

  if (handle) {
    startResize(event, layer, handle.dataset.handle);
  } else {
    startDrag(event, layer);
  }
});

window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", endAction);

artboard.addEventListener("dblclick", (event) => {
  const layerEl = event.target.closest(".layer");
  if (!layerEl) return;
  const layer = layers.find((item) => item.id === layerEl.dataset.layerId);
  if (!layer || layer.type !== "text") return;
  layerEl.contentEditable = "true";
  layerEl.classList.add("editing");
  layerEl.focus();
});

artboard.addEventListener(
  "focusout",
  (event) => {
    const target = event.target;
    if (!target.classList.contains("text-layer")) return;
    target.contentEditable = "false";
    target.classList.remove("editing");
  },
  true
);

const productCards = document.querySelectorAll(".product-card");
productCards.forEach((card) => {
  card.addEventListener("click", () => {
    const label = card.dataset.label;
    const w = Number(card.dataset.w);
    const h = Number(card.dataset.h);
    productName.textContent = label;
    productSize.textContent = `${w} x ${h} mm`;
    setArtboardSize(w, h);
  });
});

const revealItems = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
      }
    });
  },
  { threshold: 0.2 }
);
revealItems.forEach((item) => observer.observe(item));

let mobileOverride = false;

function updateMobileState() {
  if (!mobileNotice || !editorSection) return;
  const isMobile = window.innerWidth <= 900;
  if (isMobile && !mobileOverride) {
    mobileNotice.classList.remove("hidden");
    editorSection.classList.add("editor-locked");
  } else {
    mobileNotice.classList.add("hidden");
    editorSection.classList.remove("editor-locked");
  }
}

continueMobileBtn?.addEventListener("click", () => {
  mobileOverride = true;
  updateMobileState();
});

window.addEventListener("resize", updateMobileState);
updateMobileState();

async function downloadLayout() {
  if (!window.html2canvas || !window.UTIF) {
    alert("Nao foi possivel gerar o download TIFF. Tente novamente com internet ativa.");
    return;
  }
  artboard.classList.add("exporting");
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const canvas = await html2canvas(artboard, {
    backgroundColor: "#ffffff",
    scale: 2,
  });
  artboard.classList.remove("exporting");

  const label = productName?.textContent || "layout";
  const filename = label.trim().toLowerCase().replace(/\\s+/g, "-");
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const ifd = UTIF.encodeImage(imageData.data, canvas.width, canvas.height);
  const tiffData = UTIF.encode([ifd]);
  const blob = new Blob([tiffData], { type: "image/tiff" });
  const link = document.createElement("a");
  link.download = `${filename}.tiff`;
  link.href = URL.createObjectURL(blob);
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
