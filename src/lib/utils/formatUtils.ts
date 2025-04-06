
// Функция для форматирования времени в человекочитаемый вид
export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    if (days === 1) return 'вчера';
    if (days < 7) return `${days} ${getDaysText(days)}`;
    
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  if (hours > 0) return `${hours} ${getHoursText(hours)}`;
  if (minutes > 0) return `${minutes} ${getMinutesText(minutes)}`;
  
  return 'только что';
};

// Вспомогательные функции для склонения слов
export const getDaysText = (days: number): string => {
  if (days >= 5 && days <= 20) return 'дней';
  const remainder = days % 10;
  if (remainder === 1) return 'день';
  if (remainder >= 2 && remainder <= 4) return 'дня';
  return 'дней';
};

export const getHoursText = (hours: number): string => {
  if (hours >= 5 && hours <= 20) return 'часов';
  const remainder = hours % 10;
  if (remainder === 1) return 'час';
  if (remainder >= 2 && remainder <= 4) return 'часа';
  return 'часов';
};

export const getMinutesText = (minutes: number): string => {
  if (minutes >= 5 && minutes <= 20) return 'минут';
  const remainder = minutes % 10;
  if (remainder === 1) return 'минута';
  if (remainder >= 2 && remainder <= 4) return 'минуты';
  return 'минут';
};

// Форматирование цены
export const formatPrice = (price: number): string => {
  return (price / 100).toFixed(2);
};
