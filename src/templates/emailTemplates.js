// Constantes globais extraídas das variáveis de ambiente
const companyName = process.env.COMPANY_NAME || 'Empresa Padrão';
const systemName = process.env.SYSTEM_NAME || 'Template de Sistema';
const headerTitle = process.env.EMAIL_HEADER_TITLE || 'Acesso ao Portal';
const currentYear = new Date().getFullYear().toString();

const standardFooter = `
  <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        ${systemName}
        <br>© ${currentYear} ${companyName}
    </p>
  </div>
`;

export const emailTemplates = {
  ACCOUNT_VERIFICATION: (data) => ({
    subject: 'Código de Verificação',
    html: `
    <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Segoe UI', system-ui, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">
        <div style="background-color: #2c3e50; padding: 25px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 1px;">${headerTitle}</h1>
        </div>
        <div style="padding: 40px 30px; text-align: center;">
          <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; font-weight: 700;">Confirme o seu e-mail</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 10px;">Olá, ${data.name}! Para garantir a segurança do seu acesso, precisamos de validar a sua conta.</p>
          <div style="background-color: #f8f9fa; border: 2px dashed #3498db; padding: 20px; margin: 30px auto; width: fit-content; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2c3e50;">${data.token}</span>
          </div>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 15px;">Este código de confirmação tem a validade de 10 minutos.</p>
          <p style="color: #94a3b8; font-size: 14px; margin-bottom: 0;">Se não solicitou este código, por favor, ignore este e-mail.</p>
        </div>
        ${standardFooter}
      </div>
    </div>
    `,
  }),

  PASSWORD_RECOVERY: (data) => ({
    subject: 'Código de Recuperação',
    html: `
      <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Segoe UI', system-ui, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">
          <div style="background-color: #2c3e50; padding: 25px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 1px;">${headerTitle}</h1>
          </div>
          <div style="padding: 40px 30px; text-align: center;">
            <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; font-weight: 700;">Olá, ${data.name}!</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">Solicitou a recuperação da sua palavra-passe.</p>
            <div style="background-color: #f8f9fa; border: 2px dashed #3498db; padding: 20px; margin: 30px auto; width: fit-content; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2c3e50;">${data.token}</span>
            </div>
            <p style="color: #64748b; font-size: 13px;">Este código é válido por 5 minutos.</p>
          </div>
          ${standardFooter}
        </div>
      </div>
    `,
  }),
};
