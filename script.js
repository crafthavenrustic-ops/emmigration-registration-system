/**
 * Emmigration.online - Main JavaScript
 * Data sent ONCE only at final confirmation
 */

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

const ARABIC_MONTHS = [
    'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

function formatArabicDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = ARABIC_MONTHS[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

function containsArabic(text) {
    return /[\u0600-\u06FF]/.test(text);
}

function validateLatinCharacters(text) {
    return /^[A-Za-z\s\-\.'éèêëàâäôöûüçÉÈÊËÀÂÄÔÖÛÜÇ]+$/.test(text);
}

function storeFormData(data) {
    localStorage.setItem('emmigration_form_data', JSON.stringify(data));
}

function getFormData() {
    const data = localStorage.getItem('emmigration_form_data');
    return data ? JSON.parse(data) : null;
}

function showFieldError(fieldId, show = true, customMessage = null) {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(fieldId + 'Error');
    const group = field.closest('.form-group');
    
    if (customMessage && errorEl) errorEl.textContent = customMessage;
    
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
    if (isLoading) {
        btn.classList.add('loading');
        btn.disabled = true;
    } else {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// ==========================================
// Form Handling - NO SENDING, just storage
// ==========================================

function initRegistrationForm() {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    const fullNameInput = document.getElementById('fullName');
    if (fullNameInput) {
        fullNameInput.addEventListener('input', function(e) {
            const value = e.target.value;
            if (containsArabic(value)) {
                showFieldError('fullName', true, 'الرجاء استخدام الأحرف اللاتينية فقط');
                e.target.value = value.replace(/[\u0600-\u06FF]/g, '');
            } else {
                showFieldError('fullName', false);
            }
        });
    }

    const dateInput = document.getElementById('birthDate');
    const dateDisplay = document.getElementById('dateDisplay');
    
    if (dateInput) {
        dateInput.addEventListener('change', function() {
            if (this.value) {
                dateDisplay.textContent = 'التاريخ: ' + formatArabicDate(this.value);
                dateDisplay.style.display = 'block';
                showFieldError('birthDate', false);
            } else {
                dateDisplay.style.display = 'none';
            }
        });
    }

    ['country', 'whatsapp'].forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', () => showFieldError(fieldId, false));
        }
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let isValid = true;
        
        const fullName = document.getElementById('fullName').value.trim();
        if (fullName.length < 3 || containsArabic(fullName) || !validateLatinCharacters(fullName)) {
            showFieldError('fullName', true, 'الاسم يجب أن يكون بالأحرف اللاتينية (A-Z)');
            isValid = false;
        }
        
        const birthDate = document.getElementById('birthDate').value;
        if (!birthDate) {
            showFieldError('birthDate', true);
            isValid = false;
        }
        
        const country = document.getElementById('country').value;
        if (!country) {
            showFieldError('country', true);
            isValid = false;
        }
        
        const whatsapp = document.getElementById('whatsapp').value.trim().replace(/[^\d]/g, '');
        if (whatsapp.length < 10) {
            showFieldError('whatsapp', true);
            isValid = false;
        }
        
        if (!isValid) {
            const firstError = document.querySelector('.has-error');
            if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        
        // ✅ حفظ فقط - بدون إرسال!
        const formData = {
            fullName: fullName,
            birthDate: birthDate,
            arabicBirthDate: formatArabicDate(birthDate),
            country: country,
            whatsapp: '+' + whatsapp,
            message: document.getElementById('message').value.trim(),
            submitDate: new Date().toLocaleString('fr-FR')
        };
        
        storeFormData(formData);
        
        // ✅ انتقال مباشر بدون انتظار
        window.location.href = 'interview.html';
    });
}

// ==========================================
// Interview Page - SEND ONCE HERE
// ==========================================

function initInterviewPage() {
    const formData = getFormData();
    if (!formData) {
        window.location.href = 'index.html';
        return;
    }
    
    const nameEl = document.getElementById('summaryName');
    nameEl.textContent = formData.fullName;
    nameEl.style.fontFamily = "'Inter', sans-serif";
    nameEl.style.color = "var(--primary-700)";
    
    document.getElementById('summaryDate').textContent = formData.arabicBirthDate;
    document.getElementById('summaryCountry').textContent = formData.country;
    
    generateCalendar();
    document.getElementById('confirmBtn').addEventListener('click', confirmInterview);
}

function generateCalendar() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    
    const today = new Date();
    const days = ['أحد', 'إثن', 'ثلاث', 'أربع', 'خميس', 'جمعة', 'سبت'];
    
    for (let i = 1; i <= 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        if (date.getDay() === 5) continue;
        
        const dayName = days[date.getDay()];
        const dayNum = date.getDate();
        const dateStr = date.toISOString().split('T')[0];
        
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.innerHTML = `<span class="day-name">${dayName}</span><span class="day-number">${dayNum}</span>`;
        dayEl.dataset.date = dateStr;
        
        dayEl.addEventListener('click', function() {
            document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById('selectedDate').value = this.dataset.date;
            generateTimeSlots();
            document.getElementById('timeSection').style.display = 'block';
        });
        
        grid.appendChild(dayEl);
    }
}

function generateTimeSlots() {
    const grid = document.getElementById('timeSlotsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const times = ['10:00 ص', '11:00 ص', '02:00 م', '03:00 م', '04:00 م'];
    
    times.forEach(time => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'time-slot';
        btn.textContent = time;
        btn.addEventListener('click', function() {
            document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById('selectedTime').value = time;
            document.getElementById('confirmBtn').disabled = false;
        });
        grid.appendChild(btn);
    });
}

// ✅ الإرسال مرة واحدة فقط هنا
async function confirmInterview() {
    const date = document.getElementById('selectedDate').value;
    const time = document.getElementById('selectedTime').value;
    const formData = getFormData();
    
    if (!date || !time || !formData) return;
    
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
        
        // ⏳ انتظر ثانية واحدة فقط للتأثير البصري
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // انتقل لصفحة النجاح
        window.location.href = 'success.html';
        
        // 🗑️ امسح البيانات بعد الإرسال الناجح
        localStorage.removeItem('emmigration_form_data');
        
    } catch (error) {
        console.error('Error:', error);
        setLoading('confirmBtn', false);
        alert('حدث خطأ في الإرسال، يرجى المحاولة مرة أخرى');
    }
}

// ==========================================
// Initialize
// ==========================================

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

function initFAQ() {
    document.querySelectorAll('.faq-item').forEach(item => {
        item.querySelector('.faq-question').addEventListener('click', () => {
            item.classList.toggle('active');
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initScrollAnimations();
    initFAQ();
    initRegistrationForm();
});
