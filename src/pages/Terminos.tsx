import { useTranslation } from 'react-i18next';
import './Legal.scss';

function ContentES() {
  return (
    <>
      <h1 className="legal-page__title">Términos de Uso</h1>
      <p className="legal-page__date">Última actualización: 2 de mayo de 2026</p>

      <section className="legal-page__section">
        <h2>1. Responsable del Servicio</h2>
        <p>
          Skytla es operado por <strong>Al García</strong>, en adelante "el Responsable".
          Para cualquier consulta relacionada con estos Términos, puedes contactarnos en{' '}
          <a href="mailto:skytla.vault@gmail.com">skytla.vault@gmail.com</a> o a través
          de la sección de Soporte dentro de la plataforma.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>2. Aceptación de los términos</h2>
        <p>
          Al registrarte y utilizar Skytla ("el Servicio"), aceptas quedar sujeto a estos
          Términos de Uso. Si no estás de acuerdo con alguno de ellos, no debes utilizar el
          Servicio. Estos términos aplican a usuarios de cualquier país.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>3. Descripción del Servicio</h2>
        <p>
          Skytla es una plataforma de gestión de pedidos, clientes y productos diseñada para
          pequeños y medianos negocios. El Servicio se encuentra actualmente en{' '}
          <strong>versión Beta</strong>, por lo que algunas funciones pueden cambiar,
          actualizarse o eliminarse sin previo aviso.
        </p>
        <p>
          El Servicio se proporciona <strong>"tal como está"</strong> y{' '}
          <strong>"según disponibilidad"</strong>, sin garantías de ningún tipo, ya sean
          expresas o implícitas, incluyendo pero no limitándose a garantías de
          comerciabilidad, idoneidad para un propósito particular o ausencia de interrupciones.
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
          Skytla ofrece planes de pago disponibles durante la <strong>versión Beta</strong>.
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
            notificado dentro de la plataforma con al menos{' '}
            <strong>15 días de anticipación</strong>.
          </li>
          <li>
            La cancelación de tu suscripción tendrá efecto al término del período de
            facturación vigente. No se realizarán cargos adicionales tras la cancelación.
          </li>
          <li>
            En caso de disputa relacionada con un cobro, contáctanos en{' '}
            <a href="mailto:skytla.vault@gmail.com">skytla.vault@gmail.com</a> dentro de los
            30 días siguientes al cargo.
          </li>
          <li>
            <strong>Usuarios de la Unión Europea — Derecho de desistimiento:</strong> De
            conformidad con la Directiva 2011/83/UE sobre derechos de los consumidores, al
            contratar un plan de pago y solicitar que el Servicio comience a prestarse de
            inmediato, reconoces y aceptas expresamente que renuncias a tu derecho de
            desistimiento de 14 días. Esta renuncia es necesaria para acceder al Servicio
            de forma inmediata una vez completado el pago.
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
        <p>Estos Términos se rigen por las leyes aplicables según la residencia del usuario:</p>
        <ul>
          <li><strong>México:</strong> Leyes de los Estados Unidos Mexicanos y jurisdicción de tribunales mexicanos.</li>
          <li><strong>Unión Europea:</strong> Legislación del país miembro correspondiente y normativa de la UE aplicable, incluyendo el RGPD.</li>
          <li><strong>Estados Unidos:</strong> Leyes del estado de residencia del usuario, incluyendo la CCPA para residentes de California.</li>
          <li><strong>Brasil:</strong> Lei Geral de Proteção de Dados (LGPD) y legislación brasileña aplicable.</li>
          <li><strong>Otros países:</strong> Leyes locales aplicables en materia de comercio electrónico y protección de datos.</li>
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
          <a href="mailto:skytla.vault@gmail.com">skytla.vault@gmail.com</a> o a través
          de la sección de Soporte dentro de la plataforma.
        </p>
      </section>
    </>
  );
}

