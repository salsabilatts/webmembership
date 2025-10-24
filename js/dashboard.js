const token = localStorage.getItem('token');

// ====== 1️⃣ Fetch Dashboard Stats ======
axios.get('http://192.168.18.245:8080/api/v1/admin/dashboard-stats', {
  headers: { Authorization: `Bearer ${token}` }
})
.then(res => {
  const data = res.data;
  document.getElementById('totalAnggota').textContent = data.total_anggota_aktif;
  document.getElementById('pelakuUmkm').textContent = data.pelaku_umkm;
  document.getElementById('pengajuanMenunggu').textContent = data.pengajuan_menunggu;
  document.getElementById('totalSaldo').textContent = `Rp ${data.total_saldo_emoney.toLocaleString('id-ID')}`;
})
.catch(err => {
  console.error('Gagal memuat statistik dashboard:', err);
});

// ====== 2️⃣ Fetch Aktivitas Terbaru ======
axios.get('http://192.168.18.245:8080/api/v1/admin/submissions', {
  headers: { Authorization: `Bearer ${token}` }
})
.then(res => {
  const submissions = res.data.data || res.data;
  const activityBody = document.getElementById('activityTableBody');

  if (!submissions || !submissions.length) {
    activityBody.innerHTML = `<tr><td colspan="4" class="no-data">Belum ada aktivitas</td></tr>`;
    return;
  }

  // 🔹 Urutkan data terbaru (descending)
  const sorted = submissions.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));

  // 🔹 Tampilkan max 10 aktivitas terakhir (bisa ubah sesuai kebutuhan)
  const latest = sorted.slice(0, 20);

  activityBody.innerHTML = latest.map(sub => `
    <tr>
      <td>${new Date(sub.CreatedAt).toLocaleString('id-ID')}</td>
      <td>${sub.User?.full_name || 'Tidak diketahui'}</td>
      <td>${sub.Type || '-'}</td>
      <td>
        <span class="status ${sub.Status.toLowerCase()}">${sub.Status}</span>
      </td>
    </tr>
  `).join('');
})
.catch(err => {
  console.error('Gagal memuat aktivitas:', err);
  document.getElementById('activityTableBody').innerHTML =
    `<tr><td colspan="4" class="no-data">Gagal memuat aktivitas</td></tr>`;
});


// ====== 3️⃣ Fetch Transaksi Hari Ini ======
axios.get('http://192.168.18.245:8080/api/v1/admin/submissions', {
  headers: { Authorization: `Bearer ${token}` }
})
.then(res => {
  const submissions = res.data.data || res.data;
  const transaksiList = document.getElementById('transaksiList');

  // filter transaksi yang dibuat hari ini
  const today = new Date().toISOString().split('T')[0];
  const todayTransaksi = submissions.filter(sub => 
    sub.CreatedAt.startsWith(today)
  );

  if (!todayTransaksi.length) {
    transaksiList.innerHTML = `<p class="no-data">Belum ada transaksi</p>`;
    return;
  }

  transaksiList.innerHTML = todayTransaksi.map(sub => `
    <div class="transaksi-item">
      <p><strong>${sub.User?.full_name || 'User Tidak Dikenal'}</strong> - ${sub.FormData?.['Nama Usaha'] || 'N/A'}</p>
      <small>${new Date(sub.CreatedAt).toLocaleTimeString('id-ID')} | Status: ${sub.Status}</small>
    </div>
  `).join('');
})
.catch(err => {
  console.error('Gagal memuat transaksi:', err);
  document.getElementById('transaksiList').innerHTML =
    `<p class="no-data">Gagal memuat transaksi</p>`;
});
