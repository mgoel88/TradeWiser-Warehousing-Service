@echo off
REM TradeWiser Platform - Easy Docker Setup Script for Windows

echo.
echo 🚀 TradeWiser Platform - Docker Setup
echo ======================================

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.docker .env
    echo ✅ .env file created with default configuration.
) else (
    echo ✅ .env file already exists.
    echo 💡 If you're having issues, you can reset it with: copy .env.docker .env
)

REM Validate environment file
if exist .env (
    echo 🔍 Validating environment configuration...
    findstr /C:"PGDATABASE=tradewiser_db" .env >nul && findstr /C:"PGUSER=tradewiser" .env >nul
    if %errorlevel% equ 0 (
        echo ✅ Environment configuration looks good.
    ) else (
        echo ⚠️  Environment configuration might be incomplete. Using defaults.
        copy .env.docker .env
    )
)

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist uploads mkdir uploads
if not exist logs mkdir logs
if not exist db mkdir db

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose down 2>nul

REM Pull latest images
echo 📦 Pulling latest images...
docker-compose pull

REM Build and start services
echo 🏗️  Building and starting services...
docker-compose up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check service health
echo 🔍 Checking service health...
docker-compose ps

REM Show logs
echo 📋 Service logs:
docker-compose logs --tail=20

echo.
echo 🎉 TradeWiser Platform is now running!
echo ======================================
echo 🌐 Web Application: http://localhost:5000
echo 🗄️  Database: localhost:5432
echo 🔄 Redis: localhost:6379
echo.
echo 🔐 Default Login:
echo    Username: testuser
echo    Password: password123
echo.
echo 📊 Useful commands:
echo    View logs: docker-compose logs -f
echo    Stop services: docker-compose down
echo    Restart services: docker-compose restart
echo    View status: docker-compose ps
echo.
echo 📚 For more information, check the README.md file.
echo.
pause