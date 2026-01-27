import { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useToast } from '../hooks/useToast';
import './Soporte.scss';

// Icons
const IconChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const IconSend = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const IconBook = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
  </svg>
);

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const IconPackage = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

const IconShoppingBag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <path d="M16 10a4 4 0 0 1-8 0"></path>
  </svg>
);

const IconBarChart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"></line>
    <line x1="18" y1="20" x2="18" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="16"></line>
  </svg>
);

const IconCheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

// Data
const FAQ_DATA = [
  {
    question: '¿Cómo creo un nuevo pedido?',
    answer: 'Para crear un nuevo pedido, ve a la sección "Mis Pedidos" y haz clic en el botón "Nuevo pedido". Selecciona un cliente, agrega los productos deseados y confirma el pedido.'
  },
  {
    question: '¿Cómo agrego un nuevo cliente?',
    answer: 'En la sección "Clientes", haz clic en "Nuevo Cliente". Completa los datos del cliente incluyendo nombre, teléfono y dirección. El cliente quedará guardado para futuros pedidos.'
  },
  {
    question: '¿Cómo cambio el estado de un pedido?',
    answer: 'En la tabla de pedidos, haz clic sobre el badge de estado (Pendiente, En preparación, Entregado). Se abrirá un menú donde puedes seleccionar el nuevo estado.'
  },
  {
    question: '¿Puedo exportar mis datos?',
    answer: 'Sí, puedes exportar tus pedidos a CSV desde la sección "Mis Pedidos" usando el botón "Exportar CSV". También puedes sincronizar con Google Drive (próximamente).'
  },
  {
    question: '¿Cómo envío un pedido por WhatsApp?',
    answer: 'En la tabla de pedidos, cada fila tiene un botón de WhatsApp. Al hacer clic, se abrirá WhatsApp con un mensaje pre-formateado con los detalles del pedido.'
  },
  {
    question: '¿Cómo agrego productos al catálogo?',
    answer: 'Ve a la sección "Productos" y haz clic en "Nuevo Producto". Ingresa la clave, nombre, precio y descripción. Los productos estarán disponibles al crear pedidos.'
  }
];

const GUIDES_DATA = [
  {
    icon: <IconShoppingBag />,
    title: 'Gestión de Pedidos',
    description: 'Aprende a crear, editar y dar seguimiento a tus pedidos de forma eficiente.'
  },
  {
    icon: <IconUsers />,
    title: 'Administrar Clientes',
    description: 'Organiza tu base de clientes con información de contacto y direcciones.'
  },
  {
    icon: <IconPackage />,
    title: 'Catálogo de Productos',
    description: 'Configura tu catálogo de productos con claves, precios y descripciones.'
  },
  {
    icon: <IconBarChart />,
    title: 'Reportes y Estadísticas',
    description: 'Visualiza métricas de ventas, productos más vendidos y tendencias.'
  }
];

const SYSTEM_STATUS = [
  { name: 'Aplicación', status: 'operational' },
  { name: 'Base de datos', status: 'operational' },
  { name: 'Autenticación', status: 'operational' },
  { name: 'Sincronización', status: 'operational' }
];

const Soporte = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    asunto: '',
    mensaje: ''
  });
  const [sending, setSending] = useState(false);
  const { showToast } = useToast();

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.asunto.trim() || !formData.mensaje.trim()) {
      showToast('Completa todos los campos', 'warning');
      return;
    }

    setSending(true);

    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 1000));

    showToast('Mensaje enviado correctamente', 'success');
    setFormData({ asunto: '', mensaje: '' });
    setSending(false);
  };

  return (
    <MainLayout>
      <div className="soporte">
        <div className="soporte__header">
          <h1>Centro de Soporte</h1>
          <p>Encuentra respuestas, guías y ayuda para usar Atlas Core</p>
        </div>

        {/* Estado del Sistema */}
        <section className="soporte__section">
          <h2 className="soporte__section-title">Estado del Sistema</h2>
          <div className="soporte__status-card">
            <div className="soporte__status-header">
              <span className="soporte__status-indicator soporte__status-indicator--operational"></span>
              <span>Todos los sistemas operativos</span>
            </div>
            <div className="soporte__status-list">
              {SYSTEM_STATUS.map((service, index) => (
                <div key={index} className="soporte__status-item">
                  <span>{service.name}</span>
                  <span className="soporte__status-badge soporte__status-badge--operational">
                    <IconCheckCircle />
                    Operativo
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Guías */}
        <section className="soporte__section">
          <h2 className="soporte__section-title">Guías Rápidas</h2>
          <div className="soporte__guides">
            {GUIDES_DATA.map((guide, index) => (
              <div key={index} className="soporte__guide-card">
                <div className="soporte__guide-icon">{guide.icon}</div>
                <h3>{guide.title}</h3>
                <p>{guide.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="soporte__section">
          <h2 className="soporte__section-title">Preguntas Frecuentes</h2>
          <div className="soporte__faq">
            {FAQ_DATA.map((item, index) => (
              <div
                key={index}
                className={`soporte__faq-item ${openFAQ === index ? 'soporte__faq-item--open' : ''}`}
              >
                <button
                  className="soporte__faq-question"
                  onClick={() => toggleFAQ(index)}
                >
                  <span>{item.question}</span>
                  <span className="soporte__faq-icon">
                    <IconChevronDown />
                  </span>
                </button>
                <div className="soporte__faq-answer">
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Formulario de Contacto */}
        <section className="soporte__section">
          <h2 className="soporte__section-title">Contactar Soporte</h2>
          <div className="soporte__contact-card">
            <div className="soporte__contact-info">
              <IconBook />
              <div>
                <h3>¿Necesitas más ayuda?</h3>
                <p>Envíanos un mensaje y te responderemos lo antes posible.</p>
              </div>
            </div>
            <form className="soporte__form" onSubmit={handleSubmit}>
              <div className="soporte__form-group">
                <label htmlFor="asunto">Asunto</label>
                <input
                  type="text"
                  id="asunto"
                  className="input"
                  placeholder="¿En qué podemos ayudarte?"
                  value={formData.asunto}
                  onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                />
              </div>
              <div className="soporte__form-group">
                <label htmlFor="mensaje">Mensaje</label>
                <textarea
                  id="mensaje"
                  className="input"
                  placeholder="Describe tu problema o pregunta..."
                  rows={4}
                  value={formData.mensaje}
                  onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={sending}
              >
                {sending ? 'Enviando...' : (
                  <>
                    <IconSend />
                    Enviar mensaje
                  </>
                )}
              </button>
            </form>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default Soporte;
