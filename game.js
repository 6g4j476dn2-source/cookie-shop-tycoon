'use strict';
const STORAGE_KEY = 'james-cookie-shop-v1';
const $ = id => document.getElementById(id);
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const round = n => Math.round(n * 100) / 100;
const VARIETIES = [
  { id: 'classic', name: 'Chocolate chip', emoji: '🍪', cost: .5, price: 2, share: .5 },
  { id: 'double', name: 'Double chocolate', emoji: '🍫', cost: .75, price: 2.75, share: .3 },
  { id: 'oat', name: 'Oatmeal raisin', emoji: '🌾', cost: .4, price: 1.75, share: .2 }
];
const fresh = () => ({ cash: 100, history: [] });
let state = fresh();
$('variety-plans').innerHTML = VARIETIES.map(v => `<fieldset class="variety-card"><legend>${v.emoji} ${v.name}</legend><p>${money(v.cost)} ingredients each · suggested ${money(v.price)}</p><div class="variety-inputs"><div><label for="quantity-${v.id}">Bake quantity</label><div class="input-wrap"><input id="quantity-${v.id}" type="number" min="0" max="10000" step="1" value="${v.id === 'classic' ? 40 : 10}" required><span>cookies</span></div></div><div><label for="price-${v.id}">Selling price</label><div class="input-wrap"><span>$</span><input id="price-${v.id}" type="number" min="0.25" max="50" step="0.05" value="${v.price.toFixed(2)}" required></div></div></div></fieldset>`).join('');
let serving = false;
let customerTimers = [];
const customerScene = document.createElement('div');
customerScene.id = 'customer-scene';
customerScene.hidden = true;
customerScene.innerHTML = `<div class="customer-scene-heading"><strong>Cookies & happy customers</strong><span id="customer-counter">0 cookies served</span></div><div class="customer-street" aria-hidden="true"><div class="mini-shop"><div class="mini-awning"></div><strong>James's 🍪</strong><span>FRESH COOKIES</span><div class="mini-counter"></div></div><div id="customer-lane"></div></div><p id="customer-caption"></p>`;
$('daily-results').before(customerScene);
function stopCustomers() {
  customerTimers.forEach(clearTimeout);
  customerTimers = [];
  serving = false;
  $('customer-lane').replaceChildren();
  customerScene.hidden = true;
}
function animateCustomers(sold) {
  stopCustomers();
  customerScene.hidden = false;
  $('customer-counter').textContent = '0 cookies served';
  if (!sold) {
    $('customer-caption').textContent = 'A quiet day on Cookie Street. Try a new price or a little advertising tomorrow.';
    return;
  }
  const count = Math.min(24, Math.ceil(sold / 5));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('customer-caption').textContent = `${count} ${count === 1 ? 'visitor' : 'visitors'} in this little scene represents ${sold} cookies sold. Happy snacking!`;
  if (reducedMotion) {
    $('customer-counter').textContent = `${sold} cookies served ✓`;
    return;
  }
  serving = true;
  updateEstimate();
  const faces = ['👩🏽', '👨🏻', '👩🏾', '🧑🏼', '👨🏿', '🧑🏻'];
  let served = 0;
  for (let i = 0; i < count; i++) {
    const delay = i * 130;
    const batch = Math.floor((i + 1) * sold / count) - Math.floor(i * sold / count);
    customerTimers.push(setTimeout(() => {
      const visitor = document.createElement('div');
      visitor.className = 'customer';
      visitor.style.setProperty('--shirt', ['#d79865', '#739b89', '#9a85ad', '#d5b35e'][i % 4]);
      visitor.style.setProperty('--lane', `${i % 3 * 7}px`);
      visitor.innerHTML = `<span class="customer-head">${faces[i % faces.length]}</span><span class="customer-body"></span><span class="customer-legs">╱╲</span><span class="customer-cookie">🍪</span><span class="customer-purchase">+${batch} 🍪</span>`;
      $('customer-lane').append(visitor);
      customerTimers.push(setTimeout(() => {
        served += batch;
        $('customer-counter').textContent = `${served} / ${sold} cookies served`;
      }, 1050));
      customerTimers.push(setTimeout(() => visitor.remove(), 2600));
    }, delay));
  }
  customerTimers.push(setTimeout(() => {
    serving = false;
    $('customer-counter').textContent = `${sold} cookies served ✓`;
    updateEstimate();
  }, (count - 1) * 130 + 2650));
}
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (saved && Number.isFinite(saved.cash) && saved.cash >= 0 && Array.isArray(saved.history) && saved.history.length <= 30 && saved.history.every(r => ['day','quantity','sold','price','ads','revenue','expense','profit','cash'].every(k => Number.isFinite(r[k])) && (!r.varieties || (Array.isArray(r.varieties) && r.varieties.length === VARIETIES.length && r.varieties.every((v, i) => v.id === VARIETIES[i].id && ['quantity','price','sold','revenue'].every(k => Number.isFinite(v[k]) && v[k] >= 0) && v.sold <= v.quantity))))) state = saved;
} catch { /* Storage is optional when opened as a local file. */ }
const forecasts = [
  { title: 'A fresh start', text: 'The neighborhood is ready to discover your cookies.', factor: 1 },
  { title: 'A sunny stroll kind of day', text: 'More people are out and about. Expect extra foot traffic.', factor: 1.2 },
  { title: 'Rain on the windows', text: 'A quieter day in the neighborhood. Plan a smaller batch.', factor: .75 },
  { title: 'The afternoon cookie rush', text: 'Local offices are looking for a sweet afternoon treat.', factor: 1.35 },
  { title: 'An ordinary, lovely day', text: 'Steady foot traffic and plenty of cookie possibilities.', factor: 1 }
];
function forecast() { return forecasts[state.history.length % forecasts.length]; }
function finished() { return state.history.length >= 30 || state.cash < 5.4; }
function plan() {
  const varieties = VARIETIES.map(v => ({ ...v, quantity: Number($('quantity-' + v.id).value), price: Number($('price-' + v.id).value) }));
  return { varieties, quantity: varieties.reduce((n, v) => n + v.quantity, 0), ingredients: round(varieties.reduce((n, v) => n + v.quantity * v.cost, 0)), ads: Number($('advertising').value) };
}
function updateEstimate() {
  const p = plan(), expense = round(p.ingredients + p.ads + 5);
  for (const input of $('plan-form').querySelectorAll('input')) input.disabled = finished() || serving;
  $('ingredient-cost').textContent = money(p.ingredients);
  $('ad-cost').textContent = money(p.ads);
  $('cost').textContent = money(expense);
  $('error').textContent = !finished() && expense > state.cash ? 'This batch is over budget. Reduce your cookies or advertising.' : '';
  $('bake').disabled = serving || finished() || expense > state.cash;
}
function showResult(r) {
  $('empty-results').hidden = true;
  $('daily-results').hidden = false;
  $('result-title').textContent = `Day ${r.day}, fresh from the oven`;
  $('result-emoji').textContent = r.profit > 0 ? '✨' : '🍪';
  $('result-message').textContent = r.profit > 0 ? 'A little sweeter, a little richer.' : r.profit === 0 ? 'An even batch.' : 'Every baker has a learning day.';
  $('result-detail').textContent = `${r.sold} of ${r.quantity} cookies found a happy customer.`;
  $('sold').textContent = `${r.sold} / ${r.quantity}`;
  for (const [id, value] of Object.entries({ revenue: r.revenue, expense: r.expense, profit: r.profit, remaining: r.cash })) $(id).textContent = money(value);
  $('profit').className = r.profit >= 0 ? 'positive' : 'negative';
  $('variety-results').innerHTML = r.varieties ? '<h3>Your cookie mix</h3>' + r.varieties.map(v => {
    const info = VARIETIES.find(item => item.id === v.id);
    return `<div class="variety-result"><span>${info.emoji} ${info.name}<small>${v.sold} / ${v.quantity} sold at ${money(v.price)}</small></span><strong>${money(v.revenue)}</strong></div>`;
  }).join('') : '<p class="result-note">Chocolate chip batch from your original shop.</p>';
  const waste = r.quantity - r.sold;
  $('result-note').textContent = `${waste} unsold ${waste === 1 ? 'cookie was' : 'cookies were'} cleared at closing. Expenses include ${money(r.ingredients ?? r.quantity * .5)} in ingredients, ${money(r.ads)} in advertising, and $5.00 in overhead.`;
}
function render() {
  const count = state.history.length, done = finished();
  $('cash').textContent = money(state.cash);
  $('day').innerHTML = `Day ${Math.min(count + 1, 30)} <small>/ 30${done ? ' · finished' : ''}</small>`;
  $('total-profit').textContent = money(round(state.cash - 100));
  $('total-sold').innerHTML = `${state.history.reduce((n, r) => n + r.sold, 0)} <small>cookies</small>`;
  $('planning-day').textContent = done ? 'THE OVENS ARE RESTING' : `DAY ${String(count + 1).padStart(2, '0')} · THE OVENS ARE READY`;
  $('forecast-title').textContent = forecast().title;
  $('forecast-text').textContent = forecast().text;
  for (const input of $('plan-form').querySelectorAll('input')) input.disabled = done || serving;
  $('history-count').textContent = `${count} ${count === 1 ? 'day' : 'days'} in the books`;
  $('history-empty').hidden = count > 0;
  $('history-table').hidden = count === 0;
  $('ledger').innerHTML = [...state.history].reverse().map(r => `<tr><td>Day ${r.day}</td><td>${r.quantity} / ${r.sold}</td><td>${r.varieties ? r.varieties.map(v => { const info = VARIETIES.find(item => item.id === v.id); return `${info.emoji} ${v.quantity}/${v.sold} @ ${money(v.price)}`; }).join('<br>') : money(r.price)}</td><td>${money(r.ads)}</td><td>${money(r.revenue)}</td><td>${money(r.expense)}</td><td class="${r.profit >= 0 ? 'positive' : 'negative'}">${money(r.profit)}</td><td>${money(r.cash)}</td></tr>`).join('');
  if (count) showResult(state.history[count - 1]);
  else { $('empty-results').hidden = false; $('daily-results').hidden = true; $('result-title').textContent = 'Your story starts here'; }
  $('end-game').hidden = !done;
  if (done) {
    $('end-title').textContent = count >= 30 ? 'Thirty days. Your very own cookie story.' : 'Time to hang up the apron.';
    $('end-description').textContent = `${count >= 30 ? 'You completed your 30-day run!' : 'You need at least $5.40 to cover overhead and bake one cookie.'} You finished with ${money(state.cash)}, a total ${state.cash >= 100 ? 'profit' : 'loss'} of ${money(Math.abs(round(state.cash - 100)))}, and ${state.history.reduce((n, r) => n + r.sold, 0)} cookies sold.`;
  }
  updateEstimate();
}
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Gameplay continues without persistence. */ } }
$('plan-form').addEventListener('input', updateEstimate);
$('plan-form').addEventListener('submit', event => {
  event.preventDefault();
  if (serving || finished() || !$('plan-form').reportValidity()) return;
  const p = plan();
  if (p.varieties.some(v => !Number.isInteger(v.quantity) || v.quantity < 0 || v.quantity > 10000 || !Number.isFinite(v.price) || v.price < .25 || v.price > 50) || !Number.isFinite(p.ads) || p.ads < 0 || p.ads > 1000000) return;
  const expense = round(p.ingredients + p.ads + 5);
  if (expense > state.cash) { updateEstimate(); return; }
  // Stocked varieties share one audience, weighted by their popularity.
  const activeShare = p.varieties.filter(v => v.quantity > 0).reduce((n, v) => n + v.share, 0);
  const audience = (48 + 22 * Math.sqrt(p.ads) + state.history.length * 1.2) * forecast().factor * (.85 + Math.random() * .3);
  const varieties = p.varieties.map(v => {
    const demand = v.quantity ? Math.max(0, Math.round(audience * v.share / activeShare * Math.exp((VARIETIES.find(item => item.id === v.id).price - v.price) * .72))) : 0;
    const sold = Math.min(v.quantity, demand);
    return { id: v.id, quantity: v.quantity, price: v.price, sold, revenue: round(sold * v.price) };
  });
  const sold = varieties.reduce((n, v) => n + v.sold, 0);
  const revenue = round(varieties.reduce((n, v) => n + v.revenue, 0)), profit = round(revenue - expense);
  state.cash = round(state.cash + profit);
  state.history.push({ day: state.history.length + 1, quantity: p.quantity, price: sold ? round(revenue / sold) : 0, ingredients: p.ingredients, ads: p.ads, varieties, sold, revenue, expense, profit, cash: state.cash });
  save(); render(); animateCustomers(sold);
});
function reset() { stopCustomers(); state = fresh(); for (const v of VARIETIES) { $('quantity-' + v.id).value = v.id === 'classic' ? 40 : 10; $('price-' + v.id).value = v.price.toFixed(2); } $('advertising').value = '5.00'; save(); render(); }
$('reset').addEventListener('click', () => { if (confirm('Start over with $100? Your current shop history will be cleared.')) reset(); });
$('play-again').addEventListener('click', reset);
render();
