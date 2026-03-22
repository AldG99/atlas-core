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
          <p className="legal-page__date">Última actualización: 22 de marzo de 2026</p>

          <section className="legal-page__section">
            <h2>1. Responsable del Servicio</h2>
            <p>
              Orderly es operado por <strong>Al García</strong>, en adelante "el Responsable".
              Para cualquier consulta relacionada con estos Términos, puedes contactarnos en{' '}
              <a href="mailto:orderly.vault@gmail.com">orderly.vault@gmail.com</a> o a través
              de la sección de Soporte dentro de la plataforma.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>2. Aceptación de los términos</h2>
            <p>
              Al registrarte y utilizar Orderly ("el Servicio"), aceptas quedar sujeto a estos
              Términos de Uso. Si no estás de acuerdo con alguno de ellos, no debes utilizar el
              Servicio. Estos términos aplican a usuarios de cualquier país.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>3. Descripción del Servicio</h2>
            <p>
              Orderly es una plataforma de gestión de pedidos, clientes y productos diseñada para
              pequeños y medianos negocios. El Servicio se encuentra actualmente en{' '}
              <strong>versión Beta</strong>, por lo que algunas funciones pueden cambiar,
              actualizarse o eliminarse sin previo aviso.
            </p>
            <p>
              El Servicio se proporciona <strong>"tal como está"</strong> y <strong>"según
              disponibilidad"</strong>, sin garantías de ningún tipo, ya sean expresas o implícitas,
              incluyendo pero no limitándose a garantías de comerciabilidad, idoneidad para un
              propósito particular o ausencia de interrupciones.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>4. Cuenta de usuario</h2>
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
            <h2>5. Uso aceptable</h2>
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
            <h2>6. Indemnización</h2>
            <p>
              Aceptas indemnizar y mantener indemne al Responsable, sus colaboradores y proveedores
              frente a cualquier reclamación, daño, pérdida o gasto (incluyendo honorarios legales
              razonables) derivados de: (a) tu uso del Servicio en violación de estos Términos,
              (b) tu incumplimiento de cualquier ley aplicable, o (c) cualquier contenido que
              introduzcas en la plataforma.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>7. Suspensión y cancelación de cuenta</h2>
            <p>
              El Responsable se reserva el derecho de suspender o cancelar tu cuenta sin previo
              aviso en caso de:
            </p>
            <ul>
              <li>Incumplimiento de estos Términos.</li>
              <li>Uso fraudulento o actividad ilegal.</li>
              <li>Comportamiento que ponga en riesgo la plataforma o a otros usuarios.</li>
            </ul>
            <p>
              Tú también puedes cancelar tu cuenta en cualquier momento desde la sección de
              Configuración dentro de la plataforma. Tras la cancelación, tus datos serán
              eliminados conforme a lo establecido en el Aviso de Privacidad.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>8. Pagos y política de reembolsos</h2>
            <p>
              Orderly ofrece planes de pago disponibles durante la <strong>versión Beta</strong>.
              Al suscribirte a un plan de pago, aceptas las siguientes condiciones:
            </p>
            <ul>
              <li>
                <strong>No hay reembolsos.</strong> Todos los pagos realizados son finales y no
                reembolsables, salvo que la ley aplicable en tu país lo exija expresamente.
              </li>
              <li>
                Dado que el Servicio se encuentra en versión Beta, los planes, precios y
                funcionalidades incluidas pueden cambiar. Cualquier cambio relevante será
                notificado dentro de la plataforma con al menos <strong>15 días de anticipación</strong>.
              </li>
              <li>
                La cancelación de tu suscripción tendrá efecto al término del período de
                facturación vigente. No se realizarán cargos adicionales tras la cancelación.
              </li>
              <li>
                En caso de disputa relacionada con un cobro, contáctanos en{' '}
                <a href="mailto:orderly.vault@gmail.com">orderly.vault@gmail.com</a> dentro de los
                30 días siguientes al cargo.
              </li>
            </ul>
          </section>

          <section className="legal-page__section">
            <h2>9. Propiedad intelectual</h2>
            <p>
              Todos los derechos sobre el Servicio, incluyendo su diseño, código y contenido, son
              propiedad exclusiva del Responsable. No se concede ninguna licencia de uso más allá
              del acceso personal al Servicio.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>10. Disponibilidad del Servicio</h2>
            <p>
              Dado que el Servicio se encuentra en versión Beta, no garantizamos disponibilidad
              continua. Podemos suspender o modificar el Servicio en cualquier momento para
              mantenimiento, mejoras o por razones técnicas.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>11. Limitación de responsabilidad</h2>
            <p>
              En la medida máxima permitida por la legislación aplicable, el Responsable no será
              responsable por pérdida de datos, interrupciones del servicio, lucro cesante o daños
              directos, indirectos, incidentales o consecuentes derivados del uso o imposibilidad
              de uso del Servicio.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>12. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos Términos en cualquier momento. Las
              modificaciones sustanciales serán notificadas dentro de la plataforma con al menos
              30 días de anticipación. El uso continuo del Servicio tras los cambios implica
              su aceptación.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>13. Legislación aplicable y resolución de conflictos</h2>
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
            <h2>14. Contacto</h2>
            <p>
              Si tienes dudas sobre estos Términos, puedes contactarnos en{' '}
              <a href="mailto:orderly.vault@gmail.com">orderly.vault@gmail.com</a> o a través
              de la sección de Soporte dentro de la plataforma.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terminos;
