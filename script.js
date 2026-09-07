document.addEventListener('DOMContentLoaded', () => {

  // =====================================================
  // 1. REGISTRO Y PERFIL DE USUARIO
  // =====================================================
  const btnRegister = document.getElementById('btnRegister');
  const userProfile = document.getElementById('userProfile');

  btnRegister.addEventListener('click', () => {
    btnRegister.classList.add('hidden');
    userProfile.classList.remove('hidden');
  });

  // =====================================================
  // 2. CARRUSEL EN EL HERO
  // =====================================================
  const track = document.getElementById('carouselTrack');
  let currentSlide = 0;
  const totalSlides = 3;

  setInterval(() => {
    currentSlide = (currentSlide + 1) % totalSlides;
    if (track) {
      track.style.transform = `translateX(-${currentSlide * 33.333}%)`;
    }
  }, 4000);

  // =====================================================
  // 3. CARGA DINÁMICA DE PROGRAMAS Y DESPLEGABLES
  // =====================================================
  const tecnicasData = [
    { title: "Técnico en Sistemas", desc: "Mantenimiento de equipos y redes de cómputo.", url: "https://oferta.senasofiaplus.edu.co/" },
    { title: "Técnico en Programación de Software", desc: "Lógica de programación y bases de datos.", url: "https://oferta.senasofiaplus.edu.co/" },
    { title: "Técnico en Contabilización", desc: "Operaciones comerciales y financieras.", url: "https://oferta.senasofiaplus.edu.co/" }
  ];

  const tecnologiasData = [
    { title: "Análisis y Desarrollo de Software (ADSO)", desc: "Construcción completa de soluciones web y móviles.", url: "https://oferta.senasofiaplus.edu.co/" },
    { title: "Gestión Empresarial", desc: "Administración y coordinación de proyectos corporativos.", url: "https://oferta.senasofiaplus.edu.co/" },
    { title: "Diseño y Desarrollo de Redes", desc: "Infraestructura, redes y ciberseguridad.", url: "https://oferta.senasofiaplus.edu.co/" }
  ];

  function renderPrograms(data, targetContainerId) {
    const container = document.getElementById(targetContainerId);
    if (!container) return;
    
    container.innerHTML = data.map(item => `
      <div class="program-card">
        <h4>${item.title}</h4>
        <p>${item.desc}</p>
        <a href="${item.url}" target="_blank" rel="noopener noreferrer">Inscribirme →</a>
      </div>
    `).join('');
  }

  renderPrograms(tecnicasData, 'tecnicasBody');
  renderPrograms(tecnologiasData, 'tecnologiasBody');

  // Control de desplegables (Acordeón)
  const categoryHeaders = document.querySelectorAll('.category-header');
  categoryHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const isExpanded = header.getAttribute('aria-expanded') === 'true';
      header.setAttribute('aria-expanded', !isExpanded);
      header.classList.toggle('active');
      
      const body = header.nextElementSibling;
      if (body) {
        body.classList.toggle('active');
      }
    });
  });

  // =====================================================
  // 4. QUIZ INTERACTIVO
  // =====================================================
  const slides = document.querySelectorAll('#quizSlider .quiz-slide');
  const progressFill = document.getElementById('progressFill');
  const stepIndicators = document.querySelectorAll('.progress-step');
  let currentStep = 0;

  function updateQuizUI() {
    slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === currentStep);
    });

    stepIndicators.forEach((indicator, idx) => {
      indicator.classList.toggle('active', idx <= currentStep);
    });

    if (progressFill) {
      const percentage = ((currentStep + 1) / 3) * 100;
      progressFill.style.width = `${percentage}%`;
    }
  }

  document.querySelectorAll('.quiz-next').forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentStep < slides.length - 1) {
        currentStep++;
        updateQuizUI();
      }
    });
  });

  document.querySelectorAll('.quiz-back').forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentStep > 0) {
        currentStep--;
        updateQuizUI();
      }
    });
  });

  const recommendButton = document.getElementById('recommendButton');
  const recommendationBox = document.getElementById('recommendation');

  if (recommendButton) {
    recommendButton.addEventListener('click', () => {
      const interest = document.querySelector('input[name="interest"]:checked')?.value;
      const level = document.querySelector('input[name="level"]:checked')?.value;

      let resultText = "Programa recomendado: ";
      if (interest === "technology" && level === "technology") {
        resultText += "Tecnología en Análisis y Desarrollo de Software (ADSO)";
      } else if (interest === "technology" && level === "technical") {
        resultText += "Técnico en Programación de Software";
      } else if (interest === "business") {
        resultText += "Tecnología en Gestión Empresarial";
      } else {
        resultText += "Técnico en Integración de Operaciones Logísticas";
      }

      recommendationBox.textContent = resultText;
      currentStep = 3; // Ir a la pantalla de resultados
      updateQuizUI();
    });
  }

  const restartQuiz = document.getElementById('restartQuiz');
  if (restartQuiz) {
    restartQuiz.addEventListener('click', () => {
      currentStep = 0;
      updateQuizUI();
    });
  }

  // =====================================================
  // 5. CHATBOT FLOTANTE
  // =====================================================
  const chatButton = document.getElementById('chatButton');
  const chatBox = document.getElementById('chatBox');
  const closeChat = document.getElementById('closeChat');
  const btnChatearAhora = document.getElementById('btnChatearAhora');
  const chatInput = document.getElementById('chatInput');
  const sendMessage = document.getElementById('sendMessage');
  const chatMessages = document.getElementById('chatMessages');

  function openChat() {
    chatBox.classList.remove('hidden');
  }

  function closeChatBox() {
    chatBox.classList.add('hidden');
  }

  chatButton.addEventListener('click', () => {
    chatBox.classList.contains('hidden') ? openChat() : closeChatBox();
  });

  closeChat.addEventListener('click', closeChatBox);
  if (btnChatearAhora) {
    btnChatearAhora.addEventListener('click', openChat);
  }

  function handleUserSendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Agregar mensaje del usuario
    const userMsg = document.createElement('div');
    userMsg.className = 'user-message';
    userMsg.textContent = text;
    chatMessages.appendChild(userMsg);

    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Respuesta del Bot
    setTimeout(() => {
      const botMsg = document.createElement('div');
      botMsg.className = 'bot-message';
      botMsg.textContent = "Gracias por tu mensaje. Para obtener detalles sobre inscripciones o cursos, consulta la sección de Oferta Educativa o visita Sofia Plus.";
      chatMessages.appendChild(botMsg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 800);
  }

  sendMessage.addEventListener('click', handleUserSendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserSendMessage();
  });
});













