import nodemailer from 'nodemailer'

// Configurar el transporter de nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface NoveltyCreatedEmailData {
  noveltyId: string
  noveltyTypeName: string
  userName: string
  userEmail: string
  amount?: number
  date?: string
  startDate?: string
  endDate?: string
  notes?: string
  webAppUrl: string
}

interface NoveltyApprovedEmailData {
  noveltyTypeName: string
  status: 'APPROVED' | 'REJECTED'
  approverName: string
  webAppUrl: string
}

export async function sendNoveltyCreatedEmail(
  toEmails: string[],
  data: NoveltyCreatedEmailData
) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP credentials not configured, skipping email notification')
    return
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #000; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
          .detail { margin: 10px 0; }
          .detail strong { display: inline-block; min-width: 150px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #000; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Nueva Novedad Pendiente</h1>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>Se ha creado una nueva novedad que requiere tu autorización:</p>

            <div class="detail">
              <strong>Tipo de Novedad:</strong> ${data.noveltyTypeName}
            </div>
            <div class="detail">
              <strong>Solicitante:</strong> ${data.userName} (${data.userEmail})
            </div>
            ${data.amount ? `<div class="detail"><strong>Importe:</strong> $${data.amount}</div>` : ''}
            ${data.date ? `<div class="detail"><strong>Fecha:</strong> ${new Date(data.date).toLocaleDateString()}</div>` : ''}
            ${data.startDate && data.endDate ? `<div class="detail"><strong>Período:</strong> ${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}</div>` : ''}
            ${data.notes ? `<div class="detail"><strong>Notas:</strong> ${data.notes}</div>` : ''}

            <div style="text-align: center;">
              <a href="${data.webAppUrl}/novelties" class="button">Ver Novedades Pendientes</a>
            </div>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no responder.</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    await transporter.sendMail({
      from: `"Checkpoint App" <${process.env.SMTP_USER}>`,
      to: toEmails.join(', '),
      subject: `Nueva Novedad Pendiente: ${data.noveltyTypeName}`,
      html: htmlContent,
    })
    console.log('Email de nueva novedad enviado a:', toEmails)
  } catch (error) {
    console.error('Error al enviar email de nueva novedad:', error)
  }
}

export async function sendNoveltyStatusEmail(
  toEmail: string,
  data: NoveltyApprovedEmailData
) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP credentials not configured, skipping email notification')
    return
  }

  const statusText = data.status === 'APPROVED' ? 'Aprobada' : 'Rechazada'
  const statusColor = data.status === 'APPROVED' ? '#10b981' : '#ef4444'
  const statusEmoji = data.status === 'APPROVED' ? '✅' : '❌'

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${statusColor}; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
          .detail { margin: 10px 0; }
          .detail strong { display: inline-block; min-width: 150px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #000; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${statusEmoji} Novedad ${statusText}</h1>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>Tu novedad ha sido <strong>${statusText.toLowerCase()}</strong>:</p>

            <div class="detail">
              <strong>Tipo de Novedad:</strong> ${data.noveltyTypeName}
            </div>
            <div class="detail">
              <strong>Estado:</strong> ${statusText}
            </div>
            <div class="detail">
              <strong>Autorizado por:</strong> ${data.approverName}
            </div>

            <div style="text-align: center;">
              <a href="${data.webAppUrl}/novelties" class="button">Ver Mis Novedades</a>
            </div>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no responder.</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    await transporter.sendMail({
      from: `"Checkpoint App" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `Novedad ${statusText}: ${data.noveltyTypeName}`,
      html: htmlContent,
    })
    console.log(`Email de novedad ${statusText.toLowerCase()} enviado a:`, toEmail)
  } catch (error) {
    console.error('Error al enviar email de status de novedad:', error)
  }
}
