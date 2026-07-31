// ==========================================
// REMAL HOTEL & VILLAS - LAUNDRY MANAGEMENT LOGIC (AVEC BORDEREAU)
// ==========================================
import { supabaseClient } from './supabase.js';
import { LAUNDRY_DATABASE } from './laundry-data.js';

let currentService = 'laundry';
let currentCountType = 'hotel';
let cart = {};
let currentImageData = null;
let cachedSlips = [];
let selectedIdForModal = null;

export function initLaundryModule() {
    renderItems();
    chargerLiveOrders();
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
                    <button type="button" onclick="updateQty('${key}', '${item.name}', ${item.price}, -1)" class="w-6 h-6 bg-white text-stone-800 rounded font-bold shadow-sm">-</button>
                    <span class="font-bold px-1 text-stone-900">${qty}</span>
                    <button type="button" onclick="updateQty('${key}', '${item.name}', ${item.price}, 1)" class="w-6 h-6 bg-stone-900 text-white rounded font-bold shadow-sm">+</button>
                </div>
            `;
            container.appendChild(row);
        });
    }
}

window.updateQty = function(key, name, price, delta) {
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
    
    document.getElementById('currentBordereauCount').innerText = `${totalClothes} pieces`;
    document.getElementById('subTotal').innerText = `${subtotal.toFixed(2)} AED`;
    document.getElementById('vatAmount').innerText = `${vat.toFixed(2)} AED`;
    document.getElementById('grandTotal').innerText = `${grandTotal.toFixed(2)} AED`;
}

export async function sauvegarderBordereauToCloud() {
    const roomNum = document.getElementById('roomNumber').value.trim();
    if (!roomNum) {
        alert('Veuillez entrer un numéro de chambre.');
        return;
    }

    if (Object.keys(cart).length === 0 && !currentImageData) {
        alert('Veuillez sélectionner au moins un vêtement.');
        return;
    }

    let totalClothes = 0; 
    Object.values(cart).forEach(item => totalClothes += item.qty);
    let subtotal = 0; 
    if (currentCountType === 'guest') Object.values(cart).forEach(item => subtotal += item.price * item.qty);

    const selectedOption = document.querySelector('input[name="foldingOption"]:checked')?.value || 'F — Folding';
    const vat = subtotal * 0.05; 
    const grandTotal = subtotal + vat;

    const payload = {
        room: roomNum, 
        count_type: currentCountType, 
        options: { service_style: selectedOption }, 
        items: cart,
        total_clothes: totalClothes, 
        subtotal: subtotal, 
        vat: vat, 
        total: grandTotal, 
        photo: currentImageData,
        status: 'Collected'
    };

    await supabaseClient.from('laundry_slips').insert([payload]);
    alert(`Bordereau enregistré pour la chambre ${roomNum} !`);
    cart = {};
    document.getElementById('roomNumber').value = '';
    renderItems();
    calculateGlobalTotals();
}

export async function chargerLiveOrders() {
    const container = document.getElementById('liveOrdersList');
    if (!container) return;
    const { data } = await supabaseClient.from('laundry_slips').select('*');
    
    cachedSlips = data || [];
    if (cachedSlips.length === 0) {
        container.innerHTML = `<p class="text-xs text-stone-400 text-center py-4">Aucun bordereau en cours.</p>`;
        return;
    }

    container.innerHTML = '';
    cachedSlips.forEach(entry => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-3';
        itemDiv.innerHTML = `
            <div class="flex justify-between items-center cursor-pointer" onclick="ouvrirModalDetails(${entry.id})">
                <div>
                    <span class="font-serif-luxury font-bold text-stone-900 text-sm">Chambre ${entry.room}</span>
                    <span class="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">${entry.count_type}</span>
                </div>
                <div class="text-right font-bold text-remal-sand font-serif-luxury text-sm">
                    ${entry.total.toFixed(2)} AED
                </div>
            </div>
            <div class="text-[10px] text-stone-500">Total pièces : ${entry.total_clothes} | Statut : ${entry.status || 'Collected'}</div>
        `;
        container.appendChild(itemDiv);
    });
}

window.ouvrirModalDetails = function(id) {
    selectedIdForModal = id;
    const entry = cachedSlips.find(e => e.id === id);
    if (!entry) return;

    document.getElementById('modalRoomNumDisplay').innerText = entry.room;
    document.getElementById('modalDate').innerText = `Date: ${new Date(entry.created_at).toLocaleDateString('fr-FR')}`;
    document.getElementById('modalTypeBadgeInline').innerText = entry.count_type === 'hotel' ? 'Hotel Count (Free)' : 'Guest Count';
    document.getElementById('modalPackagingStyle').innerText = entry.options?.service_style || 'F — Folding';

    const tbody = document.getElementById('modalTableBody'); 
    tbody.innerHTML = '';
    Object.values(entry.items || {}).forEach(item => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-stone-100";
        tr.innerHTML = `<td class="py-2 p-2 font-bold">${item.name}</td><td class="text-center p-2">${item.qty}</td><td class="text-right p-2">${(item.qty * item.price).toFixed(2)}</td>`;
        tbody.appendChild(tr);
    });

    document.getElementById('modalClothesCount').innerText = `${entry.total_clothes} pièces`;
    document.getElementById('modalSubTotal').innerText = `${entry.subtotal.toFixed(2)} AED`;
    document.getElementById('modalVat').innerText = `${entry.vat.toFixed(2)} AED`;
    document.getElementById('modalTotal').innerText = `${entry.total.toFixed(2)} AED`;

    document.getElementById('detailModal').classList.remove('hidden');
}

window.fermerModal = function() {
    document.getElementById('detailModal').classList.add('hidden');
}

window.genererPDF = function() {
    const element = document.getElementById('pdfExportArea');
    const opt = {
        margin: 8,
        filename: 'Laundry_Slip.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}
