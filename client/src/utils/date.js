import dayjs from 'dayjs';

export const formatDate = (date) => dayjs(date).format('DD MMM YYYY');

export const formatDateTime = (date) => dayjs(date).format('DD MMM YYYY, h:mm A');

export const todayInputValue = () => dayjs().format('YYYY-MM-DD');

export const isValidDate = (date) => dayjs(date).isValid();

export const isPastDate = (date) => dayjs(date).startOf('day').isBefore(dayjs().startOf('day'));
