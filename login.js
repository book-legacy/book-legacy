document.addEventListener('DOMContentLoaded', function() {
    const loginLogoutButton = document.getElementById('login-logout-button');
    const userID_display = document.getElementById('userID-display');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userID = localStorage.getItem('userID');

    if (isLoggedIn === 'true' && userID) {
        userID_display.textContent = `${userID}님`;
        loginLogoutButton.textContent = '로그아웃';
        loginLogoutButton.onclick = function() {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userID');
            window.location.reload();
        };
    } else {
        userID_display.textContent = '';
        loginLogoutButton.textContent = '로그인';
        loginLogoutButton.onclick = function() {
            window.location.href = 'index.html';
        };
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userID = localStorage.getItem('userID');

    if (isLoggedIn === 'true' && userID) {
        welcome(userID);
    } else {
        loginForm();
    }
});

function welcome(userID) {
    document.querySelector('.login-container').innerHTML =
        `<h2>${userID}님, 환영합니다!</h2>
        <span class="relative placeholder-icon" style="font-size: 100px;">📚</span>
        <button class="button logout-button" id="logout">로그아웃</button>`;

    document.querySelector('#logout').addEventListener('click', function() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userID');
        window.location.reload();
    });
}

function loginForm() {
    document.querySelector('#register').addEventListener('click', function() {
        window.location.href = 'register.html';
    });

    document.querySelector('#login-form').addEventListener('submit', loginCheck);
}

async function loginCheck(event) {
    event.preventDefault();

    const userID = document.getElementById('userID').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://127.0.0.1:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                stdnum: stdnum,
                username: userID,
                password: password
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert(errorData.error || "로그인에 실패했습니다.");
            return;
        }

        const data = await response.json();
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userID', userID);
        welcome(userID);
        window.location.reload();
    } catch (error) {
        console.error('Login error:', error);
        alert("서버와 통신 중 문제가 발생했습니다.");
    }
}
