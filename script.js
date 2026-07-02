
/* ---- Tandai link navigasi aktif ---- */
document.addEventListener('DOMContentLoaded', function () {
  const halamanSekarang = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('nav ul li a');

  navLinks.forEach(function (link) {
    const href = link.getAttribute('href');
    if (href === halamanSekarang) {
      link.classList.add('aktif');
    }
  });

  /* ---- Hamburger menu (mobile) ---- */
  const hamburger = document.getElementById('hamburger');
  const navEl = document.getElementById('navMenu');

  if (hamburger && navEl) {
    hamburger.addEventListener('click', function () {
      navEl.classList.toggle('buka');
    });
  }

  /* ---- Init halaman transaksi ---- */
  if (halamanSekarang === 'transaksi.html') {
    tampilkanDaftarTransaksi();
  }
});

/* =============================================
   VALIDASI FORM TRANSAKSI
   ============================================= */
function validasiFormTransaksi() {
  let valid = true;

  const fields = [
    { id: 'namaPemesan',  errId: 'err-namaPemesan',  pesan: 'Nama pemesan wajib diisi.' },
    { id: 'paketKomisi',  errId: 'err-paketKomisi',  pesan: 'Pilih paket komisi terlebih dahulu.' },
    { id: 'totalHarga',   errId: 'err-totalHarga',   pesan: 'Total harga wajib diisi.' },
    { id: 'statusBayar',  errId: 'err-statusBayar',  pesan: 'Pilih status pembayaran.' },
    { id: 'tanggal',      errId: 'err-tanggal',      pesan: 'Tanggal wajib diisi.' },
  ];

  fields.forEach(function (f) {
    const input = document.getElementById(f.id);
    const errEl = document.getElementById(f.errId);
   
    if (!input) return;

    const nilai = input.value.trim();

    if (!nilai) {
      input.classList.add('input-error');
      if (errEl) {
        errEl.textContent = f.pesan;
        errEl.classList.add('tampil');
      }
      valid = false;
    } else {
      input.classList.remove('input-error');
      if (errEl) errEl.classList.remove('tampil');
    }

    // Validasi tambahan: harga harus angka positif
    if (f.id === 'totalHarga' && nilai) {
      const angka = parseInt(nilai, 10);
      if (isNaN(angka) || angka <= 0) {
        input.classList.add('input-error');
        if (errEl) {
          errEl.textContent = 'Harga harus berupa angka lebih dari 0.';
          errEl.classList.add('tampil');
        }
        valid = false;
      }
    }

    if (f.id === "totalHarga") {

    const harga = parseInt(document.getElementById("paketKomisi").value);
    const total = parseInt(input.value);
    const dp = harga / 2;

    if (!isNaN(harga) && total !== dp) {
        valid = false;

        input.classList.add("input-error");

        if (errEl) {
            errEl.textContent =
                `DP harus Rp${dp.toLocaleString("id-ID")}`;
            errEl.classList.add("tampil");
        }
    }
}

  });

  return valid;
}

/* =============================================
   SIMPAN TRANSAKSI KE LOCALSTORAGE
   ============================================= */
