import { useState } from 'react';
import { PiCaretDownBold, PiPaperPlaneRightBold, PiBookOpenBold, PiUsersBold, PiPackageBold, PiShoppingBagBold, PiChartBarBold, PiCheckCircleBold } from 'react-icons/pi';
import MainLayout from '../layouts/MainLayout';
import { useToast } from '../hooks/useToast';
import './Soporte.scss';

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
    icon: <PiShoppingBagBold size={24} />,
    title: 'Gestión de Pedidos',
    description: 'Aprende a crear, editar y dar seguimiento a tus pedidos de forma eficiente.'
  },
  {
    icon: <PiUsersBold size={24} />,
    title: 'Administrar Clientes',
    description: 'Organiza tu base de clientes con información de contacto y direcciones.'
  },
  {
    icon: <PiPackageBold size={24} />,
    title: 'Catálogo de Productos',
    description: 'Configura tu catálogo de productos con claves, precios y descripciones.'
  },
  {
    icon: <PiChartBarBold size={24} />,
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
                    <PiCheckCircleBold size={18} />
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
                    <PiCaretDownBold size={20} />
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
              <PiBookOpenBold size={24} />
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
                    <PiPaperPlaneRightBold size={18} />
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
