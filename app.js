// ==================== 0. THÔNG BÁO (TOAST CO ĐỊNH) ====================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return alert(message);
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = type === 'error' ? '❌' : (type === 'info' ? 'ℹ️' : '✔️');
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'fadeOut 0.3s ease-out forwards'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// KHỞI TẠO BỘ NHỚ GIẢ LẬP ĐƠN GIẢN (Chỉ dành riêng cho các tính năng tĩnh như Review)
function initData() {
    if (!localStorage.getItem('hotel_reviews')) {
        localStorage.setItem('hotel_reviews', JSON.stringify([
            { id: 1, customerName: 'Trần Thị B', date: '18/06/2026', stars: 5, content: 'Phòng ốc cực kỳ sạch sẽ, view nhìn ra biển tuyệt đẹp. Dịch vụ buffet sáng đa dạng và ngon miệng.', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
            { id: 2, customerName: 'Lê Văn C', date: '15/06/2026', stars: 4, content: 'Trải nghiệm tuyệt vời. Tiện ích đầy đủ, đưa đón sân bay đúng giờ.', image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }
        ]));
    }
    // Lấy tên khách sạn từ SQL Server đổ vào tiêu đề
    fetch('http://127.0.0.1:8000/api/admin/settings')
        .then(res => res.json())
        .then(data => {
            document.querySelectorAll('.hotel-name-display').forEach(el => el.innerText = data.name);
        }).catch(() => {});
}

// ==================== 1. LUỒNG XÁC THỰC TÀI KHOẢN (API THẬT) ====================
async function login() {
    const roleInp = document.getElementById('user-role').value; 
    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value;

    try {
        const response = await fetch('http://127.0.0.1:8000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: userInp, password: passInp })
        });
        
        if (!response.ok) {
            return showToast("Tài khoản hoặc mật khẩu trong SQL Server không đúng!", "error");
        }
        
        const res = await response.json();
        if (res.role !== roleInp) return showToast("Tài khoản không sở hữu vai trò truy cập này!", "error");
        
        localStorage.setItem('is_logged_in', 'true');
        localStorage.setItem('current_user', res.fullname); 
        localStorage.setItem('current_username', res.username); 
        localStorage.setItem('current_role', res.role);
        
        closeLoginModal(); 
        if (res.role === 'admin') { showAdminPage(); showToast(`Hệ thống xác thực: Xin chào Admin!`, "success"); } 
        else { showHomePage(); updateHeaderUI(); showToast(`Đăng nhập thành công! Xin chào ${res.fullname}`, "success"); }
    } catch (e) {
        showToast("Lỗi kết nối nghiêm trọng đến Server Python main.py!", "error");
    }
}

function logout() {
    localStorage.removeItem('is_logged_in');
    localStorage.removeItem('current_user');
    localStorage.removeItem('current_username');
    localStorage.removeItem('current_role');
    
    document.getElementById('admin-screen').style.display = 'none';
    document.getElementById('customer-view').style.display = 'block';
    updateHeaderUI(); 
    showHomePage(); 
    showToast("Đã kết thúc phiên hoạt động an toàn!", "info");
}

async function register() {
    const data = {
        fullname: document.getElementById('reg-fullname').value.trim(),
        username: document.getElementById('reg-username').value.trim(),
        phone: document.getElementById('reg-phone').value.trim(),
        idcard: document.getElementById('reg-idcard').value.trim(),
        address: document.getElementById('reg-address').value.trim(),
        password: document.getElementById('reg-password').value,
    };
    const confirmPass = document.getElementById('reg-confirm-password').value;

    if (!data.fullname || !data.username || !data.password) return showToast("Vui lòng không bỏ trống thông tin bắt buộc!", "error");
    if (data.password !== confirmPass) return showToast("Mật khẩu gõ lại không khớp!", "error");

    try {
        const response = await fetch('http://127.0.0.1:8000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showToast("Đăng ký thành công! Dữ liệu đã đẩy vào bảng TaiKhoan và KhachHang.", "success"); 
            switchToLogin();
        } else {
            const err = await response.json();
            showToast(err.detail, "error");
        }
    } catch (e) { showToast("Sập kết nối API Server!", "error"); }
}

function checkInitialState() {
    if (localStorage.getItem('is_logged_in') === 'true') {
        if (localStorage.getItem('current_role') === 'admin') showAdminPage();
        else { showHomePage(); updateHeaderUI(); }
    } else { showHomePage(); updateHeaderUI(); }
}

function updateHeaderUI() {
    const isLoggedIn = localStorage.getItem('is_logged_in');
    const avatar = document.getElementById('user-avatar');
    const loginBtn = document.getElementById('nav-login-btn');
    if (isLoggedIn === 'true') {
        loginBtn.style.display = 'none';
        loginBtn.classList.remove('btn-fade-in');
        avatar.innerHTML = (localStorage.getItem('current_user') || 'U').charAt(0).toUpperCase();
        avatar.style.background = 'linear-gradient(135deg, #b8860b, #d4af37, #f5e09a)';
        avatar.style.color = '#5c3d00';
        avatar.style.display = 'flex';
    } else {
        loginBtn.style.display = 'block';
        void loginBtn.offsetWidth;
        loginBtn.classList.add('btn-fade-in');
        avatar.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#8b6508" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
        avatar.style.background = 'rgba(180,140,20,0.08)';
        avatar.style.color = '#8b6508';
        avatar.style.display = 'flex';
    }
}

function hideAllScreens() {
    ['admin-screen', 'profile-screen', 'home-screen', 'review-screen', 'service-screen'].forEach(id => {
        let el = document.getElementById(id); if (el) el.style.display = 'none';
    });
    let search = document.getElementById('search-bar');
    if (search) { search.style.display = 'none'; search.classList.remove('search-bar--docked'); }
}

