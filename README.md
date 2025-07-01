# 🔥 Fuel Price Monitor - Mexico

A Node.js automation tool that fetches current fuel prices from INEGI's official API and sends formatted email reports via any SMTP service (Gmail, Zoho, etc.).

## 📋 Features

- **Automated Data Fetching**: Retrieves real-time fuel prices from INEGI API
- **Comprehensive Analysis**: Calculates average, minimum, and maximum prices per fuel type
- **Professional Email Reports**: Generates clean HTML email templates with fuel price tables
- **Editable Template**: Customize the look in `templates/email.html`
- **SMTP Integration**: Sends reports through your preferred mail provider (Gmail, Zoho, etc.) using secure credentials
- **Error Handling**: Robust error handling for API failures and email delivery issues
- **Environment Variables**: Secure credential management with environment variables

## 🚀 Quick Start

### Prerequisites

- Node.js (v14+ recommended)
- An SMTP account (Gmail, Zoho, etc.)
- If your provider uses 2FA, generate an app password for SMTP access

### Installation

1. **Clone or download the project files**

2. **Install dependencies**:
```bash
npm install node-fetch@2 nodemailer dotenv
```

3. **Configure environment variables**

Create a `.env` file with your SMTP settings. Example for Zoho:

```env
SMTP_USER=reynaldo.orozco@opsafy.com
SMTP_PASS=tu_app_password
SMTP_HOST=smtp.zoho.com
SMTP_PORT=465
SMTP_SECURE=true
```

4. **Run the script**:
```bash
node index.js
```
