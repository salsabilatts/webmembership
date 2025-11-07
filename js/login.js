const BASE_URL = "https://api.teknisiai.cloud";
document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email,
      password
    });

    // Simpan token
    localStorage.setItem('token', res.data.token);

    // Pindah ke dashboard
    window.location.href = 'dashboard.html';

  } catch (err) {
    document.getElementById('errorMessage').innerText = 'Email atau password salah';
    console.error(err);
  }
});