function showHomePage() { hideAllScreens(); document.getElementById('customer-view').style.display = 'block'; document.getElementById('home-screen').style.display = 'block'; const sb = document.getElementById('search-bar'); if (sb) sb.style.display = 'flex'; renderRooms(); }
// Bấm vào tiêu đề hero -> cuộn mượt xuống form gửi đánh giá
function scrollToReviewForm() {
    const form = document.querySelector('.rv-form-section');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showReviewPage() {
    hideAllScreens();
    document.getElementById('customer-view').style.display = 'block';
    document.getElementById('review-screen').style.display = 'block';
    initReviewForm();
    replayHeroAnimation('#rv-hero');
    renderReviews();
}

// Chạy lại animation hero mỗi lần vào trang (ép trình duyệt reflow để restart keyframes)
function replayHeroAnimation(selector = '.rv-hero') {
    const hero = document.querySelector(selector);
    if (!hero) return;
    hero.classList.remove('rv-play');
    void hero.offsetWidth;
    hero.classList.add('rv-play');
}
function showServicePage() {
    hideAllScreens();
    document.getElementById('customer-view').style.display = 'block';
    document.getElementById('service-screen').style.display = 'block';
    replayHeroAnimation('#svc-hero');
    renderCustomerServices();
}
function showProfilePage() { if (localStorage.getItem('is_logged_in') !== 'true') return openLoginModal(); hideAllScreens(); document.getElementById('customer-view').style.display = 'block'; document.getElementById('profile-screen').style.display = 'block'; switchProfileTab('info'); }

function openLoginModal() { document.getElementById('login-modal').style.display = 'flex'; document.getElementById('register-modal').style.display = 'none'; }
function closeLoginModal() { document.getElementById('login-modal').style.display = 'none'; }
function openRegisterModal() { document.getElementById('register-modal').style.display = 'flex'; document.getElementById('login-modal').style.display = 'none'; }
function closeRegisterModal() { document.getElementById('register-modal').style.display = 'none'; }
function switchToRegister() { openRegisterModal(); }
function switchToLogin() { openLoginModal(); }

// ==================== 2. TRANG ĐÁNH GIÁ & TIỆN ÍCH DẠO CHƠI ====================
async function renderReviews() {
    const container = document.getElementById('review-list'); if (!container) return;
    container.innerHTML = 'Đang tải...';
    try {
        const response = await fetch('http://127.0.0.1:8000/api/reviews');
        const rawReviews = await response.json();

        // Mỗi đánh giá lưu "content" dưới dạng JSON (note/loại phòng/ngày ở/điểm phòng-dịch vụ).
        // Đánh giá cũ (trước khi đổi giao diện) chỉ là text thường -> vẫn hiển thị được, chỉ thiếu các trường mở rộng.
        const reviews = rawReviews.map(r => {
            let extra = {};
            try { extra = JSON.parse(r.content); if (typeof extra !== 'object' || extra === null) extra = { note: r.content }; }
            catch (e) { extra = { note: r.content }; }
            return {
                customerName: r.customerName, date: r.date, stars: r.stars, image: r.image,
                note: extra.note || '', roomType: extra.roomType || '', stayFrom: extra.stayFrom || '', stayTo: extra.stayTo || '',
                roomScore: (typeof extra.roomScore === 'number') ? extra.roomScore : null,
                serviceScore: (typeof extra.serviceScore === 'number') ? extra.serviceScore : null
            };
        });

        // ----- TÍNH THỐNG KÊ TỔNG (thanh ĐIỂM TRUNG BÌNH / PHÒNG / DỊCH VỤ) -----
        const count = reviews.length;
        const avgStars = count ? (reviews.reduce((s, r) => s + (r.stars || 0), 0) / count) : 0;
        const roomScores = reviews.filter(r => r.roomScore !== null).map(r => r.roomScore);
        const serviceScores = reviews.filter(r => r.serviceScore !== null).map(r => r.serviceScore);
        const avgRoom = roomScores.length ? (roomScores.reduce((a, b) => a + b, 0) / roomScores.length) : (avgStars / 5 * 100);
        const avgService = serviceScores.length ? (serviceScores.reduce((a, b) => a + b, 0) / serviceScores.length) : (avgStars / 5 * 100);
        animateReviewStats(count, avgStars, avgRoom, avgService);

        // ----- VẼ DANH SÁCH ĐÁNH GIÁ -----
        container.innerHTML = '';
        if (count === 0) { container.innerHTML = '<p style="text-align:center; color:#888; padding: 30px 0;">Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ cảm nhận!</p>'; return; }

        const personIcon = `<svg viewBox="0 0 24 24"><path d="M12 12c2.5 0 4.5-2 4.5-4.5S14.5 3 12 3 7.5 5 7.5 7.5 9.5 12 12 12zm0 1.5c-3 0-9 1.5-9 4.5V21h18v-3c0-3-6-4.5-9-4.5z"/></svg>`;

        // Dùng map+join thay vì innerHTML += trong vòng lặp
        container.innerHTML = reviews.map((r, idx) => {
            const starsHTML = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
            const noteId = `rv-note-${idx}`;
            const stayHTML = (r.stayFrom || r.stayTo) ? `<div>Stayed: ${r.stayFrom || '?'} → ${r.stayTo || '?'}</div>` : '';
            const scoresHTML = (r.roomScore !== null || r.serviceScore !== null) ? `
                <div class="rv-item-scores">
                    ${r.roomScore !== null ? `<span>Phòng: <b>${r.roomScore}%</b></span>` : ''}
                    ${r.serviceScore !== null ? `<span>Dịch vụ: <b>${r.serviceScore}%</b></span>` : ''}
                </div>` : '';
            const imgHTML = r.image ? `<img src="${r.image}" class="rv-item-image" loading="lazy" decoding="async">` : '';
            const noteText = r.note || '';
            const needsExpand = noteText.length > 140;

            return `
                <div class="rv-item">
                    <div class="rv-avatar">${personIcon}</div>
                    <div class="rv-item-body">
                        <div class="rv-item-head">
                            <div>
                                <div class="rv-item-name">${r.customerName ? r.customerName.toUpperCase() : 'KHÁCH'}</div>
                                ${r.roomType ? `<span class="rv-item-roomtype">${r.roomType}</span>` : ''}
                            </div>
                            <div class="rv-item-dates">
                                <div>Posted: ${r.date}</div>
                                ${stayHTML}
                            </div>
                        </div>
                        <div class="rv-item-stars">${starsHTML}</div>
                        <div class="rv-item-category">Cảm nhận trải nghiệm</div>
                        <p class="rv-item-content" id="${noteId}">${noteText}</p>
                        ${needsExpand ? `<button class="rv-see-more" onclick="toggleReviewExpand('${noteId}', this)">Xem thêm</button>` : ''}
                        ${scoresHTML}
                        ${imgHTML}
                    </div>
                </div>`;
        }).join('');

        observeReviewItems();
    } catch (e) { container.innerHTML = '<p style="color:red;">Lỗi tải đánh giá</p>'; }
}

// Đếm số/chạy thanh % khi thanh thống kê xuất hiện trong khung nhìn
let rvStatsAnimated = false;
function animateReviewStats(count, avgStars, avgRoom, avgService) {
    const statsEl = document.getElementById('rv-stats');
    if (!statsEl) return;
    rvStatsAnimated = false;
    const run = () => {
        if (rvStatsAnimated) return; rvStatsAnimated = true;
        const countEl = document.getElementById('rv-stat-count');
        const start = performance.now(), duration = 900;
        function tick(now) {
            const p = Math.min(1, (now - start) / duration);
            countEl.innerText = Math.round(count * p);
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);

        const fullStars = Math.round(avgStars);
        document.getElementById('rv-stat-stars').innerText = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);

        document.getElementById('rv-bar-room').style.width = avgRoom.toFixed(1) + '%';
        document.getElementById('rv-pct-room').innerText = avgRoom.toFixed(1) + '%';
        document.getElementById('rv-bar-service').style.width = avgService.toFixed(1) + '%';
        document.getElementById('rv-pct-service').innerText = avgService.toFixed(1) + '%';
    };
    const obs = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) { run(); obs.disconnect(); } }); }, { threshold: 0.3 });
    obs.observe(statsEl);
}

