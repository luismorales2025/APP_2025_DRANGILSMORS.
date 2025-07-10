const nodemailer = require('nodemailer');
const multiparty = require('multiparty');
const fs = require('fs');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  return new Promise((resolve, reject) => {
    const form = new multiparty.Form();

    form.parse(event, async (err, fields, files) => {
      if (err) {
        console.error('Error al parsear el formulario:', err);
        return resolve({
          statusCode: 500,
          body: JSON.stringify({ error: 'Error al procesar el formulario' }),
        });
      }

      const nombre = fields.nombre?.[0] || 'Cliente sin nombre';
      const asunto = fields.asunto?.[0] || 'Sin asunto';
      const archivo = files.archivo?.[0];

      const smtpUser = '91b73a003@smtp-brevo.com';
      const apiKey = 'njGHbxB5M0ldVazQ'; // tu contraseña SMTP real de Brevo

      const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        auth: {
          user: smtpUser,
          pass: apiKey,
        },
      });

      const mailOptions = {
        from: `"Carrito Web" <${smtpUser}>`,
        to: 'drangilmorales05@gmail.com', // tu correo donde recibís los comprobantes
        subject: `🧾 Comprobante de pago: ${asunto}`,
        text: `Hola Luis,\n\nEl cliente ${nombre} ha enviado un comprobante de pago.`,
        attachments: archivo ? [
          {
            filename: archivo.originalFilename,
            path: archivo.path,
            contentType: archivo.headers['content-type'],
          },
        ] : [],
      };

      try {
        await transporter.sendMail(mailOptions);

        // ✅ Borra archivo temporal después del envío
        if (archivo?.path) {
          fs.unlink(archivo.path, () => {});
        }

        resolve({
          statusCode: 200,
          body: JSON.stringify({ ok: true }),
        });
      } catch (error) {
        console.error('Error al enviar el correo:', error);
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: 'No se pudo enviar el correo' }),
        });
      }
    });
  });
};
