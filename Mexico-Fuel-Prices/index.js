const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const INEGI_API_URL = 'https://gaia.inegi.org.mx/sakbe_v3.1/combustible';
const INEGI_API_KEY = '6Gwy3bY5-mG1W-2Jmk-ViXt-jCS7lbiAbeBI';
const RECIPIENT_EMAIL = 'reynaldo.orozco@olpega.net';

// Generic SMTP configuration (defaults for Gmail)
const SMTP_USER = process.env.SMTP_USER || process.env.GMAIL_USER || 'your-email@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || 'your-app-password';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT, 10) || 465;
const SMTP_SECURE = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true;

/**
 * Fetches fuel prices from INEGI API
 * @returns {Promise<Object>} API response data
 */
async function fetchFuelPrices() {
    try {
        console.log('🔄 Fetching fuel prices from INEGI API...');
        
        const response = await fetch(INEGI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'User-Agent': 'FuelPriceMonitor/1.0'
            },
            body: `type=json&key=${INEGI_API_KEY}`
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Successfully fetched fuel prices data');
        return data;
    } catch (error) {
        console.error('❌ Error fetching fuel prices:', error.message);
        throw error;
    }
}

/**
 * Extracts and formats fuel price data
 * @param {Object} apiData - Raw API response
 * @returns {Array} Formatted fuel price data
 */
function extractFuelPrices(apiData) {
    try {
        console.log('🔄 Processing fuel price data...');
        
        if (!apiData || !apiData.data || !Array.isArray(apiData.data)) {
            throw new Error('Invalid API response structure');
        }

        const fuelPrices = [];

        // Process each fuel type from the API
        apiData.data.forEach(fuel => {
            if (fuel.tipo && fuel.costo && !isNaN(parseFloat(fuel.costo))) {
                const fuelType = fuel.tipo.trim();
                const price = parseFloat(fuel.costo);
                
                fuelPrices.push({
                    type: fuelType,
                    averagePrice: price.toFixed(2),
                    minPrice: price.toFixed(2), // API provides average prices, so min/max are the same
                    maxPrice: price.toFixed(2),
                    stationCount: 'N/A' // API doesn't provide station count for averages
                });
            }
        });

        // Sort by fuel type name
        fuelPrices.sort((a, b) => a.type.localeCompare(b.type));
        
        console.log(`✅ Processed ${fuelPrices.length} fuel types from API data`);
        return fuelPrices;
    } catch (error) {
        console.error('❌ Error processing fuel price data:', error.message);
        throw error;
    }
}

/**
 * Genera el HTML del correo con solo la columna “Precio Promedio”
 * @param {Array} fuelPrices - datos procesados
 * @returns {String} HTML completo
 */
function generateEmailHTML(fuelPrices) {
    console.log('🔄 Generating HTML email content…');

    const currentDate = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Crea las filas de la tabla (solo tipo + precio promedio)
    const tableRows = fuelPrices.length
        ? fuelPrices.map(fuel => `
            <tr>
                <td style="padding:12px;border-bottom:1px solid #e0e0e0;font-weight:500;">
                    ${fuel.type}
                </td>
                <td style="padding:12px;border-bottom:1px solid #e0e0e0;text-align:right;font-weight:600;color:#2c5530;">
                    $${fuel.averagePrice}
                </td>
            </tr>
          `).join('')
        : `
            <tr>
                <td colspan="2" style="text-align:center;padding:20px;color:#666;font-style:italic;">
                    No hay datos de precios disponibles en este momento.
                </td>
            </tr>
          `;

    // Leer plantilla HTML y reemplazar marcadores
    const templatePath = path.join(__dirname, 'templates', 'email.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    htmlContent = htmlContent.replace('${currentDate}', currentDate);
    htmlContent = htmlContent.replace('${tableRows}', tableRows);

    console.log('✅ HTML email content generated successfully');
    return htmlContent;
}

/**
 * Sends email using configurable SMTP
 * @param {String} htmlContent - HTML email content
 * @param {Array} fuelPrices - Fuel price data for subject line
 */
async function sendEmail(htmlContent, fuelPrices) {
    try {
        console.log('🔄 Configuring email transport...');

        // Validate credentials
        if (!SMTP_USER || SMTP_USER === 'your-email@gmail.com') {
            throw new Error('SMTP user not configured. Please set SMTP_USER (or GMAIL_USER) environment variable.');
        }

        if (!SMTP_PASS || SMTP_PASS === 'your-app-password') {
            throw new Error('SMTP password not configured. Please set SMTP_PASS (or GMAIL_APP_PASSWORD) environment variable.');
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_SECURE,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS
            }
        });

        // Verify connection
        await transporter.verify();
        console.log(`✅ SMTP connection to ${SMTP_HOST} verified`);

        // Generate subject line
        const currentDate = new Date().toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const fuelCount = fuelPrices.length;
        const subject = `📊 Reporte Precios Combustibles - ${currentDate} (${fuelCount} tipos disponibles)`;

        // Email options
        const mailOptions = {
            from: {
                name: 'Sistema de Monitoreo de Precios',
                address: SMTP_USER
            },
            to: RECIPIENT_EMAIL,
            subject: subject,
            html: htmlContent,
            // Add plain text version as fallback
            text: `Reporte de Precios de Combustibles - ${currentDate}\n\n` +
                  `Se han procesado ${fuelCount} tipos de combustibles.\n` +
                  `Para ver el reporte completo, consulte la versión HTML de este email.\n\n` +
                  `Datos proporcionados por INEGI.`
        };

        console.log(`🔄 Sending email to ${RECIPIENT_EMAIL}...`);
        
        // Send email
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Email sent successfully!');
        console.log(`📧 Message ID: ${info.messageId}`);
        console.log(`📫 Recipient: ${RECIPIENT_EMAIL}`);
        console.log(`📋 Subject: ${subject}`);
        
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        
        // Provide helpful error messages
        if (error.message.includes('Invalid login')) {
            console.error('💡 Tip: Make sure you are using the correct SMTP credentials or an app password.');
            console.error('💡 Many providers (including Gmail and Zoho) require an application-specific password when 2FA is enabled.');
        }
        
        throw error;
    }
}

/**
 * Main function to orchestrate the fuel price reporting process
 */
async function main() {
    console.log('🚀 Starting Fuel Price Monitor...\n');
    
    try {
        // Step 1: Fetch data from INEGI API
        const apiData = await fetchFuelPrices();
        
        // Step 2: Extract and process fuel prices
        const fuelPrices = extractFuelPrices(apiData);
        
        if (fuelPrices.length === 0) {
            console.log('⚠️  No fuel price data available, but continuing with empty report...');
        } else {
            console.log(`📊 Found data for ${fuelPrices.length} fuel types:`);
            fuelPrices.forEach(fuel => {
                console.log(`   • ${fuel.type}: $${fuel.averagePrice} promedio`);
            });
        }
        
        // Step 3: Generate HTML email
        const htmlContent = generateEmailHTML(fuelPrices);
        
        // Step 4: Send email
        await sendEmail(htmlContent, fuelPrices);
        
        console.log('\n🎉 Fuel price report completed successfully!');
        
    } catch (error) {
        console.error('\n💥 Application failed:', error.message);
        
        // Exit with error code
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:', reason);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Run the application
if (require.main === module) {
    main();
}

module.exports = { fetchFuelPrices, extractFuelPrices, generateEmailHTML, sendEmail };