// Hiệu ứng "bay vào" cho từng thẻ đánh giá khi cuộn tới
function observeReviewItems() {
    const items = document.querySelectorAll('.rv-item');
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('rv-visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.15 });
    items.forEach(el => obs.observe(el));
}

function toggleReviewExpand(noteId, btn) {
    const el = document.getElementById(noteId);
    el.classList.toggle('rv-expanded');
    btn.innerText = el.classList.contains('rv-expanded') ? 'Thu lại' : 'Xem thêm';
}

// ----- KHỞI TẠO CÁC THÀNH PHẦN TƯƠNG TÁC CỦA FORM (sao / slider / upload) -----
let rvSelectedStars = 5;
let rvFormInitialized = false;
function initReviewForm() {
    // Điền sẵn họ tên nếu đã đăng nhập
    const nameInput = document.getElementById('review-fullname-input');
    if (nameInput && !nameInput.value) nameInput.value = localStorage.getItem('current_user') || '';

    if (rvFormInitialized) return; // Các listener dưới đây chỉ cần gắn 1 lần
    rvFormInitialized = true;

    // ⭐ Bộ chọn sao (có hiệu ứng nảy + bắn sparkle khi click)
    const stars = document.querySelectorAll('#rv-star-picker .rv-star');
    function paintStars(n) { stars.forEach(s => s.classList.toggle('rv-filled', parseInt(s.dataset.value) <= n)); }
    function spawnStarSparkles(starEl) {
        for (let i = 0; i < 5; i++) {
            const sp = document.createElement('span');
            sp.className = 'rv-star-sparkle';
            const angle = Math.random() * Math.PI * 2;
            const dist = 14 + Math.random() * 16;
            sp.style.setProperty('--sx', Math.cos(angle) * dist + 'px');
            sp.style.setProperty('--sy', Math.sin(angle) * dist + 'px');
            starEl.appendChild(sp);
            sp.addEventListener('animationend', () => sp.remove());
        }
    }
    paintStars(rvSelectedStars);
    stars.forEach(s => {
        s.addEventListener('mouseenter', () => paintStars(parseInt(s.dataset.value)));
        s.addEventListener('click', () => {
            rvSelectedStars = parseInt(s.dataset.value);
            paintStars(rvSelectedStars);
            s.classList.remove('rv-pop'); void s.offsetWidth; s.classList.add('rv-pop');
            spawnStarSparkles(s);
        });
    });
    document.getElementById('rv-star-picker').addEventListener('mouseleave', () => paintStars(rvSelectedStars));

    // 🎚 Slider Phòng / Dịch vụ (fill động theo % kéo)
    const roomSlider = document.getElementById('rv-room-slider'), roomVal = document.getElementById('rv-room-slider-val');
    const svcSlider = document.getElementById('rv-service-slider'), svcVal = document.getElementById('rv-service-slider-val');
    function updateSliderFill(slider, label) {
        slider.style.setProperty('--rv-progress', slider.value + '%');
        label.innerText = slider.value + '%';
    }
    updateSliderFill(roomSlider, roomVal);
    updateSliderFill(svcSlider, svcVal);
    roomSlider.addEventListener('input', () => updateSliderFill(roomSlider, roomVal));
    svcSlider.addEventListener('input', () => updateSliderFill(svcSlider, svcVal));

    // 📷 Ảnh đính kèm: hiện tên file + xem trước + hỗ trợ kéo-thả
    const fileInput = document.getElementById('review-image-input');
    const uploadBox = document.getElementById('rv-upload-box');
    function handleReviewFile(file) {
        const nameSpan = document.getElementById('rv-upload-name');
        const preview = document.getElementById('rv-upload-preview');
        preview.innerHTML = '';
        if (file) {
            nameSpan.innerText = file.name;
            uploadBox.classList.add('rv-has-file');
            const reader = new FileReader();
            reader.onload = () => { preview.innerHTML = `<img src="${reader.result}">`; };
            reader.readAsDataURL(file);
        } else {
            nameSpan.innerText = 'Kéo & thả ảnh vào đây, hoặc bấm để chọn';
            uploadBox.classList.remove('rv-has-file');
        }
    }
    fileInput.addEventListener('change', () => handleReviewFile(fileInput.files[0] || null));
    ['dragenter', 'dragover'].forEach(evt => uploadBox.addEventListener(evt, e => { e.preventDefault(); uploadBox.classList.add('rv-dragover'); }));
    ['dragleave', 'drop'].forEach(evt => uploadBox.addEventListener(evt, e => { e.preventDefault(); uploadBox.classList.remove('rv-dragover'); }));
    uploadBox.addEventListener('drop', e => {
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            fileInput.files = e.dataTransfer.files;
            handleReviewFile(file);
        } else if (file) {
            showToast("Vui lòng chỉ kéo thả file ảnh!", "error");
        }
    });
}

async function submitReview() {
    if (localStorage.getItem('is_logged_in') !== 'true') {
        showToast("Bạn cần đăng nhập bằng tài khoản Khách hàng trước khi gửi đánh giá!", "error");
        return openLoginModal();
    }

    const fullname = document.getElementById('review-fullname-input').value.trim() || (localStorage.getItem('current_user') || "Khách");
    const roomType = document.getElementById('review-roomtype-input').value;
    const stayFrom = document.getElementById('review-stay-from').value;
    const stayTo = document.getElementById('review-stay-to').value;
    const note = document.getElementById('review-content-input').value.trim();
    const roomScore = parseInt(document.getElementById('rv-room-slider').value);
    const serviceScore = parseInt(document.getElementById('rv-service-slider').value);

    if (!note) return showToast("Vui lòng nhập nội dung đánh giá!", "error");
    if (!roomType) return showToast("Vui lòng chọn loại phòng đã ở!", "error");

    const fileInput = document.getElementById('review-image-input');
    let base64Image = "";
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file.size > 2 * 1024 * 1024) return showToast("Ảnh quá nặng! Vui lòng chọn ảnh dưới 2MB.", "error");
        base64Image = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    }

    // Đóng gói các trường mở rộng (loại phòng, ngày ở, điểm phòng/dịch vụ) vào content dạng JSON
    // để không phải đổi cấu trúc bảng DanhGia trong SQL Server.
    const contentPayload = JSON.stringify({ note, roomType, stayFrom, stayTo, roomScore, serviceScore });

    const reviewData = {
        customer_name: fullname,
        stars: rvSelectedStars,
        content: contentPayload,
        username: localStorage.getItem('current_username') || "",
        image: base64Image
    };

    const submitBtn = document.getElementById('rv-submit-btn');
    submitBtn.classList.add('rv-loading');

    try {
        const response = await fetch('http://127.0.0.1:8000/api/reviews/submit', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reviewData)
        });
        if (response.ok) {
            showToast("Tuyệt vời! Đánh giá của bạn đã được đăng!", "success");
            submitBtn.classList.remove('rv-loading');
            submitBtn.classList.add('rv-success');
            setTimeout(() => submitBtn.classList.remove('rv-success'), 1800);
            document.getElementById('review-content-input').value = '';
            document.getElementById('review-image-input').value = '';
            document.getElementById('rv-upload-name').innerText = 'Kéo & thả ảnh vào đây, hoặc bấm để chọn';
            document.getElementById('rv-upload-box').classList.remove('rv-has-file');
            document.getElementById('rv-upload-preview').innerHTML = '';
            renderReviews();
        } else {
            submitBtn.classList.remove('rv-loading');
            showToast("Lỗi máy chủ! Không thể lưu bài viết.", "error");
        }
    } catch (e) {
        submitBtn.classList.remove('rv-loading');
        showToast("Mất kết nối với Server!", "error");
    }
}

