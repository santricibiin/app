#!/bin/bash

# ══════════════════════════════════════════════════════════════════════════════
#  BOT TELEGRAM - AUTO DEPLOY SCRIPT
#  Script otomatis install & setup bot di VPS (Ubuntu/Debian)
# ══════════════════════════════════════════════════════════════════════════════

set -e

# Warna
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Path default
APP_DIR="/root/app"
BACKUP_DIR="/root/app"
BACKUP_FILE="backup.sql"

# ══════════════════════════════════════════════════════════════════════════════
#  FUNGSI UTILITAS
# ══════════════════════════════════════════════════════════════════════════════

print_header() {
    clear
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║          BOT TELEGRAM - AUTO DEPLOY SCRIPT                  ║"
    echo "║          VPS Installer & Manager                            ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}[✓] $1${NC}"
}

print_info() {
    echo -e "${BLUE}[i] $1${NC}"
}

print_warn() {
    echo -e "${YELLOW}[!] $1${NC}"
}

print_error() {
    echo -e "${RED}[✗] $1${NC}"
}

print_separator() {
    echo -e "${CYAN}──────────────────────────────────────────────────────────────${NC}"
}

# ══════════════════════════════════════════════════════════════════════════════
#  MENU UTAMA
# ══════════════════════════════════════════════════════════════════════════════

show_menu() {
    print_header
    echo -e "${YELLOW}  Pilih menu:${NC}"
    echo ""
    echo -e "  ${GREEN}1)${NC} Install Fresh (Setup lengkap dari awal)"
    echo -e "  ${GREEN}2)${NC} Restore Backup Database"
    echo -e "  ${GREEN}3)${NC} Restart Bot (PM2)"
    echo -e "  ${GREEN}4)${NC} Stop Bot (PM2)"
    echo -e "  ${GREEN}5)${NC} Lihat Log Bot"
    echo -e "  ${GREEN}6)${NC} Update Bot (Git Pull & Restart)"
    echo -e "  ${GREEN}7)${NC} Uninstall Bot"
    echo -e "  ${GREEN}0)${NC} Keluar"
    echo ""
    print_separator
    read -p "  Pilihan [0-7]: " choice
    echo ""

    case $choice in
        1) install_fresh ;;
        2) restore_backup ;;
        3) restart_bot ;;
        4) stop_bot ;;
        5) view_logs ;;
        6) update_bot ;;
        7) uninstall_bot ;;
        0) echo -e "${GREEN}Bye!${NC}"; exit 0 ;;
        *) echo -e "${RED}Pilihan tidak valid${NC}"; sleep 1; show_menu ;;
    esac
}

# ══════════════════════════════════════════════════════════════════════════════
#  1) INSTALL FRESH
# ══════════════════════════════════════════════════════════════════════════════

