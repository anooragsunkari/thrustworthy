// Separate chunk, so English readers never download the Chinese dictionary.
export default async function zhLoader() {
  return (await import('../data/zh.json')).default;
}