// Ngân hàng ảnh minh họa cho dịch vụ, khớp theo từ khóa trong tên dịch vụ.
// Mỗi nhóm dịch vụ có ảnh riêng biệt; nhóm không khớp sẽ xoay vòng qua dải ảnh dự phòng để không bị lặp ảnh.
const SVC_IMAGE_RULES = [
    { keys: ['spa', 'massage', 'xông hơi', 'thư giãn'], img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=70' },
    { keys: ['đón', 'sân bay', 'taxi', 'xe', 'đưa'], img: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=70' },
    { keys: ['sáng', 'buffet', 'ăn', 'nhà hàng', 'tối', 'ẩm thực'], img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=70' },
    { keys: ['giặt', 'ủi', 'là'], img: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=70' },
    { keys: ['bơi', 'pool'], img: 'https://images.unsplash.com/photo-1572331165267-854da2b10ccf?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=70' },
    { keys: ['gym', 'tập', 'thể dục', 'fitness'], img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=70' },
    { keys: ['họp', 'hội nghị', 'hội trường', 'sự kiện'], img: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=70' },
    { keys: ['trẻ', 'em bé', 'thiếu nhi'], img: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=70' },
    { keys: ['karaoke', 'giải trí'], img: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=70' },
    { keys: ['wifi', 'internet', 'mạng'], img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=70' },
    { keys: ['bar', 'minibar', 'đồ uống', 'cocktail'], img: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=70' },
    { keys: ['dọn phòng', 'vệ sinh'], img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=70' },
    { keys: ['tour', 'tham quan', 'du lịch'], img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=70' },
];
// Dải ảnh dự phòng (mang phong cách khách sạn sang trọng) — xoay vòng theo index để mỗi thẻ vẫn có ảnh riêng
const SVC_FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=70',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=70',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=70',
    'https://images.unsplash.com/photo-1519449556851-5720b33024e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=70',
];
function getServiceImage(name, idx) {
    const lower = (name || '').toLowerCase();
    const rule = SVC_IMAGE_RULES.find(r => r.keys.some(k => lower.includes(k)));
    return rule ? rule.img : SVC_FALLBACK_IMAGES[idx % SVC_FALLBACK_IMAGES.length];
}

async function renderCustomerServices() {
    const container = document.getElementById('service-list'); if (!container) return;
    container.innerHTML = `<div class="room-skeleton"></div><div class="room-skeleton"></div><div class="room-skeleton"></div>`;
    try {
        const response = await fetch('http://127.0.0.1:8000/api/admin/services');
        const services = await response.json();

        if (!services.length) {
            container.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding: 80px 20px; color: #8a7550;">
                    <div style="font-size:32px; margin-bottom:16px; opacity:0.4;">◈</div>
                    <p style="font-size:14px; letter-spacing:1px;">Hiện chưa có dịch vụ nào trong hệ thống</p>
                </div>`;
            return;
        }

        container.innerHTML = services.map((s, idx) => `
            <div class="room-card">
                <div class="room-card-img-wrap">
                    <span class="status-badge status-category">${s.category || 'Tiện ích'}</span>
                    <span class="room-card-num">HUCE Hotel</span>
                    <img src="${getServiceImage(s.name, idx)}" alt="${s.name}" loading="lazy">
                </div>
                <div class="room-card-body">
                    <p class="room-card-type">Dịch vụ cao cấp</p>
                    <h3 class="room-card-name">${s.name}</h3>
                    <div class="room-card-divider"></div>
                    <div class="room-card-price-row">
                        <span class="room-card-price">${s.price.toLocaleString('vi-VN')}</span>
                        <span class="room-card-unit">VND</span>
                    </div>
                    <div class="svc-note">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
                        Có thể chọn thêm ngay khi đặt phòng
                    </div>
                </div>
            </div>
        `).join('');

        // Fade-in lần lượt từng thẻ, đồng bộ với hiệu ứng của trang Danh sách phòng
        container.querySelectorAll('.room-card').forEach((card, i) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(24px)';
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s, border-color 0.3s';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, i * 90 + 80);
        });

    } catch (e) {
        container.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:#c0392b;">
                <p style="font-size:14px;">Không tải được dịch vụ từ Server. Vui lòng kiểm tra main.py / SQL Server.</p>
            </div>`;
    }
}

// ==================== 3. LUỒNG ĐẶT PHÒNG KHÁCH HÀNG (API THẬT) ====================
async function renderRooms(roomsToRender = null) {
    const container = document.getElementById("room-container");
    if(!container) return;

    // Hiển thị skeleton trong khi load
    container.innerHTML = `
        <div class="room-skeleton"></div>
        <div class="room-skeleton"></div>
        <div class="room-skeleton"></div>
    `;
    
    try {
        let displayRooms = roomsToRender;
        if (!displayRooms) {
            const username = localStorage.getItem('current_username') || '';
            const response = await fetch(`http://127.0.0.1:8000/api/rooms?username=${username}`);
            displayRooms = await response.json();
        }
        
        container.innerHTML = ""; 
        if (displayRooms.length === 0) return container.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding: 80px 20px; color: #8a7550;">
                <div style="font-size:32px; margin-bottom:16px; opacity:0.4;">◈</div>
                <p style="font-size:14px; letter-spacing:1px;">Không tìm thấy phòng nào phù hợp với bộ lọc</p>
            </div>`;
        
        // Dùng DocumentFragment để render 1 lần duy nhất, tránh reflow liên tục
        const fragment = document.createDocumentFragment();
        const tempDiv = document.createElement('div');

        displayRooms.forEach((room, idx) => {
            let badgeHTML = '';
            let buttonHTML = '';
            let cardExtraStyle = '';

            if (room.isMyRoom) {
                badgeHTML = `<span class="status-badge status-mine">Phòng của bạn</span>`;
                buttonHTML = `<button class="book-btn btn-mine" onclick="showToast('Bạn đang sử dụng phòng này. Xem chi tiết ở mục Cá nhân!','info')">Đang sử dụng</button>`;
                cardExtraStyle = 'border-color: rgba(14,165,233,0.4); box-shadow: 0 8px 28px rgba(14,165,233,0.12);';
            } else if (room.isAvailable) {
                badgeHTML = `<span class="status-badge status-ready">Còn trống</span>`;
                buttonHTML = `<button class="book-btn" onclick="attemptToBook('${room.id}', '${room.name}', ${room.price})">Đặt Phòng Ngay</button>`;
            } else {
                badgeHTML = `<span class="status-badge status-occupied">Đã đặt</span>`;
                cardExtraStyle = 'opacity: 0.82;';
                if (room.availableFrom) {
                    buttonHTML = `<div class="room-available-from">Trống từ ngày <strong>${room.availableFrom}</strong></div>`;
                } else {
                    buttonHTML = `<button class="book-btn" disabled>Đã có khách</button>`;
                }
            }

            const typeLabel = room.name.includes('Suite') ? 'Suite · Hạng sang' 
                            : room.name.includes('Deluxe') ? 'Deluxe · Cao cấp'
                            : 'Standard · Tiêu chuẩn';

            tempDiv.innerHTML = `
                <div class="room-card" style="${cardExtraStyle}">
                    <div class="room-card-img-wrap">
                        ${badgeHTML}
                        <span class="room-card-num">Phòng ${room.roomNumber}</span>
                        <img src="${room.image}" alt="${room.name}" loading="lazy" decoding="async">
                    </div>
                    <div class="room-card-body">
                        <p class="room-card-type">${typeLabel}</p>
                        <h3 class="room-card-name">${room.name}</h3>
                        <div class="room-card-divider"></div>
                        <div class="room-card-price-row">
                            <span class="room-card-price">${room.price.toLocaleString('vi-VN')}</span>
                            <span class="room-card-unit">VND / đêm</span>
                        </div>
                        ${buttonHTML}
                    </div>
                </div>`;
            fragment.appendChild(tempDiv.firstElementChild);
        });
        container.appendChild(fragment);

        // Fade-in cards lần lượt
        container.querySelectorAll('.room-card').forEach((card, i) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(24px)';
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s, border-color 0.3s';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, i * 90 + 80);
        });

    } catch (error) { 
        container.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:#c0392b;">
                <p style="font-size:13px;">⚠ Lỗi kết nối CSDL — Kiểm tra file <code>main.py</code> và SQL Server</p>
            </div>`;
    }
}

async function searchRooms() {
    const selectedType = document.getElementById('room-type-search').value;
    const priceRange = document.getElementById('room-price-search').value;
    const checkin = document.getElementById('search-checkin').value;
    const checkout = document.getElementById('search-checkout').value;
    const totalGuests = (parseInt(document.getElementById('search-adults').value) || 1)
                      + (parseInt(document.getElementById('search-children').value) || 0);
    const [minPrice, maxPrice] = priceRange.split('-').map(Number);
    const username = localStorage.getItem('current_username') || '';

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/rooms?username=${username}`);
        let allRooms = await response.json();
        
        // Lọc theo Loại phòng
        if (selectedType !== 'all') {
            allRooms = allRooms.filter(r => r.name === selectedType);
        }
        
        // Lọc theo Mức giá
        if (priceRange !== '0-999999999') {
            allRooms = allRooms.filter(r => r.price >= minPrice && r.price <= maxPrice);
        }
        
        renderRooms(allRooms);
        document.querySelector('.room-section').scrollIntoView({ behavior: 'smooth' });
    } catch (error) { 
        showToast("Lỗi kết nối bộ lọc Backend", "error"); 
    }
}

let currentBookingRoom = null;
let bookingNights = 1; // Mặc định ở 1 đêm

// [Thay thế nội dung bên trong hàm attemptToBook]
async function attemptToBook(roomId, roomName, price) {
    if (localStorage.getItem('is_logged_in') !== 'true') { showToast("Vui lòng đăng nhập trước khi đặt phòng!", "error"); return openLoginModal(); }
    
    currentBookingRoom = { id: roomId, name: roomName, price: price };
    
    let checkinStr = document.getElementById('search-checkin').value;
    let checkoutStr = document.getElementById('search-checkout').value;
    
    let ciDate = checkinStr ? new Date(checkinStr + 'T14:00') : new Date();
    if (!checkinStr) ciDate.setHours(14, 0, 0, 0);
    
    let coDate = checkoutStr ? new Date(checkoutStr + 'T12:00') : new Date(new Date().getTime() + 24*60*60*1000);
    if (!checkoutStr) coDate.setHours(12, 0, 0, 0);
    
    document.getElementById('booking-room-name').innerText = roomName;
    document.getElementById('booking-guest-name').innerText = localStorage.getItem('current_user') || "Khách hàng";
    
    // Gán dữ liệu vào ô chọn Giờ
    const formatForInput = (d) => { return d.getFullYear() + '-' + (d.getMonth() + 1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0') + 'T' + d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0'); };
    document.getElementById('booking-checkin-input').value = formatForInput(ciDate);
    document.getElementById('booking-checkout-input').value = formatForInput(coDate);
    
    recalculateBooking(); // Gọi hàm tính toán
    
    // NẠP DANH SÁCH DỊCH VỤ TỪ API
    const sList = document.getElementById('booking-services-list'); 
    sList.innerHTML = '<p style="font-size:13px; color:#666;">Đang tải danh sách dịch vụ...</p>';
    try {
        const response = await fetch('http://127.0.0.1:8000/api/admin/services');
        const activeServices = await response.json(); 
        sList.innerHTML = '';
        activeServices.forEach(s => {
            sList.innerHTML += `
                <label class="service-item-card">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <input type="checkbox" class="booking-service-cb" value="${s.price}" data-name="${s.name}" onchange="updateBookingTotal()">
                        <span class="svc-name">${s.name}</span>
                    </div>
                    <span class="svc-price">+${s.price.toLocaleString('vi-VN')} đ</span>
                </label>
            `;
        });
        updateBookingTotal();
        document.getElementById('booking-modal').style.display = 'flex';
    } catch(e) { showToast("Không tải được dịch vụ!", "error"); }
}
function recalculateBooking() {
    let ciVal = document.getElementById('booking-checkin-input').value;
    let coVal = document.getElementById('booking-checkout-input').value;
    if(!ciVal || !coVal) return;

    let ciDate = new Date(ciVal);
    let coDate = new Date(coVal);

    // Thuật toán: Nếu giờ ra < giờ vào -> Tự động đẩy giờ ra lên ngày hôm sau
    if(coDate <= ciDate) {
        coDate = new Date(ciDate.getTime() + 24 * 60 * 60 * 1000);
        const formatForInput = (d) => { return d.getFullYear() + '-' + (d.getMonth() + 1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0') + 'T' + d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0'); };
        document.getElementById('booking-checkout-input').value = formatForInput(coDate);
    }

    // Tính toán theo giờ hoặc theo đêm
    let diffHours = Math.ceil((coDate - ciDate) / (1000 * 60 * 60));
    let calculatedNights = Math.ceil(diffHours / 24);
    if (calculatedNights <= 0) calculatedNights = 1;

    bookingNights = calculatedNights;

    // Hiển thị ra UI: Nếu thuê < 24h báo tính theo giờ, ngược lại báo theo đêm
    let timeText = diffHours < 24 ? `${diffHours} giờ` : `${bookingNights} đêm`;
    document.getElementById('booking-nights-badge').innerText = timeText;
    document.getElementById('invoice-nights').innerText = timeText;

    updateBookingTotal();
}

// [CẬP NHẬT LẠI HÀM NÀY]
async function submitBooking() {
    let svcs = []; 
    document.querySelectorAll('.booking-service-cb:checked').forEach(cb => { svcs.push(cb.getAttribute('data-name')); });
    
    // Lấy con số tổng tiền cuối cùng trực tiếp từ UI
    let totalStr = document.getElementById('booking-total-price').innerText.replace(/\D/g,'');

    const bookingData = {
        username: localStorage.getItem('current_username'), 
        room_id: currentBookingRoom.id, 
        checkin: document.getElementById('booking-checkin-input').value, // Lấy chính xác thời gian vừa chọn
        checkout: document.getElementById('booking-checkout-input').value,
        total_price: parseFloat(totalStr), 
        services: svcs
    };

    try {
        const response = await fetch('http://127.0.0.1:8000/api/bookings', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bookingData)
        });
        if (response.ok) {
            showToast(`Tuyệt vời! Đơn đã lưu vào CSDL.`, "success"); 
            closeBookingModal(); 
            renderRooms(); 
        } else { showToast("Lỗi đặt phòng trên Server SQL!", "error"); }
    } catch (e) { showToast("Không kết nối được Backend!", "error"); }
}

function updateBookingTotal() {
    // 1. Tiền phòng = Giá 1 đêm x Số đêm
    let roomTotal = currentBookingRoom.price * bookingNights;
    document.getElementById('booking-room-total-price').innerText = roomTotal.toLocaleString('vi-VN') + ' đ';
    
    // 2. Tiền dịch vụ (Tính tổng các ô checkbox được tick)
    let servicesTotal = 0;
    document.querySelectorAll('.booking-service-cb:checked').forEach(cb => { 
        servicesTotal += parseInt(cb.value); 
    });
    document.getElementById('booking-services-total-price').innerText = servicesTotal.toLocaleString('vi-VN') + ' đ';
    
    // 3. Tổng cộng cuối cùng
    let grandTotal = roomTotal + servicesTotal;
    document.getElementById('booking-total-price').innerText = grandTotal.toLocaleString('vi-VN') + ' VND';
}

function closeBookingModal() { document.getElementById('booking-modal').style.display = 'none'; }



// ==================== 4. THÔNG TIN CÁ NHÂN PROFILE (API THẬT) ====================
function switchProfileTab(tabName) {
    document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.getElementById(`tab-menu-${tabName}`).classList.add('active');
    document.getElementById(`tab-content-${tabName}`).style.display = 'block';
    
    if (tabName === 'info') loadProfileData();
    if (tabName === 'history') loadBookingHistory();
    if (tabName === 'services') loadUsedServices();
}

async function loadProfileData() {
    let username = localStorage.getItem('current_username');
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/profile?username=${username}`);
        const user = await res.json();
        document.getElementById('profile-avatar-large').innerText = user.fullname.charAt(0).toUpperCase();
        document.getElementById('profile-name-display').innerText = user.fullname;
        document.getElementById('prof-fullname').value = user.fullname;
        document.getElementById('prof-email').value = user.email; 
        document.getElementById('prof-phone').value = user.phone;
        document.getElementById('prof-idcard').value = user.idcard;
        document.getElementById('prof-address').value = user.address;
    } catch(e) { showToast("Lỗi nạp Profile!", "error"); }
}

async function updateProfile() {
    const data = {
        username: localStorage.getItem('current_username'),
        fullname: document.getElementById('prof-fullname').value.trim(),
        phone: document.getElementById('prof-phone').value.trim(),
        idcard: document.getElementById('prof-idcard').value.trim(),
        address: document.getElementById('prof-address').value.trim()
    };
    try {
        const response = await fetch('http://127.0.0.1:8000/api/profile/update', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        if(response.ok) {
            localStorage.setItem('current_user', data.fullname); updateHeaderUI();
            showToast("Bảng KhachHang trong SQL Server đã cập nhật!", "success");
        }
    } catch(e) { showToast("Lỗi kết nối", "error"); }
}

async function loadBookingHistory() {
    let username = localStorage.getItem('current_username');
    const tbody = document.getElementById('history-tbody'); tbody.innerHTML = 'Đang truy vấn...';
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/profile/history?username=${username}`);
        const history = await res.json(); tbody.innerHTML = '';
        if(history.length === 0) return tbody.innerHTML = `<tr><td colspan="5">Chưa có đơn đặt phòng nào.</td></tr>`;
        history.forEach(b => {
            tbody.innerHTML += `<tr><td><strong>${b.id}</strong></td><td>${b.roomName}</td><td>${b.checkin} - ${b.checkout}</td><td><span class="badge confirmed">${b.status}</span></td><td>${b.totalPrice.toLocaleString()}đ</td></tr>`;
        });
    } catch(e) { tbody.innerHTML = 'Lỗi kết nối.'; }
}

async function loadUsedServices() {
    let username = localStorage.getItem('current_username');
    const tbody = document.getElementById('services-tbody'); if(!tbody) return; tbody.innerHTML = 'Đang truy vấn...';
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/profile/services?username=${username}`);
        const svcs = await res.json(); tbody.innerHTML = '';
        if(svcs.length === 0) return tbody.innerHTML = `<tr><td colspan="5">Bạn chưa sử dụng dịch vụ đi kèm nào.</td></tr>`;
        svcs.forEach(s => {
            tbody.innerHTML += `<tr><td><strong>${s.id}</strong></td><td>${s.serviceName}</td><td>${s.date}</td><td>${s.quantity}</td><td>${s.total.toLocaleString()}đ</td></tr>`;
        });
    } catch(e) { tbody.innerHTML = 'Lỗi kết nối.'; }
}

async function changePassword() {
    // Lấy dữ liệu từ các ô input (theo đúng ID trong file HTML của Anh)
    const oldPass = document.getElementById('old-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-new-password').value;
    
    // Kiểm tra tính hợp lệ
    if (!oldPass || !newPass || !confirmPass) return showToast("Vui lòng điền đầy đủ các ô mật khẩu!", "error");
    if (newPass !== confirmPass) return showToast("Mật khẩu mới gõ lại không khớp!", "error");
    if (oldPass === newPass) return showToast("Mật khẩu mới phải khác mật khẩu hiện tại!", "error");
    
    // Đóng gói gửi xuống Server
    const data = {
        username: localStorage.getItem('current_username'),
        old_password: oldPass,
        new_password: newPass
    };
    
    try {
        const res = await fetch('http://127.0.0.1:8000/api/profile/password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (res.ok) {
            showToast("Đổi mật khẩu thành công! Cơ sở dữ liệu đã được cập nhật.", "success");
            // Làm sạch các ô nhập liệu sau khi đổi xong
            document.getElementById('old-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-new-password').value = '';
        } else {
            const err = await res.json();
            showToast(err.detail, "error"); // Hiện lỗi nếu gõ sai pass cũ
        }
    } catch (e) {
        showToast("Lỗi kết nối máy chủ API!", "error");
    }
}
function resetData() { localStorage.clear(); initData(); showHomePage(); showToast("Đã làm sạch dữ liệu phiên duyệt web!", "info"); }

// ==================== 5. TOÀN BỘ CHỨC NĂNG ADMIN PANEL (API THẬT 100%) ====================
function showAdminPage() {
    hideAllScreens();
    document.getElementById('customer-view').style.display = 'none'; 
    document.getElementById('admin-screen').style.display = 'flex';
    switchAdminTab('rooms');
}

function switchAdminTab(tabId) {
    document.querySelectorAll('.admin-nav-menu li').forEach(li => li.classList.remove('active'));
    let navEl = document.getElementById('nav-admin-' + tabId); if (navEl) navEl.classList.add('active');
    document.querySelectorAll('.admin-tab-content').forEach(content => content.style.display = 'none');
    let tabEl = document.getElementById('admin-tab-' + tabId); if (tabEl) tabEl.style.display = 'block';

    if (tabId === 'rooms') renderAdminRooms();
    if (tabId === 'room-types') renderAdminRoomTypes();
    if (tabId === 'bookings') renderAdminBookings();
    if (tabId === 'services') renderAdminServices();
    if (tabId === 'settings') renderAdminSettings();
}

async function renderAdminRooms() {
    const tbody = document.getElementById('admin-rooms-tbody'); tbody.innerHTML = 'Đang đọc...';
    try {
        const res = await fetch('http://127.0.0.1:8000/api/admin/rooms');
        const rooms = await res.json(); tbody.innerHTML = '';
        rooms.forEach(room => {
            let badge = 'status-ready';
            if (room.status === 'Đang có khách') badge = 'status-occupied';
            if (room.status === 'Đang dọn dẹp') badge = 'status-cleaning';
            tbody.innerHTML += `<tr>
                <td><strong>${room.id}</strong></td><td>Phòng ${room.roomNumber}</td><td>${room.name}</td><td><span class="status-badge ${badge}">${room.status}</span></td>
                <td><button class="btn-action" onclick="mockUpdateStatus('${room.id}')">Xoay vòng trạng thái</button></td>
            </tr>`;
        });
    } catch(e) { tbody.innerHTML = 'Lỗi tải danh sách phòng.'; }
}

async function mockUpdateStatus(roomId) {
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/admin/rooms/status/${roomId}`, { method: 'POST' });
        if (res.ok) { showToast("Bảng Phong trong CSDL đã chuyển trạng thái!", "success"); renderAdminRooms(); }
    } catch(e) { showToast("Lỗi đổi trạng thái!", "error"); }
}

async function renderAdminRoomTypes(customData = null) {
    const tbody = document.getElementById('admin-room-types-tbody'); tbody.innerHTML = 'Đang tải...';
    try {
        let types = customData;
        if (!types) {
            const res = await fetch('http://127.0.0.1:8000/api/admin/room-types');
            types = await res.json();
        }
        tbody.innerHTML = '';
        types.forEach(type => {
            tbody.innerHTML += `<tr><td><strong>${type.id}</strong></td><td>${type.name}</td><td>${type.beds}</td><td>${type.maxPeople}</td><td>${type.price.toLocaleString()}đ</td><td><button class="btn-edit" onclick="showToast('Tính năng đang hoàn thiện','info')">Sửa</button></td></tr>`;
        });
    } catch(e) { tbody.innerHTML = 'Lỗi kết nối'; }
}

async function searchAdminRoomTypes() {
    let kw = document.getElementById('admin-search-type-input').value.trim();
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/admin/room-types?keyword=${encodeURIComponent(kw)}`);
        const data = await res.json(); renderAdminRoomTypes(data);
    } catch(e) { showToast("Lỗi tìm kiếm", "error"); }
}

async function renderAdminBookings(customData = null) {
    const tbody = document.getElementById('admin-bookings-tbody'); tbody.innerHTML = 'Đang lấy dữ liệu...';
    try {
        let bookings = customData;
        if (!bookings) {
            const res = await fetch('http://127.0.0.1:8000/api/admin/bookings');
            bookings = await res.json();
        }
        tbody.innerHTML = '';
        if(bookings.length === 0) tbody.innerHTML = '<tr><td colspan="6">Không thấy đơn đặt phòng nào.</td></tr>';
        bookings.forEach(b => {
            tbody.innerHTML += `<tr>
                <td><strong>${b.id}</strong></td><td>${b.customerName}</td><td>${b.checkin} - ${b.checkout}</td><td>${b.totalPrice.toLocaleString()}đ</td><td><span class="badge confirmed">${b.status}</span></td>
                <td><button class="btn-action-outline" onclick="showToast('Chức năng lập HD thật đang phát triển','info')">Lập HD</button></td>
            </tr>`;
        });
    } catch(e) { tbody.innerHTML = 'Lỗi nạp đơn hàng.'; }
}

async function searchAdminBookings() {
    let kw = document.getElementById('admin-search-booking-input').value.trim();
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/admin/bookings?keyword=${encodeURIComponent(kw)}`);
        const data = await res.json(); renderAdminBookings(data);
    } catch(e) { showToast("Lỗi tìm kiếm", "error"); }
}

async function renderAdminServices(customData = null) {
    const tbody = document.getElementById('admin-services-tbody'); tbody.innerHTML = 'Đang lấy danh mục...';
    try {
        let services = customData;
        if (!services) {
            const res = await fetch('http://127.0.0.1:8000/api/admin/services');
            services = await res.json();
        }
        tbody.innerHTML = '';
        services.forEach(s => {
            tbody.innerHTML += `<tr><td><strong>${s.id}</strong></td><td>${s.name}</td><td>${s.category}</td><td>${s.price.toLocaleString()}đ</td><td><span class="status-badge status-active">${s.status}</span></td><td><button class="btn-edit" onclick="showToast('Tính năng đang phát triển','info')">Sửa</button></td></tr>`;
        });
    } catch(e) { tbody.innerHTML = 'Lỗi nạp dịch vụ.'; }
}

async function searchAdminServices() {
    let kw = document.getElementById('admin-search-service-input').value.trim();
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/admin/services?keyword=${encodeURIComponent(kw)}`);
        const data = await res.json(); renderAdminServices(data);
    } catch(e) { showToast("Lỗi tìm kiếm", "error"); }
}

async function renderAdminSettings() {
    try {
        const res = await fetch('http://127.0.0.1:8000/api/admin/settings');
        const settings = await res.json();
        document.getElementById('set-hotel-name').value = settings.name;
        document.getElementById('set-hotel-phone').value = settings.phone;
        document.getElementById('set-hotel-address').value = settings.address;
        document.getElementById('set-checkin-time').value = settings.checkin;
        document.getElementById('set-checkout-time').value = settings.checkout;
        document.getElementById('set-vat').value = settings.vat;
    } catch(e) { showToast("Lỗi nạp cấu hình hệ thống!", "error"); }
}

async function saveAdminSettings() {
    const data = {
        name: document.getElementById('set-hotel-name').value,
        phone: document.getElementById('set-hotel-phone').value,
        address: document.getElementById('set-hotel-address').value,
        checkin: document.getElementById('set-checkin-time').value,
        checkout: document.getElementById('set-checkout-time').value,
        vat: parseInt(document.getElementById('set-vat').value)
    };
    try {
        const res = await fetch('http://127.0.0.1:8000/api/admin/settings', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        if(res.ok) {
            document.querySelectorAll('.hotel-name-display').forEach(el => el.innerText = data.name);
            showToast("Bảng KhachSan trong SQL Server đã được cập nhật thành công!", "success");
        }
    } catch(e) { showToast("Lỗi lưu cấu hình", "error"); }
}





// ==================== HIỆU ỨNG TRANG CHỦ ====================

// --- 1. PARTICLES VÀNG TRÊN HERO ---
function initHeroParticles() {
    const canvas = document.getElementById('hero-particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles = [], rafId = null, isVisible = true;

    function resize() {
        W = canvas.width  = canvas.offsetWidth;
        H = canvas.height = canvas.offsetHeight;
    }
    resize();
    let resizeTimer;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 200); });

    const COLORS = ['rgba(212,175,55,', 'rgba(245,217,122,', 'rgba(180,134,11,'];

    // Giảm từ 55 xuống 30 particles
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.8 + 0.4,
            alpha: Math.random() * 0.5 + 0.1,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -(Math.random() * 0.4 + 0.1),
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            twinkleSpeed: Math.random() * 0.02 + 0.005,
            twinkleDir: 1,
        });
    }

    function draw() {
        if (!isVisible) { rafId = null; return; }
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => {
            p.alpha += p.twinkleSpeed * p.twinkleDir;
            if (p.alpha >= 0.65 || p.alpha <= 0.05) p.twinkleDir *= -1;
            p.x += p.vx; p.y += p.vy;
            if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
            if (p.x < -4) p.x = W + 4;
            if (p.x > W + 4) p.x = -4;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color + p.alpha + ')';
            ctx.fill();
        });
        rafId = requestAnimationFrame(draw);
    }

    // Dừng animation khi hero ra ngoài viewport (tiết kiệm CPU đáng kể)
    const visObs = new IntersectionObserver(entries => {
        isVisible = entries[0].isIntersecting;
        if (isVisible && !rafId) draw();
    }, { threshold: 0 });
    visObs.observe(canvas);

    draw();
}

