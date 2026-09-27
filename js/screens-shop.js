// S24–S26: shopping list, item detail, shopping complete.

function offerBadge(i) {
  if (i.offerEnded) return `<span class="badge warn">Offer ended · est. ${fmtKr(i.price)}</span>`;
  if (i.offer) return `<span class="badge offer">Offer · ends ${weekday(i.offerEnds)}</span>`;
  return '';
}

function qtyText(i) { return `${i.count} × ${i.label}`; }

SCREENS.shop = () => {
  const a = acct();
  const p = a.plan;
  const top = topbar({ title: 'Shopping', large: true, sub: p ? `${fmtDay(p.start)} – ${fmtDay(addDays(p.start, 6))}` : '', right: p ? `<button class="icon-btn" data-act="openSheetAct" data-sheet="shopMenu" aria-label="List options">${icon('dots')}</button>` : '' });
  if (!p) {
    const e = a.draft
      ? empty({ art: '🧾', title: 'Almost there', text: 'Accept your plan to get your shopping list.', action: btn('Review Your Week', 'openReady') })
      : empty({ art: '🛒', title: 'No shopping list yet', text: 'Your shopping list will appear after you create a weekly plan.', action: btn('Build My Week', 'buildWeek', { disabled: !online() }) });
    return screen({ tab: 'shop', top, body: `<div class="pad">${e}</div>` });
  }
  const t = today();
  const sl = Engine.shoppingList(p, t);
  const b = budgetStatus(sl.total, p.profile.budget);
  const allDone = sl.count > 0 && sl.done >= sl.count;
  const row = (i) => {
    // Swipe left on a row = "Already have it" (handled in SCREENS.shop.after).
    const partial = i.bought > 0 && !i.checked;
    const cls = [i.checked || i.have ? 'done' : '', U.justChecked[i.id] ? 'just' : ''].join(' ');
    return `<div class="item-row ${cls}" data-swipe-have="${i.have || i.checked ? '' : i.id}">
      <button class="cb ${i.checked ? 'on' : ''}" data-act="checkItem" data-id="${i.id}" aria-label="${i.checked ? 'Unmark' : 'Mark'} ${esc(i.name)} as bought" ${i.have ? 'disabled' : ''}>${i.checked ? icon('check') : ''}</button>
      <button class="ir-main" data-act="openItem" data-id="${i.id}">
        <span class="ir-name">${esc(i.name)}${i.isNew && !i.checked ? ' <span class="badge new">New</span>' : ''}</span>
        <span class="ir-qty"><b>${qtyText(i)}</b>${i.have ? ' · <span class="muted">Have it</span>' : partial ? ` · <span class="warn">${i.bought} bought · buy ${i.count - i.bought} more</span>` : ''}</span>
        <span class="ir-price">${i.count > 1 ? `${fmtKr(i.price)} each · ` : ''}${fmtKr(i.total)} ${offerBadge(i)}</span>
      </button></div>`;
  };
  const stores = sl.stores.map((s) => {
    const open = !U.collapsed[s.id];
    const pending = s.items.filter((i) => (!i.checked && !i.have) || U.justChecked[i.id]);
    const bought = s.items.filter((i) => (i.checked || i.have) && !U.justChecked[i.id]);
    let lastAisle = null;
    const pendingHtml = pending.map((i) => {
      const cap = i.aisle !== lastAisle ? `<div class="aisle">${i.aisle}</div>` : '';
      lastAisle = i.aisle;
      return cap + row(i);
    }).join('');
    return `<section class="store-sec">
      <button class="store-head" data-act="toggleStore" data-id="${s.id}" aria-expanded="${open}">
        <span class="store-logo sm" style="--sc:${STORES.find((x) => x.id === s.id).color}">${esc(s.name[0])}</span>
        <b class="grow">${esc(s.name)} · ${fmtKr(s.total)}</b><span class="muted small">${s.done} of ${s.count}</span><span class="chev ${open ? 'open' : ''}">${icon('chev-right')}</span></button>
      ${open ? `<div class="card list-card">${pendingHtml || '<div class="store-done">✓ All bought here</div>'}
        ${bought.length ? `<div class="aisle">Bought (${bought.length})</div>${bought.map(row).join('')}` : ''}</div>` : ''}
    </section>`;
  }).join('');
  return screen({
    tab: 'shop',
    top,
    body: `<div class="pad">
      <div class="card total-card"><div class="muted small">Estimated total</div><div class="big-num">${fmtKr(sl.total)}</div>
        <div class="small">${sl.stores.length} store${sl.stores.length > 1 ? 's' : ''} · <span class="${b.cls}">${b.text}</span>${sl.savings ? ` · ${fmtKr(sl.savings)} saved with offers` : ''}</div>
        ${progress(sl.count ? sl.done / sl.count : 0)}<div class="muted small">${sl.done} of ${sl.count} items</div></div>
      ${storeOptions(p, sl)}
      ${twoSessions(p) ? '<p class="fine">This list covers both prep sessions. Check the use-by dates on fresh meat for Wednesday.</p>' : ''}
      ${allDone ? `<button class="done-banner" data-act="openPrep">${icon('check')} Shopping done · <b>Start Meal Prep</b></button>` : ''}
      ${!online() ? notice('Offline · your checks will sync later.', { icon: 'wifi' }) : ''}
      ${p.noData ? notice('Prices are rough estimates this week.', { kind: 'warn' }) : ''}
      ${sl.removed.length ? `<div class="notice">${icon('info')}<div>Removed · no longer needed: ${sl.removed.map(esc).join(', ')}</div><button class="icon-btn" data-act="dismissRemoved" aria-label="Dismiss">${icon('x')}</button></div>` : ''}
      ${stores}
      <section class="store-sec"><button class="store-head" data-act="toggleStore" data-id="pantry"><b class="grow">Assumed at home</b><span class="muted small">not priced</span><span class="chev ${U.collapsed.pantry === false ? 'open' : ''}">${icon('chev-right')}</span></button>
        ${U.collapsed.pantry === false ? `<div class="card list-card">${PANTRY_NOTE.map((x) => `<div class="ing-row"><span>${x}</span></div>`).join('')}<p class="fine pad-s">Missing any? Pick it up at your first store.</p></div>` : ''}</section>
      <p class="fine center">Prices are estimates from this week's offers and regular prices. Your receipt may differ slightly.</p></div>`,
  });
};

