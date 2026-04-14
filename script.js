/**
 * Emmigration.online - Main JavaScript
 * Premium Immigration Pre-registration System
 */

// ==========================================
// Configuration
// ==========================================

// ⚠️ IMPORTANT: Replace with your Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

// Arabic Month Names for Formal Date Display
const ARABIC_MONTHS = [
    'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// ==========================================
// Utility Functions
// ==========================================

/**
 * Format date to Arabic formal format: "DD Month YYYY"
 * Example: "14 أبريل 2026"
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
 * Get today's date in YYYY-MM-DD format
 */
function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Get date 30 days from today
 */
function getMaxDateString() {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
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
 * Clear stored form data
 */
function clearFormData() {
    localStorage.removeItem('emmigration_form_data');
    localStorage.removeItem('emmigration_interview_date');
}

/**
 * Validate WhatsApp number format
 */
function validateWhatsApp(number) {
    // Remove any non-digit characters except +
    const clean = number.replace(/[^\d+]/g, '');
    // Must be 10-15 digits, optionally starting with +
    return /^\+?[0-9]{10,15}$/.test(clean);
}

/**
 * Show error on form field
 */
function showFieldError(fieldId, show = true) {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(fieldId + 'Error');
    const group = field.closest('.form-group');
    
    if (show) {
        field.classList.add('error');
        group.classList.add('has-error');
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

// ==========================================
// Scroll Animations (Intersection Observer)
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

    // Date input handling - show formatted date below input
    const dateInput = document.getElementById('birthDate');
    const dateDisplay = document.getElementById('dateDisplay');
    
    dateInput.addEventListener('change', function() {
        if (this.value) {
            dateDisplay.textContent = 'التاريخ المختار: ' + formatArabicDate(this.value);
            dateDisplay.style.display = 'block';
        } else {
            dateDisplay.style.display = 'none';
        }
        showFieldError('birthDate', false);
    });

    // Real-time validation
    const fields = ['fullName', 'country', 'whatsapp'];
    fields.forEach(fieldId => {
        document.getElementById(fieldId).addEventListener('input', function() {
            showFieldError(fieldId, false);
        });
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validation
        let isValid = true;
        
        // Full Name
        const fullName = document.getElementById('fullName').value.trim();
        if (fullName.length < 3) {
            showFieldError('fullName', true);
            isValid = false;
        }
        
        // Birth Date
        const birthDate = document.getElementById('birthDate').value;
        if (!birthDate) {
            showFieldError('birthDate', true);
            isValid = false;
        }
        
        // Country
        const country = document.getElementById('country').value;
        if (!country) {
            showFieldError('country', true);
            isValid = false;
        }
        
        // WhatsApp
        const whatsapp = document.getElementById('whatsapp').value.trim();
        if (!validateWhatsApp(whatsapp)) {
            showFieldError('whatsapp', true);
            isValid = false;
        }
        
        if (!isValid) return;
        
        // Collect data
        const formData = {
            fullName: fullName,
            birthDate: birthDate,
            arabicBirthDate: formatArabicDate(birthDate),
            country: country,
            whatsapp: whatsapp.startsWith('+') ? whatsapp : '+' + whatsapp,
            message: document.getElementById('message').value.trim(),
            submitDate: new Date().toLocaleString('ar-SA')
        };
        
        // Store for next page
        storeFormData(formData);
        
        // Show loading
        setLoading('submitBtn', true);
        
        // Submit to Google Sheets
        try {
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            // Wait a bit to show loading state
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Redirect to interview scheduling
            window.location.href = 'interview.html';
            
        } catch (error) {
            console.error('Error:', error);
            setLoading('submitBtn', false);
            alert('حدث خطأ في الإرسال. يرجى المحاولة مرة أخرى.');
        }
    });
}

// ==========================================
// Interview Page Logic (interview.html)
// ==========================================

function initInterviewPage() {
    // Load saved data
    const formData = getFormData();
    if (!formData) {
        // If no data, redirect back to form
        window.location.href = 'index.html';
        return;
    }
    
    // Display summary
    document.getElementById('summaryName').textContent = formData.fullName;
    document.getElementById('summaryDate').textContent = formData.arabicBirthDate;
    document.getElementById('summaryCountry').textContent = formData.country;
    
    // Generate Calendar
    generateCalendar();
    
    // Confirm button
    document.getElementById('confirmBtn').addEventListener('click', confirmInterview);
}

function generateCalendar() {
    const grid = document.getElementById('calendarGrid');
    const today = new Date();
    const days = ['أحد', 'إثن', 'ثلاث', 'أربع', 'خميس', 'جمعة', 'سبت'];
    
    // Generate next 14 days
    for (let i = 1; i <= 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Skip Fridays (5)
        if (date.getDay() === 5) continue;
        
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
    // Remove previous selection
    document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));
    
    // Select new
    element.classList.add('selected');
    document.getElementById('selectedDate').value = element.dataset.date;
    
    // Show time slots
    generateTimeSlots();
    document.getElementById('timeSection').style.display = 'block';
    
    // Scroll to time section
    document.getElementById('timeSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function generateTimeSlots() {
    const grid = document.getElementById('timeSlotsGrid');
    grid.innerHTML = '';
    
    const times = ['10:00 ص', '11:00 ص', '12:00 م', '02:00 م', '03:00 م', '04:00 م'];
    
    times.forEach(time => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'time-slot';
        btn.textContent = time;
        
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
    
    // Enable confirm button
    document.getElementById('confirmBtn').disabled = false;
}

async function confirmInterview() {
    const date = document.getElementById('selectedDate').value;
    const time = document.getElementById('selectedTime').value;
    const formData = getFormData();
    
    if (!date || !time || !formData) return;
    
    setLoading('confirmBtn', true);
    
    // Prepare final data
    const finalData = {
        ...formData,
        interviewDate: date,
        interviewTime: time,
        interviewDateArabic: formatArabicDate(date),
        status: 'Interview Scheduled'
    };
    
    // Update Google Sheets with interview date
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(finalData)
        });
        
        // Store interview info
        localStorage.setItem('emmigration_interview_date', JSON.stringify({
            date: formatArabicDate(date),
            time: time
        }));
        
        // Redirect to success
        window.location.href = 'success.html';
        
    } catch (error) {
        console.error('Error:', error);
        setLoading('confirmBtn', false);
        alert('حدث خطأ في حفظ الموعد. يرجى المحاولة مرة أخرى.');
    }
}

// ==========================================
// Initialize on DOM Ready
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    initScrollAnimations();
    initFAQ();
    initRegistrationForm();
    
    // Clear data on success page load (after displaying)
    if (document.body.classList.contains('page-success')) {
        setTimeout(clearFormData, 1000);
    }
});
