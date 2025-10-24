document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("kesehatanTableBody");
  const totalKesehatan = document.getElementById("totalKesehatan");
  const kesehatanReview = document.getElementById("kesehatanReview");
  const kesehatanValidated = document.getElementById("kesehatanValidated");
  const kesehatanApproved = document.getElementById("kesehatanApproved");
  const kesehatanRejected = document.getElementById("kesehatanRejected");

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Sesi login habis. Silakan login ulang.");
    window.location.href = "login.html";
    return;
  }

  let allData = [];

  try {
    const response = await axios.get("http://192.168.18.245:8080/api/v1/admin/submissions", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = response.data;
    allData = data.filter((item) => item.Type === "Kesehatan");

    updateStats(allData);
    renderTable(allData);
  } catch (error) {
    console.error("Detail error API:", error.response?.data || error.message);
    tableBody.innerHTML = `<tr><td colspan="9" class="no-data">Gagal memuat data dari API.</td></tr>`;
  }

  // Fungsi render tabel
  function renderTable(data) {
    if (data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" class="no-data">Tidak ada data Bantuan Kesehatan</td></tr>`;
      return;
    }

    tableBody.innerHTML = data
      .map((item, index) => {
        const { CreatedAt, User, FormData, Status } = item;
        const tanggal = new Date(CreatedAt).toLocaleDateString("id-ID");
        const nama = User?.full_name || "-";
        const namaPemohon = FormData?.["Nama Pasien"] || "-";
        const nik = FormData?.["NIK"] || "-";
        const kebutuhanBantuan = FormData?.["Kebutuhan Bantuan"] || "-";
        const keluhan = FormData?.["Keluhan Penyakit"] || "-";
        let dokumen = "-";
        if (FormData?.document_path) {
        const filename = FormData.document_path.split("/").pop();
        const fileUrl = `http://192.168.18.245:8080/api/v1/admin/files/${encodeURIComponent(filename)}`;
        dokumen = `
            <a href="${fileUrl}" class="doc-link"
            onclick="event.preventDefault(); downloadFileWithAuth('${fileUrl}', '${filename}')">
            Unduh
            </a>`;
        }

        const statusLabel = Status
          ? Status.charAt(0).toUpperCase() + Status.slice(1)
          : "-";

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${tanggal}</td>
            <td>${nama}</td>
            <td>${namaPemohon}</td> 
            <td>${nik}</td>
            <td>${kebutuhanBantuan}</td>
            <td>${keluhan}</td>
            <td>${dokumen}</td>
            <td>
              <span class="status-badge ${normalizeStatus(Status)}">
                ${statusLabel}
              </span>
            </td>
            <td>
              <button class="btn-detail" data-id="${item.ID}">Detail</button>
            </td>
          </tr>
        `;
      })
      .join("");

    document.querySelectorAll(".btn-detail").forEach((btn) => {
      btn.addEventListener("click", () => showDetail(btn.dataset.id));
    });
  }

  // Normalisasi Status
  function normalizeStatus(status) {
    const s = status?.toLowerCase().trim();
    if (!s) return "unknown";
    if (["approved", "disetujui", "approve"].includes(s)) return "approved";
    if (["review", "in review", "pending"].includes(s)) return "review";
    if (["validasi berkas", "diverifikasi"].includes(s)) return "validasi berkas";
    if (["rejected", "ditolak"].includes(s)) return "rejected";
    return s;
  }

  // Statistik
  function updateStats(data) {
    totalKesehatan.textContent = data.length;

    kesehatanReview.textContent = data.filter(
      (d) => normalizeStatus(d.Status) === "review"
    ).length;

    kesehatanValidated.textContent = data.filter(
      (d) => normalizeStatus(d.Status) === "validasi berkas"
    ).length;

    kesehatanApproved.textContent = data.filter(
      (d) => normalizeStatus(d.Status) === "approved"
    ).length;

    kesehatanRejected.textContent = data.filter(
      (d) => normalizeStatus(d.Status) === "rejected"
    ).length;
  }

  // Filter tombol
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const status = btn.dataset.status;
      if (status === "all") {
        renderTable(allData);
      } else {
        const filtered = allData.filter(
          (d) => normalizeStatus(d.Status) === status
        );
        renderTable(filtered);
      }
    });
  });

  // Modal Detail
  const modal = document.getElementById("detailModal");
  const modalBody = document.getElementById("modalBody");
  const closeModalBtns = [
    document.getElementById("closeModal"),
    document.getElementById("closeModalBtn"),
  ];

  function showDetail(id) {
    const item = allData.find((d) => d.ID == id);
    if (!item) return;

    const { User, FormData, Status, CreatedAt } = item;
    let dokumenHTML = "-";
    if (FormData?.document_path) {
    const filename = FormData.document_path.split("/").pop();
    const fileUrl = `http://192.168.18.245:8080/api/v1/admin/files/${encodeURIComponent(filename)}`;
    dokumenHTML = `
      <a href="${fileUrl}" target="_blank"
        onclick="event.preventDefault(); downloadFileWithAuth('${fileUrl}', '${filename}')">
        Unduh Dokumen
      </a>`;
     }
    modalBody.innerHTML = `
      <p><strong>Tanggal Pengajuan:</strong> ${new Date(CreatedAt).toLocaleString("id-ID")}</p>
      <p><strong>Nama:</strong> ${User?.full_name || "-"}</p>
      <p><strong>Email:</strong> ${User?.email || "-"}</p>
      <p><strong>Nama Pemohon:</strong> ${FormData?.["Nama Pasien"] || "-"}</p>
      <p><strong>NIK:</strong> ${FormData?.["NIK"] || "-"}</p>
      <p><strong>Kebutuhan Bantuan:</strong> ${FormData?.["Kebutuhan Bantuan"] || "-"}</p>
      <p><strong>Keluhan:</strong> ${FormData?.["Keluhan Penyakit"] || "-"}</p>
      <p><strong>Status:</strong> ${Status || "-"}</p>
      <p><strong>Dokumen:</strong> ${dokumenHTML}</p>
    `;
    modal.style.display = "flex";
    const validateBtn = document.getElementById("validateBtn");
    const approveBtn = document.getElementById("approveBtn");
    const rejectBtn = document.getElementById("rejectBtn");

    if (validateBtn)
      validateBtn.onclick = () =>
        updateStatus(id, "validasi berkas", "Berkas telah divalidasi dan siap ditinjau.");

    if (approveBtn)
      approveBtn.onclick = () =>
        updateStatus(id, "disetujui", "Selamat! Pengajuan Anda telah disetujui.");

    if (rejectBtn)
      rejectBtn.onclick = () =>
        updateStatus(id, "ditolak", "Mohon maaf, pengajuan Anda ditolak.");
  }

   // === DOWNLOAD FILE DENGAN TOKEN ===
  async function downloadFileWithAuth(url, filename) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Gagal mengunduh file");

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // kalau file PDF → buka di tab baru
      if (filename.toLowerCase().endsWith(".pdf")) {
        window.open(blobUrl, "_blank");
      } else {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }

      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Gagal mengunduh file:", error);
      alert("Gagal mengunduh file pendukung!");
    }
  }

  window.downloadFileWithAuth = downloadFileWithAuth;

  // === UPDATE STATUS ===
  async function updateStatus(id, status, notes) {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Sesi login habis. Silakan login ulang.");
      window.location.href = "login.html";
      return;
    }

    try {
      await axios.post(
        `http://192.168.18.245:8080/api/v1/admin/submissions/${id}/status`,
        { status, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Status berhasil diubah menjadi: ${status}`);
      modal.style.display = "none";
      window.location.reload();
    } catch (error) {
      console.error("Gagal update status:", error.response?.data || error.message);
      alert("Terjadi kesalahan saat mengubah status. Silakan coba lagi.");
    }
  }

  // === CLOSE MODAL ===
  closeModalBtns.forEach((btn) => {
    if (btn) btn.addEventListener("click", () => (modal.style.display = "none"));
  });

  // === EXPORT KE EXCEL ===
  const exportBtn = document.getElementById("exportExcelBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", async () => {
      try {
        if (!allData || allData.length === 0) {
          alert("Tidak ada data untuk diexport!");
          return;
        }

        // Ambil status filter aktif (kalau kamu mau export sesuai filter)
        const activeFilter = document.querySelector(".filter-btn.active");
        const currentStatus = activeFilter?.dataset.status || "all";

        // Filter ulang sesuai status yang dipilih
        let exportData =
          currentStatus === "all"
            ? allData
            : allData.filter(
                (d) => normalizeStatus(d.Status) === currentStatus
              );

        if (exportData.length === 0) {
          alert("Tidak ada data untuk status tersebut!");
          return;
        }

        // Format data jadi array objek sederhana
        const formattedData = exportData.map((item, index) => ({
          No: index + 1,
          "Tanggal Pengajuan": new Date(item.CreatedAt).toLocaleString("id-ID"),
          "Nama Pemohon": item.User?.full_name || "-",
          "Email": item.User?.email || "-",
          "Nama Pemohon": item.FormData?.["Nama Pasien"] || "-",
          "NIK": item.FormData?.["NIK"] || "-",
          "Kebutuhan Bantuan": item.FormData?.["Kebutuhan Bantuan"] || "-",
          "Keluhan": item.FormData?.["Keluhan Penyakit"] || "-",
          "Status": item.Status || "-",
        }));

        // Buat dan export file Excel
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(formattedData);
        XLSX.utils.book_append_sheet(wb, ws, "Bantuan Hukum");

        const namaFile =
          currentStatus === "all"
            ? "kesehatan_semua.xlsx"
            : `kesehatan_${currentStatus}.xlsx`;

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
