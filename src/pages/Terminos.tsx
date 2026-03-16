import './Legal.scss';

const Terminos = () => {
  return (
    <div className="legal-page">
      <div className="legal-page__container">
        <div className="legal-page__header">
          <img src="/logo-orderly.svg" alt="Orderly" className="legal-page__logo" />
        </div>

        <div className="legal-page__card">
          <h1 className="legal-page__title">Términos de Uso</h1>
          <p className="legal-page__date">Última actualización: 15 de marzo de 2026</p>

          <section className="legal-page__section">
            <h2>1. Aceptación de los términos</h2>
            <p>
              Al registrarte y utilizar Orderly ("el Servicio"), aceptas quedar sujeto a estos
              Términos de Uso. Si no estás de acuerdo con alguno de ellos, no debes utilizar el
              Servicio. Estos términos aplican a usuarios de cualquier país.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>2. Descripción del Servicio</h2>
            <p>
              Orderly es una plataforma de gestión de pedidos, clientes y productos diseñada para
              pequeños y medianos negocios. El Servicio se encuentra actualmente en{' '}
              <strong>versión Beta</strong>, por lo que algunas funciones pueden cambiar,
              actualizarse o eliminarse sin previo aviso.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>3. Cuenta de usuario</h2>
            <p>
              Eres responsable de mantener la confidencialidad de tu contraseña y de todas las
              actividades que ocurran bajo tu cuenta. Debes notificarnos de inmediato ante cualquier
              uso no autorizado.
            </p>
            <p>
              Al registrarte, garantizas que la información proporcionada es veraz, completa y
              actualizada. Debes tener al menos 18 años para crear una cuenta.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>4. Uso aceptable</h2>
            <p>Te comprometes a no utilizar el Servicio para:</p>
            <ul>
              <li>Actividades ilegales o fraudulentas.</li>
              <li>Almacenar o compartir información de terceros sin su consentimiento.</li>
              <li>Intentar acceder a cuentas de otros usuarios.</li>
              <li>Realizar acciones que puedan dañar, deshabilitar o sobrecargar la plataforma.</li>
              <li>Violar leyes locales, nacionales o internacionales aplicables.</li>
            </ul>
          </section>

          <section className="legal-page__section">
            <h2>5. Propiedad intelectual</h2>
            <p>
              Todos los derechos sobre el Servicio, incluyendo su diseño, código y contenido, son
              propiedad exclusiva de Orderly. No se concede ninguna licencia de uso más allá del
              acceso personal al Servicio.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>6. Disponibilidad del Servicio</h2>
            <p>
              Dado que el Servicio se encuentra en versión Beta, no garantizamos disponibilidad
              continua. Podemos suspender o modificar el Servicio en cualquier momento para
              mantenimiento, mejoras o por razones técnicas.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>7. Limitación de responsabilidad</h2>
            <p>
              Orderly no será responsable por pérdida de datos, interrupciones del servicio o daños
              directos o indirectos derivados del uso o imposibilidad de uso del Servicio, en la
              medida máxima permitida por la legislación aplicable en el país del usuario.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>8. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos Términos en cualquier momento. Las
              modificaciones serán notificadas dentro de la plataforma con al menos 30 días de
              anticipación cuando sean cambios sustanciales. El uso continuo del Servicio tras los
              cambios implica su aceptación.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>9. Legislación aplicable y resolución de conflictos</h2>
            <p>
              Estos Términos se rigen por las leyes aplicables según la residencia del usuario:
            </p>
            <ul>
              <li>
                <strong>México:</strong> Leyes de los Estados Unidos Mexicanos y jurisdicción de
                tribunales mexicanos.
              </li>
              <li>
                <strong>Unión Europea:</strong> Legislación del país miembro correspondiente y
                normativa de la UE aplicable, incluyendo el RGPD.
              </li>
              <li>
                <strong>Estados Unidos:</strong> Leyes del estado de residencia del usuario,
                incluyendo la CCPA para residentes de California.
              </li>
              <li>
                <strong>Brasil:</strong> Lei Geral de Proteção de Dados (LGPD) y legislación
                brasileña aplicable.
              </li>
              <li>
                <strong>Otros países:</strong> Leyes locales aplicables en materia de comercio
                electrónico y protección de datos.
              </li>
            </ul>
            <p>
              En caso de conflicto, las partes procurarán resolverlo de forma amistosa. De no ser
              posible, se someterá a arbitraje o a los tribunales competentes según la jurisdicción
              aplicable.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>10. Contacto</h2>
            <p>
              Si tienes dudas sobre estos Términos, puedes contactarnos a través de la sección de
              Soporte dentro de la plataforma.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terminos;
