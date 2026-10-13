(function () {
  // ===== Pengaturan (ubah di sini) =====
  var NOMOR_WA = "62895343626600"; // awali 62, tanpa + atau 0 di depan
  var NAMA_USAHA = "Risol Bang Jek";
  var JAM_BUKA = 8, JAM_TUTUP = 20;
  var KODE_PROMO = "RISOL10"; // diskon 10%
  // Ongkir antar dihitung per kilometer. faktor = pengali dari jarak lurus ke perkiraan jarak jalan.
  var ONGKIR = { tarif: 2500, minimal: 5000, maks: 10, faktor: 1.3 };
  // GANTI dengan titik warungmu (Google Maps: klik kanan pada lokasi, lalu salin angka koordinat).
  var TOKO = { lat: -6.884762478396344, lng: 107.57794572307118 };
  var EKSTENSI = "jpg"; // ganti ke "png" atau "webp" jika foto kamu berformat itu
  var ALAMAT = "Jl. Cibogo Atas, Gg. Siti Murgi, No. 111, Kota Bandung"; // GANTI dengan alamat asli warung
  var SOSIAL = { Instagram: "https://www.instagram.com/dzki.fr", TikTok: "https://www.tiktok.com/@dzakii.f" }; // isi link lengkap; yang kosong tidak ditampilkan

  // Foto disimpan di folder img/ dengan nama sesuai "berkas" + EKSTENSI.
  // Contoh: berkas "risol-mayo" -> img/risol-mayo.jpg
  // posisi = bagian foto yang ditampilkan: "kiri-kanan atas-bawah", 0% = atas, 100% = bawah.
  // Contoh: "center 80%" menggeser bingkai ke bagian bawah foto.
  // Tambahkan habis: true pada menu yang sedang kosong; tombolnya otomatis jadi "Habis".
  var MENU = [
    { id: 1, kat: "Gurih", nama: "Risol Mayo",            harga: 5000, badge: "Favorit", berkas: "risol-mayo", posisi: "center 40%",            desc: "Smoked beef, telur, dan mayo yang meleleh saat digigit." },
    { id: 2, kat: "Gurih", nama: "Risol Ragout",          harga: 5000, berkas: "risol-ragout", posisi: "center 40%",          desc: "Ayam dan sayur dalam saus krim yang kental." },
    { id: 3, kat: "Gurih", nama: "Risol Pizza",           harga: 6000, berkas: "risol-pizza", posisi: "center 80%",           desc: "Saus tomat, keju, dan sosis dalam kulit garing." },
    { id: 4, kat: "Gurih", nama: "Risol Ayam Pedas",      harga: 5000, berkas: "risol-ayam-pedas", posisi: "center 70%",      desc: "Ayam suwir bumbu cabai, kulit garing." },
    { id: 5, kat: "Manis", nama: "Risol Cokelat Crunchy", harga: 6000, badge: "Favorit", berkas: "risol-cokelat-crunchy", posisi: "center 50%", desc: "Kulit crunchy dengan cokelat yang meleleh saat dibelah." },
    { id: 6, kat: "Manis", nama: "Risol Matcha",          harga: 6000, badge: "Baru",    berkas: "risol-matcha", posisi: "center 40%",          desc: "Matcha lumer di dalam, taburan matcha di luar." }
  ];

  var IKON = {
    Instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    TikTok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 4c.3 2.3 1.9 3.8 4.5 4"/></svg>'
  };
  var $ = function (id) { return document.getElementById(id); };
  var rp = function (n) { return "Rp" + n.toLocaleString("id-ID"); };
  var cari = function (id) { return MENU.filter(function (m) { return m.id === Number(id); })[0]; };

  // ===== Status buka/tutup (selalu jam WIB, bukan jam perangkat pengunjung) =====
  var buka = true;
  var dua = function (n) { return String(n).padStart(2, "0"); };
  function perbaruiPapan() {
    var h = parseInt(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "numeric", hourCycle: "h23" }).format(new Date()), 10);
    buka = h >= JAM_BUKA && h < JAM_TUTUP;
    $("papan").dataset.buka = buka;
    $("papanTeks").textContent = buka ? "BUKA" : "TUTUP";
    $("papanJam").textContent = buka ? "Pesanan diterima " + dua(JAM_BUKA) + ".00 sampai " + dua(JAM_TUTUP) + ".00 WIB" : "Buka lagi " + (h >= JAM_TUTUP ? "besok " : "hari ini ") + dua(JAM_BUKA) + ".00 WIB";
    $("infoTutup").hidden = buka;
    $("infoTutup").textContent = "Warung sedang tutup. Pesananmu tetap bisa dikirim dan diproses saat buka.";
  }
  perbaruiPapan();
  setInterval(perbaruiPapan, 60000);

  // ===== Keranjang =====
  // Keranjang disimpan per tab (sessionStorage): aman saat halaman ter-refresh, kosong lagi saat tab ditutup.
  var lokasi = null, promo = false, qty = {}, jarak = null, tipe = "Ambil di tempat", bayar = "Tunai";
  try {
    var s = JSON.parse(sessionStorage.getItem("risol-keranjang") || "{}");
    Object.keys(s).forEach(function (id) { if (cari(id) && !cari(id).habis && s[id] > 0) qty[id] = Math.min(99, s[id] | 0); });
  } catch (e) {}

  function ubah(id, d) {
    if (d > 0 && cari(id).habis) return;
    if (d > 0) toast("Masuk keranjang: " + cari(id).nama);
    qty[id] = Math.min(99, Math.max(0, (qty[id] || 0) + d));
    if (!qty[id]) delete qty[id];
    perbarui();
  }

  function hitung() {
    var j = 0, t = 0;
    Object.keys(qty).forEach(function (id) { j += qty[id]; t += qty[id] * cari(id).harga; });
    var d = promo ? Math.round(t * 0.1) : 0;
    var o = tipe === "Diantar" && jarak && jarak <= ONGKIR.maks ? Math.max(ONGKIR.minimal, Math.ceil(jarak) * ONGKIR.tarif) : 0;
    return { jumlah: j, subtotal: t, diskon: d, total: t - d, ongkir: o, bayar: t - d + o };
  }

  var stepper = function (id, n, nama) {
    return '<div class="stepper"><button data-aksi="-1" data-id="' + id + '" aria-label="Kurangi ' + nama + '">&minus;</button><span>' + n + '</span><button data-aksi="1" data-id="' + id + '" aria-label="Tambah ' + nama + '">+</button></div>';
  };

  // ===== Menu =====
  $("daftar").innerHTML = MENU.map(function (m) {
    return '<article class="item' + (m.habis ? " habis" : "") + '" data-kat="' + m.kat + '" data-id="' + m.id + '">' +
      '<div class="gambar">' + '<img src="img/' + m.berkas + "." + EKSTENSI + '" alt="' + m.nama + '" style="object-position:' + (m.posisi || "center") + '" loading="lazy" onerror="this.parentNode.classList.add(\'kosong\');this.remove()">' + (m.badge ? '<span class="badge">' + m.badge + "</span>" : "") + "</div>" +
      '<div class="rinci"><h3>' + m.nama + "</h3><p>" + m.desc + '</p><p class="sub"></p></div>' +
      '<div class="aksi"><b>' + rp(m.harga) + '</b><div class="kontrol"></div></div></article>';
  }).join("");

  function perbaruiMenu() {
    document.querySelectorAll(".item").forEach(function (el) {
      var id = el.dataset.id, m = cari(id), n = qty[id] || 0;
      el.querySelector(".sub").textContent = n ? n + " x " + rp(m.harga) + " = " + rp(n * m.harga) : "";
      el.querySelector(".kontrol").innerHTML = m.habis ? '<button class="tambah" disabled>Habis</button>' : n ? stepper(id, n, m.nama) : '<button class="tambah" data-aksi="1" data-id="' + id + '" aria-label="Tambah ' + m.nama + '">+</button>';
    });
  }

  // ===== Nota =====
  function perbaruiNota() {
    var ids = Object.keys(qty);
    $("notaBaris").innerHTML = ids.length ? ids.map(function (id) {
      var m = cari(id), n = qty[id];
      return '<div class="baris"><div><b>' + m.nama + "</b><small>" + n + " x " + rp(m.harga) + "</small></div><b>" + rp(n * m.harga) + "</b>" + stepper(id, n, m.nama) + "</div>";
    }).join("") : '<p class="nota-kosong">Belum ada pesanan.</p>';
    var h = hitung();
    $("diskon").hidden = !h.diskon;
    $("diskon").textContent = "Diskon " + KODE_PROMO + ": -" + rp(h.diskon);
    $("notaTotal").textContent = rp(h.total);
    $("qrisTotal").textContent = rp(h.bayar);
    var rr = function (k, v, c) { return '<div class="rr' + (c ? " " + c : "") + '"><span>' + k + "</span><b>" + v + "</b></div>"; };
    var teksOngkir = !jarak ? "Isi jarak dulu" : jarak > ONGKIR.maks ? "Di luar jangkauan" : rp(h.ongkir);
    $("rincian").innerHTML = rr("Subtotal", rp(h.subtotal)) + (h.diskon ? rr("Diskon " + KODE_PROMO, "-" + rp(h.diskon)) : "") +
      (tipe === "Diantar" ? rr("Ongkir" + (jarak ? " (" + jarak.toFixed(1) + " km)" : ""), teksOngkir) : "") + rr("Total bayar", rp(h.bayar), "total");
  }

  function perbarui() {
    var h = hitung();
    $("keranjang").hidden = h.jumlah === 0;
    document.body.classList.toggle("ada-pesanan", h.jumlah > 0);
    try { sessionStorage.setItem("risol-keranjang", JSON.stringify(qty)); } catch (e) {}
    $("kJumlah").textContent = h.jumlah + " item";
    $("kTotal").textContent = rp(h.total);
    perbaruiMenu();
    perbaruiNota();
    if (h.jumlah === 0 && $("nota").open) $("nota").close();
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-aksi]");
    if (t) ubah(t.dataset.id, Number(t.dataset.aksi));
  });

  // ===== Filter kategori =====
  var tabs = document.querySelectorAll(".tabs .tab");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.setAttribute("aria-pressed", t === tab ? "true" : "false"); });
      document.querySelectorAll(".item").forEach(function (it) {
        it.hidden = !(tab.dataset.kat === "Semua" || it.dataset.kat === tab.dataset.kat);
      });
    });
  });

  // ===== Dialog nota =====
  function langkah(n) { $("vKeranjang").hidden = n !== 1; $("vBayar").hidden = n !== 2; }
  $("kBuka").addEventListener("click", function () { langkah(1); $("nota").showModal(); });
  $("kLanjut").addEventListener("click", function () { langkah(2); $("nota").scrollTop = 0; });
  $("nKembali").addEventListener("click", function () { langkah(1); });
  $("nota").addEventListener("close", function () { langkah(1); });
  $("nTutup").addEventListener("click", function () { $("nota").close(); });
  $("nota").addEventListener("click", function (e) { if (e.target === $("nota")) $("nota").close(); });
  $("nKosong").addEventListener("click", function () { qty = {}; perbarui(); });

  function pilih(selektor, kunci, aksi) {
    var bs = document.querySelectorAll(selektor);
    bs.forEach(function (b) {
      b.addEventListener("click", function () {
        bs.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        aksi(b.dataset[kunci]);
      });
    });
  }
  pilih("#tipe .tab", "tipe", function (v) {
    tipe = v;
    var antar = v === "Diantar";
    $("lAlamat").hidden = $("pAlamat").hidden = $("blokJarak").hidden = !antar;
    perbarui();
  });
  pilih("#bayarPilih .tab", "bayar", function (v) {
    bayar = v;
    $("qrisBox").hidden = v !== "QRIS";
  });


  // ===== Jarak & ongkir =====
  function infoAwal() { $("infoJarak").textContent = "Ongkir " + rp(ONGKIR.tarif) + " per km, minimal " + rp(ONGKIR.minimal) + ", maksimal " + ONGKIR.maks + " km."; }
  infoAwal();
  function setJarak(km) {
    jarak = km > 0 ? km : null;
    if (jarak && jarak > ONGKIR.maks) $("infoJarak").textContent = "Di luar jangkauan antar (maksimal " + ONGKIR.maks + " km). Pilih ambil di tempat atau tanya lewat WhatsApp.";
    else infoAwal();
    perbarui();
  }
  $("pJarak").addEventListener("input", function () { setJarak(parseFloat($("pJarak").value)); });
  $("hitungJarak").addEventListener("click", function () {
    if (!navigator.geolocation) { $("infoJarak").textContent = "Lokasi tidak tersedia di perangkat ini. Isi jarak secara manual."; return; }
    $("infoJarak").textContent = "Membaca lokasi kamu...";
    navigator.geolocation.getCurrentPosition(function (p) {
      var r = Math.PI / 180, dLat = (p.coords.latitude - TOKO.lat) * r, dLng = (p.coords.longitude - TOKO.lng) * r;
      var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(TOKO.lat * r) * Math.cos(p.coords.latitude * r) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
      var km = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * ONGKIR.faktor * 10) / 10;
      lokasi = { lat: p.coords.latitude, lng: p.coords.longitude };
      $("pJarak").value = km;
      setJarak(km);
      if (km <= ONGKIR.maks) $("infoJarak").textContent = "Perkiraan jarak " + km + " km. Ongkir bisa disesuaikan lewat chat jika berbeda.";
    }, function () { $("infoJarak").textContent = "Lokasi tidak bisa dibaca. Isi jarak secara manual."; }, { timeout: 10000 });
  });

  function kirimWA(pesan) { var u = "https://wa.me/" + NOMOR_WA + "?text=" + encodeURIComponent(pesan); if (!window.open(u, "_blank")) location.href = u; }
  $("waLangsung").href = "https://wa.me/" + NOMOR_WA + "?text=" + encodeURIComponent("Halo " + NAMA_USAHA + ", saya mau tanya.");
  $("alamat").textContent = ALAMAT;
  $("peta").href = "https://www.google.com/maps?q=" + TOKO.lat + "," + TOKO.lng;
  $("promoInfo").textContent = "Punya kode promo? Pakai " + KODE_PROMO + " di keranjang untuk diskon 10%.";
  $("sosial").innerHTML = Object.keys(SOSIAL).filter(function (k) { return SOSIAL[k]; }).map(function (k) { return '<a class="ikon-link" href="' + SOSIAL[k] + '" target="_blank" rel="noopener">' + (IKON[k] || "") + k + "</a>"; }).join("");

  $("nKirim").addEventListener("click", function () {
    if (!$("pNama").reportValidity()) return;
    if (tipe === "Diantar") {
      if (!$("pAlamat").reportValidity()) return;
      if (!jarak) { toast("Isi jarak antar dulu"); $("pJarak").focus(); return; }
      if (jarak > ONGKIR.maks) { toast("Di luar jangkauan antar"); return; }
    }
    var jam = $("pJam").value;
    if (jam && (jam < dua(JAM_BUKA) + ":00" || jam >= dua(JAM_TUTUP) + ":00")) { toast("Jam harus " + dua(JAM_BUKA) + ".00 sampai " + dua(JAM_TUTUP) + ".00"); $("pJam").focus(); return; }
    var baris = Object.keys(qty).map(function (id) {
      var m = cari(id);
      return "- " + qty[id] + "x " + m.nama + " (" + rp(qty[id] * m.harga) + ")";
    });
    var h = hitung(), alamat = $("pAlamat").value.trim(), catatan = $("pCatatan").value.trim();
    var no = "RBJ-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    kirimWA("Halo " + NAMA_USAHA + ", saya " + $("pNama").value.trim() + ".\n" +
      "No. pesanan: " + no + "\n" +
      "Pesanan (" + tipe.toLowerCase() + (tipe === "Diantar" && alamat ? ", " + alamat : "") + "):\n" + baris.join("\n") +
      "\nSubtotal: " + rp(h.subtotal) + (h.diskon ? "\nDiskon " + KODE_PROMO + ": -" + rp(h.diskon) : "") +
      (tipe === "Diantar" ? "\nOngkir (perkiraan " + jarak.toFixed(1) + " km): " + rp(h.ongkir) + (lokasi ? "\nTitik lokasi: https://maps.google.com/?q=" + lokasi.lat.toFixed(5) + "," + lokasi.lng.toFixed(5) : "") : "") +
      "\nTotal: " + rp(h.bayar) + "\nBayar: " + bayar + "\nJam: " + (jam || "secepatnya") + (catatan ? "\nCatatan: " + catatan : "") + (buka ? "" : "\n(Dikirim di luar jam buka)"));
  });

  // ===== Kode promo =====
  $("kodePakai").addEventListener("click", function () {
    promo = $("kode").value.trim().toUpperCase() === KODE_PROMO;
    toast(promo ? "Kode dipakai, diskon 10%" : "Kode promo tidak dikenal");
    perbarui();
  });

  $("salinNominal").addEventListener("click", function () {
    var n = String(hitung().bayar);
    (navigator.clipboard ? navigator.clipboard.writeText(n) : Promise.reject()).then(function () { toast("Nominal disalin: " + n); }, function () { toast("Gagal menyalin. Ketik nominalnya manual."); });
  });

  // ===== Toast =====
  function toast(t) {
    var el = $("toast");
    el.textContent = t;
    el.classList.add("tampil");
    clearTimeout(toast.w);
    toast.w = setTimeout(function () { el.classList.remove("tampil"); }, 1800);
  }

  // ===== Mode malam =====
  var tm = $("malam");
  function setTema(malam) {
    document.body.dataset.tema = malam ? "malam" : "";
    tm.setAttribute("aria-pressed", malam ? "true" : "false");
    tm.textContent = malam ? "Mode siang" : "Mode malam";
    try { localStorage.setItem("risol-malam", malam ? "1" : "0"); } catch (e) {}
  }
  var tersimpan = null;
  try { tersimpan = localStorage.getItem("risol-malam"); } catch (e) {}
  setTema(tersimpan === null ? window.matchMedia("(prefers-color-scheme: dark)").matches : tersimpan === "1");
  tm.addEventListener("click", function () { setTema(document.body.dataset.tema !== "malam"); });

  // ===== Ulasan pelanggan =====
  // PENTING: isi di bawah ini hanya CONTOH. Ganti dengan ulasan asli (dengan izin pelanggan), atau kosongkan [] agar bagian ini tersembunyi.
  var ULASAN = [
    { t: "Kulitnya garing banget, isi mayonya melimpah. Habis sebelum sampai rumah.", n: "Dina, pelanggan baru" },
    { t: "Pesan lewat WhatsApp gampang. Datang tinggal ambil, risolnya masih panas.", n: "Rafi, pelanggan langganan" },
    { t: "Risol matcha-nya juara. Matcha-nya meleleh pas digigit.", n: "Sari, pesan untuk arisan" },
    { t: "Risol cokelat crunchy-nya lumer banget. Beli satu langsung nambah.", n: "Bimo, pencinta cokelat" }
  ];
  var u = 0, putar;
  $("titik").innerHTML = ULASAN.map(function (x, i) { return '<button type="button" data-i="' + i + '" aria-label="Ulasan ' + (i + 1) + '"></button>'; }).join("");
  function tampilUlasan(i) {
    u = i;
    $("uTeks").textContent = ULASAN[i].t;
    $("uNama").textContent = ULASAN[i].n;
    document.querySelectorAll("#titik button").forEach(function (b, k) { b.setAttribute("aria-current", k === i ? "true" : "false"); });
  }
  function jalankanUlasan() {
    clearInterval(putar);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    putar = setInterval(function () { tampilUlasan((u + 1) % ULASAN.length); }, 6000);
  }
  $("titik").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (b) { tampilUlasan(Number(b.dataset.i)); jalankanUlasan(); }
  });
  if (ULASAN.length) { tampilUlasan(0); jalankanUlasan(); } else $("ulasan").hidden = true;

  // ===== Navigasi: tandai menu yang sedang dilihat =====
  var navLink = document.querySelectorAll(".nav-menu a");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) navLink.forEach(function (a) { a.classList.toggle("aktif", a.getAttribute("href") === "#" + e.target.id); });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    navLink.forEach(function (a) { var s = document.querySelector(a.getAttribute("href")); if (s) io.observe(s); });
  }

  $("tahun").textContent = new Date().getFullYear();
  perbarui();
})();