install_fresh() {
    print_header
    echo -e "${YELLOW}  ═══ INSTALL FRESH ═══${NC}"
    echo ""

    # ─── Input dari user ───
    print_separator
    echo -e "${CYAN}  Masukkan konfigurasi bot:${NC}"
    echo ""

    read -p "  Token Bot Telegram: " BOT_TOKEN
    if [ -z "$BOT_TOKEN" ]; then
        print_error "Token bot wajib diisi!"
        sleep 2; show_menu; return
    fi

    read -p "  ID Telegram Owner: " OWNER_ID
    if [ -z "$OWNER_ID" ]; then
        print_error "Owner ID wajib diisi!"
        sleep 2; show_menu; return
    fi

    read -p "  Domain/IP VPS (untuk webhook, contoh: https://bot.domain.com): " WEBHOOK_URL
    if [ -z "$WEBHOOK_URL" ]; then
        print_warn "Webhook URL kosong, bot akan jalan mode polling"
    fi

    read -p "  Port webhook Pakasir (default: 3000): " BOT_PORT
    BOT_PORT=${BOT_PORT:-3000}

    read -p "  Port web admin panel (default: 3001): " WEB_PORT
    WEB_PORT=${WEB_PORT:-3001}

    read -p "  Password login web admin (default: admin123): " ADMIN_PASSWORD
    ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin123}

    read -p "  Password MySQL (buat baru): " MYSQL_PASS
    if [ -z "$MYSQL_PASS" ]; then
        MYSQL_PASS="BotTelegram123!"
        print_warn "Password MySQL default: $MYSQL_PASS"
    fi

    DB_NAME="telegram_bot"
    DB_USER="root"

    echo ""
    print_separator
    echo -e "${YELLOW}  Konfigurasi:${NC}"
    echo -e "  Bot Token   : ${BOT_TOKEN:0:10}..."
    echo -e "  Owner ID    : $OWNER_ID"
    echo -e "  Webhook     : ${WEBHOOK_URL:-Polling Mode}"
    echo -e "  Port Webhook: $BOT_PORT"
    echo -e "  Port Web    : $WEB_PORT"
    echo -e "  Admin Pass  : ${ADMIN_PASSWORD:0:3}***"
    echo -e "  DB Name     : $DB_NAME"
    echo -e "  MySQL Pass  : ${MYSQL_PASS:0:3}***"
    print_separator
    echo ""
    read -p "  Lanjutkan install? (y/n): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        show_menu; return
    fi

    echo ""
    print_info "Memulai instalasi..."
    echo ""

    # ─── Update system ───
    print_info "Updating system packages..."
    apt update -y && apt upgrade -y
    print_success "System updated"

    # ─── Install dependencies ───
    print_info "Installing essential packages..."
    apt install -y curl wget git ufw software-properties-common
    print_success "Essential packages installed"

    # ─── Install Node.js 20 LTS ───
    print_info "Installing Node.js 20 LTS..."
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt install -y nodejs
    fi
    print_success "Node.js $(node -v) installed"

    # ─── Install PM2 ───
    print_info "Installing PM2..."
    npm install -g pm2
    print_success "PM2 installed"

    # ─── Install MySQL ───
    print_info "Installing MySQL Server..."
    export DEBIAN_FRONTEND=noninteractive
    apt install -y mysql-server
    systemctl start mysql
    systemctl enable mysql

    # Set MySQL root password
    mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_PASS}';" 2>/dev/null || true
    mysql -e "FLUSH PRIVILEGES;" 2>/dev/null || true
    print_success "MySQL installed & configured"

    # ─── Create database ───
    print_info "Creating database..."
    mysql -u root -p"${MYSQL_PASS}" -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};" 2>/dev/null
    print_success "Database '${DB_NAME}' created"

    # ─── Setup app directory ───
    print_info "Setting up application..."
    mkdir -p "$APP_DIR"

    # Copy files jika script dijalankan dari folder project
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ -f "$SCRIPT_DIR/index.js" ]; then
        cp -r "$SCRIPT_DIR"/* "$APP_DIR"/ 2>/dev/null || true
        cp -r "$SCRIPT_DIR"/.env "$APP_DIR"/ 2>/dev/null || true
    fi

    cd "$APP_DIR"

    # ─── Install node modules ───
    print_info "Installing node dependencies..."
    npm install --production
    print_success "Dependencies installed"

    # ─── Create .env file ───
    print_info "Creating .env configuration..."
    cat > "$APP_DIR/.env" << EOF
# Bot Configuration
BOT_TOKEN=${BOT_TOKEN}
OWNER_ID=${OWNER_ID}

# Database Configuration
DB_HOST=localhost
DB_USER=${DB_USER}
DB_PASS=${MYSQL_PASS}
DB_NAME=${DB_NAME}

# Server Configuration
PORT=${BOT_PORT}
WEBHOOK_URL=${WEBHOOK_URL}

# Web Admin Panel
WEB_PORT=${WEB_PORT}
ADMIN_PASSWORD=${ADMIN_PASSWORD}

# Node Environment
NODE_ENV=production
EOF
    print_success ".env file created"

    # ─── Run database migration ───
    print_info "Running database migration..."
    if [ -f "$APP_DIR/database/schema.sql" ]; then
        mysql -u root -p"${MYSQL_PASS}" "$DB_NAME" < "$APP_DIR/database/schema.sql" 2>/dev/null
        print_success "Database schema imported"
    fi

    if [ -f "$APP_DIR/database/migrate.js" ]; then
        cd "$APP_DIR" && node database/migrate.js 2>/dev/null || true
        print_success "Migration script executed"
    fi

    # ─── Setup Firewall ───
    print_info "Configuring firewall..."
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow ${BOT_PORT}/tcp
    ufw allow ${WEB_PORT}/tcp
    ufw --force enable
    print_success "Firewall configured (ports: 22, 80, 443, ${BOT_PORT}, ${WEB_PORT})"

    # ─── Start with PM2 ───
    print_info "Starting bot with PM2..."
    cd "$APP_DIR"
    pm2 delete telegram-bot 2>/dev/null || true
    pm2 start index.js --name "telegram-bot" --env production
    pm2 save
    pm2 startup systemd -u root --hp /root 2>/dev/null || true
    print_success "Bot started with PM2"

    # ─── Done ───
    echo ""
    print_separator
    echo -e "${GREEN}"
    echo "  ╔══════════════════════════════════════════════════════╗"
    echo "  ║         INSTALASI BERHASIL! ✓                       ║"
    echo "  ╠══════════════════════════════════════════════════════╣"
    echo "  ║  App Dir    : $APP_DIR"
    echo "  ║  Bot Status : Running (PM2)"
    echo "  ║  DB Name    : $DB_NAME"
    echo "  ║  Webhook    : Port $BOT_PORT"
    echo "  ║  Web Admin  : Port $WEB_PORT"
    echo "  ╠══════════════════════════════════════════════════════╣"
    echo "  ║  Commands:                                          ║"
    echo "  ║  pm2 logs telegram-bot   → Lihat log               ║"
    echo "  ║  pm2 restart telegram-bot → Restart bot             ║"
    echo "  ║  pm2 stop telegram-bot   → Stop bot                ║"
    echo "  ║                                                     ║"
    echo "  ║  Web Admin: http://IP_VPS:${WEB_PORT}/login         "
    echo "  ╚══════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    print_separator
    echo ""
    read -p "  Tekan Enter untuk kembali ke menu..." _
    show_menu
}

# ══════════════════════════════════════════════════════════════════════════════
#  2) RESTORE BACKUP
# ══════════════════════════════════════════════════════════════════════════════

restore_backup() {
    print_header
    echo -e "${YELLOW}  ═══ RESTORE BACKUP DATABASE ═══${NC}"
    echo ""

    # Cari file backup
    DEFAULT_BACKUP="$APP_DIR/$BACKUP_FILE"

    echo -e "  ${CYAN}Lokasi default: ${DEFAULT_BACKUP}${NC}"
    echo ""
    read -p "  Path file backup SQL (Enter = default): " CUSTOM_PATH

    if [ -n "$CUSTOM_PATH" ]; then
        RESTORE_FILE="$CUSTOM_PATH"
    else
        RESTORE_FILE="$DEFAULT_BACKUP"
    fi

    # Validasi file
    if [ ! -f "$RESTORE_FILE" ]; then
        print_error "File tidak ditemukan: $RESTORE_FILE"
        echo ""

        # Cari file .sql di APP_DIR
        print_info "Mencari file .sql di $APP_DIR..."
        SQL_FILES=$(find "$APP_DIR" -name "*.sql" -type f 2>/dev/null)

        if [ -n "$SQL_FILES" ]; then
            echo -e "  ${CYAN}File SQL yang ditemukan:${NC}"
            echo "$SQL_FILES" | nl -ba
            echo ""
            read -p "  Masukkan path file yang ingin direstore: " RESTORE_FILE
            if [ ! -f "$RESTORE_FILE" ]; then
                print_error "File tidak valid"
                sleep 2; show_menu; return
            fi
        else
            print_error "Tidak ada file .sql ditemukan"
            sleep 2; show_menu; return
        fi
    fi

    # Input MySQL credentials
    echo ""
    read -p "  Password MySQL root: " MYSQL_PASS
    read -p "  Nama database (default: telegram_bot): " DB_NAME
    DB_NAME=${DB_NAME:-telegram_bot}

    echo ""
    print_warn "PERINGATAN: Restore akan menimpa data yang ada di database '$DB_NAME'"
    read -p "  Lanjutkan? (y/n): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        show_menu; return
    fi

    echo ""
    print_info "Membuat database jika belum ada..."
    mysql -u root -p"${MYSQL_PASS}" -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};" 2>/dev/null

    print_info "Restoring backup dari: $RESTORE_FILE"
    mysql -u root -p"${MYSQL_PASS}" "$DB_NAME" < "$RESTORE_FILE" 2>/dev/null

    if [ $? -eq 0 ]; then
        print_success "Restore berhasil!"
        echo ""

        # Restart bot
        read -p "  Restart bot sekarang? (y/n): " restart
        if [ "$restart" = "y" ] || [ "$restart" = "Y" ]; then
            pm2 restart telegram-bot 2>/dev/null
            print_success "Bot di-restart"
        fi
    else
        print_error "Restore gagal! Cek password dan file backup"
    fi

    echo ""
    read -p "  Tekan Enter untuk kembali ke menu..." _
    show_menu
}

# ══════════════════════════════════════════════════════════════════════════════
#  3) RESTART BOT
# ══════════════════════════════════════════════════════════════════════════════

restart_bot() {
    print_header
    echo -e "${YELLOW}  ═══ RESTART BOT ═══${NC}"
    echo ""
    print_info "Restarting bot..."
    pm2 restart telegram-bot
    print_success "Bot berhasil di-restart"
    echo ""
    pm2 status telegram-bot
    echo ""
    read -p "  Tekan Enter untuk kembali ke menu..." _
    show_menu
}

# ══════════════════════════════════════════════════════════════════════════════
#  4) STOP BOT
# ══════════════════════════════════════════════════════════════════════════════

stop_bot() {
    print_header
    echo -e "${YELLOW}  ═══ STOP BOT ═══${NC}"
    echo ""
    print_warn "Bot akan dihentikan"
    read -p "  Yakin stop bot? (y/n): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        pm2 stop telegram-bot
        print_success "Bot dihentikan"
    fi
    echo ""
    read -p "  Tekan Enter untuk kembali ke menu..." _
    show_menu
}

# ══════════════════════════════════════════════════════════════════════════════
#  5) LIHAT LOG
# ══════════════════════════════════════════════════════════════════════════════

view_logs() {
    print_header
    echo -e "${YELLOW}  ═══ LOG BOT (50 baris terakhir) ═══${NC}"
    echo ""
    pm2 logs telegram-bot --lines 50 --nostream
    echo ""
    print_separator
    read -p "  Tekan Enter untuk kembali ke menu..." _
    show_menu
}

# ══════════════════════════════════════════════════════════════════════════════
#  6) UPDATE BOT
# ══════════════════════════════════════════════════════════════════════════════

update_bot() {
    print_header
    echo -e "${YELLOW}  ═══ UPDATE BOT ═══${NC}"
    echo ""

    cd "$APP_DIR"

    # Cek apakah ada git repo
    if [ -d ".git" ]; then
        print_info "Pulling latest code..."
        git pull origin main 2>/dev/null || git pull origin master 2>/dev/null
        print_info "Installing dependencies..."
        npm install --production
        print_info "Restarting bot..."
        pm2 restart telegram-bot
        print_success "Bot updated & restarted!"
    else
        print_warn "Tidak ada git repo di $APP_DIR"
        print_info "Upload file manual lalu restart"
        echo ""
        read -p "  Restart bot sekarang? (y/n): " confirm
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            npm install --production
            pm2 restart telegram-bot
            print_success "Bot restarted"
        fi
    fi

    echo ""
    read -p "  Tekan Enter untuk kembali ke menu..." _
    show_menu
}

# ══════════════════════════════════════════════════════════════════════════════
#  7) UNINSTALL BOT
# ══════════════════════════════════════════════════════════════════════════════

uninstall_bot() {
    print_header
    echo -e "${RED}  ═══ UNINSTALL BOT ═══${NC}"
    echo ""
    print_warn "Pilih level uninstall:"
    echo ""
    echo -e "  ${GREEN}1)${NC} Ringan  - Hapus bot dari PM2 saja (file tetap ada)"
    echo -e "  ${GREEN}2)${NC} Sedang  - Hapus bot + database + file aplikasi"
    echo -e "  ${GREEN}3)${NC} Total   - Hapus semua (termasuk Node.js, MySQL, PM2)"
    echo -e "  ${GREEN}0)${NC} Batal"
    echo ""
    read -p "  Pilihan [0-3]: " uninstall_level

    case $uninstall_level in
        0) show_menu; return ;;
        1)
            echo ""
            print_info "Menghapus bot dari PM2..."
            pm2 stop telegram-bot 2>/dev/null || true
            pm2 delete telegram-bot 2>/dev/null || true
            pm2 save
            print_success "Bot dihapus dari PM2"
            print_info "File di $APP_DIR masih tersimpan"
            ;;
        2)
            echo ""
            read -p "  Password MySQL root: " MYSQL_PASS
            echo ""
            print_info "Menghapus bot dari PM2..."
            pm2 stop telegram-bot 2>/dev/null || true
            pm2 delete telegram-bot 2>/dev/null || true
            pm2 save
            print_success "Bot dihapus dari PM2"

            print_info "Menghapus database..."
            mysql -u root -p"${MYSQL_PASS}" -e "DROP DATABASE IF EXISTS telegram_bot;" 2>/dev/null
            print_success "Database dihapus"

            print_info "Menghapus file aplikasi di $APP_DIR..."
            rm -rf "$APP_DIR"
            print_success "File aplikasi dihapus"
            ;;
        3)
            echo ""
            print_error "╔══════════════════════════════════════════════════════╗"
            print_error "║  PERINGATAN: Ini akan menghapus SEMUA komponen:     ║"
            print_error "║  - Bot & file aplikasi                              ║"
            print_error "║  - Database MySQL & MySQL Server                    ║"
            print_error "║  - Node.js & PM2                                    ║"
            print_error "║  Pastikan tidak ada service lain yang pakai!        ║"
            print_error "╚══════════════════════════════════════════════════════╝"
            echo ""
            read -p "  Ketik 'HAPUS SEMUA' untuk konfirmasi: " confirm_total
            if [ "$confirm_total" != "HAPUS SEMUA" ]; then
                print_info "Dibatalkan"
                sleep 2; show_menu; return
            fi

            echo ""
            print_info "Menghapus bot dari PM2..."
            pm2 stop telegram-bot 2>/dev/null || true
            pm2 delete telegram-bot 2>/dev/null || true
            pm2 kill 2>/dev/null || true
            print_success "PM2 process dihapus"

            print_info "Menghapus file aplikasi..."
            rm -rf "$APP_DIR"
            print_success "File aplikasi dihapus"

            print_info "Menghapus MySQL Server..."
            systemctl stop mysql 2>/dev/null || true
            apt purge -y mysql-server mysql-client mysql-common 2>/dev/null || true
            apt autoremove -y 2>/dev/null || true
            rm -rf /var/lib/mysql /etc/mysql
            print_success "MySQL dihapus"

            print_info "Menghapus PM2..."
            npm uninstall -g pm2 2>/dev/null || true
            print_success "PM2 dihapus"

            print_info "Menghapus Node.js..."
            apt purge -y nodejs 2>/dev/null || true
            apt autoremove -y 2>/dev/null || true
            rm -f /etc/apt/sources.list.d/nodesource.list 2>/dev/null
            print_success "Node.js dihapus"

            echo ""
            print_success "Semua komponen berhasil dihapus!"
            ;;
        *)
            print_error "Pilihan tidak valid"
            sleep 1; show_menu; return
            ;;
    esac

    echo ""
    read -p "  Tekan Enter untuk kembali ke menu..." _
    show_menu
}

# ══════════════════════════════════════════════════════════════════════════════
#  CEK ROOT & JALANKAN
# ══════════════════════════════════════════════════════════════════════════════

# Cek root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}[✗] Script harus dijalankan sebagai root!${NC}"
    echo -e "${YELLOW}    Gunakan: sudo bash deploy.sh${NC}"
    exit 1
fi

# Jalankan menu
show_menu
