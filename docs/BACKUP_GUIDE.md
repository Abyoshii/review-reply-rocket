
# Руководство по резервному копированию и восстановлению

## 1. Введение

Данное руководство описывает процедуры создания резервных копий настроек, данных и конфигурации системы управления отзывами Wildberries, а также методы восстановления при сбоях.

## 2. Компоненты для резервного копирования

### 2.1 Критически важные данные

1. **Настройки автоответчика** (localStorage)
   - API-ключи
   - Конфигурация моделей ИИ
   - Пользовательские промпты
   - Профили автоответчика

2. **Кэш товарных карточек** (localStorage)
   - Информация о товарах
   - Кэш изображений товаров
   - Артикулы и категории

3. **Пользовательские настройки** (localStorage)
   - Фильтры по умолчанию
   - Предпочтения интерфейса
   - Сохраненные запросы

### 2.2 Дополнительные компоненты

1. **Статические файлы**
   - Каталог `dist/` (продакшн сборка)
   - Конфигурационные файлы
   - Кастомные CSS/JS файлы

2. **Логи и метрики**
   - Файлы логов ошибок
   - Статистика работы автоответчика
   - История операций

## 3. Создание резервных копий

### 3.1 Экспорт настроек из localStorage

#### Автоматический скрипт для экспорта:

Создайте файл `backup-settings.js`:

```javascript
// Скрипт для экспорта настроек из localStorage
function exportSettings() {
    const settingsKeys = [
        'auto_response_settings',
        'auto_response_active',
        'user_preferences',
        'api_tokens',
        'filter_defaults',
        'product_cache'
    ];
    
    const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {}
    };
    
    settingsKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
            try {
                backup.data[key] = JSON.parse(value);
            } catch (e) {
                backup.data[key] = value;
            }
        }
    });
    
    // Создание и скачивание файла
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wb-settings-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Настройки экспортированы успешно');
    return backup;
}

// Запуск экспорта
exportSettings();
```

#### Использование через консоль браузера:

1. Откройте сайт в браузере
2. Нажмите **F12** для открытия инструментов разработчика
3. Перейдите во вкладку **Console**
4. Вставьте и выполните скрипт выше
5. Файл с настройками автоматически скачается

### 3.2 Ручной экспорт через интерфейс

#### Экспорт настроек автоответчика:

1. Перейдите в **Настройки** → **Автоответчик**
2. Нажмите **"📥 Экспорт настроек"**
3. Выберите компоненты для экспорта:
   - ✅ Параметры модели ИИ
   - ✅ Пользовательские промпты
   - ✅ Профили автоответчика
   - ⬜ API-ключи (⚠️ только если необходимо)
4. Нажмите **"Скачать файл"**
5. Сохраните файл в безопасном месте

#### Экспорт конфигурации поставок:

1. **Автосборка** → **Настройки**
2. **"📤 Экспорт конфигурации"**
3. Выберите:
   - ✅ Правила категоризации товаров
   - ✅ Шаблоны названий поставок
   - ✅ Настройки складов
4. Сохраните JSON-файл

### 3.3 Backup файловой системы

#### Для development окружения:

```bash
# Создание архива проекта
tar -czf wb-backup-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=dist \
  ./asterion-wb/

# Копирование на внешний диск
cp wb-backup-*.tar.gz /path/to/external/drive/
```

#### Для production сборки:

```bash
# Сохранение dist каталога
cp -r dist/ /backup/wb-dist-$(date +%Y%m%d)/

# Архивирование с компрессией
tar -czf wb-dist-backup-$(date +%Y%m%d).tar.gz dist/
```

### 3.4 Облачное резервное копирование

#### Google Drive / Dropbox:

1. Установите клиент синхронизации
2. Создайте папку `/WB-Backups/`
3. Настройте автоматическую синхронизацию:
   ```bash
   # Скрипт для автоматического backup
   #!/bin/bash
   BACKUP_DIR="/path/to/google-drive/WB-Backups"
   DATE=$(date +%Y%m%d_%H%M)
   
   # Создание папки с датой
   mkdir -p "$BACKUP_DIR/$DATE"
   
   # Копирование критичных файлов
   cp -r dist/ "$BACKUP_DIR/$DATE/dist/"
   cp *.json "$BACKUP_DIR/$DATE/"
   
   echo "Backup completed: $DATE"
   ```

#### GitHub как backup хранилище:

```bash
# Создание отдельной ветки для backups
git checkout -b backup-$(date +%Y%m%d)

# Добавление файлов настроек
git add backup-files/
git commit -m "Backup settings $(date +%Y%m%d)"

# Отправка в удаленный репозиторий
git push origin backup-$(date +%Y%m%d)
```

## 4. Восстановление из резервных копий

### 4.1 Восстановление настроек localStorage

#### Автоматический скрипт для импорта:

```javascript
// Скрипт для импорта настроек в localStorage
function importSettings(backupData) {
    if (!backupData || !backupData.data) {
        console.error('Некорректный формат файла backup');
        return false;
    }
    
    let importedCount = 0;
    
    Object.keys(backupData.data).forEach(key => {
        try {
            const value = typeof backupData.data[key] === 'object' 
                ? JSON.stringify(backupData.data[key])
                : backupData.data[key];
                
            localStorage.setItem(key, value);
            importedCount++;
            console.log(`Imported: ${key}`);
        } catch (e) {
            console.error(`Failed to import ${key}:`, e);
        }
    });
    
    console.log(`Successfully imported ${importedCount} settings`);
    alert(`Настройки восстановлены: ${importedCount} элементов`);
    
    // Перезагрузка страницы для применения настроек
    window.location.reload();
    
    return true;
}

// Для использования:
// 1. Загрузите backup-файл
// 2. Скопируйте содержимое файла
// 3. Выполните: importSettings(JSON.parse('содержимое_файла'))
```

#### Импорт через загрузку файла:

```javascript
// Функция для загрузки и импорта файла
function loadBackupFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const backupData = JSON.parse(e.target.result);
                importSettings(backupData);
            } catch (err) {
                console.error('Ошибка чтения файла:', err);
                alert('Файл поврежден или имеет неправильный формат');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// Запуск импорта
loadBackupFile();
```

### 4.2 Восстановление через интерфейс

#### Импорт настроек автоответчика:

1. Перейдите в **Настройки** → **Автоответчик**
2. Нажмите **"📤 Импорт настроек"**
3. Выберите файл backup (`.json`)
4. Отметьте компоненты для восстановления:
   - ✅ Параметры модели ИИ
   - ✅ Пользовательские промпты
   - ✅ Профили автоответчика
   - ⚠️ API-ключи (только если они в backup)
5. Нажмите **"Импортировать"**
6. Перезагрузите страницу для применения изменений

#### Восстановление конфигурации поставок:

1. **Автосборка** → **Настройки**
2. **"📥 Импорт конфигурации"**
3. Загрузите JSON-файл с настройками
4. Проверьте предварительный просмотр
5. Подтвердите импорт

### 4.3 Восстановление файловой системы

#### Восстановление development окружения:

```bash
# Извлечение архива
tar -xzf wb-backup-20241220.tar.gz

# Переход в папку проекта
cd asterion-wb/

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev
```

#### Восстановление production сборки:

```bash
# Извлечение архива dist
tar -xzf wb-dist-backup-20241220.tar.gz

# Замена текущей сборки
rm -rf dist/
mv backup-dist/ dist/

# Перезапуск веб-сервера
sudo systemctl restart nginx
```

### 4.4 Восстановление при полной потере данных

#### Пошаговый план восстановления:

1. **Подготовка окружения**:
   ```bash
   # Клонирование репозитория
   git clone https://github.com/your-org/asterion-wb.git
   cd asterion-wb
   
   # Установка зависимостей
   npm install
   ```