// --- 2. CURSOR SPOTLIGHT TRÊN HERO ---
function initHeroSpotlight() {
    const hero   = document.getElementById('hero-banner');
    const spot   = document.getElementById('hero-spotlight');
    if (!hero || !spot) return;

    hero.addEventListener('mousemove', e => {
        const rect = hero.getBoundingClientRect();
        spot.style.left = (e.clientX - rect.left) + 'px';
        spot.style.top  = (e.clientY - rect.top)  + 'px';
        spot.style.opacity = '1';
    });
    hero.addEventListener('mouseleave', () => { spot.style.opacity = '0'; });
}

// --- 3. PARALLAX HERO KHI SCROLL ---
function initHeroParallax() {
    const hero = document.getElementById('hero-banner');
    if (!hero) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const y = window.scrollY;
            if (y < hero.offsetHeight) {
                hero.style.setProperty('--parallax-y', (y * 0.3) + 'px');
            }
            ticking = false;
        });
    }, { passive: true });
}

// --- 4. COUNT-UP SỐ STATS ---
function initCountUp() {
    const nums = document.querySelectorAll('.hero-stat-num');
    if (!nums.length) return;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.dataset.target);
            const duration = target > 100 ? 1600 : 900;
            const start = performance.now();

            function update(now) {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                // easeOutExpo
                const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                el.textContent = Math.floor(ease * target).toLocaleString('vi-VN');
                if (progress < 1) requestAnimationFrame(update);
                else el.textContent = target.toLocaleString('vi-VN');
            }
            requestAnimationFrame(update);
            observer.unobserve(el);
        });
    }, { threshold: 0.6 });

    nums.forEach(n => observer.observe(n));
}

