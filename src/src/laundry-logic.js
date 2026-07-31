// ==========================================
// REMAL HOTEL & VILLAS - LAUNDRY MANAGEMENT LOGIC
// ==========================================
import { supabaseClient } from './supabase.js';
import { LAUNDRY_DATABASE } from './laundry-data.js';

let currentService = 'laundry';
let currentCountType = 'hotel';
let cart = {};
let currentImageData = null;

export function initLaundryModule() {
    renderItems();
    setupEventListeners();
}

function setupEventListeners() {
    const roomInput = document.getElementById('roomNumber');
    if (roomInput) {
        roomInput.addEventListener('input', validateRoomNumber);
    }
}

export function selectCountType(type) {
    currentCountType = type;
    document.getElementById('btn-count-hotel').className = type === 'hotel' ? 'flex-1 py-2.5 rounded-xl bg-remal-sand text-white shadow-md font-bold' : 'flex-1 py-2.5 rounded-xl text-stone-600';
    document.getElementById('btn-count-guest').className = type === 'guest' ? 'flex-1 py-2.5 rounded-xl bg-stone-900 text-white shadow-md font-bold' : 'flex-1 py-2.5 rounded-xl text-stone-600';
    renderItems(); 
    calculateGlobalTotals();
}

export function switchService(service) {
    currentService = service;
    ['laundry', 'dry', 'pressing'].forEach(s => {
        const btn = document.getElementById(`tab-service-${s}`);
        if (btn) {
            btn.className = s === service ? "flex-1 py-2.5 rounded-xl bg-stone-900 text-white shadow-sm font-bold" : "flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold";
        }
    });
    renderItems();
}

function renderItems() {
    const container = document.getElementById('itemsContainer');
    if (!container) return;
    container.innerHTML = '';
    const serviceData = LAUNDRY_DATABASE[currentService];
    
    for (const [catName, items] of Object.entries(serviceData)) {
        const catHeader = document.createElement('div');
        catHeader.className = 'bg-stone-100 text-stone-800 px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider mb-2 mt-2'; 
        catHeader.innerText = catName;
        container.appendChild(catHeader);

        items.forEach(item => {
            const key = `${currentService}_${item.name}`;
            const qty = cart[key] ? cart[key].qty : 0;
            const priceDisplay = currentCountType === 'hotel' ? '0.00 AED' : `${item.price.toFixed(2)} AED`;

            const row = document.createElement('div');
            row.className = 'flex justify-between items-center py-2 border-b border-stone-100 text-xs';
            row.innerHTML = `
                <div>
                    <p class="font-bold text-stone-900">${item.name}</p>
                    <p class="text-[10px] ${currentCountType === 'hotel' ? 'text-emerald-600 font-bold' : 'text-remal-sand font-semibold'}">${priceDisplay}</p>
                </div>
                <div class="flex items-center space-x-2 bg-stone-100 p-1 rounded-xl">
                    <button type="button" data-key="${key}" data-name="${item.name}" data-price="${item.price}" data-delta="-1" class="qty-btn-dec w-6 h-6 bg-white text-stone-800 rounded font-bold shadow-sm">-</button>
                    <span class="font-bold px-1 text-stone-900">${qty}</span>
                    <button type="button" data-key="${key}" data-name="${item.name}" data-price="${item.price}" data-delta="1" class="qty-btn-inc w-6 h-6 bg-stone-900 text-white rounded font-bold shadow-sm">+</button>
                </div>
            `;
            container.appendChild(row);
        });
    }

    // Attacher les gestionnaires d'événements dynamiques
    document.querySelectorAll('.qty-btn-dec').forEach(b => b.onclick = (e) => updateQtyFromDataset(e.target));
    document.querySelectorAll('.qty-btn-inc').forEach(b => b.onclick = (e) => updateQtyFromDataset(e.target));
}

function updateQtyFromDataset(target) {
    const key = target.getAttribute('data-key');
    const name = target.getAttribute('data-name');
    const price = parseFloat(target.getAttribute('data-price'));
    const delta = parseInt(target.getAttribute('data-delta'), 10);
    updateQty(key, name, price, delta);
}

function updateQty(key, name, price, delta) {
    if (!cart[key]) cart[key] = { qty: 0, price: price, name: name, service: currentService };
    cart[key].qty += delta;
    if (cart[key].qty <= 0) delete cart[key];
    renderItems(); 
    calculateGlobalTotals();
}

function calculateGlobalTotals() {
    let totalClothes = 0; 
    let subtotal = 0;
    Object.values(cart).forEach(item => { 
        totalClothes += item.qty; 
        if (currentCountType === 'guest') subtotal += item.price * item.qty; 
    });
    const vat = subtotal * 0.05; 
    const grandTotal = subtotal + vat;
    
    const elCount = document.getElementById('currentBordereauCount');
    const elSub = document.getElementById('subTotal');
    const elVat = document.getElementById('vatAmount');
    const elGrand = document.getElementById('grandTotal');

    if (elCount) elCount.innerText = `${totalClothes} pieces`;
    if (elSub) elSub.innerText = `${subtotal.toFixed(2)} AED`;
    if (elVat) elVat.innerText = `${vat.toFixed(2)} AED`;
    if (elGrand) elGrand.innerText = `${grandTotal.toFixed(2)} AED`;
}

function isRoomNumberValid(val) {
    const room = parseInt(val, 10);
    if (isNaN(room)) return false;
    return (
        (room >= 103 && room <= 144) ||
        (room >= 201 && room <= 246) ||
        (room >= 301 && room <= 348) ||
        (room >= 401 && room <= 448) ||
        (room >= 501 && room <= 520) ||
        (room >= 601 && room <= 608)
    );
}

function validateRoomNumber() {
    const input = document.getElementById('roomNumber');
    const errorMsg = document.getElementById('roomErrorMsg');
    const saveBtn = document.getElementById('btnSaveRecord');
    if (!input) return true;
    const val = input.value.trim();

    if (val === '') {
        input.className = "w-full border border-stone-200 rounded-xl p-3 text-sm font-bold bg-stone-50 outline-none transition focus:border-stone-400";
        if (errorMsg) errorMsg.classList.add('hidden');
        if (saveBtn) { saveBtn.disabled = false; saveBtn.classList.remove('opacity-50', 'cursor-not-allowed'); }
        return true;
    }

    if (isRoomNumberValid(val)) {
        input.className = "w-full border-2 border-emerald-500 rounded-xl p-3 text-sm font-bold bg-emerald-50/30 text-stone-900 outline-none transition";
        if (errorMsg) errorMsg.classList.add('hidden');
        if (saveBtn) { saveBtn.disabled = false; saveBtn.classList.remove('opacity-50', 'cursor-not-allowed'); }
        return true;
    } else {
        input.className = "w-full border-2 border-rose-500 rounded-xl p-3 text-sm font-bold bg-rose-50/50 text-rose-900 outline-none transition";
        if (errorMsg) errorMsg.classList.remove('hidden');
        if (saveBtn) { saveBtn.disabled = true; saveBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
        return false;
    }
}
