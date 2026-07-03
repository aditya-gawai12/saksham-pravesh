// Client-side interactions and API consumers for Saksham Pravesh Web Platform

document.addEventListener('DOMContentLoaded', () => {
  console.log('Saksham Pravesh App Loaded.');

  // Set active link in Navbar
  const currentPath = window.location.pathname;
  document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });

  // Handle Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        const data = await response.json();
        if (data.success) {
          window.location.href = '/login';
        } else {
          alert('Failed to log out: ' + data.error);
        }
      } catch (err) {
        console.error('Logout error:', err);
        window.location.href = '/login'; // fallback redirect
      }
    });
  }

  // --- LOGIN PAGE LOGIC ---
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('error-message');

      errorDiv.classList.add('d-none');
      errorDiv.textContent = '';

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (response.ok && data.success) {
          window.location.href = data.role === 'admin' ? '/admin' : '/student';
        } else {
          errorDiv.textContent = data.error || 'Invalid credentials. Please try again.';
          errorDiv.classList.remove('d-none');
        }
      } catch (err) {
        console.error('Login submit error:', err);
        errorDiv.textContent = 'A network error occurred. Please check your connection.';
        errorDiv.classList.remove('d-none');
      }
    });
  }

  // --- REGISTER PAGE LOGIC ---
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const full_name = document.getElementById('full_name').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone_number = document.getElementById('phone_number').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm_password').value;
      const mht_cet_percentile = document.getElementById('mht_cet_percentile').value;
      const category = document.getElementById('category').value;
      const preferred_branch = document.getElementById('preferred_branch').value;
      const errorDiv = document.getElementById('error-message');

      // Get selected package
      const packageRadio = document.querySelector('input[name="selected_package"]:checked');
      const selected_package = packageRadio ? packageRadio.value : 'basic';

      errorDiv.classList.add('d-none');
      errorDiv.textContent = '';

      // Frontend password match verification
      if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match.';
        errorDiv.classList.remove('d-none');
        return;
      }

      // Frontend strict email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        errorDiv.textContent = 'Invalid email address format. Please provide a valid email.';
        errorDiv.classList.remove('d-none');
        return;
      }

      // Frontend phone number validation
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone_number)) {
        errorDiv.textContent = 'Invalid phone number format. Please provide a valid 10-digit phone number.';
        errorDiv.classList.remove('d-none');
        return;
      }

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name,
            email,
            phone_number,
            password,
            mht_cet_percentile,
            category,
            preferred_branch,
            selected_package
          })
        });
        const data = await response.json();

        if (response.ok && data.success) {
          // Registration automatically logs the student in, redirect to dashboard
          window.location.href = '/student';
        } else {
          errorDiv.textContent = data.error || 'Failed to register. Please check your input.';
          errorDiv.classList.remove('d-none');
        }
      } catch (err) {
        console.error('Registration submit error:', err);
        errorDiv.textContent = 'A server communication error occurred.';
        errorDiv.classList.remove('d-none');
      }
    });
  }

  // --- STUDENT DASHBOARD LOGIC ---
  const studentDashboard = document.getElementById('student-dashboard');
  if (studentDashboard) {
    loadStudentDashboard();
  }

  // --- ADMIN DASHBOARD LOGIC ---
  const adminDashboard = document.getElementById('admin-dashboard');
  if (adminDashboard) {
    loadAdminDashboard();
    loadAdminStats();

    // Handle Notice Form submission
    const noticeForm = document.getElementById('notice-form');
    if (noticeForm) {
      noticeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('notice-title').value.trim();
        const meeting_link = document.getElementById('notice-link').value.trim();
        const scheduled_time = document.getElementById('notice-time').value;
        const msgDiv = document.getElementById('notice-message');

        msgDiv.className = 'alert d-none';
        msgDiv.textContent = '';

        const fileInput = document.getElementById('notice-file');
        
        const formData = new FormData();
        formData.append('title', title);
        formData.append('meeting_link', meeting_link);
        formData.append('scheduled_time', scheduled_time);
        
        if (fileInput && fileInput.files.length > 0) {
          formData.append('notice_file', fileInput.files[0]);
        }

        try {
          const response = await fetch('/api/admin/notice', {
            method: 'POST',
            body: formData
          });
          const data = await response.json();

          if (response.ok && data.success) {
            msgDiv.className = 'alert alert-success';
            msgDiv.textContent = 'Announcement posted successfully!';
            noticeForm.reset();
            setTimeout(() => { msgDiv.classList.add('d-none'); }, 3000);
          } else {
            msgDiv.className = 'alert alert-danger';
            msgDiv.textContent = data.error || 'Could not post notice.';
          }
          msgDiv.classList.remove('d-none');
        } catch (err) {
          console.error('Notice creation error:', err);
          msgDiv.className = 'alert alert-danger';
          msgDiv.textContent = 'Server communications failed.';
          msgDiv.classList.remove('d-none');
        }
      });
    }

    const resourceForm = document.getElementById('resource-form');
    if (resourceForm) {
      resourceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('resource-title').value.trim();
        const description = document.getElementById('resource-desc').value.trim();
        const msgDiv = document.getElementById('resource-message');

        msgDiv.className = 'alert d-none';
        msgDiv.textContent = '';

        const fileInput = document.getElementById('resource-file');
        
        if (!fileInput.files.length) {
          msgDiv.className = 'alert alert-danger';
          msgDiv.textContent = 'Please select a file to upload.';
          msgDiv.classList.remove('d-none');
          return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('resource_file', fileInput.files[0]);

        try {
          const response = await fetch('/api/admin/resource', {
            method: 'POST',
            body: formData
          });
          const data = await response.json();

          if (response.ok && data.success) {
            msgDiv.className = 'alert alert-success';
            msgDiv.textContent = 'Resource uploaded and notice published!';
            resourceForm.reset();
            setTimeout(() => { msgDiv.classList.add('d-none'); }, 3000);
          } else {
            msgDiv.className = 'alert alert-danger';
            msgDiv.textContent = data.error || 'Could not upload resource.';
          }
          msgDiv.classList.remove('d-none');
        } catch (err) {
          console.error('Resource upload error:', err);
          msgDiv.className = 'alert alert-danger';
          msgDiv.textContent = 'Server communications failed.';
          msgDiv.classList.remove('d-none');
        }
      });
    }

    // Handle Link Form submission
    const linkForm = document.getElementById('link-form');
    if (linkForm) {
      linkForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('link-title').value.trim();
        const description = document.getElementById('link-desc').value.trim();
        const url = document.getElementById('link-url').value.trim();
        const msgDiv = document.getElementById('link-message');

        msgDiv.className = 'alert d-none';
        msgDiv.textContent = '';

        if (!url) {
          msgDiv.className = 'alert alert-danger';
          msgDiv.textContent = 'Please provide a valid URL.';
          msgDiv.classList.remove('d-none');
          return;
        }

        try {
          const response = await fetch('/api/admin/link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, url })
          });
          const data = await response.json();

          if (response.ok && data.success) {
            msgDiv.className = 'alert alert-success';
            msgDiv.textContent = 'Link added and notice published!';
            linkForm.reset();
            setTimeout(() => { msgDiv.classList.add('d-none'); }, 3000);
          } else {
            msgDiv.className = 'alert alert-danger';
            msgDiv.textContent = data.error || 'Could not add link.';
          }
          msgDiv.classList.remove('d-none');
        } catch (err) {
          console.error('Link add error:', err);
          msgDiv.className = 'alert alert-danger';
          msgDiv.textContent = 'Server communications failed.';
          msgDiv.classList.remove('d-none');
        }
      });
    }

    // Handle Receipt Upload
    const uploadReceiptBtn = document.getElementById('upload-receipt-btn');
    if (uploadReceiptBtn) {
      uploadReceiptBtn.addEventListener('click', async () => {
        const studentId = document.getElementById('receipt-student-id').value;
        const fileInput = document.getElementById('receipt-file');
        const msgDiv = document.getElementById('receipt-upload-message');

        if (!fileInput.files[0]) {
          msgDiv.className = 'alert alert-danger';
          msgDiv.textContent = 'Please select a PDF file.';
          msgDiv.classList.remove('d-none');
          return;
        }

        const formData = new FormData();
        formData.append('receipt', fileInput.files[0]);

        try {
          const response = await fetch(`/api/admin/upload-receipt/${studentId}`, {
            method: 'POST',
            body: formData
          });
          const data = await response.json();

          if (response.ok && data.success) {
            msgDiv.className = 'alert alert-success';
            msgDiv.textContent = 'Receipt uploaded successfully!';
            msgDiv.classList.remove('d-none');
            setTimeout(() => {
              bootstrap.Modal.getInstance(document.getElementById('uploadReceiptModal')).hide();
              loadAdminDashboard(); // Refresh table
            }, 1500);
          } else {
            msgDiv.className = 'alert alert-danger';
            msgDiv.textContent = data.error || 'Upload failed.';
            msgDiv.classList.remove('d-none');
          }
        } catch (err) {
          console.error('Receipt upload error:', err);
          msgDiv.className = 'alert alert-danger';
          msgDiv.textContent = 'Network error uploading receipt.';
          msgDiv.classList.remove('d-none');
        }
      });
    }

    // Handle Schedule Meeting
    const scheduleMeetingBtn = document.getElementById('schedule-meeting-btn');
    if (scheduleMeetingBtn) {
      scheduleMeetingBtn.addEventListener('click', async () => {
        const studentId = document.getElementById('meeting-student-id').value;
        const meeting_link = document.getElementById('meeting-link-input').value.trim();
        const scheduled_time = document.getElementById('meeting-time-input').value;
        const notes = document.getElementById('meeting-notes-input').value.trim();
        const msgDiv = document.getElementById('meeting-message');

        if (!meeting_link || !scheduled_time) {
          msgDiv.className = 'alert alert-danger';
          msgDiv.textContent = 'Meeting link and scheduled time are required.';
          msgDiv.classList.remove('d-none');
          return;
        }

        try {
          const response = await fetch(`/api/admin/schedule-meeting/${studentId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ meeting_link, scheduled_time, notes })
          });
          const data = await response.json();

          if (response.ok && data.success) {
            msgDiv.className = 'alert alert-success';
            msgDiv.textContent = 'Meeting scheduled successfully!';
            msgDiv.classList.remove('d-none');
            setTimeout(() => {
              bootstrap.Modal.getInstance(document.getElementById('scheduleMeetingModal')).hide();
            }, 1500);
          } else {
            msgDiv.className = 'alert alert-danger';
            msgDiv.textContent = data.error || 'Failed to schedule meeting.';
            msgDiv.classList.remove('d-none');
          }
        } catch (err) {
          console.error('Schedule meeting error:', err);
          msgDiv.className = 'alert alert-danger';
          msgDiv.textContent = 'Network error scheduling meeting.';
          msgDiv.classList.remove('d-none');
        }
      });
    }

    // Search & Filter for admin students table
    const searchInput = document.getElementById('search-students');
    const filterSelect = document.getElementById('filter-status');
    if (searchInput) {
      searchInput.addEventListener('input', filterStudentsTable);
    }
    if (filterSelect) {
      filterSelect.addEventListener('change', filterStudentsTable);
    }
  }
});

// --- ADMIN: Load Stats ---
async function loadAdminStats() {
  try {
    const response = await fetch('/api/admin/stats');
    const data = await response.json();
    if (data.success) {
      document.getElementById('stat-total').textContent = data.stats.totalStudents;
      document.getElementById('stat-pending').textContent = data.stats.pendingPayments;
      document.getElementById('stat-approved').textContent = data.stats.approvedStudents;
      document.getElementById('stat-premium').textContent = data.stats.premiumPackage;
    }
  } catch (err) {
    console.error('Error loading admin stats:', err);
  }
}

// --- ADMIN: Filter students table ---
function filterStudentsTable() {
  const searchTerm = (document.getElementById('search-students').value || '').toLowerCase();
  const statusFilter = document.getElementById('filter-status').value;
  const rows = document.querySelectorAll('#students-table-body tr[data-student-row]');

  rows.forEach(row => {
    const name = (row.getAttribute('data-name') || '').toLowerCase();
    const email = (row.getAttribute('data-email') || '').toLowerCase();
    const status = row.getAttribute('data-status') || '';

    const matchesSearch = name.includes(searchTerm) || email.includes(searchTerm);
    const matchesFilter = statusFilter === 'all' || status === statusFilter;

    row.style.display = (matchesSearch && matchesFilter) ? '' : 'none';
  });
}

// --- STUDENT DASHBOARD: Full enhanced loader ---
async function loadStudentDashboard() {
  const welcomeName = document.getElementById('welcome-name');
  const statusBadge = document.getElementById('payment-status-badge');
  const pendingSection = document.getElementById('pending-status-section');
  const approvedSection = document.getElementById('approved-status-section');
  const announcementsList = document.getElementById('announcements-list');

  try {
    const response = await fetch('/api/student/dashboard');
    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      throw new Error('Failed to load dashboard data');
    }

    const data = await response.json();
    if (data.success) {
      // Set student name
      welcomeName.textContent = data.fullName;

      // Profile card
      document.getElementById('profile-name').textContent = data.fullName;
      document.getElementById('profile-email').textContent = data.email;
      document.getElementById('profile-phone').textContent = data.phoneNumber;
      document.getElementById('profile-percentile').textContent = parseFloat(data.percentile).toFixed(2) + '%ile';
      document.getElementById('profile-category').textContent = data.category;
      document.getElementById('profile-branch').textContent = data.preferredBranch;

      // Avatar initials
      const initials = data.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      document.getElementById('profile-avatar').textContent = initials;

      // Package details
      let packageName = 'Form Assist (Basic)';
      let packageIconHtml = '<i class="bi bi-box"></i>';
      
      if (data.selectedPackage === 'premium') {
        packageName = 'Premium Counseling';
        packageIconHtml = '<i class="bi bi-stars"></i>';
      } else if (data.selectedPackage === 'exclusive') {
        packageName = 'Form Filling (Exclusive)';
        packageIconHtml = '<i class="bi bi-pencil-square"></i>';
      }
      
      document.getElementById('package-name').textContent = packageName;
      const packageIcon = document.getElementById('package-icon');
      packageIcon.innerHTML = packageIconHtml;
      
      if (data.selectedPackage === 'premium') {
        packageIcon.classList.add('premium');
      } else {
        packageIcon.classList.remove('premium');
      }

      // Package features
      const featuresContainer = document.getElementById('package-features');
      if (data.selectedPackage === 'premium') {
        featuresContainer.innerHTML = `
          <div class="row g-2">
            <div class="col-sm-6"><i class="bi bi-check-circle-fill text-info me-1"></i> Unlimited preference list updates</div>
            <div class="col-sm-6"><i class="bi bi-check-circle-fill text-info me-1"></i> Personalized cutoff analysis</div>
            <div class="col-sm-6"><i class="bi bi-check-circle-fill text-info me-1"></i> Live 1-on-1 Google Meet counseling</div>
            <div class="col-sm-6"><i class="bi bi-check-circle-fill text-info me-1"></i> Spot Round strategy guides</div>
            <div class="col-sm-6"><i class="bi bi-check-circle-fill text-info me-1"></i> Emergency WhatsApp support</div>
          </div>`;
      } else if (data.selectedPackage === 'exclusive') {
        featuresContainer.innerHTML = `
          <div class="row g-2">
            <div class="col-sm-6"><i class="bi bi-check-circle-fill text-info me-1"></i> Cap Round preference list filling</div>
            <div class="col-sm-6"><i class="bi bi-check-circle-fill text-info me-1"></i> Final list execution</div>
            <div class="col-sm-6"><i class="bi bi-check-circle-fill text-info me-1"></i> Allot-me standard plan free access</div>
          </div>`;
      } else {
        featuresContainer.innerHTML = `
          <div class="row g-2">
            <div class="col-sm-6"><i class="bi bi-check-circle-fill text-info me-1"></i> Personalized Preference List (PDF)</div>
            <div class="col-sm-6"><i class="bi bi-check-circle-fill text-info me-1"></i> Cutoff analysis of 3 branches</div>
            <div class="col-sm-6"><i class="bi bi-check-circle-fill text-info me-1"></i> Email & Web dashboard notices</div>
          </div>`;
      }

      // Receipt download
      if (data.receiptPath) {
        const receiptBtn = document.getElementById('download-receipt-btn');
        receiptBtn.href = data.receiptPath;
        receiptBtn.classList.remove('d-none');
      }

      // Update badge & show correct section
      if (data.paymentStatus === 'approved') {
        statusBadge.textContent = 'Approved & Enrolled';
        statusBadge.className = 'badge-status badge-status-approved';
        pendingSection.classList.add('d-none');
        approvedSection.classList.remove('d-none');

        // Update Progress Tracker
        const stepPayment = document.getElementById('step-payment');
        const stepDocs = document.getElementById('step-docs');
        const stepAllocated = document.getElementById('step-allocated');
        const stepCapLabel = document.getElementById('step-cap-label');
        
        const progress = data.progressStep || 2;
        
        if (progress >= 2) {
          if (stepPayment) stepPayment.classList.replace('active', 'completed');
        }
        
        if (progress >= 3 && progress <= 6) {
          if (stepDocs) stepDocs.classList.add('active');
          if (stepCapLabel) {
            const labels = {
              3: 'Cap Round 1 Active',
              4: 'Cap Round 2 Active',
              5: 'Cap Round 3 Active',
              6: 'Spot Round Active'
            };
            stepCapLabel.textContent = labels[progress];
          }
        } else if (progress >= 7) {
          if (stepDocs) {
            stepDocs.classList.remove('active');
            stepDocs.classList.add('completed');
          }
          if (stepCapLabel) stepCapLabel.textContent = 'Cap Rounds Completed';
          if (stepAllocated) stepAllocated.classList.add('active');
        }

        // Next Meeting (Premium only)
        if (isPremium && data.nextMeeting) {
          const meetingWrapper = document.getElementById('meeting-card-wrapper');
          meetingWrapper.classList.remove('d-none');
          const meetingTime = new Date(data.nextMeeting.scheduled_time);
          document.getElementById('meeting-datetime').textContent = meetingTime.toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' });
          document.getElementById('join-meeting-btn').href = data.nextMeeting.meeting_link;
          if (data.nextMeeting.notes) {
            document.getElementById('meeting-notes-display').style.display = 'block';
            document.getElementById('meeting-notes-text').textContent = data.nextMeeting.notes;
          }
        }

        // Populate Notices
        announcementsList.innerHTML = '';
        if (data.notices && data.notices.length > 0) {
          data.notices.forEach(notice => {
            const hasMeeting = !!notice.meeting_link;
            const card = document.createElement('div');
            card.className = `glass-card p-4 mb-3 notice-card ${hasMeeting ? 'meeting-active' : ''}`;
            
            let meetingHtml = '';
            if (hasMeeting) {
              const formattedTime = notice.scheduled_time 
                ? new Date(notice.scheduled_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) 
                : 'As scheduled';

              meetingHtml = `
                <div class="mt-3 p-3 bg-dark rounded border border-info d-flex flex-column flex-sm-row justify-content-between align-items-sm-center">
                  <div>
                    <span class="text-info fw-bold d-block"><i class="bi bi-camera-video-fill me-2"></i>Live Group Counseling</span>
                    <small class="text-muted"><i class="bi bi-clock me-1"></i>${formattedTime}</small>
                  </div>
                  <a href="${notice.meeting_link}" target="_blank" class="btn btn-sm btn-info mt-2 mt-sm-0 text-dark fw-bold">
                    Join Google Meet <i class="bi bi-arrow-up-right me-1"></i>
                  </a>
                </div>
              `;
            }

            const noticeDate = new Date(notice.created_at).toLocaleString('en-IN', { dateStyle: 'medium' });

            let attachmentHtml = '';
            if (notice.attachment_path) {
              attachmentHtml = `
                <div class="mt-3">
                  <a href="${notice.attachment_path}" target="_blank" class="btn btn-sm btn-outline-info">
                    <i class="bi bi-file-earmark-arrow-down me-1"></i> Download Attachment
                  </a>
                </div>
              `;
            }

            card.innerHTML = `
              <div class="d-flex justify-content-between align-items-start">
                <h5 class="fw-bold mb-1">${escapeHtml(notice.title)}</h5>
                <span class="badge bg-secondary text-light" style="font-size: 0.75rem">${noticeDate}</span>
              </div>
              ${meetingHtml}
              ${attachmentHtml}
            `;
            announcementsList.appendChild(card);
          });
        } else {
          announcementsList.innerHTML = `
            <div class="text-center py-5 text-muted">
              <i class="bi bi-chat-left-dots" style="font-size: 2.5rem;"></i>
              <p class="mt-3">No announcements or counseling sessions scheduled yet. Check back soon!</p>
            </div>
          `;
        }

        // Render Resources
        const resourcesList = document.getElementById('dynamic-resources-list');
        if (resourcesList) {
          resourcesList.innerHTML = '';
          if (data.resources && data.resources.length > 0) {
            data.resources.forEach(res => {
              resourcesList.innerHTML += `
                <a href="${res.file_path}" target="_blank" class="btn btn-dark text-start border border-secondary p-3 interactive-card">
                  <div class="fw-bold text-light"><i class="bi bi-file-earmark-arrow-down me-2 text-success"></i>${escapeHtml(res.title)}</div>
                  ${res.description ? `<small class="text-muted d-block mt-1">${escapeHtml(res.description)}</small>` : ''}
                </a>
              `;
            });
          } else {
            resourcesList.innerHTML = `<p class="text-muted small mb-0 text-center py-2">No resources uploaded yet.</p>`;
          }
        }
      } else {
        statusBadge.textContent = 'Pending Payment Verification';
        statusBadge.className = 'badge-status badge-status-pending';
        pendingSection.classList.remove('d-none');
        approvedSection.classList.add('d-none');
      }
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
    alert('Failed to retrieve student dashboard. Try refreshing the page.');
  }
}

// --- ADMIN DASHBOARD: Enhanced student table loader ---
// Store students data globally for filtering
let allStudentsData = [];

async function loadAdminDashboard() {
  const studentsTableBody = document.getElementById('students-table-body');
  if (!studentsTableBody) return;

  try {
    const response = await fetch('/api/admin/students');
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        window.location.href = '/login';
        return;
      }
      throw new Error('Failed to load students');
    }

    const data = await response.json();
    if (data.success) {
      allStudentsData = data.students || [];
      renderStudentsTable(allStudentsData);
    }
  } catch (error) {
    console.error('Error loading students table:', error);
    alert('Failed to retrieve registered students.');
  }
}

function renderStudentsTable(students) {
  const studentsTableBody = document.getElementById('students-table-body');
  studentsTableBody.innerHTML = '';

  if (students.length > 0) {
    students.forEach(student => {
      const row = document.createElement('tr');
      row.setAttribute('data-student-row', 'true');
      row.setAttribute('data-name', student.full_name);
      row.setAttribute('data-email', student.email);
      row.setAttribute('data-status', student.payment_status);
      
      const createdDate = new Date(student.created_at).toLocaleDateString('en-IN');
      const isApproved = student.payment_status === 'approved';
      const isPremium = student.selected_package === 'premium';
      const isExclusive = student.selected_package === 'exclusive';
      const hasReceipt = !!student.receipt_path;
      
      let packageBadgeClass = 'bg-secondary bg-opacity-25 text-dark';
      let packageBadgeHtml = '<i class="bi bi-box me-1"></i>Basic';
      
      if (isPremium) {
        packageBadgeClass = 'bg-info bg-opacity-20 text-info';
        packageBadgeHtml = '<i class="bi bi-stars me-1"></i>Premium';
      } else if (isExclusive) {
        packageBadgeClass = 'bg-primary bg-opacity-20 text-primary';
        packageBadgeHtml = '<i class="bi bi-pencil-square me-1"></i>Exclusive';
      }
      
      row.innerHTML = `
        <td>
          <div class="fw-bold text-dark">${escapeHtml(student.full_name)}</div>
          <small class="text-muted">Registered: ${createdDate}</small>
        </td>
        <td>
          <div style="font-size: 0.85rem"><i class="bi bi-envelope me-1 text-muted"></i>${escapeHtml(student.email)}</div>
          <div style="font-size: 0.85rem"><i class="bi bi-telephone me-1 text-muted"></i>${escapeHtml(student.phone_number)}</div>
        </td>
        <td>
          <span class="percentile-badge">${parseFloat(student.mht_cet_percentile).toFixed(2)}%ile</span>
        </td>
        <td>
          <span class="badge ${packageBadgeClass} px-2 py-1" style="font-size: 0.8rem">
            ${packageBadgeHtml}
          </span>
          <div class="text-muted mt-1" style="font-size: 0.75rem">${escapeHtml(student.category)} · ${escapeHtml(student.preferred_branch)}</div>
        </td>
        <td>
          <span class="badge-status ${isApproved ? 'badge-status-approved' : 'badge-status-pending'} mb-1 d-inline-block" id="status-badge-${student.id}" style="font-size: 0.78rem">
            ${isApproved ? 'Approved' : 'Pending'}
          </span>
          <select class="form-select form-select-sm progress-select mt-1" data-id="${student.id}" style="font-size: 0.75rem; width: 130px;">
            <option value="1" ${student.progress_step == 1 ? 'selected' : ''}>Registered</option>
            <option value="2" ${student.progress_step == 2 ? 'selected' : ''}>Payment Verified</option>
            <option value="3" ${student.progress_step == 3 ? 'selected' : ''}>Cap Round 1</option>
            <option value="4" ${student.progress_step == 4 ? 'selected' : ''}>Cap Round 2</option>
            <option value="5" ${student.progress_step == 5 ? 'selected' : ''}>Cap Round 3</option>
            <option value="6" ${student.progress_step == 6 ? 'selected' : ''}>Spot Round</option>
            <option value="7" ${student.progress_step == 7 ? 'selected' : ''}>Seat Allocated</option>
          </select>
        </td>
        <td>
          ${hasReceipt 
            ? `<a href="${student.receipt_path}" target="_blank" class="btn btn-sm btn-outline-info" style="font-size: 0.75rem"><i class="bi bi-file-pdf me-1"></i>View</a>` 
            : `<button class="btn btn-sm btn-outline-secondary upload-receipt-trigger" data-id="${student.id}" data-name="${escapeHtml(student.full_name)}" style="font-size: 0.75rem"><i class="bi bi-upload me-1"></i>Upload</button>`
          }
        </td>
        <td>
          ${student.meeting_link 
            ? `<a href="${student.meeting_link}" target="_blank" class="btn btn-sm btn-outline-success" style="font-size: 0.75rem" title="View scheduled Google Meet"><i class="bi bi-camera-video me-1"></i>View</a>` 
            : `<span class="text-muted" style="font-size: 0.75rem">No link</span>`
          }
        </td>
        <td>
          <div class="d-flex flex-column gap-1">
            <div class="form-check form-switch">
              <input class="form-check-input approval-toggle" type="checkbox" id="toggle-${student.id}" data-id="${student.id}" ${isApproved ? 'checked' : ''}>
              <label class="form-check-label text-muted" style="font-size: 0.75rem" for="toggle-${student.id}">Verify</label>
            </div>
            ${isPremium ? `<button class="btn btn-sm btn-outline-info schedule-meeting-trigger" data-id="${student.id}" data-name="${escapeHtml(student.full_name)}" style="font-size: 0.7rem; padding: 2px 6px;"><i class="bi bi-calendar-event me-1"></i>Schedule</button>` : ''}
          </div>
        </td>
      `;
      
      studentsTableBody.appendChild(row);
    });

    // Attach event listeners to toggle switches
    document.querySelectorAll('.approval-toggle').forEach(toggle => {
      toggle.addEventListener('change', async (e) => {
        const studentId = e.target.getAttribute('data-id');
        const targetStatus = e.target.checked ? 'approved' : 'pending';
        
        try {
          const res = await fetch(`/api/admin/approve/${studentId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_status: targetStatus })
          });
          const resData = await res.json();
          
          if (res.ok && resData.success) {
            // Update badge text and style
            const badge = document.getElementById(`status-badge-${studentId}`);
            if (targetStatus === 'approved') {
              badge.textContent = 'Approved';
              badge.className = 'badge-status badge-status-approved';
              if (resData.emailSent) {
                showToast('Payment approved & confirmation email sent! ✅');
              } else {
                showToast('Payment approved! (Email not configured)');
              }
            } else {
              badge.textContent = 'Pending';
              badge.className = 'badge-status badge-status-pending';
            }
            // Update data attribute for filtering
            e.target.closest('tr').setAttribute('data-status', targetStatus);
            loadAdminStats(); // Refresh stats
          } else {
            alert(resData.error || 'Failed to update student verification status.');
            e.target.checked = !e.target.checked; // revert toggle
          }
        } catch (err) {
          console.error('Approval request failed:', err);
          alert('Network error updating student status.');
          e.target.checked = !e.target.checked; // revert toggle
        }
      });
    });

    // Attach event listeners to progress step dropdowns
    document.querySelectorAll('.progress-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const studentId = e.target.getAttribute('data-id');
        const newProgressStep = e.target.value;
        
        try {
          const res = await fetch(`/api/admin/progress/${studentId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ progress_step: newProgressStep })
          });
          const resData = await res.json();
          
          if (res.ok && resData.success) {
            showToast('Progress step updated successfully! ✅');
          } else {
            alert(resData.error || 'Failed to update progress step.');
          }
        } catch (err) {
          console.error('Progress update request failed:', err);
          alert('Network error updating progress step.');
        }
      });
    });

    // Attach event listeners to upload receipt buttons
    document.querySelectorAll('.upload-receipt-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const studentId = e.currentTarget.getAttribute('data-id');
        const studentName = e.currentTarget.getAttribute('data-name');
        document.getElementById('receipt-student-id').value = studentId;
        document.getElementById('receipt-student-name').textContent = studentName;
        document.getElementById('receipt-file').value = '';
        document.getElementById('receipt-upload-message').classList.add('d-none');
        new bootstrap.Modal(document.getElementById('uploadReceiptModal')).show();
      });
    });

    // Attach event listeners to schedule meeting buttons
    document.querySelectorAll('.schedule-meeting-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const studentId = e.currentTarget.getAttribute('data-id');
        const studentName = e.currentTarget.getAttribute('data-name');
        document.getElementById('meeting-student-id').value = studentId;
        document.getElementById('meeting-student-name').textContent = studentName;
        document.getElementById('meeting-link-input').value = '';
        document.getElementById('meeting-time-input').value = '';
        document.getElementById('meeting-notes-input').value = '';
        document.getElementById('meeting-message').classList.add('d-none');
        new bootstrap.Modal(document.getElementById('scheduleMeetingModal')).show();
      });
    });

  } else {
    studentsTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-5 text-muted">
          <i class="bi bi-people" style="font-size: 2.5rem;"></i>
          <p class="mt-3">No students registered yet.</p>
        </td>
      </tr>
    `;
  }
}

// Simple toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'position-fixed bottom-0 end-0 m-4 p-3 glass-card border border-info border-opacity-30 text-light animate-fade-in';
  toast.style.zIndex = '9999';
  toast.style.maxWidth = '350px';
  toast.innerHTML = `<i class="bi bi-check-circle-fill text-info me-2"></i>${message}`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.5s ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

// XSS Protection Helper
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
