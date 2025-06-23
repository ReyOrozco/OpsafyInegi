# 🔥 Fuel Price Monitor - Mexico

A Node.js automation tool that fetches current fuel prices from INEGI's official API and sends formatted email reports via Gmail SMTP.

## 📋 Features

- **Automated Data Fetching**: Retrieves real-time fuel prices from INEGI API
- **Comprehensive Analysis**: Calculates average, minimum, and maximum prices per fuel type
- **Professional Email Reports**: Generates clean HTML email templates with fuel price tables
- **Gmail Integration**: Sends reports via Gmail SMTP using secure App Passwords
- **Error Handling**: Robust error handling for API failures and email delivery issues
- **Environment Variables**: Secure credential management with environment variables

## 🚀 Quick Start

### Prerequisites

- Node.js (v14+ recommended)
- Gmail account with 2-Factor Authentication enabled
- Gmail App Password (see setup instructions below)

### Installation

1. **Clone or download the project files**

2. **Install dependencies**:
```bash
npm install node-fetch@2 nodemailer dotenv