2. **Восстановление настроек**:
   - Загрузите последний backup-файл настроек
   - Выполните импорт через консоль браузера
   - Проверьте корректность API-ключей

3. **Восстановление конфигурации**:
   - Импортируйте профили автоответчика
   - Настройте правила категоризации товаров
   - Восстановите пользовательские промпты

4. **Тестирование функциональности**:
   - Проверьте подключение к API Wildberries
   - Протестируйте генерацию ответов
   - Убедитесь в работе автоответчика

## 5. Автоматизация резервного копирования

### 5.1 Скрипт ежедневного backup

Создайте файл `daily-backup.sh`:

```bash
#!/bin/bash

# Конфигурация
BACKUP_DIR="/backup/wb-daily"
DATE=$(date +%Y%m%d)
RETENTION_DAYS=30

# Создание папки для backup
mkdir -p "$BACKUP_DIR/$DATE"

# Backup настроек (требует запущенного браузера)
echo "Создание backup настроек..."
node backup-localStorage.js > "$BACKUP_DIR/$DATE/settings.json"

# Backup файлов проекта
echo "Архивирование проекта..."
tar -czf "$BACKUP_DIR/$DATE/project.tar.gz" \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=dist \
  ./

# Backup production сборки
if [ -d "dist" ]; then
    echo "Backup production сборки..."
    cp -r dist/ "$BACKUP_DIR/$DATE/dist/"
fi

# Очистка старых backup (старше 30 дней)
echo "Очистка старых backup..."
find "$BACKUP_DIR" -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \;

echo "Daily backup completed: $DATE"
```

### 5.2 Cron задача для автоматического backup

```bash
# Добавление задачи в crontab
crontab -e

# Добавить строку (backup каждый день в 2:00 ночи):
0 2 * * * /path/to/daily-backup.sh >> /var/log/wb-backup.log 2>&1
```

### 5.3 Мониторинг backup процесса

Создайте файл `check-backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/backup/wb-daily"
TODAY=$(date +%Y%m%d)
YESTERDAY=$(date -d "yesterday" +%Y%m%d)

# Проверка сегодняшнего backup
if [ -d "$BACKUP_DIR/$TODAY" ]; then
    echo "✅ Today's backup exists: $TODAY"
else
    echo "❌ Today's backup missing: $TODAY"
    # Отправка уведомления (опционально)
    echo "Backup failed for $TODAY" | mail -s "WB Backup Alert" admin@company.com
fi

# Проверка размера backup
if [ -d "$BACKUP_DIR/$TODAY" ]; then
    SIZE=$(du -sh "$BACKUP_DIR/$TODAY" | cut -f1)
    echo "📦 Backup size: $SIZE"
fi

# Проверка целостности архивов
for archive in "$BACKUP_DIR/$TODAY"/*.tar.gz; do
    if [ -f "$archive" ]; then
        if tar -tzf "$archive" >/dev/null 2>&1; then
            echo "✅ Archive OK: $(basename $archive)"
        else
            echo "❌ Archive corrupted: $(basename $archive)"
        fi
    fi
done
```

## 6. Продакшн окружение

### 6.1 Настройка для Vercel

#### Переменные окружения:

```bash
# Загрузка переменных из Vercel
vercel env pull --environment=production

# Создание backup переменных окружения
vercel env ls --environment=production > env-backup.txt
```

#### Backup через GitHub Secrets:

1. Перейдите в настройки GitHub репозитория
2. **Settings** → **Secrets and variables** → **Actions**
3. Добавьте секреты:
   - `WB_API_TOKEN` — токен Wildberries
   - `OPENAI_API_KEY` — ключ OpenAI
   - `BACKUP_ENCRYPTION_KEY` — ключ для шифрования backup

#### GitHub Actions для автоматического backup:

Создайте файл `.github/workflows/backup.yml`:

```yaml
name: Daily Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Каждый день в 2:00 UTC
  workflow_dispatch:      # Ручной запуск

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '22'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Create backup
      run: |
        mkdir -p backup/$(date +%Y%m%d)
        
        # Backup конфигурации
        cp *.json backup/$(date +%Y%m%d)/
        
        # Создание архива
        tar -czf backup-$(date +%Y%m%d).tar.gz backup/
        
    - name: Upload to artifacts
      uses: actions/upload-artifact@v3
      with:
        name: wb-backup-$(date +%Y%m%d)
        path: backup-*.tar.gz
        retention-days: 30
```

### 6.2 Восстановление на продакшн

#### Восстановление переменных окружения:

```bash
# Установка переменных в Vercel
vercel env add WB_API_TOKEN production
vercel env add OPENAI_API_KEY production

# Применение изменений
vercel --prod
```

#### Rollback к предыдущей версии:

```bash
# Просмотр деплойментов
vercel ls

# Откат к конкретному деплойменту
vercel rollback [deployment-url] --prod
```

## 7. Проверка целостности backup

### 7.1 Тестирование восстановления

Создайте тестовый скрипт `test-restore.js`:

```javascript
// Тест восстановления настроек
async function testRestore(backupFile) {
    console.log('🧪 Testing backup restoration...');
    
    // Сохранение текущих настроек
    const currentSettings = {};
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        currentSettings[key] = localStorage.getItem(key);
    });
    
    try {
        // Загрузка и применение backup
        const backup = JSON.parse(backupFile);
        await importSettings(backup);
        
        // Проверка критических настроек
        const tests = [
            'auto_response_settings',
            'api_tokens',
            'user_preferences'
        ];
        
        let passed = 0;
        tests.forEach(test => {
            if (localStorage.getItem(test)) {
                console.log(`✅ ${test}: OK`);
                passed++;
            } else {
                console.log(`❌ ${test}: MISSING`);
            }
        });
        
        console.log(`Test result: ${passed}/${tests.length} passed`);
        
        // Восстановление исходных настроек
        localStorage.clear();
        Object.keys(currentSettings).forEach(key => {
            localStorage.setItem(key, currentSettings[key]);
        });
        
        return passed === tests.length;
    } catch (error) {
        console.error('Test failed:', error);
        return false;
    }
}
```

### 7.2 Валидация backup файлов

Создайте скрипт `validate-backup.js`:

```javascript
function validateBackup(backupData) {
    const validationRules = {
        requiredFields: ['timestamp', 'version', 'data'],
        requiredData: ['auto_response_settings'],
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 дней
    };
    
    const errors = [];
    
    // Проверка обязательных полей
    validationRules.requiredFields.forEach(field => {
        if (!backupData[field]) {
            errors.push(`Missing required field: ${field}`);
        }
    });
    
    // Проверка возраста backup
    if (backupData.timestamp) {
        const backupAge = Date.now() - new Date(backupData.timestamp).getTime();
        if (backupAge > validationRules.maxAge) {
            errors.push(`Backup is too old: ${Math.floor(backupAge / (24 * 60 * 60 * 1000))} days`);
        }
    }
    
    // Проверка критических данных
    validationRules.requiredData.forEach(key => {
        if (!backupData.data || !backupData.data[key]) {
            errors.push(`Missing critical data: ${key}`);
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Использование
const validation = validateBackup(backupData);
if (!validation.isValid) {
    console.error('Backup validation failed:', validation.errors);
} else {
    console.log('✅ Backup is valid');
}
```

## 8. Заключение

Регулярное резервное копирование настроек и данных системы является критически важным для обеспечения непрерывности работы. Следуйте рекомендациям данного руководства для создания надежной системы backup и восстановления.

### Основные принципы:

1. **Автоматизация** — настройте автоматическое создание backup
2. **Тестирование** — регулярно проверяйте возможность восстановления
3. **Множественность** — храните backup в нескольких местах
4. **Документирование** — ведите журнал операций backup/restore

---
*Последнее обновление: 2024*
*Версия руководства: 1.0*