// --- 5. SCROLL REVEAL (section header + cards) ---
function initScrollReveal() {
    // Thêm class reveal cho các element cần animate
    const targets = [
        '.section-label', '.section-title-main', '.section-desc', '.section-rule'
    ];
    targets.forEach((sel, i) => {
        document.querySelectorAll(sel).forEach(el => {
            el.classList.add('reveal', `reveal-delay-${i}`);
        });
    });

    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                observer.unobserve(e.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// --- 6. RIPPLE EFFECT khi click nút Đặt Phòng ---
function addRippleEffect() {
    document.addEventListener('click', e => {
        const btn = e.target.closest('.book-btn');
        if (!btn || btn.disabled) return;

        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.5;
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.cssText = `
            width:${size}px; height:${size}px;
            left:${e.clientX - rect.left - size/2}px;
            top:${e.clientY - rect.top - size/2}px;
        `;
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    });
}


// --- KHỞI CHẠY TẤT CẢ HIỆU ỨNG ---
function initHomeAnimations() {
    initHeroParticles();
    initHeroSpotlight();
    initHeroParallax();
    initCountUp();
    initScrollReveal();
    addRippleEffect();
}

// Chạy sau khi DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomeAnimations);
} else {
    initHomeAnimations();
}

// CHẠY HỆ THỐNG TOÀN DIỆN
initData(); 
renderRooms(); 
checkInitialState();

// ==================== FLATPICKR & CHOICES (chạy sau khi thư viện load xong) ====================
window.addEventListener('load', function() {
    // Khởi tạo Flatpickr cho 2 ô ngày trong form đánh giá
    function initReviewDatePickers() {
        if (document.getElementById('review-stay-from')._flatpickr) return;
        const fpFrom = flatpickr("#review-stay-from", {
            locale: "vn", dateFormat: "d/m/Y",
            disableMobile: true,
            onChange: function(selectedDates) {
                if (selectedDates[0]) fpTo.set('minDate', selectedDates[0]);
            }
        });
        const fpTo = flatpickr("#review-stay-to", {
            locale: "vn", dateFormat: "d/m/Y",
            disableMobile: true,
            onChange: function(selectedDates) {
                if (selectedDates[0]) fpFrom.set('maxDate', selectedDates[0]);
            }
        });
    }

    // Khởi tạo Choices.js cho dropdown chọn loại phòng
    function initReviewChoices() {
        const el = document.getElementById('review-roomtype-input');
        if (el && !el.dataset.choicesInit) {
            new Choices(el, {
                searchEnabled: false,
                itemSelectText: '',
                shouldSort: false,
            });
            el.dataset.choicesInit = 'true';
        }
    }

    // Hook vào hàm showReviewPage có sẵn
    const _origShowReviewPage = showReviewPage;
    showReviewPage = function() {
        _origShowReviewPage();
        setTimeout(() => { initReviewDatePickers(); initReviewChoices(); }, 50);
    };

    // Thanh tìm phòng: chỉ hiện từ section "Danh Sách Phòng" trở xuống.
    // Trong vùng đó: scroll xuống -> ẩn, scroll lên -> hiện.
    // Có nút tròn để gọi lại thanh khi đang ẩn.
    (function() {
        const searchBar = document.getElementById('search-bar');
        const roomAnchor = document.getElementById('room-anchor');
        const toggleBtn = document.getElementById('search-bar-toggle-btn');
        if (!searchBar || !roomAnchor) return;

        let lastScrollY = window.scrollY;
        let ticking = false;
        let manuallyOpened = false; // người dùng vừa bấm nút để mở lại
        const threshold = 5;

        function setHidden(hidden) {
            searchBar.classList.toggle('search-bar-hidden', hidden);
            if (toggleBtn) toggleBtn.classList.toggle('show-toggle', hidden);
        }

        function onScroll() {
            const currentScrollY = window.scrollY;
            const anchorTop = roomAnchor.getBoundingClientRect().top + window.scrollY;
            const pastAnchor = currentScrollY >= anchorTop - 80;

            if (!pastAnchor) {
                setHidden(true);
                lastScrollY = currentScrollY;
                manuallyOpened = false;
                ticking = false;
                return;
            }

            const diff = currentScrollY - lastScrollY;
            if (Math.abs(diff) > threshold) {
                if (diff > 0 && !manuallyOpened) {
                    // scroll xuống
                    setHidden(true);
                } else if (diff < 0) {
                    // scroll lên
                    setHidden(false);
                    manuallyOpened = false;
                }
                lastScrollY = currentScrollY;
            }
            ticking = false;
        }

        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(onScroll);
                ticking = true;
            }
        }, { passive: true });

        if (toggleBtn) {
            toggleBtn.addEventListener('click', function() {
                setHidden(false);
                manuallyOpened = true;
                lastScrollY = window.scrollY;
            });
        }

        // Trạng thái ban đầu
        onScroll();
    })();
});