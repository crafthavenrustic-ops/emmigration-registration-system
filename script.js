/**
 * Emmigration.online - Main JavaScript
 * Premium Immigration Pre-registration System
 * Supports French/Latin character names for international passports
 */

// ==========================================
// Configuration
// ==========================================

// ⚠️ IMPORTANT: Replace with your Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby0v1qfE1Y4MdOJkqEOe_AAyU8fAFUp24CY0TIqNrhx1yUoAGi3j9ZGixYMxHFAuQ1bgQ/exec';

// Arabic Month Names for Formal Date Display
const ARABIC_MONTHS = [
    'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// French Month Names (optional enhancement)
const FRENCH_MONTHS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// ==========================================
// Utility Functions
// ==========================================

/**
 * Format date to Arabic formal format: "DD Month YYYY"
 */
function formatArabicDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = ARABIC_MONTHS[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

/**
 * Check if text contains Arabic characters
 */
function containsArabic(text) {
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text);
}

/**
 * Validate Latin/French characters only (A-Z, spaces, hyphens, apostrophes)
 */
function validateLatinCharacters(text) {
    // Allow: A-Z, a-z, spaces, hyphens, apostrophes, periods, and common French accents
    const latinPattern = /^[A-Za-z\s\-\.'éèêëàâäôöûüçÉÈÊËÀÂÄÔÖÛÜÇ]+$/;
    return latinPattern.test(text);
}

/**
 * Store form data in localStorage
 */
function storeFormData(data) {
    localStorage.setItem('emmigration_form_data', JSON.stringify(data));
}

/**
 * Retrieve form data from localStorage
 */
function getFormData() {
    const data = localStorage.getItem('emmigration_form_data');
    return data ? JSON.parse(data) : null;
}

/**
 * Show error on form field
 */
function showFieldError(fieldId, show = true, customMessage = null) {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(fieldId + 'Error');
    const group = field.closest('.form-group');
    
    if (customMessage && errorEl) {
        errorEl.textContent = customMessage;
    }
    
    if (show) {
        field.classList.add('error');
        group.classList.add('has-error');
        // Shake animation
        group.style.animation = 'shake 0.5s';
        setTimeout(() => {
            group.style.animation = '';
        }, 500);
    } else {
        field.classList.remove('error');
        group.classList.remove('has-error');
    }
}

/**
 * Show loading state on button
 */
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

// Add shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// ==========================================
// Scroll Animations
// ==========================================

function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => {
        observer.observe(el);
    });
}

// ==========================================
// FAQ Accordion
// ==========================================

function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all others
            faqItems.forEach(other => other.classList.remove('active'));
            
            // Toggle current
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

// ==========================================
// Form Handling (index.html)
// ==========================================

function initRegistrationForm() {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    // Real-time validation for Full Name (Latin only)
    const fullNameInput = document.getElementById('fullName');
    if (fullNameInput) {
        fullNameInput.addEventListener('input', function(e) {
            const value = e.target.value;
            
            // Check if Arabic characters entered
            if (containsArabic(value)) {
                showFieldError('fullName', true, 'الرجاء استخدام الأحرف اللاتينية فقط (A-Z). لا تكتب بالعربية هنا.');
                // Remove Arabic characters
                e.target.value = value.replace(/[\u0600-\u06FF]/g, '');
            } else {
                showFieldError('fullName', false);
            }
        });
    }

    // Date input handling
    const dateInput = document.getElementById('birthDate');
    const dateDisplay = document.getElementById('dateDisplay');
    
    if (dateInput) {
        dateInput.addEventListener('change', function() {
            if (this.value) {
                const arabicDate = formatArabicDate(this.value);
                dateDisplay.textContent = 'التاريخ: ' + arabicDate + ' / Date: ' + this.value;
                dateDisplay.style.display = 'block';
                showFieldError('birthDate', false);
            } else {
                dateDisplay.style.display = 'none';
            }
        });
    }

    // Clear errors on input for other fields
    ['country', 'whatsapp'].forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', () => showFieldError(fieldId, false));
            field.addEventListener('change', () => showFieldError(fieldId, false));
        }
    });

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        let isValid = true;
        
        // Full Name Validation (Latin/French only)
        const fullName = document.getElementById('fullName').value.trim();
        if (fullName.length < 3) {
            showFieldError('fullName', true, 'الاسم قصير جداً / Nom trop court');
            isValid = false;
        } else if (containsArabic(fullName)) {
            showFieldError('fullName', true, 'يجب كتابة الاسم بالأحرف اللاتينية (Français) وليس العربية');
            isValid = false;
        } else if (!validateLatinCharacters(fullName)) {
            showFieldError('fullName', true, 'استخدم الأحرف الإنجليزية أو الفرنسية فقط (A-Z)');
            isValid = false;
        }
        
        // Birth Date Validation
        const birthDate = document.getElementById('birthDate').value;
        if (!birthDate) {
            showFieldError('birthDate', true);
            isValid = false;
        }
        
        // Country Validation
        const country = document.getElementById('country').value;
        if (!country) {
            showFieldError('country', true);
            isValid = false;
        }
        
        // WhatsApp Validation
        const whatsapp = document.getElementById('whatsapp').value.trim().replace(/[^\d]/g, '');
        if (whatsapp.length < 10 || whatsapp.length > 15) {
            showFieldError('whatsapp', true);
            isValid = false;
        }
        
        if (!isValid) {
            // Scroll to first error
            const firstError = document.querySelector('.has-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        
        // Collect data
        const formData = {
            fullName: fullName,
            birthDate: birthDate,
            arabicBirthDate: formatArabicDate(birthDate),
            country: country,
            whatsapp: '+' + whatsapp,
            message: document.getElementById('message').value.trim(),
            submitDate: new Date().toLocaleString('fr-FR'),
            language: 'FR/AR'
        };
        
        // Store for next page
        storeFormData(formData);
        
        // Show loading
        setLoading('submitBtn', true);
        
        // Submit to Google Sheets
        try {
            // Note: Using no-cors mode for Google Apps Script
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            // Wait for UX
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Redirect to interview scheduling
            window.location.href = 'interview.html';
            
        } catch (error) {
            console.error('Error:', error);
            setLoading('submitBtn', false);
            alert('Erreur de connexion / خطأ في الاتصال. Veuillez réessayer / يرجى المحاولة مرة أخرى.');
        }
    });
}

