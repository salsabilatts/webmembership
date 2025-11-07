// js/manajemen-user.js
const BASE_URL = "https://api.teknisiai.cloud";

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("userTableBody");
  const totalUsers = document.getElementById("totalUsers");
  const totalAdmin = document.getElementById("totalAdmin");

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Sesi login habis. Silakan login ulang.");
    window.location.href = "login.html";
    return;
  }

  let allUsers = [];

  try {
    // Ambil data user dari API
    const response = await axios.get(`${BASE_URL}/api/v1/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    allUsers = response.data || [];

    // Update statistik
    updateStats(allUsers);

    // Render tabel
    renderTable(allUsers);
  } catch (error) {
    console.error("Error ambil data user:", error.response?.data || error.message);
    tableBody.innerHTML = `<tr><td colspan="10" class="no-data">Gagal memuat data dari API.</td></tr>`;
  }

  // === FUNGSI RENDER TABEL ===
  function renderTable(users) {
    if (!users.length) {
      tableBody.innerHTML = `<tr><td colspan="10" class="no-data">Tidak ada data user.</td></tr>`;
      return;
    }

    tableBody.innerHTML = users
      .map((user) => {
        const {
          ID,
          full_name,
          email,
          phone,
          role,
          provinsi,
          kabupaten,
          kecamatan,
          kelurahan,
          card_uid,
        } = user;

        return `
          <tr>
            <td>${ID || "-"}</td>
            <td>${card_uid || "-"}</td>
            <td>${full_name || "-"}</td>
            <td>${email || "-"}</td>
            <td>${phone || "-"}</td>
            <td><span class="status-badge ${role?.toLowerCase() || ""}">${role || "-"}</span></td>
            <td>${provinsi || "-"}</td>
            <td>${kabupaten || "-"}</td>
            <td>${kecamatan || "-"}</td>
            <td>${kelurahan || "-"}</td>
            <td>
              <button class="btn-detail" data-id="${ID}">Detail</button>
            </td>
          </tr>
        `;
      })
      .join("");

    // Event listener tombol detail
    document.querySelectorAll(".btn-detail").forEach((btn) => {
      btn.addEventListener("click", () => showDetail(btn.dataset.id));
    });
  }

  // === FUNGSI UPDATE STATISTIK ===
  function updateStats(users) {
    totalUsers.textContent = users.length;
    totalAdmin.textContent = users.filter((u) => u.role?.toLowerCase() === "admin").length;
  }

  // === FILTER TOMBOL ===
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const role = btn.dataset.role;
      if (role === "all") {
        renderTable(allUsers);
      } else {
        const filtered = allUsers.filter(
          (u) => u.role?.toLowerCase() === role.toLowerCase()
        );
        renderTable(filtered);
      }
    });
  });

  // === MODAL DETAIL ===
  const modal = document.getElementById("detailModal");
  const modalBody = document.getElementById("modalBody");
  const closeModalBtns = [
    document.getElementById("closeModal"),
    document.getElementById("closeModalBtn"),
  ];

  function showDetail(id) {
    const user = allUsers.find((u) => u.ID == id);
    if (!user) return;

    modalBody.innerHTML = `
      <p><strong>ID User:</strong> ${user.ID}</p>
      <p><strong>Card ID:</strong> ${user.card_uid || "-"}</p>
      <p><strong>Nama Lengkap:</strong> ${user.full_name}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Telepon:</strong> ${user.phone || "-"}</p>
      <p><strong>Role:</strong> ${user.role}</p>
      <p><strong>Provinsi:</strong> ${user.provinsi || "-"}</p>
      <p><strong>Kabupaten:</strong> ${user.kabupaten || "-"}</p>
      <p><strong>Kecamatan:</strong> ${user.kecamatan || "-"}</p>
      <p><strong>Kelurahan:</strong> ${user.kelurahan || "-"}</p>
    `;

    modal.style.display = "flex";
  }

  // Tutup modal
  closeModalBtns.forEach((btn) => {
    if (btn) btn.addEventListener("click", () => (modal.style.display = "none"));
  });

   // === EXPORT KE EXCEL ===
const exportBtn = document.getElementById("exportExcelBtn");
if (exportBtn) {
  exportBtn.addEventListener("click", async () => {
    try {
      if (!allUsers || allUsers.length === 0) {
        alert("Tidak ada data untuk diexport!");
        return;
      }

      // Ambil filter aktif (jika user lagi ngefilter)
      const activeFilter = document.querySelector(".filter-btn.active");
      const currentRole = activeFilter?.dataset.role || "all";

      // Filter sesuai role yang sedang aktif
      let exportData =
        currentRole === "all"
          ? allUsers
          : allUsers.filter(
              (u) => u.role?.toLowerCase() === currentRole.toLowerCase()
            );

      if (exportData.length === 0) {
        alert("Tidak ada data untuk role tersebut!");
        return;
      }

      // Format data ke bentuk array objek sederhana
      const formattedData = exportData.map((user, index) => ({
        No: index + 1,
        "ID User": user.ID || "-",
        "Card ID": user.card_uid || "-",
        "Nama Lengkap": user.full_name || "-",
        "Email": user.email || "-",
        "Telepon": user.phone || "-",
        "Role": user.role || "-",
        "Provinsi": user.provinsi || "-",
        "Kabupaten": user.kabupaten || "-",
        "Kecamatan": user.kecamatan || "-",
        "Kelurahan": user.kelurahan || "-",
      }));

      // Buat workbook Excel
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(formattedData);
      XLSX.utils.book_append_sheet(wb, ws, "Manajemen User");

      // Nama file otomatis
      const namaFile =
        currentRole === "all"
          ? "manajemen_user_semua.xlsx"
          : `manajemen_user_${currentRole}.xlsx`;

      XLSX.writeFile(wb, namaFile);
      alert("✅ Data berhasil diexport ke Excel!");
    } catch (err) {
      console.error("Gagal export Excel:", err);
      alert("Terjadi kesalahan saat export Excel.");
    }
  });
}

  // === LOGOUT ===
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
  }
});