SCREENS.shop.after = (root) => {
  root.querySelectorAll('[data-swipe-have]').forEach((row) => {
    const id = row.dataset.swipeHave;
    if (!id) return;
    let x0 = null;
    row.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    row.addEventListener('touchmove', (e) => { if (x0 != null) { const dx = Math.min(0, e.touches[0].clientX - x0); row.style.transform = `translateX(${Math.max(dx, -120)}px)`; } }, { passive: true });
    row.addEventListener('touchend', (e) => {
      const dx = x0 == null ? 0 : e.changedTouches[0].clientX - x0;
      x0 = null;
      row.style.transform = '';
      if (dx < -80) ACT.toggleHave({ id });
    });
  });
};

// "Cheapest vs. fewest stores": show what other store combinations would cost.
function storeOptions(p, sl) {
  const choices = Engine.storeChoices(p, today());
  const key = (sub) => sub.slice().sort().join();
  const cur = key(sl.stores.map((s) => s.id));
  const name = (sub) => sub.map((id) => STORES.find((s) => s.id === id).name).join(' + ');
  const rows = [];
  const best = choices[0];
  if (best && key(best.subset) !== cur && best.total < sl.total - 4) rows.push({ sub: best.subset, total: best.total, label: `Cheapest: ${name(best.subset)}`, trips: best.subset.length });
  if (sl.stores.length > 1) {
    const single = choices.find((c) => c.subset.length === 1);
    if (single && !rows.some((r) => key(r.sub) === key(single.subset))) rows.push({ sub: single.subset, total: single.total, label: `Only ${name(single.subset)}`, trips: 1 });
  }
  if (!rows.length) return '';
  return `<div class="card store-opts"><div class="so-head">Store options</div>${rows.map((r) => {
    const diff = Math.round(r.total - sl.total);
    return `<div class="so-row"><span class="grow"><b>${esc(r.label)}</b><small>${fmtKr(r.total)} · <span class="${diff > 0 ? 'warn' : 'good'}">${signed(diff)} kr</span> · ${r.trips} trip${r.trips > 1 ? 's' : ''}</small></span>
      <button class="btn secondary small" data-act="useStores" data-v="${r.sub.join(',')}">Switch</button></div>`;
  }).join('')}${sl.done ? '<p class="fine">Items you\'ve ticked stay ticked.</p>' : ''}</div>`;
}
ACT.useStores = (d) => {
  const p = acct().plan;
  const prev = p.subset;
  p.subset = d.v.split(',');
  render();
  toast(`Shopping at ${p.subset.map((id) => STORES.find((s) => s.id === id).name).join(' + ')}`, { undo: () => { p.subset = prev; render(); } });
};

