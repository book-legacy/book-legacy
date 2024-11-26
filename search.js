document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');

    if (query) {
        document.getElementById('search-query').value = query;
        await searchBooks(query);
    }

    const searchForm = document.getElementById('search-form');
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newQuery = document.getElementById('search-query').value.trim();
        if (newQuery) {
            window.history.pushState(null, '', `?query=${encodeURIComponent(newQuery)}`);
            await searchBooks(newQuery);
        } else {
            alert('검색어를 입력하세요.');
        }
    });
});

async function searchBooks(query) {
    const resultsContainer = document.getElementById('search-results-container');
    resultsContainer.innerHTML = '';

    try {
        // Flask 서버로 검색 요청
        const response = await fetch(`http://127.0.0.1:5000/search?query=${encodeURIComponent(query)}`);
        if (response.ok) {
            const data = await response.json();
            if (data.length > 0) {
                // 결과 표시
                data.forEach((item) => {
                    const resultItem = document.createElement('div');
                    resultItem.classList.add('book-card');
                    resultItem.innerHTML = `
                        <img src="${item.image || '/placeholder.svg'}" alt="${item.title}" class="book-image">
                        <div class="book-info">
                            <p class="book-title">${item.title}</p>
                            <p class="book-author">${item.author || '저자 정보 없음'}</p>
                            <p class="book-price">None</p>
                            <div class="book-actions">
                                <button class="wishlist-btn" aria-label="찜하기">
                                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                    </svg>
                                </button>
                                <button class="button outline view-more">더보기</button>
                            </div>
                        </div>
                    `;

                    const viewMoreButton = resultItem.querySelector('.view-more');
                    viewMoreButton.addEventListener('click', () => {
                        if (item.link) {
                            window.open(item.link, '_blank');
                        }
                    });

                    resultsContainer.appendChild(resultItem);
                });
            } else {
                resultsContainer.innerHTML = '<p>검색 결과가 없습니다.</p>';
            }
        } else {
            resultsContainer.innerHTML = '<p>검색에 실패했습니다. 다시 시도하세요.</p>';
        }
    } catch (error) {
        console.error('Error fetching search results:', error);
        resultsContainer.innerHTML = '<p>서버와의 연결에 실패했습니다.</p>';
    }
}