function ContentEN() {
  return (
    <>
      <h1 className="legal-page__title">Terms of Use</h1>
      <p className="legal-page__date">Last updated: May 2, 2026</p>

      <section className="legal-page__section">
        <h2>1. Service Operator</h2>
        <p>
          Skytla is operated by <strong>Al García</strong>, hereinafter "the Operator."
          For any inquiries related to these Terms, you may contact us at{' '}
          <a href="mailto:skytla.vault@gmail.com">skytla.vault@gmail.com</a> or through
          the Support section within the platform.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>2. Acceptance of Terms</h2>
        <p>
          By registering and using Skytla ("the Service"), you agree to be bound by these
          Terms of Use. If you do not agree with any of them, you must not use the Service.
          These terms apply to users from any country.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>3. Description of the Service</h2>
        <p>
          Skytla is an order, customer, and product management platform designed for small
          and medium-sized businesses. The Service is currently in <strong>Beta version</strong>,
          which means some features may change, be updated, or removed without prior notice.
        </p>
        <p>
          The Service is provided <strong>"as is"</strong> and{' '}
          <strong>"as available"</strong>, without warranties of any kind, either express or
          implied, including but not limited to warranties of merchantability, fitness for a
          particular purpose, or uninterrupted availability.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>4. User Account</h2>
        <p>
          You are responsible for maintaining the confidentiality of your password and for all
          activities that occur under your account. You must notify us immediately of any
          unauthorized use.
        </p>
        <p>
          By registering, you warrant that the information provided is truthful, complete, and
          up to date. You must be at least 18 years old to create an account.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>5. Acceptable Use</h2>
        <p>You agree not to use the Service for:</p>
        <ul>
          <li>Illegal or fraudulent activities.</li>
          <li>Storing or sharing third-party information without their consent.</li>
          <li>Attempting to access other users' accounts.</li>
          <li>Actions that may damage, disable, or overload the platform.</li>
          <li>Violating applicable local, national, or international laws.</li>
        </ul>
      </section>

      <section className="legal-page__section">
        <h2>6. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless the Operator, its collaborators, and
          providers against any claim, damage, loss, or expense (including reasonable legal
          fees) arising from: (a) your use of the Service in violation of these Terms,
          (b) your breach of any applicable law, or (c) any content you introduce into
          the platform.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>7. Account Suspension and Cancellation</h2>
        <p>
          The Operator reserves the right to suspend or cancel your account without prior
          notice in the event of:
        </p>
        <ul>
          <li>Breach of these Terms.</li>
          <li>Fraudulent use or illegal activity.</li>
          <li>Behavior that endangers the platform or other users.</li>
        </ul>
        <p>
          You may also cancel your account at any time from the Settings section within
          the platform. After cancellation, your data will be deleted as set forth in
          the Privacy Notice.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>8. Payments and Refund Policy</h2>
        <p>
          Skytla offers paid plans available during the <strong>Beta version</strong>.
          By subscribing to a paid plan, you agree to the following conditions:
        </p>
        <ul>
          <li>
            <strong>No refunds.</strong> All payments made are final and non-refundable,
            unless applicable law in your country expressly requires otherwise.
          </li>
          <li>
            Since the Service is in Beta, plans, pricing, and included features may change.
            Any relevant changes will be notified within the platform with at least{' '}
            <strong>15 days' notice</strong>.
          </li>
          <li>
            Cancellation of your subscription will take effect at the end of the current
            billing period. No additional charges will be made after cancellation.
          </li>
          <li>
            In case of a dispute related to a charge, contact us at{' '}
            <a href="mailto:skytla.vault@gmail.com">skytla.vault@gmail.com</a> within
            30 days of the charge.
          </li>
          <li>
            <strong>EU users — Right of Withdrawal:</strong> In accordance with EU Directive
            2011/83/EU on consumer rights, by subscribing to a paid plan and requesting that
            the Service begin immediately, you expressly acknowledge and agree that you waive
            your 14-day right of withdrawal. This waiver is required to access the Service
            immediately upon payment completion.
          </li>
        </ul>
      </section>

      <section className="legal-page__section">
        <h2>9. Intellectual Property</h2>
        <p>
          All rights to the Service, including its design, code, and content, are the
          exclusive property of the Operator. No license beyond personal access to the
          Service is granted.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>10. Service Availability</h2>
        <p>
          Since the Service is in Beta, we do not guarantee continuous availability. We may
          suspend or modify the Service at any time for maintenance, improvements, or
          technical reasons.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>11. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by applicable law, the Operator shall not be
          liable for loss of data, service interruptions, loss of profits, or direct,
          indirect, incidental, or consequential damages arising from the use or inability
          to use the Service.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>12. Modifications</h2>
        <p>
          We reserve the right to modify these Terms at any time. Substantial changes will
          be notified within the platform with at least 30 days' notice. Continued use of
          the Service after changes implies acceptance.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>13. Governing Law and Dispute Resolution</h2>
        <p>These Terms are governed by the laws applicable to the user's residence:</p>
        <ul>
          <li><strong>Mexico:</strong> Laws of the United Mexican States and jurisdiction of Mexican courts.</li>
          <li><strong>European Union:</strong> Legislation of the corresponding member state and applicable EU regulations, including the GDPR.</li>
          <li><strong>United States:</strong> Laws of the user's state of residence, including the CCPA for California residents.</li>
          <li><strong>Brazil:</strong> Lei Geral de Proteção de Dados (LGPD) and applicable Brazilian legislation.</li>
          <li><strong>Other countries:</strong> Applicable local laws on e-commerce and data protection.</li>
        </ul>
        <p>
          In the event of a dispute, the parties will seek to resolve it amicably. If not
          possible, it will be submitted to arbitration or competent courts according to
          the applicable jurisdiction.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>14. Contact</h2>
        <p>
          If you have questions about these Terms, you may contact us at{' '}
          <a href="mailto:skytla.vault@gmail.com">skytla.vault@gmail.com</a> or through
          the Support section within the platform.
        </p>
      </section>
    </>
  );
}