ACT.toggleStore = (d) => {
  if (d.id === 'pantry') U.collapsed.pantry = U.collapsed.pantry === false ? undefined : false;
  else U.collapsed[d.id] = !U.collapsed[d.id];
  render();
};
ACT.dismissRemoved = () => { acct().plan.shop.removed = []; render(); };

function setChecked(id, on) {
  const p = acct().plan;
  const item = Engine.shoppingList(p, today()).items.find((i) => i.id === id);
  if (!item) return;
  if (on) p.shop.checked[id] = item.count; else delete p.shop.checked[id];
  delete p.shop.isNew[id];
}

ACT.checkItem = (d) => {
  const p = acct().plan;
  const item = Engine.shoppingList(p, today()).items.find((i) => i.id === d.id);
  const on = !item.checked;
  setChecked(d.id, on);
  haptic(on ? 10 : 5);
  if (on) {
    U.justChecked[d.id] = true;
    setTimeout(() => { delete U.justChecked[d.id]; if (U.route.name === 'shop' && !U.sheet) render(); }, 1300);
  }
  if (U.sheet) U.sheet = null;
  render();
  maybeShoppingDone();
};

function maybeShoppingDone() {
  const p = acct().plan;
  const sl = Engine.shoppingList(p, today());
  if (sl.count && sl.done >= sl.count && !p.shop.doneShown) {
    p.shop.doneShown = true;
    setTimeout(() => openSheet('shopDone', {}), 500);
  }
}

SHEETS.shopMenu = () => `<div class="sheet-body menu">
  <button class="menu-row" data-act="markAll">Mark all as bought</button>
  <button class="menu-row" data-act="uncheckAll">Uncheck all</button>
  <button class="menu-row" data-act="shareList">${icon('share')} Share list</button></div>`;
ACT.markAll = () => {
  const p = acct().plan;
  Engine.shoppingList(p, today()).items.forEach((i) => { if (!i.have) p.shop.checked[i.id] = i.count; });
  U.sheet = null; render(); maybeShoppingDone();
};
ACT.uncheckAll = () => { acct().plan.shop.checked = {}; U.sheet = null; render(); toast('List reset'); };
ACT.shareList = async () => {
  const p = acct().plan;
  const sl = Engine.shoppingList(p, today());
  const text = [`FoodMadeEasy · ${fmtRange(p.start)} · est. ${fmtKr(sl.total)}`, ...sl.stores.map((s) => `\n${s.name} (${fmtKr(s.total)})\n${s.items.filter((i) => !i.have).map((i) => `${i.checked ? '☑' : '☐'} ${i.name} — ${qtyText(i)}`).join('\n')}`)].join('\n');
  U.sheet = null; render();
  try {
    if (!navigator.share) throw new Error('no share');
    await navigator.share({ title: 'Shopping list', text });
  } catch (e) {
    if (e && e.name === 'AbortError') return;
    try { await navigator.clipboard.writeText(text); toast('List copied to clipboard'); } catch (e2) { toast("Couldn't share or copy the list here"); }
  }
};

// ---------- S25 Item detail ----------

