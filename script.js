(function () {
  'use strict';

  var state = { type: 'vertical', volume: 1, material: '304', opts: { hatch: false, mixer: false, insul: false } };
  var MAT = {
    '304': { sigma: 160, rho: 7900, C: 1, price: 210, label: 'AISI 304' },
    '316': { sigma: 160, rho: 7900, C: 1, price: 282, label: 'AISI 316L' },
    'st3': { sigma: 147, rho: 7850, C: 2, price: 88, label: 'Ст3' }
  };
  var TANK_LABELS = { vertical: 'Вертикальная', horizontal: 'Горизонтальная', rectangular: 'Прямоугольная', conical: 'Коническая' };

  // TANK TYPE
  var tankOpts = document.querySelectorAll('.tank-opt');
  tankOpts.forEach(function (el) {
    el.addEventListener('click', function () {
      tankOpts.forEach(function (e) { e.classList.remove('active'); });
      el.classList.add('active');
      state.type = el.id.replace('t-', '');
    });
  });

  // VOLUME PILLS
  var pills = document.querySelectorAll('.pill');
  var customWrap = document.getElementById('custom-vol-wrap');
  var customInput = document.getElementById('custom-vol-input');
  pills.forEach(function (el) {
    el.addEventListener('click', function () {
      pills.forEach(function (p) { p.classList.remove('active'); });
      el.classList.add('active');
      if (el.dataset.vol === 'custom') { customWrap.classList.add('show'); state.volume = null; }
      else { customWrap.classList.remove('show'); state.volume = parseFloat(el.dataset.vol); }
    });
  });
  customInput.addEventListener('input', function () { state.volume = parseFloat(this.value) || null; });

  // MATERIAL
  var matCards = document.querySelectorAll('.mat-card');
  matCards.forEach(function (el) {
    el.addEventListener('click', function () {
      matCards.forEach(function (e) { e.classList.remove('active'); });
      el.classList.add('active');
      state.material = el.id.replace('m-', '');
    });
  });

  // OPTIONS
  var optCards = document.querySelectorAll('.opt-card');
  optCards.forEach(function (el) {
    el.addEventListener('click', function () {
      el.classList.toggle('active');
      state.opts[el.id.replace('opt-', '')] = el.classList.contains('active');
    });
  });

  // CALCULATE
  document.getElementById('btn-calc').addEventListener('click', function () {
    var V = state.volume;
    if (!V || V <= 0) { alert('Укажите объём ёмкости'); return; }
    var mat = MAT[state.material];
    var sel = document.getElementById('product-sel');
    var density = parseFloat(sel.options[sel.selectedIndex].dataset.d);
    // ── Geometry & wall thickness per VKR formulas 2.1–2.17 ──
    var D_mm, t, S;
    if (state.type === 'vertical') {
      // H/D = 1.5 → r = cbrt(V/3π), H = 3r  (VKR formula 2.3)
      var r_v = Math.cbrt(V / (3 * Math.PI));
      D_mm = 2 * r_v * 1000;
      var H_v = 3 * r_v;
      S = 2 * Math.PI * r_v * r_v + 2 * Math.PI * r_v * H_v;
      t = Math.max((0.05 * D_mm) / (2 * mat.sigma * 0.85 - 0.05) + mat.C, 4);
    } else if (state.type === 'horizontal') {
      // L/D = 2 → r = cbrt(V/4π), L = 4r  (VKR canonical code)
      var r_h = Math.cbrt(V / (4 * Math.PI));
      D_mm = 2 * r_h * 1000;
      var L_h = 4 * r_h;
      S = 2 * Math.PI * r_h * r_h + 2 * Math.PI * r_h * L_h;
      t = Math.max((0.05 * D_mm) / (2 * mat.sigma * 0.85 - 0.05) + mat.C, 4);
    } else if (state.type === 'rectangular') {
      // L = 2W, H = W → V = 2W^3 → W = cbrt(V/2)  (VKR formulas 2.6–2.7)
      var W_r = Math.cbrt(V / 2);
      var L_r = 2 * W_r;
      var H_r = W_r;
      S = 2 * (L_r * W_r + L_r * H_r + W_r * H_r);
      // Wall thickness: +20% vs equivalent cylinder  (VKR section 2.2.3)
      var r_eq = Math.cbrt(V / (3 * Math.PI));
      D_mm = 2 * r_eq * 1000;
      var t_p_cyl = (0.05 * D_mm) / (2 * mat.sigma * 0.85 - 0.05);
      t = Math.max(1.2 * t_p_cyl + mat.C, 4);
    } else {
      // Conical: truncated cone, r2 = r1/3  (VKR formulas 2.8–2.10, 2.17)
      var r1_c = Math.cbrt(V / (3 * Math.PI));
      var r2_c = r1_c / 3;
      D_mm = 2 * r1_c * 1000;
      var denom_c = r1_c * r1_c + r1_c * r2_c + r2_c * r2_c;
      var H_c = (3 * V) / (Math.PI * denom_c);
      var l_c = Math.sqrt(H_c * H_c + (r1_c - r2_c) * (r1_c - r2_c));
      S = Math.PI * r1_c * r1_c + Math.PI * r2_c * r2_c + Math.PI * (r1_c + r2_c) * l_c;
      var alpha_c = Math.atan((r1_c - r2_c) / H_c);
      t = Math.max((0.05 * D_mm) / (2 * mat.sigma * 0.85 * Math.cos(alpha_c) - 0.05) + mat.C, 4);
    }
    var weight = S * (t / 1000) * mat.rho;
    var liquid = V * density;
    var price = weight * mat.price * 2.9;
    if (state.opts.hatch) price += 45000;
    if (state.opts.mixer) price += 85000;
    if (state.opts.insul) price += 32000;
    var lead = V <= 1 ? 3 : V <= 5 ? 4 : V <= 20 ? 6 : 10;
    if (state.opts.mixer) lead += 2;
    if (state.opts.insul) lead += 1;
    var optList = [];
    if (state.opts.hatch) optList.push('Люк');
    if (state.opts.mixer) optList.push('Мешалка');
    if (state.opts.insul) optList.push('Изоляция');
    var cfg = mat.label + (optList.length ? ' · ' + optList.join(', ') : '');
    document.getElementById('r-weight').textContent = Math.round(weight).toLocaleString('ru');
    document.getElementById('r-price').textContent = Math.round(price).toLocaleString('ru');
    document.getElementById('r-lead').textContent = lead;
    document.getElementById('r-vol').textContent = V + ' м\u00b3 / ' + (V * 1000) + ' л';
    document.getElementById('r-liq').textContent = Math.round(liquid).toLocaleString('ru') + ' кг';
    document.getElementById('r-wall').textContent = t.toFixed(1) + ' мм';
    document.getElementById('r-cfg').textContent = cfg;
    document.getElementById('result').classList.add('show');
    document.getElementById('result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (window.TC_DB) {
      var now = new Date();
      var ds = now.toLocaleDateString('ru') + ' ' + now.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
      try {
        window.TC_DB.run('INSERT INTO calculations (tank_type,volume,material,weight,price,wall_t,options,created_at) VALUES (?,?,?,?,?,?,?,?)',
          [state.type, V, mat.label, Math.round(weight), Math.round(price), parseFloat(t.toFixed(1)), optList.length ? optList.join(', ') : '—', ds]);
        renderHistory();
      } catch (e) { console.warn(e); }
    }
  });

  // RESET
  document.getElementById('btn-reset').addEventListener('click', function () {
    state = { type: 'vertical', volume: 1, material: '304', opts: { hatch: false, mixer: false, insul: false } };
    tankOpts.forEach(function (e) { e.classList.remove('active'); });
    document.getElementById('t-vertical').classList.add('active');
    pills.forEach(function (p) { p.classList.remove('active'); });
    document.querySelector('.pill[data-vol="1"]').classList.add('active');
    customWrap.classList.remove('show'); customInput.value = '';
    matCards.forEach(function (e) { e.classList.remove('active'); });
    document.getElementById('m-304').classList.add('active');
    optCards.forEach(function (e) { e.classList.remove('active'); });
    document.getElementById('product-sel').selectedIndex = 0;
    document.getElementById('result').classList.remove('show');
  });

  // RENDER HISTORY
  function renderHistory() {
    if (!window.TC_DB) return;
    var tbody = document.getElementById('db-tbody');
    var rows; try { rows = window.TC_DB.exec('SELECT * FROM calculations ORDER BY id DESC'); } catch (e) { return; }
    if (!rows.length || !rows[0].values.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="db-empty">Нет данных. Сделайте расчёт — он сохранится автоматически.</td></tr>';
      document.getElementById('db-count').textContent = '0'; return;
    }
    var vals = rows[0].values;
    document.getElementById('db-count').textContent = vals.length;
    var html = '';
    vals.forEach(function (r) {
      html += '<tr><td>' + r[0] + '</td><td class="td-type">' + (TANK_LABELS[r[1]] || r[1]) + '</td><td>' + r[2] + ' м\u00b3</td><td>' + r[3] + '</td><td>' + Number(r[4]).toLocaleString('ru') + '</td><td class="td-price">' + Number(r[5]).toLocaleString('ru') + '</td><td>' + r[6] + ' мм</td><td>' + r[7] + '</td><td>' + r[8] + '</td></tr>';
    });
    tbody.innerHTML = html;
  }

  // EXPORT .db
  document.getElementById('btn-export').addEventListener('click', function () {
    if (!window.TC_DB) { alert('БД ещё не готова'); return; }
    var check = window.TC_DB.exec('SELECT COUNT(*) FROM calculations');
    if (!check.length || check[0].values[0][0] === 0) { alert('Нет данных. Сначала сделайте расчёт.'); return; }
    var data = window.TC_DB.export();
    var blob = new Blob([data], { type: 'application/x-sqlite3' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    var now = new Date();
    a.download = 'tankcalc_' + now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + '.db';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  });

  // SQL MODAL — using simple show/hide on two separate elements
  function openModal() {
    if (!window.TC_DB) { alert('БД ещё не готова — подождите зелёного огонька'); return; }
    var rows; try { rows = window.TC_DB.exec('SELECT * FROM calculations ORDER BY id ASC'); } catch (e) { alert('Ошибка: ' + e.message); return; }
    var sql = 'CREATE TABLE IF NOT EXISTS calculations (\n  id         INTEGER PRIMARY KEY AUTOINCREMENT,\n  tank_type  TEXT,\n  volume     REAL,\n  material   TEXT,\n  weight     REAL,\n  price      REAL,\n  wall_t     REAL,\n  options    TEXT,\n  created_at TEXT\n);\n\n';
    if (rows.length && rows[0].values.length) {
      rows[0].values.forEach(function (r) {
        sql += "INSERT INTO calculations (id,tank_type,volume,material,weight,price,wall_t,options,created_at) VALUES (";
        sql += r[0] + "," + "'" + String(r[1]).replace(/'/g, "''") + "'," + r[2] + "," + "'" + String(r[3]).replace(/'/g, "''") +
          "'," + r[4] + "," + r[5] + "," + r[6] + "," + "'" + String(r[7]).replace(/'/g, "''") +
          "','" + String(r[8]).replace(/'/g, "''") + "');\n";
      });
    } else { sql += '-- Нет данных. Сделайте расчёт сначала.\n'; }
    document.getElementById('sql-code-block').textContent = sql;
    document.getElementById('sql-overlay').style.display = 'block';
    document.getElementById('sql-box').style.display = 'block';
  }
  function closeModal() {
    document.getElementById('sql-overlay').style.display = 'none';
    document.getElementById('sql-box').style.display = 'none';
  }
  document.getElementById('btn-sql').addEventListener('click', openModal);
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('sql-overlay').addEventListener('click', closeModal);
  document.getElementById('btn-copy-sql').addEventListener('click', function () {
    var code = document.getElementById('sql-code-block').textContent;
    var btn = document.getElementById('btn-copy-sql');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(function () { btn.textContent = '\u2713 Скопировано!'; setTimeout(function () { btn.textContent = '\uD83D\uDCCB Скопировать SQL'; }, 2000); });
    } else {
      var el = document.getElementById('sql-code-block');
      var range = document.createRange(); range.selectNodeContents(el);
      window.getSelection().removeAllRanges(); window.getSelection().addRange(range);
      document.execCommand('copy');
      btn.textContent = '\u2713 Скопировано!'; setTimeout(function () { btn.textContent = '\uD83D\uDCCB Скопировать SQL'; }, 2000);
    }
  });

  // CLEAR DB
  document.getElementById('btn-clear-db').addEventListener('click', function () {
    if (!window.TC_DB) return;
    if (!confirm('Удалить все записи?')) return;
    window.TC_DB.run('DELETE FROM calculations');
    try { window.TC_DB.run('DELETE FROM sqlite_sequence WHERE name="calculations"'); } catch (e) { }
    renderHistory();
  });

  // INIT SQLite dynamically — never blocks buttons
  var script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/sql-wasm.js';
  script.onload = function () {
    var dot = document.getElementById('db-dot');
    var status = document.getElementById('db-status-text');
    initSqlJs({ locateFile: function (f) { return 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/' + f; } })
      .then(function (SQL) {
        var db = new SQL.Database();
        db.run('CREATE TABLE IF NOT EXISTS calculations (id INTEGER PRIMARY KEY AUTOINCREMENT,tank_type TEXT,volume REAL,material TEXT,weight REAL,price REAL,wall_t REAL,options TEXT,created_at TEXT)');
        window.TC_DB = db;
        dot.className = 'db-dot ok';
        status.textContent = 'SQLite подключена — таблица calculations';
      }).catch(function (e) { dot.className = 'db-dot err'; status.textContent = 'Ошибка БД: ' + e.message; });
  };
  script.onerror = function () {
    document.getElementById('db-dot').className = 'db-dot err';
    document.getElementById('db-status-text').textContent = 'Нет интернета — калькулятор работает';
  };
  document.body.appendChild(script);

})();