function ContentPT() {
  return (
    <>
      <h1 className="legal-page__title">Termos de Uso</h1>
      <p className="legal-page__date">Última atualização: 2 de maio de 2026</p>

      <section className="legal-page__section">
        <h2>1. Responsável pelo Serviço</h2>
        <p>
          Skytla é operado por <strong>Al García</strong>, doravante denominado "o Responsável."
          Para quaisquer dúvidas relacionadas a estes Termos, entre em contato pelo e-mail{' '}
          <a href="mailto:skytla.vault@gmail.com">skytla.vault@gmail.com</a> ou pela
          seção de Suporte dentro da plataforma.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>2. Aceitação dos Termos</h2>
        <p>
          Ao se registrar e utilizar o Skytla ("o Serviço"), você concorda em ficar vinculado
          a estes Termos de Uso. Se você não concordar com algum deles, não deve utilizar o
          Serviço. Estes termos se aplicam a usuários de qualquer país.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>3. Descrição do Serviço</h2>
        <p>
          Skytla é uma plataforma de gestão de pedidos, clientes e produtos desenvolvida para
          pequenas e médias empresas. O Serviço encontra-se atualmente em{' '}
          <strong>versão Beta</strong>, portanto algumas funcionalidades podem ser alteradas,
          atualizadas ou removidas sem aviso prévio.
        </p>
        <p>
          O Serviço é fornecido <strong>"no estado em que se encontra"</strong> e{' '}
          <strong>"conforme disponibilidade"</strong>, sem garantias de qualquer natureza,
          expressas ou implícitas, incluindo, entre outras, garantias de comerciabilidade,
          adequação a uma finalidade específica ou ausência de interrupções.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>4. Conta de Usuário</h2>
        <p>
          Você é responsável por manter a confidencialidade de sua senha e por todas as
          atividades realizadas em sua conta. Você deve nos notificar imediatamente em caso
          de uso não autorizado.
        </p>
        <p>
          Ao se registrar, você garante que as informações fornecidas são verdadeiras,
          completas e atualizadas. Você deve ter pelo menos 18 anos para criar uma conta.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>5. Uso Aceitável</h2>
        <p>Você se compromete a não usar o Serviço para:</p>
        <ul>
          <li>Atividades ilegais ou fraudulentas.</li>
          <li>Armazenar ou compartilhar informações de terceiros sem o consentimento deles.</li>
          <li>Tentar acessar contas de outros usuários.</li>
          <li>Ações que possam danificar, desabilitar ou sobrecarregar a plataforma.</li>
          <li>Violar leis locais, nacionais ou internacionais aplicáveis.</li>
        </ul>
      </section>

      <section className="legal-page__section">
        <h2>6. Indenização</h2>
        <p>
          Você concorda em indenizar e isentar o Responsável, seus colaboradores e
          fornecedores de quaisquer reclamações, danos, perdas ou despesas (incluindo
          honorários advocatícios razoáveis) decorrentes de: (a) seu uso do Serviço em
          violação a estes Termos, (b) descumprimento de qualquer lei aplicável, ou
          (c) qualquer conteúdo inserido por você na plataforma.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>7. Suspensão e Cancelamento de Conta</h2>
        <p>
          O Responsável reserva-se o direito de suspender ou cancelar sua conta sem aviso
          prévio em caso de:
        </p>
        <ul>
          <li>Descumprimento destes Termos.</li>
          <li>Uso fraudulento ou atividade ilegal.</li>
          <li>Comportamento que coloque em risco a plataforma ou outros usuários.</li>
        </ul>
        <p>
          Você também pode cancelar sua conta a qualquer momento na seção de Configurações
          dentro da plataforma. Após o cancelamento, seus dados serão excluídos conforme
          estabelecido no Aviso de Privacidade.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>8. Pagamentos e Política de Reembolso</h2>
        <p>
          Skytla oferece planos pagos disponíveis durante a <strong>versão Beta</strong>.
          Ao assinar um plano pago, você concorda com as seguintes condições:
        </p>
        <ul>
          <li>
            <strong>Sem reembolsos.</strong> Todos os pagamentos realizados são definitivos
            e não reembolsáveis, salvo quando a lei aplicável no seu país exigir expressamente.
          </li>
          <li>
            Como o Serviço está em versão Beta, planos, preços e funcionalidades incluídas
            podem mudar. Quaisquer mudanças relevantes serão comunicadas dentro da plataforma
            com pelo menos <strong>15 dias de antecedência</strong>.
          </li>
          <li>
            O cancelamento da sua assinatura terá efeito ao término do período de cobrança
            vigente. Nenhum encargo adicional será feito após o cancelamento.
          </li>
          <li>
            Em caso de disputa relacionada a uma cobrança, entre em contato em{' '}
            <a href="mailto:skytla.vault@gmail.com">skytla.vault@gmail.com</a> dentro de
            30 dias após o lançamento do pagamento.
          </li>
          <li>
            <strong>Usuários da União Europeia — Direito de Arrependimento:</strong> Em
            conformidade com a Diretiva 2011/83/UE sobre direitos dos consumidores, ao
            assinar um plano pago e solicitar que o Serviço comece imediatamente, você
            reconhece e aceita expressamente que renuncia ao seu direito de arrependimento
            de 14 dias. Essa renúncia é necessária para acessar o Serviço imediatamente
            após a conclusão do pagamento.
          </li>
        </ul>
      </section>

      <section className="legal-page__section">
        <h2>9. Propriedade Intelectual</h2>
        <p>
          Todos os direitos sobre o Serviço, incluindo seu design, código e conteúdo, são
          de propriedade exclusiva do Responsável. Nenhuma licença além do acesso pessoal
          ao Serviço é concedida.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>10. Disponibilidade do Serviço</h2>
        <p>
          Como o Serviço está em versão Beta, não garantimos disponibilidade contínua.
          Podemos suspender ou modificar o Serviço a qualquer momento para manutenção,
          melhorias ou por razões técnicas.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>11. Limitação de Responsabilidade</h2>
        <p>
          Na máxima extensão permitida pela legislação aplicável, o Responsável não será
          responsável por perda de dados, interrupções do serviço, lucros cessantes ou
          danos diretos, indiretos, incidentais ou consequentes decorrentes do uso ou
          impossibilidade de uso do Serviço.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>12. Modificações</h2>
        <p>
          Reservamo-nos o direito de modificar estes Termos a qualquer momento. As
          alterações substanciais serão comunicadas dentro da plataforma com pelo menos
          30 dias de antecedência. O uso contínuo do Serviço após as alterações implica
          a aceitação das mesmas.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>13. Legislação Aplicável e Resolução de Conflitos</h2>
        <p>Estes Termos são regidos pelas leis aplicáveis de acordo com a residência do usuário:</p>
        <ul>
          <li><strong>México:</strong> Leis dos Estados Unidos Mexicanos e jurisdição dos tribunais mexicanos.</li>
          <li><strong>União Europeia:</strong> Legislação do Estado-Membro correspondente e regulamentos da UE aplicáveis, incluindo o RGPD.</li>
          <li><strong>Estados Unidos:</strong> Leis do estado de residência do usuário, incluindo a CCPA para residentes da Califórnia.</li>
          <li><strong>Brasil:</strong> Lei Geral de Proteção de Dados (LGPD) e legislação brasileira aplicável.</li>
          <li><strong>Outros países:</strong> Leis locais aplicáveis em matéria de comércio eletrônico e proteção de dados.</li>
        </ul>
        <p>
          Em caso de conflito, as partes buscarão resolvê-lo de forma amigável. Se não for
          possível, o conflito será submetido a arbitragem ou aos tribunais competentes,
          de acordo com a jurisdição aplicável.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>14. Contato</h2>
        <p>
          Se você tiver dúvidas sobre estes Termos, entre em contato pelo e-mail{' '}
          <a href="mailto:skytla.vault@gmail.com">skytla.vault@gmail.com</a> ou pela
          seção de Suporte dentro da plataforma.
        </p>
      </section>
    </>
  );
}