ACT.openItem = (d) => openSheet('item', { id: d.id });
SHEETS.item = ({ id }) => {
  const p = acct().plan;
  const i = Engine.shoppingList(p, today()).items.find((x) => x.id === id);
  if (!i) return '<div class="sheet-body">Item no longer on your list.</div>';
  const ing = ING[id];
  const bought = i.count * i.size;
  const extra = bought - i.need;
  const needTxt = ing.piece ? `${Math.round(i.need / ing.piece)} eggs` : fmtG(i.need);
  const extraTxt = ing.piece ? `${Math.round(extra / ing.piece)} extra` : `${fmtG(Math.max(5, extra))} extra`;
  const used = {};
  p.meals.forEach((day) => day.forEach((rid) => { if (RECIPE[rid].ing.some(([x]) => x === id)) used[rid] = (used[rid] || 0) + 1; }));
  const store = STORES.find((s) => s.id === i.store);
  return `<div class="sheet-head"><h2>${esc(i.name)}</h2><p class="muted">${esc(store.name)} · ${i.label}</p></div>
    <div class="sheet-body">
      <div class="kv"><span>Price</span><b>${fmtKr(i.price)}${i.offer ? ` <small class="good">offer, normally ${fmtKr(i.regular)}</small>` : ''}${i.offerEnded ? ' <small class="warn">offer ended</small>' : ''}</b></div>
      ${i.offerEnds ? `<div class="kv"><span>${i.offerEnded ? 'Offer ended' : 'Valid until'}</span><b>${fmtDay(i.offerEnds)}</b></div>` : ''}
      ${i.product ? `<div class="kv"><span>In the avis as</span><b>\u2063${esc(i.product)}</b></div>` : ''}
      ${i.real ? `<p class="fine">Real offer from ${esc(store.name)}'s tilbudsavis (${esc(i.real.replace('-W', ' week '))}). Regular price is estimated.</p>` : ''}
      <div class="why">You need <b>${needTxt}</b> · buying <b>${qtyText(i)}</b>${extra > 20 ? ` (${extraTxt})` : ''}</div>
      <div class="section-label">Used in</div>
      <div class="list">${Object.entries(used).map(([rid, n]) => `<button class="list-row" data-act="openRecipe" data-rid="${rid}" data-which="plan">${thumb(rid, 32)}<span class="grow">${esc(RECIPE[rid].name)}</span><span class="muted">${n} serving${n > 1 ? 's' : ''}</span></button>`).join('')}</div>
    </div>
    <div class="sheet-foot">${i.have ? btn('I need to buy it', 'toggleHave', { data: { id }, kind: 'secondary' })
      : `${btn(i.checked ? 'Unmark' : 'Mark as Bought', 'checkItem', { data: { id }, kind: i.checked ? 'secondary' : 'primary' })}${i.checked ? '' : btn('Already have it', 'toggleHave', { data: { id }, kind: 'text' })}`}</div>`;
};
ACT.toggleHave = (d) => {
  const p = acct().plan;
  const i = Engine.shoppingList(p, today()).items.find((x) => x.id === d.id);
  const was = !!p.shop.have[d.id];
  if (was) delete p.shop.have[d.id]; else p.shop.have[d.id] = true;
  U.sheet = null;
  render();
  if (!was) toast(`Marked as have it · −${fmtKr(i.total)}`, { undo: () => { delete p.shop.have[d.id]; render(); } });
  maybeShoppingDone();
};

// ---------- S26 Shopping Complete ----------

SHEETS.shopDone = () => {
  const p = acct().plan;
  const sl = Engine.shoppingList(p, today());
  const prep = Engine.prepPlan(p, curSession(p));
  return `<div class="sheet-body center-col"><div class="burst">✓</div><h2>Shopping done</h2>
    <p>${sl.count} items · est. ${fmtKr(sl.total)}</p>
    ${prep.containers ? `<p class="muted">Next up: meal prep, about ${fmtDuration(prep.minutes).replace('~', '')} for ${prep.containers} meals.</p>` : ''}</div>
    <div class="sheet-foot">${prep.containers ? btn('Start Meal Prep', 'openPrep') : ''}${btn('Later', 'closeSheet', { kind: 'text' })}</div>`;
};
