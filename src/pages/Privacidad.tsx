import { useTranslation } from 'react-i18next';
import './Legal.scss';

function ContentES() {
  return (
    <>
      <h1 className="legal-page__title">Aviso de Privacidad</h1>
      <p className="legal-page__date">Última actualización: 2 de mayo de 2026</p>

      <section className="legal-page__section">
        <h2>1. Responsable del tratamiento</h2>
        <p>
          <strong>Al García</strong>, operador de Skytla, es el responsable del tratamiento
          de los datos personales que nos proporcionas. Para cualquier solicitud relacionada
          con tus datos, contáctanos en{' '}
          <a href="mailto:skytla.vault@gmail.com">skytla.vault@gmail.com</a>.
        </p>
        <p>
          Este aviso cumple con las legislaciones de protección de datos aplicables
          internacionalmente, incluyendo:
        </p>
        <ul>
          <li><strong>México:</strong> Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).</li>
          <li><strong>Unión Europea / EEE:</strong> Reglamento General de Protección de Datos (RGPD / GDPR).</li>
          <li><strong>California, EE.UU.:</strong> California Consumer Privacy Act (CCPA).</li>
          <li><strong>Brasil:</strong> Lei Geral de Proteção de Dados (LGPD).</li>
        </ul>
      </section>

      <section className="legal-page__section">
        <h2>2. Datos personales que recopilamos</h2>
        <p>Al registrarte y utilizar el Servicio, podemos recopilar los siguientes datos:</p>
        <ul>
          <li>Nombre y apellido</li>
          <li>Correo electrónico</li>
          <li>Número de teléfono</li>
          <li>Fecha de nacimiento (para verificar que eres mayor de 18 años)</li>
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
          <li><strong>Consentimiento:</strong> otorgado al aceptar este aviso al registrarte (aplica globalmente).</li>
          <li><strong>Ejecución de contrato:</strong> necesario para prestarte el Servicio (GDPR Art. 6.1.b / LGPD Art. 7.V).</li>
          <li><strong>Interés legítimo:</strong> mejora del Servicio y seguridad de la plataforma (GDPR Art. 6.1.f).</li>
          <li><strong>Obligación legal:</strong> cuando la ley nos exija conservar o reportar datos.</li>
        </ul>
      </section>

      <section className="legal-page__section">
        <h2>4. Finalidad del tratamiento</h2>
        <p>Tus datos personales son utilizados para:</p>
        <ul>
          <li>Crear y gestionar tu cuenta en Skytla.</li>
          <li>Verificar que cumples con el requisito de edad mínima (18 años).</li>
          <li>Brindarte acceso al Servicio y sus funcionalidades.</li>
          <li>Procesar pagos de suscripción a través de Stripe.</li>
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
          Tus datos son procesados por los siguientes proveedores de confianza, todos con
          estándares de seguridad internacionales:
        </p>
        <ul>
          <li>
            <strong>Google Firebase (Google LLC)</strong> — Almacenamiento principal, autenticación
            y base de datos. Certificado ISO 27001 y SOC 2. Cumple con el GDPR mediante cláusulas
            contractuales estándar (SCCs).
          </li>
          <li>
            <strong>Stripe, Inc.</strong> — Procesamiento de pagos. Al contratar un plan de pago,
            Stripe procesa tu nombre, correo electrónico e historial de facturación. Stripe es
            certificado PCI-DSS Level 1. Skytla no almacena datos de tarjeta en sus propios
            sistemas.
          </li>
          <li>
            <strong>Google Cloud Vision (Google LLC)</strong> — Moderación de imágenes. Las
            fotografías que subas a la plataforma (fotos de clientes, productos o perfil) son
            analizadas automáticamente para detectar contenido inapropiado antes de almacenarse.
            Las imágenes se procesan de forma temporal; Google Cloud Vision no las conserva.
          </li>
          <li>
            <strong>Google Drive (Google LLC)</strong> — Respaldos opcionales. Si activas la
            función de respaldo desde Configuración, tus datos exportados se almacenan en tu
            propia cuenta de Google Drive. La gestión de esos datos queda sujeta a la Política
            de Privacidad de Google.
          </li>
        </ul>
        <p>
          Al usar el Servicio, reconoces que tus datos pueden ser procesados en servidores
          ubicados fuera de tu país de residencia. En todos los casos, los proveedores anteriores
          aplican las garantías de transferencia internacional exigidas por la legislación
          aplicable, incluyendo SCCs para usuarios de la Unión Europea.
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
          <li>Derecho a no vender tus datos personales — <strong>Skytla no vende datos.</strong></li>
        </ul>

        <p><strong>Brasil (LGPD):</strong></p>
        <ul>
          <li>Confirmación de tratamiento, acceso, corrección y portabilidad.</li>
          <li>Eliminación de datos tratados con consentimiento.</li>
          <li>Revocación del consentimiento en cualquier momento.</li>
        </ul>

        <p>
          Para ejercer cualquiera de estos derechos, contáctanos en{' '}
          <a href="mailto:skytla.vault@gmail.com">skytla.vault@gmail.com</a> o a través
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
          Skytla utiliza tokens de sesión necesarios para la autenticación y funcionamiento del
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
      <h1 className="legal-page__title">Privacy Notice</h1>
      <p className="legal-page__date">Last updated: May 2, 2026</p>

      <section className="legal-page__section">
        <h2>1. Data Controller</h2>
        <p>
          <strong>Al García</strong>, operator of Skytla, is responsible for processing
          the personal data you provide to us. For any request related to your data, contact us at{' '}
          <a href="mailto:skytla.vault@gmail.com">skytla.vault@gmail.com</a>.
        </p>
        <p>
          This notice complies with internationally applicable data protection laws, including:
        </p>
        <ul>
          <li><strong>Mexico:</strong> Federal Law on Protection of Personal Data Held by Private Parties (LFPDPPP).</li>
          <li><strong>European Union / EEA:</strong> General Data Protection Regulation (GDPR).</li>
          <li><strong>California, USA:</strong> California Consumer Privacy Act (CCPA).</li>
          <li><strong>Brazil:</strong> Lei Geral de Proteção de Dados (LGPD).</li>
        </ul>
      </section>

      <section className="legal-page__section">
        <h2>2. Personal Data We Collect</h2>
        <p>When you register and use the Service, we may collect the following data:</p>
        <ul>
          <li>First and last name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Date of birth (to verify you are at least 18 years old)</li>
          <li>Business name</li>
          <li>Customer, product, and order data you enter into the platform</li>
          <li>Service usage data (logins, features used)</li>
        </ul>
        <p>We do not collect sensitive data such as financial, health, or biometric information.</p>
      </section>

      <section className="legal-page__section">
        <h2>3. Legal Basis for Processing</h2>
        <p>We process your data under the following legal bases depending on your region:</p>
        <ul>
          <li><strong>Consent:</strong> granted when you accept this notice upon registration (applies globally).</li>
          <li><strong>Performance of a contract:</strong> necessary to provide the Service (GDPR Art. 6.1.b / LGPD Art. 7.V).</li>
          <li><strong>Legitimate interest:</strong> improving the Service and platform security (GDPR Art. 6.1.f).</li>
          <li><strong>Legal obligation:</strong> when the law requires us to retain or report data.</li>
        </ul>
      </section>

      <section className="legal-page__section">
        <h2>4. Purpose of Processing</h2>
        <p>Your personal data is used to:</p>
        <ul>
          <li>Create and manage your Skytla account.</li>
          <li>Verify that you meet the minimum age requirement (18 years).</li>
          <li>Provide access to the Service and its features.</li>
          <li>Process subscription payments through Stripe.</li>
          <li>Send you notifications related to the Service.</li>
          <li>Handle support requests.</li>
          <li>Improve the platform through usage analysis (without identifying individual users).</li>
        </ul>
        <p>
          We do not use your data for advertising purposes, nor do we sell it to third parties
          under any circumstances.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>5. Data Transfer and Storage</h2>
        <p>
          Your data is processed by the following trusted providers, all with international
          security standards:
        </p>
        <ul>
          <li>
            <strong>Google Firebase (Google LLC)</strong> — Primary storage, authentication, and
            database. ISO 27001 and SOC 2 certified. GDPR-compliant through Standard Contractual
            Clauses (SCCs).
          </li>
          <li>
            <strong>Stripe, Inc.</strong> — Payment processing. When you subscribe to a paid plan,
            Stripe processes your name, email address, and billing history. Stripe is PCI-DSS Level 1
            certified. Skytla does not store card data in its own systems.
          </li>
          <li>
            <strong>Google Cloud Vision (Google LLC)</strong> — Image moderation. Photos you upload
            to the platform (customer, product, or profile photos) are automatically analyzed to
            detect inappropriate content before being stored. Images are processed temporarily;
            Google Cloud Vision does not retain them.
          </li>
          <li>
            <strong>Google Drive (Google LLC)</strong> — Optional backups. If you enable the backup
            feature from Settings, your exported data is stored in your own Google Drive account.
            Management of that data is subject to Google's Privacy Policy.
          </li>
        </ul>
        <p>
          By using the Service, you acknowledge that your data may be processed on servers
          located outside your country of residence. In all cases, the providers above apply the
          international transfer safeguards required by applicable law, including SCCs for
          European Union users.
        </p>
        <p>
          We do not transfer your data to other third parties, except as required by law or with
          your explicit consent.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>6. Your Rights</h2>
        <p>Depending on your region, you have the following rights over your data:</p>

        <p><strong>All users (global):</strong></p>
        <ul>
          <li>Access your personal data.</li>
          <li>Rectify inaccurate or incomplete data.</li>
          <li>Request deletion of your data.</li>
          <li>Object to the processing of your data.</li>
        </ul>

        <p><strong>European Union / EEA (GDPR):</strong></p>
        <ul>
          <li>Data portability (receive your data in a structured format).</li>
          <li>Right to erasure ("right to be forgotten").</li>
          <li>Restrict processing under certain circumstances.</li>
          <li>Lodge a complaint with your country's supervisory authority.</li>
          <li>Response within a maximum of <strong>30 calendar days</strong>.</li>
        </ul>

        <p><strong>Mexico (LFPDPPP) — ARCO Rights:</strong></p>
        <ul>
          <li>Access, Rectification, Cancellation, and Opposition to processing.</li>
          <li>Response within a maximum of <strong>20 business days</strong>.</li>
        </ul>

        <p><strong>California, USA (CCPA):</strong></p>
        <ul>
          <li>Know what data we collect and for what purpose.</li>
          <li>Request deletion of your data.</li>
          <li>Non-discrimination for exercising your rights.</li>
          <li>Right to opt out of the sale of personal data — <strong>Skytla does not sell data.</strong></li>
        </ul>

        <p><strong>Brazil (LGPD):</strong></p>
        <ul>
          <li>Confirmation of processing, access, correction, and portability.</li>
          <li>Deletion of data processed with consent.</li>
          <li>Revocation of consent at any time.</li>
        </ul>

        <p>
          To exercise any of these rights, contact us at{' '}
          <a href="mailto:skytla.vault@gmail.com">skytla.vault@gmail.com</a> or through
          the Support section within the platform.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>7. Security</h2>
        <p>
          We implement technical and organizational measures to protect your data against
          unauthorized access, loss, or alteration, including encryption in transit (HTTPS)
          and at rest. However, no system is completely infallible.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>8. Data Retention</h2>
        <p>
          We retain your data while your account is active or as necessary to provide the
          Service. Upon requesting account deletion, your data will be deleted within a maximum
          of <strong>30 days</strong>, unless we are legally required to retain it.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>9. Cookies and Similar Technologies</h2>
        <p>
          Skytla uses session tokens necessary for authentication and operation of the Service.
          We do not use tracking cookies, advertising cookies, or third-party behavioral
          analytics.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>10. Minors</h2>
        <p>
          The Service is not directed at individuals under 18 years of age. We do not
          intentionally collect data from minors. If we detect that a minor has registered,
          we will immediately delete their account and data.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>11. Changes to This Notice</h2>
        <p>
          We may update this Privacy Notice at any time. Substantial changes will be notified
          within the platform with at least 30 days' notice. We recommend reviewing it
          periodically.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>12. Contact</h2>
        <p>
          For any questions, rights requests, or complaints related to your personal data,
          contact us at{' '}
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
      <h1 className="legal-page__title">Aviso de Privacidade</h1>
      <p className="legal-page__date">Última atualização: 2 de maio de 2026</p>

      <section className="legal-page__section">
        <h2>1. Responsável pelo Tratamento</h2>
        <p>
          <strong>Al García</strong>, operador do Skytla, é o responsável pelo tratamento
          dos dados pessoais que você nos fornece. Para qualquer solicitação relacionada aos
          seus dados, entre em contato pelo e-mail{' '}
          <a href="mailto:skytla.vault@gmail.com">skytla.vault@gmail.com</a>.
        </p>
        <p>
          Este aviso está em conformidade com as legislações de proteção de dados aplicáveis
          internacionalmente, incluindo:
        </p>
        <ul>
          <li><strong>México:</strong> Lei Federal de Proteção de Dados Pessoais em Poder dos Particulares (LFPDPPP).</li>
          <li><strong>União Europeia / EEE:</strong> Regulamento Geral de Proteção de Dados (RGPD / GDPR).</li>
          <li><strong>Califórnia, EUA:</strong> California Consumer Privacy Act (CCPA).</li>
          <li><strong>Brasil:</strong> Lei Geral de Proteção de Dados (LGPD).</li>
        </ul>
      </section>

      <section className="legal-page__section">
        <h2>2. Dados Pessoais que Coletamos</h2>
        <p>Ao se registrar e utilizar o Serviço, podemos coletar os seguintes dados:</p>
        <ul>
          <li>Nome e sobrenome</li>
          <li>Endereço de e-mail</li>
          <li>Número de telefone</li>
          <li>Data de nascimento (para verificar que você tem pelo menos 18 anos)</li>
          <li>Nome do negócio</li>
          <li>Dados de clientes, produtos e pedidos que você registrar na plataforma</li>
          <li>Dados de uso do Serviço (acessos, funcionalidades utilizadas)</li>
        </ul>
        <p>Não coletamos dados sensíveis como informações financeiras, de saúde ou biométricas.</p>
      </section>

      <section className="legal-page__section">
        <h2>3. Base Legal do Tratamento</h2>
        <p>Tratamos seus dados com base nas seguintes bases legais de acordo com sua região:</p>
        <ul>
          <li><strong>Consentimento:</strong> concedido ao aceitar este aviso no momento do registro (aplica-se globalmente).</li>
          <li><strong>Execução de contrato:</strong> necessário para prestar o Serviço (GDPR Art. 6.1.b / LGPD Art. 7.V).</li>
          <li><strong>Interesse legítimo:</strong> melhoria do Serviço e segurança da plataforma (GDPR Art. 6.1.f).</li>
          <li><strong>Obrigação legal:</strong> quando a lei nos exigir conservar ou reportar dados.</li>
        </ul>
      </section>

      <section className="legal-page__section">
        <h2>4. Finalidade do Tratamento</h2>
        <p>Seus dados pessoais são utilizados para:</p>
        <ul>
          <li>Criar e gerenciar sua conta no Skytla.</li>
          <li>Verificar que você atende ao requisito de idade mínima (18 anos).</li>
          <li>Fornecer acesso ao Serviço e suas funcionalidades.</li>
          <li>Processar pagamentos de assinatura por meio do Stripe.</li>
          <li>Enviar notificações relacionadas ao Serviço.</li>
          <li>Atender solicitações de suporte.</li>
          <li>Melhorar a plataforma por meio de análise de uso (sem identificar o usuário).</li>
        </ul>
        <p>
          Não utilizamos seus dados para fins publicitários nem os vendemos a terceiros em
          nenhuma circunstância.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>5. Transferência e Armazenamento de Dados</h2>
        <p>
          Seus dados são processados pelos seguintes fornecedores de confiança, todos com
          padrões internacionais de segurança:
        </p>
        <ul>
          <li>
            <strong>Google Firebase (Google LLC)</strong> — Armazenamento principal, autenticação
            e banco de dados. Certificado ISO 27001 e SOC 2. Conformidade com o GDPR por meio de
            Cláusulas Contratuais Padrão (SCCs).
          </li>
          <li>
            <strong>Stripe, Inc.</strong> — Processamento de pagamentos. Ao contratar um plano
            pago, o Stripe processa seu nome, endereço de e-mail e histórico de faturamento. O
            Stripe é certificado PCI-DSS Nível 1. O Skytla não armazena dados de cartão em seus
            próprios sistemas.
          </li>
          <li>
            <strong>Google Cloud Vision (Google LLC)</strong> — Moderação de imagens. As fotos que
            você enviar à plataforma (fotos de clientes, produtos ou perfil) são analisadas
            automaticamente para detectar conteúdo impróprio antes de serem armazenadas. As
            imagens são processadas de forma temporária; o Google Cloud Vision não as retém.
          </li>
          <li>
            <strong>Google Drive (Google LLC)</strong> — Backups opcionais. Se você ativar a função
            de backup em Configurações, seus dados exportados serão armazenados em sua própria conta
            do Google Drive. O gerenciamento desses dados está sujeito à Política de Privacidade
            do Google.
          </li>
        </ul>
        <p>
          Ao usar o Serviço, você reconhece que seus dados podem ser processados em servidores
          localizados fora do seu país de residência. Em todos os casos, os fornecedores acima
          aplicam as garantias de transferência internacional exigidas pela legislação aplicável,
          incluindo SCCs para usuários da União Europeia.
        </p>
        <p>
          Não transferimos seus dados a outros terceiros, exceto por obrigação legal ou com seu
          consentimento explícito.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>6. Seus Direitos</h2>
        <p>De acordo com sua região, você tem os seguintes direitos sobre seus dados:</p>

        <p><strong>Todos os usuários (global):</strong></p>
        <ul>
          <li>Acessar seus dados pessoais.</li>
          <li>Retificar dados inexatos ou incompletos.</li>
          <li>Solicitar a exclusão dos seus dados.</li>
          <li>Opor-se ao tratamento dos seus dados.</li>
        </ul>

        <p><strong>União Europeia / EEE (GDPR):</strong></p>
        <ul>
          <li>Portabilidade de dados (receber seus dados em formato estruturado).</li>
          <li>Direito ao esquecimento (exclusão completa).</li>
          <li>Limitar o tratamento em determinadas circunstâncias.</li>
          <li>Apresentar reclamação à autoridade de controle do seu país.</li>
          <li>Resposta em prazo máximo de <strong>30 dias corridos</strong>.</li>
        </ul>

        <p><strong>México (LFPDPPP) — Direitos ARCO:</strong></p>
        <ul>
          <li>Acesso, Retificação, Cancelamento e Oposição ao tratamento.</li>
          <li>Resposta em prazo máximo de <strong>20 dias úteis</strong>.</li>
        </ul>

        <p><strong>Califórnia, EUA (CCPA):</strong></p>
        <ul>
          <li>Saber quais dados coletamos e com qual finalidade.</li>
          <li>Solicitar a exclusão dos seus dados.</li>
          <li>Não sofrer discriminação por exercer seus direitos.</li>
          <li>Direito de recusar a venda de dados pessoais — <strong>Skytla não vende dados.</strong></li>
        </ul>

        <p><strong>Brasil (LGPD):</strong></p>
        <ul>
          <li>Confirmação de tratamento, acesso, correção e portabilidade.</li>
          <li>Eliminação de dados tratados com consentimento.</li>
          <li>Revogação do consentimento a qualquer momento.</li>
        </ul>

        <p>
          Para exercer qualquer um desses direitos, entre em contato pelo e-mail{' '}
          <a href="mailto:skytla.vault@gmail.com">skytla.vault@gmail.com</a> ou pela
          seção de Suporte dentro da plataforma.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>7. Segurança</h2>
        <p>
          Implementamos medidas técnicas e organizacionais para proteger seus dados contra
          acesso não autorizado, perda ou alteração, incluindo criptografia em trânsito (HTTPS)
          e em repouso. No entanto, nenhum sistema é completamente infalível.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>8. Retenção de Dados</h2>
        <p>
          Conservamos seus dados enquanto sua conta estiver ativa ou for necessário para prestar
          o Serviço. Ao solicitar a exclusão da sua conta, seus dados serão excluídos em prazo
          máximo de <strong>30 dias</strong>, salvo obrigação legal de conservá-los.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>9. Cookies e Tecnologias Similares</h2>
        <p>
          Skytla utiliza tokens de sessão necessários para autenticação e funcionamento do
          Serviço. Não utilizamos cookies de rastreamento, publicidade ou análise de
          comportamento de terceiros.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>10. Menores de Idade</h2>
        <p>
          O Serviço não é destinado a menores de 18 anos. Não coletamos intencionalmente dados
          de menores. Se detectarmos que um menor se registrou, excluiremos imediatamente sua
          conta e dados.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>11. Alterações ao Aviso</h2>
        <p>
          Podemos atualizar este Aviso de Privacidade a qualquer momento. As alterações
          substanciais serão comunicadas dentro da plataforma com pelo menos 30 dias de
          antecedência. Recomendamos revisá-lo periodicamente.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>12. Contato</h2>
        <p>
          Para quaisquer dúvidas, exercício de direitos ou reclamações relacionadas aos seus
          dados pessoais, entre em contato pelo e-mail{' '}
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
      <h1 className="legal-page__title">Politique de confidentialité</h1>
      <p className="legal-page__date">Dernière mise à jour : 2 mai 2026</p>

      <section className="legal-page__section">
        <h2>1. Responsable du traitement</h2>
        <p>
          <strong>Al García</strong>, opérateur de Skytla, est responsable du traitement
          des données personnelles que vous nous fournissez. Pour toute demande relative à
          vos données, contactez-nous à{' '}
          <a href="mailto:skytla.vault@gmail.com">skytla.vault@gmail.com</a>.
        </p>
        <p>
          Cette politique est conforme aux législations internationales applicables en matière
          de protection des données, notamment :
        </p>
        <ul>
          <li><strong>Mexique :</strong> Loi fédérale sur la protection des données personnelles détenues par des particuliers (LFPDPPP).</li>
          <li><strong>Union européenne / EEE :</strong> Règlement général sur la protection des données (RGPD / GDPR).</li>
          <li><strong>Californie, États-Unis :</strong> California Consumer Privacy Act (CCPA).</li>
          <li><strong>Brésil :</strong> Lei Geral de Proteção de Dados (LGPD).</li>
        </ul>
      </section>

      <section className="legal-page__section">
        <h2>2. Données personnelles collectées</h2>
        <p>Lors de votre inscription et de l'utilisation du Service, nous pouvons collecter les données suivantes :</p>
        <ul>
          <li>Nom et prénom</li>
          <li>Adresse e-mail</li>
          <li>Numéro de téléphone</li>
          <li>Date de naissance (pour vérifier que vous avez au moins 18 ans)</li>
          <li>Nom de l'entreprise</li>
          <li>Données clients, produits et commandes que vous enregistrez sur la plateforme</li>
          <li>Données d'utilisation du Service (connexions, fonctionnalités utilisées)</li>
        </ul>
        <p>Nous ne collectons pas de données sensibles telles que des informations financières, de santé ou biométriques.</p>
      </section>

      <section className="legal-page__section">
        <h2>3. Base légale du traitement</h2>
        <p>Nous traitons vos données sur les bases légales suivantes selon votre région :</p>
        <ul>
          <li><strong>Consentement :</strong> accordé en acceptant cette politique lors de l'inscription (applicable mondialement).</li>
          <li><strong>Exécution d'un contrat :</strong> nécessaire pour vous fournir le Service (RGPD Art. 6.1.b / LGPD Art. 7.V).</li>
          <li><strong>Intérêt légitime :</strong> amélioration du Service et sécurité de la plateforme (RGPD Art. 6.1.f).</li>
          <li><strong>Obligation légale :</strong> lorsque la loi nous exige de conserver ou de signaler des données.</li>
        </ul>
      </section>

      <section className="legal-page__section">
        <h2>4. Finalité du traitement</h2>
        <p>Vos données personnelles sont utilisées pour :</p>
        <ul>
          <li>Créer et gérer votre compte Skytla.</li>
          <li>Vérifier que vous remplissez la condition d'âge minimum (18 ans).</li>
          <li>Vous fournir l'accès au Service et à ses fonctionnalités.</li>
          <li>Traiter les paiements d'abonnement via Stripe.</li>
          <li>Vous envoyer des notifications liées au Service.</li>
          <li>Traiter les demandes d'assistance.</li>
          <li>Améliorer la plateforme grâce à l'analyse d'utilisation (sans identification individuelle).</li>
        </ul>
        <p>
          Nous n'utilisons pas vos données à des fins publicitaires et ne les vendons à aucun
          tiers, en aucune circonstance.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>5. Transfert et stockage des données</h2>
        <p>
          Vos données sont traitées par les prestataires de confiance suivants, tous conformes
          aux normes de sécurité internationales :
        </p>
        <ul>
          <li>
            <strong>Google Firebase (Google LLC)</strong> — Stockage principal, authentification
            et base de données. Certifié ISO 27001 et SOC 2. Conformité RGPD via les clauses
            contractuelles types (CCT).
          </li>
          <li>
            <strong>Stripe, Inc.</strong> — Traitement des paiements. Lors de la souscription à
            un plan payant, Stripe traite votre nom, adresse e-mail et historique de facturation.
            Stripe est certifié PCI-DSS Niveau 1. Skytla ne stocke pas les données de carte dans
            ses propres systèmes.
          </li>
          <li>
            <strong>Google Cloud Vision (Google LLC)</strong> — Modération d'images. Les photos
            que vous téléchargez sur la plateforme (photos de clients, produits ou profil) sont
            analysées automatiquement pour détecter les contenus inappropriés avant d'être
            stockées. Les images sont traitées temporairement ; Google Cloud Vision ne les conserve pas.
          </li>
          <li>
            <strong>Google Drive (Google LLC)</strong> — Sauvegardes optionnelles. Si vous activez
            la fonction de sauvegarde depuis Paramètres, vos données exportées sont stockées dans
            votre propre compte Google Drive. La gestion de ces données est soumise à la Politique
            de confidentialité de Google.
          </li>
        </ul>
        <p>
          En utilisant le Service, vous reconnaissez que vos données peuvent être traitées sur
          des serveurs situés en dehors de votre pays de résidence. Dans tous les cas, les
          prestataires ci-dessus appliquent les garanties de transfert international requises par
          la législation applicable, y compris les CCT pour les utilisateurs de l'Union européenne.
        </p>
        <p>
          Nous ne transférons pas vos données à d'autres tiers, sauf obligation légale ou avec
          votre consentement explicite.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>6. Vos droits</h2>
        <p>Selon votre région, vous disposez des droits suivants concernant vos données :</p>

        <p><strong>Tous les utilisateurs (mondial) :</strong></p>
        <ul>
          <li>Accéder à vos données personnelles.</li>
          <li>Rectifier les données inexactes ou incomplètes.</li>
          <li>Demander la suppression de vos données.</li>
          <li>Vous opposer au traitement de vos données.</li>
        </ul>

        <p><strong>Union européenne / EEE (RGPD) :</strong></p>
        <ul>
          <li>Portabilité des données (recevoir vos données dans un format structuré).</li>
          <li>Droit à l'effacement (« droit à l'oubli »).</li>
          <li>Limiter le traitement dans certaines circonstances.</li>
          <li>Déposer une plainte auprès de l'autorité de contrôle de votre pays.</li>
          <li>Réponse dans un délai maximum de <strong>30 jours calendaires</strong>.</li>
        </ul>

        <p><strong>Mexique (LFPDPPP) — Droits ARCO :</strong></p>
        <ul>
          <li>Accès, Rectification, Annulation et Opposition au traitement.</li>
          <li>Réponse dans un délai maximum de <strong>20 jours ouvrables</strong>.</li>
        </ul>

        <p><strong>Californie, États-Unis (CCPA) :</strong></p>
        <ul>
          <li>Savoir quelles données nous collectons et dans quel but.</li>
          <li>Demander la suppression de vos données.</li>
          <li>Ne pas subir de discrimination pour l'exercice de vos droits.</li>
          <li>Droit de refuser la vente de vos données — <strong>Skytla ne vend pas de données.</strong></li>
        </ul>

        <p><strong>Brésil (LGPD) :</strong></p>
        <ul>
          <li>Confirmation du traitement, accès, correction et portabilité.</li>
          <li>Suppression des données traitées avec consentement.</li>
          <li>Révocation du consentement à tout moment.</li>
        </ul>

        <p>
          Pour exercer l'un de ces droits, contactez-nous à{' '}
          <a href="mailto:skytla.vault@gmail.com">skytla.vault@gmail.com</a> ou via
          la section Assistance de la plateforme.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>7. Sécurité</h2>
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos
          données contre tout accès non autorisé, perte ou altération, notamment le chiffrement
          en transit (HTTPS) et au repos. Cependant, aucun système n'est totalement infaillible.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>8. Conservation des données</h2>
        <p>
          Nous conservons vos données tant que votre compte est actif ou nécessaire à la
          fourniture du Service. Sur demande de suppression de compte, vos données seront
          supprimées dans un délai maximum de <strong>30 jours</strong>, sauf obligation légale
          de conservation.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>9. Cookies et technologies similaires</h2>
        <p>
          Skytla utilise des jetons de session nécessaires à l'authentification et au
          fonctionnement du Service. Nous n'utilisons pas de cookies de suivi, de publicité
          ou d'analyse comportementale de tiers.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>10. Mineurs</h2>
        <p>
          Le Service n'est pas destiné aux personnes de moins de 18 ans. Nous ne collectons
          pas intentionnellement de données de mineurs. Si nous détectons qu'un mineur s'est
          inscrit, nous supprimerons immédiatement son compte et ses données.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>11. Modifications de la politique</h2>
        <p>
          Nous pouvons mettre à jour cette Politique de confidentialité à tout moment. Les
          modifications substantielles seront notifiées dans la plateforme avec un préavis
          d'au moins 30 jours. Nous vous recommandons de la consulter régulièrement.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>12. Contact</h2>
        <p>
          Pour toute question, demande d'exercice de droits ou réclamation relative à vos
          données personnelles, contactez-nous à{' '}
          <a href="mailto:skytla.vault@gmail.com">skytla.vault@gmail.com</a> ou via
          la section Assistance de la plateforme.
        </p>
      </section>
    </>
  );
}

const Privacidad = () => {
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

export default Privacidad;
