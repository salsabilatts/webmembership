document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("pendidikanTableBody");
  const totalPendidikan = document.getElementById("totalPendidikan");
  const pendidikanReview = document.getElementById("pendidikanReview");
  const pendidikanValidated = document.getElementById("pendidikanValidated");
  const pendidikanApproved = document.getElementById("pendidikanApproved");
  const pendidikanRejected = document.getElementById("pendidikanRejected");

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
    allData = data.filter((item) => item.Type === "Pendidikan");

    updateStats(allData);
    renderTable(allData);
  } catch (error) {
    console.error("Detail error API:", error.response?.data || error.message);
    tableBody.innerHTML = `<tr><td colspan="9" class="no-data">Gagal memuat data dari API.</td></tr>`;
  }

  // Fungsi render tabel
  function renderTable(data) {
    if (data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" class="no-data">Tidak ada data Bantuan Pendidikan</td></tr>`;
      return;
    }

    tableBody.innerHTML = data
      .map((item, index) => {
        const { CreatedAt, User, FormData, Status } = item;
        const tanggal = new Date(CreatedAt).toLocaleDateString("id-ID");
        const nama = User?.full_name || "-";
        const namaPemohon = FormData?.["Nama Siswa/Mahasiswa"] || "-";
        const nisn = FormData?.["NISN/NIM"] || "-";
        const sekolah = FormData?.["Nama Sekolah/Kampus"] || "-";
        const jenisBantuan = FormData?.["Jenis Bantuan (PIP/KIP/Lainnya)"] || "-";
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
            <td>${namaPemohon}</td> 
            <td>${nisn}</td>
            <td>${sekolah}</td>
            <td>${jenisBantuan}</td>
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
    totalPendidikan.textContent = data.length;

    pendidikanReview.textContent = data.filter(
      (d) => normalizeStatus(d.Status) === "review"
    ).length;

    pendidikanValidated.textContent = data.filter(
      (d) => normalizeStatus(d.Status) === "validasi berkas"
    ).length;

    pendidikanApproved.textContent = data.filter(
      (d) => normalizeStatus(d.Status) === "approved"
    ).length;

    pendidikanRejected.textContent = data.filter(
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
    modalBody.innerHTML = `
      <p><strong>Tanggal Pengajuan:</strong> ${new Date(CreatedAt).toLocaleString("id-ID")}</p>
      <p><strong>Nama:</strong> ${User?.full_name || "-"}</p>
      <p><strong>Email:</strong> ${User?.email || "-"}</p>
      <p><strong>Nama Pemohon:</strong> ${FormData?.["Nama Siswa/Mahasiswa"] || "-"}</p>
      <p><strong>NISN/NIM:</strong> ${FormData?.["NISN/NIM"] || "-"}</p>
      <p><strong>Sekolah/Universitas:</strong> ${FormData?.["Nama Sekolah/Kampus"] || "-"}</p>
      <p><strong>Jenis Bantuan:</strong> ${FormData?.["Jenis Bantuan (PIP/KIP/Lainnya)"] || "-"}</p>
      <p><strong>Status:</strong> ${Status || "-"}</p>
      <p><strong>Dokumen:</strong> ${
        FormData?.document_path
          ? `<a href="http://192.168.18.245:8080/${FormData.document_path}" target="_blank">Lihat Dokumen</a>`
          : "-"
      }</p>
    `;
    modal.style.display = "flex";
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
