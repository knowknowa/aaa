function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username && password) {
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/index.html';
            } else {
                alert(data.message || '登录失败，请检查您的账号和密码。');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('登录失败，请稍后再试。');
        });
    } else {
        alert('请填写账号和密码。');
    }
}

function confirmLogout() {
    if (confirm('确定要退出登录吗？')) {
        logout();
    }
}

function logout() {
    fetch('/logout', {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/';
        } else {
            alert('退出登录失败，请稍后再试。');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('退出登录失败，请稍后再试。');
    });
}
