import './Legal.scss';

const Privacidad = () => {
  return (
    <div className="legal-page">
      <div className="legal-page__container">
        <div className="legal-page__header">
          <img src="/logo-orderly.svg" alt="Orderly" className="legal-page__logo" />
        </div>

        <div className="legal-page__card">
          <h1 className="legal-page__title">Aviso de Privacidad</h1>
          <p className="legal-page__date">Última actualización: 22 de marzo de 2026</p>

          <section className="legal-page__section">
            <h2>1. Responsable del tratamiento</h2>
            <p>
              <strong>Al García</strong>, operador de Orderly, es el responsable del tratamiento
              de los datos personales que nos proporcionas. Para cualquier solicitud relacionada
              con tus datos, contáctanos en{' '}
              <a href="mailto:orderly.vault@gmail.com">orderly.vault@gmail.com</a>.
            </p>
            <p>
              Este aviso cumple con las legislaciones de protección de datos aplicables
              internacionalmente, incluyendo:
            </p>
            <ul>
              <li>
                <strong>México:</strong> Ley Federal de Protección de Datos Personales en Posesión
                de los Particulares (LFPDPPP).
              </li>
              <li>
                <strong>Unión Europea / EEE:</strong> Reglamento General de Protección de Datos
                (RGPD / GDPR).
              </li>
              <li>
                <strong>California, EE.UU.:</strong> California Consumer Privacy Act (CCPA).
              </li>
              <li>
                <strong>Brasil:</strong> Lei Geral de Proteção de Dados (LGPD).
              </li>
            </ul>
          </section>

          <section className="legal-page__section">
            <h2>2. Datos personales que recopilamos</h2>
            <p>Al registrarte y utilizar el Servicio, podemos recopilar los siguientes datos:</p>
            <ul>
              <li>Nombre y apellido</li>
              <li>Correo electrónico</li>
              <li>Número de teléfono</li>
              <li>Fecha de nacimiento</li>
              <li>Nombre del negocio</li>
              <li>Datos de clientes, productos y pedidos que registres en la plataforma</li>
              <li>Datos de uso del Servicio (accesos, funciones utilizadas)</li>
            </ul>
            <p>No recopilamos datos sensibles como información financiera, de salud o biométrica.</p>
          </section>

          <section className="legal-page__section">
            <h2>3. Base legal del tratamiento</h2>
            <p>Tratamos tus datos bajo las siguientes bases legales según tu región:</p>
            <ul>
              <li>
                <strong>Consentimiento:</strong> otorgado al aceptar este aviso al registrarte
                (aplica globalmente).
              </li>
              <li>
                <strong>Ejecución de contrato:</strong> necesario para prestarte el Servicio (GDPR
                Art. 6.1.b / LGPD Art. 7.V).
              </li>
              <li>
                <strong>Interés legítimo:</strong> mejora del Servicio y seguridad de la plataforma
                (GDPR Art. 6.1.f).
              </li>
              <li>
                <strong>Obligación legal:</strong> cuando la ley nos exija conservar o reportar
                datos.
              </li>
            </ul>
          </section>

          <section className="legal-page__section">
            <h2>4. Finalidad del tratamiento</h2>
            <p>Tus datos personales son utilizados para:</p>
            <ul>
              <li>Crear y gestionar tu cuenta en Orderly.</li>
              <li>Brindarte acceso al Servicio y sus funcionalidades.</li>
              <li>Enviarte notificaciones relacionadas con el Servicio.</li>
              <li>Atender solicitudes de soporte.</li>
              <li>Mejorar la plataforma mediante análisis de uso (sin identificar al usuario).</li>
            </ul>
            <p>
              No utilizamos tus datos para fines publicitarios ni los vendemos a terceros bajo
              ninguna circunstancia.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>5. Transferencia y almacenamiento de datos</h2>
            <p>
              Tus datos son almacenados en los servidores de <strong>Google Firebase</strong> (Google
              LLC), los cuales cuentan con certificaciones de seguridad internacionales (ISO 27001,
              SOC 2) y cumplen con el GDPR mediante cláusulas contractuales estándar (SCCs).
            </p>
            <p>
              Al usar el Servicio, reconoces que tus datos pueden ser procesados en servidores
              ubicados fuera de tu país de residencia. En todos los casos, Google Firebase aplica
              las garantías de transferencia internacional exigidas por la legislación aplicable,
              incluyendo SCCs para usuarios de la Unión Europea.
            </p>
            <p>
              No transferimos tus datos a otros terceros, salvo obligación legal o con tu
              consentimiento explícito.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>6. Tus derechos</h2>
            <p>Según tu región, tienes los siguientes derechos sobre tus datos:</p>

            <p><strong>Todos los usuarios (global):</strong></p>
            <ul>
              <li>Acceder a tus datos personales.</li>
              <li>Rectificar datos inexactos o incompletos.</li>
              <li>Solicitar la eliminación de tus datos.</li>
              <li>Oponerte al tratamiento de tus datos.</li>
            </ul>

            <p><strong>Unión Europea / EEE (GDPR):</strong></p>
            <ul>
              <li>Portabilidad de datos (recibir tus datos en formato estructurado).</li>
              <li>Derecho al olvido (supresión completa).</li>
              <li>Limitar el tratamiento en determinadas circunstancias.</li>
              <li>Presentar una reclamación ante la autoridad de control de tu país.</li>
              <li>Respuesta en un plazo máximo de <strong>30 días calendario</strong>.</li>
            </ul>

            <p><strong>México (LFPDPPP) — Derechos ARCO:</strong></p>
            <ul>
              <li>Acceso, Rectificación, Cancelación y Oposición al tratamiento.</li>
              <li>Respuesta en un plazo máximo de <strong>20 días hábiles</strong>.</li>
            </ul>

            <p><strong>California, EE.UU. (CCPA):</strong></p>
            <ul>
              <li>Conocer qué datos recopilamos y con qué fin.</li>
              <li>Solicitar la eliminación de tus datos.</li>
              <li>No discriminación por ejercer tus derechos.</li>
              <li>
                Derecho a no vender tus datos personales — <strong>Orderly no vende datos.</strong>
              </li>
            </ul>

            <p><strong>Brasil (LGPD):</strong></p>
            <ul>
              <li>Confirmación de tratamiento, acceso, corrección y portabilidad.</li>
              <li>Eliminación de datos tratados con consentimiento.</li>
              <li>Revocación del consentimiento en cualquier momento.</li>
            </ul>

            <p>
              Para ejercer cualquiera de estos derechos, contáctanos en{' '}
              <a href="mailto:orderly.vault@gmail.com">orderly.vault@gmail.com</a> o a través
              de la sección de Soporte dentro de la plataforma.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>7. Seguridad</h2>
            <p>
              Implementamos medidas técnicas y organizativas para proteger tus datos contra acceso
              no autorizado, pérdida o alteración, incluyendo cifrado en tránsito (HTTPS) y en
              reposo. Sin embargo, ningún sistema es completamente infalible.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>8. Retención de datos</h2>
            <p>
              Conservamos tus datos mientras tu cuenta esté activa o sea necesario para prestarte
              el Servicio. Al solicitar la eliminación de tu cuenta, tus datos serán eliminados en
              un plazo máximo de <strong>30 días</strong>, salvo obligación legal de conservarlos.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>9. Cookies y tecnologías similares</h2>
            <p>
              Orderly utiliza tokens de sesión necesarios para la autenticación y funcionamiento del
              Servicio. No utilizamos cookies de rastreo, publicidad o análisis de comportamiento
              de terceros.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>10. Menores de edad</h2>
            <p>
              El Servicio no está dirigido a menores de 18 años. No recopilamos intencionalmente
              datos de menores. Si detectamos que un menor se ha registrado, eliminaremos su cuenta
              y datos de forma inmediata.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>11. Cambios al aviso</h2>
            <p>
              Podemos actualizar este Aviso de Privacidad en cualquier momento. Los cambios
              sustanciales serán notificados dentro de la plataforma con al menos 30 días de
              anticipación. Te recomendamos revisarlo periódicamente.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>12. Contacto</h2>
            <p>
              Para cualquier duda, ejercicio de derechos o reclamación relacionada con tus datos
              personales, contáctanos en{' '}
              <a href="mailto:orderly.vault@gmail.com">orderly.vault@gmail.com</a> o a través
              de la sección de Soporte dentro de la plataforma.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacidad;
