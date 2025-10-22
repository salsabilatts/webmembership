document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("hukumTableBody");
  const totalHukum = document.getElementById("totalHukum");
  const hukumReview = document.getElementById("hukumReview");
  const hukumValidated = document.getElementById("hukumValidated");
  const hukumApproved = document.getElementById("hukumApproved");
  const hukumRejected = document.getElementById("hukumRejected");

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
    allData = data.filter((item) => item.Type === "Hukum");

    updateStats(allData);
    renderTable(allData);
  } catch (error) {
    console.error("Detail error API:", error.response?.data || error.message);
    tableBody.innerHTML = `<tr><td colspan="9" class="no-data">Gagal memuat data dari API.</td></tr>`;
  }

  // === FUNGSI RENDER TABEL ===
  function renderTable(data) {
    if (data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" class="no-data">Tidak ada data Bantuan Hukum.</td></tr>`;
      return;
    }

    tableBody.innerHTML = data
      .map((item, index) => {
        const { CreatedAt, User, FormData, Status } = item;
        const tanggal = new Date(CreatedAt).toLocaleDateString("id-ID");
        const nama = User?.full_name || "-";
        const kebutuhan = FormData?.["Kebutuhan Bantuan"] || "-";
        const pihakTerkait = FormData?.["Pihak Terkait"] || "-";
        const uraianMasalah = FormData?.["Uraian Singkat Masalah"] || "-";
        const dokumen = FormData?.document_path
          ? `<a href="http://192.168.18.245:8080/${FormData.document_path}" target="_blank" class="doc-link">Lihat</a>`
          : "-";
        const statusLabel = Status
          ? Status.charAt(0).toUpperCase() + Status.slice(1)
          : "-";

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${tanggal}</td>
            <td>${nama}</td>
            <td>${kebutuhan}</td>
            <td>${pihakTerkait}</td>
            <td>${uraianMasalah}</td>
            <td>${dokumen}</td>
            <td>
              <span class="status-badge ${normalizeStatus(statusLabel)}">
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

  // === NORMALISASI STATUS (warna badge) ===
  function normalizeStatus(status) {
    const s = status?.toLowerCase().trim();
    if (!s) return "unknown";
    if (["approved", "disetujui", "approve"].includes(s)) return "approved";
    if (["review", "in review", "pending"].includes(s)) return "review";
    if (["validasi berkas", "diverifikasi"].includes(s)) return "validasi berkas";
    if (["rejected", "ditolak"].includes(s)) return "rejected";
    return s;
  }

  // === STATISTIK ===
  function updateStats(data) {
    totalHukum.textContent = data.length;

    hukumReview.textContent = data.filter(
      (d) => normalizeStatus(d.Status) === "review"
    ).length;

    hukumApproved.textContent = data.filter(
      (d) => normalizeStatus(d.Status) === "approved"
    ).length;

    hukumRejected.textContent = data.filter(
      (d) => normalizeStatus(d.Status) === "rejected"
    ).length;

    hukumValidated.textContent = data.filter(
      (d) => normalizeStatus(d.Status) === "validasi berkas"
    ).length;

  }

  // === FILTER BUTTON ===
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

  // === MODAL DETAIL ===
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
    modalBody.innerHTML = `
      <p><strong>Tanggal Pengajuan:</strong> ${new Date(CreatedAt).toLocaleString("id-ID")}</p>
      <p><strong>Nama Pemohon:</strong> ${User?.full_name || "-"}</p>
      <p><strong>Email:</strong> ${User?.email || "-"}</p>
      <p><strong>Kebutuhan Bantuan:</strong> ${FormData?.["Kebutuhan Bantuan"] || "-"}</p>
      <p><strong>Pihak Terkait:</strong> ${FormData?.["Pihak Terkait"] || "-"}</p>
      <p><strong>Uraian Masalah:</strong> ${FormData?.["Uraian Singkat Masalah"] || "-"}</p>
      <p><strong>Status:</strong> ${Status || "-"}</p>
      <p><strong>Dokumen:</strong> ${
        FormData?.document_path
          ? `<a href="http://192.168.18.245:8080/${FormData.document_path}" target="_blank">Lihat Dokumen</a>`
          : "-"
      }</p>
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

  // === LOGOUT ===
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
  }
});
