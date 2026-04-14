const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwxNoaiE1k9Zfr3o-6cHD-mlhLUO9QY2B7xBDzJa8tWjVKVHl358zP_5TQCFHjyAZFZhQ/exec';
const ARABIC_MONTHS = ['يناير','فبراير','مارس','إبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function formatArabicDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate()} ${ARABIC_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function storeFormData(data) {
    localStorage.setItem('emmigration_form_data', JSON.stringify(data));
    // ⚠️ مهم: نضيف علم "لم يتم الإرسال بعد"
    localStorage.setItem('emmigration_data_sent', 'false');
}

function getFormData() {
    const data = localStorage.getItem('emmigration_form_data');
    return data ? JSON.parse(data) : null;
}

// ✅ دالة جديدة: التحقق مما إذا تم الإرسال مسبقاً
function isDataAlreadySent() {
    return localStorage.getItem('emmigration_data_sent') === 'true';
}

function setDataAsSent() {
    localStorage.setItem('emmigration_data_sent', 'true');
}

function showFieldError(fieldId, show) {
    const field = document.getElementById(fieldId);
    const group = field.closest('.form-group');
    if (show) {
        field.classList.add('error');
        group.classList.add('has-error');
    } else {
        field.classList.remove('error');
        group.classList.remove('has-error');
    }
}

function setLoading(buttonId, isLoading) {
    const btn = document.getElementById(buttonId);
    btn.classList.toggle('loading', isLoading);
    btn.disabled = isLoading;
}

// ==========================================
// PAGE 1: INDEX - NO SENDING (فقط حفظ)
// ==========================================

function initRegistrationForm() {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    // التحقق من الأحرف العربية في الاسم
    document.getElementById('fullName')?.addEventListener('input', function(e) {
        if (/[\u0600-\u06FF]/.test(e.target.value)) {
            showFieldError('fullName', true);
            e.target.value = e.target.value.replace(/[\u0600-\u06FF]/g, '');
            alert('⚠️ يجب كتابة الاسم بالأحرف اللاتينية فقط (A-Z)');
        } else {
            showFieldError('fullName', false);
        }
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value.trim();
        const birthDate = document.getElementById('birthDate').value;
        const country = document.getElementById('country').value;
        const whatsapp = document.getElementById('whatsapp').value.replace(/[^\d]/g, '');
        
        // Validation
        if (!fullName || fullName.length < 3) {
            showFieldError('fullName', true);
            return;
        }
        if (!birthDate) {
            showFieldError('birthDate', true);
            return;
        }
        if (!country) {
            showFieldError('country', true);
            return;
        }
        if (whatsapp.length < 10) {
            showFieldError('whatsapp', true);
            return;
        }
        
        // ✅ حفظ فقط - بدون أي إرسال!
        storeFormData({
            fullName: fullName,
            birthDate: birthDate,
            arabicBirthDate: formatArabicDate(birthDate),
            country: country,
            whatsapp: '+' + whatsapp,
            message: document.getElementById('message').value.trim()
        });
        
        // الانتقال للصفحة التالية
        window.location.href = 'interview.html';
    });
}

// ==========================================
// PAGE 2: INTERVIEW - SEND ONCE ONLY
// ==========================================

function initInterviewPage() {
    const formData = getFormData();
    if (!formData) {
        window.location.href = 'index.html';
        return;
    }
    
    // ✅ التحقق: إذا تم الإرسال مسبقاً، لا ترسل مرة أخرى!
    if (isDataAlreadySent()) {
        console.log('Data already sent, redirecting to success...');
        window.location.href = 'success.html';
        return;
    }
    
    // عرض البيانات
    document.getElementById('summaryName').textContent = formData.fullName;
    document.getElementById('summaryDate').textContent = formData.arabicBirthDate;
    document.getElementById('summaryCountry').textContent = formData.country;
    
    generateCalendar();
    document.getElementById('confirmBtn').addEventListener('click', confirmInterview);
}

function generateCalendar() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    
    const today = new Date();
    const days = ['أحد','إثن','ثلاث','أربع','خميس','جمعة','سبت'];
    
    for (let i = 1; i <= 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        if (date.getDay() === 5) continue; // Skip Friday
        
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.innerHTML = `<span class="day-name">${days[date.getDay()]}</span><span class="day-number">${date.getDate()}</span>`;
        dayEl.dataset.date = date.toISOString().split('T')[0];
        dayEl.addEventListener('click', () => selectDate(dayEl));
        grid.appendChild(dayEl);
    }
}

function selectDate(element) {
    document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    document.getElementById('selectedDate').value = element.dataset.date;
    
    // Show time slots
    const timeGrid = document.getElementById('timeSlotsGrid');
    timeGrid.innerHTML = '';
    ['10:00 ص','11:00 ص','02:00 م','03:00 م','04:00 م'].forEach(time => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'time-slot';
        btn.textContent = time;
        btn.onclick = () => selectTime(btn, time);
        timeGrid.appendChild(btn);
    });
    
    document.getElementById('timeSection').style.display = 'block';
}

function selectTime(btn, time) {
    document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('selectedTime').value = time;
    document.getElementById('confirmBtn').disabled = false;
}

// ✅ الإرسال مرة واحدة فقط مع حماية مزدوجة
async function confirmInterview() {
    const date = document.getElementById('selectedDate').value;
    const time = document.getElementById('selectedTime').value;
    const formData = getFormData();
    
    if (!date || !time || !formData) return;
    
    // ✅ التحقق الثاني: هل تم الإرسال مسبقاً؟
    if (isDataAlreadySent()) {
        alert('البيانات تم إرسالها مسبقاً! / Data already sent!');
        window.location.href = 'success.html';
        return;
    }
    
    setLoading('confirmBtn', true);
    
    const finalData = {
        fullName: formData.fullName,
        birthDate: formData.birthDate,
        arabicBirthDate: formData.arabicBirthDate,
        country: formData.country,
        whatsapp: formData.whatsapp,
        message: formData.message,
        interviewDateArabic: formatArabicDate(date),
        interviewTime: time,
        status: 'New / جديد'
    };
    
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(finalData)
        });
        
        // ✅ تعيين العلم: تم الإرسال!
        setDataAsSent();
        
        // الانتظار ثانية للتأثير البصري
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // الانتقال للنجاح
        window.location.href = 'success.html';
        
    } catch (error) {
        console.error('Error:', error);
        setLoading('confirmBtn', false);
        alert('حدث خطأ، يرجى المحاولة مرة أخرى');
    }
}

// ==========================================
// Initialize
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    // Scroll animations
    document.querySelectorAll('.reveal').forEach(el => {
        new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, {threshold: 0.1}).observe(el);
    });
    
    // FAQ
    document.querySelectorAll('.faq-item').forEach(item => {
        item.querySelector('.faq-question')?.addEventListener('click', () => {
            item.classList.toggle('active');
        });
    });
    
    initRegistrationForm();
    
    // Auto-init interview page if on that page
    if (document.body.classList.contains('page-interview')) {
        initInterviewPage();
    }
});
