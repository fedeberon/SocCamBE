function formatDateFields(obj: any, keys: string[]) {
  for (const key of keys) {
    const value = obj[key];
    if (value && typeof value === 'string' && value.includes('+')) {
      const date = new Date(value);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const ms = date.getMilliseconds().toString().padStart(3, '0');

      obj[key] = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
                 `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${ms}`;
    }
  }
}
export default formatDateFields;