function simpanTransaksi(event) {
  event.preventDefault();

  // Sembunyikan alert lama
  sembunyikanAlert();

  // Jalankan validasi
  if (!validasiFormTransaksi()) {
    tampilkanAlert('alertError', '⚠️ Harap lengkapi semua kolom yang wajib diisi!');
    return;
  }

  // Ambil nilai form
  const transaksi = {
    id: Date.now(),
    namaPemesan: document.getElementById('namaPemesan').value.trim(),
    paketKomisi: document.getElementById('paketKomisi').value,
    totalHarga:  parseInt(document.getElementById('totalHarga').value, 10),
    statusBayar: document.getElementById('statusBayar').value,
    tanggal:     document.getElementById('tanggal').value,
    catatan:     document.getElementById('catatan') ? document.getElementById('catatan').value.trim() : '',
  };

  // Simpan ke localStorage
  const existing = JSON.parse(localStorage.getItem('transaksi_illustro') || '[]');
  existing.push(transaksi);
  localStorage.setItem('transaksi_illustro', JSON.stringify(existing));

  // Tampilkan pesan sukses
  tampilkanAlert('alertSukses', '✅ Transaksi berhasil disimpan!');

  // Reset form
  document.getElementById('formTransaksi').reset();
  document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  document.querySelectorAll('.error-msg').forEach(el => el.classList.remove('tampil'));

  // Refresh tabel
  tampilkanDaftarTransaksi();

  // Scroll ke tabel
  setTimeout(function () {
    const tabel = document.getElementById('sectionDaftar');
    if (tabel) tabel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 300);
}

/* =============================================
   TAMPILKAN DAFTAR TRANSAKSI
   ============================================= */
function tampilkanDaftarTransaksi() {
  const tbody = document.getElementById('bodyTransaksi');
  const kosong = document.getElementById('kosongTabel');
  if (!tbody) return;

  const data = JSON.parse(localStorage.getItem('transaksi_illustro') || '[]');

  if (data.length === 0) {
    tbody.innerHTML = '';
    if (kosong) kosong.style.display = 'table-row';
    return;
  }

  if (kosong) kosong.style.display = 'none';

  tbody.innerHTML = data.map(function (t, i) {
    const badgeCls = t.statusBayar === 'Lunas' ? 'badge-lunas' : 'badge-dp';
    const hargaFmt = 'Rp ' + t.totalHarga.toLocaleString('id-ID');
    const tgl = formatTanggal(t.tanggal);
    return `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${esc(t.namaPemesan)}</strong></td>
        <td>${esc(t.paketKomisi)}</td>
        <td>${hargaFmt}</td>
        <td><span class="badge ${badgeCls}">${esc(t.statusBayar)}</span></td>
        <td>${tgl}</td>
        <td>
          <button class="badge-hapus" onclick="hapusTransaksi(${t.id})" title="Hapus">🗑️ Hapus</button>
        </td>
      </tr>`;
  }).join('');
}

/* =============================================
   HAPUS TRANSAKSI
   ============================================= */
function hapusTransaksi(id) {
  if (!confirm('Yakin ingin menghapus transaksi ini?')) return;
  let data = JSON.parse(localStorage.getItem('transaksi_illustro') || '[]');
  data = data.filter(function (t) { return t.id !== id; });
  localStorage.setItem('transaksi_illustro', JSON.stringify(data));
  tampilkanDaftarTransaksi();
}

/* =============================================
   VALIDASI FORM LOGIN
   ============================================= */
function validasiLogin(event) {
  event.preventDefault();
  let valid = true;

  const fields = [
    { id: 'loginEmail', errId: 'err-loginEmail', pesan: 'Email wajib diisi.' },
    { id: 'loginPass',  errId: 'err-loginPass',  pesan: 'Password wajib diisi.' },
  ];

  fields.forEach(function (f) {
    const input = document.getElementById(f.id);
    const errEl = document.getElementById(f.errId);
    if (!input) return;
    if (!input.value.trim()) {
      input.classList.add('input-error');
      if (errEl) { errEl.textContent = f.pesan; errEl.classList.add('tampil'); }
      valid = false;
    } else {
      input.classList.remove('input-error');
      if (errEl) errEl.classList.remove('tampil');
    }

    // Validasi format email
    if (f.id === 'loginEmail' && input.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.value.trim())) {
        input.classList.add('input-error');
        if (errEl) { errEl.textContent = 'Format email tidak valid.'; errEl.classList.add('tampil'); }
        valid = false;
      }
    }
  });

  if (valid) {
    tampilkanAlert('alertSukses', '✅ Login berhasil! Mengarahkan ke beranda...');
    setTimeout(function () { window.location.href = 'index.html'; }, 1500);
  } else {
    tampilkanAlert('alertError', '⚠️ Harap periksa kembali isian data.');
  }
}

/* =============================================
   UTILITAS
   ============================================= */
function tampilkanAlert(id, pesan) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = pesan;
  el.classList.add('tampil');
  setTimeout(function () { el.classList.remove('tampil'); }, 4000);
}

function sembunyikanAlert() {
  document.querySelectorAll('.alert').forEach(function (el) {
    el.classList.remove('tampil');
  });
}

function formatTanggal(str) {
  if (!str) return '-';
  const d = new Date(str);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function esc(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}