function ContentFR() {
  return (
    <>
      <h1 className="legal-page__title">Conditions d'utilisation</h1>
      <p className="legal-page__date">Dernière mise à jour : 2 mai 2026</p>

      <section className="legal-page__section">
        <h2>1. Responsable du Service</h2>
        <p>
          Skytla est exploité par <strong>Al García</strong>, ci-après dénommé « le Responsable ».
          Pour toute question relative aux présentes Conditions, vous pouvez nous contacter à{' '}
          <a href="mailto:skytla.vault@gmail.com">skytla.vault@gmail.com</a> ou via
          la section Assistance de la plateforme.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>2. Acceptation des conditions</h2>
        <p>
          En vous inscrivant et en utilisant Skytla (« le Service »), vous acceptez d'être lié
          par les présentes Conditions d'utilisation. Si vous n'en acceptez pas certaines, vous
          ne devez pas utiliser le Service. Ces conditions s'appliquent aux utilisateurs de
          tous pays.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>3. Description du Service</h2>
        <p>
          Skytla est une plateforme de gestion des commandes, clients et produits conçue pour
          les petites et moyennes entreprises. Le Service est actuellement en{' '}
          <strong>version Bêta</strong>, ce qui signifie que certaines fonctionnalités peuvent
          être modifiées, mises à jour ou supprimées sans préavis.
        </p>
        <p>
          Le Service est fourni <strong>« en l'état »</strong> et{' '}
          <strong>« selon disponibilité »</strong>, sans garantie d'aucune sorte, expresse ou
          implicite, y compris, mais sans s'y limiter, les garanties de qualité marchande,
          d'adéquation à un usage particulier ou d'absence d'interruption.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>4. Compte utilisateur</h2>
        <p>
          Vous êtes responsable de la confidentialité de votre mot de passe et de toutes les
          activités effectuées sous votre compte. Vous devez nous informer immédiatement de
          toute utilisation non autorisée.
        </p>
        <p>
          En vous inscrivant, vous garantissez que les informations fournies sont exactes,
          complètes et à jour. Vous devez avoir au moins 18 ans pour créer un compte.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>5. Utilisation acceptable</h2>
        <p>Vous vous engagez à ne pas utiliser le Service pour :</p>
        <ul>
          <li>Des activités illégales ou frauduleuses.</li>
          <li>Stocker ou partager des informations de tiers sans leur consentement.</li>
          <li>Tenter d'accéder aux comptes d'autres utilisateurs.</li>
          <li>Des actions susceptibles d'endommager, désactiver ou surcharger la plateforme.</li>
          <li>Violer les lois locales, nationales ou internationales applicables.</li>
        </ul>
      </section>

      <section className="legal-page__section">
        <h2>6. Indemnisation</h2>
        <p>
          Vous acceptez d'indemniser et de dégager de toute responsabilité le Responsable,
          ses collaborateurs et fournisseurs contre toute réclamation, dommage, perte ou dépense
          (y compris les honoraires d'avocats raisonnables) découlant de : (a) votre utilisation
          du Service en violation des présentes Conditions, (b) votre non-respect de toute loi
          applicable, ou (c) tout contenu que vous introduisez sur la plateforme.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>7. Suspension et résiliation du compte</h2>
        <p>
          Le Responsable se réserve le droit de suspendre ou de résilier votre compte sans
          préavis en cas de :
        </p>
        <ul>
          <li>Violation des présentes Conditions.</li>
          <li>Utilisation frauduleuse ou activité illégale.</li>
          <li>Comportement mettant en danger la plateforme ou d'autres utilisateurs.</li>
        </ul>
        <p>
          Vous pouvez également résilier votre compte à tout moment depuis la section Paramètres
          de la plateforme. Après la résiliation, vos données seront supprimées conformément
          à ce qui est établi dans la Politique de confidentialité.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>8. Paiements et politique de remboursement</h2>
        <p>
          Skytla propose des plans payants disponibles pendant la <strong>version Bêta</strong>.
          En souscrivant à un plan payant, vous acceptez les conditions suivantes :
        </p>
        <ul>
          <li>
            <strong>Aucun remboursement.</strong> Tous les paiements effectués sont définitifs
            et non remboursables, sauf si la loi applicable dans votre pays l'exige expressément.
          </li>
          <li>
            Étant donné que le Service est en version Bêta, les plans, les tarifs et les
            fonctionnalités incluses peuvent changer. Tout changement significatif sera notifié
            dans la plateforme avec un préavis d'au moins{' '}
            <strong>15 jours</strong>.
          </li>
          <li>
            L'annulation de votre abonnement prendra effet à la fin de la période de
            facturation en cours. Aucun frais supplémentaire ne sera prélevé après l'annulation.
          </li>
          <li>
            En cas de litige lié à un prélèvement, contactez-nous à{' '}
            <a href="mailto:skytla.vault@gmail.com">skytla.vault@gmail.com</a> dans les
            30 jours suivant le prélèvement.
          </li>
          <li>
            <strong>Utilisateurs de l'Union européenne — Droit de rétractation :</strong> Conformément
            à la Directive 2011/83/UE relative aux droits des consommateurs, en souscrivant à un
            plan payant et en demandant que le Service commence immédiatement, vous reconnaissez et
            acceptez expressément que vous renoncez à votre droit de rétractation de 14 jours.
            Cette renonciation est nécessaire pour accéder au Service immédiatement après le
            paiement.
          </li>
        </ul>
      </section>

      <section className="legal-page__section">
        <h2>9. Propriété intellectuelle</h2>
        <p>
          Tous les droits sur le Service, y compris sa conception, son code et son contenu,
          sont la propriété exclusive du Responsable. Aucune licence au-delà de l'accès
          personnel au Service n'est accordée.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>10. Disponibilité du Service</h2>
        <p>
          Étant donné que le Service est en version Bêta, nous ne garantissons pas une
          disponibilité continue. Nous pouvons suspendre ou modifier le Service à tout moment
          pour des raisons de maintenance, d'améliorations ou techniques.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>11. Limitation de responsabilité</h2>
        <p>
          Dans la mesure maximale permise par la loi applicable, le Responsable ne sera pas
          tenu responsable de la perte de données, des interruptions de service, de la perte
          de bénéfices ou des dommages directs, indirects, accessoires ou consécutifs découlant
          de l'utilisation ou de l'impossibilité d'utiliser le Service.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>12. Modifications</h2>
        <p>
          Nous nous réservons le droit de modifier les présentes Conditions à tout moment.
          Les modifications substantielles seront notifiées dans la plateforme avec un préavis
          d'au moins 30 jours. L'utilisation continue du Service après les modifications
          implique leur acceptation.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>13. Droit applicable et résolution des litiges</h2>
        <p>Les présentes Conditions sont régies par les lois applicables selon la résidence de l'utilisateur :</p>
        <ul>
          <li><strong>Mexique :</strong> Lois des États-Unis mexicains et juridiction des tribunaux mexicains.</li>
          <li><strong>Union européenne :</strong> Législation de l'État membre concerné et réglementation européenne applicable, y compris le RGPD.</li>
          <li><strong>États-Unis :</strong> Lois de l'État de résidence de l'utilisateur, y compris la CCPA pour les résidents de Californie.</li>
          <li><strong>Brésil :</strong> Lei Geral de Proteção de Dados (LGPD) et législation brésilienne applicable.</li>
          <li><strong>Autres pays :</strong> Lois locales applicables en matière de commerce électronique et de protection des données.</li>
        </ul>
        <p>
          En cas de litige, les parties s'efforceront de le résoudre à l'amiable. À défaut,
          le litige sera soumis à l'arbitrage ou aux tribunaux compétents selon la juridiction
          applicable.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>14. Contact</h2>
        <p>
          Si vous avez des questions sur les présentes Conditions, vous pouvez nous contacter à{' '}
          <a href="mailto:skytla.vault@gmail.com">skytla.vault@gmail.com</a> ou via
          la section Assistance de la plateforme.
        </p>
      </section>
    </>
  );
}

const Terminos = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : i18n.language?.startsWith('pt') ? 'pt' : i18n.language?.startsWith('fr') ? 'fr' : 'es';
  const Content = lang === 'en' ? ContentEN : lang === 'pt' ? ContentPT : lang === 'fr' ? ContentFR : ContentES;

  return (
    <div className="legal-page">
      <div className="legal-page__container">
        <div className="legal-page__header">
          <img
            src="/logo-skytla.svg"
            alt="Skytla"
            className="legal-page__logo"
            draggable={false}
            onContextMenu={e => e.preventDefault()}
          />
        </div>
        <div className="legal-page__card">
          <Content />
        </div>
      </div>
    </div>
  );
};

export default Terminos;
