document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await axios.post('http://192.168.18.245:8080/api/v1/auth/login', {
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
