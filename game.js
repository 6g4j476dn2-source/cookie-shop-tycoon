'use strict';
const STORAGE_KEY = 'james-cookie-shop-v1';
const $ = id => document.getElementById(id);
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const round = n => Math.round(n * 100) / 100;
const fresh = () => ({ cash: 100, history: [] });
let state = fresh();
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
  if (saved && Number.isFinite(saved.cash) && saved.cash >= 0 && Array.isArray(saved.history) && saved.history.length <= 30 && saved.history.every(r => ['day','quantity','sold','price','ads','revenue','expense','profit','cash'].every(k => Number.isFinite(r[k])))) state = saved;
} catch { /* Storage is optional when opened as a local file. */ }
const forecasts = [
  { title: 'A fresh start', text: 'The neighborhood is ready to discover your cookies.', factor: 1 },
  { title: 'A sunny stroll kind of day', text: 'More people are out and about. Expect extra foot traffic.', factor: 1.2 },
  { title: 'Rain on the windows', text: 'A quieter day in the neighborhood. Plan a smaller batch.', factor: .75 },
  { title: 'The afternoon cookie rush', text: 'Local offices are looking for a sweet afternoon treat.', factor: 1.35 },
  { title: 'An ordinary, lovely day', text: 'Steady foot traffic and plenty of cookie possibilities.', factor: 1 }
];
function forecast() { return forecasts[state.history.length % forecasts.length]; }
function finished() { return state.history.length >= 30 || state.cash < 5.5; }
function plan() { return { quantity: Number($('quantity').value), price: Number($('price').value), ads: Number($('advertising').value) }; }
function updateEstimate() {
  const p = plan(), expense = round(p.quantity * .5 + p.ads + 5);
  $('ingredient-cost').textContent = money(p.quantity * .5);
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
  const waste = r.quantity - r.sold;
  $('result-note').textContent = `${waste} unsold ${waste === 1 ? 'cookie was' : 'cookies were'} cleared at closing. Expenses include ${money(r.quantity * .5)} in ingredients, ${money(r.ads)} in advertising, and $5.00 in overhead.`;
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
  for (const id of ['quantity', 'price', 'advertising']) $(id).disabled = done;
  $('history-count').textContent = `${count} ${count === 1 ? 'day' : 'days'} in the books`;
  $('history-empty').hidden = count > 0;
  $('history-table').hidden = count === 0;
  $('ledger').innerHTML = [...state.history].reverse().map(r => `<tr><td>Day ${r.day}</td><td>${r.quantity} / ${r.sold}</td><td>${money(r.price)}</td><td>${money(r.ads)}</td><td>${money(r.revenue)}</td><td>${money(r.expense)}</td><td class="${r.profit >= 0 ? 'positive' : 'negative'}">${money(r.profit)}</td><td>${money(r.cash)}</td></tr>`).join('');
  if (count) showResult(state.history[count - 1]);
  else { $('empty-results').hidden = false; $('daily-results').hidden = true; $('result-title').textContent = 'Your story starts here'; }
  $('end-game').hidden = !done;
  if (done) {
    $('end-title').textContent = count >= 30 ? 'Thirty days. Your very own cookie story.' : 'Time to hang up the apron.';
    $('end-description').textContent = `${count >= 30 ? 'You completed your 30-day run!' : 'You need at least $5.50 to cover overhead and bake one cookie.'} You finished with ${money(state.cash)}, a total ${state.cash >= 100 ? 'profit' : 'loss'} of ${money(Math.abs(round(state.cash - 100)))}, and ${state.history.reduce((n, r) => n + r.sold, 0)} cookies sold.`;
  }
  updateEstimate();
}
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Gameplay continues without persistence. */ } }
$('plan-form').addEventListener('input', updateEstimate);
$('plan-form').addEventListener('submit', event => {
  event.preventDefault();
  if (serving || finished() || !$('plan-form').reportValidity()) return;
  const p = plan();
  if (!Number.isInteger(p.quantity) || p.quantity < 0 || p.quantity > 10000 || !Number.isFinite(p.price) || p.price < .25 || p.price > 50 || !Number.isFinite(p.ads) || p.ads < 0 || p.ads > 1000000) return;
  const expense = round(p.quantity * .5 + p.ads + 5);
  if (expense > state.cash) { updateEstimate(); return; }
  // Price sensitivity and diminishing advertising returns reward experimentation.
  const demand = Math.max(0, Math.round((48 + 22 * Math.sqrt(p.ads) + state.history.length * 1.2) * Math.exp((2 - p.price) * .72) * forecast().factor * (.85 + Math.random() * .3)));
  const sold = Math.min(p.quantity, demand), revenue = round(sold * p.price), profit = round(revenue - expense);
  state.cash = round(state.cash + profit);
  state.history.push({ day: state.history.length + 1, ...p, sold, revenue, expense, profit, cash: state.cash });
  save(); render(); animateCustomers(sold);
});
function reset() { stopCustomers(); state = fresh(); $('quantity').value = 60; $('price').value = '2.00'; $('advertising').value = '5.00'; save(); render(); }
$('reset').addEventListener('click', () => { if (confirm('Start over with $100? Your current shop history will be cleared.')) reset(); });
$('play-again').addEventListener('click', reset);
render();