// ==========================================
// Interview Page Logic
// ==========================================

function initInterviewPage() {
    const formData = getFormData();
    if (!formData) {
        window.location.href = 'index.html';
        return;
    }
    
    // Display summary with proper formatting
    const nameEl = document.getElementById('summaryName');
    nameEl.textContent = formData.fullName;
    nameEl.style.fontFamily = "'Inter', sans-serif";
    nameEl.style.color = "var(--primary-700)";
    
    document.getElementById('summaryDate').textContent = formData.arabicBirthDate;
    document.getElementById('summaryCountry').textContent = formData.country;
    
    // Generate Calendar
    generateCalendar();
    
    // Confirm button
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
        
        if (date.getDay() === 5) continue; // Skip Friday
        
        const dayName = days[date.getDay()];
        const dayNum = date.getDate();
        const month = ARABIC_MONTHS[date.getMonth()];
        const dateStr = date.toISOString().split('T')[0];
        
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.innerHTML = `
            <span class="day-name">${dayName}</span>
            <span class="day-number">${dayNum}</span>
        `;
        dayEl.dataset.date = dateStr;
        dayEl.dataset.display = `${dayNum} ${month}`;
        
        dayEl.addEventListener('click', function() {
            selectDate(this);
        });
        
        grid.appendChild(dayEl);
    }
}

function selectDate(element) {
    document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    document.getElementById('selectedDate').value = element.dataset.date;
    
    generateTimeSlots();
    const timeSection = document.getElementById('timeSection');
    timeSection.style.display = 'block';
    timeSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function generateTimeSlots() {
    const grid = document.getElementById('timeSlotsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    const times = ['10:00', '11:00', '14:00', '15:00', '16:00'];
    const labels = ['10:00 ص', '11:00 ص', '02:00 م', '03:00 م', '04:00 م'];
    
    times.forEach((time, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'time-slot';
        btn.textContent = labels[index];
        btn.dataset.time = time;
        
        btn.addEventListener('click', function() {
            selectTime(this, time);
        });
        
        grid.appendChild(btn);
    });
}

function selectTime(element, time) {
    document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    document.getElementById('selectedTime').value = time;
    document.getElementById('confirmBtn').disabled = false;
}

async function confirmInterview() {
    const date = document.getElementById('selectedDate').value;
    const time = document.getElementById('selectedTime').value;
    const formData = getFormData();
    
    if (!date || !time || !formData) return;
    
    setLoading('confirmBtn', true);
    
    const finalData = {
        ...formData,
        interviewDate: date,
        interviewTime: time,
        interviewDateArabic: formatArabicDate(date),
        status: 'Entretien planifié / مقابلة مجدولة'
    };
    
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(finalData)
        });
        
        localStorage.setItem('emmigration_interview_date', JSON.stringify({
            date: formatArabicDate(date),
            time: time
        }));
        
        window.location.href = 'success.html';
        
    } catch (error) {
        console.error('Error:', error);
        setLoading('confirmBtn', false);
        alert('Erreur / خطأ: يرجى المحاولة مرة أخرى');
    }
}

// ==========================================
// Initialize on DOM Ready
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    initScrollAnimations();
    initFAQ();
    initRegistrationForm();
});
