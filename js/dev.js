// Prototype tools: simulate time, offline and failures. Shown beside the phone on desktop
// and inside Settings on small screens. Not part of the product.

function devControls() {
  const d = S.dev;
  const tgl = (key, label) => `<label class="dev-row"><span>${label}</span><input type="checkbox" class="switch" data-devtoggle="${key}" ${d[key] ? 'checked' : ''}></label>`;
  return `<div class="dev-row">${langSwitch()}</div><div class="dev-row"><span>Today is <b>${fmtDay(today())}</b>${d.dayOffset ? ` <small>(${signed(d.dayOffset)} d)</small>` : ''}</span>
      <span class="dev-btns"><button data-act="devDay" data-v="-1">−1 day</button><button data-act="devDay" data-v="1">+1 day</button>${d.dayOffset ? '<button data-act="devDay" data-v="0">Reset</button>' : ''}</span></div>
    ${tgl('offline', 'Simulate offline')}
    ${tgl('failNext', 'Fail next plan build')}
    ${tgl('noData', 'Grocery data unavailable')}
    <div class="dev-row"><button data-act="devExample">Fill onboarding with example user</button></div>
    <div class="dev-row"><button data-act="devReset" class="danger">Reset prototype</button></div>`;
}

function renderDevPanel() {
  const el = document.getElementById('dev');
  if (!el) return;
  el.innerHTML = i18nHtml(`<h2>Prototype tools</h2><p class="dev-note">FoodMadeEasy V1 clickable prototype. All prices, offers and accounts are fake and live only in this browser.</p>
    <div class="dev-box">${devControls()}</div>
    <h3>Jump to a screen</h3>
    <div class="dev-links">
      <button data-act="devGo" data-v="welcome">Welcome</button>
      <button data-act="devGo" data-v="home">Home</button>
      <button data-act="devGo" data-v="plan">Plan</button>
      <button data-act="devGo" data-v="shop">Shop</button>
      <button data-act="devGo" data-v="prep">Meal prep</button>
      <button data-act="devGo" data-v="profile">Profile</button>
    </div>
    <p class="dev-note">Tip: after accepting a plan, use “+1 day” to walk through the week (fridge reminders, week ending, next week).</p>`);
}

document.addEventListener('change', (ev) => {
  const k = ev.target.dataset && ev.target.dataset.devtoggle;
  if (!k) return;
  S.dev[k] = ev.target.checked;
  if (k === 'offline' && !S.dev.offline) toast('Back online · synced');
  render();
});

ACT.devDay = (d) => {
  S.dev.dayOffset = d.v === '0' ? 0 : S.dev.dayOffset + Number(d.v);
  U.planDayFor = null;
  render();
};
ACT.devReset = () => dialog({ title: 'Reset the prototype?', body: 'Deletes all fake accounts, plans and settings in this browser.', ok: 'Reset', danger: true, onOk: () => { resetAll(); U.stack = []; go('splash'); } });
ACT.devExample = () => {
  if (S.user && acct().profile) { toast('Log out first to run onboarding again.'); return; }
  S.onboarding = { step: 'summary', draft: exampleDraft(), started: true };
  go('summary');
};
ACT.devGo = (d) => {
  if (d.v === 'welcome') { go('welcome'); return; }
  if (!S.user || !acct().profile) { toast('Finish onboarding first (or use the example user).'); return; }
  if (d.v === 'prep') { U.prepOrigin = { name: 'home', props: {} }; go('prep', { view: 'overview' }); return; }
  go(d.v);
};