// =====================================================
  // 5. CHATBOT FLOTANTE Y ARRASTRABLE (DRAGGABLE)
  // =====================================================
  const chatButton = document.getElementById('chatButton');
  const chatBox = document.getElementById('chatBox');
  const closeChat = document.getElementById('closeChat');
  const btnChatearAhora = document.getElementById('btnChatearAhora');
  const chatInput = document.getElementById('chatInput');
  const sendMessage = document.getElementById('sendMessage');
  const chatMessages = document.getElementById('chatMessages');
  const chatHeader = document.getElementById('chatHeader');


  chatButton.addEventListener('click', () => {
    chatBox.classList.remove('hidden');
});

closeChat.addEventListener('click', () => {
    chatBox.classList.add('hidden');
});


  function openChat() {
    chatBox.classList.remove('hidden');
  }

  function closeChatBox() {
    chatBox.classList.add('hidden');
  }

  chatButton.addEventListener('click', () => {
    chatBox.classList.contains('hidden') ? openChat() : closeChatBox();
  });

  closeChat.addEventListener('click', closeChatBox);
  if (btnChatearAhora) {
    btnChatearAhora.addEventListener('click', openChat);
  }

  function handleUserSendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    const userMsg = document.createElement('div');
    userMsg.className = 'user-message';
    userMsg.textContent = text;
    chatMessages.appendChild(userMsg);

    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(() => {
      const botMsg = document.createElement('div');
      botMsg.className = 'bot-message';
      botMsg.textContent = "Gracias por tu mensaje. Para obtener detalles sobre inscripciones o cursos, consulta la sección de Oferta Educativa o visita Sofia Plus.";
      chatMessages.appendChild(botMsg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 800);
  }

  sendMessage.addEventListener('click', handleUserSendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserSendMessage();
  });

  // LÓGICA PARA ARRASTRAR EL CHATBOT (DRAG & DROP)
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  if (chatHeader && chatBox) {
    chatHeader.addEventListener('mousedown', (e) => {
      // Evitar que el clic de cerrar el chat active el arrastre
      if (e.target === closeChat) return;

      isDragging = true;
      const rect = chatBox.getBoundingClientRect();
      
      // Calcular la posición relativa del ratón dentro de la ventana del chat
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;

      // Cambiar posicionamiento a la coordenada fija exacta al iniciar arrastre
      chatBox.style.bottom = 'auto';
      chatBox.style.right = 'auto';
      chatBox.style.left = `${rect.left}px`;
      chatBox.style.top = `${rect.top}px`;

      document.body.style.userSelect = 'none'; // Evitar selección global de texto al arrastrar
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      let newLeft = e.clientX - offsetX;
      let newTop = e.clientY - offsetY;

      // Delimitar dentro de los bordes de la ventana
      const maxLeft = window.innerWidth - chatBox.offsetWidth;
      const maxTop = window.innerHeight - chatBox.offsetHeight;

      newLeft = Math.max(0, Math.min(newLeft, maxLeft));
      newTop = Math.max(0, Math.min(newTop, maxTop));

      chatBox.style.left = `${newLeft}px`;
      chatBox.style.top = `${newTop}px`;
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.userSelect = ''; // Restaurar la selección normal de texto
      }
    });
  }


  









  




// Manejo de tema claro/oscuro
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
  }

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}

















// =====================================================
// FILTRADO EN TIEMPO REAL DE PROGRAMAS
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const modalityFilter = document.getElementById('modalityFilter');
  const shiftFilter = document.getElementById('shiftFilter');
  const programCards = document.querySelectorAll('.program-card');

  if (!searchInput || !programCards.length) return;

  function filterPrograms() {
    const query = searchInput.value.toLowerCase().trim();
    const selectedModality = modalityFilter.value.toLowerCase();
    const selectedShift = shiftFilter.value.toLowerCase();

    programCards.forEach(card => {
      const text = card.textContent.toLowerCase();
      const cardModality = (card.dataset.modality || '').toLowerCase();
      const cardShift = (card.dataset.shift || '').toLowerCase();

      const matchesSearch = text.includes(query);
      const matchesModality = !selectedModality || cardModality === selectedModality;
      const matchesShift = !selectedShift || cardShift === selectedShift;

      if (matchesSearch && matchesModality && matchesShift) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  }

  searchInput.addEventListener('input', filterPrograms);
  modalityFilter.addEventListener('change', filterPrograms);
  shiftFilter.addEventListener('change', filterPrograms);
});