(function () {
  // ===== Pengaturan (ubah di sini) =====
  var NOMOR_WA = "62895343626600"; // awali 62, tanpa + atau 0 di depan
  var NAMA_USAHA = "Risol Bang Jek";
  var JAM_BUKA = 8, JAM_TUTUP = 20;
  var KODE_PROMO = "RISOL10"; // diskon 10%
  // Ongkir antar dihitung per kilometer. faktor = pengali dari jarak lurus ke perkiraan jarak jalan.
  var ONGKIR = { tarif: 2500, minimal: 5000, maks: 10, faktor: 1.3 };
  // GANTI dengan titik warungmu (Google Maps: klik kanan pada lokasi, lalu salin angka koordinat).
  var TOKO = { lat: -6.9175, lng: 107.6191 };
  var EKSTENSI = "jpg"; // ganti ke "png" atau "webp" jika foto kamu berformat itu

  // Foto disimpan di folder img/ dengan nama sesuai "berkas" + EKSTENSI.
  // Contoh: berkas "risol-mayo" -> img/risol-mayo.jpg
  // posisi = bagian foto yang ditampilkan: "kiri-kanan atas-bawah", 0% = atas, 100% = bawah.
  // Contoh: "center 80%" menggeser bingkai ke bagian bawah foto.
  var MENU = [
    { id: 1, kat: "Gurih", nama: "Risol Mayo",            harga: 5000, badge: "Favorit", berkas: "risol-mayo", posisi: "center 40%",            desc: "Smoked beef, telur, dan mayo yang meleleh saat digigit." },
    { id: 2, kat: "Gurih", nama: "Risol Ragout",          harga: 5000, berkas: "risol-ragout", posisi: "center 40%",          desc: "Ayam dan sayur dalam saus krim yang kental." },
    { id: 3, kat: "Gurih", nama: "Risol Pizza",           harga: 6000, berkas: "risol-pizza", posisi: "center 80%",           desc: "Saus tomat, keju, dan sosis dalam kulit garing." },
    { id: 4, kat: "Gurih", nama: "Risol Ayam Pedas",      harga: 5000, berkas: "risol-ayam-pedas", posisi: "center 70%",      desc: "Ayam suwir bumbu cabai, kulit garing." },
    { id: 5, kat: "Manis", nama: "Risol Cokelat Crunchy", harga: 6000, badge: "Favorit", berkas: "risol-cokelat-crunchy", posisi: "center 50%", desc: "Kulit crunchy dengan cokelat yang meleleh saat dibelah." },
    { id: 6, kat: "Manis", nama: "Risol Matcha",          harga: 6000, badge: "Baru",    berkas: "risol-matcha", posisi: "center 40%",          desc: "Matcha lumer di dalam, taburan matcha di luar." }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var rp = function (n) { return "Rp" + n.toLocaleString("id-ID"); };
  var cari = function (id) { return MENU.filter(function (m) { return m.id === Number(id); })[0]; };

  // ===== Status buka/tutup =====
  function perbaruiPapan() {
    var h = new Date().getHours(), b = h >= JAM_BUKA && h < JAM_TUTUP;
    $("papan").dataset.buka = b;
    $("papanTeks").textContent = b ? "BUKA" : "TUTUP";
    $("papanJam").textContent = "Pesanan diterima " + String(JAM_BUKA).padStart(2, "0") + ".00 sampai " + String(JAM_TUTUP).padStart(2, "0") + ".00";
  }
  perbaruiPapan();
  setInterval(perbaruiPapan, 60000);

  // ===== Keranjang =====
  // Keranjang sengaja tidak disimpan: saat halaman dibuka ulang, keranjang selalu kosong.
  var promo = false, qty = {}, jarak = null, tipe = "Ambil di tempat", bayar = "Tunai";
  try { localStorage.removeItem("risol-keranjang"); } catch (e) {}

  function ubah(id, d) {
    if (d > 0) toast("Masuk keranjang: " + cari(id).nama);
    qty[id] = Math.max(0, (qty[id] || 0) + d);
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
    return '<article class="item" data-kat="' + m.kat + '" data-id="' + m.id + '">' +
      '<div class="gambar">' + '<img src="img/' + m.berkas + "." + EKSTENSI + '" alt="' + m.nama + '" style="object-position:' + (m.posisi || "center") + '" loading="lazy" onerror="this.parentNode.classList.add(\'kosong\');this.remove()">' + (m.badge ? '<span class="badge">' + m.badge + "</span>" : "") + "</div>" +
      '<div class="rinci"><h3>' + m.nama + "</h3><p>" + m.desc + '</p><p class="sub"></p></div>' +
      '<div class="aksi"><b>' + rp(m.harga) + '</b><div class="kontrol"></div></div></article>';
  }).join("");

  function perbaruiMenu() {
    document.querySelectorAll(".item").forEach(function (el) {
      var id = el.dataset.id, m = cari(id), n = qty[id] || 0;
      el.querySelector(".sub").textContent = n ? n + " x " + rp(m.harga) + " = " + rp(n * m.harga) : "";
      el.querySelector(".kontrol").innerHTML = n ? stepper(id, n, m.nama) : '<button class="tambah" data-aksi="1" data-id="' + id + '" aria-label="Tambah ' + m.nama + '">+</button>';
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
      $("pJarak").value = km;
      setJarak(km);
      if (km <= ONGKIR.maks) $("infoJarak").textContent = "Perkiraan jarak " + km + " km. Ongkir bisa disesuaikan lewat chat jika berbeda.";
    }, function () { $("infoJarak").textContent = "Lokasi tidak bisa dibaca. Isi jarak secara manual."; }, { timeout: 10000 });
  });

  function kirimWA(pesan) { window.open("https://wa.me/" + NOMOR_WA + "?text=" + encodeURIComponent(pesan), "_blank"); }
  $("waLangsung").href = "https://wa.me/" + NOMOR_WA + "?text=" + encodeURIComponent("Halo " + NAMA_USAHA + ", saya mau tanya.");

  $("nKirim").addEventListener("click", function () {
    if (!$("pNama").reportValidity()) return;
    if (tipe === "Diantar") {
      if (!$("pAlamat").reportValidity()) return;
      if (!jarak) { toast("Isi jarak antar dulu"); $("pJarak").focus(); return; }
      if (jarak > ONGKIR.maks) { toast("Di luar jangkauan antar"); return; }
    }
    var baris = Object.keys(qty).map(function (id) {
      var m = cari(id);
      return "- " + qty[id] + "x " + m.nama + " (" + rp(qty[id] * m.harga) + ")";
    });
    var h = hitung(), alamat = $("pAlamat").value.trim(), catatan = $("pCatatan").value.trim();
    kirimWA("Halo " + NAMA_USAHA + ", saya " + $("pNama").value.trim() + ".\n" +
      "Pesanan (" + tipe.toLowerCase() + (tipe === "Diantar" && alamat ? ", " + alamat : "") + "):\n" + baris.join("\n") +
      "\nSubtotal: " + rp(h.subtotal) + (h.diskon ? "\nDiskon " + KODE_PROMO + ": -" + rp(h.diskon) : "") +
      (tipe === "Diantar" ? "\nOngkir (" + jarak.toFixed(1) + " km): " + rp(h.ongkir) : "") +
      "\nTotal: " + rp(h.bayar) + "\nBayar: " + bayar + (catatan ? "\nCatatan: " + catatan : ""));
  });

  // ===== Kode promo =====
  $("kodePakai").addEventListener("click", function () {
    promo = $("kode").value.trim().toUpperCase() === KODE_PROMO;
    toast(promo ? "Kode dipakai, diskon 10%" : "Kode promo tidak dikenal");
    perbarui();
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
  setTema(tersimpan === "1");
  tm.addEventListener("click", function () { setTema(document.body.dataset.tema !== "malam"); });

  // ===== Ulasan pelanggan (contoh) =====
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
  tampilUlasan(0);
  jalankanUlasan();

  $("tahun").textContent = new Date().getFullYear();
  perbarui();
})();